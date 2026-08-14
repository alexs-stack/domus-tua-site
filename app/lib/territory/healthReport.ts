// Salute AGGREGATA di Territory V2 (Prompt 14) — calcolata SOLO da conteggi, senza toccare origini.
//
// Da qui viene lo stato che /api/health espone: numeri aggregati, comuni "grossi" e un livello
// ok/warning/critical. NIENTE nomi di revisori, NIENTE origini precise, NIENTE dettagli di fonte.
// Deterministico dato `now`: la stessa istantanea produce lo stesso stato.

import type { EnrichmentMetadata } from "./store/repository";
import type { TerritoryAuditEvent } from "./types";
import {
  classifyAscending,
  worst,
  type HealthLevel,
  type TerritoryThresholds,
} from "./thresholds";

const HOUR_MS = 60 * 60 * 1000;

export interface HealthSignal {
  name: string;
  level: HealthLevel;
  /** Valore misurato (numero) per il runbook; mai una coordinata. */
  value: number;
}

export interface TerritoryHealth {
  level: HealthLevel;
  counts: { draft: number; approved: number; stale: number; failed: number; disabled: number; total: number };
  /** Comuni con almeno un record approvato (copertura). */
  municipalitiesCovered: number;
  staleCoverage: number;
  backlog: number;
  oldestPendingHours: number;
  providerErrorRate: number;
  avgApprovalTurnaroundHours: number | null;
  /** true se la feature è attiva ma non esiste alcun record approvato (allarme di abilitazione). */
  zeroApprovedAfterEnablement: boolean;
  signals: HealthSignal[];
}

export interface HealthOptions {
  now: Date;
  thresholds: TerritoryThresholds;
  /** true se la feature è stata ABILITATA: allora "zero approvati" è critico. */
  enablementActive: boolean;
  /**
   * Eventi di audit, per calcolare il turnaround di approvazione REALE (comparsa del record →
   * evento `approve`) invece di un'approssimazione. Se assenti, il turnaround resta `null`:
   * meglio "non misurato" che un numero che non significa ciò che dichiara.
   */
  auditEvents?: readonly TerritoryAuditEvent[];
}

/**
 * Turnaround di approvazione REALE, in ore: per ogni immobile approvato, distanza fra il PRIMO
 * evento che lo riguarda (creazione/refresh della bozza) e il suo evento `approve`. Solo coppie
 * complete; nessuna coppia → null (non misurato).
 */
function approvalTurnaroundHours(events: readonly TerritoryAuditEvent[]): number | null {
  const first = new Map<string, number>();
  const approved = new Map<string, number>();
  for (const e of events) {
    const code = e.realSmartCode;
    if (!code) continue;
    const at = Date.parse(e.at);
    if (Number.isNaN(at)) continue;
    const prev = first.get(code);
    if (prev === undefined || at < prev) first.set(code, at);
    if (e.action === "approve") {
      const prevOk = approved.get(code);
      // Prima approvazione: è quella che misura l'attesa iniziale della review.
      if (prevOk === undefined || at < prevOk) approved.set(code, at);
    }
  }
  const durations: number[] = [];
  for (const [code, okAt] of approved) {
    const start = first.get(code);
    if (start === undefined || okAt < start) continue;
    durations.push((okAt - start) / HOUR_MS);
  }
  if (durations.length === 0) return null;
  return durations.reduce((a, b) => a + b, 0) / durations.length;
}

function ageHours(iso: string, now: Date): number {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return 0;
  return Math.max(0, (now.getTime() - t) / HOUR_MS);
}

/**
 * Calcola la salute aggregata dai metadati dei record (nessuna coordinata è presente lì). Un
 * operatore può capire se il territorio è sano SENZA aprire il database.
 */
export function computeTerritoryHealth(
  metadata: EnrichmentMetadata[],
  options: HealthOptions,
): TerritoryHealth {
  const counts = { draft: 0, approved: 0, stale: 0, failed: 0, disabled: 0, total: metadata.length };
  const coveredMunicipalities = new Set<string>();
  const pendingAges: number[] = []; // draft + failed in attesa di intervento

  for (const m of metadata) {
    if (m.status in counts) (counts as Record<string, number>)[m.status] += 1;
    if (m.status === "approved") coveredMunicipalities.add(m.municipality);
    if (m.status === "draft" || m.status === "failed") pendingAges.push(ageHours(m.updatedAt, options.now));
  }

  const staleDenom = counts.approved + counts.stale;
  const staleCoverage = staleDenom > 0 ? counts.stale / staleDenom : 0;
  const backlog = counts.draft + counts.failed;
  const oldestPendingHours = pendingAges.length > 0 ? Math.max(...pendingAges) : 0;
  const providerErrorRate = counts.total > 0 ? counts.failed / counts.total : 0;
  // Turnaround dalla STORIA reale (audit), non da un'approssimazione sui timestamp del record.
  const avgApprovalTurnaroundHours = options.auditEvents ? approvalTurnaroundHours(options.auditEvents) : null;
  const zeroApprovedAfterEnablement = options.enablementActive && counts.approved === 0;

  const t = options.thresholds;
  const signals: HealthSignal[] = [
    { name: "stale-coverage", level: classifyAscending(staleCoverage, t.staleCoverageWarn, t.staleCoverageCrit), value: staleCoverage },
    { name: "backlog", level: classifyAscending(backlog, t.backlogWarn, t.backlogCrit), value: backlog },
    { name: "oldest-pending-hours", level: classifyAscending(oldestPendingHours, t.oldestPendingHoursWarn, t.oldestPendingHoursCrit), value: Math.round(oldestPendingHours) },
    { name: "provider-error-rate", level: classifyAscending(providerErrorRate, t.providerErrorRateWarn, t.providerErrorRateCrit), value: providerErrorRate },
    { name: "zero-approved-after-enablement", level: zeroApprovedAfterEnablement ? "critical" : "ok", value: zeroApprovedAfterEnablement ? 1 : 0 },
  ];

  const level = signals.reduce<HealthLevel>((acc, s) => worst(acc, s.level), "ok");

  return {
    level,
    counts,
    municipalitiesCovered: coveredMunicipalities.size,
    staleCoverage,
    backlog,
    oldestPendingHours,
    providerErrorRate,
    avgApprovalTurnaroundHours,
    zeroApprovedAfterEnablement,
    signals,
  };
}
