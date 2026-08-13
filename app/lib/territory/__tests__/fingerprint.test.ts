// Unit test del fingerprint deterministico.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { buildFingerprint, coordKeyOf, fingerprintsEqual } from "../fingerprint";
import { TERRITORY_SCHEMA_VERSION } from "../constants";

const BASE = {
  municipality: "tradate",
  origin: { lat: 45.708, lng: 8.906 },
  ultimaModifica: "2026-08-01",
};

describe("coordKeyOf", () => {
  test("serializza a 3 decimali stabili", () => {
    assert.equal(coordKeyOf({ lat: 45.708, lng: 8.906 }), "45.708,8.906");
  });

  test("micro-variazioni sotto la soglia → stessa chiave", () => {
    assert.equal(coordKeyOf({ lat: 45.7081, lng: 8.9059 }), coordKeyOf({ lat: 45.708, lng: 8.906 }));
  });
});

describe("buildFingerprint", () => {
  test("stesso input → stesso hash (deterministico)", () => {
    assert.equal(buildFingerprint(BASE).hash, buildFingerprint(BASE).hash);
  });

  test("include coordKey, schemaVersion e ultimaModifica", () => {
    const fp = buildFingerprint(BASE);
    assert.equal(fp.municipality, "tradate");
    assert.equal(fp.coordKey, "45.708,8.906");
    assert.equal(fp.ultimaModifica, "2026-08-01");
    assert.equal(fp.schemaVersion, TERRITORY_SCHEMA_VERSION);
    assert.match(fp.hash, /^[0-9a-f]{8}$/);
  });

  test("cambia il comune → hash diverso", () => {
    const other = buildFingerprint({ ...BASE, municipality: "venegono-superiore" });
    assert.notEqual(buildFingerprint(BASE).hash, other.hash);
  });

  test("cambia UltimaModifica → hash diverso", () => {
    const other = buildFingerprint({ ...BASE, ultimaModifica: "2026-08-12" });
    assert.notEqual(buildFingerprint(BASE).hash, other.hash);
  });

  test("cambia la coordinata oltre la soglia → hash diverso", () => {
    const other = buildFingerprint({ ...BASE, origin: { lat: 45.9, lng: 8.9 } });
    assert.notEqual(buildFingerprint(BASE).hash, other.hash);
  });

  test("micro-variazione della coordinata sotto la soglia → stesso hash", () => {
    const jittered = buildFingerprint({ ...BASE, origin: { lat: 45.7081, lng: 8.9059 } });
    assert.equal(buildFingerprint(BASE).hash, jittered.hash);
  });

  test("cambia lo schemaVersion → hash diverso", () => {
    const other = buildFingerprint({ ...BASE, schemaVersion: TERRITORY_SCHEMA_VERSION + 1 });
    assert.notEqual(buildFingerprint(BASE).hash, other.hash);
  });
});

describe("fingerprintsEqual", () => {
  test("true su impronte identiche, false se una è undefined", () => {
    const a = buildFingerprint(BASE);
    const b = buildFingerprint(BASE);
    assert.equal(fingerprintsEqual(a, b), true);
    assert.equal(fingerprintsEqual(a, undefined), false);
    assert.equal(fingerprintsEqual(undefined, undefined), false);
  });
});
