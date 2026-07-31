// Separazione CONSERVATIVA fra testo narrativo e righe tecniche della descrizione.
//
// IL PROBLEMA
// Alcune descrizioni contengono righe telegrafiche fatte di sole caratteristiche:
//
//   "Classe B · Doppio terrazzo · Vista Monte Rosa · Due autorimesse"
//
// Quella riga diventa dati strutturati nei box della scheda. Lasciarla anche nel testo la fa
// leggere due volte. Toglierla è giusto SOLO se ogni suo frammento è finito davvero nei box.
//
// IL VINCOLO
// Il copy non si riscrive, non si riassume, non si parafrasa. Si rimuove al massimo una riga
// INTERA e solo quando è completamente tecnica e completamente risolta. Una frase narrativa
// resta al suo posto anche se produce dati:
//
//   "Il soggiorno di circa 30 mq si apre sul grande terrazzo, raggiungibile anche dalla
//    cucina abitabile."
//
// produce Soggiorno: circa 30 m², Terrazzo e Cucina abitabile — e resta comunque nel testo,
// perché lì quelle caratteristiche fanno parte del racconto.
//
// SE ANCHE UN SOLO FRAMMENTO RESTA IRRISOLTO, la riga si conserva e finisce in revisione.

import { factsFromDescription, type PropertyFact } from "./facts";

/** Riga tecnica riconosciuta e ciò che ne è stato fatto. */
export interface FactLineOutcome {
  line: string;
  /** Frammenti in cui la riga è stata scomposta (es. "Classe B", "Doppio terrazzo"). */
  fragments: string[];
  /** Frammenti che NON risultano nei dati strutturati: se ce n'è uno, la riga resta. */
  unresolved: string[];
}

export interface DescriptionSplit {
  /** Testo editoriale da leggere normalmente: è ciò che va in pagina. */
  narrativeParagraphs: string[];
  /** Righe tecniche rimosse perché interamente strutturate nei box. */
  structuredFactLines: FactLineOutcome[];
  /** Righe tecniche CONSERVATE nel testo perché non del tutto risolte → da rivedere. */
  keptFactLines: FactLineOutcome[];
  /**
   * Quota di parole significative conservate rispetto alla descrizione normalizzata.
   * 1 = nessuna rimozione. Serve ai test e all'audit: una caduta improvvisa è un allarme.
   */
  contentPreservation: number;
}

/** Separatori usati nelle righe telegrafiche degli annunci. */
const FRAGMENT_SEPARATORS = /\s*[·•|]\s*|\s+[–—]\s+|\s*;\s*/;

/** Parole vuote: non contano né per la risoluzione né per la metrica di preservazione. */
const STOPWORDS = new Set([
  "di", "da", "del", "della", "dei", "delle", "dello", "degli", "il", "lo", "la", "i", "gli",
  "le", "un", "uno", "una", "con", "per", "in", "su", "al", "alla", "ai", "alle", "allo",
  "agli", "e", "ed", "a", "anche", "che", "si", "sono", "è", "ha", "molto", "più",
]);

/** Token significativi (minuscoli, senza accenti irrilevanti né parole vuote). */
function tokens(text: string): string[] {
  return (text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).filter((t) => !STOPWORDS.has(t));
}

/**
 * Una riga è TECNICA quando è telegrafica: almeno due frammenti separati da un separatore da
 * elenco, frammenti corti, nessuna frase compiuta.
 *
 * Il controllo sulla punteggiatura finale è decisivo: un periodo che termina con "." è prosa,
 * anche se contiene punti e virgola.
 */
function isFactLine(line: string): boolean {
  if (/[.!?]$/.test(line.trim())) return false;

  // Servono almeno TRE frammenti. Con due, un trattino separa quasi sempre un titolo di
  // sezione dalla sua glossa ("PIANO PRIMO – Il cuore della casa") o una misura dal suo
  // contesto: non è un elenco di caratteristiche e non va toccato.
  const fragments = splitFragments(line);
  if (fragments.length < 3) return false;

  // Ogni frammento deve essere corto: "Doppio terrazzo" sì, una subordinata no.
  if (fragments.some((f) => f.split(/\s+/).length > 6)) return false;

  // Nessun frammento può contenere una frase compiuta.
  return !fragments.some((f) => /[.!?]/.test(f));
}

function splitFragments(line: string): string[] {
  return line
    .split(FRAGMENT_SEPARATORS)
    .map((f) => f.trim().replace(/^[-–—•]\s*/, ""))
    .filter((f) => f.length > 0);
}

/**
 * Un frammento è RISOLTO se è finito nei dati strutturati. Due prove, in ordine:
 *   1. rieseguendo l'estrazione sul solo frammento si ottiene una chiave già pubblicata
 *      ("Doppio terrazzo" → terrazzi, "Vista Monte Rosa" → vista);
 *   2. i token del frammento sono tutti spiegati da un fatto pubblicato ("Classe B" è coperto
 *      da «Classe energetica: B», che nel feed arriva dal campo <ACE> e non dalla frase).
 */
function isFragmentResolved(fragment: string, published: readonly PropertyFact[]): boolean {
  const publishedKeys = new Set(published.map((f) => f.key));
  const extracted = factsFromDescription([fragment]).facts;
  if (extracted.some((f) => publishedKeys.has(f.key))) return true;

  const fragmentTokens = tokens(fragment);
  if (fragmentTokens.length === 0) return true; // solo punteggiatura: nulla da conservare

  return published.some((fact) => {
    const factTokens = new Set(tokens(`${fact.label} ${fact.value ?? ""}`));
    return fragmentTokens.every((t) => factTokens.has(t));
  });
}

/**
 * Separa i paragrafi narrativi dalle righe tecniche già strutturate.
 *
 * @param paragraphs paragrafi già normalizzati (vedi ./description.ts)
 * @param facts      fatti PUBBLICATI dell'immobile (dopo override e merge)
 */
export function splitDescription(
  paragraphs: readonly string[],
  facts: readonly PropertyFact[],
): DescriptionSplit {
  const narrativeParagraphs: string[] = [];
  const structuredFactLines: FactLineOutcome[] = [];
  const keptFactLines: FactLineOutcome[] = [];

  for (const paragraph of paragraphs) {
    if (!isFactLine(paragraph)) {
      narrativeParagraphs.push(paragraph);
      continue;
    }

    const fragments = splitFragments(paragraph);
    const unresolved = fragments.filter((f) => !isFragmentResolved(f, facts));
    const outcome: FactLineOutcome = { line: paragraph, fragments, unresolved };

    if (unresolved.length === 0) {
      // Tutto è già nei box: la riga può sparire dal testo senza perdere nulla.
      structuredFactLines.push(outcome);
    } else {
      // Anche un solo frammento irrisolto → si conserva la riga e si segnala.
      keptFactLines.push(outcome);
      narrativeParagraphs.push(paragraph);
    }
  }

  const before = paragraphs.flatMap(tokens).length;
  const after = narrativeParagraphs.flatMap(tokens).length;
  return {
    narrativeParagraphs,
    structuredFactLines,
    keptFactLines,
    contentPreservation: before === 0 ? 1 : after / before,
  };
}
