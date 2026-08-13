// Test delle metriche di run e del logging privacy-safe (Prompt 10).

import { test, describe, afterEach } from "node:test";
import assert from "node:assert/strict";

import { TerritoryRunMetrics, logTerritoryEvent, truncatedFingerprint } from "../metrics";
import { TERRITORY_SCHEMA_VERSION } from "../constants";
import type { EnrichmentOutcome } from "../engine";
import type { ListingTerritoryEnrichment, TerritoryPoi } from "../types";

function poi(category: TerritoryPoi["category"], name: string): TerritoryPoi {
  return {
    providerId: `node/${name}`,
    category,
    name,
    distanceMeters: 100,
    distanceMethod: "straight-line",
    source: { provider: "fake", retrievedAt: "2026-08-13T00:00:00.000Z", attribution: "© Test" },
    approval: { state: "draft" },
  };
}

function record(pois: TerritoryPoi[]): ListingTerritoryEnrichment {
  return {
    schemaVersion: TERRITORY_SCHEMA_VERSION,
    realSmartCode: "1043",
    municipality: "tradate",
    originPrecision: "municipality-centroid",
    originAccuracyMeters: 2000,
    originLabel: "Tradate",
    origin: { lat: 45.708, lng: 8.906 },
    fingerprint: { municipality: "tradate", coordKey: "45.708,8.906", ultimaModifica: "2026-08-01", schemaVersion: TERRITORY_SCHEMA_VERSION, hash: "deadbeefcafe1234" },
    status: "draft",
    pois,
    retrievedAt: "2026-08-13T00:00:00.000Z",
    updatedAt: "2026-08-13T00:00:00.000Z",
  };
}

const enriched = (pois: TerritoryPoi[]): EnrichmentOutcome => ({ action: "enriched", realSmartCode: "1043", record: record(pois) });
const failed = (kind: "rate-limit" | "timeout"): EnrichmentOutcome => ({
  action: "failed",
  realSmartCode: "1043",
  failure: { at: "2026-08-13T00:00:00.000Z", kind, reason: "x", provider: "osm-overpass" },
  preservedApproved: false,
});

describe("truncatedFingerprint", () => {
  test("tiene solo le prime 8 cifre", () => {
    assert.equal(truncatedFingerprint("deadbeefcafe1234"), "deadbeef");
  });
});

describe("TerritoryRunMetrics", () => {
  test("conta decisioni, chiamate, draft e media per categoria", () => {
    const m = new TerritoryRunMetrics(null);
    m.recordDecision("missing-coordinates");
    m.recordDecision("missing-code");
    m.recordDecision("disabled-municipality");
    m.recordDecision("skip-unchanged");
    m.recordDecision("enrich");
    m.recordDecision("enrich");
    m.recordOutcome(enriched([poi("pharmacy", "A"), poi("pharmacy", "B"), poi("park", "P")]));
    m.recordOutcome(enriched([poi("pharmacy", "C")]));

    const s = m.snapshot();
    assert.equal(s.listingsEvaluated, 6);
    assert.equal(s.missingCoordinates, 1);
    assert.equal(s.missingCode, 1);
    assert.equal(s.disabledMunicipality, 1);
    assert.equal(s.skippedUnchanged, 1);
    assert.equal(s.eligible, 3); // skip-unchanged + 2 enrich
    assert.equal(s.providerCalls, 2);
    assert.equal(s.draftsCreated, 2);
    // pharmacy: (2 + 1) / 2 = 1.5 ; park: (1 + 0) / 2 = 0.5
    assert.equal(s.avgResultsPerCategory.pharmacy, 1.5);
    assert.equal(s.avgResultsPerCategory.park, 0.5);
  });

  test("conta fallimenti per tipo e le risposte rate-limit", () => {
    const m = new TerritoryRunMetrics(null);
    m.recordOutcome(failed("rate-limit"));
    m.recordOutcome(failed("rate-limit"));
    m.recordOutcome(failed("timeout"));
    const s = m.snapshot();
    assert.equal(s.providerCalls, 3);
    assert.equal(s.providerFailuresByKind["rate-limit"], 2);
    assert.equal(s.providerFailuresByKind.timeout, 1);
    assert.equal(s.rateLimitResponses, 2);
  });

  test("budget: skip contati e budgetReached true quando c'è un tetto", () => {
    const m = new TerritoryRunMetrics(2);
    m.recordBudgetSkip();
    const s = m.snapshot();
    assert.equal(s.skippedByBudget, 1);
    assert.equal(s.budgetLimit, 2);
    assert.equal(s.budgetReached, true);
  });

  test("lo snapshot non contiene coordinate né chiavi", () => {
    const m = new TerritoryRunMetrics(null);
    m.recordOutcome(enriched([poi("school", "S")]));
    const json = JSON.stringify(m.snapshot());
    assert.equal(json.includes("lat"), false);
    assert.equal(json.includes("lng"), false);
    assert.equal(json.includes("coord"), false);
  });
});

describe("logTerritoryEvent — opt-in e privacy-safe", () => {
  const KEY = "TERRITORY_METRICS_LOG";
  const saved = process.env[KEY];
  const original = console.log;
  let lines: string[] = [];
  afterEach(() => {
    console.log = original;
    lines = [];
    if (saved === undefined) delete process.env[KEY];
    else process.env[KEY] = saved;
  });

  test("spento di default → nessun output", () => {
    delete process.env[KEY];
    console.log = (...a: unknown[]) => lines.push(a.join(" "));
    logTerritoryEvent("serve.public", { code: "1043", outcome: "served-approved" });
    assert.equal(lines.length, 0);
  });

  test("acceso → una riga JSON con i soli campi passati", () => {
    process.env[KEY] = "true";
    console.log = (...a: unknown[]) => lines.push(a.join(" "));
    logTerritoryEvent("serve.public", { code: "1043", fp: "deadbeef", outcome: "withheld-stale" });
    assert.equal(lines.length, 1);
    const parsed = JSON.parse(lines[0]);
    assert.equal(parsed.evt, "territory.serve.public");
    assert.equal(parsed.outcome, "withheld-stale");
    assert.equal(lines[0].includes("lat"), false);
  });
});
