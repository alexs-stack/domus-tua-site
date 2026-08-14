// Budget di costo e KILL SWITCH per le chiamate esterne di Territory V2 (Prompt 14).
//
// Anche i provider oggi gratuiti vanno tenuti a freno: un domani potrebbero far pagare, e comunque
// martellare un'istanza pubblica è scorretto. Due leve:
//   • KILL SWITCH (TERRITORY_KILL_SWITCH=true): spegne SUBITO ogni nuova chiamata esterna.
//   • BUDGET mensile: tetto di chiamate/mese, SEPARATO per POI e geocoding.
// In entrambi i casi si fermano solo le NUOVE chiamate: i dati già APPROVATI restano pubblici e
// serviti (le letture non passano dal provider). Nessun dato pubblico sparisce per un budget.

type EnvLike = Record<string, string | undefined>;

export type CallKind = "poi" | "geocode";

export interface TerritoryBudgets {
  killSwitch: boolean;
  /** Tetto mensile di chiamate POI; null = illimitato. */
  poiMonthly: number | null;
  /** Tetto mensile di chiamate di geocoding (contate a parte); null = illimitato. */
  geocodeMonthly: number | null;
}

function intOrNull(raw: string | undefined): number | null {
  if (raw === undefined || raw.trim() === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
}

export function readBudgets(env: EnvLike = process.env): TerritoryBudgets {
  return {
    killSwitch: env.TERRITORY_KILL_SWITCH === "true",
    poiMonthly: intOrNull(env.TERRITORY_POI_MONTHLY_BUDGET),
    geocodeMonthly: intOrNull(env.TERRITORY_GEOCODE_MONTHLY_BUDGET),
  };
}

export function isKillSwitchOn(env: EnvLike = process.env): boolean {
  return env.TERRITORY_KILL_SWITCH === "true";
}

export type BudgetDecision =
  | { allowed: true }
  | { allowed: false; reason: "kill-switch" | "budget-exceeded"; kind: CallKind; limit?: number; used: number };

/**
 * Decide se una NUOVA chiamata esterna è consentita. Pura e deterministica: il chiamante fornisce
 * quante chiamate di quel tipo sono già state fatte nel mese corrente. Il kill switch vince su tutto.
 */
export function evaluateCallBudget(
  kind: CallKind,
  usedThisMonth: number,
  budgets: TerritoryBudgets,
): BudgetDecision {
  if (budgets.killSwitch) return { allowed: false, reason: "kill-switch", kind, used: usedThisMonth };
  const limit = kind === "poi" ? budgets.poiMonthly : budgets.geocodeMonthly;
  if (limit !== null && usedThisMonth >= limit) {
    return { allowed: false, reason: "budget-exceeded", kind, limit, used: usedThisMonth };
  }
  return { allowed: true };
}

/** Chiave "mese" (YYYY-MM) da una data, per aggregare l'uso mensile in modo deterministico. */
export function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * Conta le chiamate al provider "di questo mese" come proxy deterministico e privacy-safe: i profili
 * comunali il cui `retrievedAt` cade nel mese di `now`. Serve al gate del budget senza nuova
 * infrastruttura di conteggio.
 */
export function callsThisMonth(retrievedAts: string[], now: Date): number {
  const key = monthKey(now);
  return retrievedAts.filter((iso) => {
    const d = new Date(iso);
    return !Number.isNaN(d.getTime()) && monthKey(d) === key;
  }).length;
}
