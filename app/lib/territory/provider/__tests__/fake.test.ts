// Unit test del provider fake (deterministico, senza rete).

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { FakePlacesProvider, type FakePlace } from "../fake";
import { ProviderDisabledError, ProviderRateLimitError } from "../provider";
import { TERRITORY_POI_CATEGORIES } from "../../categories";

const ORIGIN = { lat: 45.708, lng: 8.906 };
const ALL = [...TERRITORY_POI_CATEGORIES];

describe("FakePlacesProvider — sintetico", () => {
  test("genera POI per le categorie richieste, entro il raggio", async () => {
    const provider = new FakePlacesProvider();
    const places = await provider.searchNearby({
      origin: ORIGIN,
      radiusMeters: 1500,
      categories: ALL,
    });
    assert.ok(places.length > 0);
    // Solo categorie richieste.
    assert.ok(places.every((p) => ALL.includes(p.category)));
    // Provider e attribuzione coerenti.
    assert.ok(places.every((p) => p.provider === "fake"));
    assert.equal(provider.attribution, "© Dati sintetici di test");
  });

  test("deterministico: stesso input → stesso output", async () => {
    const p = new FakePlacesProvider();
    const a = await p.searchNearby({ origin: ORIGIN, radiusMeters: 1500, categories: ALL });
    const b = await p.searchNearby({ origin: ORIGIN, radiusMeters: 1500, categories: ALL });
    assert.deepEqual(a, b);
  });

  test("ordina per distanza crescente", async () => {
    const provider = new FakePlacesProvider();
    const places = await provider.searchNearby({
      origin: ORIGIN,
      radiusMeters: 1500,
      categories: ["pharmacy"],
    });
    const { haversineMeters } = await import("../../geo");
    const distances = places.map((p) => haversineMeters(ORIGIN, p.coord));
    const sorted = [...distances].sort((x, y) => x - y);
    assert.deepEqual(distances, sorted);
  });

  test("omitCategories simula copertura parziale", async () => {
    const provider = new FakePlacesProvider({ omitCategories: ["railway-station"] });
    const places = await provider.searchNearby({
      origin: ORIGIN,
      radiusMeters: 1500,
      categories: ALL,
    });
    assert.equal(places.some((p) => p.category === "railway-station"), false);
  });

  test("limit taglia il numero totale di risultati", async () => {
    const provider = new FakePlacesProvider();
    const places = await provider.searchNearby({
      origin: ORIGIN,
      radiusMeters: 1500,
      categories: ALL,
      limit: 2,
    });
    assert.equal(places.length, 2);
  });
});

describe("FakePlacesProvider — dataset esplicito e filtri", () => {
  const dataset: FakePlace[] = [
    { providerId: "x/1", category: "pharmacy", name: "Vicina", coord: { lat: 45.7085, lng: 8.9065 } },
    { providerId: "x/2", category: "pharmacy", name: "Lontana", coord: { lat: 45.75, lng: 8.95 } },
  ];

  test("scarta i luoghi fuori dal raggio", async () => {
    const provider = new FakePlacesProvider({ places: dataset });
    const places = await provider.searchNearby({
      origin: ORIGIN,
      radiusMeters: 1500,
      categories: ["pharmacy"],
    });
    assert.deepEqual(places.map((p) => p.name), ["Vicina"]);
  });
});

describe("FakePlacesProvider — errori simulati", () => {
  test("disabilitato → ProviderDisabledError", async () => {
    const provider = new FakePlacesProvider({ enabled: false });
    await assert.rejects(
      () => provider.searchNearby({ origin: ORIGIN, radiusMeters: 1500, categories: ALL }),
      ProviderDisabledError,
    );
  });

  test("rateLimited → ProviderRateLimitError", async () => {
    const provider = new FakePlacesProvider({ rateLimited: true });
    await assert.rejects(
      () => provider.searchNearby({ origin: ORIGIN, radiusMeters: 1500, categories: ALL }),
      ProviderRateLimitError,
    );
  });

  test("failWith → propaga l'errore (es. risposta malformata)", async () => {
    const provider = new FakePlacesProvider({ failWith: new Error("malformato") });
    await assert.rejects(
      () => provider.searchNearby({ origin: ORIGIN, radiusMeters: 1500, categories: ALL }),
      /malformato/,
    );
  });
});
