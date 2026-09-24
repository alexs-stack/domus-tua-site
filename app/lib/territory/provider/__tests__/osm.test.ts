// Unit test dell'adattatore Overpass con FIXTURE sintetiche (nessuna rete reale, fetch iniettato).
// I dati sono inventati attorno al centroide di Tradate: niente dati reali di immobili o utenti.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { OsmOverpassProvider } from "../osm";
import {
  ProviderDisabledError,
  ProviderRateLimitError,
  ProviderResponseError,
  ProviderSchemaError,
} from "../provider";

const ORIGIN = { lat: 45.708, lng: 8.906 };
const NOW = () => new Date("2026-08-13T00:00:00.000Z");

// Risposta Overpass sintetica: mix di casi (nodo, way con center, senza nome, tag generico, lontano).
const SAMPLE_ELEMENTS = [
  { type: "node", id: 1, lat: 45.7085, lon: 8.9065, tags: { amenity: "pharmacy", name: "Farmacia Centrale" } },
  { type: "way", id: 2, center: { lat: 45.709, lon: 8.907 }, tags: { shop: "supermarket", name: "Esselunga" }, nodes: [10, 11] },
  { type: "node", id: 3, lat: 45.708, lon: 8.906, tags: { shop: "convenience", name: "Alimentari Rossi" } }, // generico → scartato
  { type: "node", id: 4, lat: 45.7086, lon: 8.9066, tags: { amenity: "pharmacy" } }, // senza nome → scartato
  { type: "node", id: 5, lat: 45.71, lon: 8.9055, tags: { railway: "station", name: "Stazione di Tradate" } },
  { type: "node", id: 6, lat: 45.75, lon: 8.95, tags: { amenity: "pharmacy", name: "Farmacia Lontana" } }, // oltre 1500 m
];

/** fetch iniettabile: restituisce in coda le risposte fornite (status + body). */
function queuedFetch(responses: Array<{ status?: number; body?: unknown; raw?: string }>) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  let i = 0;
  const impl = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const r = responses[Math.min(i, responses.length - 1)];
    i++;
    const payload = r.raw !== undefined ? r.raw : JSON.stringify(r.body ?? {});
    return new Response(payload, { status: r.status ?? 200 });
  }) as unknown as typeof fetch;
  return { impl, calls };
}

function makeProvider(
  fetchImpl: typeof fetch,
  over: Partial<ConstructorParameters<typeof OsmOverpassProvider>[0]> = {},
  sleepCalls?: number[],
) {
  return new OsmOverpassProvider({
    fetchImpl,
    now: NOW,
    sleepImpl: async (ms: number) => {
      sleepCalls?.push(ms);
    },
    ...over,
  });
}

describe("buildQuery", () => {
  test("contiene i tag delle categorie richieste e il raggio around", () => {
    const provider = makeProvider(queuedFetch([{ body: { elements: [] } }]).impl);
    const q = provider.buildQuery(ORIGIN, 1500, ["pharmacy", "supermarket"]);
    assert.match(q, /\[out:json\]/);
    assert.match(q, /nwr\["amenity"="pharmacy"\]\(around:1500,45.708,8.906\)/);
    assert.match(q, /nwr\["shop"="supermarket"\]\(around:1500,45.708,8.906\)/);
    assert.match(q, /out center;/);
  });
});

describe("searchNearby — mappatura", () => {
  test("mappa nodi e way, scarta generici/senza nome/fuori raggio", async () => {
    const { impl } = queuedFetch([{ body: { elements: SAMPLE_ELEMENTS } }]);
    const provider = makeProvider(impl);
    const places = await provider.searchNearby({
      origin: ORIGIN,
      radiusMeters: 1500,
      categories: ["pharmacy", "supermarket", "railway-station"],
    });
    const names = places.map((p) => p.name).sort();
    assert.deepEqual(names, ["Esselunga", "Farmacia Centrale", "Stazione di Tradate"]);
    // "Alimentari Rossi" (convenience) e la farmacia senza nome e quella lontana sono fuori.
  });

  test("providerId, sourceUrl, provider e retrievedAt corretti", async () => {
    const { impl } = queuedFetch([{ body: { elements: [SAMPLE_ELEMENTS[0]] } }]);
    const provider = makeProvider(impl);
    const [poi] = await provider.searchNearby({
      origin: ORIGIN,
      radiusMeters: 1500,
      categories: ["pharmacy"],
    });
    assert.equal(poi.providerId, "node/1");
    assert.equal(poi.sourceUrl, "https://www.openstreetmap.org/node/1");
    assert.equal(poi.provider, "osm-overpass");
    assert.equal(poi.retrievedAt, "2026-08-13T00:00:00.000Z");
    assert.deepEqual(poi.coord, { lat: 45.7085, lng: 8.9065 });
  });

  test("way senza center viene scartato (nessuna coordinata)", async () => {
    const { impl } = queuedFetch([
      { body: { elements: [{ type: "way", id: 9, tags: { leisure: "park", name: "Parco senza centro" } }] } },
    ]);
    const provider = makeProvider(impl);
    const places = await provider.searchNearby({ origin: ORIGIN, radiusMeters: 1500, categories: ["park"] });
    assert.equal(places.length, 0);
  });

  test("deduplica lo stesso luogo mappato come nodo e come way", async () => {
    const { impl } = queuedFetch([
      {
        body: {
          elements: [
            { type: "node", id: 100, lat: 45.7085, lon: 8.9065, tags: { amenity: "pharmacy", name: "Doppia" } },
            { type: "way", id: 200, center: { lat: 45.7085, lon: 8.9065 }, tags: { amenity: "pharmacy", name: "Doppia" } },
          ],
        },
      },
    ]);
    const provider = makeProvider(impl);
    const places = await provider.searchNearby({ origin: ORIGIN, radiusMeters: 1500, categories: ["pharmacy"] });
    assert.equal(places.length, 1);
  });

  test("categorie vuote → nessuna chiamata di rete", async () => {
    const { impl, calls } = queuedFetch([{ body: { elements: [] } }]);
    const provider = makeProvider(impl);
    const places = await provider.searchNearby({ origin: ORIGIN, radiusMeters: 1500, categories: [] });
    assert.deepEqual(places, []);
    assert.equal(calls.length, 0);
  });

  test("invia User-Agent e corpo data= (mai indirizzi, solo coordinate)", async () => {
    const { impl, calls } = queuedFetch([{ body: { elements: [] } }]);
    const provider = makeProvider(impl);
    await provider.searchNearby({ origin: ORIGIN, radiusMeters: 1500, categories: ["pharmacy"] });
    const headers = calls[0].init.headers as Record<string, string>;
    assert.match(headers["User-Agent"], /DomusTua/);
    assert.match(String(calls[0].init.body), /^data=/);
  });
});

describe("searchNearby — errori e retry", () => {
  test("disabilitato → ProviderDisabledError, nessuna fetch", async () => {
    const { impl, calls } = queuedFetch([{ body: { elements: [] } }]);
    const provider = makeProvider(impl, { enabled: false });
    await assert.rejects(
      () => provider.searchNearby({ origin: ORIGIN, radiusMeters: 1500, categories: ["pharmacy"] }),
      ProviderDisabledError,
    );
    assert.equal(calls.length, 0);
  });

  test("429 persistente → ProviderRateLimitError dopo i retry, con pause", async () => {
    const sleeps: number[] = [];
    const { impl, calls } = queuedFetch([{ status: 429 }, { status: 429 }, { status: 429 }]);
    const provider = makeProvider(impl, { maxRetries: 2, rateLimitPauseMs: 30_000 }, sleeps);
    await assert.rejects(
      () => provider.searchNearby({ origin: ORIGIN, radiusMeters: 1500, categories: ["pharmacy"] }),
      ProviderRateLimitError,
    );
    assert.equal(calls.length, 3); // 1 + 2 retry
    assert.deepEqual(sleeps, [30_000, 30_000]);
  });

  test("504 transitorio poi 200 → riprova e riesce", async () => {
    const sleeps: number[] = [];
    const { impl, calls } = queuedFetch([
      { status: 504 },
      { body: { elements: [SAMPLE_ELEMENTS[0]] } },
    ]);
    const provider = makeProvider(impl, { maxRetries: 2 }, sleeps);
    const places = await provider.searchNearby({ origin: ORIGIN, radiusMeters: 1500, categories: ["pharmacy"] });
    assert.equal(places.length, 1);
    assert.equal(calls.length, 2);
    assert.equal(sleeps.length, 1);
  });

  test("400 non transitorio → ProviderResponseError, nessun retry", async () => {
    const { impl, calls } = queuedFetch([{ status: 400 }, { body: { elements: [] } }]);
    const provider = makeProvider(impl, { maxRetries: 2 });
    await assert.rejects(
      () => provider.searchNearby({ origin: ORIGIN, radiusMeters: 1500, categories: ["pharmacy"] }),
      ProviderResponseError,
    );
    assert.equal(calls.length, 1);
  });

  test("JSON non valido → ProviderResponseError", async () => {
    const { impl } = queuedFetch([{ raw: "non-json <html>" }]);
    const provider = makeProvider(impl);
    await assert.rejects(
      () => provider.searchNearby({ origin: ORIGIN, radiusMeters: 1500, categories: ["pharmacy"] }),
      ProviderResponseError,
    );
  });

  test("corpo senza elements → ProviderSchemaError (JSON valido, struttura errata)", async () => {
    const { impl } = queuedFetch([{ body: { version: 0.6 } }]);
    const provider = makeProvider(impl);
    await assert.rejects(
      () => provider.searchNearby({ origin: ORIGIN, radiusMeters: 1500, categories: ["pharmacy"] }),
      ProviderSchemaError,
    );
  });

  test("evidenza di classificazione (tag) conservata sul luogo", async () => {
    const { impl } = queuedFetch([{ body: { elements: [SAMPLE_ELEMENTS[0]] } }]);
    const provider = makeProvider(impl);
    const [poi] = await provider.searchNearby({ origin: ORIGIN, radiusMeters: 1500, categories: ["pharmacy"] });
    assert.deepEqual(poi.evidence, { key: "amenity", value: "pharmacy" });
  });

  test("signal già annullato → non chiama la rete", async () => {
    const { impl, calls } = queuedFetch([{ body: { elements: [] } }]);
    const provider = makeProvider(impl);
    await assert.rejects(() =>
      provider.searchNearby({
        origin: ORIGIN,
        radiusMeters: 1500,
        categories: ["pharmacy"],
        signal: AbortSignal.abort(),
      }),
    );
    assert.equal(calls.length, 0);
  });
});
