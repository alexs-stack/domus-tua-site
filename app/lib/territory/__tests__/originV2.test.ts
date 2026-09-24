// Territory V2 — gerarchia di precisione dell'origine e semantica di verità.
//
// Verifica: i 4 livelli di precisione, la frase per-livello (mai "dall'immobile" per un centroide),
// l'autorizzazione OBBLIGATORIA per le origini a livello di immobile (mai dedotta), e il rifiuto
// strutturale di coordinate/etichette incoerenti nel pubblico.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  ListingTerritoryEnrichmentSchema,
  PublicListingTerritorySchema,
  PublicTerritoryPoiSchema,
  OriginPrecisionSchema,
  type OriginPrecision,
} from "../types";
import { describeOriginBasis } from "../view";
import { ORIGIN_ACCURACY_METERS } from "../constants";

const FP = {
  municipality: "tradate",
  coordKey: "45.708,8.906",
  ultimaModifica: "2026-08-01T00:00:00.000Z",
  schemaVersion: 2,
  hash: "abc123",
};

function record(over: Record<string, unknown> = {}) {
  return {
    schemaVersion: 2,
    realSmartCode: "1043",
    municipality: "tradate",
    origin: { lat: 45.708, lng: 8.906 },
    originPrecision: "municipality-centroid",
    originAccuracyMeters: 2000,
    originLabel: "Tradate",
    fingerprint: FP,
    status: "draft",
    pois: [],
    retrievedAt: "2026-08-13T10:00:00.000Z",
    updatedAt: "2026-08-13T10:00:00.000Z",
    ...over,
  };
}

const AUTH = {
  precision: "property-coordinate" as const,
  source: "consenso proprietario 2026-08",
  reviewedBy: "Raffaela",
  reviewedAt: "2026-08-10T09:00:00.000Z",
};

describe("i 4 livelli di precisione", () => {
  test("l'enum ha esattamente property/address/zone/municipality, dal più preciso", () => {
    assert.deepEqual(OriginPrecisionSchema.options, [
      "property-coordinate",
      "address-geocode",
      "zone-centroid",
      "municipality-centroid",
    ]);
  });
  test("ogni livello ha un raggio di accuratezza monotòno (più preciso = più piccolo)", () => {
    const p = ORIGIN_ACCURACY_METERS;
    assert.ok(
      p["property-coordinate"] < p["address-geocode"] &&
        p["address-geocode"] < p["zone-centroid"] &&
        p["zone-centroid"] < p["municipality-centroid"],
    );
  });
});

describe("frase per-livello: impossibile spacciare un centroide per l'immobile", () => {
  const cases: Array<[OriginPrecision, RegExp]> = [
    ["property-coordinate", /dall'immobile/],
    ["address-geocode", /dall'immobile/],
    ["zone-centroid", /centro della zona San Rocco/],
    ["municipality-centroid", /centro di Tradate/],
  ];
  for (const [precision, re] of cases) {
    test(`${precision} → "${re.source}"`, () => {
      const label = precision === "zone-centroid" ? "San Rocco" : "Tradate";
      const sentence = describeOriginBasis({ precision, label }, "it");
      assert.match(sentence, re);
      if (precision === "municipality-centroid" || precision === "zone-centroid") {
        assert.doesNotMatch(sentence, /dall'immobile/, "un centroide non è mai 'dall'immobile'");
      }
    });
  }
});

describe("autorizzazione a livello di immobile: obbligatoria e coerente, mai dedotta", () => {
  test("property-coordinate SENZA autorizzazione → schema RIFIUTA", () => {
    const r = ListingTerritoryEnrichmentSchema.safeParse(
      record({ originPrecision: "property-coordinate", originAccuracyMeters: 0 }),
    );
    assert.equal(r.success, false);
  });
  test("property-coordinate CON autorizzazione coerente → OK", () => {
    const r = ListingTerritoryEnrichmentSchema.safeParse(
      record({ originPrecision: "property-coordinate", originAccuracyMeters: 0, originAuthorization: AUTH }),
    );
    assert.equal(r.success, true, r.success ? "" : JSON.stringify(r.error?.issues));
  });
  test("autorizzazione con precisione INCOERENTE (address vs property) → RIFIUTA", () => {
    const r = ListingTerritoryEnrichmentSchema.safeParse(
      record({
        originPrecision: "property-coordinate",
        originAccuracyMeters: 0,
        originAuthorization: { ...AUTH, precision: "address-geocode" },
      }),
    );
    assert.equal(r.success, false);
  });
  test("municipality-centroid NON richiede autorizzazione", () => {
    assert.equal(ListingTerritoryEnrichmentSchema.safeParse(record()).success, true);
  });
});

describe("il pubblico rifiuta strutturalmente coordinate e campi interni", () => {
  const validPublic = {
    realSmartCode: "1043",
    municipality: "tradate",
    method: "straight-line" as const,
    originBasis: { precision: "municipality-centroid" as const, label: "Tradate" },
    retrievedAt: "2026-08-13T10:00:00.000Z",
    pois: [],
  };
  test("originBasis NON ammette una coordinata (strict)", () => {
    const leaked = {
      ...validPublic,
      originBasis: { precision: "municipality-centroid", label: "Tradate", lat: 45.7, lng: 8.9 },
    };
    assert.equal(PublicListingTerritorySchema.safeParse(leaked).success, false);
  });
  test("un POI pubblico con coord → RIFIUTATO", () => {
    const r = PublicTerritoryPoiSchema.safeParse({
      category: "pharmacy",
      name: "Farmacia",
      distanceMeters: 100,
      distanceMethod: "straight-line",
      provider: "osm-overpass",
      attribution: "© OSM",
      coord: { lat: 45.7, lng: 8.9 },
    });
    assert.equal(r.success, false);
  });
  test("la vista pubblica valida (senza coord) passa", () => {
    assert.equal(PublicListingTerritorySchema.safeParse(validPublic).success, true);
  });
});
