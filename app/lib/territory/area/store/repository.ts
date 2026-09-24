// Contratto dello storage del dominio d'AREA (Prompt 4).
//
// Un'interfaccia, più adattatori — memoria per i test, Supabase per la produzione — e UN solo
// contract test che entrambi devono superare: il comportamento non deve dipendere
// dall'implementazione. È la stessa forma di app/lib/territory/store/repository.ts, che copre le
// DISTANZE per-immobile; qui si copre la CONOSCENZA d'area. Vedi ADR-015 per il confine.
//
// INVARIANTI che il contratto impone a ogni adattatore, perché sono regole di dominio e non
// dettagli di persistenza:
//
//   1. NESSUN AUTO-APPROVE. Uno stato "approved" senza attore e istante viene rifiutato.
//   2. IDEMPOTENZA DEI JOB. Due chiamate con la stessa `idempotencyKey` producono UN job.
//      È l'unica difesa reale contro due sync concorrenti che scoprono lo stesso cambiamento.
//   3. AUDIT IN SOLA AGGIUNTA. Gli eventi non si modificano e non si cancellano.
//   4. ANTI-DUPLICATO SUI FATTI. Stesso testo + stessa fonte + stessa area = un fatto solo.
//   5. FAIL-CLOSED. Un adattatore non configurato LANCIA; non ripiega in silenzio sulla memoria
//      (una produzione che scrive in RAM perde le approvazioni al primo riavvio, senza un errore).

import type {
  AreaFact,
  AreaNarrative,
  AreaProfile,
  AreaReviewEvent,
  KnowledgeLocale,
} from "../types";

// ─────────────────────────────────────────────────────────────
// Errori
// ─────────────────────────────────────────────────────────────

export class AreaStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AreaStorageError";
  }
}

/** Violazione di una regola di dominio (approvazione senza attore, duplicato, audit riscritto). */
export class AreaIntegrityError extends AreaStorageError {
  constructor(message: string) {
    super(message);
    this.name = "AreaIntegrityError";
  }
}

/** Conflitto di concorrenza ottimistica su una scrittura con `ifVersion`. */
export class AreaConcurrencyError extends AreaStorageError {
  constructor(message: string) {
    super(message);
    this.name = "AreaConcurrencyError";
  }
}

// ─────────────────────────────────────────────────────────────
// Fonti e job — tipi di storage (le entità di dominio stanno in ../types)
// ─────────────────────────────────────────────────────────────

export type AreaSourceStatus = "active" | "changed" | "stale" | "unreachable" | "rejected";

export type AreaSourceType =
  | "municipality"
  | "province"
  | "region"
  | "national"
  | "transport-operator"
  | "healthcare"
  | "education"
  | "parks"
  | "secondary";

export interface AreaSourceRecord {
  sourceId: string;
  areaKey: string;
  url: string;
  canonicalUrl: string;
  owner: string;
  sourceType: AreaSourceType;
  retrievedAt: string;
  reviewBy: string;
  /** Impronta del contenuto: cambia → la fonte è cambiata e i fatti che ne dipendono vanno rivisti. */
  contentHash: string;
  status: AreaSourceStatus;
  lastHttpStatus?: number;
  metadata?: Record<string, unknown>;
}

export type AreaJobType =
  | "research-sources"
  | "extract-facts"
  | "generate-narrative"
  | "translate-narrative"
  | "compute-property-context"
  | "revalidate";

export type AreaJobState = "pending" | "leased" | "done" | "failed" | "dead-letter" | "cancelled";

export interface AreaJobRecord {
  idempotencyKey: string;
  jobType: AreaJobType;
  /** Chiave d'area o codice RealSmart, a seconda del tipo. */
  targetId: string;
  state: AreaJobState;
  attempts: number;
  /** Backoff: il job non è prendibile prima di questo istante. */
  availableAt: string;
  lockedBy?: string;
  lockedUntil?: string;
  /** Errore SANIFICATO: mai un URL con credenziali, mai un payload grezzo del provider. */
  lastError?: string;
  runMetadata?: Record<string, unknown>;
  createdAt: string;
  completedAt?: string;
}

/** Precisione della collocazione di un immobile: la stessa scala di AreaIdentity. */
export type PropertyLocationPrecision = "neighbourhood" | "municipality" | "unresolved";

/**
 * Il legame fra un IMMOBILE e la sua area, più ciò che è stato calcolato per lui.
 *
 * `sourceHash` è l'IMPRONTA DI COLLOCAZIONE (vedi ../automation/fingerprint.ts): dice se questo
 * immobile è cambiato in un modo che riguarda il territorio. Un cambio di prezzo non la muove,
 * ed è la ragione per cui esiste — senza, ogni ritocco di listino rigenererebbe la descrizione
 * d'area di tutto il comune.
 */
export interface PropertyAreaContextRecord {
  realSmartCode: string;
  areaKey: string;
  sourceHash: string;
  /** Origine PUBBLICA: tipo, etichetta leggibile, precisione. Mai coordinate. */
  publicOriginType: string;
  publicOriginLabel: string;
  locationPrecision: PropertyLocationPrecision;
  calculatedAt: string;
  status: "draft" | "approved" | "stale" | "rejected";
  approvedBy?: string;
  approvedAt?: string;
  /** true se l'immobile non è più nel feed (venduto/ritirato). Il profilo d'area NON si tocca. */
  retired?: boolean;
}

export interface AreaAutomationRun {
  runId: string;
  feedVersion?: string;
  startedAt: string;
  finishedAt?: string;
  discovered: number;
  changed: number;
  skipped: number;
  failed: number;
  providerCalls: number;
  aiTokens: number;
  costEur: number;
  durationMs?: number;
  deploymentVersion?: string;
  outcome?: "ok" | "partial" | "failed" | "budget-exhausted" | "killed";
}

/** Evento di revisione in ingresso: id e istante li assegna lo store. */
export type AreaReviewEventInput = Omit<AreaReviewEvent, "id" | "at" | "schemaVersion"> & {
  at?: string;
};

export interface WriteOptions {
  /** Concorrenza ottimistica: fallisce se la versione memorizzata non coincide. */
  ifVersion?: number;
}

// ─────────────────────────────────────────────────────────────
// Il contratto
// ─────────────────────────────────────────────────────────────

export interface AreaRepository {
  // ── Profili ────────────────────────────────────────────────
  getProfile(areaKey: string): Promise<AreaProfile | null>;
  putProfile(profile: AreaProfile, options?: WriteOptions): Promise<void>;
  /** Tutti i profili, opzionalmente filtrati per stato. Ordine stabile per `areaKey`. */
  listProfiles(filter?: { status?: AreaProfile["status"] }): Promise<AreaProfile[]>;
  /**
   * I profili di un comune, frazioni comprese. È la query che permette a una frazione di
   * riusare i fatti a scala comunale invece di ricominciare la ricerca da zero.
   */
  listProfilesInMunicipality(municipalityAreaKey: string): Promise<AreaProfile[]>;

  // ── Fonti ──────────────────────────────────────────────────
  getSource(sourceId: string): Promise<AreaSourceRecord | null>;
  /** Inserisce o aggiorna per `canonicalUrl`: rileggere la stessa fonte non crea una riga nuova. */
  upsertSource(source: AreaSourceRecord): Promise<void>;
  listSources(areaKey: string): Promise<AreaSourceRecord[]>;

  // ── Fatti ──────────────────────────────────────────────────
  getFact(factId: string): Promise<AreaFact | null>;
  /** Rifiuta un duplicato (stesso testo + stessa fonte + stessa area) con AreaIntegrityError. */
  putFact(areaKey: string, fact: AreaFact, options?: WriteOptions): Promise<void>;
  listFacts(areaKey: string, filter?: { status?: AreaFact["status"] }): Promise<AreaFact[]>;
  /**
   * I fatti PUBBLICABILI di un'area: approvati, freschi rispetto a `now`, senza conflitti.
   * La logica sta nello store perché è la stessa domanda che fanno pagina, chatbot e generatore,
   * e tre implementazioni della stessa condizione sono tre occasioni di divergere.
   */
  listPublishableFacts(areaKey: string, now: Date): Promise<AreaFact[]>;

  // ── Narrative ──────────────────────────────────────────────
  getNarrative(areaKey: string, locale: KnowledgeLocale): Promise<AreaNarrative | null>;
  /** Scrivere una nuova narrativa corrente rende `superseded` la precedente della stessa lingua. */
  putNarrative(narrative: AreaNarrative, options?: WriteOptions): Promise<void>;
  listNarratives(filter?: { status?: AreaNarrative["status"] }): Promise<AreaNarrative[]>;

  // ── Job ────────────────────────────────────────────────────
  /**
   * Accoda un job. Se `idempotencyKey` esiste già ritorna `false` e NON crea nulla:
   * due sync concorrenti sullo stesso cambiamento producono un job solo.
   */
  enqueueJob(job: AreaJobRecord): Promise<boolean>;
  getJob(idempotencyKey: string): Promise<AreaJobRecord | null>;
  /** Prende fino a `limit` job prendibili (`pending` e `availableAt` passato), e li marca `leased`. */
  leaseJobs(input: { holder: string; leaseUntil: string; now: Date; limit: number }): Promise<AreaJobRecord[]>;
  /** Chiude un job. `failed` con `attempts` oltre soglia va in `dead-letter`, non in loop. */
  completeJob(idempotencyKey: string, outcome: { state: AreaJobState; error?: string; at: string }): Promise<void>;
  listJobs(filter?: { state?: AreaJobState; targetId?: string }): Promise<AreaJobRecord[]>;

  // ── Contesto d'area per immobile ───────────────────────────
  getPropertyContext(realSmartCode: string): Promise<PropertyAreaContextRecord | null>;
  putPropertyContext(record: PropertyAreaContextRecord, options?: WriteOptions): Promise<void>;
  listPropertyContexts(filter?: { areaKey?: string; retired?: boolean }): Promise<PropertyAreaContextRecord[]>;

  // ── Audit ──────────────────────────────────────────────────
  /** Aggiunge un evento. Non esiste un metodo per modificarli o cancellarli: è voluto. */
  appendReviewEvent(event: AreaReviewEventInput): Promise<AreaReviewEvent>;
  listReviewEvents(filter?: {
    areaKey?: string;
    subjectId?: string;
    limit?: number;
  }): Promise<AreaReviewEvent[]>;

  // ── Esecuzioni ─────────────────────────────────────────────
  recordAutomationRun(run: AreaAutomationRun): Promise<void>;
  listAutomationRuns(limit?: number): Promise<AreaAutomationRun[]>;
}
