// Retrieval ibrido sulla knowledge base dell'agenzia.
//
//  • LESSICALE — sempre attivo, nessuna chiave, nessuna rete. È la base: da solo basta.
//  • SEMANTICO — solo quando VOYAGE_API_KEY è configurata. Aggiunge le riformulazioni che
//    il lessicale non copre. Se manca o fallisce, sparisce senza conseguenze.
//
// I due livelli si qualificano in modo INDIPENDENTE, ciascuno con la propria soglia, e i
// risultati si uniscono. Nessuno dei due può abbassare la soglia dell'altro: se entrambi
// tacciono, la risposta è vuota — cioè "non lo so", che è la risposta giusta.

import { KNOWLEDGE, verifiedEntries, type KnowledgeEntry } from "./entries";
import { SEMANTIC_FLOOR, semanticScores } from "./semantic";

/** Rimuove i segni diacritici per un match robusto ("però" → "pero"). */
function deaccent(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/**
 * Stemming minimale per l'italiano: via la vocale finale dalle parole lunghe.
 * Copre i plurali che contano qui ("contatti"/"contatto", "orari"/"orario") senza la
 * complessità di uno stemmer completo, che su decine di voci non ripaga.
 */
function stem(word: string): string {
  return word.length >= 5 ? word.replace(/[aeiou]$/, "") : word;
}

/**
 * Parole che non esprimono mai l'ARGOMENTO di una domanda.
 *
 * Due famiglie:
 *  - parole funzionali: senza di loro basterebbe un "del" in comune per far combaciare
 *    qualsiasi frase con qualsiasi voce;
 *  - forme interrogative ("come", "dove", "quando"): dicono che c'è una domanda, non di
 *    cosa parli. "Come funziona Open Domus?" agganciava il titolo "Come contattare Domus
 *    Tua" solo per via del "come".
 *
 * Le keyword multi-parola ("dove siete") restano intatte: il match a frase lavora sulla
 * stringa grezza, prima di questo filtro.
 */
const STOPWORDS = new Set([
  // Funzionali
  "che", "chi", "cosa", "cos", "qual", "quale", "quali", "con", "per", "non", "del", "dell",
  "dei", "degl", "dal", "dall", "nel", "nell", "sul", "sull", "una", "uno", "gli", "sono",
  "sei", "siamo", "sto", "vorre", "voglio", "posso", "puo", "puoi", "mio", "mia", "tuo", "tua",
  "suo", "sua", "vostr", "nostr", "quest", "quell", "molto", "anche", "solo", "piu", "meno",
  "ciao", "grazi", "essere", "aver", "fare", "dir", "mi", "ti", "si", "ho", "hai",
  // Interrogative
  "come", "dove", "quando", "quanto", "quanti", "quanta", "quante", "perche",
]);

/** Parole della stringa, normalizzate, ridotte a radice e ripulite. Il punto resta ("d.o.c."). */
function words(s: string): string[] {
  return deaccent(s.toLowerCase())
    .split(/[^a-z0-9.]+/)
    .map((t) => t.replace(/^\.+|\.+$/g, ""))
    .filter((t) => t.length > 2)
    .map(stem)
    .filter((t) => !STOPWORDS.has(t));
}

/**
 * Punteggio lessicale minimo perché una fonte sia pertinente.
 *
 * Pesi scalati per capacità discriminante: una keyword curata vale ~2.4, una parola del
 * titolo ~1.8, una parola del corpo ~0.9. La soglia a 2 chiede quindi **una keyword curata,
 * oppure più segnali deboli concordi**: una sola parola trovata nel titolo non basta.
 *
 * È la lezione di due falsi positivi reali che una soglia più bassa lasciava passare:
 * "Che tempo farà domani?" agganciava "Nessuna promessa su tempi e prezzi", e
 * "Cos'è Domus D.O.C.?" agganciava "Chi è Domus Tua". In italiano una parola comune
 * ("tempo") o il nome del brand compaiono ovunque: da soli non dicono di cosa si parla.
 *
 * Sbagliare per eccesso di prudenza costa un "non lo so" (l'utente riformula o passa al
 * team). Sbagliare per eccesso di zelo costa una risposta a fianco della domanda, data con
 * sicurezza, perché il prompt impone di usare SOLO le fonti ricevute.
 */
const MIN_LEXICAL_SCORE = 2;

/** Punteggio lessicale considerato "pieno" quando si normalizza per unirlo al semantico. */
const LEXICAL_REFERENCE = 5;

// Il lessicale pesa più del semantico: è deterministico e costruito su keyword curate a mano,
// mentre il semantico è una stima. A parità di segnale vince chi è verificabile.
const WEIGHT_LEXICAL = 0.65;
const WEIGHT_SEMANTIC = 0.35;

/**
 * Quanto un termine distingue una voce dalle altre.
 *
 * Il corpus parla tutto della stessa agenzia: "Domus" compare nel titolo di quasi ogni voce.
 * Senza questa correzione "Cos'è Domus D.O.C.?" agganciava mezzo corpus e riceveva fonti che
 * non c'entravano. È l'idea dell'IDF ridotta all'osso: 1 se il termine è unico, 0 se è
 * ovunque. Diventa più utile man mano che il corpus cresce.
 */
function discriminationFactor(term: string, corpusDf: Map<string, number>, total: number): number {
  const df = corpusDf.get(term) ?? 0;
  if (df === 0 || total === 0) return 1;
  return Math.max(0, 1 - df / total);
}

/** Quante voci contengono ciascun termine (titolo + corpo + keyword). */
function documentFrequencies(entries: KnowledgeEntry[]): Map<string, number> {
  const df = new Map<string, number>();
  for (const entry of entries) {
    const terms = new Set([
      ...words(entry.title),
      ...words(entry.content),
      ...entry.keywords.flatMap((k) => words(k)),
    ]);
    for (const term of terms) df.set(term, (df.get(term) ?? 0) + 1);
  }
  return df;
}

/** Punteggio lessicale di una voce rispetto alla domanda. */
function lexicalScore(
  entry: KnowledgeEntry,
  queryWords: Set<string>,
  rawQuery: string,
  corpusDf: Map<string, number>,
  corpusSize: number,
): number {
  const titleWords = new Set(words(entry.title));
  const bodyWords = new Set(words(entry.content));
  const factor = (term: string) => discriminationFactor(term, corpusDf, corpusSize);

  let total = 0;

  // Keyword multi-parola ("dove siete", "open domus"): match come frase intera. Il peso segue
  // la parola più specifica della frase: "open domus" discrimina grazie a "open".
  for (const keyword of entry.keywords) {
    const normalized = deaccent(keyword.toLowerCase());
    if (normalized.includes(" ")) {
      if (rawQuery.includes(normalized)) {
        const parts = words(normalized);
        total += 3 * (parts.length ? Math.max(...parts.map(factor)) : 1);
      }
      continue;
    }
    const term = stem(normalized);
    if (queryWords.has(term)) total += 3 * factor(term);
  }

  for (const word of queryWords) {
    if (titleWords.has(word)) total += 2 * factor(word);
    else if (bodyWords.has(word)) total += 1 * factor(word);
  }

  return total;
}

export interface RetrievedKnowledge {
  id: string;
  title: string;
  content: string;
  source: string;
  lastVerified: string;
}

function toResult(entry: KnowledgeEntry): RetrievedKnowledge {
  return {
    id: entry.id,
    title: entry.title,
    content: entry.content,
    source: entry.source,
    lastVerified: entry.lastVerified,
  };
}

/**
 * Retrieval LESSICALE puro — deterministico, senza rete.
 *
 * Esposto a parte perché è il comportamento di base garantito, ed è quello che i test
 * verificano: un corpus di prova passato qui esercita esattamente la stessa logica della
 * produzione, senza dipendere da chiavi o servizi esterni.
 */
export function retrieveLexical(
  query: string,
  entries: KnowledgeEntry[] = KNOWLEDGE,
  limit = 3,
): RetrievedKnowledge[] {
  const scored = scoreLexical(query, entries);
  return scored.slice(0, limit).map((row) => toResult(row.entry));
}

/** Voci qualificate dal solo lessicale, già ordinate. */
function scoreLexical(
  query: string,
  entries: KnowledgeEntry[],
): { entry: KnowledgeEntry; index: number; score: number }[] {
  const queryWords = new Set(words(query));
  if (queryWords.size === 0) return [];

  const rawQuery = deaccent(query.toLowerCase());
  const usable = verifiedEntries(entries);
  // Il corpus è piccolo: ricalcolare le frequenze a ogni chiamata costa microsecondi ed
  // evita ogni rischio di cache stantìa quando il corpus si allarga.
  const corpusDf = documentFrequencies(usable);

  return usable
    .map((entry, index) => ({
      entry,
      index,
      score: lexicalScore(entry, queryWords, rawQuery, corpusDf, usable.length),
    }))
    .filter((row) => row.score >= MIN_LEXICAL_SCORE)
    // Punteggio decrescente, poi ordine di dichiarazione: stabile e riproducibile.
    .sort((a, b) => b.score - a.score || a.index - b.index);
}

/**
 * Poche fonti pertinenti (default 3) tra i soli contenuti `verified`.
 *
 * Un array vuoto NON è un errore: è il segnale che l'assistente deve dire onestamente che
 * non lo sa e proporre il team.
 */
export async function retrieveKnowledge(query: string, limit = 3): Promise<RetrievedKnowledge[]> {
  const lexical = scoreLexical(query, KNOWLEDGE);
  const semantic = await semanticScores(query);

  // Senza livello semantico il risultato è già completo: è il percorso normale oggi.
  // `semanticScores` restituisce null anche quando la soglia non è stata misurata, quindi
  // qui dentro SEMANTIC_FLOOR è per forza un numero — ma il controllo esplicito costa nulla
  // e regge se un domani quella condizione cambia.
  if (!semantic || SEMANTIC_FLOOR === null) {
    return lexical.slice(0, limit).map((row) => toResult(row.entry));
  }
  const floor = SEMANTIC_FLOOR;

  const usable = verifiedEntries();
  const byId = new Map(usable.map((entry, index) => [entry.id, { entry, index }]));
  const lexicalById = new Map(lexical.map((row) => [row.entry.id, row.score]));

  // Unione delle due qualificazioni: ognuna con la propria soglia, nessuna abbassa l'altra.
  const candidates = new Set<string>([
    ...lexicalById.keys(),
    ...[...semantic.entries()].filter(([, score]) => score >= floor).map(([id]) => id),
  ]);

  return [...candidates]
    .map((id) => {
      const found = byId.get(id);
      if (!found) return null;
      const lex = Math.min(1, (lexicalById.get(id) ?? 0) / LEXICAL_REFERENCE);
      const sem = semantic.get(id) ?? 0;
      return { ...found, combined: lex * WEIGHT_LEXICAL + sem * WEIGHT_SEMANTIC };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort((a, b) => b.combined - a.combined || a.index - b.index)
    .slice(0, limit)
    .map((row) => toResult(row.entry));
}
