// Unit test del fingerprint dell'ORIGINE DI QUERY (Prompt 5).
//
// Keyed su coordinata + raggio + categorie + provider + schema — NON sulla UltimaModifica: un edit
// non-di-posizione non cambia l'impronta (stessa query → stessa cache).

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { buildFingerprint, coordKeyOf, categoriesKeyOf, fingerprintsEqual } from "../fingerprint";
import { TERRITORY_SCHEMA_VERSION } from "../constants";

import type { FingerprintInput } from "../fingerprint";

const BASE: FingerprintInput = {
  municipality: "tradate",
  origin: { lat: 45.708, lng: 8.906 },
  radiusMeters: 1500,
  categories: ["pharmacy", "park", "school"],
  provider: "fake",
};

describe("coordKeyOf / categoriesKeyOf", () => {
  test("coordKeyOf serializza a 3 decimali stabili", () => {
    assert.equal(coordKeyOf({ lat: 45.708, lng: 8.906 }), "45.708,8.906");
  });
  test("micro-variazioni sotto la soglia → stessa chiave", () => {
    assert.equal(coordKeyOf({ lat: 45.7081, lng: 8.9059 }), coordKeyOf({ lat: 45.708, lng: 8.906 }));
  });
  test("categoriesKeyOf è ORDINE-INDIPENDENTE e deduplica", () => {
    assert.equal(categoriesKeyOf(["park", "pharmacy"]), categoriesKeyOf(["pharmacy", "park"]));
    assert.equal(categoriesKeyOf(["park", "park", "pharmacy"]), "park,pharmacy");
  });
});

describe("buildFingerprint", () => {
  test("stesso input → stesso hash (deterministico)", () => {
    assert.equal(buildFingerprint(BASE).hash, buildFingerprint(BASE).hash);
  });

  test("il campo ultimaModifica è VUOTO (deprecato, non entra più nell'hash)", () => {
    const fp = buildFingerprint(BASE);
    assert.equal(fp.municipality, "tradate");
    assert.equal(fp.coordKey, "45.708,8.906");
    assert.equal(fp.ultimaModifica, "");
    assert.equal(fp.schemaVersion, TERRITORY_SCHEMA_VERSION);
    assert.match(fp.hash, /^[0-9a-f]{8}$/);
  });

  test("l'ordine delle categorie NON cambia l'hash", () => {
    const a = buildFingerprint(BASE);
    const b = buildFingerprint({ ...BASE, categories: ["school", "pharmacy", "park"] as const });
    assert.equal(a.hash, b.hash);
  });

  const changes: Array<[string, Partial<typeof BASE>]> = [
    ["comune", { municipality: "venegono-superiore" }],
    ["coordinata oltre soglia", { origin: { lat: 45.9, lng: 8.9 } }],
    ["raggio", { radiusMeters: 2000 }],
    ["categorie", { categories: ["pharmacy", "park"] as const }],
    ["provider", { provider: "osm-overpass" as const }],
  ];
  for (const [what, over] of changes) {
    test(`cambia ${what} → hash diverso`, () => {
      assert.notEqual(buildFingerprint(BASE).hash, buildFingerprint({ ...BASE, ...over }).hash);
    });
  }

  test("cambia lo schemaVersion → hash diverso", () => {
    const other = buildFingerprint({ ...BASE, schemaVersion: TERRITORY_SCHEMA_VERSION + 1 });
    assert.notEqual(buildFingerprint(BASE).hash, other.hash);
  });

  test("micro-variazione della coordinata sotto la soglia → stesso hash", () => {
    const jittered = buildFingerprint({ ...BASE, origin: { lat: 45.7081, lng: 8.9059 } });
    assert.equal(buildFingerprint(BASE).hash, jittered.hash);
  });
});

describe("fingerprintsEqual", () => {
  test("true su impronte identiche, false se una è undefined", () => {
    assert.equal(fingerprintsEqual(buildFingerprint(BASE), buildFingerprint(BASE)), true);
    assert.equal(fingerprintsEqual(buildFingerprint(BASE), undefined), false);
    assert.equal(fingerprintsEqual(undefined, undefined), false);
  });
});
