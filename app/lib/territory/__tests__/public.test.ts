// Unit test della conversione privato → pubblico e delle sue regole di sicurezza.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  toPublicListingTerritory,
  sortAndLimitPois,
  isFresh,
} from "../public";
import { PublicListingTerritorySchema } from "../types";
import type { ListingTerritoryEnrichment, TerritoryPoi, EnrichmentStatus } from "../types";
import type { TerritoryPoiCategory } from "../categories";
import { TERRITORY_SCHEMA_VERSION } from "../constants";

const NOW = new Date("2026-08-13T10:00:00.000Z");
const FRESH_RETRIEVED = "2026-08-10T10:00:00.000Z"; // 3 giorni fa

function poi(over: Partial<TerritoryPoi> & { category: TerritoryPoiCategory }): TerritoryPoi {
  return {
    providerId: over.providerId ?? `node/${over.name ?? over.category}`,
    category: over.category,
    name: over.name ?? "Luogo",
    distanceMeters: over.distanceMeters ?? 100,
    distanceMethod: "straight-line",
    source: over.source ?? {
      provider: "fake",
      retrievedAt: FRESH_RETRIEVED,
      attribution: "© Test",
    },
    approval: over.approval ?? { state: "approved" },
    ...(over.coord ? { coord: over.coord } : {}),
    ...(over.expiresAt ? { expiresAt: over.expiresAt } : {}),
  };
}

function record(
  pois: TerritoryPoi[],
  over: Partial<ListingTerritoryEnrichment> = {},
): ListingTerritoryEnrichment {
  return {
    schemaVersion: TERRITORY_SCHEMA_VERSION,
    realSmartCode: "1043",
    municipality: "tradate",
    coordSource: "municipality-centroid",
    origin: { lat: 45.708, lng: 8.906 },
    fingerprint: {
      municipality: "tradate",
      coordKey: "45.708,8.906",
      ultimaModifica: "2026-08-01",
      schemaVersion: TERRITORY_SCHEMA_VERSION,
      hash: "deadbeef",
    },
    status: (over.status ?? "approved") as EnrichmentStatus,
    pois,
    retrievedAt: over.retrievedAt ?? FRESH_RETRIEVED,
    updatedAt: FRESH_RETRIEVED,
    ...(over.expiresAt ? { expiresAt: over.expiresAt } : {}),
    ...(over.approval ? { approval: over.approval } : {}),
  };
}

const OPTS = { now: NOW, freshnessDays: 180 };

describe("isFresh", () => {
  test("dentro la finestra → true", () => {
    assert.equal(isFresh(FRESH_RETRIEVED, NOW, 180), true);
  });
  test("oltre la finestra → false", () => {
    assert.equal(isFresh("2025-01-01T00:00:00.000Z", NOW, 180), false);
  });
  test("expiresAt nel passato → false anche se dentro la finestra", () => {
    assert.equal(isFresh(FRESH_RETRIEVED, NOW, 180, "2026-08-11T00:00:00.000Z"), false);
  });
  test("retrievedAt nel futuro → false (age negativa)", () => {
    assert.equal(isFresh("2027-01-01T00:00:00.000Z", NOW, 180), false);
  });
});

describe("sortAndLimitPois", () => {
  test("massimo 2 per categoria", () => {
    const pois = [
      poi({ category: "pharmacy", name: "F1", distanceMeters: 100 }),
      poi({ category: "pharmacy", name: "F2", distanceMeters: 200 }),
      poi({ category: "pharmacy", name: "F3", distanceMeters: 300 }),
    ];
    const out = sortAndLimitPois(pois);
    assert.equal(out.length, 2);
    assert.deepEqual(out.map((p) => p.name), ["F1", "F2"]);
  });

  test("ordina per distanza crescente", () => {
    const pois = [
      poi({ category: "park", name: "lontano", distanceMeters: 900 }),
      poi({ category: "park", name: "vicino", distanceMeters: 100 }),
    ];
    assert.deepEqual(sortAndLimitPois(pois).map((p) => p.name), ["vicino", "lontano"]);
  });

  test("ordinamento deterministico su pari distanza (nome, poi providerId)", () => {
    const a = [
      poi({ category: "school", name: "Beta", distanceMeters: 100, providerId: "z" }),
      poi({ category: "school", name: "Alfa", distanceMeters: 100, providerId: "y" }),
    ];
    const b = [
      poi({ category: "school", name: "Alfa", distanceMeters: 100, providerId: "y" }),
      poi({ category: "school", name: "Beta", distanceMeters: 100, providerId: "z" }),
    ];
    assert.deepEqual(sortAndLimitPois(a), sortAndLimitPois(b));
    assert.deepEqual(sortAndLimitPois(a).map((p) => p.name), ["Alfa", "Beta"]);
  });

  test("emette le categorie nell'ordine canonico", () => {
    const pois = [
      poi({ category: "park", name: "P" }),
      poi({ category: "railway-station", name: "S" }),
      poi({ category: "pharmacy", name: "F" }),
    ];
    assert.deepEqual(sortAndLimitPois(pois).map((p) => p.category), [
      "railway-station",
      "pharmacy",
      "park",
    ]);
  });
});

describe("toPublicListingTerritory", () => {
  test("record approvato e fresco → vista pubblica valida", () => {
    const out = toPublicListingTerritory(
      record([poi({ category: "pharmacy", name: "Farmacia Centrale", distanceMeters: 250 })]),
      OPTS,
    );
    assert.ok(out);
    assert.equal(out.method, "straight-line");
    assert.equal(out.realSmartCode, "1043");
    assert.equal(out.pois.length, 1);
    // La vista pubblica supera il proprio schema strict (nessun campo estraneo).
    assert.equal(PublicListingTerritorySchema.safeParse(out).success, true);
  });

  test("nessuna coordinata né ID interno trapela nel pubblico", () => {
    const out = toPublicListingTerritory(
      record([
        poi({
          category: "school",
          name: "Scuola",
          coord: { lat: 45.71, lng: 8.9 },
          providerId: "node/999",
        }),
      ]),
      OPTS,
    );
    assert.ok(out);
    const json = JSON.stringify(out);
    assert.equal(json.includes("coord"), false);
    assert.equal(json.includes("lat"), false);
    assert.equal(json.includes("lng"), false);
    assert.equal(json.includes("providerId"), false);
    assert.equal(json.includes("node/999"), false);
  });

  test("record non approvato → null", () => {
    for (const status of ["draft", "stale", "failed", "disabled"] as const) {
      const out = toPublicListingTerritory(
        record([poi({ category: "park", name: "Parco" })], { status }),
        OPTS,
      );
      assert.equal(out, null, `status ${status} non deve pubblicare`);
    }
  });

  test("record stale per anzianità → null", () => {
    const out = toPublicListingTerritory(
      record([poi({ category: "park", name: "Parco" })], {
        retrievedAt: "2025-01-01T00:00:00.000Z",
      }),
      OPTS,
    );
    assert.equal(out, null);
  });

  test("solo i POI approvati entrano nel pubblico", () => {
    const out = toPublicListingTerritory(
      record([
        poi({ category: "pharmacy", name: "Approvata", approval: { state: "approved" } }),
        poi({ category: "pharmacy", name: "Bozza", approval: { state: "draft" } }),
        poi({ category: "pharmacy", name: "Rifiutata", approval: { state: "rejected" } }),
      ]),
      OPTS,
    );
    assert.ok(out);
    assert.deepEqual(out.pois.map((p) => p.name), ["Approvata"]);
  });

  test("nessun POI approvato → null (sezione nascosta)", () => {
    const out = toPublicListingTerritory(
      record([poi({ category: "pharmacy", name: "Bozza", approval: { state: "draft" } })]),
      OPTS,
    );
    assert.equal(out, null);
  });

  test("categorie parziali: pubblica solo quelle presenti", () => {
    const out = toPublicListingTerritory(
      record([
        poi({ category: "railway-station", name: "Stazione" }),
        poi({ category: "supermarket", name: "Super" }),
      ]),
      OPTS,
    );
    assert.ok(out);
    assert.deepEqual(new Set(out.pois.map((p) => p.category)), new Set(["railway-station", "supermarket"]));
  });

  test("conversione deterministica: stesso input → stesso output", () => {
    const r = record([
      poi({ category: "pharmacy", name: "F2", distanceMeters: 200 }),
      poi({ category: "pharmacy", name: "F1", distanceMeters: 100 }),
      poi({ category: "park", name: "P1", distanceMeters: 50 }),
    ]);
    assert.deepEqual(toPublicListingTerritory(r, OPTS), toPublicListingTerritory(r, OPTS));
  });

  test("sourceUrl proiettato solo se presente", () => {
    const withUrl = toPublicListingTerritory(
      record([
        poi({
          category: "park",
          name: "Parco",
          source: {
            provider: "osm-overpass",
            retrievedAt: FRESH_RETRIEVED,
            attribution: "© OpenStreetMap contributors",
            sourceUrl: "https://www.openstreetmap.org/node/1",
          },
        }),
      ]),
      OPTS,
    );
    assert.equal(withUrl?.pois[0].sourceUrl, "https://www.openstreetmap.org/node/1");
    const withoutUrl = toPublicListingTerritory(
      record([poi({ category: "park", name: "Parco" })]),
      OPTS,
    );
    assert.equal("sourceUrl" in (withoutUrl?.pois[0] ?? {}), false);
  });
});
