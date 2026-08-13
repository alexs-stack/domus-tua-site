// Orchestrazione del sync feed → arricchimento (Prompt 7).
//
// Riusa il pipeline RealSmart esistente (il chiamante passa NormalizedProperty[] già parse+normalize)
// e il motore deterministico. Qui: selezione (comune/codice/limite/pilota), pianificazione a secco
// (nessuna chiamata al provider), esecuzione con concorrenza controllata, e un report aggregato.
//
// Il DRY-RUN non chiama mai il provider e non scrive: pianifica soltanto, per stimare le chiamate
// prima di eseguire.

import type { NormalizedProperty } from "../realsmart/types";
import { normalizeMunicipality } from "./geo";
import { decideEnrichment, enrichListing, type EnrichmentDeps } from "./engine";
import { resolveMunicipalityOrigin } from "./origin";
import { TerritoryRunMetrics, type TerritoryMetricsSnapshot } from "./metrics";
import type { EnrichmentStatus } from "./types";

/** Tetto di sicurezza: senza --limit esplicito si processano al massimo 5 immobili per run. */
export const DEFAULT_MAX_LISTINGS = 5;

export interface SyncOptions {
  /** Filtro per comune (nome libero, normalizzato internamente). */
  town?: string;
  /** Filtro per codici RealSmart espliciti. */
  codes?: string[];
  /** Limite di immobili processati. Default DEFAULT_MAX_LISTINGS. */
  limit?: number;
  /** Se true (default al CLI): pianifica soltanto, nessuna chiamata né scrittura. */
  dryRun: boolean;
  /** Concorrenza fra immobili. Default 1. */
  concurrency?: number;
  /** Tetto di chiamate al provider per questo run. Oltre, gli eleggibili vengono saltati. */
  maxCalls?: number | null;
}

export type SyncDecision =
  | "enrich"
  | "skip-unchanged"
  | "missing-coordinates"
  | "missing-code"
  | "disabled-municipality";

export interface SyncListingResult {
  realSmartCode: string;
  municipality: string;
  decision: SyncDecision;
  existingStatus: EnrichmentStatus | "none";
  /** Presente solo nelle esecuzioni reali (non dry-run). "skipped-budget" = tetto raggiunto. */
  outcome?: "enriched" | "failed" | "skipped-budget" | string;
}

export interface SyncReport {
  dryRun: boolean;
  totalConsidered: number;
  eligible: number;
  missingCode: number;
  missingCoordinates: number;
  disabledMunicipality: number;
  unchanged: number;
  /** Immobili che verrebbero arricchiti (decisione "enrich"). */
  wouldEnrich: number;
  /** Arricchiti con successo (0 in dry-run). */
  enriched: number;
  /** Falliti (0 in dry-run). */
  failed: number;
  /** Stima chiamate al provider PRIMA dell'esecuzione = numero di decisioni "enrich". */
  estimatedProviderCalls: number;
  /** Eleggibili saltati perché il tetto di chiamate del run era esaurito. */
  skippedByBudget: number;
  /** true se il tetto di chiamate è stato raggiunto durante il run. */
  budgetReached: boolean;
  /** Ripartizione per stato dei record già presenti nello store (fra gli eleggibili). */
  existing: Record<EnrichmentStatus | "none", number>;
  /** Metriche aggregate privacy-safe del run. */
  metrics: TerritoryMetricsSnapshot;
  results: SyncListingResult[];
}

const EMPTY_EXISTING: Record<EnrichmentStatus | "none", number> = {
  draft: 0,
  approved: 0,
  stale: 0,
  failed: 0,
  disabled: 0,
  none: 0,
};

/** Filtra e limita i candidati: comune → codice → SOLO comuni del pilota → limite. */
export function selectListings(
  listings: NormalizedProperty[],
  deps: EnrichmentDeps,
  options: SyncOptions,
): NormalizedProperty[] {
  const enabled = new Set(deps.config.enabledMunicipalities);
  let pool = listings;

  if (options.town) {
    const wanted = normalizeMunicipality(options.town);
    pool = pool.filter((p) => normalizeMunicipality(p.town) === wanted);
  }
  if (options.codes && options.codes.length > 0) {
    const set = new Set(options.codes);
    pool = pool.filter((p) => set.has(p.sourceRef?.codice ?? ""));
  }
  // Default sicuro: solo comuni del pilota, così il budget del limite non si spreca fuori area.
  pool = pool.filter((p) => enabled.has(normalizeMunicipality(p.town)));

  const limit = options.limit ?? DEFAULT_MAX_LISTINGS;
  return Number.isFinite(limit) && limit > 0 ? pool.slice(0, limit) : pool;
}

/** Pianifica un singolo immobile (decisione senza chiamate al provider). */
export async function planListing(
  property: NormalizedProperty,
  deps: EnrichmentDeps,
): Promise<SyncListingResult> {
  const resolveOrigin = deps.resolveOrigin ?? resolveMunicipalityOrigin;
  const code = property.sourceRef?.codice?.trim() ?? "";
  const existing = code ? await deps.repository.getListingEnrichment(code) : null;
  const decision = decideEnrichment(property, existing, deps.config, deps.now(), resolveOrigin);

  const base = {
    realSmartCode: code,
    existingStatus: (existing?.status ?? "none") as EnrichmentStatus | "none",
  };
  switch (decision.kind) {
    case "missing-code":
      return { ...base, municipality: "", decision: "missing-code" };
    case "missing-coordinates":
      return { ...base, municipality: "", decision: "missing-coordinates" };
    case "disabled-municipality":
      return { ...base, municipality: decision.municipality, decision: "disabled-municipality" };
    case "skip-unchanged":
      return { ...base, municipality: decision.origin.municipality, decision: "skip-unchanged" };
    case "enrich":
      return { ...base, municipality: decision.origin.municipality, decision: "enrich" };
  }
}

/** Esegue un piccolo pool con concorrenza fissa (default 1), preservando l'ordine dei risultati. */
async function mapPool<T, R>(items: T[], concurrency: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.max(1, concurrency) }, async () => {
    for (;;) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return results;
}

/** Aggrega i risultati per immobile in un report. */
function aggregate(
  results: SyncListingResult[],
  dryRun: boolean,
  metrics: TerritoryMetricsSnapshot,
): SyncReport {
  const existing: Record<EnrichmentStatus | "none", number> = { ...EMPTY_EXISTING };
  const report: SyncReport = {
    dryRun,
    totalConsidered: results.length,
    eligible: 0,
    missingCode: 0,
    missingCoordinates: 0,
    disabledMunicipality: 0,
    unchanged: 0,
    wouldEnrich: 0,
    enriched: 0,
    failed: 0,
    estimatedProviderCalls: 0,
    skippedByBudget: 0,
    budgetReached: metrics.budgetReached,
    existing,
    metrics,
    results,
  };

  for (const r of results) {
    existing[r.existingStatus] += 1;
    switch (r.decision) {
      case "missing-code":
        report.missingCode += 1;
        break;
      case "missing-coordinates":
        report.missingCoordinates += 1;
        break;
      case "disabled-municipality":
        report.disabledMunicipality += 1;
        break;
      case "skip-unchanged":
        report.eligible += 1;
        report.unchanged += 1;
        break;
      case "enrich":
        report.eligible += 1;
        report.wouldEnrich += 1;
        report.estimatedProviderCalls += 1;
        if (r.outcome === "enriched") report.enriched += 1;
        else if (r.outcome === "failed") report.failed += 1;
        else if (r.outcome === "skipped-budget") report.skippedByBudget += 1;
        break;
    }
  }
  return report;
}

/**
 * Sincronizza un insieme di immobili. In dry-run pianifica soltanto (nessuna chiamata, nessuna
 * scrittura). In esecuzione reale arricchisce solo i "nuovi o cambiati", con concorrenza controllata.
 */
export async function syncListings(
  listings: NormalizedProperty[],
  deps: EnrichmentDeps,
  options: SyncOptions,
): Promise<SyncReport> {
  const selected = selectListings(listings, deps, options);
  const concurrency = options.concurrency ?? deps.config.concurrency ?? 1;
  const maxCalls = options.maxCalls ?? deps.config.maxCallsPerRun ?? null;

  const metrics = new TerritoryRunMetrics(maxCalls);
  // Contatore di chiamate: incrementato SINCRONAMENTE prima dell'await, così anche con concorrenza
  // il tetto non viene superato (nessuna corsa fra il controllo e l'incremento).
  let callsMade = 0;

  const results = await mapPool(selected, concurrency, async (property) => {
    const plan = await planListing(property, deps);
    metrics.recordDecision(plan.decision);

    if (options.dryRun || plan.decision !== "enrich") return plan;

    // Budget: se il tetto è raggiunto, salta pulito senza chiamare il provider.
    if (maxCalls !== null && callsMade >= maxCalls) {
      metrics.recordBudgetSkip();
      return { ...plan, outcome: "skipped-budget" as const };
    }
    callsMade += 1;

    // Esecuzione reale: il motore rifà la decisione e chiama il provider una sola volta.
    const outcome = await enrichListing(property, deps);
    metrics.recordOutcome(outcome);
    return { ...plan, outcome: outcome.action };
  });

  return aggregate(results, options.dryRun, metrics.snapshot());
}
