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
import {
  decideEnrichment,
  deriveListingFromProfile,
  preservedApproved,
  failureFrom,
  type EnrichmentDeps,
  type EnrichmentDecision,
} from "./engine";
import { ProfileRefresher } from "./profileCache";
import { callsThisMonth, evaluateCallBudget, readBudgets, type TerritoryBudgets } from "./budget";
import { sinkFromEnv, type ObservabilitySink } from "./observe";
import { fingerprintsEqual } from "./fingerprint";
import { isFresh } from "./public";
import { isRetryDue } from "./retry";
import { resolveMunicipalityOrigin, originFields, type ResolvedOrigin } from "./origin";
import { TerritoryRunMetrics, type TerritoryMetricsSnapshot } from "./metrics";
import type {
  EnrichmentStatus,
  EnrichmentFingerprint,
  ListingTerritoryEnrichment,
  MunicipalityTerritoryProfile,
} from "./types";

/** ID di esecuzione breve, senza coordinate: correlazione dei log e holder del lease. */
function makeExecutionId(): string {
  const g = globalThis as { crypto?: { randomUUID?: () => string } };
  if (g.crypto?.randomUUID) return `run_${g.crypto.randomUUID().slice(0, 8)}`;
  return `run_${Date.now().toString(36)}`;
}

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
  /** Tetto di QUERY al provider (profili) per questo run. Oltre, i profili restano per il prossimo. */
  maxCalls?: number | null;
  /** ID di esecuzione/correlazione (holder del lease, log). Se assente, generato. Mai coordinate. */
  executionId?: string;
  /** Durata del lease per profilo, in ms. Default 60s. */
  leaseTtlMs?: number;
  /** Generatore casuale per il jitter del backoff (iniettabile per test deterministici). */
  random?: () => number;
  /** Budget mensili + kill switch. Se assente si leggono dall'ambiente. */
  budgets?: TerritoryBudgets;
  /** Sink di osservabilità. Se assente si sceglie dall'ambiente (nullo se il logging è spento). */
  sink?: ObservabilitySink;
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
  /**
   * true se il BUDGET MENSILE (o il kill switch) ha impedito nuove chiamate esterne. I profili già
   * approvati restano serviti: si ferma l'acquisizione, non si cancella nulla.
   */
  monthlyBudgetBlocked: boolean;
  /** ID di esecuzione/correlazione del run (per i log; nessuna coordinata). */
  executionId: string;
  /** Profili REALMENTE interrogati (refresh) in questo run. */
  profilesRefreshed: number;
  /** Immobili derivati da un profilo già in cache (nessuna query). */
  cacheHitListings: number;
  /** Profili in attesa di retry (backoff non ancora scaduto): non bloccano i sani. */
  retryPending: number;
  /** Profili in dead-letter (retry esauriti): richiedono intervento umano. */
  deadLettered: number;
  /** Profili saltati perché un altro run teneva il lease. */
  leaseSkipped: number;
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
  // Default sicuro: solo comuni del pilota, così il budget non si spreca fuori area.
  //
  // NB (Prompt 6): NON si taglia più qui. Prima si pianifica l'INTERO scope, poi lo scheduler
  // sceglie i profili su cui spendere il budget in modo EQUO (mai i soliti primi 5 che affamano
  // il resto). Il taglio prima dell'eleggibilità era il bug di starvation.
  return pool.filter((p) => enabled.has(normalizeMunicipality(p.town)));
}

/** Pianifica un singolo immobile (decisione senza chiamate al provider). */
export async function planListing(
  property: NormalizedProperty,
  deps: EnrichmentDeps,
): Promise<SyncListingResult> {
  const resolveOrigin = deps.resolveOrigin ?? resolveMunicipalityOrigin;
  const code = property.sourceRef?.codice?.trim() ?? "";
  const existing = code ? await deps.repository.getListingEnrichment(code) : null;
  const decision = decideEnrichment(
    property,
    existing,
    deps.config,
    deps.now(),
    deps.provider.name,
    resolveOrigin,
  );

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

// ── Scheduler EQUO (Prompt 6) ────────────────────────────────────────────────

/** Pianificazione ricca di un immobile: decisione + record esistente, per lo scheduler. */
interface PlanItem {
  property: NormalizedProperty;
  code: string;
  existing: ListingTerritoryEnrichment | null;
  decision: EnrichmentDecision;
  result: SyncListingResult;
}

type EnrichDecision = Extract<EnrichmentDecision, { kind: "enrich" }>;

/** Classe di un profilo attuabile: come lo tratta lo scheduler. */
type ProfileClass = "cacheable" | "needs-query" | "retry-pending" | "dead-letter";

interface ProfileGroup {
  origin: ResolvedOrigin;
  fingerprint: EnrichmentFingerprint;
  stored: MunicipalityTerritoryProfile | null;
  cls: ProfileClass;
  items: PlanItem[];
}

async function planItem(property: NormalizedProperty, deps: EnrichmentDeps): Promise<PlanItem> {
  const resolveOrigin = deps.resolveOrigin ?? resolveMunicipalityOrigin;
  const code = property.sourceRef?.codice?.trim() ?? "";
  const existing = code ? await deps.repository.getListingEnrichment(code) : null;
  const decision = decideEnrichment(property, existing, deps.config, deps.now(), deps.provider.name, resolveOrigin);
  const base = { realSmartCode: code, existingStatus: (existing?.status ?? "none") as EnrichmentStatus | "none" };
  const result: SyncListingResult =
    decision.kind === "missing-code"
      ? { ...base, municipality: "", decision: "missing-code" }
      : decision.kind === "missing-coordinates"
        ? { ...base, municipality: "", decision: "missing-coordinates" }
        : decision.kind === "disabled-municipality"
          ? { ...base, municipality: decision.municipality, decision: "disabled-municipality" }
          : { ...base, municipality: decision.origin.municipality, decision: decision.kind };
  return { property, code, existing, decision, result };
}

/** Classifica un profilo: cacheable (nessuna query), da interrogare, in backoff, o dead-letter. */
function classifyProfile(
  stored: MunicipalityTerritoryProfile | null,
  fingerprint: EnrichmentFingerprint,
  now: Date,
  freshnessDays: number,
): ProfileClass {
  if (
    stored &&
    fingerprintsEqual(stored.fingerprint, fingerprint) &&
    stored.status !== "failed" &&
    isFresh(stored.retrievedAt, now, freshnessDays, stored.expiresAt)
  ) {
    return "cacheable";
  }
  if (stored?.deadLettered) return "dead-letter";
  if (!isRetryDue(stored ?? undefined, now)) return "retry-pending";
  return "needs-query";
}

/**
 * Ordine di PRIORITÀ dei profili da interrogare (constraint 4), poi CURSORE DI EQUITÀ per rotazione:
 *   0. mai tentati (never-enriched);   1. retry dovuti (falliti, backoff scaduto);
 *   2. stale / origine cambiata.       A parità di tier: lastAttemptAt più VECCHIO prima.
 * Così, con un budget più piccolo del numero di profili, ogni run avanza su quelli più trascurati e
 * TUTTO il lavoro eleggibile viene raggiunto nei run successivi (niente starvation).
 */
function profileTier(g: ProfileGroup): number {
  if (!g.stored || !g.stored.lastAttemptAt) return 0; // mai tentato
  if ((g.stored.attempts ?? 0) > 0) return 1; // retry dovuto
  return 2; // stale / cambiato
}
function profilePriorityCompare(a: ProfileGroup, b: ProfileGroup): number {
  const ta = profileTier(a);
  const tb = profileTier(b);
  if (ta !== tb) return ta - tb;
  const la = a.stored?.lastAttemptAt ?? "";
  const lb = b.stored?.lastAttemptAt ?? "";
  if (la !== lb) return la < lb ? -1 : 1; // più vecchio prima (il cursore di equità)
  return a.origin.municipality < b.origin.municipality ? -1 : 1; // spareggio stabile
}

async function deriveAndStore(item: PlanItem, origin: ResolvedOrigin, profile: MunicipalityTerritoryProfile, deps: EnrichmentDeps, now: Date): Promise<ListingTerritoryEnrichment> {
  const lastApproved = preservedApproved(item.existing, now, deps.config);
  const record = deriveListingFromProfile(item.code, origin, profile, item.existing, deps.config, now, lastApproved);
  await deps.repository.putListingEnrichment(record);
  return record;
}

async function failListing(item: PlanItem, origin: ResolvedOrigin, fingerprint: EnrichmentFingerprint, failure: ReturnType<typeof failureFrom>, deps: EnrichmentDeps, now: Date): Promise<void> {
  if (item.existing) {
    await deps.repository.recordFailure(item.code, failure); // preserva l'approvato
  } else {
    const iso = now.toISOString();
    await deps.repository.putListingEnrichment({
      schemaVersion: deps.config.schemaVersion,
      realSmartCode: item.code,
      municipality: origin.municipality,
      ...originFields(origin),
      fingerprint,
      status: "failed",
      pois: [],
      retrievedAt: iso,
      updatedAt: iso,
      failure,
    });
  }
}

function countItems(groups: ProfileGroup[]): number {
  return groups.reduce((n, g) => n + g.items.length, 0);
}

interface SchedulerExtras {
  executionId: string;
  estimatedProviderCalls: number;
  profilesRefreshed: number;
  cacheHitListings: number;
  retryPending: number;
  deadLettered: number;
  leaseSkipped: number;
  monthlyBudgetBlocked: boolean;
}

/** Aggrega i risultati per immobile in un report (con le metriche dello scheduler). */
function aggregate(
  results: SyncListingResult[],
  dryRun: boolean,
  metrics: TerritoryMetricsSnapshot,
  extras: SchedulerExtras,
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
    estimatedProviderCalls: extras.estimatedProviderCalls,
    skippedByBudget: 0,
    budgetReached: metrics.budgetReached,
    monthlyBudgetBlocked: extras.monthlyBudgetBlocked,
    executionId: extras.executionId,
    profilesRefreshed: extras.profilesRefreshed,
    cacheHitListings: extras.cacheHitListings,
    retryPending: extras.retryPending,
    deadLettered: extras.deadLettered,
    leaseSkipped: extras.leaseSkipped,
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
        if (r.outcome === "enriched") report.enriched += 1;
        else if (r.outcome === "failed") report.failed += 1;
        else if (r.outcome === "skipped-budget") report.skippedByBudget += 1;
        break;
    }
  }
  return report;
}

/**
 * Scheduler EQUO, resumabile e idempotente (Prompt 6).
 *
 * Pianifica l'INTERO scope (mai un taglio prima dell'eleggibilità), poi sceglie i PROFILI su cui
 * spendere il budget in ordine di priorità + cursore di equità (lastAttemptAt più vecchio). Un LEASE
 * per profilo impedisce a due run di arricchirlo due volte; i fallimenti ritentano con backoff e non
 * bloccano il lavoro sano. In dry-run: zero query, zero scritture, stima accurata.
 */
export async function syncListings(
  listings: NormalizedProperty[],
  deps: EnrichmentDeps,
  options: SyncOptions,
): Promise<SyncReport> {
  const config = deps.config;
  const concurrency = options.concurrency ?? config.concurrency ?? 1;
  const budget = options.maxCalls ?? config.maxCallsPerRun ?? null;
  const executionId = options.executionId ?? makeExecutionId();
  const leaseTtlMs = options.leaseTtlMs ?? 60_000;

  const selected = selectListings(listings, deps, options);
  const metrics = new TerritoryRunMetrics(budget);

  // 1) PIANIFICA L'INTERO SCOPE (nessuna chiamata al provider, nessuna scrittura).
  const plans = await mapPool(selected, concurrency, (p) => planItem(p, deps));
  for (const p of plans) metrics.recordDecision(p.result.decision);

  const nowDate = deps.now();

  // 2) Attuabili raggruppati per PROFILO, con la classificazione del profilo.
  const groups = new Map<string, ProfileGroup>();
  for (const p of plans) {
    if (p.decision.kind !== "enrich") continue;
    const d = p.decision as EnrichDecision;
    const key = d.origin.municipality;
    let g = groups.get(key);
    if (!g) {
      const stored = await deps.repository.getMunicipalityProfile(key);
      g = { origin: d.origin, fingerprint: d.fingerprint, stored, cls: classifyProfile(stored, d.fingerprint, nowDate, config.freshnessDays), items: [] };
      groups.set(key, g);
    }
    g.items.push(p);
  }
  const groupList = [...groups.values()];
  const needsQuery = groupList.filter((g) => g.cls === "needs-query");
  const retryPendingGroups = groupList.filter((g) => g.cls === "retry-pending");
  const deadLetterGroups = groupList.filter((g) => g.cls === "dead-letter");
  const estimatedProviderCalls = needsQuery.length; // stima ACCURATA: profili unici da interrogare

  const extrasBase = {
    executionId,
    estimatedProviderCalls,
    retryPending: countItems(retryPendingGroups),
    deadLettered: countItems(deadLetterGroups),
  };

  // 3) DRY-RUN: nessuna query, nessuna scrittura. Solo la stima.
  if (options.dryRun) {
    return aggregate(plans.map((p) => p.result), true, metrics.snapshot(), {
      ...extrasBase,
      monthlyBudgetBlocked: false, // dry-run: nessuna chiamata, quindi nessun blocco
      profilesRefreshed: 0,
      cacheHitListings: 0,
      leaseSkipped: 0,
    });
  }

  const setOutcome = (item: PlanItem, outcome: string) => {
    item.result.outcome = outcome;
  };

  // 4) CACHEABLE → deriva subito (nessuna query).
  let cacheHitListings = 0;
  for (const g of groupList.filter((x) => x.cls === "cacheable")) {
    metrics.recordProfileResult("hit");
    for (const item of g.items) {
      const record = await deriveAndStore(item, g.origin, g.stored!, deps, nowDate);
      metrics.recordOutcome({ action: "enriched", realSmartCode: item.code, record, queried: false });
      cacheHitListings += 1;
      setOutcome(item, "enriched");
    }
  }
  // 5) retry-pending / dead-letter → non si toccano: backoff in corso / intervento umano.
  for (const g of retryPendingGroups) for (const item of g.items) setOutcome(item, "retry-pending");
  for (const g of deadLetterGroups) for (const item of g.items) setOutcome(item, "dead-letter");

  // 6) NEEDS-QUERY → ordine EQUO, budget, lease, refresh, deriva/fallisci.
  needsQuery.sort(profilePriorityCompare);

  // BUDGET MENSILE + kill switch (Prompt 14, cablato qui): si contano le chiamate già fatte QUESTO
  // mese dai profili memorizzati e si consulta il gate PRIMA di ogni nuova query. Un breach ferma le
  // NUOVE chiamate; i profili approvati restano serviti (nulla viene cancellato).
  const budgets = options.budgets ?? readBudgets();
  const storedProfiles = await deps.repository.listMunicipalityProfiles();
  let monthlyUsed = callsThisMonth(storedProfiles.map((p) => p.retrievedAt), nowDate);
  let monthlyBlocked = false;
  const allowProviderCall = () => {
    const decision = evaluateCallBudget("poi", monthlyUsed, budgets);
    if (!decision.allowed) {
      monthlyBlocked = true;
      return false;
    }
    monthlyUsed += 1; // la chiamata sta per partire: conta subito
    return true;
  };

  const sink = options.sink ?? sinkFromEnv();
  const refresher = new ProfileRefresher({
    provider: deps.provider,
    repository: deps.repository,
    config,
    now: deps.now,
    maxQueries: budget,
    onQuery: () => metrics.recordProviderCall(),
    onResult: (source) => metrics.recordProfileResult(source),
    random: options.random,
    sink,
    runId: executionId,
    allowProviderCall,
  });
  let queries = 0;
  let profilesRefreshed = 0;
  let leaseSkipped = 0;

  for (const g of needsQuery) {
    // Budget: i profili oltre il tetto restano per il prossimo run (nessuna starvation grazie
    // all'ordine per lastAttemptAt).
    if (budget != null && queries >= budget) {
      for (const item of g.items) {
        setOutcome(item, "skipped-budget");
        metrics.recordBudgetSkip();
      }
      continue;
    }
    // LEASE: se un altro run lo tiene, salta pulito (idempotenza / no doppio arricchimento).
    const expiresAt = new Date(nowDate.getTime() + leaseTtlMs).toISOString();
    const got = await deps.repository.tryAcquireLease(g.origin.municipality, executionId, expiresAt, nowDate);
    if (!got) {
      leaseSkipped += 1;
      for (const item of g.items) setOutcome(item, "lease-skipped");
      continue;
    }
    try {
      queries += 1;
      const res = await refresher.resolve(g.origin);
      if (res.profile && (res.source === "hit" || res.source === "refreshed")) {
        profilesRefreshed += 1;
        for (const item of g.items) {
          const record = await deriveAndStore(item, g.origin, res.profile, deps, nowDate);
          metrics.recordOutcome({ action: "enriched", realSmartCode: item.code, record, queried: true });
          setOutcome(item, "enriched");
        }
      } else {
        // stale/unavailable → fallimento: preserva l'approvato, annota il fallimento sanificato.
        const failure = failureFrom(res.error, deps.provider.name, nowDate);
        for (const item of g.items) {
          await failListing(item, g.origin, res.fingerprint, failure, deps, nowDate);
          metrics.recordOutcome({ action: "failed", realSmartCode: item.code, failure, preservedApproved: item.existing != null });
          setOutcome(item, "failed");
        }
      }
    } finally {
      await deps.repository.releaseLease(g.origin.municipality, executionId);
    }
  }

  return aggregate(plans.map((p) => p.result), false, metrics.snapshot(), {
    ...extrasBase,
    monthlyBudgetBlocked: monthlyBlocked,
    profilesRefreshed,
    cacheHitListings,
    leaseSkipped,
  });
}
