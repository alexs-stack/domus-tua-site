// Test del report del PILOTA (Prompt 17): determinismo, riuso del profilo (1 query/origine), nessun
// auto-approve, PII-safety (nessuna coordinata nel report/pacchetto).

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { buildPilotReport, renderPilotReportMarkdown, serializePilotReportJson } from "../pilot";
import type { ReviewItem } from "../review/service";
import type { TerritoryMetricsSnapshot } from "../metrics";
import type { TerritoryPoiCategory } from "../categories";

const GEN = "2026-08-14T10:00:00.000Z";

function reviewItem(code: string, municipality: string, category: TerritoryPoiCategory): ReviewItem {
  return {
    realSmartCode: code,
    municipality,
    status: "draft",
    originBasis: { precision: "municipality-centroid", label: municipality, accuracyMeters: 2000 },
    fingerprintHash: "abc",
    retrievedAt: GEN,
    pois: [
      { providerId: "node/1", category, name: "Luogo", distanceMeters: 200, approvalState: "draft", sourceOwner: "© OSM", sourceUrl: "https://www.openstreetmap.org/node/1", retrievedAt: GEN },
    ],
    diff: { added: [{ name: "Luogo", category, distanceMeters: 200 }], removed: [], unchanged: [] },
    audit: [],
    version: GEN,
  };
}

function metrics(providerCalls: number, refreshed: number): TerritoryMetricsSnapshot {
  return {
    listingsEvaluated: 0, eligible: 0, skippedUnchanged: 0, missingCoordinates: 0, missingCode: 0, disabledMunicipality: 0,
    providerCalls,
    providerFailuresByKind: { timeout: 0, "rate-limit": 0, network: 0, "invalid-response": 0, disabled: 0, unknown: 0 },
    rateLimitResponses: 0, draftsCreated: 0, skippedByBudget: 0, budgetLimit: null, budgetReached: false,
    profileCache: { hit: 0, refreshed, stale: 0, unavailable: 0, budgetSkipped: 0 },
    avgResultsPerCategory: { "railway-station": 0, pharmacy: 0, supermarket: 0, school: 0, park: 0 },
  };
}

const INPUT = {
  generatedAt: GEN,
  mode: "fixture" as const,
  pilotMunicipalities: ["tradate", "venegono-superiore"],
  listingsInScope: { tradate: 3, "venegono-superiore": 3 },
  reviewItems: [reviewItem("a", "tradate", "pharmacy"), reviewItem("b", "tradate", "school"), reviewItem("c", "venegono-superiore", "park")],
  areaProfiles: { tradate: null, "venegono-superiore": null },
  metrics: metrics(2, 2), // 6 immobili, 2 query → riuso 3/query
};

describe("buildPilotReport", () => {
  test("aggrega per comune con base d'origine e POI per categoria", () => {
    const r = buildPilotReport(INPUT);
    assert.equal(r.municipalities.length, 2);
    const tradate = r.municipalities.find((m) => m.municipality === "tradate")!;
    assert.equal(tradate.drafts, 2);
    assert.equal(tradate.originBasis?.precision, "municipality-centroid");
    assert.equal(tradate.poisByCategory.pharmacy, 1);
    assert.equal(tradate.poisByCategory.school, 1);
  });

  test("riuso del profilo: immobili per query = listings / providerCalls", () => {
    const r = buildPilotReport(INPUT);
    assert.equal(r.providerUsage.providerCalls, 2);
    assert.equal(r.providerUsage.listingsPerQuery, 3); // 6 immobili / 2 query
    assert.equal(r.providerUsage.uniqueOrigins, 2);
  });

  test("fatti d'area vuoti → stato 'empty-pending-research' e decisione in sospeso", () => {
    const r = buildPilotReport(INPUT);
    assert.ok(r.municipalities.every((m) => m.areaFactsStatus === "empty-pending-research"));
    assert.ok(r.pendingHumanDecisions.some((d) => /ricerca dei fatti d'area/.test(d)));
  });

  test("NESSUN auto-approve: la prima decisione in sospeso è l'approvazione dei draft", () => {
    const r = buildPilotReport(INPUT);
    assert.match(r.pendingHumanDecisions[0], /nessun draft è approvato automaticamente/i);
    // I draft restano draft nel report (non ci sono stati approvati inventati).
    assert.equal(r.totals.drafts, 3);
  });

  test("deterministico: stesso input → stesso JSON e Markdown", () => {
    assert.equal(serializePilotReportJson(buildPilotReport(INPUT)), serializePilotReportJson(buildPilotReport(INPUT)));
    assert.equal(renderPilotReportMarkdown(buildPilotReport(INPUT)), renderPilotReportMarkdown(buildPilotReport(INPUT)));
    // Comuni ordinati per determinismo.
    assert.deepEqual(buildPilotReport(INPUT).pilotMunicipalities, ["tradate", "venegono-superiore"]);
  });

  test("PII-safe: il report non contiene coordinate", () => {
    const raw = serializePilotReportJson(buildPilotReport(INPUT)) + renderPilotReportMarkdown(buildPilotReport(INPUT));
    for (const bad of ["\"lat\"", "\"lng\"", "\"coord\"", "45.70"]) assert.equal(raw.includes(bad), false);
  });
});
