// Parole-funzione italiane: l'unica lista, per i due moduli che ne hanno bisogno.
//
// PERCHÉ ESISTE. Sia `description.ts` (coda troncata alla fonte) sia `privacy.ts` (recapito web
// tolto da dentro una frase) devono rispondere alla stessa domanda: «questa parola può chiudere
// un pensiero, o resta appesa?». È la stessa domanda, e quindi deve essere la stessa lista —
// due copie divergono, e divergendo la coda verrebbe potata in un modulo e non nell'altro.
//
// COSA CI STA DENTRO. Congiunzioni, preposizioni semplici e articolate, articoli. Cioè le parole
// che in italiano REGGONO qualcosa che deve seguire. Non ci stanno avverbi come «molto» o
// «davvero», che una frase può in effetti chiudere.
//
// Lista CHIUSA, e questo è il punto: un elenco finito di parole grammaticali non cresce e non
// interpreta. Non è un'euristica sul significato — è un fatto sulla lingua.

/** Parole che da sole non possono chiudere una frase italiana. */
export const FUNCTION_WORDS: ReadonlySet<string> = new Set([
  // congiunzioni
  "e", "ed", "o", "od", "ma", "che", "se", "come", "quando", "mentre", "perché", "perche",
  "oppure", "anche", "sempre", "però", "pero",
  // preposizioni semplici
  "di", "a", "ad", "da", "in", "con", "su", "per", "tra", "fra",
  // preposizioni articolate
  "del", "dello", "della", "dei", "degli", "delle",
  "al", "allo", "alla", "ai", "agli", "alle",
  "dal", "dallo", "dalla", "dai", "dagli", "dalle",
  "nel", "nello", "nella", "nei", "negli", "nelle",
  "sul", "sullo", "sulla", "sui", "sugli", "sulle",
  "col", "coi",
  // articoli
  "il", "lo", "la", "i", "gli", "le", "un", "uno", "una",
]);

/** Togliere la punteggiatura di contorno prima di confrontare con la lista. */
export function bareWord(word: string): string {
  return word.toLowerCase().replace(/[«»"'’(),;:·—-]/g, "");
}

/** true se l'ultima parola del testo è una parola-funzione (quindi il testo resta appeso). */
export function endsOnFunctionWord(text: string): boolean {
  const last = text.trim().split(/\s+/).pop() ?? "";
  return FUNCTION_WORDS.has(bareWord(last));
}

/**
 * Toglie dalla CODA fino a `max` parole-funzione rimaste appese.
 *
 * Serve dopo una rimozione chirurgica in mezzo alla frase: tolto «www.esempio.it» da
 * «planimetrie su www.esempio.it» resta «planimetrie su», e quella preposizione orfana è lo
 * stesso difetto che stiamo togliendo — solo, creato da noi.
 */
export function trimDanglingWords(text: string, max = 2): string {
  let out = text.replace(/\s+$/, "");
  for (let i = 0; i < max; i += 1) {
    const last = out.split(/\s+/).pop() ?? "";
    if (last.length === 0 || !FUNCTION_WORDS.has(bareWord(last))) break;
    out = out.slice(0, out.length - last.length).replace(/[\s,;:]+$/, "");
  }
  return out;
}
