// POLITICA DELLE FONTI: chi si può interrogare, con che priorità, e quanto (Prompt 5).
//
// Il collettore NON decide da solo dove andare. Qui vive l'elenco di ciò che è ammesso, e la
// ragione è semplice: un ricercatore automatico lasciato libero su internet trova, prima o poi,
// un portale immobiliare o un blog di zona — e da lì torna con «quartiere tranquillo e ben
// servito», che è esattamente la classe di affermazione che tutto questo lavoro esiste per
// tenere fuori.
//
// LA GERARCHIA, e perché conta più della qualità della scrittura:
//
//   1. autorità pubbliche (comune, provincia, regione, stato)
//   2. operatori di trasporto ufficiali
//   3. strutture sanitarie pubbliche
//   4. anagrafi scolastiche ufficiali
//   5. parchi, biblioteche, servizi pubblici
//   6. fonti secondarie reputate — SOLO se nessuna primaria copre il fatto
//
// Un fatto preso dal livello 6 quando esisteva al livello 1 non è "quasi altrettanto buono": è
// una citazione di seconda mano su un'affermazione che si poteva verificare alla fonte, e il
// giorno in cui qualcuno la contesta non c'è modo di difenderla.
//
// ROBOTS E TERMINI D'USO. Il collettore rispetta `robots.txt` e non aggira mai un blocco. Una
// pagina che dice di non essere raccolta non si raccoglie, punto: il fatto si prende altrove o
// non si prende. Il valore di un fatto d'area non giustifica un accesso non voluto.

import type { AreaSourceType } from "../store/repository";

/** Priorità: numero più basso = fonte più autorevole. Entra nella risoluzione dei conflitti. */
export const SOURCE_PRIORITY: Record<AreaSourceType, number> = {
  municipality: 1,
  province: 2,
  region: 3,
  national: 4,
  "transport-operator": 5,
  healthcare: 6,
  education: 7,
  parks: 8,
  secondary: 99,
};

/** true se `a` è più autorevole di `b`. */
export function isMoreAuthoritative(a: AreaSourceType, b: AreaSourceType): boolean {
  return SOURCE_PRIORITY[a] < SOURCE_PRIORITY[b];
}

/**
 * Una voce dell'ELENCO AMMESSO. Ogni riga dice: da quale host, per conto di quale ente, con
 * quale grado di autorevolezza.
 *
 * `domain` combacia con sé stesso e con i suoi SOTTODOMINI: `comune.tradate.va.it` copre
 * `servizi.comune.tradate.va.it` senza doverli elencare tutti, e NON copre
 * `qualcosaltro.tradate.va.it`, che è un altro sito sotto lo stesso spazio provinciale.
 *
 * Il confronto NON passa da `registrableDomain`, e la differenza l'ha trovata un test: sotto
 * `regione.lombardia.it` il dominio registrabile è `lombardia.it`, quindi autorizzare la Regione
 * avrebbe autorizzato in blocco qualunque sito sotto `lombardia.it`. Un elenco di
 * autorizzazioni non deve concedere più di quanto ci sia scritto.
 */
export interface AllowedSourceHost {
  /** Dominio registrabile ("comune.tradate.va.it", "trenord.it"). */
  domain: string;
  /** Ente proprietario, come va scritto nell'attribuzione pubblica. */
  owner: string;
  type: AreaSourceType;
  /** Aree per cui questa fonte è pertinente. Vuoto = pertinente ovunque (es. un ente regionale). */
  areaKeys?: readonly string[];
  /** Da dove viene questa riga: chi l'ha aggiunta e su quale base. */
  note: string;
}

/**
 * L'ELENCO AMMESSO. Volutamente CORTO.
 *
 * Contiene solo enti la cui pertinenza al pilota è verificabile da questo repository: il comune
 * dove ha sede l'agenzia, e i due enti sovraordinati. Non è stato riempito con "tutti i comuni
 * della provincia" perché ogni riga qui è un'autorizzazione a interrogare un sito di terzi, e
 * autorizzazioni si danno una alla volta, con un motivo.
 *
 * COME SI AMPLIA: si aggiunge la riga con `note` che dice perché. Un host non elencato non viene
 * interrogato — il collettore lo scarta con `host-not-allowed`, che è un esito, non un errore.
 */
export const ALLOWED_SOURCE_HOSTS: readonly AllowedSourceHost[] = [
  {
    domain: "comune.tradate.va.it",
    owner: "Comune di Tradate",
    type: "municipality",
    areaKeys: ["it|lombardia|va|tradate|"],
    note: "comune del pilota e sede dell'agenzia (app/lib/site.ts)",
  },
  {
    domain: "provincia.va.it",
    owner: "Provincia di Varese",
    type: "province",
    note: "ente sovraordinato dei comuni del pilota (ADR-001)",
  },
  {
    domain: "regione.lombardia.it",
    owner: "Regione Lombardia",
    type: "region",
    note: "ente sovraordinato dei comuni del pilota (ADR-001)",
  },
];

export type SourceRejectionReason =
  | "invalid-url"
  | "host-not-allowed"
  | "wrong-area"
  | "robots-disallowed"
  | "unreachable"
  | "empty-content"
  | "budget-exhausted";

export interface HostDecision {
  allowed: boolean;
  reason?: SourceRejectionReason;
  /** Presente solo quando `allowed` è true. */
  entry?: AllowedSourceHost;
}

/** true se `host` è il dominio stesso o un suo sottodominio. Niente PSL, niente sorprese. */
export function isHostUnder(host: string, domain: string): boolean {
  const h = host.toLowerCase().replace(/\.$/, "");
  const d = domain.toLowerCase().replace(/\.$/, "");
  return h === d || h.endsWith(`.${d}`);
}

/**
 * Questo host si può interrogare per quest'area?
 *
 * Due controlli, entrambi necessari: l'host deve essere nell'elenco, E la fonte deve essere
 * pertinente all'area. Il secondo è quello che nessuno si aspetta: il sito del Comune di Tradate
 * è una fonte eccellente, ma non su Gallarate — e un fatto su Gallarate preso dal sito di Tradate
 * sarebbe sbagliato in un modo che nessuna lettura del testo rivelerebbe.
 */
export function decideHost(
  host: string,
  areaKey: string,
  allowList: readonly AllowedSourceHost[] = ALLOWED_SOURCE_HOSTS,
): HostDecision {
  const entry = allowList.find((e) => isHostUnder(host, e.domain));
  if (!entry) return { allowed: false, reason: "host-not-allowed" };
  if (entry.areaKeys && entry.areaKeys.length > 0 && !entry.areaKeys.includes(areaKey)) {
    return { allowed: false, reason: "wrong-area" };
  }
  return { allowed: true, entry };
}

// ─────────────────────────────────────────────────────────────
// Budget
// ─────────────────────────────────────────────────────────────

export interface IngestionBudget {
  /** Richieste HTTP massime per esecuzione. */
  maxRequests: number;
  /** Byte massimi scaricati per pagina: oltre, si tronca e si segnala. */
  maxBytesPerPage: number;
  /** Millisecondi massimi per richiesta. */
  timeoutMs: number;
  /** Tentativi per URL, il primo compreso. */
  maxAttempts: number;
  /** Pausa minima fra due richieste allo STESSO host, in ms. */
  minDelayPerHostMs: number;
}

/**
 * Budget prudente di default.
 *
 * `minDelayPerHostMs` non è una difesa nostra ma una cortesia verso l'altro: un comune di
 * quindicimila abitanti non ha un'infrastruttura pensata per raffiche di richieste, e una
 * pausa di un secondo costa a noi nulla e a loro molto.
 */
export const DEFAULT_INGESTION_BUDGET: IngestionBudget = {
  maxRequests: 20,
  maxBytesPerPage: 512 * 1024,
  timeoutMs: 10_000,
  maxAttempts: 2,
  minDelayPerHostMs: 1000,
};

/** Traccia il consumo del budget. Un'istanza per esecuzione. */
export class BudgetTracker {
  private requests = 0;
  private lastRequestPerHost = new Map<string, number>();

  constructor(private readonly budget: IngestionBudget = DEFAULT_INGESTION_BUDGET) {}

  get used(): number {
    return this.requests;
  }

  get remaining(): number {
    return Math.max(0, this.budget.maxRequests - this.requests);
  }

  /** true se c'è ancora budget per una richiesta. */
  canRequest(): boolean {
    return this.remaining > 0;
  }

  /** Millisecondi da attendere prima di interrogare di nuovo questo host. */
  delayFor(host: string, now: number): number {
    const last = this.lastRequestPerHost.get(host);
    if (last === undefined) return 0;
    return Math.max(0, this.budget.minDelayPerHostMs - (now - last));
  }

  /** Registra una richiesta effettuata. */
  record(host: string, now: number): void {
    this.requests++;
    this.lastRequestPerHost.set(host, now);
  }
}
