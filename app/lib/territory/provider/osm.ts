// Provider REALE: OpenStreetMap via Overpass API.
//
// Contratto verificato sulla documentazione ufficiale (wiki.openstreetmap.org/wiki/Overpass_API):
//  • endpoint POST https://overpass-api.de/api/interpreter, query nel corpo come `data=<QL>`;
//  • risposta [out:json] con `elements[]`; ogni elemento ha type/id, lat/lon (nodi) o center
//    {lat,lon} (way/relation con `out center`), e `tags`;
//  • HTTP 429 → pausa 30s prima di riprovare; serve un User-Agent identificativo.
//
// Sicurezza/qualità (Prompt 4): chiave non necessaria (dato pubblico), timeout+abort, validazione
// runtime della risposta, deduplica, scarto dei luoghi senza nome, nessun payload grezzo trattenuto,
// retry SOLO su errori transitori con limite stretto, nessun log di coordinate esatte o segreti.

import { z } from "zod";
import { assertValidCoord, type GeoCoord } from "../geo";
import { TERRITORY_POI_CATEGORIES, type TerritoryPoiCategory } from "../categories";
import {
  ProviderDisabledError,
  ProviderRateLimitError,
  ProviderResponseError,
  ProviderTimeoutError,
  dedupePlaces,
  filterWithinRadius,
  sortByDistance,
  type ProviderPlace,
  type SearchNearbyInput,
  type TerritoryPlacesProvider,
} from "./provider";

const DEFAULT_ENDPOINT = "https://overpass-api.de/api/interpreter";
const OSM_ATTRIBUTION = "© OpenStreetMap contributors";
const DEFAULT_USER_AGENT = "DomusTuaTerritory/1.0 (+https://domustua.it; territorial enrichment)";

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
  endpoint?: string;
  timeoutMs?: number;
  /** Numero massimo di retry su errori TRANSITORI (default 2). */
  maxRetries?: number;
  /** Pausa dopo un 429, come da policy Overpass (default 30s). */
  rateLimitPauseMs?: number;
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

  private readonly endpoint: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly rateLimitPauseMs: number;
  private readonly userAgent: string;
  private readonly fetchImpl: typeof fetch;
  private readonly sleepImpl: (ms: number) => Promise<void>;
  private readonly now: () => Date;

  constructor(options: OsmProviderOptions = {}) {
    this.enabled = options.enabled ?? true;
    this.endpoint = options.endpoint ?? DEFAULT_ENDPOINT;
    this.timeoutMs = options.timeoutMs ?? 25_000;
    this.maxRetries = Math.max(0, options.maxRetries ?? 2);
    this.rateLimitPauseMs = options.rateLimitPauseMs ?? 30_000;
    this.userAgent = options.userAgent ?? DEFAULT_USER_AGENT;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.sleepImpl = options.sleepImpl ?? defaultSleep;
    this.now = options.now ?? (() => new Date());
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

    const retrievedAt = this.now().toISOString();
    const places = this.mapElements(body.elements, retrievedAt);

    const withinRadius = filterWithinRadius(places, input.origin, input.radiusMeters);
    const deduped = sortByDistance(dedupePlaces(withinRadius), input.origin);
    return typeof input.limit === "number" ? deduped.slice(0, input.limit) : deduped;
  }

  /** POST della query con timeout+abort e retry limitato sui soli errori transitori. */
  private async fetchWithRetry(
    query: string,
    externalSignal?: AbortSignal,
  ): Promise<z.infer<typeof OverpassResponseSchema>> {
    let attempt = 0;
    // Tentativi = 1 + maxRetries.
    for (;;) {
      try {
        return await this.fetchOnce(query, externalSignal);
      } catch (err) {
        const transient =
          err instanceof ProviderRateLimitError || err instanceof ProviderTimeoutError;
        if (!transient || attempt >= this.maxRetries) throw err;
        // 429 → pausa da policy; timeout → piccola attesa progressiva.
        const pause =
          err instanceof ProviderRateLimitError ? this.rateLimitPauseMs : 500 * (attempt + 1);
        await this.sleepImpl(pause);
        attempt++;
      }
    }
  }

  private async fetchOnce(
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
      res = await this.fetchImpl(this.endpoint, {
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
      throw new ProviderTimeoutError("osm-overpass", (err as Error).message);
    } finally {
      clearTimeout(timeout);
    }

    if (res.status === 429) throw new ProviderRateLimitError("osm-overpass", "HTTP 429");
    // 504/502/503 sono transitori su Overpass sotto carico → trattati come timeout (ri-provabili).
    if (res.status === 504 || res.status === 502 || res.status === 503) {
      throw new ProviderTimeoutError("osm-overpass", `HTTP ${res.status}`);
    }
    if (!res.ok) throw new ProviderResponseError("osm-overpass", `HTTP ${res.status}`);

    let json: unknown;
    try {
      json = await res.json();
    } catch (err) {
      throw new ProviderResponseError("osm-overpass", `JSON non valido: ${(err as Error).message}`);
    }

    const parsed = OverpassResponseSchema.safeParse(json);
    if (!parsed.success) {
      throw new ProviderResponseError("osm-overpass", `risposta inattesa: ${parsed.error.message}`);
    }
    return parsed.data;
  }

  /** Mappa gli elementi Overpass in ProviderPlace, scartando i malformati o senza nome. */
  private mapElements(elements: OverpassElement[], retrievedAt: string): ProviderPlace[] {
    const out: ProviderPlace[] = [];
    for (const el of elements) {
      const category = classify(el);
      if (!category) continue; // nessuna evidenza di tag → scartato (mai supermercato "generico")

      const name = el.tags?.name ?? el.tags?.["name:it"];
      if (!name || name.trim().length === 0) continue; // luogo senza nome → scartato

      const coord = coordOf(el);
      if (!coord) continue; // way/relation senza center, o nodo senza lat/lon → scartato

      out.push({
        providerId: `${el.type}/${el.id}`,
        category,
        name: name.trim(),
        coord,
        provider: "osm-overpass",
        sourceUrl: `https://www.openstreetmap.org/${el.type}/${el.id}`,
        retrievedAt,
      });
    }
    return out;
  }
}

/** Classifica un elemento in una categorie SOLO se ha il tag esatto che la definisce. */
function classify(el: OverpassElement): TerritoryPoiCategory | null {
  const tags = el.tags;
  if (!tags) return null;
  for (const category of TERRITORY_POI_CATEGORIES) {
    const { key, value } = CATEGORY_TAGS[category];
    if (tags[key] === value) return category;
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
