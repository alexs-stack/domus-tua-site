// Soglie di allerta per Territory V2 (Prompt 14).
//
// Due livelli: WARNING (da tenere d'occhio) e CRITICAL (da intervenire). Numeri conservativi e
// configurabili via env: un pilota piccolo non deve gridare al fuoco, ma un backlog che cresce o un
// tasso d'errore alto devono emergere SENZA guardare il database.

type EnvLike = Record<string, string | undefined>;

function num(env: EnvLike, key: string, fallback: number): number {
  const raw = env[key];
  if (raw === undefined) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export interface TerritoryThresholds {
  /** Copertura stale (stale / (approved+stale)): oltre = degrado dei dati pubblici. */
  staleCoverageWarn: number; // es. 0.2
  staleCoverageCrit: number; // es. 0.4
  /** Backlog di review (draft+failed in attesa): numeri assoluti. */
  backlogWarn: number;
  backlogCrit: number;
  /** Età (ore) del più vecchio elemento in attesa di review. */
  oldestPendingHoursWarn: number;
  oldestPendingHoursCrit: number;
  /** Tasso d'errore dei profili (failed / totale profili). */
  providerErrorRateWarn: number;
  providerErrorRateCrit: number;
}

export function readThresholds(env: EnvLike = process.env): TerritoryThresholds {
  return {
    staleCoverageWarn: num(env, "TERRITORY_STALE_COVERAGE_WARN", 0.2),
    staleCoverageCrit: num(env, "TERRITORY_STALE_COVERAGE_CRIT", 0.4),
    backlogWarn: num(env, "TERRITORY_BACKLOG_WARN", 20),
    backlogCrit: num(env, "TERRITORY_BACKLOG_CRIT", 50),
    oldestPendingHoursWarn: num(env, "TERRITORY_OLDEST_PENDING_HOURS_WARN", 72),
    oldestPendingHoursCrit: num(env, "TERRITORY_OLDEST_PENDING_HOURS_CRIT", 168),
    providerErrorRateWarn: num(env, "TERRITORY_PROVIDER_ERROR_RATE_WARN", 0.25),
    providerErrorRateCrit: num(env, "TERRITORY_PROVIDER_ERROR_RATE_CRIT", 0.5),
  };
}

export type HealthLevel = "ok" | "warning" | "critical";

/** Peggiore fra due livelli (critical > warning > ok). */
export function worst(a: HealthLevel, b: HealthLevel): HealthLevel {
  const rank: Record<HealthLevel, number> = { ok: 0, warning: 1, critical: 2 };
  return rank[a] >= rank[b] ? a : b;
}

/** Classifica un valore "più alto è peggio" contro soglie warn/crit. */
export function classifyAscending(value: number, warn: number, crit: number): HealthLevel {
  if (value >= crit) return "critical";
  if (value >= warn) return "warning";
  return "ok";
}
