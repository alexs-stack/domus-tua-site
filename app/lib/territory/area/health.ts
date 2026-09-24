// STATO DI SALUTE della pipeline d'area, e le soglie che devono svegliare qualcuno (Prompt 15).
//
// La domanda a cui risponde: *l'automazione sta facendo il suo lavoro, o è ferma da giorni senza
// che nessuno se ne sia accorto?* È la modalità di guasto tipica di una pipeline editoriale —
// non si rompe con un errore, smette di produrre. Il sito continua a funzionare, le pagine
// continuano a mostrare l'ultimo dato approvato, e l'unica differenza è che quel dato invecchia.
//
// COSA RENDE UTILE UNA METRICA QUI. Non "quanti fatti ci sono" ma "quanti fatti sono FERMI":
// bozze mai riviste, fonti scadute, narrative in attesa da settimane, job in lettera morta.
// Il numero che conta è sempre quello che nessuno guarderebbe di sua iniziativa.
//
// PRIVACY. Questo modulo produce SOLO conteggi, enum e chiavi d'area (che sono già pubbliche:
// compaiono nelle URL). Nessuna coordinata, nessun indirizzo, nessun nome di revisore — la
// stessa regola di app/lib/territory/observe.ts, e `assertLogSafe` qui sotto la fa rispettare.

import type { AreaRepository } from "./store/repository";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface AreaHealthSnapshot {
  at: string;

  // ── Copertura ────────────────────────────────────────────
  /** Immobili con un contesto d'area, sul totale noto. */
  listingsWithArea: number;
  listingsRetired: number;
  /** Immobili senza area risolvibile: restano in pagina, ma fuori dalla pipeline. */
  listingsWithoutArea: number;
  /** Aree su cui insiste almeno un immobile. */
  areasCovered: number;
  /** Aree con una narrativa APPROVATA: la copertura che si vede davvero in pagina. */
  areasPublished: number;

  // ── Stato del lavoro ─────────────────────────────────────
  profilesByStatus: Record<string, number>;
  factsByStatus: Record<string, number>;
  narrativesByStatus: Record<string, number>;
  jobsByState: Record<string, number>;

  // ── Ciò che è FERMO ──────────────────────────────────────
  /** Fonti oltre la data di revisione: i fatti che ne dipendono non sono più pubblicabili. */
  staleSources: number;
  /** Fatti oltre la data di revisione. */
  staleFacts: number;
  /** Narrative in attesa di approvazione. */
  narrativesAwaitingApproval: number;
  /** Narrative in attesa da più di `stuckAfterDays`: la coda editoriale è ferma. */
  narrativesStuck: number;
  /** Job che non riproveranno più. Ogni lettera morta è lavoro perso in silenzio. */
  deadLetterJobs: number;
  /** Job falliti almeno una volta e ancora in corsa. */
  retryingJobs: number;

  // ── Esecuzioni ───────────────────────────────────────────
  lastRunAt: string | null;
  /** Ore dall'ultima esecuzione. `null` se non ce n'è mai stata una. */
  hoursSinceLastRun: number | null;
  lastRunOutcome: string | null;
  providerCalls: number;
  aiTokens: number;
  costEur: number;

  // ── Qualità ──────────────────────────────────────────────
  /** Punteggio medio delle narrative che ne hanno uno. `null` se nessuna. */
  averageQualityScore: number | null;
}

export interface AreaHealthOptions {
  now: Date;
  /** Oltre queste ore senza esecuzioni, la sincronizzazione è considerata ferma. Default 6. */
  syncSlaHours?: number;
  /** Oltre questi giorni in attesa, una narrativa è "bloccata". Default 14. */
  stuckAfterDays?: number;
}

function tally<T extends string>(values: readonly T[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const v of values) out[v] = (out[v] ?? 0) + 1;
  return out;
}

/**
 * Raccoglie lo stato di salute leggendo lo store. Nessuna chiamata esterna: è una fotografia di
 * ciò che il database sa già, quindi si può eseguire spesso e a costo trascurabile.
 */
export async function collectAreaHealth(
  repo: AreaRepository,
  options: AreaHealthOptions,
): Promise<AreaHealthSnapshot> {
  const now = options.now;
  const stuckAfterDays = options.stuckAfterDays ?? 14;

  const [profiles, contexts, jobs, runs, narratives] = await Promise.all([
    repo.listProfiles(),
    repo.listPropertyContexts(),
    repo.listJobs(),
    repo.listAutomationRuns(1),
    repo.listNarratives(),
  ]);

  // Fatti e fonti si contano per area: lo store non espone un elenco globale, e va bene così —
  // una query "tutti i fatti" su un catalogo cresciuto non è mai ciò che si vuole davvero.
  const factStatuses: string[] = [];
  let staleFacts = 0;
  let staleSources = 0;
  for (const profile of profiles) {
    for (const fact of await repo.listFacts(profile.areaKey)) {
      factStatuses.push(fact.status);
      if (Date.parse(fact.reviewBy) < now.getTime()) staleFacts++;
    }
    for (const source of await repo.listSources(profile.areaKey)) {
      if (source.status === "stale" || Date.parse(source.reviewBy) < now.getTime()) staleSources++;
    }
  }

  const activeContexts = contexts.filter((c) => !c.retired);
  const publishedAreas = new Set(
    narratives.filter((n) => n.status === "approved").map((n) => n.areaKey),
  );
  const scored = narratives.map((n) => n.qualityScore).filter((s): s is number => typeof s === "number");

  const awaiting = narratives.filter((n) => n.status === "draft");
  const stuckBefore = now.getTime() - stuckAfterDays * DAY_MS;

  const lastRun = runs[0] ?? null;

  return {
    at: now.toISOString(),

    listingsWithArea: activeContexts.filter((c) => c.locationPrecision !== "unresolved").length,
    listingsRetired: contexts.filter((c) => c.retired).length,
    listingsWithoutArea: activeContexts.filter((c) => c.locationPrecision === "unresolved").length,
    areasCovered: new Set(activeContexts.map((c) => c.areaKey)).size,
    areasPublished: publishedAreas.size,

    profilesByStatus: tally(profiles.map((p) => p.status)),
    factsByStatus: tally(factStatuses),
    narrativesByStatus: tally(narratives.map((n) => n.status)),
    jobsByState: tally(jobs.map((j) => j.state)),

    staleSources,
    staleFacts,
    narrativesAwaitingApproval: awaiting.length,
    narrativesStuck: awaiting.filter((n) => Date.parse(n.generatedAt) < stuckBefore).length,
    deadLetterJobs: jobs.filter((j) => j.state === "dead-letter").length,
    retryingJobs: jobs.filter((j) => j.attempts > 0 && j.state === "pending").length,

    lastRunAt: lastRun?.startedAt ?? null,
    hoursSinceLastRun: lastRun
      ? Math.round(((now.getTime() - Date.parse(lastRun.startedAt)) / 3_600_000) * 10) / 10
      : null,
    lastRunOutcome: lastRun?.outcome ?? null,
    providerCalls: lastRun?.providerCalls ?? 0,
    aiTokens: lastRun?.aiTokens ?? 0,
    costEur: lastRun?.costEur ?? 0,

    averageQualityScore:
      scored.length > 0 ? Math.round((scored.reduce((a, b) => a + b, 0) / scored.length) * 10) / 10 : null,
  };
}

// ─────────────────────────────────────────────────────────────
// Allarmi
// ─────────────────────────────────────────────────────────────

export type AreaAlertCode =
  | "sync-never-ran"
  | "sync-sla-missed"
  | "run-failed"
  | "dead-letter-jobs"
  | "stale-sources"
  | "narratives-stuck"
  | "listings-without-area"
  | "coverage-drop";

export interface AreaAlert {
  code: AreaAlertCode;
  severity: "warning" | "critical";
  message: string;
}

export interface AlertThresholds {
  syncSlaHours?: number;
  maxStaleSources?: number;
  maxDeadLetterJobs?: number;
  maxListingsWithoutArea?: number;
  /** Calo di copertura tollerato rispetto alla fotografia precedente, in aree. */
  maxCoverageDrop?: number;
}

/**
 * Le condizioni che devono svegliare qualcuno.
 *
 * `previous` è opzionale e serve a una cosa sola, che nessuna soglia assoluta sa vedere: un CALO
 * di copertura. Duecento aree coperte è un buon numero; duecento dopo che ieri erano duecento
 * quaranta è un guasto, e senza il confronto sarebbe indistinguibile da un buon numero.
 */
export function evaluateAreaAlerts(
  snapshot: AreaHealthSnapshot,
  thresholds: AlertThresholds = {},
  previous?: AreaHealthSnapshot | null,
): AreaAlert[] {
  const alerts: AreaAlert[] = [];
  const slaHours = thresholds.syncSlaHours ?? 6;
  const maxStale = thresholds.maxStaleSources ?? 5;
  const maxDead = thresholds.maxDeadLetterJobs ?? 0;
  const maxWithout = thresholds.maxListingsWithoutArea ?? 5;
  const maxDrop = thresholds.maxCoverageDrop ?? 0;

  if (snapshot.hoursSinceLastRun === null) {
    alerts.push({
      code: "sync-never-ran",
      severity: "warning",
      message: "L'automazione d'area non è mai stata eseguita.",
    });
  } else if (snapshot.hoursSinceLastRun > slaHours) {
    // La modalità di guasto tipica: non si rompe, smette di produrre. Il sito regge, e il dato
    // invecchia senza che nessuno lo noti.
    alerts.push({
      code: "sync-sla-missed",
      severity: "critical",
      message: `Ultima esecuzione ${snapshot.hoursSinceLastRun} ore fa (SLA ${slaHours}h).`,
    });
  }

  if (snapshot.lastRunOutcome === "failed") {
    alerts.push({ code: "run-failed", severity: "critical", message: "L'ultima esecuzione è fallita." });
  }

  if (snapshot.deadLetterJobs > maxDead) {
    // Ogni lettera morta è lavoro che non verrà più fatto, e nessuno lo saprebbe.
    alerts.push({
      code: "dead-letter-jobs",
      severity: "critical",
      message: `${snapshot.deadLetterJobs} job in lettera morta: non riproveranno più.`,
    });
  }

  if (snapshot.staleSources > maxStale) {
    alerts.push({
      code: "stale-sources",
      severity: "warning",
      message: `${snapshot.staleSources} fonti oltre la data di revisione: i fatti che ne dipendono non pubblicano.`,
    });
  }

  if (snapshot.narrativesStuck > 0) {
    alerts.push({
      code: "narratives-stuck",
      severity: "warning",
      message: `${snapshot.narrativesStuck} narrative in attesa di approvazione da oltre due settimane.`,
    });
  }

  if (snapshot.listingsWithoutArea > maxWithout) {
    alerts.push({
      code: "listings-without-area",
      severity: "warning",
      message: `${snapshot.listingsWithoutArea} immobili senza area risolvibile: località da rivedere.`,
    });
  }

  if (previous && previous.areasCovered - snapshot.areasCovered > maxDrop) {
    alerts.push({
      code: "coverage-drop",
      severity: "critical",
      message: `Copertura in calo: da ${previous.areasCovered} a ${snapshot.areasCovered} aree.`,
    });
  }

  return alerts;
}

// ─────────────────────────────────────────────────────────────
// Sicurezza dei log
// ─────────────────────────────────────────────────────────────

/**
 * Chiavi che non devono MAI comparire in una riga di log d'area.
 *
 * `areaKey`, `municipality` e `realSmartCode` NON sono qui, e la distinzione è deliberata: sono
 * già pubblici — compaiono nelle URL del sito — e senza di loro un log non serve a diagnosticare
 * niente. Ciò che è escluso è ciò che il pubblico non vede: coordinate, indirizzi, credenziali,
 * payload grezzi, e i NOMI di chi approva (l'audit li conserva, il log operativo non ne ha
 * bisogno e in un log finiscono per essere copiati altrove).
 */
const FORBIDDEN_LOG_KEYS = [
  "lat", "lng", "lon", "latitude", "longitude", "coord", "coords",
  "privateOriginLat", "privateOriginLng", "origin",
  "address", "indirizzo", "phone", "telefono", "email",
  "apiKey", "api_key", "token", "secret", "password", "serviceRoleKey",
  "payload", "raw", "actor", "approvedBy", "reviewer",
];

const COORD_LIKE = /-?\d{1,3}\.\d{3,}/;
const PHONE_LIKE = /(?:\+?\d[\s.\-]?){7,}/;
const ADDRESS_LIKE = /\b(via|viale|piazza|corso|largo)\s+[A-ZÀ-Ù][\w'À-ù]*(?:\s+[\w'À-ù]+){0,3},?\s*\d+\b/i;

/**
 * I motivi per cui un oggetto NON è sicuro da registrare. Vuoto = si può emettere.
 *
 * Ricorsivo, perché il modo realistico in cui una coordinata finisce in un log non è un campo
 * `lat` in cima: è un oggetto annidato passato per intero a `console.error` mentre si diagnostica
 * un guasto — cioè esattamente quando nessuno sta pensando alla privacy.
 */
export function findLogSafetyViolations(value: unknown, path = ""): string[] {
  const out: string[] = [];

  if (typeof value === "string") {
    if (COORD_LIKE.test(value)) out.push(`possibile coordinata in ${path || "(radice)"}: "${value}"`);
    if (PHONE_LIKE.test(value)) out.push(`possibile telefono in ${path || "(radice)"}`);
    if (ADDRESS_LIKE.test(value)) out.push(`possibile indirizzo in ${path || "(radice)"}`);
    return out;
  }
  if (Array.isArray(value)) {
    value.forEach((v, i) => out.push(...findLogSafetyViolations(v, `${path}[${i}]`)));
    return out;
  }
  if (value && typeof value === "object") {
    for (const [key, v] of Object.entries(value)) {
      const here = path ? `${path}.${key}` : key;
      if (FORBIDDEN_LOG_KEYS.includes(key)) out.push(`campo proibito: ${here}`);
      out.push(...findLogSafetyViolations(v, here));
    }
  }
  return out;
}

/** true se l'oggetto si può registrare così com'è. */
export function isLogSafe(value: unknown): boolean {
  return findLogSafetyViolations(value).length === 0;
}

/**
 * I campi strutturati che ogni riga di log d'area deve portare, per poter correlare un guasto
 * alla sua esecuzione senza rileggere il database.
 */
export interface AreaLogFields {
  automationRunId?: string;
  jobId?: string;
  realSmartCode?: string;
  areaKey?: string;
  sourceHash?: string;
  deploymentVersion?: string;
  errorClass?: string;
}

/**
 * Prepara una riga di log. Se contiene qualcosa che non deve uscire, LANCIA.
 *
 * Lanciare e non ripulire in silenzio è la scelta importante: una riga ripulita in automatico
 * nasconde che qualcuno ha passato un oggetto con dentro una coordinata, e il prossimo lo farà
 * di nuovo. L'eccezione arriva in sviluppo e in test, dove costa niente ed è il momento giusto.
 */
export function assertLogSafe<T>(fields: T): T {
  const violations = findLogSafetyViolations(fields);
  if (violations.length > 0) {
    throw new Error(`[territory/area] riga di log non sicura: ${violations.join("; ")}`);
  }
  return fields;
}
