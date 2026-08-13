// Contratto neutro del provider di luoghi (POI).
//
// L'implementazione NON è accoppiata a un singolo servizio: qualunque fonte che, date coordinate e
// un raggio, restituisce luoghi tipizzati con la propria coordinata, soddisfa questa interfaccia.
// Nell'MVP: `FakePlacesProvider` (deterministico, per i test) e `OsmOverpassProvider` (reale).
//
// Il provider restituisce SOLO ciò che serve al calcolo lato server (coordinata del POI) e alla UI
// (nome, categoria, link fonte): niente payload grezzo trattenuto, niente indirizzo dell'immobile
// inviato al servizio (bastano le coordinate).

import type { GeoCoord } from "../geo";
import { haversineMeters } from "../geo";
import type { TerritoryPoiCategory } from "../categories";
import type { TerritoryProvider } from "../types";

/** Un luogo come lo restituisce un provider, prima della normalizzazione in TerritoryPoi. */
export interface ProviderPlace {
  /** ID stabile del provider, es. "node/240269970". */
  providerId: string;
  category: TerritoryPoiCategory;
  name: string;
  /** Coordinata del POI: serve SOLO lato server per la distanza. Mai esposta al client. */
  coord: GeoCoord;
  provider: TerritoryProvider;
  /** URL pubblico della fonte, se sicuro da mostrare. */
  sourceUrl?: string;
  /** Timestamp ISO del recupero. */
  retrievedAt: string;
}

export interface SearchNearbyInput {
  origin: GeoCoord;
  radiusMeters: number;
  categories: TerritoryPoiCategory[];
  /** Lingua preferita per i nomi (es. "it"). */
  language?: string;
  /** Limite massimo di risultati totali restituiti (soft cap anti-payload). */
  limit?: number;
  /** Segnale di annullamento del chiamante (job/CLI). */
  signal?: AbortSignal;
}

export interface TerritoryPlacesProvider {
  readonly name: TerritoryProvider;
  /** Testo di attribuzione obbligatorio da mostrare nella UI. */
  readonly attribution: string;
  /** Se false, `searchNearby` NON deve effettuare alcuna chiamata. */
  readonly enabled: boolean;
  searchNearby(input: SearchNearbyInput): Promise<ProviderPlace[]>;
}

// ─────────────────────────────────────────────────────────────
// Tipi d'errore consapevoli del rate-limit (il motore vi reagisce diversamente)
// ─────────────────────────────────────────────────────────────

export class ProviderError extends Error {
  constructor(
    message: string,
    readonly provider: TerritoryProvider,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

/** Il provider è disabilitato: nessuna chiamata deve partire. */
export class ProviderDisabledError extends ProviderError {
  constructor(provider: TerritoryProvider) {
    super(`Provider ${provider} disabilitato: nessuna chiamata effettuata.`, provider);
    this.name = "ProviderDisabledError";
  }
}

/** HTTP 429 / quota: il chiamante deve rallentare (constraint: rate-limit-aware). */
export class ProviderRateLimitError extends ProviderError {
  constructor(provider: TerritoryProvider, message = "rate limit") {
    super(`Provider ${provider}: ${message}`, provider);
    this.name = "ProviderRateLimitError";
  }
}

/** Timeout o annullamento della richiesta. */
export class ProviderTimeoutError extends ProviderError {
  constructor(provider: TerritoryProvider, message = "timeout") {
    super(`Provider ${provider}: ${message}`, provider);
    this.name = "ProviderTimeoutError";
  }
}

/** Risposta non valida (status inatteso o corpo che non supera la validazione). */
export class ProviderResponseError extends ProviderError {
  constructor(provider: TerritoryProvider, message: string) {
    super(`Provider ${provider}: ${message}`, provider);
    this.name = "ProviderResponseError";
  }
}

// ─────────────────────────────────────────────────────────────
// Helper puri riusabili da ogni adattatore
// ─────────────────────────────────────────────────────────────

/** Chiave di deduplica: stesso luogo mappato come nodo e come way non deve comparire due volte. */
function dedupeKey(place: ProviderPlace): string {
  const lat = place.coord.lat.toFixed(4);
  const lng = place.coord.lng.toFixed(4);
  return `${place.category}|${place.name.trim().toLowerCase()}|${lat},${lng}`;
}

/**
 * Deduplica per providerId e per (categoria+nome+coordinata arrotondata). Deterministico:
 * ordina prima per providerId così, a parità di chiave, vince sempre lo stesso elemento.
 */
export function dedupePlaces(places: ProviderPlace[]): ProviderPlace[] {
  const sorted = [...places].sort((a, b) => (a.providerId < b.providerId ? -1 : a.providerId > b.providerId ? 1 : 0));
  const seenId = new Set<string>();
  const seenKey = new Set<string>();
  const out: ProviderPlace[] = [];
  for (const place of sorted) {
    if (seenId.has(place.providerId)) continue;
    const key = dedupeKey(place);
    if (seenKey.has(key)) continue;
    seenId.add(place.providerId);
    seenKey.add(key);
    out.push(place);
  }
  return out;
}

/** Tiene solo i luoghi entro `radiusMeters` dall'origine (in linea d'aria). */
export function filterWithinRadius(
  places: ProviderPlace[],
  origin: GeoCoord,
  radiusMeters: number,
): ProviderPlace[] {
  return places.filter((p) => haversineMeters(origin, p.coord) <= radiusMeters);
}

/** Ordina per distanza crescente dall'origine, poi per providerId (spareggio deterministico). */
export function sortByDistance(places: ProviderPlace[], origin: GeoCoord): ProviderPlace[] {
  return [...places].sort((a, b) => {
    const da = haversineMeters(origin, a.coord);
    const db = haversineMeters(origin, b.coord);
    if (da !== db) return da - db;
    return a.providerId < b.providerId ? -1 : a.providerId > b.providerId ? 1 : 0;
  });
}
