// Il COLLETTORE di fonti d'area (Prompt 5).
//
// ⚠️ DOVE GIRA, e dove NON gira. Questo modulo esegue richieste di rete: può essere invocato SOLO
// da un job in background o da un comando editoriale esplicito. Mai durante il render di una
// pagina, mai durante una richiesta del chatbot. La regola è strutturale, non di buon senso: una
// pagina che interroga il sito di un comune al momento della visita è una pagina che si ferma
// quando quel sito si ferma, e che nel frattempo ha scaricato mezzo megabyte per un visitatore.
//
// COSA PRODUCE: evidenza CANDIDATA. Fonti registrate, con la loro impronta e il loro stato. Non
// produce fatti approvati, non produce copy, e non sceglie fra fonti in conflitto — quelle sono
// tutte decisioni umane, e il collettore non ha il vocabolario per prenderle.
//
// COSA NON FA MAI, elencato perché è la parte che un collettore "utile" tende a fare da solo:
// non deduce sicurezza, prestigio, idoneità o tipo di residenti; non profila la popolazione; non
// copia passaggi lunghi; non elegge un vincitore fra due fonti ufficiali che si contraddicono;
// non marca approvato niente.

import { canonicalizeUrl } from "./canonical";
import {
  BudgetTracker,
  DEFAULT_INGESTION_BUDGET,
  decideHost,
  type AllowedSourceHost,
  type IngestionBudget,
  type SourceRejectionReason,
} from "./policy";
import { areaSourceId, contentHash } from "../hash";
import type { AreaSourceRecord, AreaSourceStatus } from "../store/repository";

// ─────────────────────────────────────────────────────────────
// Il confine con la rete
// ─────────────────────────────────────────────────────────────

export interface FetchedPage {
  status: number;
  /** Testo della pagina, già troncato al limite di budget. */
  text: string;
  /** true se il contenuto è stato troncato: il fatto estratto potrebbe essere incompleto. */
  truncated: boolean;
  contentType?: string;
}

/**
 * Il recuperatore di pagine. INIETTABILE, ed è il punto: i test non toccano la rete, il dry-run
 * può usarne uno che non scarica niente, e il giorno in cui il trasporto cambia si sostituisce
 * qui invece che dentro la logica.
 */
export type PageFetcher = (url: string, options: { timeoutMs: number; maxBytes: number }) => Promise<FetchedPage>;

/**
 * Il lettore di `robots.txt`. Separato dal recuperatore perché ha una cadenza diversa: si legge
 * una volta per host e vale per tutte le pagine di quell'host.
 */
export type RobotsChecker = (host: string, path: string) => Promise<boolean>;

/** Un robots che permette tutto. SOLO per i test: in produzione se ne passa uno vero. */
export const ALLOW_ALL_ROBOTS: RobotsChecker = async () => true;

// ─────────────────────────────────────────────────────────────
// Ingresso e uscita
// ─────────────────────────────────────────────────────────────

export interface SourceCandidate {
  url: string;
  areaKey: string;
  /** Perché questa pagina è stata proposta: chi l'ha suggerita, o quale ricerca l'ha trovata. */
  note?: string;
}

export interface CollectedSource {
  record: AreaSourceRecord;
  /** Il testo scaricato. Resta in memoria per l'estrazione dei fatti; NON si persiste grezzo. */
  text: string;
  truncated: boolean;
  /** `new` se non c'era, `changed` se l'impronta è diversa, `unchanged` se identica. */
  outcome: "new" | "changed" | "unchanged";
}

export interface RejectedSource {
  url: string;
  reason: SourceRejectionReason;
  detail?: string;
}

export interface CollectionResult {
  collected: CollectedSource[];
  rejected: RejectedSource[];
  /** Richieste HTTP effettuate. È il numero che si confronta col budget. */
  requests: number;
  /** true se il budget è finito prima di aver esaurito i candidati. */
  budgetExhausted: boolean;
}

export interface CollectionInput {
  candidates: readonly SourceCandidate[];
  now: Date;
  fetcher: PageFetcher;
  robots: RobotsChecker;
  /** Le fonti già note per queste aree, per riconoscere invariato/cambiato. */
  known?: readonly AreaSourceRecord[];
  budget?: IngestionBudget;
  allowList?: readonly AllowedSourceHost[];
  /** Giorni dopo i quali una fonte va ricontrollata. Default 180. */
  reviewAfterDays?: number;
  /** Attesa fra richieste allo stesso host. Iniettabile per non rallentare i test. */
  sleep?: (ms: number) => Promise<void>;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * L'IMPRONTA DEL CONTENUTO di una pagina.
 *
 * Non è l'hash del testo grezzo, e la differenza conta: un CMS istituzionale cambia a ogni
 * richiesta — un token di sessione, una data in fondo, un contatore di visite — e un hash del
 * grezzo direbbe «cambiata» tutte le volte. Si normalizzano quindi spazi e maiuscole e si
 * tolgono le sequenze che cambiano da sole (date e orari), così «cambiata» vuol dire davvero
 * che il testo dice qualcosa di diverso.
 */
export function pageContentHash(text: string): string {
  const normalized = text
    .replace(/\s+/g, " ")
    .replace(/\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/g, "") // date
    .replace(/\d{1,2}:\d{2}(:\d{2})?/g, "") // orari
    .trim()
    .toLowerCase();
  return contentHash({ text: normalized });
}

const defaultSleep = (ms: number): Promise<void> =>
  ms <= 0 ? Promise.resolve() : new Promise((r) => setTimeout(r, ms));

/**
 * Raccoglie le fonti candidate.
 *
 * Ogni candidato passa da cinque cancelli, in quest'ordine — dal più economico al più caro, così
 * uno scarto non costa mai una richiesta:
 *
 *   1. l'URL è utilizzabile?           (nessuna rete)
 *   2. l'host è ammesso per quest'area? (nessuna rete)
 *   3. robots.txt lo permette?          (una richiesta per host, riusata)
 *   4. c'è ancora budget?               (nessuna rete)
 *   5. la pagina risponde?              (la richiesta vera)
 */
export async function collectSources(input: CollectionInput): Promise<CollectionResult> {
  const budget = input.budget ?? DEFAULT_INGESTION_BUDGET;
  const tracker = new BudgetTracker(budget);
  const sleep = input.sleep ?? defaultSleep;
  const reviewAfterDays = input.reviewAfterDays ?? 180;

  const knownByCanonical = new Map<string, AreaSourceRecord>();
  for (const k of input.known ?? []) knownByCanonical.set(`${k.areaKey} ${k.canonicalUrl}`, k);

  const collected: CollectedSource[] = [];
  const rejected: RejectedSource[] = [];
  // Dedup INTERNO all'esecuzione: due candidati che canonicalizzano allo stesso URL sono una
  // pagina sola, e scaricarla due volte sprecherebbe budget per lo stesso contenuto.
  const seen = new Set<string>();
  let budgetExhausted = false;

  for (const candidate of input.candidates) {
    // 1. URL
    const canonical = canonicalizeUrl(candidate.url);
    if (!canonical.ok) {
      rejected.push({ url: candidate.url, reason: "invalid-url", detail: canonical.reason });
      continue;
    }
    const key = `${candidate.areaKey} ${canonical.canonical}`;
    if (seen.has(key)) continue; // già trattato in questa esecuzione
    seen.add(key);

    // 2. Host ammesso per quest'area
    const decision = decideHost(canonical.host, candidate.areaKey, input.allowList);
    if (!decision.allowed || !decision.entry) {
      rejected.push({
        url: canonical.canonical,
        reason: decision.reason ?? "host-not-allowed",
        detail: canonical.host,
      });
      continue;
    }

    // 3. robots.txt. Un blocco NON si aggira: il fatto si prende altrove o non si prende.
    const path = new URL(canonical.canonical).pathname;
    const allowedByRobots = await input.robots(canonical.host, path);
    if (!allowedByRobots) {
      rejected.push({ url: canonical.canonical, reason: "robots-disallowed" });
      continue;
    }

    // 4. Budget
    if (!tracker.canRequest()) {
      budgetExhausted = true;
      rejected.push({ url: canonical.canonical, reason: "budget-exhausted" });
      continue;
    }

    // 5. La richiesta, con cortesia verso l'host e ritentativi limitati
    await sleep(tracker.delayFor(canonical.host, input.now.getTime()));

    let page: FetchedPage | null = null;
    let lastError = "";
    for (let attempt = 1; attempt <= budget.maxAttempts && tracker.canRequest(); attempt++) {
      tracker.record(canonical.host, input.now.getTime());
      try {
        const result = await input.fetcher(canonical.canonical, {
          timeoutMs: budget.timeoutMs,
          maxBytes: budget.maxBytesPerPage,
        });
        if (result.status >= 200 && result.status < 300) {
          page = result;
          break;
        }
        lastError = `HTTP ${result.status}`;
        // 4xx non si ritenta: la pagina non c'è, o non è per noi. Solo 5xx e rete valgono un
        // secondo tentativo — un errore del server può essere transitorio, un 404 no.
        if (result.status < 500) break;
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
      }
      if (attempt < budget.maxAttempts) await sleep(budget.minDelayPerHostMs);
    }

    if (!page) {
      rejected.push({ url: canonical.canonical, reason: "unreachable", detail: lastError });
      continue;
    }
    if (page.text.trim().length === 0) {
      rejected.push({ url: canonical.canonical, reason: "empty-content" });
      continue;
    }

    const hash = pageContentHash(page.text);
    const previous = knownByCanonical.get(key);
    const outcome: CollectedSource["outcome"] = !previous
      ? "new"
      : previous.contentHash === hash
        ? "unchanged"
        : "changed";

    // Una fonte CAMBIATA non torna "active" da sola: resta marcata `changed` finché un revisore
    // non ha guardato cosa è cambiato. I fatti che ne dipendono potrebbero non essere più veri,
    // e riportarla attiva in automatico li lascerebbe pubblicati.
    const status: AreaSourceStatus = outcome === "changed" ? "changed" : "active";

    collected.push({
      record: {
        sourceId: areaSourceId(canonical.canonical),
        areaKey: candidate.areaKey,
        url: candidate.url,
        canonicalUrl: canonical.canonical,
        owner: decision.entry.owner,
        sourceType: decision.entry.type,
        retrievedAt: input.now.toISOString(),
        reviewBy: new Date(input.now.getTime() + reviewAfterDays * DAY_MS).toISOString(),
        contentHash: hash,
        status,
        lastHttpStatus: page.status,
        metadata: {
          truncated: page.truncated,
          ...(candidate.note ? { note: candidate.note } : {}),
        },
      },
      text: page.text,
      truncated: page.truncated,
      outcome,
    });
  }

  return { collected, rejected, requests: tracker.used, budgetExhausted };
}

/**
 * Le fonti già note che sono SCADUTE: hanno superato la data di revisione e vanno ricontrollate.
 *
 * Non è la stessa cosa di "cambiata". Una fonte scaduta potrebbe essere identica a sei mesi fa —
 * il punto è che nessuno l'ha guardata da sei mesi, e un fatto d'area che nessuno ricontrolla
 * smette lentamente di essere un fatto.
 */
export function staleSources(known: readonly AreaSourceRecord[], now: Date): AreaSourceRecord[] {
  return known
    .filter((s) => s.status !== "rejected" && Date.parse(s.reviewBy) < now.getTime())
    .sort((a, b) => (a.reviewBy < b.reviewBy ? -1 : 1));
}
