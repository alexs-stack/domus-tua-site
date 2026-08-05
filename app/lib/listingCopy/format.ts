// Formattazione di PRESENTAZIONE delle descrizioni immobiliari.
//
// PERCHÉ ESISTE QUESTO MODULO
// `app/lib/realsmart/description.ts` consegna una descrizione pulita: un elenco di paragrafi
// di testo semplice. In pagina finivano tutti nello stesso <p> grigio, uno sotto l'altro —
// un muro di prosa lungo anche 4.000 caratteri. Il copy dell'agenzia è buono; era la sua
// COMPOSIZIONE a non esserlo.
//
// Questo modulo NON tocca la catena dati (realsmart è intoccabile): legge i paragrafi già
// normalizzati e li classifica, così il livello di presentazione può dare a ciascuno la
// tipografia giusta. È la stessa separazione di descriptionSplit.ts, un gradino più in là:
// lì si decide COSA mostrare, qui COME comporlo.
//
// LA GERARCHIA (aggancio → vita quotidiana → dati concreti → invito)
// Gli annunci reali di Domus Tua seguono già questo arco: si aprono con una frase-amo,
// raccontano com'è viverci, elencano le dotazioni e chiudono con un invito a visitare.
// Il formatter quindi NON riordina nulla — riordinare la prosa di un'agenzia significa
// riscriverla — ma riconosce l'arco e lo rende VISIBILE con la tipografia.
//
// I VINCOLI (non negoziabili)
//   • funzione PURA e deterministica: stesso input → stesso output, nessuna rete, nessun
//     Date/Math.random (gira sia in SSR sia dopo l'idratazione: deve coincidere);
//   • NON riscrive, NON riassume, NON parafrasa, NON inventa: le "runs" di ogni blocco
//     ricomposte danno ESATTAMENTE il paragrafo di partenza;
//   • numeri, prezzi, unità di misura e nomi propri restano identici, carattere per
//     carattere (test dedicato sul multiset delle cifre);
//   • non lancia MAI: qualunque paragrafo che faccia inciampare la classificazione
//     ricade su un paragrafo normale;
//   • le uniche soppressioni ammesse sono segni di composizione, mai parole: gli asterischi
//     di enfasi dell'autore (*così*), i due punti di un suo titoletto, i separatori delle
//     voci di elenco (virgole, "·", e la congiunzione finale "e"). Tutto misurato da
//     `preservation`, che sulle parole significative resta 1 anche in questi casi.
//
// LA DISCIPLINA
// Ogni effetto ha un tetto: al massimo 2 righe d'accento, 2 elenchi e 5 grassetti per
// annuncio, e mai due accenti di fila. Un annuncio in cui tutto è evidenziato è un annuncio
// in cui non è evidenziato niente.

import {
  ABBREVIATIONS,
  ATMOSPHERE_CUES,
  CLOSING_CUES,
  ENUM_LEAD_INS,
  HIGHLIGHTS,
} from "./lexicon";

// ── Modello ──────────────────────────────────────────────────────────────────

/** Frammento di testo con il suo peso tipografico. `v` è sempre testo originale. */
export type Run =
  | { t: "text"; v: string }
  | { t: "strong"; v: string }
  | { t: "em"; v: string };

/**
 * Blocco di descrizione.
 *
 *  lead        l'aggancio d'apertura — la prima frase, in display
 *  para        prosa normale
 *  accent      riga breve e lapidaria a metà racconto (o enfasi *dell'autore*)
 *  atmosphere  paragrafo evocativo: si legge in corsivo, come un a-parte
 *  list        enumerazione di dotazioni resa a punti elenco
 *  closing     l'invito finale, il gradino verso la conversione
 */
export type ListingBlock =
  | { kind: "lead"; runs: Run[] }
  | { kind: "para"; runs: Run[] }
  | { kind: "accent"; runs: Run[] }
  | { kind: "atmosphere"; runs: Run[] }
  | { kind: "list"; lead: Run[]; items: string[] }
  | { kind: "closing"; runs: Run[] };

export interface ListingCopy {
  blocks: ListingBlock[];
  /**
   * Quota di parole significative conservate rispetto all'input (1 = nulla perso).
   * Serve ai test e a un eventuale audit: un calo improvviso è un allarme, non un dettaglio.
   */
  preservation: number;
  /** true se il testo si chiude da solo con un invito: la pagina evita di ripeterlo. */
  hasClosing: boolean;
}

// ── Tetti di disciplina ──────────────────────────────────────────────────────

const MAX_ACCENTS = 2;
const MAX_LISTS = 2;
const MAX_STRONG = 5;
/** Oltre questa lunghezza un paragrafo di prosa viene spezzato a fine frase. */
const LONG_PARAGRAPH = 420;
/** Un paragrafo più lungo di così, in apertura, cede solo la prima frase al lead. */
const LEAD_MAX = 400;
/** Una riga d'accento è breve per definizione. */
const ACCENT_MAX = 120;
/** Oltre questa lunghezza un paragrafo non è più un a-parte evocativo. */
const ATMOSPHERE_MAX = 420;
/** Paragrafi processati al massimo: rete contro input patologici. */
const MAX_PARAGRAPHS = 200;

// ── Utilità di testo ─────────────────────────────────────────────────────────

const ABBREV_SET = new Set(ABBREVIATIONS.map((a) => a.toLowerCase()));

/**
 * Spezza un testo in frasi, tenendo insieme le abbreviazioni ("ecc. Il resto…") e le
 * sigle puntate. Ricompone SEMPRE l'originale: `splitSentences(t).join("") === t`.
 */
export function splitSentences(text: string): string[] {
  const pieces = text.split(/(?<=[.!?…])(\s+)(?=[«"“'(]?[A-ZÀ-ÖØ-Þ0-9])/);
  const out: string[] = [];
  // Lo split con gruppo di cattura alterna frase / separatore: si riattacca il
  // separatore alla frase che lo precede, così nulla va perso.
  for (let i = 0; i < pieces.length; i += 2) {
    const sentence = pieces[i] + (pieces[i + 1] ?? "");
    const previous = out[out.length - 1];
    if (previous !== undefined && endsWithAbbreviation(previous)) {
      out[out.length - 1] = previous + sentence;
      continue;
    }
    out.push(sentence);
  }
  return out.filter((s) => s.length > 0);
}

function endsWithAbbreviation(sentence: string): boolean {
  const match = sentence.trimEnd().match(/(\S+)\.$/);
  if (!match) return false;
  const word = match[1].toLowerCase();
  // Iniziale puntata ("A. Rossi") o abbreviazione nota.
  return word.length === 1 || ABBREV_SET.has(word);
}

/** Token significativi, per la metrica di conservazione (stessa logica di descriptionSplit). */
const METRIC_STOPWORDS = new Set(["e", "ed"]);
function tokens(text: string): string[] {
  return (text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).filter((t) => !METRIC_STOPWORDS.has(t));
}

// ── Enfasi dell'autore: *così* ───────────────────────────────────────────────

/**
 * Trasforma gli asterischi di enfasi dell'autore in run `em`.
 * Gli annunci reali usano `*Benvenuti nella Vostra Nuova Dimora*`: sono asterischi
 * pensati come corsivo, non come testo. Se non ce ne sono, torna una run sola.
 */
function runsFromText(text: string): Run[] {
  if (!text.includes("*")) return [{ t: "text", v: text }];
  const runs: Run[] = [];
  const re = /\*([^*\n]{1,200})\*/g;
  let last = 0;
  for (let m = re.exec(text); m !== null; m = re.exec(text)) {
    if (m.index > last) runs.push({ t: "text", v: text.slice(last, m.index) });
    runs.push({ t: "em", v: m[1] });
    last = m.index + m[0].length;
  }
  if (last === 0) return [{ t: "text", v: text }];
  if (last < text.length) runs.push({ t: "text", v: text.slice(last) });
  return runs;
}

// ── Grassetto sui punti di forza ─────────────────────────────────────────────

/**
 * Mette in grassetto UN solo punto di forza per blocco: la misura o la classe energetica
 * se ci sono (dati verificabili, già scritti), altrimenti la prima dotazione dell'elenco
 * chiuso. Il testo non cambia: cambia solo dove finisce il confine tra le run.
 */
function withHighlight(runs: Run[], budget: Budget): Run[] {
  if (budget.strong <= 0) return runs;

  let best: { index: number; start: number; end: number; priority: number } | null = null;
  runs.forEach((run, index) => {
    if (run.t !== "text") return;
    for (const { priority, re } of HIGHLIGHTS) {
      const m = run.v.match(re);
      if (!m || m.index === undefined) continue;
      // Mai due volte lo stesso punto di forza: «piscina» in grassetto tre paragrafi di
      // fila non evidenzia, tappezza.
      if (budget.used.has(m[0].toLowerCase())) continue;
      const candidate = { index, start: m.index, end: m.index + m[0].length, priority };
      if (
        best === null ||
        candidate.priority < best.priority ||
        (candidate.priority === best.priority &&
          (candidate.index < best.index ||
            (candidate.index === best.index && candidate.start < best.start)))
      ) {
        best = candidate;
      }
      // La priorità 0 vince comunque: appena trovata si passa alla run successiva.
      if (priority === 0) break;
    }
  });

  if (best === null) return runs;
  // TypeScript non restringe `best` dentro la closure di forEach: l'alias lo riporta a tipo.
  const hit: { index: number; start: number; end: number } = best;

  budget.strong -= 1;
  const source = runs[hit.index];
  if (source.t === "text") budget.used.add(source.v.slice(hit.start, hit.end).toLowerCase());
  const out: Run[] = [];
  runs.forEach((run, index) => {
    if (index !== hit.index || run.t !== "text") {
      out.push(run);
      return;
    }
    const before = run.v.slice(0, hit.start);
    const middle = run.v.slice(hit.start, hit.end);
    const after = run.v.slice(hit.end);
    if (before) out.push({ t: "text", v: before });
    out.push({ t: "strong", v: middle });
    if (after) out.push({ t: "text", v: after });
  });
  return out;
}

// ── Riconoscitori ────────────────────────────────────────────────────────────

function countCues(text: string, cues: readonly RegExp[]): number {
  return cues.reduce((n, re) => (re.test(text) ? n + 1 : n), 0);
}

function hasMeasurement(text: string): boolean {
  return /\d{1,5}(?:[.,]\d{1,2})?\s?(?:mq|m²|m2)\b/i.test(text) || /€|\beuro\b/i.test(text);
}

function isAtmosphere(text: string): boolean {
  if (text.length > ATMOSPHERE_MAX) return false;
  if (hasMeasurement(text)) return false;
  return countCues(text, ATMOSPHERE_CUES) >= 2;
}

function isClosing(text: string): boolean {
  return countCues(text, CLOSING_CUES) >= 1;
}

/** Paragrafo interamente racchiuso fra asterischi: enfasi voluta dall'autore. */
function asteriskWrapped(text: string): string | null {
  const m = text.match(/^\*([^*\n]{1,200})\*$/);
  return m ? m[1] : null;
}

/**
 * Riga d'ACCENTO: breve, lapidaria, senza cifre e senza incisi.
 *
 * Il divieto di virgole è la regola che fa la differenza fra un'affermazione secca
 * («Un attico non è semplicemente un appartamento. È una scelta.») e una frase di prosa
 * qualunque che per caso è corta («La piscina, dalla forma armonica e ben posizionata, è
 * meravigliosamente integrata con il contesto.»): solo la prima merita il display.
 */
function isAccent(text: string): boolean {
  if (text.length > ACCENT_MAX) return false;
  if (/[\d,]/.test(text)) return false;
  // Una riga d'accento è retorica, non informativa: se contiene un dato (una metratura,
  // una classe energetica, una dotazione) è una riga di fatti e va letta come prosa —
  // dove può anche prendersi il grassetto, che in display non avrebbe senso.
  if (HIGHLIGHTS.some(({ re }) => re.test(text))) return false;
  const sentences = splitSentences(text);
  if (sentences.length > 3) return false;
  return sentences.length >= 2 || text.length <= 60;
}

/**
 * Titoletto scritto dall'autore in testa al paragrafo: «Un Viaggio Attraverso il Comfort
 * e lo Stile: Varcando il cancello…». Si riconosce dalle Maiuscole Di Titolo — servono
 * almeno tre parole capitalizzate, nessuna virgola, nessuna cifra — così una frase normale
 * con i due punti («Oggi a Tradate la risposta è semplice: gli attici.») non viene toccata.
 */
function readHeading(text: string): { heading: string; rest: string } | null {
  const m = text.match(/^([A-ZÀ-Þ][^.!?:,\n]{2,58}):\s+(\S[\s\S]*)$/);
  if (!m) return null;
  const heading = m[1].trim();
  if (/\d/.test(heading)) return null;
  const capitalised = heading.split(/\s+/).filter((w) => /^[A-ZÀ-Þ]/.test(w)).length;
  if (capitalised < 3) return null;
  return { heading, rest: m[2].trim() };
}

/**
 * Riga telegrafica a separatori — «Classe B · Doppio terrazzo · Vista Monte Rosa».
 *
 * `descriptionSplit` a monte la toglie dal testo quando ogni suo frammento è già finito
 * nei box dei dati; quando ne resta anche uno irrisolto, la riga arriva fin qui. Renderla
 * come prosa è il peggiore dei mondi: è un elenco, e come elenco va composta.
 */
function readSeparatorLine(text: string): string[] | null {
  if (/[.!?]$/.test(text)) return null;
  const parts = text
    .split(/\s*[·•|]\s*|\s+[–—]\s+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  if (parts.length < 3 || parts.length > 10) return null;
  if (parts.some((p) => p.length > 60 || p.split(/\s+/).length > 6 || /[.!?]/.test(p))) return null;
  return parts;
}

// ── Elenchi ──────────────────────────────────────────────────────────────────

interface EnumSplit {
  lead: string;
  items: string[];
}

/**
 * Prova a leggere una frase come "attacco + elenco di voci separate da virgole".
 * Restituisce null a ogni minimo dubbio: un elenco sbagliato è peggio di nessun elenco.
 */
function readEnumeration(sentence: string): EnumSplit | null {
  const match = sentence.match(ENUM_LEAD_INS);
  if (!match || match.index === undefined) return null;

  const lead = sentence.slice(0, match.index + match[0].length);
  const tail = sentence.slice(match.index + match[0].length).trim().replace(/[.;]+$/, "");
  if (tail.length === 0) return null;
  // Nessun punto fermo interno: se c'è, l'elenco non arriva a fine frase.
  if (/[.!?:]/.test(tail)) return null;

  const chunks = tail.split(/,\s*/).map((c) => c.trim()).filter((c) => c.length > 0);
  if (chunks.length < 2) return null;

  // L'ultimo blocco è quasi sempre "… e un camino nel soggiorno": si separa la congiunzione
  // finale, e solo quella (una sola occorrenza, l'ultima).
  const last = chunks[chunks.length - 1];
  const conj = last.match(/^(.*\S)\s+(?:e|ed)\s+(\S.*)$/i);
  if (conj) {
    chunks[chunks.length - 1] = conj[1].trim();
    chunks.push(conj[2].trim());
  }

  if (chunks.length < 3 || chunks.length > 8) return null;
  if (chunks.some((c) => c.length < 3 || c.length > 80)) return null;
  // Ogni voce deve restare un sintagma breve, non una subordinata.
  if (chunks.some((c) => c.split(/\s+/).length > 12)) return null;

  return { lead, items: chunks };
}

// ── Classificazione ──────────────────────────────────────────────────────────

interface Budget {
  accents: number;
  lists: number;
  strong: number;
  /** Punti di forza già evidenziati, in minuscolo: non si ripetono. */
  used: Set<string>;
}

/** Spezza un paragrafo troppo lungo al confine di frase più vicino alla metà. */
function splitLongParagraph(text: string): string[] {
  if (text.length <= LONG_PARAGRAPH) return [text];
  const sentences = splitSentences(text);
  if (sentences.length < 3) return [text];

  const half = text.length / 2;
  let running = 0;
  let cut = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let i = 0; i < sentences.length - 1; i += 1) {
    running += sentences[i].length;
    const distance = Math.abs(running - half);
    if (distance < bestDistance) {
      bestDistance = distance;
      cut = i + 1;
    }
  }
  if (cut === 0) return [text];

  const first = sentences.slice(0, cut).join("").trimEnd();
  const second = sentences.slice(cut).join("").trimEnd();
  if (first.length === 0 || second.length === 0) return [text];
  // Ricorsione limitata: al massimo si arriva a tre pezzi.
  return second.length > LONG_PARAGRAPH ? [first, ...splitLongParagraph(second)] : [first, second];
}

function proseBlocks(text: string, budget: Budget): ListingBlock[] {
  return splitLongParagraph(text).map((piece) => ({
    kind: "para" as const,
    runs: withHighlight(runsFromText(piece), budget),
  }));
}

/**
 * Classifica UN paragrafo. Può produrre più blocchi (aggancio + resto, prosa + elenco,
 * prosa + invito finale). `previousKind` serve alla regola "mai due accenti di fila".
 */
function classify(
  text: string,
  { first, closing, previousKind, budget }: {
    first: boolean;
    /** questo paragrafo è quello scelto come invito finale */
    closing: boolean;
    previousKind: ListingBlock["kind"] | null;
    budget: Budget;
  },
): ListingBlock[] {
  // 0. Riga telegrafica a separatori → elenco, sempre: è già un elenco, per costruzione.
  const separated = readSeparatorLine(text);
  if (separated) {
    return [{ kind: "list", lead: [], items: separated }];
  }

  // 1. Enfasi dell'autore su tutto il paragrafo → riga d'accento (asterischi tolti).
  const wrapped = asteriskWrapped(text);
  if (wrapped !== null && budget.accents > 0 && previousKind !== "accent") {
    budget.accents -= 1;
    return [{ kind: "accent", runs: [{ t: "text", v: wrapped }] }];
  }

  // 2. Apertura: l'aggancio. Se il primo paragrafo è lungo, solo la sua prima frase
  //    diventa lead e il resto prosegue come prosa: nessun testo si sposta.
  if (first) {
    if (text.length <= LEAD_MAX) {
      return [{ kind: "lead", runs: withHighlight(runsFromText(text), budget) }];
    }
    const sentences = splitSentences(text);
    if (sentences.length >= 2) {
      const head = sentences[0].trimEnd();
      const rest = sentences.slice(1).join("").trim();
      return [
        { kind: "lead", runs: runsFromText(head) },
        ...proseBlocks(rest, budget),
      ];
    }
    return [{ kind: "lead", runs: withHighlight(runsFromText(text), budget) }];
  }

  // 3. Chiusura: il paragrafo eletto a invito finale, e solo la parte che invita davvero.
  if (closing) {
    const sentences = splitSentences(text);
    const inviteAt = sentences.findIndex((s) => isClosing(s));
    if (inviteAt > 0) {
      const before = sentences.slice(0, inviteAt).join("").trim();
      const invite = sentences.slice(inviteAt).join("").trim();
      return [...proseBlocks(before, budget), { kind: "closing", runs: runsFromText(invite) }];
    }
    return [{ kind: "closing", runs: runsFromText(text) }];
  }

  // 4. A-parte evocativo → corsivo.
  if (isAtmosphere(text)) {
    return [{ kind: "atmosphere", runs: runsFromText(text) }];
  }

  // 5. Titoletto dell'autore in testa al paragrafo → accento + prosa.
  if (budget.accents > 0 && previousKind !== "accent") {
    const heading = readHeading(text);
    if (heading) {
      budget.accents -= 1;
      return [
        { kind: "accent", runs: [{ t: "text", v: heading.heading }] },
        ...proseBlocks(heading.rest, budget),
      ];
    }
  }

  // 6. Enumerazione di dotazioni → elenco puntato, con la prosa attorno conservata.
  if (budget.lists > 0) {
    const sentences = splitSentences(text);
    for (let i = 0; i < sentences.length; i += 1) {
      const enumeration = readEnumeration(sentences[i].trim());
      if (!enumeration) continue;
      budget.lists -= 1;
      const before = sentences.slice(0, i).join("").trim();
      const after = sentences.slice(i + 1).join("").trim();
      return [
        ...(before ? proseBlocks(before, budget) : []),
        { kind: "list", lead: runsFromText(enumeration.lead.trim()), items: enumeration.items },
        ...(after ? proseBlocks(after, budget) : []),
      ];
    }
  }

  // 7. Riga lapidaria a metà racconto → display, ma mai due di fila.
  if (budget.accents > 0 && previousKind !== "accent" && isAccent(text)) {
    budget.accents -= 1;
    return [{ kind: "accent", runs: runsFromText(text) }];
  }

  // 8. Prosa.
  return proseBlocks(text, budget);
}

// ── API pubblica ─────────────────────────────────────────────────────────────

/**
 * Compone i paragrafi di una descrizione nei blocchi da mandare in pagina.
 * Difensiva su tutta la linea: input assente, sporco o inatteso → risultato vuoto o
 * prosa semplice, mai un'eccezione.
 */
export function formatListingDescription(
  paragraphs: readonly (string | null | undefined)[] | null | undefined,
): ListingCopy {
  if (!Array.isArray(paragraphs)) return { blocks: [], preservation: 1, hasClosing: false };

  const clean = paragraphs
    .filter((p): p is string => typeof p === "string")
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .slice(0, MAX_PARAGRAPHS);

  if (clean.length === 0) return { blocks: [], preservation: 1, hasClosing: false };

  const budget: Budget = {
    accents: MAX_ACCENTS,
    lists: MAX_LISTS,
    strong: MAX_STRONG,
    used: new Set(),
  };
  const blocks: ListingBlock[] = [];
  const closingIndex = electClosing(clean);

  clean.forEach((text, index) => {
    const previousKind = blocks.length > 0 ? blocks[blocks.length - 1].kind : null;
    try {
      blocks.push(
        ...classify(text, {
          first: index === 0,
          closing: index === closingIndex,
          previousKind,
          budget,
        }),
      );
    } catch {
      // Qualunque inciampo della classificazione: il paragrafo passa così com'è.
      blocks.push({ kind: "para", runs: [{ t: "text", v: text }] });
    }
  });

  const before = clean.flatMap(tokens).length;
  const after = blocks.flatMap(blockTokens).length;

  return {
    blocks,
    preservation: before === 0 ? 1 : after / before,
    hasClosing: blocks.some((b) => b.kind === "closing"),
  };
}

/**
 * Elegge il paragrafo che chiude l'annuncio invitando a muoversi.
 *
 * Non è sempre l'ultimo: negli annunci reali dopo l'invito arrivano spesso una coda tecnica
 * ("Tour virtuale 360°: …") o la firma dell'agenzia. Si guarda quindi negli ULTIMI TRE
 * paragrafi e si prende il più avanzato che contiene un invito; -1 se non ce n'è nessuno,
 * e in quel caso la pagina non inventa una chiamata all'azione che l'agenzia non ha scritto.
 */
function electClosing(paragraphs: readonly string[]): number {
  const from = Math.max(0, paragraphs.length - 3);
  for (let i = paragraphs.length - 1; i >= from; i -= 1) {
    if (isClosing(paragraphs[i])) return i;
  }
  return -1;
}

function blockTokens(block: ListingBlock): string[] {
  if (block.kind === "list") {
    return [...block.lead.flatMap((r) => tokens(r.v)), ...block.items.flatMap(tokens)];
  }
  return block.runs.flatMap((r) => tokens(r.v));
}

/** Testo piatto di un blocco — comodo a test e audit. */
export function blockText(block: ListingBlock): string {
  if (block.kind === "list") {
    return [block.lead.map((r) => r.v).join(""), ...block.items].join(" ");
  }
  return block.runs.map((r) => r.v).join("");
}
