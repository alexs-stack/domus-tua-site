// Unit test della validazione Zod del modello di dominio.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  TerritoryPoiSchema,
  GeoCoordSchema,
  PublicTerritoryPoiSchema,
  PublicListingTerritorySchema,
  parseListingEnrichment,
} from "../types";
import { TERRITORY_SCHEMA_VERSION } from "../constants";

const RETRIEVED = "2026-08-10T10:00:00.000Z";

const VALID_POI = {
  providerId: "node/1",
  category: "pharmacy",
  name: "Farmacia",
  distanceMeters: 120,
  distanceMethod: "straight-line",
  source: { provider: "fake", retrievedAt: RETRIEVED, attribution: "© Test" },
  approval: { state: "approved" },
};

describe("GeoCoordSchema", () => {
  test("accetta coordinate valide", () => {
    assert.equal(GeoCoordSchema.safeParse({ lat: 45.7, lng: 8.9 }).success, true);
  });
  test("rifiuta latitudine impossibile", () => {
    assert.equal(GeoCoordSchema.safeParse({ lat: 200, lng: 8.9 }).success, false);
  });
  test("rifiuta longitudine impossibile", () => {
    assert.equal(GeoCoordSchema.safeParse({ lat: 45, lng: 500 }).success, false);
  });
  test("strict: rifiuta campi extra", () => {
    assert.equal(GeoCoordSchema.safeParse({ lat: 45, lng: 8, alt: 100 }).success, false);
  });
});

describe("TerritoryPoiSchema", () => {
  test("accetta un POI valido", () => {
    assert.equal(TerritoryPoiSchema.safeParse(VALID_POI).success, true);
  });

  test("rifiuta distanza negativa", () => {
    assert.equal(
      TerritoryPoiSchema.safeParse({ ...VALID_POI, distanceMeters: -5 }).success,
      false,
    );
  });

  test("rifiuta un metodo di percorribilità (solo straight-line è esprimibile)", () => {
    assert.equal(
      TerritoryPoiSchema.safeParse({ ...VALID_POI, distanceMethod: "walking" }).success,
      false,
    );
  });

  test("rifiuta nome vuoto", () => {
    assert.equal(TerritoryPoiSchema.safeParse({ ...VALID_POI, name: "" }).success, false);
  });

  test("rifiuta categoria fuori dalle cinque", () => {
    assert.equal(
      TerritoryPoiSchema.safeParse({ ...VALID_POI, category: "restaurant" }).success,
      false,
    );
  });

  test("accetta una coordinata server-side opzionale", () => {
    assert.equal(
      TerritoryPoiSchema.safeParse({ ...VALID_POI, coord: { lat: 45.7, lng: 8.9 } }).success,
      true,
    );
  });
});

describe("PublicTerritoryPoiSchema", () => {
  test("strict: rifiuta una coordinata che prova a trapelare", () => {
    const leak = {
      category: "pharmacy",
      name: "Farmacia",
      distanceMeters: 120,
      distanceMethod: "straight-line",
      provider: "fake",
      attribution: "© Test",
      coord: { lat: 45.7, lng: 8.9 },
    };
    assert.equal(PublicTerritoryPoiSchema.safeParse(leak).success, false);
  });

  test("strict: rifiuta providerId interno nel pubblico", () => {
    const leak = {
      category: "pharmacy",
      name: "Farmacia",
      distanceMeters: 120,
      distanceMethod: "straight-line",
      provider: "fake",
      attribution: "© Test",
      providerId: "node/1",
    };
    assert.equal(PublicTerritoryPoiSchema.safeParse(leak).success, false);
  });
});

describe("PublicListingTerritorySchema", () => {
  test("accetta una vista pubblica minima valida", () => {
    const ok = {
      realSmartCode: "1043",
      municipality: "tradate",
      method: "straight-line",
      retrievedAt: RETRIEVED,
      pois: [
        {
          category: "park",
          name: "Parco",
          distanceMeters: 300,
          distanceMethod: "straight-line",
          provider: "osm-overpass",
          attribution: "© OpenStreetMap contributors",
        },
      ],
    };
    assert.equal(PublicListingTerritorySchema.safeParse(ok).success, true);
  });
});

describe("parseListingEnrichment", () => {
  test("accetta un record privato completo e valido", () => {
    const rec = {
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
      status: "draft",
      pois: [VALID_POI],
      retrievedAt: RETRIEVED,
      updatedAt: RETRIEVED,
    };
    assert.equal(parseListingEnrichment(rec).success, true);
  });

  test("rifiuta uno status sconosciuto", () => {
    const bad = { realSmartCode: "1", status: "published" };
    assert.equal(parseListingEnrichment(bad).success, false);
  });
});
