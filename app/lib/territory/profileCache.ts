// Cache di QUERY per ORIGINE (Prompt 5): una sola chiamata al provider per profilo.
//
// Il MunicipalityTerritoryProfile diventa un'entità di cache di prima classe, keyed sul fingerprint
// dell'origine (coordinata + raggio + categorie + provider + schema). N immobili sullo stesso
// centroide condividono lo stesso profilo → UNA sola query, non N. La cache è a due livelli:
//   • DURATURA: il profilo è persistito nello store; un secondo immobile lo rilegge (cache hit);
//   • CONCORRENTE: un `single-flight` per-run evita che due immobili sullo stesso profilo lancino
//     due query in parallelo prima che il profilo sia scritto (constraint 9).
// Su errore del provider si conserva l'ultimo profilo buono (stale) — mai un buco.

import { buildFingerprint, fingerprintsEqual } from "./fingerprint";
import { haversineMeters } from "./geo";
import { isFresh, sortAndLimitPois } from "./public";
import { originFields, type ResolvedOrigin } from "./origin";
import { nextRetryState } from "./retry";
import type { EnrichmentConfig } from "./config";
import {
  ProviderAllEndpointsDownError,
  ProviderDisabledError,
  ProviderError,
  ProviderNetworkError,
  ProviderPayloadTooLargeError,
  ProviderRateLimitError,
  ProviderResponseError,
  ProviderSchemaError,
  ProviderTimeoutError,
  evidenceToString,
  type ProviderPlace,
  type TerritoryPlacesProvider,
} from "./provider/provider";
import type { ObservabilitySink } from "./observe";
import type { TerritoryRepository } from "./store/repository";
import type {
  EnrichmentFailure,
  EnrichmentFailureKind,
  EnrichmentFingerprint,
  MunicipalityTerritoryProfile,
  TerritoryPoi,
  TerritoryProvider,
} from "./types";

/** Classifica un errore del provider in un tipo di fallimento sanificato. */
function classifyFailureKind(err: unknown): EnrichmentFailureKind {
  if (err instanceof ProviderRateLimitError) return "rate-limit";
  if (err instanceof ProviderTimeoutError) return "timeout";
  if (err instanceof ProviderNetworkError || err instanceof ProviderAllEndpointsDownError) return "network";
  if (err instanceof ProviderResponseError || err instanceof ProviderSchemaError || err instanceof ProviderPayloadTooLargeError)
    return "invalid-response";
  if (err instanceof ProviderDisabledError) return "disabled";
  return "unknown";
}

/** Fallimento sanificato per il profilo: messaggio corto, senza segreti né coordinate. */
function profileFailure(err: unknown, providerName: TerritoryProvider, now: Date): EnrichmentFailure {
  const message = err instanceof Error ? err.message : String(err);
  return {
    at: now.toISOString(),
    kind: classifyFailureKind(err),
    reason: message.slice(0, 200),
    provider: err instanceof ProviderError ? err.provider : providerName,
  };
}

/** Retry-After (ms) da un errore rate-limit, se disponibile. */
function retryAfterMsOf(err: unknown): number | undefined {
  if (err instanceof ProviderRateLimitError && typeof err.retryAfterSeconds === "number") {
    return err.retryAfterSeconds * 1000;
  }
  return undefined;
}

/** Esito della risoluzione di un profilo, con la provenienza (per metriche e conteggio budget). */
export type ProfileCacheSource = "hit" | "refreshed" | "stale" | "unavailable" | "budget-skipped";

export interface ProfileResult {
  profile: MunicipalityTerritoryProfile | null;
  source: ProfileCacheSource;
  /** true se questa risoluzione ha eseguito UNA query al provider (per il conteggio budget/metriche). */
  queried: boolean;
  fingerprint: EnrichmentFingerprint;
  /** Errore del provider (solo su stale/unavailable): il chiamante lo classifica in un fallimento. */
  error?: unknown;
}

export interface ProfileRefresherDeps {
  provider: TerritoryPlacesProvider;
  repository: TerritoryRepository;
  config: EnrichmentConfig;
  now: () => Date;
  /** Tetto di query al provider per questo refresher. null = nessun tetto. */
  maxQueries?: number | null;
  /** Callback chiamato UNA volta per ogni query reale (per le metriche providerCalls). */
  onQuery?: () => void;
  /** Callback per la provenienza di ogni risoluzione (hit/refreshed/stale/…). */
  onResult?: (source: ProfileCacheSource) => void;
  /** Generatore casuale per il jitter del backoff (iniettabile per test deterministici). */
  random?: () => number;
  /**
   * Sink di osservabilità (Prompt 14, cablato qui): riceve provider-call (con latenza), profile-cache
   * e record-status. Sempre `guarded` a monte: nessuna coordinata può entrare in un evento.
   */
  sink?: ObservabilitySink;
  /** ID di correlazione del run, per legare gli eventi di uno stesso sync. */
  runId?: string;
  /**
   * Gate di BUDGET: chiamato PRIMA di ogni nuova query al provider. `false` = budget mensile esaurito
   * o kill switch → si tratta come budget-skipped (il dato approvato resta servito, nulla sparisce).
   */
  allowProviderCall?: () => boolean;
}

/** Costruisce un TerritoryPoi (bozza) da un ProviderPlace, con distanza in linea d'aria dall'origine. */
function placeToPoi(place: ProviderPlace, origin: ResolvedOrigin, attribution: string): TerritoryPoi {
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
      evidence: evidenceToString(place.evidence),
    },
    approval: { state: "draft" },
    coord: place.coord, // server-side: mai proiettato nel pubblico
  };
}

/**
 * Coordinatore di refresh dei profili, con vita = un run. Tiene il single-flight per-chiave, il
 * contatore di query e il budget. Usarne UNO per run (o per chiamata standalone del motore).
 */
export class ProfileRefresher {
  private readonly inFlight = new Map<string, Promise<ProfileResult>>();
  private queriesMade = 0;

  constructor(private readonly deps: ProfileRefresherDeps) {}

  /** Quante query al provider sono state eseguite finora da questo refresher. */
  queries(): number {
    return this.queriesMade;
  }

  /** Fingerprint dell'origine per la configurazione attiva (usato anche dal motore per lo skip). */
  fingerprintFor(origin: ResolvedOrigin): EnrichmentFingerprint {
    const { config, provider } = this.deps;
    return buildFingerprint({
      municipality: origin.municipality,
      origin: origin.coord,
      radiusMeters: config.searchRadiusMeters,
      categories: config.categories,
      provider: provider.name,
      schemaVersion: config.schemaVersion,
      roundDp: config.roundDp,
    });
  }

  /**
   * Risolve il profilo per un'origine: cache hit (nessuna query), oppure refresh (una query, con
   * single-flight e budget). Su errore conserva l'ultimo profilo buono (stale) o segnala unavailable.
   */
  /** Emette un evento di cache e lo notifica al callback delle metriche. */
  private noteResult(source: ProfileCacheSource, municipality: string): void {
    this.deps.onResult?.(source);
    this.deps.sink?.emit({
      kind: "profile-cache",
      result: source,
      municipality,
      ...(this.deps.runId ? { runId: this.deps.runId } : {}),
    });
  }

  async resolve(origin: ResolvedOrigin): Promise<ProfileResult> {
    const { repository, config, now, maxQueries, allowProviderCall } = this.deps;
    const key = origin.municipality;
    const fingerprint = this.fingerprintFor(origin);
    const existing = await repository.getMunicipalityProfile(key);

    // Cache HIT: impronta invariata + fresco + non fallito → nessuna query.
    if (
      existing &&
      fingerprintsEqual(existing.fingerprint, fingerprint) &&
      existing.status !== "failed" &&
      isFresh(existing.retrievedAt, now(), config.freshnessDays, existing.expiresAt)
    ) {
      this.noteResult("hit", key);
      return { profile: existing, source: "hit", queried: false, fingerprint };
    }

    // SINGLE-FLIGHT: se un refresh per questa chiave è già in corso, aspettalo (niente doppia query).
    const pending = this.inFlight.get(key);
    if (pending) {
      const r = await pending;
      this.noteResult(r.source, key);
      return { ...r, queried: false }; // la query l'ha contata chi l'ha davvero eseguita
    }

    // Budget: una NUOVA query solo se il tetto DEL RUN lo consente…
    if (maxQueries != null && this.queriesMade >= maxQueries) {
      this.noteResult("budget-skipped", key);
      return { profile: existing ?? null, source: "budget-skipped", queried: false, fingerprint };
    }

    // …e solo se il BUDGET MENSILE / kill switch lo consente (Prompt 14, cablato qui). Il dato già
    // approvato resta servito: si salta la nuova chiamata, non si cancella nulla.
    if (allowProviderCall && !allowProviderCall()) {
      this.noteResult("budget-skipped", key);
      return { profile: existing ?? null, source: "budget-skipped", queried: false, fingerprint };
    }

    const promise = this.doRefresh(origin, fingerprint, existing);
    this.inFlight.set(key, promise);
    try {
      return await promise;
    } finally {
      this.inFlight.delete(key);
    }
  }

  private async doRefresh(
    origin: ResolvedOrigin,
    fingerprint: EnrichmentFingerprint,
    existing: MunicipalityTerritoryProfile | null,
  ): Promise<ProfileResult> {
    const { provider, repository, config, now, onQuery } = this.deps;
    this.queriesMade += 1;
    onQuery?.();
    const nowIso = now().toISOString();
    // Latenza misurata attorno alla SOLA chiamata al provider (per l'evento provider-call).
    const startedAt = now().getTime();
    try {
      const places = await provider.searchNearby({
        origin: origin.coord,
        radiusMeters: config.searchRadiusMeters,
        categories: config.categories,
        language: "it",
      });
      this.emitProviderCall(provider.name, "ok", origin.municipality, now().getTime() - startedAt);
      const withinRadius = places.filter(
        (p) => haversineMeters(origin.coord, p.coord) <= config.searchRadiusMeters,
      );
      const pois = sortAndLimitPois(
        withinRadius.map((p) => placeToPoi(p, origin, provider.attribution)),
        config.maxPerCategory,
      );
      const profile: MunicipalityTerritoryProfile = {
        schemaVersion: config.schemaVersion,
        municipality: origin.municipality,
        ...originFields(origin),
        fingerprint,
        status: "draft",
        pois,
        retrievedAt: nowIso,
        // Successo: azzera lo stato di retry (constraint 5).
        attempts: 0,
        lastAttemptAt: nowIso,
        deadLettered: false,
        updatedAt: nowIso,
      };
      await repository.putMunicipalityProfile(profile);
      this.noteResult("refreshed", origin.municipality);
      this.deps.sink?.emit({ kind: "record-status", status: "draft", municipality: origin.municipality });
      return { profile, source: "refreshed", queried: true, fingerprint };
    } catch (err) {
      // Errore provider: registra lo stato di RETRY sul profilo (attempts/backoff/dead-letter) e
      // conserva l'ultimo profilo buono (stale) o segnala unavailable. Mai un buco, mai un'eccezione.
      const nowDate = now();
      this.emitProviderCall(
        provider.name,
        "failed",
        origin.municipality,
        nowDate.getTime() - startedAt,
        classifyFailureKind(err),
      );
      const retry = nextRetryState(existing?.attempts ?? 0, nowDate, {
        random: this.deps.random,
        retryAfterMs: retryAfterMsOf(err),
      });
      const failure = profileFailure(err, provider.name, nowDate);
      const failedProfile: MunicipalityTerritoryProfile = {
        schemaVersion: config.schemaVersion,
        municipality: origin.municipality,
        ...originFields(origin),
        fingerprint,
        status: "failed",
        pois: existing?.pois ?? [],
        retrievedAt: existing?.retrievedAt ?? nowIso,
        attempts: retry.attempts,
        lastAttemptAt: nowIso,
        ...(retry.nextAttemptAt ? { nextAttemptAt: retry.nextAttemptAt } : {}),
        deadLettered: retry.deadLettered,
        failure,
        updatedAt: nowIso,
      };
      await repository.putMunicipalityProfile(failedProfile);
      if (existing) {
        this.noteResult("stale", origin.municipality);
        return { profile: existing, source: "stale", queried: true, fingerprint, error: err };
      }
      this.noteResult("unavailable", origin.municipality);
      return { profile: null, source: "unavailable", queried: true, fingerprint, error: err };
    }
  }

  /** Emette l'evento di chiamata al provider (latenza + esito). Mai coordinate: solo comune/enum. */
  private emitProviderCall(
    provider: TerritoryProvider,
    outcome: "ok" | "failed",
    municipality: string,
    latencyMs: number,
    failure?: EnrichmentFailureKind,
  ): void {
    this.deps.sink?.emit({
      kind: "provider-call",
      provider,
      outcome,
      latencyMs: Math.max(0, Math.round(latencyMs)),
      municipality,
      ...(failure ? { failure } : {}),
      ...(this.deps.runId ? { runId: this.deps.runId } : {}),
    });
  }
}
