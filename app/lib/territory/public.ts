// Conversione PRIVATO → PUBBLICO: l'unico punto in cui un record di arricchimento diventa
// visibile a sito e chatbot. Deterministica e conservativa:
//
//  • solo record `approved` e ancora FRESCHI (constraint 14: niente dati stale/non approvati);
//  • solo POI con approvazione `approved` (constraint 6);
//  • al massimo `maxPerCategory` (=2) per categoria, solo le cinque categorie note;
//  • ordinamento stabile → stesso input, stesso output byte-per-byte;
//  • nessuna coordinata, nessun ID interno, nessun payload grezzo nel risultato.
//
// Se non resta nulla di pubblicabile ritorna `null`: la sezione si nasconde per intero.

import { TERRITORY_POI_CATEGORIES } from "./categories";
import type {
  ListingTerritoryEnrichment,
  PublicListingTerritory,
  PublicTerritoryPoi,
  TerritoryPoi,
} from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface PublicConversionOptions {
  /** Orologio iniettato (dipendenza esplicita): la conversione non legge mai Date.now(). */
  now: Date;
  /** Finestra di freschezza in giorni. Oltre, il record è stale e non si pubblica. */
  freshnessDays: number;
  /** Massimo POI per categoria (default 2). */
  maxPerCategory?: number;
}

/** Ordinamento totale e stabile: distanza crescente, poi nome, poi providerId (spareggio finale). */
function comparePoi(a: TerritoryPoi, b: TerritoryPoi): number {
  if (a.distanceMeters !== b.distanceMeters) return a.distanceMeters - b.distanceMeters;
  if (a.name !== b.name) return a.name < b.name ? -1 : 1;
  if (a.providerId !== b.providerId) return a.providerId < b.providerId ? -1 : 1;
  return 0;
}

/**
 * Raggruppa per categoria (nell'ordine canonico delle cinque), ordina ogni gruppo e taglia a
 * `maxPerCategory`. I POI di categorie ignote vengono scartati: la mappa contiene solo le cinque.
 */
export function sortAndLimitPois(pois: TerritoryPoi[], maxPerCategory = 2): TerritoryPoi[] {
  const byCategory = new Map<string, TerritoryPoi[]>();
  for (const category of TERRITORY_POI_CATEGORIES) byCategory.set(category, []);
  for (const poi of pois) byCategory.get(poi.category)?.push(poi);

  const out: TerritoryPoi[] = [];
  for (const category of TERRITORY_POI_CATEGORIES) {
    const group = byCategory.get(category)!.slice().sort(comparePoi).slice(0, maxPerCategory);
    out.push(...group);
  }
  return out;
}

/** true se un istante ISO è entro la finestra di freschezza (e non scaduto via expiresAt). */
export function isFresh(
  retrievedAt: string,
  now: Date,
  freshnessDays: number,
  expiresAt?: string,
): boolean {
  const retrieved = Date.parse(retrievedAt);
  if (Number.isNaN(retrieved)) return false;
  if (expiresAt) {
    const exp = Date.parse(expiresAt);
    if (!Number.isNaN(exp) && now.getTime() > exp) return false;
  }
  const ageMs = now.getTime() - retrieved;
  return ageMs >= 0 && ageMs <= freshnessDays * DAY_MS;
}

/** true se l'intero record è ancora pubblicabile (approvato e fresco). */
export function isRecordFresh(
  record: Pick<ListingTerritoryEnrichment, "retrievedAt" | "expiresAt">,
  now: Date,
  freshnessDays: number,
): boolean {
  return isFresh(record.retrievedAt, now, freshnessDays, record.expiresAt);
}

/** Proietta un POI privato nella sua forma pubblica (nessuna coordinata, nessun ID interno). */
function toPublicPoi(poi: TerritoryPoi): PublicTerritoryPoi {
  return {
    category: poi.category,
    name: poi.name,
    distanceMeters: poi.distanceMeters,
    distanceMethod: poi.distanceMethod,
    provider: poi.source.provider,
    attribution: poi.source.attribution,
    ...(poi.source.sourceUrl ? { sourceUrl: poi.source.sourceUrl } : {}),
  };
}

/**
 * Converte un record privato nella vista pubblica sicura, oppure `null` se non c'è nulla da
 * mostrare. Ordine dei controlli: stato → freschezza → POI approvati/validi → limite per categoria.
 */
export function toPublicListingTerritory(
  record: ListingTerritoryEnrichment,
  options: PublicConversionOptions,
): PublicListingTerritory | null {
  // 1) Solo record esplicitamente approvati. draft/stale/failed/disabled → nulla.
  if (record.status !== "approved") return null;

  // 2) Freschezza calcolata al momento della conversione (deterministica dato `now`).
  if (!isRecordFresh(record, options.now, options.freshnessDays)) return null;

  // 3) Solo POI approvati e strutturalmente sani (nome non vuoto, distanza non negativa).
  const approved = record.pois.filter(
    (p) => p.approval.state === "approved" && p.name.trim().length > 0 && p.distanceMeters >= 0,
  );

  // 4) Ordina e taglia a 2 per categoria (solo le cinque categorie note).
  const limited = sortAndLimitPois(approved, options.maxPerCategory ?? 2);
  if (limited.length === 0) return null;

  return {
    realSmartCode: record.realSmartCode,
    municipality: record.municipality,
    method: "straight-line",
    // Base dell'origine SENZA coordinate: precisione + etichetta leggibile. È l'unica fonte da cui
    // pagina e chatbot derivano la frase "distanze da …": impossibile spacciare un centroide per casa.
    originBasis: { precision: record.originPrecision, label: record.originLabel },
    retrievedAt: record.retrievedAt,
    pois: limited.map(toPublicPoi),
  };
}
