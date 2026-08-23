// STRATO 1 del cancello di pubblicazione: validazione DETERMINISTICA di una narrativa d'area.
//
// Gira PRIMA del giudice AI, e la sequenza non è casuale. Questo strato non ha opinioni: o ogni
// affermazione è agganciata a un fatto approvato e fresco, o non lo è. Farlo per primo significa
// che le bozze rotte non arrivano mai a costare una chiamata al modello, e soprattutto che il
// verdetto sulle cose verificabili non dipende da un giudizio.
//
// LA DOMANDA CHE PONE, in una riga: *ogni frase di questo testo si può ricondurre a evidenza
// approvata?* Se no, il testo non esce — per bello che sia. Il test più importante di questo
// modulo è infatti quello in cui una narrativa scritta benissimo viene bocciata perché cita un
// parco di cui non esiste alcun fatto.

import { findSubjectiveViolations } from "./../subjective";
import { areaSlug, parseAreaKey } from "../identity";
import { AREA_CATEGORY_ORDER } from "../categories";
import { areaFactsHash } from "../hash";
import { AreaNarrativeSchema } from "../types";
import type { AreaFact, AreaNarrative } from "../types";
import { numbersIn, longestCommonWordRun, COPIED_RUN_THRESHOLD } from "../factGuard";

export type NarrativeFailureCode =
  | "schema-invalid"
  | "area-key-mismatch"
  | "claim-without-facts"
  | "fact-not-found"
  | "fact-not-approved"
  | "fact-stale"
  | "fact-not-in-area"
  | "section-fact-not-found"
  | "category-out-of-order"
  | "category-repeated"
  | "duplicate-fact-across-sections"
  | "repeated-sentence"
  | "intro-length"
  | "section-count"
  | "prohibited-language"
  | "unsupported-number"
  | "unsupported-place-name"
  | "coordinates-exposed"
  | "address-exposed"
  | "facts-hash-mismatch"
  | "copied-fact-language";

export interface NarrativeFailure {
  code: NarrativeFailureCode;
  message: string;
  evidence?: string;
}

export interface NarrativeValidationInput {
  narrative: AreaNarrative;
  /** I fatti APPROVATI dell'area, così come lo store li restituisce adesso. */
  approvedFacts: readonly AreaFact[];
  now: Date;
  /** Versione di prompt attesa: serve a ricalcolare l'impronta e scoprire un testo obsoleto. */
  promptVersion: string;
}

export interface NarrativeValidationResult {
  /** Vuoto = nessun ostacolo deterministico. NON significa "pubblicabile": manca il giudice. */
  failures: NarrativeFailure[];
  /** I factId effettivamente citati, per il report editoriale. */
  citedFactIds: string[];
}

/** Introduzione: fra 60 e 90 parole (regola editoriale dell'audit). */
export const INTRO_MIN_WORDS = 60;
export const INTRO_MAX_WORDS = 90;
export const MIN_SECTIONS = 2;
export const MAX_SECTIONS = 5;

const COORD_RE = /\b-?\d{1,3}\.\d{4,}\s*[,;]\s*-?\d{1,3}\.\d{4,}\b/;
const ADDRESS_RE = /\b(via|viale|piazza|piazzale|corso|vicolo|largo|strada)\s+[A-ZÀ-Ù][\w'À-ù]*(?:\s+[A-ZÀ-Ù]?[\w'À-ù]+){0,3},?\s*(?:n\.?\s*)?\d+\b/i;

function words(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

/** Tutto il testo leggibile della narrativa, in un pezzo solo. */
function allProse(n: AreaNarrative): string {
  return [n.title, n.intro, ...n.sections.flatMap((s) => [s.heading, s.body])].join("\n");
}

/**
 * I NOMI PROPRI del testo: parole capitalizzate che non aprono una frase.
 *
 * È l'euristica che prende il toponimo inventato — il modo di fallire più insidioso di tutto il
 * dominio, perché una stazione o un parco che non esistono suonano identici a quelli che
 * esistono. Volutamente grezza e volutamente severa: un nome proprio che non compare in nessun
 * fatto approvato va guardato da un umano, anche quando è innocuo.
 */
export function properNamesIn(text: string): string[] {
  const out = new Set<string>();
  // Si spezza in frasi per non contare come "nome proprio" la parola iniziale di ciascuna.
  for (const sentence of text.split(/(?<=[.!?:\n])\s+/)) {
    const tokens = sentence.trim().split(/\s+/);
    tokens.forEach((raw, i) => {
      const token = raw.replace(/^[«"'(]+|[»"'),.;:!?]+$/g, "");
      if (i === 0) return; // apertura di frase: la maiuscola non dice nulla
      if (!/^[A-ZÀ-Ù][\wÀ-ù'’-]{2,}$/.test(token)) return;
      out.add(token);
    });
  }
  return [...out];
}

function push(list: NarrativeFailure[], code: NarrativeFailureCode, message: string, evidence?: string): void {
  list.push(evidence === undefined ? { code, message } : { code, message, evidence });
}

/**
 * Tutti i motivi deterministici per cui la narrativa NON è pubblicabile.
 *
 * Non ripara, non riscrive, non sceglie. Produce l'elenco, e chi lo riceve decide se mandare in
 * riparazione o scartare.
 */
export function validateNarrative(input: NarrativeValidationInput): NarrativeValidationResult {
  const { narrative, approvedFacts, now } = input;
  const f: NarrativeFailure[] = [];

  // ── Forma ──────────────────────────────────────────────────
  const parsed = AreaNarrativeSchema.safeParse(narrative);
  if (!parsed.success) {
    push(f, "schema-invalid", `Struttura non conforme: ${parsed.error.issues[0]?.message ?? "?"}`);
    // Senza una forma valida gli altri controlli leggerebbero campi che potrebbero non esserci.
    return { failures: f, citedFactIds: [] };
  }

  const introWords = words(narrative.intro).length;
  if (introWords < INTRO_MIN_WORDS || introWords > INTRO_MAX_WORDS) {
    push(f, "intro-length", `Introduzione di ${introWords} parole: attese fra ${INTRO_MIN_WORDS} e ${INTRO_MAX_WORDS}.`);
  }
  if (narrative.sections.length < MIN_SECTIONS || narrative.sections.length > MAX_SECTIONS) {
    push(f, "section-count", `${narrative.sections.length} sezioni: attese fra ${MIN_SECTIONS} e ${MAX_SECTIONS}.`);
  }

  // ── Ordine e unicità delle categorie ───────────────────────
  const seenCategories = new Set<string>();
  let lastIndex = -1;
  for (const section of narrative.sections) {
    if (seenCategories.has(section.category)) {
      push(f, "category-repeated", `La categoria "${section.category}" compare due volte.`, section.category);
    }
    seenCategories.add(section.category);
    const index = AREA_CATEGORY_ORDER.indexOf(section.category);
    if (index < lastIndex) {
      // L'ordine è ciò che rende le schede confrontabili fra loro: senza, ogni pagina è
      // un'impaginazione diversa e il lettore deve ricominciare a orientarsi ogni volta.
      push(f, "category-out-of-order", `"${section.category}" fuori dall'ordine canonico.`, section.category);
    }
    lastIndex = Math.max(lastIndex, index);
  }

  // ── Aggancio all'evidenza ──────────────────────────────────
  const byId = new Map(approvedFacts.map((x) => [x.id, x]));
  const areaParts = parseAreaKey(narrative.areaKey);
  const cited = new Set<string>();

  const checkFactRef = (factId: string, where: NarrativeFailureCode): void => {
    cited.add(factId);
    const fact = byId.get(factId);
    if (!fact) {
      push(f, where, `Il fatto ${factId} non esiste fra quelli approvati dell'area.`, factId);
      return;
    }
    if (fact.status !== "approved") {
      push(f, "fact-not-approved", `Il fatto ${factId} non è approvato (stato "${fact.status}").`, factId);
    }
    const review = Date.parse(fact.reviewBy);
    if (!Number.isNaN(review) && review < now.getTime()) {
      push(f, "fact-stale", `Il fatto ${factId} ha superato la data di revisione.`, factId);
    }
    if (areaParts.municipality && areaSlug(fact.municipality) !== areaParts.municipality) {
      push(f, "fact-not-in-area", `Il fatto ${factId} riguarda "${fact.municipality}", non quest'area.`, factId);
    }
  };

  for (const section of narrative.sections) {
    for (const id of section.factIds) checkFactRef(id, "section-fact-not-found");
  }

  // Ogni affermazione della claimMap deve avere fatti, e i fatti devono esistere.
  for (const claim of narrative.claimMap) {
    if (claim.factIds.length === 0) {
      push(f, "claim-without-facts", `L'affermazione «${claim.claim}» non è agganciata a nessun fatto.`, claim.claim);
      continue;
    }
    for (const id of claim.factIds) checkFactRef(id, "fact-not-found");
  }

  // Lo STESSO fatto in due sezioni diverse: il lettore lo legge due volte con parole diverse e
  // pensa che siano due cose.
  const factSections = new Map<string, string[]>();
  for (const section of narrative.sections) {
    for (const id of section.factIds) {
      factSections.set(id, [...(factSections.get(id) ?? []), section.category]);
    }
  }
  for (const [id, sections] of factSections) {
    if (sections.length > 1) {
      push(f, "duplicate-fact-across-sections", `Il fatto ${id} compare in ${sections.join(" e ")}.`, id);
    }
  }

  // ── Chiave d'area ──────────────────────────────────────────
  if (!areaParts.municipality) {
    push(f, "area-key-mismatch", `Chiave d'area senza comune: "${narrative.areaKey}".`, narrative.areaKey);
  }

  // ── Impronta dei fatti ─────────────────────────────────────
  const expected = areaFactsHash(approvedFacts, {
    locale: narrative.locale,
    promptVersion: input.promptVersion,
  });
  if (narrative.factsHash !== expected) {
    // Il testo è nato da un insieme di fatti diverso da quello attuale: pubblicarlo
    // significherebbe affermare oggi ciò che era vero al momento della generazione.
    push(
      f,
      "facts-hash-mismatch",
      "I fatti approvati dell'area sono cambiati dopo la generazione: il testo va rifatto.",
      `atteso ${expected}, trovato ${narrative.factsHash}`,
    );
  }

  // ── Linguaggio e affermazioni ──────────────────────────────
  const prose = allProse(narrative);

  for (const violation of findSubjectiveViolations(prose)) {
    push(f, "prohibited-language", `Linguaggio vietato (${violation.category}).`, violation.match);
  }
  if (COORD_RE.test(prose)) {
    push(f, "coordinates-exposed", "Nel testo compaiono coordinate: non escono mai dal server.", prose.match(COORD_RE)?.[0]);
  }
  const address = prose.match(ADDRESS_RE);
  if (address) {
    push(f, "address-exposed", "Nel testo compare un indirizzo con numero civico.", address[0]);
  }

  // NUMERI. Ammessi solo quelli che compaiono in un fatto citato. È il controllo che ferma il
  // "circa 40 corse" nato da un fatto che diceva 42.
  const factNumbers = new Set<string>();
  for (const id of cited) {
    const fact = byId.get(id);
    if (fact) for (const n of numbersIn(fact.text)) factNumbers.add(n);
  }
  for (const n of numbersIn(prose)) {
    if (!factNumbers.has(n)) {
      push(f, "unsupported-number", `Il numero ${n} non compare in nessun fatto citato.`, n);
    }
  }

  // NOMI PROPRI. Stessa logica dei numeri, applicata ai toponimi — il modo di sbagliare più
  // insidioso, perché un parco inventato suona come uno vero.
  const factNames = new Set<string>();
  for (const id of cited) {
    const fact = byId.get(id);
    if (fact) for (const name of properNamesIn(`. ${fact.text}`)) factNames.add(name.toLowerCase());
  }
  // L'etichetta dell'area è sempre lecita: è il soggetto del testo.
  for (const label of [areaParts.municipality, areaParts.neighbourhood]) {
    if (label) for (const piece of label.split("-")) factNames.add(piece.toLowerCase());
  }
  for (const name of properNamesIn(prose)) {
    if (!factNames.has(name.toLowerCase())) {
      push(f, "unsupported-place-name", `"${name}" non compare in nessun fatto citato.`, name);
    }
  }

  // FRASI RIPETUTE dentro lo stesso testo.
  const sentences = prose
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 25);
  const seenSentences = new Set<string>();
  for (const sentence of sentences) {
    if (seenSentences.has(sentence)) {
      push(f, "repeated-sentence", "La stessa frase compare due volte nel testo.", sentence.slice(0, 60));
    }
    seenSentences.add(sentence);
  }

  // COPIATURA DEL FATTO. Il fatto è già una parafrasi della fonte: ricopiarlo parola per parola
  // nella narrativa produce un testo che è un elenco di fatti incollati, non una descrizione.
  for (const section of narrative.sections) {
    for (const id of section.factIds) {
      const fact = byId.get(id);
      if (fact && longestCommonWordRun(section.body, fact.text) >= COPIED_RUN_THRESHOLD) {
        push(f, "copied-fact-language", `La sezione "${section.category}" ricopia il fatto ${id} invece di raccontarlo.`, id);
      }
    }
  }

  return { failures: f, citedFactIds: [...cited].sort() };
}
