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

/**
 * Evidenza ESATTA usata per classificare un luogo: la coppia tag chiave/valore che ha deciso la
 * categoria (es. `railway=station`). Constraint 2/«ogni categoria ha tag/evidenza espliciti»: nessun
 * POI entra senza un'evidenza di provenienza verificabile. Resta lato server (non è PII, ma non serve
 * al pubblico): documenta PERCHÉ quel luogo è in quella categoria.
 */
export interface TagEvidence {
  key: string;
  value: string;
}

/** Rende l'evidenza in forma compatta e stabile per la provenienza (`chiave=valore`). */
export function evidenceToString(e: TagEvidence): string {
  return `${e.key}=${e.value}`;
}

/** Un luogo come lo restituisce un provider, prima della normalizzazione in TerritoryPoi. */
export interface ProviderPlace {
  /** ID stabile del provider, es. "node/240269970". */
  providerId: string;
  category: TerritoryPoiCategory;
  name: string;
  /** Coordinata del POI: serve SOLO lato server per la distanza. Mai esposta al client. */
  coord: GeoCoord;
  provider: TerritoryProvider;
  /** Tag che ha classificato il luogo: provenienza esplicita, mai inventata. */
  evidence: TagEvidence;
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
  /** Secondi indicati dal provider (header Retry-After), se presenti: onorati dal backoff. */
  readonly retryAfterSeconds?: number;
  constructor(provider: TerritoryProvider, message = "rate limit", retryAfterSeconds?: number) {
    super(`Provider ${provider}: ${message}`, provider);
    this.name = "ProviderRateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/** Timeout o annullamento della richiesta. */
export class ProviderTimeoutError extends ProviderError {
  constructor(provider: TerritoryProvider, message = "timeout") {
    super(`Provider ${provider}: ${message}`, provider);
    this.name = "ProviderTimeoutError";
  }
}

/**
 * Errore DNS/rete/connessione (host irraggiungibile, connessione rifiutata, TLS): distinto dal
 * timeout perché la causa è diversa, ma parimenti TRANSITORIO → ri-provabile e penalizza l'endpoint.
 */
export class ProviderNetworkError extends ProviderError {
  constructor(provider: TerritoryProvider, message = "errore di rete") {
    super(`Provider ${provider}: ${message}`, provider);
    this.name = "ProviderNetworkError";
  }
}

/** Risposta non valida a livello HTTP (status inatteso 4xx di configurazione). NON transitorio. */
export class ProviderResponseError extends ProviderError {
  constructor(provider: TerritoryProvider, message: string) {
    super(`Provider ${provider}: ${message}`, provider);
    this.name = "ProviderResponseError";
  }
}

/** Il corpo non rispetta lo schema atteso (JSON valido ma struttura sbagliata). NON transitorio. */
export class ProviderSchemaError extends ProviderError {
  constructor(provider: TerritoryProvider, message: string) {
    super(`Provider ${provider}: schema inatteso — ${message}`, provider);
    this.name = "ProviderSchemaError";
  }
}

/**
 * Risposta oltre i limiti di sicurezza (byte o numero di elementi): si RIFIUTA in blocco invece di
 * trattenere un payload potenzialmente ostile/gigante (acceptance: «oversized bounded safely»).
 */
export class ProviderPayloadTooLargeError extends ProviderError {
  constructor(provider: TerritoryProvider, message: string) {
    super(`Provider ${provider}: risposta oltre i limiti — ${message}`, provider);
    this.name = "ProviderPayloadTooLargeError";
  }
}

/** Tutti gli endpoint approvati hanno il circuito aperto: non si spara traffico, si aspetta. */
export class ProviderAllEndpointsDownError extends ProviderError {
  constructor(provider: TerritoryProvider, message = "tutti gli endpoint sono in circuito aperto") {
    super(`Provider ${provider}: ${message}`, provider);
    this.name = "ProviderAllEndpointsDownError";
  }
}

/**
 * Un errore è TRANSITORIO (ri-provabile e conta contro la salute dell'endpoint) se è rate-limit,
 * timeout, rete o «tutti gli endpoint giù». Gli errori di configurazione (4xx), schema e payload
 * troppo grande NON sono transitori: riprovare non aiuta.
 */
export function isTransientProviderError(err: unknown): boolean {
  return (
    err instanceof ProviderRateLimitError ||
    err instanceof ProviderTimeoutError ||
    err instanceof ProviderNetworkError ||
    err instanceof ProviderAllEndpointsDownError
  );
}

// ─────────────────────────────────────────────────────────────
// Normalizzazione SICURA dei nomi (constraint 7: difesa da controlli, HTML, prompt injection)
// ─────────────────────────────────────────────────────────────

/** Marcatori tipici di prompt-injection/istruzioni: un nome che li contiene è dato ostile → scartato. */
const INJECTION_MARKERS =
  /\b(ignore (all|previous|above)|disregard (all|previous)|system prompt|assistant:|you are now|act as|jailbreak)\b/i;

/**
 * Ripulisce e VALIDA un nome fornito da un provider esterno. Ritorna il nome sicuro, oppure `null` se
 * va scartato. Difende da: caratteri di controllo, tag/entità HTML, spazi anomali, marcatori di
 * prompt-injection. Non «corregge» silenziosamente contenuti sospetti: nel dubbio, scarta.
 */
export function normalizeProviderName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;

  // Via i caratteri di controllo C0/C1 e gli invisibili Unicode (zero-width, bidi, BOM).
  const hasControl = /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028\u2029\u202a-\u202e\ufeff]/.test(raw);
  if (hasControl) return null;

  // Nessun markup: se contiene un tag o un'entità HTML, è sospetto (non è un toponimo legittimo).
  if (/<[^>]*>/.test(raw) || /&(#\d+|#x[0-9a-f]+|[a-z]+);/i.test(raw)) return null;

  // Nessun marcatore di prompt-injection.
  if (INJECTION_MARKERS.test(raw)) return null;

  // Collassa gli spazi e taglia i bordi.
  const cleaned = raw.replace(/\s+/g, " ").trim();
  if (cleaned.length === 0) return null;

  // Lunghezza plausibile per un toponimo (evita blob incollati).
  if (cleaned.length > 120) return null;

  // Deve contenere almeno una lettera/numero (no stringhe di soli simboli).
  if (!/[\p{L}\p{N}]/u.test(cleaned)) return null;

  return cleaned;
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
