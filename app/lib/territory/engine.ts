// Motore di arricchimento DETERMINISTICO di un singolo immobile.
//
// Puro nella logica, con tutte le dipendenze iniettate (provider, repository, orologio, config,
// risolutore d'origine): dati gli stessi ingressi produce sempre lo stesso record. Non modifica MAI
// l'immobile RealSmart né la sua descrizione (constraint 2, 13): legge e basta.
//
// Sequenza (ADR-001 / Prompt 5):
//   1. codice RealSmart presente;      2. origine (coordinate) risolvibile;
//   3. comune abilitato al pilota;     4. fingerprint;
//   5. skip se approvato+fresco+impronta invariata (nessuna chiamata);
//   6. query alle sole 5 categorie;    7. distanza Haversine locale + scarto fuori raggio;
//   8. dedup+rank deterministico;      9. max 2 per categoria;
//  10. salva come DRAFT;              11. preserva l'ultimo pubblico approvato;
//  12. su errore: conserva l'approvato e registra un fallimento sanificato.

import type { NormalizedProperty } from "../realsmart/types";
import { haversineMeters } from "./geo";
import { buildFingerprint, fingerprintsEqual } from "./fingerprint";
import {
  isRecordFresh,
  sortAndLimitPois,
  toPublicListingTerritory,
} from "./public";
import type {
  ListingTerritoryEnrichment,
  TerritoryPoi,
  PublicListingTerritory,
  EnrichmentFailure,
  EnrichmentFailureKind,
  EnrichmentFingerprint,
  TerritoryProvider,
} from "./types";
import {
  ProviderDisabledError,
  ProviderError,
  ProviderRateLimitError,
  ProviderResponseError,
  ProviderTimeoutError,
  type ProviderPlace,
  type TerritoryPlacesProvider,
} from "./provider/provider";
import type { TerritoryRepository } from "./store/repository";
import type { EnrichmentConfig } from "./config";
import { resolveMunicipalityOrigin, type ResolvedOrigin } from "./origin";

export interface EnrichmentDeps {
  provider: TerritoryPlacesProvider;
  repository: TerritoryRepository;
  /** Orologio iniettato: il motore non chiama mai Date.now() direttamente. */
  now: () => Date;
  config: EnrichmentConfig;
  /** Risolutore d'origine (default: centroide comune). */
  resolveOrigin?: (property: NormalizedProperty) => ResolvedOrigin | null;
}

export type EnrichmentOutcome =
  | { action: "skipped-missing-code" }
  | { action: "skipped-missing-coordinates"; realSmartCode: string }
  | { action: "skipped-disabled-municipality"; realSmartCode: string; municipality: string }
  | { action: "skipped-unchanged"; realSmartCode: string; record: ListingTerritoryEnrichment }
  | { action: "enriched"; realSmartCode: string; record: ListingTerritoryEnrichment }
  | {
      action: "failed";
      realSmartCode: string;
      failure: EnrichmentFailure;
      preservedApproved: boolean;
    };

/** Classifica un errore del provider in un tipo di fallimento sanificato. */
function classifyFailure(err: unknown): EnrichmentFailureKind {
  if (err instanceof ProviderRateLimitError) return "rate-limit";
  if (err instanceof ProviderTimeoutError) return "timeout";
  if (err instanceof ProviderResponseError) return "invalid-response";
  if (err instanceof ProviderDisabledError) return "disabled";
  return "unknown";
}

/** Fallimento sanificato: messaggio corto, senza segreti né coordinate. */
function failureFrom(err: unknown, providerName: TerritoryProvider, now: Date): EnrichmentFailure {
  const message = err instanceof Error ? err.message : String(err);
  return {
    at: now.toISOString(),
    kind: classifyFailure(err),
    reason: message.slice(0, 200),
    provider: err instanceof ProviderError ? err.provider : providerName,
  };
}

/** Costruisce un TerritoryPoi (bozza) da un ProviderPlace, con distanza in linea d'aria. */
function toPoi(place: ProviderPlace, origin: ResolvedOrigin, attribution: string): TerritoryPoi {
  return {
    providerId: place.providerId,
    category: place.category,
    name: place.name,
    distanceMeters: haversineMeters(origin.coord, place.coord),
    distanceMethod: "straight-line",
    source: {
      provider: place.provider,
      retrievedAt: place.retrievedAt,
      attribution,
      ...(place.sourceUrl ? { sourceUrl: place.sourceUrl } : {}),
    },
    approval: { state: "draft" },
    coord: place.coord, // server-side: mai proiettato nel pubblico
  };
}

/**
 * Ricava lo snapshot pubblico approvato da preservare: prima quello già memorizzato, poi — se il
 * record esistente è approvato e ancora pubblicabile — la sua proiezione pubblica. `undefined` se
 * non c'è nulla di approvato da conservare.
 */
function preservedApproved(
  existing: ListingTerritoryEnrichment | null,
  now: Date,
  config: EnrichmentConfig,
): PublicListingTerritory | undefined {
  if (!existing) return undefined;
  if (existing.lastApprovedPublic) return existing.lastApprovedPublic;
  if (existing.status === "approved") {
    return (
      toPublicListingTerritory(existing, {
        now,
        freshnessDays: config.freshnessDays,
        maxPerCategory: config.maxPerCategory,
      }) ?? undefined
    );
  }
  return undefined;
}

/**
 * DECISIONE di arricchimento (passi 1–5), senza alcuna chiamata al provider né scrittura.
 * È la fonte UNICA usata sia dal motore sia dal planner del sync (Prompt 7): il criterio di skip
 * non può divergere fra "cosa farebbe" e "cosa fa".
 */
export type EnrichmentDecision =
  | { kind: "missing-code" }
  | { kind: "missing-coordinates"; realSmartCode: string }
  | { kind: "disabled-municipality"; realSmartCode: string; municipality: string }
  | { kind: "skip-unchanged"; realSmartCode: string; origin: ResolvedOrigin; fingerprint: EnrichmentFingerprint }
  | { kind: "enrich"; realSmartCode: string; origin: ResolvedOrigin; fingerprint: EnrichmentFingerprint };

export function decideEnrichment(
  property: NormalizedProperty,
  existing: ListingTerritoryEnrichment | null,
  config: EnrichmentConfig,
  now: Date,
  resolveOrigin: (p: NormalizedProperty) => ResolvedOrigin | null = resolveMunicipalityOrigin,
): EnrichmentDecision {
  // 1) Codice RealSmart.
  const realSmartCode = property.sourceRef?.codice?.trim() ?? "";
  if (realSmartCode.length === 0) return { kind: "missing-code" };

  // 2) Origine (coordinate) risolvibile.
  const origin = resolveOrigin(property);
  if (!origin) return { kind: "missing-coordinates", realSmartCode };

  // 3) Comune abilitato al pilota.
  if (!config.enabledMunicipalities.includes(origin.municipality)) {
    return { kind: "disabled-municipality", realSmartCode, municipality: origin.municipality };
  }

  // 4) Fingerprint.
  const fingerprint = buildFingerprint({
    municipality: origin.municipality,
    origin: origin.coord,
    ultimaModifica: property.updatedAt ?? "",
    schemaVersion: config.schemaVersion,
    roundDp: config.roundDp,
  });

  // 5) Skip: impronta invariata + schema corrente + dato approvato ancora fresco → nessuna chiamata.
  if (
    existing &&
    fingerprintsEqual(existing.fingerprint, fingerprint) &&
    existing.schemaVersion === config.schemaVersion &&
    existing.status === "approved" &&
    isRecordFresh(existing, now, config.freshnessDays)
  ) {
    return { kind: "skip-unchanged", realSmartCode, origin, fingerprint };
  }

  return { kind: "enrich", realSmartCode, origin, fingerprint };
}

/**
 * Arricchisce un singolo immobile. Non lancia per i casi previsti: ritorna un outcome tipizzato che
 * il chiamante (CLI di sync, Prompt 7) aggrega nel report.
 */
export async function enrichListing(
  property: NormalizedProperty,
  deps: EnrichmentDeps,
): Promise<EnrichmentOutcome> {
  const { provider, repository, config } = deps;
  const now = deps.now;
  const resolveOrigin = deps.resolveOrigin ?? resolveMunicipalityOrigin;

  const realSmartCode = property.sourceRef?.codice?.trim() ?? "";
  if (realSmartCode.length === 0) return { action: "skipped-missing-code" };

  const existing = await repository.getListingEnrichment(realSmartCode);
  const nowDate = now();
  const decision = decideEnrichment(property, existing, config, nowDate, resolveOrigin);

  switch (decision.kind) {
    case "missing-code":
      return { action: "skipped-missing-code" };
    case "missing-coordinates":
      return { action: "skipped-missing-coordinates", realSmartCode };
    case "disabled-municipality":
      return { action: "skipped-disabled-municipality", realSmartCode, municipality: decision.municipality };
    case "skip-unchanged":
      return { action: "skipped-unchanged", realSmartCode, record: existing as ListingTerritoryEnrichment };
    case "enrich":
      break;
  }

  const origin = decision.origin;
  const fingerprint = decision.fingerprint;

  // Snapshot pubblico approvato da preservare in ogni esito (constraint 11/12).
  const lastApprovedPublic = preservedApproved(existing, nowDate, config);

  // 6) Query alle sole 5 categorie.
  let places: ProviderPlace[];
  try {
    places = await provider.searchNearby({
      origin: origin.coord,
      radiusMeters: config.searchRadiusMeters,
      categories: config.categories,
      language: "it",
    });
  } catch (err) {
    // 12) Fallimento: conserva l'approvato, registra un fallimento sanificato.
    const failure = failureFrom(err, provider.name, nowDate);
    if (existing) {
      await repository.recordFailure(realSmartCode, failure);
    } else {
      const iso = nowDate.toISOString();
      await repository.putListingEnrichment({
        schemaVersion: config.schemaVersion,
        realSmartCode,
        municipality: origin.municipality,
        coordSource: origin.coordSource,
        origin: origin.coord,
        fingerprint,
        status: "failed",
        pois: [],
        retrievedAt: iso,
        updatedAt: iso,
        failure,
      });
    }
    return { action: "failed", realSmartCode, failure, preservedApproved: lastApprovedPublic !== undefined };
  }

  // 7) Distanza locale + scarto fuori raggio (difensivo: il provider filtra già).
  const withinRadius = places.filter(
    (p) => haversineMeters(origin.coord, p.coord) <= config.searchRadiusMeters,
  );

  // 8+9) Rank deterministico e max 2 per categoria.
  const pois = sortAndLimitPois(
    withinRadius.map((p) => toPoi(p, origin, provider.attribution)),
    config.maxPerCategory,
  );

  // 10+11) Salva come draft, preservando l'ultimo pubblico approvato.
  const iso = nowDate.toISOString();
  const record: ListingTerritoryEnrichment = {
    schemaVersion: config.schemaVersion,
    realSmartCode,
    municipality: origin.municipality,
    coordSource: origin.coordSource,
    origin: origin.coord,
    fingerprint,
    status: "draft",
    pois,
    retrievedAt: iso,
    updatedAt: iso,
    ...(lastApprovedPublic ? { lastApprovedPublic } : {}),
  };

  await repository.putListingEnrichment(record);
  return { action: "enriched", realSmartCode, record };
}
