// Metriche di run e logging PRIVACY-SAFE dell'arricchimento territoriale (Prompt 10).
//
// Cosa NON entra MAI qui: chiavi/segreti, coordinate esatte, indirizzi non pubblicati, payload
// grezzi del provider. Si preferiscono il codice RealSmart e il fingerprint TRONCATO. Le metriche
// sono conteggi aggregati; il logging strutturato è opt-in (TERRITORY_METRICS_LOG) e a bassissimo
// volume.

import { TERRITORY_POI_CATEGORIES, type TerritoryPoiCategory } from "./categories";
import type { EnrichmentFailureKind, ListingTerritoryEnrichment } from "./types";
import type { EnrichmentOutcome } from "./engine";
import type { SyncDecision } from "./sync";

const FAILURE_KINDS: EnrichmentFailureKind[] = [
  "timeout",
  "rate-limit",
  "network",
  "invalid-response",
  "disabled",
  "unknown",
];

export interface TerritoryMetricsSnapshot {
  listingsEvaluated: number;
  eligible: number;
  skippedUnchanged: number;
  missingCoordinates: number;
  missingCode: number;
  disabledMunicipality: number;
  providerCalls: number;
  providerFailuresByKind: Record<EnrichmentFailureKind, number>;
  rateLimitResponses: number;
  draftsCreated: number;
  skippedByBudget: number;
  budgetLimit: number | null;
  budgetReached: boolean;
  /** Media dei POI trattenuti per categoria (fra i record arricchiti in questo run). */
  avgResultsPerCategory: Record<TerritoryPoiCategory, number>;
}

/** Tronca un fingerprint a una forma sicura da loggare (mai l'origine, mai le coordinate). */
export function truncatedFingerprint(hash: string): string {
  return hash.slice(0, 8);
}

/** Accumulatore delle metriche di un run di sync. Alimentato dagli outcome del motore. */
export class TerritoryRunMetrics {
  private listingsEvaluated = 0;
  private eligible = 0;
  private skippedUnchanged = 0;
  private missingCoordinates = 0;
  private missingCode = 0;
  private disabledMunicipality = 0;
  private providerCalls = 0;
  private rateLimitResponses = 0;
  private draftsCreated = 0;
  private skippedByBudget = 0;
  private readonly failuresByKind: Record<EnrichmentFailureKind, number>;
  private readonly perCategorySum: Record<TerritoryPoiCategory, number>;

  constructor(private readonly budgetLimit: number | null = null) {
    this.failuresByKind = Object.fromEntries(FAILURE_KINDS.map((k) => [k, 0])) as Record<EnrichmentFailureKind, number>;
    this.perCategorySum = Object.fromEntries(TERRITORY_POI_CATEGORIES.map((c) => [c, 0])) as Record<TerritoryPoiCategory, number>;
  }

  /** Registra la DECISIONE (senza chiamata): conta valutati/skip/mancanti. */
  recordDecision(decision: SyncDecision): void {
    this.listingsEvaluated += 1;
    switch (decision) {
      case "missing-code":
        this.missingCode += 1;
        break;
      case "missing-coordinates":
        this.missingCoordinates += 1;
        break;
      case "disabled-municipality":
        this.disabledMunicipality += 1;
        break;
      case "skip-unchanged":
        this.eligible += 1;
        this.skippedUnchanged += 1;
        break;
      case "enrich":
        this.eligible += 1;
        break;
    }
  }

  /** Un immobile eleggibile è stato saltato perché il budget di chiamate era esaurito. */
  recordBudgetSkip(): void {
    this.skippedByBudget += 1;
  }

  /** Registra l'ESITO di una chiamata al provider (arricchito o fallito). */
  recordOutcome(outcome: EnrichmentOutcome): void {
    if (outcome.action === "enriched") {
      this.providerCalls += 1;
      this.draftsCreated += 1;
      this.addCategoryCounts(outcome.record);
    } else if (outcome.action === "failed") {
      this.providerCalls += 1;
      this.failuresByKind[outcome.failure.kind] += 1;
      if (outcome.failure.kind === "rate-limit") this.rateLimitResponses += 1;
    }
  }

  private addCategoryCounts(record: ListingTerritoryEnrichment): void {
    for (const category of TERRITORY_POI_CATEGORIES) {
      this.perCategorySum[category] += record.pois.filter((p) => p.category === category).length;
    }
  }

  snapshot(): TerritoryMetricsSnapshot {
    const avg = Object.fromEntries(
      TERRITORY_POI_CATEGORIES.map((c) => [
        c,
        this.draftsCreated > 0 ? Math.round((this.perCategorySum[c] / this.draftsCreated) * 10) / 10 : 0,
      ]),
    ) as Record<TerritoryPoiCategory, number>;

    return {
      listingsEvaluated: this.listingsEvaluated,
      eligible: this.eligible,
      skippedUnchanged: this.skippedUnchanged,
      missingCoordinates: this.missingCoordinates,
      missingCode: this.missingCode,
      disabledMunicipality: this.disabledMunicipality,
      providerCalls: this.providerCalls,
      providerFailuresByKind: { ...this.failuresByKind },
      rateLimitResponses: this.rateLimitResponses,
      draftsCreated: this.draftsCreated,
      skippedByBudget: this.skippedByBudget,
      budgetLimit: this.budgetLimit,
      budgetReached: this.budgetLimit !== null && this.skippedByBudget > 0,
      avgResultsPerCategory: avg,
    };
  }
}

/**
 * Log strutturato PRIVACY-SAFE (opt-in via TERRITORY_METRICS_LOG). Il chiamante passa solo campi
 * sicuri (codice RealSmart, fingerprint troncato, esito): questa funzione non aggiunge nulla e non
 * ha accesso a coordinate/segreti. Serve per "stale serviti o trattenuti" e simili.
 */
export function logTerritoryEvent(
  event: string,
  fields: Record<string, string | number | boolean>,
): void {
  if (process.env.TERRITORY_METRICS_LOG !== "true") return;
  // Solo una riga JSON compatta: nessuna coordinata, nessuna chiave (per contratto del chiamante).
  console.log(JSON.stringify({ evt: `territory.${event}`, ...fields }));
}
