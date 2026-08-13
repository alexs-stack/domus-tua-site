// FIXTURE Overpass deterministiche (Prompt 11): dati SINTETICI attorno al centroide di Tradate.
// Nessun dato reale di immobili o utenti. Coprono i casi che un provider deve gestire correttamente:
// nodi, way (center), relation (center), duplicati (nodo+way stesso luogo), oggetti SENZA nome, tag
// multipli (classificazione deterministica), risultati FUORI raggio e tag generici non classificabili.

export const FIXTURE_ORIGIN = { lat: 45.708, lng: 8.906 } as const;
export const FIXTURE_RADIUS_M = 1500;

/** Elementi Overpass grezzi (schema [out:json] con `out center`). */
export const OVERPASS_FIXTURE_ELEMENTS = [
  // nodo semplice, in raggio
  { type: "node", id: 1, lat: 45.7085, lon: 8.9065, tags: { amenity: "pharmacy", name: "Farmacia Centrale" } },
  // way con center, in raggio
  { type: "way", id: 2, center: { lat: 45.709, lon: 8.907 }, tags: { shop: "supermarket", name: "Esselunga" }, nodes: [10, 11, 12] },
  // relation con center, in raggio
  {
    type: "relation",
    id: 3,
    center: { lat: 45.7095, lon: 8.9075 },
    tags: { leisure: "park", name: "Parco Nord" },
    members: [{ type: "way", ref: 20, role: "outer" }],
  },
  // railway station, in raggio
  { type: "node", id: 4, lat: 45.71, lon: 8.9055, tags: { railway: "station", name: "Stazione di Tradate" } },
  // DUPLICATO: stesso luogo come nodo e come way (stessa categoria/coord) → deve restare 1
  { type: "node", id: 5, lat: 45.7086, lon: 8.9066, tags: { amenity: "pharmacy", name: "Farmacia Doppia" } },
  { type: "way", id: 6, center: { lat: 45.7086, lon: 8.9066 }, tags: { amenity: "pharmacy", name: "Farmacia Doppia" } },
  // SENZA nome → scartato
  { type: "node", id: 7, lat: 45.7087, lon: 8.9067, tags: { amenity: "pharmacy" } },
  // TAG MULTIPLI: amenity=pharmacy + leisure=park → classificazione deterministica = pharmacy
  { type: "node", id: 8, lat: 45.7088, lon: 8.9068, tags: { amenity: "pharmacy", leisure: "park", name: "Farmacia MultiTag" } },
  // generico non classificabile → scartato
  { type: "node", id: 9, lat: 45.708, lon: 8.906, tags: { shop: "convenience", name: "Alimentari Rossi" } },
  // FUORI raggio (>1500 m) → scartato
  { type: "node", id: 10, lat: 45.75, lon: 8.95, tags: { amenity: "pharmacy", name: "Farmacia Lontana" } },
] as const;

/** Corpo Overpass valido con gli elementi fixture. */
export const OVERPASS_FIXTURE_BODY = { version: 0.6, generator: "fixture", elements: OVERPASS_FIXTURE_ELEMENTS };

/** I nomi che DEVONO risultare classificati e in raggio (esclusi duplicati/senza nome/generici/lontani). */
export const EXPECTED_FIXTURE_NAMES = [
  "Esselunga",
  "Farmacia Centrale",
  "Farmacia Doppia",
  "Farmacia MultiTag",
  "Parco Nord",
  "Stazione di Tradate",
] as const;

export interface FixtureFetchOptions {
  status?: number;
  headers?: Record<string, string>;
  /** Corpo grezzo alternativo (per malformati); default = JSON della fixture. */
  raw?: string;
  body?: unknown;
}

/**
 * Costruisce un `fetch` iniettabile che risponde con la fixture (o quanto specificato) come
 * `application/json`, e traccia le chiamate. Nessuna rete reale.
 */
export function fixtureFetch(options: FixtureFetchOptions = {}) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const impl = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const payload = options.raw !== undefined ? options.raw : JSON.stringify(options.body ?? OVERPASS_FIXTURE_BODY);
    const headers = { "content-type": "application/json", ...(options.headers ?? {}) };
    return new Response(payload, { status: options.status ?? 200, headers });
  }) as unknown as typeof fetch;
  return { impl, calls };
}
