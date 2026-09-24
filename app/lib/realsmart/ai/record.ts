// Record VERSIONATO della copy generata e sua configurazione.
//
// Il dato SORGENTE (RealSmart) resta immutabile: l'output generato vive a parte, versionato per
// annuncio + hash della fonte + versione del prompt, con provenienza (modello, timestamp, costo) e
// stato di revisione. Niente sostituisce il testo pubblico in automatico: la copy generata è una
// PROPOSTA finché una policy di revisione non l'approva.

/** Ciclo di vita di una copy generata. `published` è l'unico stato che il sito può applicare. */
export type CopyStatus = "draft" | "review" | "published" | "rejected";

/** Versione del prompt: cambiarla invalida l'idempotenza (rigenera). Bump manuale e consapevole. */
export const PROMPT_VERSION = "v1";

export interface GenerationCost {
  inputTokens: number;
  outputTokens: number;
  /** Costo stimato in USD (formula in generate.ts). Zero se non calcolabile. */
  usd: number;
}

/** Provenienza + esito di UNA generazione. Nessun contenuto sensibile, nessun segreto. */
export interface CopyProvenance {
  provider: string; //     "google" | "anthropic" | "mock"
  model: string; //        nome modello (pubblico)
  promptVersion: string;
  /** ISO 8601 dell'istante di generazione (iniettato: nessun Date.now nel core puro). */
  generatedAt: string;
  cost: GenerationCost;
}

export interface GeneratedCopyRecord {
  /** Codice RealSmart dell'immobile. */
  listingId: string;
  /** Hash dei campi sorgente + versione prompt: chiave di idempotenza. */
  sourceHash: string;
  status: CopyStatus;
  /** Paragrafi proposti (già passati per i guard deterministici). */
  paragraphs: string[];
  /** Avvisi non bloccanti emersi in validazione (per il revisore). */
  warnings: string[];
  provenance: CopyProvenance;
  /** Chi/quando ha approvato o respinto (impostato dalla review). */
  reviewedBy?: string;
  reviewedAt?: string;
}

// ── Configurazione operativa (costi/abuso) ───────────────────────────────────

/**
 * Interruttore generale della GENERAZIONE. Spento di default: nessuna chiamata al modello finché
 * non lo si accende di proposito. Distinto dall'APPLICAZIONE della copy pubblicata (che dipende
 * solo dall'esistenza di record `published` nello store).
 */
export function generationEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.REALSMART_AI_NORMALIZE === "true" && (env.GEMINI_API_KEY ?? "").trim().length > 0;
}

/** Kill switch: ferma la generazione a metà batch senza deploy (es. costi che salgono). */
export function generationKilled(env: Record<string, string | undefined> = process.env): boolean {
  return env.REALSMART_AI_KILL === "true";
}

export interface GenerationLimits {
  /** Immobili per esecuzione di batch (tetto duro). */
  maxBatch: number;
  /** Generazioni concorrenti verso il provider. */
  concurrency: number;
  /** Tentativi per singola generazione (con backoff). */
  retries: number;
  /** Timeout della singola chiamata al modello (ms). */
  timeoutMs: number;
  /** Tetto di spesa per esecuzione di batch (USD): oltre, il batch si ferma. */
  costCapUsd: number;
}

export const GENERATION_LIMITS: GenerationLimits = {
  maxBatch: Number(process.env.REALSMART_AI_MAX_BATCH) || 50,
  concurrency: Number(process.env.REALSMART_AI_CONCURRENCY) || 3,
  retries: 2,
  timeoutMs: Number(process.env.REALSMART_AI_TIMEOUT_MS) || 20_000,
  costCapUsd: Number(process.env.REALSMART_AI_COST_CAP_USD) || 2,
};
