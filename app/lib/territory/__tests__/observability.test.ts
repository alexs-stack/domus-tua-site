// Test dell'osservabilità di Territory V2 (Prompt 14): privacy degli eventi, salute aggregata contro
// soglie, budget/kill switch, report mensile deterministico. Nessuna coordinata/PII deve comparire.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  MemorySink,
  guarded,
  findPrivacyViolations,
  makeRunId,
  makeTurnId,
  sinkFromEnv,
  type TerritoryMetricEvent,
} from "../observe";
import { computeTerritoryHealth } from "../healthReport";
import { readThresholds } from "../thresholds";
import { evaluateCallBudget, readBudgets, callsThisMonth, monthKey } from "../budget";
import { selectProviderFromEnv } from "../provider/select";
import { readEnrichmentConfig } from "../config";
import { buildMonthlyReport, serializeMonthlyReportJson, renderMonthlyReportMarkdown } from "../opsReport";
import type { EnrichmentMetadata } from "../store/repository";
import type { TerritoryAuditEvent } from "../types";

const NOW = new Date("2026-08-14T10:00:00.000Z");

function meta(over: Partial<EnrichmentMetadata> & { realSmartCode: string; status: EnrichmentMetadata["status"] }): EnrichmentMetadata {
  return {
    realSmartCode: over.realSmartCode,
    municipality: over.municipality ?? "tradate",
    status: over.status,
    originPrecision: "municipality-centroid",
    fingerprintHash: "deadbeef",
    poiCount: over.poiCount ?? 4,
    approvedPoiCount: over.approvedPoiCount ?? 4,
    hasFailure: over.hasFailure ?? false,
    retrievedAt: over.retrievedAt ?? NOW.toISOString(),
    updatedAt: over.updatedAt ?? NOW.toISOString(),
  };
}

describe("privacy degli eventi", () => {
  test("un evento pulito non ha violazioni", () => {
    const e: TerritoryMetricEvent = { kind: "provider-call", provider: "osm-overpass", outcome: "ok", latencyMs: 120, municipality: "tradate", runId: "run_abc" };
    assert.deepEqual(findPrivacyViolations(e), []);
  });

  test("il guard SCARTA un evento con una coordinata iniettata", () => {
    const sink = new MemorySink();
    const g = guarded(sink);
    // Evento malevolo: municipality contiene una coordinata.
    g.emit({ kind: "public-impression", municipality: "45.7085,8.9065" } as TerritoryMetricEvent);
    assert.equal(sink.events.length, 0, "un evento con coordinata NON deve passare");
  });

  test("il guard lascia passare gli eventi puliti", () => {
    const sink = new MemorySink();
    const g = guarded(sink);
    g.emit({ kind: "geocode-call", outcome: "ok", latencyMs: 90, municipality: "tradate" });
    g.emit({ kind: "assistant-tool", tool: "get_area_profile", hadTerritory: true, turnId: makeTurnId() });
    assert.equal(sink.events.length, 2);
  });

  test("findPrivacyViolations intercetta un telefono", () => {
    const e = { kind: "public-impression", municipality: "chiama 0331 844898" } as TerritoryMetricEvent;
    assert.ok(findPrivacyViolations(e).length > 0);
  });

  test("gli ID di correlazione sono opachi e distinti per tipo", () => {
    assert.match(makeRunId(), /^run_[0-9a-f]{8}$/);
    assert.match(makeTurnId(), /^turn_[0-9a-f]{8}$/);
  });

  test("sinkFromEnv è nullo di default e non lancia", () => {
    const s = sinkFromEnv({});
    s.emit({ kind: "public-impression", municipality: "tradate" });
  });
});

describe("salute aggregata contro le soglie", () => {
  const t = readThresholds({});

  test("tutto approvato e fresco → ok", () => {
    const h = computeTerritoryHealth(
      [meta({ realSmartCode: "1", status: "approved" }), meta({ realSmartCode: "2", status: "approved", municipality: "venegono" })],
      { now: NOW, thresholds: t, enablementActive: true },
    );
    assert.equal(h.level, "ok");
    assert.equal(h.counts.approved, 2);
    assert.equal(h.municipalitiesCovered, 2);
  });

  test("molti stale → warning/critical sulla copertura stale", () => {
    const md = [
      meta({ realSmartCode: "a", status: "approved" }),
      meta({ realSmartCode: "b", status: "stale" }),
      meta({ realSmartCode: "c", status: "stale" }),
    ];
    const h = computeTerritoryHealth(md, { now: NOW, thresholds: t, enablementActive: true });
    // 2 stale su 3 (approved+stale) = 0.66 → oltre crit 0.4
    assert.equal(h.signals.find((s) => s.name === "stale-coverage")?.level, "critical");
    assert.equal(h.level, "critical");
  });

  test("feature attiva ma zero approvati → critico", () => {
    const h = computeTerritoryHealth([meta({ realSmartCode: "d", status: "draft" })], { now: NOW, thresholds: t, enablementActive: true });
    assert.equal(h.zeroApprovedAfterEnablement, true);
    assert.equal(h.level, "critical");
  });

  test("backlog vecchio → oldest-pending in allerta", () => {
    const old = meta({ realSmartCode: "e", status: "draft", updatedAt: "2026-08-01T00:00:00.000Z" }); // ~13 giorni
    const h = computeTerritoryHealth([old], { now: NOW, thresholds: t, enablementActive: false });
    assert.equal(h.signals.find((s) => s.name === "oldest-pending-hours")?.level, "critical");
  });

  test("nessuna coordinata/PII nell'output di salute", () => {
    const h = computeTerritoryHealth([meta({ realSmartCode: "f", status: "approved" })], { now: NOW, thresholds: t, enablementActive: true });
    const json = JSON.stringify(h);
    for (const bad of ["lat", "lng", "coord", "45.70", "approvedBy", "reviewer", "address"]) {
      assert.equal(json.includes(bad), false, `salute NON deve contenere "${bad}"`);
    }
  });
});

describe("budget e kill switch", () => {
  test("kill switch: nessuna nuova chiamata (POI o geocode)", () => {
    const b = readBudgets({ TERRITORY_KILL_SWITCH: "true" });
    assert.equal(evaluateCallBudget("poi", 0, b).allowed, false);
    assert.equal(evaluateCallBudget("geocode", 0, b).allowed, false);
  });

  test("budget mensile POI superato → bloccato; geocode separato resta consentito", () => {
    const b = readBudgets({ TERRITORY_POI_MONTHLY_BUDGET: "100" });
    assert.equal(evaluateCallBudget("poi", 100, b).allowed, false);
    assert.equal(evaluateCallBudget("poi", 99, b).allowed, true);
    // geocode ha budget proprio (qui illimitato) → consentito
    assert.equal(evaluateCallBudget("geocode", 100000, b).allowed, true);
  });

  test("kill switch consegna il provider reale DISABILITATO (i dati approvati restano serviti)", () => {
    const config = readEnrichmentConfig({});
    const choice = selectProviderFromEnv(config, { TERRITORY_PLACES_PROVIDER: "osm", TERRITORY_KILL_SWITCH: "true" });
    assert.equal(choice.isReal, true);
    assert.equal(choice.killed, true);
    assert.equal(choice.provider.enabled, false, "nessuna nuova chiamata esterna può partire");
  });

  test("callsThisMonth conta solo i profili del mese corrente", () => {
    const iso = (m: string) => `2026-${m}-05T00:00:00.000Z`;
    assert.equal(callsThisMonth([iso("08"), iso("08"), iso("07")], NOW), 2);
    assert.equal(monthKey(NOW), "2026-08");
  });
});

describe("report mensile deterministico", () => {
  const metadata: EnrichmentMetadata[] = [
    meta({ realSmartCode: "a", status: "approved", retrievedAt: "2026-08-02T00:00:00.000Z" }),
    meta({ realSmartCode: "b", status: "approved", municipality: "venegono", retrievedAt: "2026-08-03T00:00:00.000Z" }),
    meta({ realSmartCode: "c", status: "stale", retrievedAt: "2026-07-01T00:00:00.000Z" }),
    meta({ realSmartCode: "d", status: "failed", hasFailure: true, retrievedAt: "2026-08-10T00:00:00.000Z" }),
  ];
  const audit: TerritoryAuditEvent[] = [
    { id: "1", at: "2026-08-05T00:00:00.000Z", action: "approve", actor: "raffaela", realSmartCode: "a" },
    { id: "2", at: "2026-08-06T00:00:00.000Z", action: "approve", actor: "luca", realSmartCode: "b" },
    { id: "3", at: "2026-07-30T00:00:00.000Z", action: "reject", actor: "raffaela", realSmartCode: "x" }, // mese diverso
  ];

  test("aggrega copertura, freschezza, fallimenti e azioni del mese", () => {
    const r = buildMonthlyReport({ now: NOW, metadata, auditEvents: audit });
    assert.equal(r.period, "2026-08");
    assert.equal(r.coverage.municipalitiesCovered, 2);
    assert.equal(r.coverage.byStatus.approved, 2);
    assert.equal(r.failures.failedStatus, 1);
    assert.equal(r.editorActions.total, 2); // solo agosto
    assert.equal(r.editorActions.distinctEditors, 2);
    assert.equal(r.editorActions.byAction.approve, 2);
    assert.equal(r.providerUsage.refreshesThisMonth, 3); // a,b,d retrievedAt in agosto
    assert.equal(r.engagement, null);
  });

  test("stesso input → stesso JSON (deterministico)", () => {
    const j1 = serializeMonthlyReportJson(buildMonthlyReport({ now: NOW, metadata, auditEvents: audit }));
    const j2 = serializeMonthlyReportJson(buildMonthlyReport({ now: NOW, metadata, auditEvents: audit }));
    assert.equal(j1, j2);
  });

  test("il Markdown non contiene coordinate né testo delle note", () => {
    const md = renderMonthlyReportMarkdown(buildMonthlyReport({ now: NOW, metadata, auditEvents: audit }));
    for (const bad of ["45.70", "lat", "coord"]) assert.equal(md.includes(bad), false);
    assert.match(md, /Report territoriale — 2026-08/);
  });
});
