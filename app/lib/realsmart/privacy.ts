// Redazione PRIVACY deterministica delle descrizioni importate da RealSmart.
//
// PERCHÉ. Il feed consegna descrizioni scritte a mano dagli agenti: 130 annunci su 196 conteneva
// un indirizzo civico (via + numero) pur con `showAddress=false`, e alcuni un numero di telefono.
// React escapa il markup, ma NON toglie un indirizzo o un recapito dal testo: quelli finivano
// pubblici — in pagina, nei metadata, nel JSON-LD e nel contesto dell'assistente.
//
// PRINCIPI (non negoziabili)
//   • DETERMINISTICO. Le regole sono regex pure e testabili: nessun LLM è (né sarà mai) l'unico
//     controllo privacy. Un modello può aggiungersi sopra, mai sostituire questa barriera.
//   • showAddress è una POLICY, non un dettaglio di rendering: se è false, l'indirizzo civico
//     non deve comparire in NESSUN output pubblico, testo libero compreso.
//   • Si preserva il contesto utile (comune/zona): l'indirizzo redatto è sostituito dal COMUNE
//     quando lo conosciamo, così la frase resta leggibile e localizzata.
//   • I telefoni si tolgono SEMPRE (anche con showAddress=true): un recapito diretto nel corpo
//     della descrizione non è un dato dell'immobile.
//   • Non si toccano misure ("120 mq", "3 locali", "piano 2") né prezzi ("€ 420.000"): i pattern
//     sono scelti per non intercettarli.
//
// Modulo PURO: nessun accesso a rete/env, stesso input → stesso output.

// ── Indirizzo civico ─────────────────────────────────────────────────────────
// Parola-chiave stradale + nome PROPRIO (iniziale maiuscola, come nel feed reale) + eventuale
// "n."/"civico" + NUMERO. Il numero è obbligatorio: è ciò che rende l'indirizzo "esatto". Un
// toponimo senza numero ("vista Monte Rosa", "in corso di valutazione") non viene toccato.
// Ogni lettera della parola-chiave è case-insensitive tramite una classe a due casi, NON con il
// gruppo inline `(?i:…)`: quel modificatore in linea non è supportato da tutti i runtime V8/Node
// (in CI/produzione `new RegExp` lancia "Invalid regular expression: Invalid group", e il modulo si
// carica nel percorso di normalizzazione di OGNI annuncio) e va evitato. Le abbreviazioni con punto
// tengono il `\.` letterale; le varianti a/à e strada/strade sono elencate esplicitamente.
const anyCase = (s: string): string =>
  s.replace(/[a-zà-ÿ]/gi, (c) => `[${c.toLowerCase()}${c.toUpperCase()}]`);

const STREET_WORDS = [
  "via", "viale", "v\\.le", "piazza(?:le)?", "p\\.zza", "largo", "vicolo", "corso",
  "c\\.so", "strada", "strade", "str\\.", "localita", "località", "loc\\.",
  "frazione", "fraz\\.", "borgo", "contrada",
];
const STREET_KEYWORD = `(?:${STREET_WORDS.map(anyCase).join("|")})`;
const CIVIC_TOKEN = `(?:${anyCase("n")}(?:\\.|${anyCase("umero")})?|${anyCase("civico")})`;

// Il nome della via DEVE iniziare maiuscolo (nome proprio): evita i falsi positivi degli idiomi
// ("via libera a 3 offerte") perché `\p{Lu}` resta case-sensitive.
const CIVIC_ADDRESS_RE = new RegExp(
  `\\b${STREET_KEYWORD}\\s+\\p{Lu}[\\p{L}'’.]*(?:\\s+\\p{L}[\\p{L}'’.]*){0,3}\\s*,?\\s*(?:${CIVIC_TOKEN}\\s*)?\\d+[A-Za-z]?\\b`,
  "gu",
);

// ── Telefono ─────────────────────────────────────────────────────────────────
// Tre forme italiane, scelte per NON intercettare prezzi (raggruppati a gruppi di 3, "420.000")
// né misure: prefisso internazionale +39/0039, fisso "0xx", mobile "3xx" da ESATTAMENTE 10 cifre.
// I separatori tipografici (spazio . - /) sono ammessi TRA le cifre, così "333.123.4567" e
// "0331 123 456" vengono visti, ma "333.000.000" (prezzo, 9 cifre) no.
const PHONE_RE = new RegExp(
  [
    "(?:\\+|00)\\s?39(?:[\\s.\\-/]?\\d){8,12}", // +39 / 0039 + 8-12 cifre
    "\\b0\\d{1,3}(?:[\\s.\\-/]?\\d){6,8}\\b", //  fisso: 0xx + 6-8 cifre
    "\\b3\\d{2}(?:[\\s.\\-/]?\\d){7}\\b", //      mobile: 3xx + 7 (10 cifre esatte)
  ].join("|"),
  "g",
);

/** true se il testo contiene un indirizzo civico esatto (via/piazza… + numero). */
export function hasCivicAddress(text: string): boolean {
  CIVIC_ADDRESS_RE.lastIndex = 0;
  return CIVIC_ADDRESS_RE.test(text);
}

/** true se il testo contiene un numero di telefono plausibile. */
export function hasPhoneNumber(text: string): boolean {
  PHONE_RE.lastIndex = 0;
  return PHONE_RE.test(text);
}

/**
 * Collassa una ripetizione ravvicinata del comune nata dalla redazione:
 * "Tradate, Tradate" / "Tradate Tradate" / "Tradate a Tradate" / "in Tradate a Tradate" → "Tradate".
 * (L'indirizzo era spesso scritto "in <via> a <Comune>": sostituito <via> col comune, resta il doppione.)
 */
function dedupeComune(text: string, comune: string): string {
  if (!comune) return text;
  const c = comune.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(
    new RegExp(`\\b(${c})\\b(?:[\\s,·—-]+(?:(?:a|ad|in|di|da|e)[\\s,·—-]+)?)\\1\\b`, "gi"),
    "$1",
  );
}

export interface RedactionOutcome {
  /** Testo con indirizzi/telefoni redatti secondo la policy. */
  text: string;
  /** Quanti indirizzi civici sono stati redatti (0 se showAddress=true). */
  civicRedactions: number;
  /** Quanti telefoni sono stati rimossi. */
  phoneRedactions: number;
}

/**
 * Redige un testo secondo la policy privacy.
 *  • showAddress=false → gli indirizzi civici esatti sono sostituiti dal COMUNE (se noto),
 *    altrimenti da "zona riservata": la frase resta leggibile e il contesto municipale è salvo.
 *  • i telefoni sono SEMPRE rimossi.
 */
export function redactPrivateText(
  text: string,
  opts: { showAddress: boolean; comune?: string },
): RedactionOutcome {
  let civicRedactions = 0;
  let phoneRedactions = 0;
  let out = text;

  if (!opts.showAddress) {
    const replacement = opts.comune?.trim() ? opts.comune.trim() : "zona riservata";
    out = out.replace(CIVIC_ADDRESS_RE, () => {
      civicRedactions += 1;
      return replacement;
    });
    if (opts.comune?.trim()) out = dedupeComune(out, opts.comune.trim());
  }

  // Telefoni: rimossi sempre. Si toglie il recapito; un'eventuale etichetta orfana ("Tel.")
  // resta e verrà segnalata alla fonte, ma nessun numero esce.
  out = out.replace(PHONE_RE, () => {
    phoneRedactions += 1;
    return "";
  });

  // Ricompattamento spazi/punteggiatura SOLO se abbiamo redatto qualcosa: un paragrafo senza
  // fughe non va toccato (la descrizione dell'agenzia resta parola per parola, spazi compresi).
  if (civicRedactions > 0 || phoneRedactions > 0) {
    out = out.replace(/[ \t]{2,}/g, " ").replace(/\s+([.,;:])/g, "$1").trim();
  }

  return { text: out, civicRedactions, phoneRedactions };
}

/** Redige un elenco di paragrafi, scartando quelli rimasti vuoti dopo la redazione. */
export function redactParagraphs(
  paragraphs: readonly string[],
  opts: { showAddress: boolean; comune?: string },
): { paragraphs: string[]; civicRedactions: number; phoneRedactions: number } {
  let civicRedactions = 0;
  let phoneRedactions = 0;
  const out: string[] = [];
  for (const par of paragraphs) {
    const r = redactPrivateText(par, opts);
    civicRedactions += r.civicRedactions;
    phoneRedactions += r.phoneRedactions;
    if (r.text.trim().length > 0) out.push(r.text);
  }
  return { paragraphs: out, civicRedactions, phoneRedactions };
}
