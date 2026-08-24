// Test dei feature flag territoriali (Prompt 10): tutti spenti di default.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  isEnrichmentJobsEnabled,
  isPublicSectionEnabled,
  isAssistantTerritoryEnabled,
  isMetricsLogEnabled,
  isMunicipalityEnabled,
  territoryFlagsSnapshot,
} from "../flags";

describe("default a env vuoto", () => {
  const EMPTY = {} as Record<string, string | undefined>;

  test("ciò che SCRIVE o COSTA resta spento: job, assistente, log", () => {
    assert.equal(isEnrichmentJobsEnabled(EMPTY), false);
    assert.equal(isAssistantTerritoryEnabled(EMPTY), false);
    assert.equal(isMetricsLogEnabled(EMPTY), false);
  });

  test("la sezione pubblica è ACCESA: il fail-closed è il dato, non il flag", () => {
    // Cambiato di proposito. La sezione era spenta perché non c'era niente da mostrare; adesso
    // c'è, e senza fatti approvati la proiezione pubblica torna comunque `null` comune per
    // comune. Tenere anche un interruttore globale significava che approvare un fatto non
    // bastava a pubblicarlo.
    assert.equal(isPublicSectionEnabled(EMPTY), true);
  });

  test("e si spegne con un no esplicito", () => {
    assert.equal(isPublicSectionEnabled({ NEXT_PUBLIC_TERRITORY_SECTION_ENABLED: "false" }), false);
  });
});

describe("flag accesi solo con 'true' esplicito", () => {
  test("job", () => {
    assert.equal(isEnrichmentJobsEnabled({ TERRITORY_ENRICHMENT_ENABLED: "true" }), true);
    assert.equal(isEnrichmentJobsEnabled({ TERRITORY_ENRICHMENT_ENABLED: "1" }), false);
  });
  test("sezione pubblica e assistente", () => {
    assert.equal(isPublicSectionEnabled({ NEXT_PUBLIC_TERRITORY_SECTION_ENABLED: "true" }), true);
    assert.equal(isAssistantTerritoryEnabled({ TERRITORY_ASSISTANT_ENABLED: "true" }), true);
  });
});

describe("allowlist comuni del pilota", () => {
  test("i quattro comuni del pilota sono abilitati di default", () => {
    for (const town of ["Tradate", "Venegono Superiore", "Venegono Inferiore", "Lonate Ceppino"]) {
      assert.equal(isMunicipalityEnabled(town, {}), true);
    }
  });
  test("un comune fuori pilota non è abilitato", () => {
    assert.equal(isMunicipalityEnabled("Milano", {}), false);
  });
  test("TERRITORY_PILOT_TOWNS restringe l'allowlist", () => {
    assert.equal(isMunicipalityEnabled("Tradate", { TERRITORY_PILOT_TOWNS: "Venegono Superiore" }), false);
    assert.equal(isMunicipalityEnabled("Venegono Superiore", { TERRITORY_PILOT_TOWNS: "Venegono Superiore" }), true);
  });
});

describe("territoryFlagsSnapshot", () => {
  test("snapshot booleano, senza segreti", () => {
    const snap = territoryFlagsSnapshot({
      TERRITORY_ENRICHMENT_ENABLED: "true",
      NEXT_PUBLIC_TERRITORY_SECTION_ENABLED: "false",
    });
    assert.equal(snap.enrichmentJobs, true);
    // La sezione è accesa di default: per vederla `false` nello snapshot va spenta esplicitamente.
    assert.equal(snap.publicSection, false);
    assert.equal(snap.pilotMunicipalities, 4);
    const json = JSON.stringify(snap);
    assert.equal(json.includes("KEY"), false);
    assert.equal(json.includes("secret"), false);
  });
});
