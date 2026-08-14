// Unit test delle funzioni geografiche pure.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  isValidLat,
  isValidLng,
  isValidCoord,
  assertValidCoord,
  roundCoord,
  haversineMeters,
  normalizeMunicipality,
} from "../geo";

describe("validazione coordinate", () => {
  test("latitudine dentro/fuori dominio", () => {
    assert.equal(isValidLat(45.7), true);
    assert.equal(isValidLat(-90), true);
    assert.equal(isValidLat(90), true);
    assert.equal(isValidLat(90.1), false);
    assert.equal(isValidLat(-91), false);
    assert.equal(isValidLat(Number.NaN), false);
    assert.equal(isValidLat(Infinity), false);
  });

  test("longitudine dentro/fuori dominio", () => {
    assert.equal(isValidLng(8.9), true);
    assert.equal(isValidLng(-180), true);
    assert.equal(isValidLng(180), true);
    assert.equal(isValidLng(180.5), false);
    assert.equal(isValidLng(-181), false);
  });

  test("isValidCoord combina lat+lng", () => {
    assert.equal(isValidCoord({ lat: 45.7, lng: 8.9 }), true);
    assert.equal(isValidCoord({ lat: 91, lng: 8.9 }), false);
    assert.equal(isValidCoord({ lat: 45.7, lng: 200 }), false);
  });

  test("assertValidCoord lancia su coordinate impossibili", () => {
    assert.throws(() => assertValidCoord({ lat: 200, lng: 0 }));
    assert.doesNotThrow(() => assertValidCoord({ lat: 45.7, lng: 8.9 }));
  });
});

describe("roundCoord", () => {
  test("arrotonda a 3 decimali di default", () => {
    assert.deepEqual(roundCoord({ lat: 45.708123, lng: 8.906789 }), {
      lat: 45.708,
      lng: 8.907,
    });
  });

  test("normalizza -0 a 0", () => {
    const r = roundCoord({ lat: -0.0001, lng: -0.0001 });
    assert.equal(Object.is(r.lat, -0), false);
    assert.equal(r.lat, 0);
    assert.equal(r.lng, 0);
  });

  test("dp personalizzato", () => {
    assert.deepEqual(roundCoord({ lat: 45.708123, lng: 8.906789 }, 1), {
      lat: 45.7,
      lng: 8.9,
    });
  });
});

describe("haversineMeters", () => {
  test("0 per punti coincidenti", () => {
    assert.equal(haversineMeters({ lat: 45.7, lng: 8.9 }, { lat: 45.7, lng: 8.9 }), 0);
  });

  test("simmetrica", () => {
    const a = { lat: 45.708, lng: 8.906 };
    const b = { lat: 45.735, lng: 8.898 };
    assert.equal(haversineMeters(a, b), haversineMeters(b, a));
  });

  test("Tradate → Venegono Superiore ≈ 3 km (tolleranza 300 m)", () => {
    const d = haversineMeters({ lat: 45.708, lng: 8.906 }, { lat: 45.735, lng: 8.898 });
    assert.ok(Math.abs(d - 3050) < 300, `distanza inattesa: ${d} m`);
  });

  test("un grado di latitudine ≈ 111 km", () => {
    const d = haversineMeters({ lat: 45, lng: 8 }, { lat: 46, lng: 8 });
    assert.ok(Math.abs(d - 111_195) < 500, `distanza inattesa: ${d} m`);
  });

  test("lancia su coordinate non valide", () => {
    assert.throws(() => haversineMeters({ lat: 999, lng: 0 }, { lat: 0, lng: 0 }));
  });
});

describe("normalizeMunicipality", () => {
  test("minuscolo, accenti e separatori → slug con trattini", () => {
    assert.equal(normalizeMunicipality("Venegono Superiore"), "venegono-superiore");
    assert.equal(normalizeMunicipality("Gornate-Olona"), "gornate-olona");
    assert.equal(normalizeMunicipality("Gazzada Schianno"), "gazzada-schianno");
  });

  test("stessa località, grafie diverse → stessa chiave", () => {
    assert.equal(
      normalizeMunicipality("Venegono-Superiore"),
      normalizeMunicipality("venegono superiore"),
    );
  });

  test("toglie il suffisso provincia tra parentesi", () => {
    assert.equal(normalizeMunicipality("Tradate (VA)"), "tradate");
  });

  test("input vuoto/non stringa → stringa vuota", () => {
    assert.equal(normalizeMunicipality(""), "");
    assert.equal(normalizeMunicipality("   "), "");
    // @ts-expect-error test difensivo su input non stringa
    assert.equal(normalizeMunicipality(undefined), "");
  });
});
