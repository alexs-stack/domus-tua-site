// Provider REALE: OpenStreetMap via Overpass API — indurito (Prompt 11).
//
// Contratto verificato sulla documentazione ufficiale (wiki.openstreetmap.org/wiki/Overpass_API):
//  • endpoint POST /api/interpreter, query nel corpo come `data=<QL>`, Content-Type
//    application/x-www-form-urlencoded; risposta [out:json] con `elements[]`; ogni elemento ha
//    type/id, lat/lon (nodi) o center {lat,lon} (way/relation con `out center`), e `tags`;
//  • HTTP 429 / 504 sotto carico → rispettare Retry-After (se presente) o attendere; User-Agent
//    identificativo obbligatorio (nominatim usage policy → vale anche per Overpass pubblico).
//
// Resilienza e conformità (Prompt 11):
//  • pool di endpoint approvati con circuit breaker + salute (endpoints.ts): niente traffico a caso;
//  • Retry-After onorato (secondi o data HTTP), con tetto; timeout, DNS/rete, rate-limit, 4xx, 5xx e
//    schema sono errori DISTINTI (il motore reagisce diversamente);
//  • tetti su byte, Content-Type e numero di elementi PRIMA di trattenere qualunque dato;
//  • nomi normalizzati in modo sicuro (no controlli/HTML/prompt-injection); evidenza di tag conservata;
//  • nessun payload grezzo trattenuto o loggato; nessuna coordinata dell'immobile inviata (solo origine).

import { z } from "zod";
import { assertValidCoord, type GeoCoord } from "../geo";
import { TERRITORY_POI_CATEGORIES, type TerritoryPoiCategory } from "../categories";
import { DEFAULT_OVERPASS_ENDPOINTS, OverpassEndpointPool } from "./endpoints";
import {
  ProviderAllEndpointsDownError,
  ProviderDisabledError,
  ProviderNetworkError,
  ProviderPayloadTooLargeError,
  ProviderRateLimitError,
  ProviderResponseError,
  ProviderSchemaError,
  ProviderTimeoutError,
  dedupePlaces,
  filterWithinRadius,
  isTransientProviderError,
  normalizeProviderName,
  sortByDistance,
  type ProviderPlace,
  type SearchNearbyInput,
  type TagEvidence,
  type TerritoryPlacesProvider,
} from "./provider";

const OSM_ATTRIBUTION = "© OpenStreetMap contributors";
const DEFAULT_USER_AGENT = "DomusTuaTerritory/1.0 (+https://domustua.it; territorial enrichment)";
const DEFAULT_MAX_RESPONSE_BYTES = 8_000_000; // ~8 MB: una query per comune non supera questo
const DEFAULT_MAX_ELEMENTS = 5_000; // oltre → risposta sospetta/troppo grande: rifiutata
const DEFAULT_MAX_RATE_LIMIT_PAUSE_MS = 120_000; // tetto al Retry-After: non si aspetta all'infinito

/** Coppia tag OSM che DEFINISCE ciascuna categoria. Solo un match esatto conta come evidenza. */
const CATEGORY_TAGS: Record<TerritoryPoiCategory, { key: string; value: string }> = {
  "railway-station": { key: "railway", value: "station" },
  pharmacy: { key: "amenity", value: "pharmacy" },
  supermarket: { key: "shop", value: "supermarket" },
  school: { key: "amenity", value: "school" },
  park: { key: "leisure", value: "park" },
};

// Validazione runtime della risposta Overpass. `.loose()` tollera i campi extra (nodes, members…)
// che non ci servono e che NON tratteniamo.
const OverpassElementSchema = z
  .object({
    type: z.string(),
    id: z.number(),
    lat: z.number().optional(),
    lon: z.number().optional(),
    center: z.object({ lat: z.number(), lon: z.number() }).loose().optional(),
    tags: z.record(z.string(), z.string()).optional(),
  })
  .loose();

const OverpassResponseSchema = z.object({ elements: z.array(OverpassElementSchema) }).loose();

type OverpassElement = z.infer<typeof OverpassElementSchema>;

export interface OsmProviderOptions {
  enabled?: boolean;
  /** Endpoint singolo (retrocompat) OPPURE usa `endpoints` per il pool. */
  endpoint?: string;
  /** Pool di endpoint approvati (default: istanza principale). I mirror sono opt-in. */
  endpoints?: readonly string[];
  timeoutMs?: number;
  /** Numero massimo di retry su errori TRANSITORI (default 2). */
  maxRetries?: number;
  /** Pausa dopo un 429 SENZA Retry-After, come da policy Overpass (default 30s). */
  rateLimitPauseMs?: number;
  /** Tetto alla pausa da Retry-After (default 120s). */
  maxRateLimitPauseMs?: number;
  /** Tetto ai byte della risposta prima di trattenerla (default ~8 MB). */
  maxResponseBytes?: number;
  /** Tetto al numero di elementi (default 5000). */
  maxElements?: number;
  /** Circuit breaker: fallimenti consecutivi per aprire (default 4). */
  failureThreshold?: number;
  /** Circuit breaker: cooldown prima del half-open (default 60s). */
  circuitCooldownMs?: number;
  userAgent?: string;
  /** Iniettabili per i test: nessuna rete reale nei test unitari. */
  fetchImpl?: typeof fetch;
  sleepImpl?: (ms: number) => Promise<void>;
  now?: () => Date;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export class OsmOverpassProvider implements TerritoryPlacesProvider {
  readonly name = "osm-overpass" as const;
  readonly attribution = OSM_ATTRIBUTION;
  readonly enabled: boolean;

  private readonly pool: OverpassEndpointPool;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly rateLimitPauseMs: number;
  private readonly maxRateLimitPauseMs: number;
  private readonly maxResponseBytes: number;
  private readonly maxElements: number;
  private readonly userAgent: string;
  private readonly fetchImpl: typeof fetch;
  private readonly sleepImpl: (ms: number) => Promise<void>;
  private readonly now: () => Date;

  constructor(options: OsmProviderOptions = {}) {
    this.enabled = options.enabled ?? true;
    const endpoints = options.endpoints ?? (options.endpoint ? [options.endpoint] : DEFAULT_OVERPASS_ENDPOINTS);
    this.timeoutMs = options.timeoutMs ?? 25_000;
    this.maxRetries = Math.max(0, options.maxRetries ?? 2);
    this.rateLimitPauseMs = options.rateLimitPauseMs ?? 30_000;
    this.maxRateLimitPauseMs = options.maxRateLimitPauseMs ?? DEFAULT_MAX_RATE_LIMIT_PAUSE_MS;
    this.maxResponseBytes = Math.max(1, options.maxResponseBytes ?? DEFAULT_MAX_RESPONSE_BYTES);
    this.maxElements = Math.max(1, options.maxElements ?? DEFAULT_MAX_ELEMENTS);
    this.userAgent = options.userAgent ?? DEFAULT_USER_AGENT;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.sleepImpl = options.sleepImpl ?? defaultSleep;
    this.now = options.now ?? (() => new Date());
    this.pool = new OverpassEndpointPool(endpoints, {
      failureThreshold: options.failureThreshold,
      cooldownMs: options.circuitCooldownMs,
      now: this.now,
    });
  }

  /** Salute degli endpoint (osservabilità/diagnostica). */
  endpointHealth() {
    return this.pool.snapshot();
  }

  /** Costruisce la query Overpass QL per le categorie richieste attorno all'origine. */
  buildQuery(origin: GeoCoord, radiusMeters: number, categories: TerritoryPoiCategory[]): string {
    assertValidCoord(origin);
    const radius = Math.max(1, Math.round(radiusMeters));
    const lat = origin.lat;
    const lng = origin.lng;
    const clauses = categories
      .map((c) => CATEGORY_TAGS[c])
      .map(({ key, value }) => `  nwr["${key}"="${value}"](around:${radius},${lat},${lng});`)
      .join("\n");
    // `out center;` → i way/relation ricevono il proprio centro; i nodi hanno già lat/lon.
    return `[out:json][timeout:25];\n(\n${clauses}\n);\nout center;`;
  }

  async searchNearby(input: SearchNearbyInput): Promise<ProviderPlace[]> {
    if (!this.enabled) throw new ProviderDisabledError("osm-overpass");
    input.signal?.throwIfAborted();

    const categories = input.categories.filter((c) => TERRITORY_POI_CATEGORIES.includes(c));
    if (categories.length === 0) return [];

    const query = this.buildQuery(input.origin, input.radiusMeters, categories);
    const body = await this.fetchWithRetry(query, input.signal);

    // Tetto sul numero di elementi PRIMA di mappare/trattenere.
    if (body.elements.length > this.maxElements) {
      throw new ProviderPayloadTooLargeError(
        "osm-overpass",
        `${body.elements.length} elementi oltre il tetto di ${this.maxElements}`,
      );
    }

    const retrievedAt = this.now().toISOString();
    const places = this.mapElements(body.elements, retrievedAt);

    const withinRadius = filterWithinRadius(places, input.origin, input.radiusMeters);
    const deduped = sortByDistance(dedupePlaces(withinRadius), input.origin);
    return typeof input.limit === "number" ? deduped.slice(0, input.limit) : deduped;
  }

  /**
   * POST della query con pool di endpoint, circuit breaker e retry limitato sui soli errori
   * TRANSITORI. Onora Retry-After; ruota endpoint sui transitori; se tutti i circuiti sono aperti,
   * NON chiama la rete e fallisce con ProviderAllEndpointsDownError.
   */
  private async fetchWithRetry(
    query: string,
    externalSignal?: AbortSignal,
  ): Promise<z.infer<typeof OverpassResponseSchema>> {
    let attempt = 0;
    // Tentativi = 1 + maxRetries.
    for (;;) {
      const endpoint = this.pool.pick();
      if (!endpoint) throw new ProviderAllEndpointsDownError("osm-overpass");
      try {
        const res = await this.fetchOnce(endpoint, query, externalSignal);
        this.pool.recordSuccess(endpoint);
        return res;
      } catch (err) {
        if (!isTransientProviderError(err)) throw err; // 4xx/schema/payload: riprovare non aiuta
        this.pool.recordFailure(endpoint);
        if (attempt >= this.maxRetries) throw err;
        const pause =
          err instanceof ProviderRateLimitError
            ? this.rateLimitPauseFor(err.retryAfterSeconds)
            : 500 * (attempt + 1);
        await this.sleepImpl(pause);
        attempt++;
      }
    }
  }

  /** Pausa da onorare per un rate-limit: Retry-After (con tetto) oppure la pausa di default. */
  private rateLimitPauseFor(retryAfterSeconds?: number): number {
    if (typeof retryAfterSeconds === "number" && retryAfterSeconds >= 0) {
      return Math.min(retryAfterSeconds * 1000, this.maxRateLimitPauseMs);
    }
    return this.rateLimitPauseMs;
  }

  private async fetchOnce(
    endpoint: string,
    query: string,
    externalSignal?: AbortSignal,
  ): Promise<z.infer<typeof OverpassResponseSchema>> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    const signal =
      externalSignal !== undefined
        ? AbortSignal.any([externalSignal, controller.signal])
        : controller.signal;

    let res: Response;
    try {
      res = await this.fetchImpl(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": this.userAgent,
        },
        body: `data=${encodeURIComponent(query)}`,
        signal,
      });
    } catch (err) {
      if (externalSignal?.aborted) throw err; // annullamento del chiamante: propaga
      if (controller.signal.aborted) throw new ProviderTimeoutError("osm-overpass", "timeout"); // il nostro timeout
      throw new ProviderNetworkError("osm-overpass", (err as Error).message); // DNS/connessione/TLS
    } finally {
      clearTimeout(timeout);
    }

    // Rate-limit: onora Retry-After (secondi o data HTTP).
    if (res.status === 429) {
      throw new ProviderRateLimitError("osm-overpass", "HTTP 429", parseRetryAfter(res.headers.get("retry-after"), this.now()));
    }
    // 502/503/504 sono transitori su Overpass sotto carico → trattati come timeout (ri-provabili).
    if (res.status === 502 || res.status === 503 || res.status === 504) {
      throw new ProviderTimeoutError("osm-overpass", `HTTP ${res.status}`);
    }
    if (!res.ok) throw new ProviderResponseError("osm-overpass", `HTTP ${res.status}`);

    // Content-Type: un mirror sovraccarico può servire una pagina HTML di errore → rifiuta subito.
    const contentType = res.headers.get("content-type") ?? "";
    if (/html|xml/i.test(contentType)) {
      throw new ProviderResponseError("osm-overpass", `Content-Type inatteso: ${contentType}`);
    }

    // Tetto byte via Content-Length (se dichiarato).
    const declaredLength = Number(res.headers.get("content-length") ?? "");
    if (Number.isFinite(declaredLength) && declaredLength > this.maxResponseBytes) {
      throw new ProviderPayloadTooLargeError("osm-overpass", `Content-Length ${declaredLength} oltre ${this.maxResponseBytes} byte`);
    }

    // Legge il corpo come testo e RIFIUTA se oltre il tetto (difesa quando Content-Length manca).
    let text: string;
    try {
      text = await res.text();
    } catch (err) {
      throw new ProviderNetworkError("osm-overpass", `lettura corpo: ${(err as Error).message}`);
    }
    const byteLength = Buffer.byteLength(text, "utf8");
    if (byteLength > this.maxResponseBytes) {
      throw new ProviderPayloadTooLargeError("osm-overpass", `corpo ${byteLength} byte oltre ${this.maxResponseBytes}`);
    }

    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch (err) {
      throw new ProviderResponseError("osm-overpass", `JSON non valido: ${(err as Error).message}`);
    }

    const parsed = OverpassResponseSchema.safeParse(json);
    if (!parsed.success) {
      throw new ProviderSchemaError("osm-overpass", parsed.error.message);
    }
    return parsed.data;
  }

  /** Mappa gli elementi Overpass in ProviderPlace, scartando i malformati o senza nome sicuro. */
  private mapElements(elements: OverpassElement[], retrievedAt: string): ProviderPlace[] {
    const out: ProviderPlace[] = [];
    for (const el of elements) {
      const classified = classify(el);
      if (!classified) continue; // nessuna evidenza di tag → scartato (mai supermercato "generico")

      const name = normalizeProviderName(el.tags?.name ?? el.tags?.["name:it"]);
      if (!name) continue; // nome assente/insicuro (controlli/HTML/injection) → scartato

      const coord = coordOf(el);
      if (!coord) continue; // way/relation senza center, o nodo senza lat/lon → scartato

      out.push({
        providerId: `${el.type}/${el.id}`,
        category: classified.category,
        name,
        coord,
        provider: "osm-overpass",
        evidence: classified.evidence,
        sourceUrl: `https://www.openstreetmap.org/${el.type}/${el.id}`,
        retrievedAt,
      });
    }
    return out;
  }
}

/**
 * Classifica un elemento in una categoria SOLO se ha il tag esatto che la definisce, e restituisce
 * l'EVIDENZA (il tag) usata: nessun POI entra senza provenienza verificabile.
 */
function classify(el: OverpassElement): { category: TerritoryPoiCategory; evidence: TagEvidence } | null {
  const tags = el.tags;
  if (!tags) return null;
  for (const category of TERRITORY_POI_CATEGORIES) {
    const { key, value } = CATEGORY_TAGS[category];
    if (tags[key] === value) return { category, evidence: { key, value } };
  }
  return null;
}

/** Estrae la coordinata: lat/lon per i nodi, center per way/relation con `out center`. */
function coordOf(el: OverpassElement): GeoCoord | null {
  if (typeof el.lat === "number" && typeof el.lon === "number") {
    return { lat: el.lat, lng: el.lon };
  }
  if (el.center && typeof el.center.lat === "number" && typeof el.center.lon === "number") {
    return { lat: el.center.lat, lng: el.center.lon };
  }
  return null;
}

/**
 * Interpreta l'header `Retry-After`: numero di secondi, oppure una data HTTP (→ secondi da ora).
 * Ritorna `undefined` se assente o non interpretabile. `now` iniettato per determinismo.
 */
export function parseRetryAfter(header: string | null, now: Date): number | undefined {
  if (!header) return undefined;
  const trimmed = header.trim();
  if (/^\d+$/.test(trimmed)) return Number(trimmed);
  const when = Date.parse(trimmed);
  if (Number.isNaN(when)) return undefined;
  const seconds = Math.round((when - now.getTime()) / 1000);
  return seconds > 0 ? seconds : 0;
}
