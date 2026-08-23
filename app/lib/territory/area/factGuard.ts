// VALIDAZIONE DURA di un fatto d'area, prima che qualcuno possa approvarlo (Prompt 6).
//
// `subjective.ts` copre già il linguaggio valutativo. Questo modulo copre tutto il resto di ciò
// che rende un fatto NON pubblicabile — e lo fa in modo DETERMINISTICO: regole pure, nessun
// modello, nessuna rete. Un modello che giudica se stesso non è un controllo.
//
// LA REGOLA GENERALE: nel dubbio si BLOCCA. Un fatto bloccato costa a un revisore trenta secondi;
// un fatto sbagliato pubblicato su una scheda immobiliare costa credibilità, e in Italia
// affermazioni su sicurezza, prestigio o "tipo di residenti" costano anche di più.
//
// COSA NON FA. Non corregge, non riscrive, non sceglie fra fonti in conflitto. Produce l'elenco
// dei motivi per cui il fatto non passa, e li passa a un umano. Un guard che aggiusta il testo
// per farlo passare è un guard che non serve a niente.

import { findSubjectiveViolations } from "./subjective";
import { areaSlug, parseAreaKey } from "./identity";
import type { AreaFact } from "./types";
import type { AreaSourceRecord } from "./store/repository";

// ─────────────────────────────────────────────────────────────
// Esiti
// ─────────────────────────────────────────────────────────────

export type FactViolationCode =
  // provenienza
  | "missing-provenance"
  | "source-not-found"
  | "source-unreachable"
  | "source-stale"
  | "fact-stale"
  // geografia
  | "scope-mismatch"
  | "wrong-municipality"
  | "wrong-neighbourhood"
  // duplicazione e conflitto
  | "duplicate-fact"
  | "near-duplicate-fact"
  | "unresolved-conflict"
  // linguaggio
  | "subjective-language"
  | "promotional-language"
  | "ranking-claim"
  | "school-quality-claim"
  | "protected-class-implication"
  // affermazioni non sostenute
  | "unsupported-number"
  | "copied-source-language"
  | "travel-time-without-routing"
  | "exact-address-disclosure";

export interface FactViolation {
  code: FactViolationCode;
  /** Messaggio in italiano per la coda editoriale: dice cosa fare, non solo cosa è rotto. */
  message: string;
  /** Il frammento che ha fatto scattare la regola, quando c'è. */
  evidence?: string;
}

/** Stato del ciclo di vita che il fatto MERITA, dato ciò che si sa adesso. */
export type FactLifecycleState = "candidate" | "approvable" | "rejected" | "conflicted" | "stale";

export interface FactValidationInput {
  fact: AreaFact;
  /** La chiave canonica dell'area a cui il fatto viene attribuito. */
  areaKey: string;
  now: Date;
  /** La fonte registrata, se già nota allo store: serve a valutarne stato e freschezza. */
  source?: AreaSourceRecord | null;
  /** Gli altri fatti già presenti nell'area: servono a riconoscere duplicati e quasi-duplicati. */
  existingFacts?: readonly AreaFact[];
  /**
   * Un estratto del testo della fonte. Quando c'è, abilita due controlli che senza sono
   * impossibili: i numeri non sostenuti e la copiatura letterale. Quando non c'è, i due
   * controlli NON scattano — e questo è dichiarato, non silenzioso: vedi `checkedAgainstSource`.
   */
  sourceExcerpt?: string;
}

export interface FactValidationResult {
  violations: FactViolation[];
  state: FactLifecycleState;
  /** true se numeri e copiatura sono stati confrontati con la fonte. false = controllo NON eseguito. */
  checkedAgainstSource: boolean;
}

// ─────────────────────────────────────────────────────────────
// Regole di linguaggio
// ─────────────────────────────────────────────────────────────

/**
 * Linguaggio PROMOZIONALE: non è valutativo in senso stretto (non dice "bello"), ma afferma una
 * comodità che nessuna fonte può documentare. "A due passi" è una distanza senza numero, e la
 * sua funzione è esattamente quella di non essere verificabile.
 */
const PROMOTIONAL = [
  { re: /\ba due passi\b/i, hint: 'sostituire con la distanza misurata ("a circa 550 m in linea d\'aria")' },
  { re: /\bpochi passi\b/i, hint: "sostituire con la distanza misurata" },
  { re: /\bservitissim\w*\b/i, hint: "elencare i servizi verificati invece di riassumerli in un superlativo" },
  { re: /\bposizione strategica\b/i, hint: "dire quale collegamento, con il suo nome" },
  { re: /\bcomodissim\w*\b/i, hint: "dire rispetto a cosa, con la distanza" },
  { re: /\bben (servit|collegat)\w*\b/i, hint: "nominare la linea o il servizio verificato" },
  { re: /\btutto (a portata di mano|nelle vicinanze)\b/i, hint: "elencare cosa, con la distanza" },
  { re: /\bcuore (pulsante|della città)\b/i, hint: "linguaggio da annuncio, non un fatto" },
  { re: /\bcontesto (residenziale )?(tranquill|esclusiv)\w*\b/i, hint: "affermazione non documentabile" },
  // "tranquilla" e "ben frequentata" non hanno bisogno della parola "zona" davanti per essere
  // la stessa affermazione: l'audit chiede di non sostituirle affatto in mancanza di dati
  // oggettivi (rumore, traffico), non di riformularle meglio.
  { re: /\btranquill[oaie]\b/i, hint: "senza dati oggettivi sul rumore, non si afferma" },
  { re: /\bben frequentat\w*\b/i, hint: "giudizio su chi frequenta un luogo: non è un fatto territoriale" },
  { re: /\b(poco|mal) frequentat\w*\b/i, hint: "giudizio su chi frequenta un luogo: non è un fatto territoriale" },
];

/**
 * CLASSIFICHE. Vietate anche quando la fonte le riporta davvero: una classifica è un giudizio
 * di qualcun altro, e ripeterla su una scheda immobiliare la fa diventare un'affermazione
 * dell'agenzia. Il fatto ammesso è «esiste la scuola X», non «è fra le migliori».
 */
const RANKING = /\b(classific\w*|al primo posto|prim[ao] (in|per|fra|tra)\b|fra i (miglior|primi)\w*|tra i (miglior|primi)\w*|si posiziona|graduatori\w*|ranking|top \d+)\b/i;

/**
 * QUALITÀ DELLE SCUOLE. Categoria a sé perché è la tentazione più forte di tutto il dominio:
 * chi compra casa con figli la cerca, e nessuna fonte pubblica la documenta in modo utilizzabile.
 * Si può dire che una scuola ESISTE e di che grado è. Nient'altro.
 */
const SCHOOL_QUALITY = /\b(scuol\w+|istitut\w+|licei?\b|liceo)\b[^.]{0,40}\b(eccellent\w*|ottim\w*|miglior\w*|prestigios\w*|rinomat\w*|qualificat\w*|d'eccellenza|di qualità|rinomate)\b|\b(eccellent\w*|ottim\w*|miglior\w*|rinomat\w*)\b[^.]{0,40}\b(scuol\w+|istitut\w+|licei?\b|liceo)\b/i;

/**
 * CLASSI PROTETTE. In Italia la pubblicità immobiliare non può selezionare per origine, religione,
 * disabilità, orientamento o composizione familiare — nemmeno in positivo, nemmeno per sbaglio.
 * "Zona abitata da giovani famiglie" è una segmentazione, non una descrizione del territorio.
 */
const PROTECTED_CLASS = /\b(abitat[ao] (da|prevalentemente)|popolazione (giovane|anziana|straniera)|comunità (straniera|religiosa|islamica|cattolica)|quartiere (di|per) (anziani|giovani|famiglie|studenti)|prevalenza di \w+ famiglie|zona (di|per) famiglie)\b/i;

/**
 * TEMPI DI PERCORRENZA. Una distanza in linea d'aria non è un tempo, e nessuna delle due è un
 * percorso. "Dieci minuti a piedi" richiede un calcolo di itinerario reale: senza, è inventato —
 * ed è la classe di affermazione che sulla scheda di una casa viene letta come una promessa.
 */
const TRAVEL_TIME =
  /\b(?:\d+\s*(?:minut\w*|min\b|or[ae]\b|h\b)|pochi minuti|un quarto d'ora|mezz'ora)[^.]{0,30}\b(?:a piedi|in auto|in macchina|in bici|di cammino|in treno|d'auto)\b|\b(?:a piedi|in auto|in bici)\b[^.]{0,20}(?:\d+\s*(?:minut\w*|min\b)|pochi minuti)/i;

/**
 * INDIRIZZO CIVICO. Un fatto d'area descrive un'area. Un indirizzo con numero civico è la
 * posizione di un edificio: se è quello dell'immobile è una fuga di dati, e se è quello di un
 * servizio pubblico è comunque una precisione che il dominio d'area non usa.
 *
 * Le sedi istituzionali senza civico ("il municipio di Tradate") restano ammesse: il divieto
 * scatta sul CIVICO, che è la parte identificante.
 */
const EXACT_ADDRESS = /\b(via|viale|piazza|piazzale|corso|vicolo|largo|strada)\s+[A-ZÀ-Ù][\w'À-ù]*(?:\s+[A-ZÀ-Ù]?[\w'À-ù]+){0,3},?\s*(?:n\.?\s*)?\d+\b/i;

// ─────────────────────────────────────────────────────────────
// Similitudine testuale (duplicati e copiatura)
// ─────────────────────────────────────────────────────────────

/** Parole significative, minuscole e senza punteggiatura. Le parole vuote non distinguono nulla. */
const STOPWORDS = new Set([
  "il","lo","la","i","gli","le","un","uno","una","di","a","da","in","con","su","per","tra","fra",
  "e","ed","o","che","è","del","della","dei","delle","dello","degli","al","alla","ai","alle","allo",
  "dal","dalla","dai","dalle","nel","nella","nei","nelle","sul","sulla","sui","sulle","si","non",
]);

export function significantWords(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));
}

/**
 * Somiglianza di Jaccard sulle parole significative: |intersezione| / |unione|.
 *
 * Sceglie i quasi-duplicati meglio di un confronto di stringhe perché è insensibile all'ordine:
 * «la stazione di Tradate serve la linea regionale» e «la linea regionale serve la stazione di
 * Tradate» sono lo stesso fatto scritto due volte, e un `===` non se ne accorgerebbe mai.
 */
export function jaccardSimilarity(a: string, b: string): number {
  const sa = new Set(significantWords(a));
  const sb = new Set(significantWords(b));
  if (sa.size === 0 && sb.size === 0) return 1;
  if (sa.size === 0 || sb.size === 0) return 0;
  let shared = 0;
  for (const w of sa) if (sb.has(w)) shared++;
  return shared / (sa.size + sb.size - shared);
}

/**
 * Sopra questa soglia due fatti dicono la stessa cosa e uno dei due è di troppo.
 *
 * 0.7 e non 0.8 per una ragione misurata: l'italiano flette, e «la linea serve la stazione» /
 * «la stazione è servita dalla linea» condividono cinque parole su sette — 0.71. Sono lo stesso
 * fatto scritto due volte, ed è proprio il caso che questa soglia deve prendere. Fatti davvero
 * diversi sulla stessa cosa restano molto sotto: «la stazione serve la linea Saronno–Varese» e
 * «la stazione ha un parcheggio di interscambio» stanno a 0.25.
 */
export const NEAR_DUPLICATE_THRESHOLD = 0.7;

/**
 * La più lunga sequenza di parole CONSECUTIVE in comune fra due testi.
 *
 * È il modo di distinguere una parafrasi da una copiatura. Una parafrasi condivide i nomi propri
 * e i numeri, non l'andamento della frase: oltre una certa lunghezza, la sequenza identica non
 * può essere una coincidenza — è il testo della fonte, e riprodurlo è un problema di diritto
 * d'autore prima ancora che di stile.
 */
export function longestCommonWordRun(a: string, b: string): number {
  const wa = significantWords(a);
  const wb = significantWords(b);
  if (wa.length === 0 || wb.length === 0) return 0;
  // Programmazione dinamica su una riga sola: le sequenze qui sono frasi, non documenti.
  let best = 0;
  let previous = new Array<number>(wb.length + 1).fill(0);
  for (let i = 1; i <= wa.length; i++) {
    const current = new Array<number>(wb.length + 1).fill(0);
    for (let j = 1; j <= wb.length; j++) {
      if (wa[i - 1] === wb[j - 1]) {
        current[j] = previous[j - 1] + 1;
        if (current[j] > best) best = current[j];
      }
    }
    previous = current;
  }
  return best;
}

/** Oltre questa lunghezza la sequenza identica non è più una coincidenza. */
export const COPIED_RUN_THRESHOLD = 8;

/** I numeri citati nel testo, normalizzati (separatori italiani compresi). */
export function numbersIn(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(/\d+(?:[.,]\d+)*/g)) {
    // "1.200" e "1200" sono lo stesso numero: si toglie il separatore delle migliaia e si
    // normalizza la virgola decimale, così il confronto con la fonte non fallisce per formato.
    out.push(m[0].replace(/\.(?=\d{3}\b)/g, "").replace(",", "."));
  }
  return out;
}

// ─────────────────────────────────────────────────────────────
// La validazione
// ─────────────────────────────────────────────────────────────

function push(list: FactViolation[], code: FactViolationCode, message: string, evidence?: string): void {
  list.push(evidence === undefined ? { code, message } : { code, message, evidence });
}

/**
 * Tutti i motivi per cui il fatto NON è pubblicabile. Lista vuota = nulla osta al controllo
 * deterministico — che NON è un'approvazione: quella resta un atto umano.
 */
export function validateAreaFact(input: FactValidationInput): FactValidationResult {
  const { fact, areaKey, now } = input;
  const v: FactViolation[] = [];
  const text = fact.text ?? "";

  // ── Provenienza ────────────────────────────────────────────
  if (!fact.source?.url?.trim() || !fact.source?.owner?.trim() || !fact.source?.retrievedAt?.trim()) {
    push(v, "missing-provenance", "Fonte incompleta: servono URL, ente proprietario e data di recupero.");
  }

  if (input.source === null) {
    push(v, "source-not-found", "La fonte citata non è registrata nello store: non se ne può valutare lo stato.");
  } else if (input.source) {
    if (input.source.status === "unreachable") {
      push(v, "source-unreachable", `Fonte irraggiungibile all'ultimo controllo (HTTP ${input.source.lastHttpStatus ?? "?"}).`, input.source.canonicalUrl);
    }
    if (input.source.status === "stale" || Date.parse(input.source.reviewBy) < now.getTime()) {
      push(v, "source-stale", "La fonte ha superato la data di revisione: va ricontrollata prima di pubblicare.", input.source.canonicalUrl);
    }
  }

  const factReview = Date.parse(fact.reviewBy);
  if (!Number.isNaN(factReview) && factReview < now.getTime()) {
    push(v, "fact-stale", "Il fatto ha superato la propria data di revisione.", fact.reviewBy);
  }

  // ── Geografia ──────────────────────────────────────────────
  const parts = parseAreaKey(areaKey);
  if (fact.municipality && parts.municipality && areaSlug(fact.municipality) !== parts.municipality) {
    push(v, "wrong-municipality", `Il fatto dichiara "${fact.municipality}" ma è attribuito all'area ${areaKey}.`, fact.municipality);
  }
  if (fact.zone && parts.neighbourhood && areaSlug(fact.zone) !== parts.neighbourhood) {
    push(v, "wrong-neighbourhood", `Il fatto dichiara la zona "${fact.zone}" ma l'area è ${areaKey}.`, fact.zone);
  }
  // Un fatto a scala di quartiere attaccato a un profilo di comune vale per tutto il comune:
  // è più largo di quanto la fonte sostenga.
  if (fact.scope === "zone" && !parts.neighbourhood) {
    push(v, "scope-mismatch", "Fatto di ambito «zona» attribuito a un profilo di comune: varrebbe per tutto il comune.");
  }
  if (fact.scope === "region" && fact.zone) {
    push(v, "scope-mismatch", "Fatto di ambito «regione» con una zona: i due ambiti non possono coesistere.");
  }

  // ── Conflitti ──────────────────────────────────────────────
  if (fact.conflicts.length > 0) {
    push(v, "unresolved-conflict", `${fact.conflicts.length} fonte/i in conflitto non risolte: decide un revisore, mai il sistema.`, fact.conflicts[0]?.note);
  }

  // ── Duplicati ──────────────────────────────────────────────
  for (const other of input.existingFacts ?? []) {
    if (other.id === fact.id) continue;
    if (other.status === "rejected") continue; // un fatto già scartato non blocca il suo sostituto
    const sameSource = other.source.url.trim().toLowerCase() === fact.source?.url?.trim().toLowerCase();
    const sameText = other.text.trim().replace(/\s+/g, " ").toLowerCase() === text.trim().replace(/\s+/g, " ").toLowerCase();
    if (sameSource && sameText) {
      push(v, "duplicate-fact", `Identico al fatto ${other.id} (stessa fonte, stesso testo).`, other.id);
      continue;
    }
    if (jaccardSimilarity(other.text, text) >= NEAR_DUPLICATE_THRESHOLD) {
      push(v, "near-duplicate-fact", `Dice la stessa cosa del fatto ${other.id}: tenerne uno solo.`, other.id);
    }
  }

  // ── Linguaggio ─────────────────────────────────────────────
  for (const s of findSubjectiveViolations(text)) {
    push(v, "subjective-language", `Linguaggio soggettivo (${s.category}): un fatto d'area descrive, non giudica.`, s.match);
  }
  for (const { re, hint } of PROMOTIONAL) {
    const m = text.match(re);
    if (m) push(v, "promotional-language", `Linguaggio da annuncio: ${hint}.`, m[0]);
  }
  const ranking = text.match(RANKING);
  if (ranking) {
    push(v, "ranking-claim", "Classifiche vietate anche quando la fonte le riporta: ripeterle le fa diventare un'affermazione dell'agenzia.", ranking[0]);
  }
  const school = text.match(SCHOOL_QUALITY);
  if (school) {
    push(v, "school-quality-claim", "Sulla scuola si può dire che esiste e di che grado è, non quanto è buona.", school[0]);
  }
  const protectedClass = text.match(PROTECTED_CLASS);
  if (protectedClass) {
    push(v, "protected-class-implication", "Segmentazione per tipo di residenti: vietata nella pubblicità immobiliare, anche in positivo.", protectedClass[0]);
  }

  // ── Affermazioni non sostenute ─────────────────────────────
  const travel = text.match(TRAVEL_TIME);
  if (travel) {
    push(v, "travel-time-without-routing", "Tempo di percorrenza senza un calcolo di itinerario reale: la distanza in linea d'aria non è un tempo.", travel[0]);
  }
  const address = text.match(EXACT_ADDRESS);
  if (address) {
    push(v, "exact-address-disclosure", "Indirizzo con numero civico: il dominio d'area descrive aree, non edifici.", address[0]);
  }

  const excerpt = input.sourceExcerpt?.trim();
  const checkedAgainstSource = Boolean(excerpt);
  if (excerpt) {
    const sourceNumbers = new Set(numbersIn(excerpt));
    for (const n of numbersIn(text)) {
      if (!sourceNumbers.has(n)) {
        push(v, "unsupported-number", `Il numero ${n} non compare nella fonte citata.`, n);
      }
    }
    const run = longestCommonWordRun(text, excerpt);
    if (run >= COPIED_RUN_THRESHOLD) {
      push(v, "copied-source-language", `${run} parole consecutive identiche alla fonte: serve una parafrasi, non una citazione.`);
    }
  }

  return { violations: v, state: lifecycleFor(fact, v), checkedAgainstSource };
}

/**
 * Lo stato che il fatto MERITA dato l'esito. Nota: `approvable` non è `approved` — dice
 * "nessun ostacolo automatico", e l'approvazione resta un atto umano con nome e data.
 */
function lifecycleFor(fact: AreaFact, violations: readonly FactViolation[]): FactLifecycleState {
  if (violations.length === 0) return "approvable";
  const codes = new Set(violations.map((x) => x.code));
  // L'ordine conta: un conflitto è una decisione da prendere, non un errore da correggere, e
  // va distinto dallo scarto perché il fatto potrebbe essere quello giusto dei due.
  if (codes.has("unresolved-conflict")) return "conflicted";
  // Scaduto è recuperabile ricontrollando la fonte: non è un rifiuto.
  const onlyStale = [...codes].every((c) => c === "source-stale" || c === "fact-stale");
  if (onlyStale) return "stale";
  return fact.status === "approved" ? "rejected" : "candidate";
}

/** Scorciatoia: il fatto supera tutti i controlli deterministici? */
export function isFactApprovable(input: FactValidationInput): boolean {
  return validateAreaFact(input).violations.length === 0;
}
