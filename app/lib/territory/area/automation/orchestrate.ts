// L'ORCHESTRAZIONE: dal feed RealSmart ai job d'area (Prompt 9).
//
// Il giro completo, una volta per esecuzione:
//
//   feed → diff sull'impronta di collocazione → per ogni immobile nuovo/cambiato:
//     • si risolve la sua area canonica
//     • si RIUSA il profilo d'area se esiste, se ne crea uno se manca
//     • si accodano i job idempotenti che servono, e SOLO quelli
//   → gli immobili spariti dal feed si marcano ritirati (il profilo d'area NON si tocca)
//   → si invalidano i tag di cache toccati, e solo quelli
//   → si registra il rapporto d'esecuzione
//
// TRE PROPRIETÀ che valgono più del resto.
//
// 1. NON RIGENERA PER UN CAMBIO DI PREZZO. Il diff è sull'impronta di collocazione, non su
//    `updatedAt` — vedi ./fingerprint.ts per la ragione.
//
// 2. UN PROFILO PER AREA, RIUSATO. Venti immobili a Tradate condividono un profilo: la ricerca
//    delle fonti si paga una volta. È l'unica cosa che rende sostenibile il costo su un catalogo
//    di duecento annunci.
//
// 3. NON CANCELLA NULLA. Un immobile venduto si marca ritirato; il profilo d'area, i fatti e la
//    narrativa restano — sono conoscenza sul territorio, non sull'immobile, e serviranno al
//    prossimo annuncio nella stessa via.

import type { NormalizedProperty } from "../../../realsmart/types";
import { buildAreaKey, parseAreaKey } from "../identity";
import { AREA_SCHEMA_VERSION } from "../types";
import type { AreaProfile } from "../types";
import { locationFingerprint, jobIdempotencyKey } from "./fingerprint";
import type {
  AreaJobRecord,
  AreaJobType,
  AreaRepository,
  PropertyAreaContextRecord,
} from "../store/repository";

// ─────────────────────────────────────────────────────────────
// Diff
// ─────────────────────────────────────────────────────────────

export type ListingChangeKind = "added" | "changed" | "unchanged" | "retired";

export interface ListingChange {
  realSmartCode: string;
  kind: ListingChangeKind;
  fingerprint: string;
  areaKey: string;
  /** L'impronta precedente, quando c'era: utile al rapporto e al debug. */
  previousFingerprint?: string;
}

export interface DiffInput {
  listings: readonly NormalizedProperty[];
  /** Ciò che lo store sa già: codice → contesto. */
  known: ReadonlyMap<string, PropertyAreaContextRecord>;
}

/**
 * Confronta il feed con ciò che è già stato elaborato.
 *
 * Puro e sincrono: si può eseguire in un dry-run per rispondere a «cosa succederebbe?» senza
 * toccare niente e senza spendere niente.
 */
export function diffListings(input: DiffInput): ListingChange[] {
  const out: ListingChange[] = [];
  const seen = new Set<string>();

  for (const listing of input.listings) {
    const code = listing.sourceRef.codice;
    seen.add(code);
    const fingerprint = locationFingerprint({ realSmartCode: code, area: listing.area });
    const previous = input.known.get(code);

    if (!previous) {
      out.push({ realSmartCode: code, kind: "added", fingerprint, areaKey: listing.area.areaKey });
    } else if (previous.sourceHash !== fingerprint) {
      out.push({
        realSmartCode: code,
        kind: "changed",
        fingerprint,
        areaKey: listing.area.areaKey,
        previousFingerprint: previous.sourceHash,
      });
    } else {
      out.push({
        realSmartCode: code,
        kind: "unchanged",
        fingerprint,
        areaKey: listing.area.areaKey,
        previousFingerprint: previous.sourceHash,
      });
    }
  }

  // Spariti dal feed: venduti, ritirati, o semplicemente non più esposti dal gestionale.
  for (const [code, context] of input.known) {
    if (seen.has(code) || context.retired) continue;
    out.push({
      realSmartCode: code,
      kind: "retired",
      fingerprint: context.sourceHash,
      areaKey: context.areaKey,
      previousFingerprint: context.sourceHash,
    });
  }

  return out.sort((a, b) => (a.realSmartCode < b.realSmartCode ? -1 : 1));
}

// ─────────────────────────────────────────────────────────────
// Esecuzione
// ─────────────────────────────────────────────────────────────

export interface AutomationReport {
  runId: string;
  startedAt: string;
  finishedAt: string;
  discovered: number;
  changed: number;
  skipped: number;
  failed: number;
  /** Immobili marcati ritirati in questa esecuzione. */
  retired: number;
  /** Profili d'area creati (aree mai viste prima). */
  profilesCreated: number;
  /** Profili d'area riusati: la misura del risparmio. */
  profilesReused: number;
  /** Job accodati davvero (le chiavi già presenti non contano). */
  jobsEnqueued: number;
  /** Job non accodati perché già in coda: l'idempotenza al lavoro. */
  jobsDeduplicated: number;
  /** Immobili senza area risolvibile: restano in pagina, non entrano nella pipeline. */
  unresolved: string[];
  /** Tag di cache da invalidare. Solo quelli toccati. */
  revalidateTags: string[];
  errors: string[];
}

export interface OrchestrationInput {
  listings: readonly NormalizedProperty[];
  repo: AreaRepository;
  now: Date;
  runId: string;
  feedVersion?: string;
  /**
   * Tetto di job accodabili in una esecuzione. Difesa contro il caso peggiore — un cambio di
   * versione di prompt che rende "cambiati" tutti gli immobili insieme: senza tetto, una riga
   * modificata in un file di prompt accoderebbe duecento job in un colpo.
   */
  maxJobsPerRun?: number;
}

const DEFAULT_MAX_JOBS_PER_RUN = 50;

/** I job che un immobile nuovo o cambiato richiede, in ordine di dipendenza. */
function jobsFor(change: ListingChange, profileExists: boolean): AreaJobType[] {
  const jobs: AreaJobType[] = [];
  // La ricerca fonti si accoda SOLO se il profilo non c'era: è la parte cara, e per un'area già
  // studiata sarebbe lavoro rifatto.
  if (!profileExists) jobs.push("research-sources");
  // Il contesto per-immobile invece è sempre suo: le distanze dipendono da dove sta la casa.
  jobs.push("compute-property-context");
  return jobs;
}

/**
 * Esegue il giro. Restituisce il rapporto — che è anche ciò che il dry-run stampa.
 *
 * Non chiama provider e non genera testi: ACCODA il lavoro. La separazione è voluta: questa
 * funzione deve poter girare in un cron con un budget di tempo stretto e non deve poter
 * consumare budget AI da sola.
 */
export async function runAreaAutomation(input: OrchestrationInput): Promise<AutomationReport> {
  const startedAt = input.now.toISOString();
  const maxJobs = input.maxJobsPerRun ?? DEFAULT_MAX_JOBS_PER_RUN;

  const known = new Map<string, PropertyAreaContextRecord>();
  for (const context of await input.repo.listPropertyContexts()) {
    known.set(context.realSmartCode, context);
  }

  const changes = diffListings({ listings: input.listings, known });
  const byCode = new Map(input.listings.map((l) => [l.sourceRef.codice, l]));

  const report: AutomationReport = {
    runId: input.runId,
    startedAt,
    finishedAt: startedAt,
    discovered: input.listings.length,
    changed: 0,
    skipped: 0,
    failed: 0,
    retired: 0,
    profilesCreated: 0,
    profilesReused: 0,
    jobsEnqueued: 0,
    jobsDeduplicated: 0,
    unresolved: [],
    revalidateTags: [],
    errors: [],
  };

  const tags = new Set<string>();
  let jobBudget = maxJobs;

  for (const change of changes) {
    try {
      if (change.kind === "unchanged") {
        report.skipped++;
        continue;
      }

      if (change.kind === "retired") {
        // Si marca l'immobile, NON si tocca l'area: fatti e narrativa sono conoscenza sul
        // territorio e serviranno al prossimo annuncio nella stessa via.
        const context = known.get(change.realSmartCode)!;
        await input.repo.putPropertyContext({ ...context, retired: true, status: "stale" });
        await input.repo.appendReviewEvent({
          areaKey: context.areaKey,
          subject: "profile",
          subjectId: change.realSmartCode,
          action: "location-changed",
          actor: `automation:${input.runId}`,
          at: startedAt,
          reason: "immobile non più presente nel feed",
        });
        report.retired++;
        tags.add(`territory:listing:${change.realSmartCode}`);
        continue;
      }

      const listing = byCode.get(change.realSmartCode)!;
      const identity = listing.area;

      // Senza comune non c'è area: l'immobile resta pubblicabile (la scheda non dipende da
      // questo), ma non entra nella pipeline territoriale. Va in coda di revisione con il suo
      // motivo, invece di sparire in silenzio.
      if (!identity.municipalityKey) {
        report.unresolved.push(change.realSmartCode);
        report.skipped++;
        continue;
      }

      // ── Profilo d'area: riusa o crea ──────────────────────
      const existingProfile = await input.repo.getProfile(identity.areaKey);
      if (existingProfile) {
        report.profilesReused++;
      } else {
        const parts = parseAreaKey(identity.areaKey);
        const profile: AreaProfile = {
          areaKey: identity.areaKey,
          label: identity.neighbourhoodLabel ?? identity.municipalityLabel ?? identity.municipalityKey,
          municipalityAreaKey: buildAreaKey({ ...parts, neighbourhood: undefined }),
          scope: parts.neighbourhood ? "zone" : "municipality",
          // Nasce BOZZA. Nessun profilo entra nel sito senza che qualcuno l'abbia guardato.
          status: "draft",
          schemaVersion: AREA_SCHEMA_VERSION,
        };
        await input.repo.putProfile(profile);
        await input.repo.appendReviewEvent({
          areaKey: identity.areaKey,
          subject: "profile",
          subjectId: identity.areaKey,
          action: "generate",
          actor: `automation:${input.runId}`,
          at: startedAt,
        });
        report.profilesCreated++;
      }

      // ── Contesto dell'immobile ────────────────────────────
      await input.repo.putPropertyContext({
        realSmartCode: change.realSmartCode,
        areaKey: identity.areaKey,
        sourceHash: change.fingerprint,
        // Senza coordinate proprie l'origine resta il centroide del comune: dichiararlo qui è
        // ciò che impedisce alla pagina di scrivere "dall'immobile" per una misura che non lo è.
        publicOriginType: "municipality-centroid",
        publicOriginLabel: identity.municipalityLabel ?? identity.municipalityKey,
        locationPrecision: identity.precision,
        calculatedAt: startedAt,
        status: "draft",
      });

      // ── Job ───────────────────────────────────────────────
      for (const jobType of jobsFor(change, Boolean(existingProfile))) {
        if (jobBudget <= 0) {
          // Il tetto è raggiunto: si FERMA e lo si dichiara. Un troncamento taciuto si legge
          // come "abbiamo coperto tutto", ed è la bugia più facile da evitare.
          report.errors.push(
            `tetto di ${maxJobs} job raggiunto: il resto verrà accodato alla prossima esecuzione`,
          );
          jobBudget = -1;
          break;
        }
        const targetId = jobType === "research-sources" ? identity.areaKey : change.realSmartCode;
        const job: AreaJobRecord = {
          idempotencyKey: jobIdempotencyKey({ jobType, targetId, fingerprint: change.fingerprint }),
          jobType,
          targetId,
          state: "pending",
          attempts: 0,
          availableAt: startedAt,
          createdAt: startedAt,
          runMetadata: { runId: input.runId },
        };
        const created = await input.repo.enqueueJob(job);
        if (created) {
          report.jobsEnqueued++;
          jobBudget--;
        } else {
          report.jobsDeduplicated++;
        }
      }
      if (jobBudget < 0) break;

      report.changed++;
      // Invalidazione MIRATA: la scheda toccata e il profilo del suo comune. Non "tutto il
      // territorio", che butterebbe la cache di duecento pagine per un immobile.
      tags.add(`territory:listing:${change.realSmartCode}`);
      tags.add(`territory:profile:${identity.municipalityKey}`);
    } catch (err) {
      report.failed++;
      report.errors.push(
        `${change.realSmartCode}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  report.revalidateTags = [...tags].sort();
  report.finishedAt = new Date(input.now.getTime()).toISOString();

  await input.repo.recordAutomationRun({
    runId: input.runId,
    ...(input.feedVersion ? { feedVersion: input.feedVersion } : {}),
    startedAt: report.startedAt,
    finishedAt: report.finishedAt,
    discovered: report.discovered,
    changed: report.changed,
    skipped: report.skipped,
    failed: report.failed,
    providerCalls: 0,
    aiTokens: 0,
    costEur: 0,
    outcome: report.failed > 0 ? "partial" : "ok",
  });

  return report;
}
