// Report operativo MENSILE di Territory V2 (Prompt 14) — PURO, deterministico, tracciabile alla fonte.
//
// Pensato per il retainer: copertura, freschezza, fallimenti, azioni editoriali, uso del provider ed
// engagement. Si calcola SOLO da metadati dei record e audit (già privacy-safe: niente coordinate,
// niente origini precise). Deterministico dato `now`/`month`: stessi input → stesso report, riesaminabile
// in git. L'engagement, se non raccolto, è dichiarato tale (mai inventato).

import type { EnrichmentMetadata } from "./store/repository";
import type { TerritoryAuditEvent, TerritoryAuditAction } from "./types";
import { monthKey } from "./budget";

const HOUR_MS = 60 * 60 * 1000;

export interface EngagementSummary {
  impressions: number;
  interactions: number;
}

export interface MonthlyReportInput {
  now: Date;
  /** Mese da riportare (YYYY-MM). Default: il mese di `now`. */
  month?: string;
  metadata: EnrichmentMetadata[];
  auditEvents: TerritoryAuditEvent[];
  /** Engagement dalla sezione pubblica, se raccolto (sink osservabilità). Null = non raccolto. */
  engagement?: EngagementSummary | null;
}

export interface MonthlyReport {
  period: string;
  coverage: {
    municipalitiesCovered: number;
    byStatus: { draft: number; approved: number; stale: number; failed: number; disabled: number };
    total: number;
  };
  freshness: {
    avgApprovedAgeHours: number | null;
    oldestApprovedAgeHours: number | null;
    staleRecords: number;
  };
  failures: { failedStatus: number; withFailureFlag: number };
  editorActions: { total: number; distinctEditors: number; byAction: Record<string, number> };
  providerUsage: { refreshesThisMonth: number };
  engagement: EngagementSummary | null;
}

function ageHours(iso: string, now: Date): number {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return 0;
  return Math.max(0, (now.getTime() - t) / HOUR_MS);
}

function round(n: number): number {
  return Math.round(n);
}

/** Costruisce il report mensile. Puro: nessun I/O, nessuna data implicita oltre a `now`. */
export function buildMonthlyReport(input: MonthlyReportInput): MonthlyReport {
  const period = input.month ?? monthKey(input.now);

  const byStatus = { draft: 0, approved: 0, stale: 0, failed: 0, disabled: 0 };
  const covered = new Set<string>();
  const approvedAges: number[] = [];
  let staleRecords = 0;
  let withFailureFlag = 0;
  let refreshesThisMonth = 0;

  for (const m of input.metadata) {
    if (m.status in byStatus) byStatus[m.status as keyof typeof byStatus] += 1;
    if (m.status === "approved") {
      covered.add(m.municipality);
      approvedAges.push(ageHours(m.retrievedAt, input.now));
    }
    if (m.status === "stale") staleRecords += 1;
    if (m.hasFailure) withFailureFlag += 1;
    if (monthKey(new Date(m.retrievedAt)) === period) refreshesThisMonth += 1;
  }

  // Azioni editoriali del mese, aggregate per tipo (mai il testo delle note, mai coordinate).
  const monthEvents = input.auditEvents.filter((e) => monthKey(new Date(e.at)) === period);
  const byAction: Record<string, number> = {};
  const editors = new Set<string>();
  for (const e of monthEvents) {
    byAction[e.action] = (byAction[e.action] ?? 0) + 1;
    editors.add(e.actor);
  }
  // Ordina le chiavi per determinismo.
  const byActionSorted: Record<string, number> = {};
  for (const k of Object.keys(byAction).sort()) byActionSorted[k] = byAction[k];

  return {
    period,
    coverage: { municipalitiesCovered: covered.size, byStatus, total: input.metadata.length },
    freshness: {
      avgApprovedAgeHours: approvedAges.length ? round(approvedAges.reduce((a, b) => a + b, 0) / approvedAges.length) : null,
      oldestApprovedAgeHours: approvedAges.length ? round(Math.max(...approvedAges)) : null,
      staleRecords,
    },
    failures: { failedStatus: byStatus.failed, withFailureFlag },
    editorActions: { total: monthEvents.length, distinctEditors: editors.size, byAction: byActionSorted },
    providerUsage: { refreshesThisMonth },
    engagement: input.engagement ?? null,
  };
}

/** JSON deterministico (chiavi già in ordine stabile) con `\n` finale. */
export function serializeMonthlyReportJson(report: MonthlyReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}

/** Markdown deterministico e leggibile per il retainer. */
export function renderMonthlyReportMarkdown(report: MonthlyReport): string {
  const l = (s: string) => `${s}\n`;
  const c = report.coverage;
  const f = report.freshness;
  let out = "";
  out += l(`# Report territoriale — ${report.period}`);
  out += l("");
  out += l("## Copertura");
  out += l(`- Comuni coperti (con dato approvato): ${c.municipalitiesCovered}`);
  out += l(`- Record totali: ${c.total} — approvati ${c.byStatus.approved}, bozze ${c.byStatus.draft}, stale ${c.byStatus.stale}, falliti ${c.byStatus.failed}, disabilitati ${c.byStatus.disabled}`);
  out += l("");
  out += l("## Freschezza");
  out += l(`- Età media del dato approvato: ${f.avgApprovedAgeHours ?? "—"} h`);
  out += l(`- Dato approvato più vecchio: ${f.oldestApprovedAgeHours ?? "—"} h`);
  out += l(`- Record stale: ${f.staleRecords}`);
  out += l("");
  out += l("## Fallimenti");
  out += l(`- In stato failed: ${report.failures.failedStatus} · con flag di fallimento: ${report.failures.withFailureFlag}`);
  out += l("");
  out += l("## Azioni editoriali");
  out += l(`- Totale nel mese: ${report.editorActions.total} · editor distinti: ${report.editorActions.distinctEditors}`);
  for (const [action, n] of Object.entries(report.editorActions.byAction)) out += l(`  - ${action}: ${n}`);
  out += l("");
  out += l("## Uso del provider");
  out += l(`- Refresh nel mese (proxy): ${report.providerUsage.refreshesThisMonth}`);
  out += l("");
  out += l("## Engagement");
  out += l(report.engagement ? `- Impression: ${report.engagement.impressions} · interazioni: ${report.engagement.interactions}` : "- Non raccolto in questo periodo.");
  return out;
}

/** Azioni editoriali "attese" (per documentare le chiavi possibili). */
export const EDITOR_ACTIONS: readonly TerritoryAuditAction[] = [
  "approve", "reject", "publish", "unpublish", "refresh", "fail", "note", "authorize-origin", "revoke-origin", "import",
];
