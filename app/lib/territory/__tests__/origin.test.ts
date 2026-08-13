// Test del risolutore d'origine (centroide comune dalla tabella esistente).

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { resolveOriginFromMunicipality } from "../origin";

describe("resolveOriginFromMunicipality", () => {
  test("comuni del pilota → centroide risolto", () => {
    for (const town of ["Tradate", "Venegono Superiore", "Venegono Inferiore", "Lonate Ceppino"]) {
      const origin = resolveOriginFromMunicipality(town);
      assert.ok(origin, `atteso centroide per ${town}`);
      assert.equal(origin.coordSource, "municipality-centroid");
      assert.ok(origin.coord.lat > 45 && origin.coord.lat < 46);
    }
  });

  test("grafie diverse → stessa origine", () => {
    assert.deepEqual(
      resolveOriginFromMunicipality("Venegono-Superiore"),
      resolveOriginFromMunicipality("venegono superiore"),
    );
  });

  test("comune sconosciuto → null (coordinate mancanti, non inventate)", () => {
    assert.equal(resolveOriginFromMunicipality("Atlantide"), null);
    assert.equal(resolveOriginFromMunicipality(""), null);
  });

  test("slug del comune normalizzato", () => {
    assert.equal(resolveOriginFromMunicipality("Venegono Superiore")?.municipality, "venegono-superiore");
  });
});
