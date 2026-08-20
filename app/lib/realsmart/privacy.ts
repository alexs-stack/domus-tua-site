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
// CASE. La parola-chiave stradale e il prefisso "n."/"civico" sono case-insensitive; il NOME della
// via NO: deve iniziare maiuscolo (`\p{Lu}`), così "via libera a 3 offerte" non è un indirizzo.
// Il flag globale `i` NON è utilizzabile — renderebbe `\p{Lu}` case-insensitive (matcherebbe anche
// le minuscole, spec ES: sotto `iu` `\p{Lu}` accetta 'a'), e i modificatori in linea `(?i:…)` non
// sono supportati da tutte le versioni di Node in CI (Node 22 → SyntaxError "Invalid group").
// Quindi la case-insensitività si esprime carattere per carattere con `ciLiteral()`.
function ciLiteral(word: string): string {
  return Array.from(word)
    .map((ch) => {
      const up = ch.toUpperCase();
      const lo = ch.toLowerCase();
      if (up !== lo) return `[${up}${lo}]`; // lettera → classe che accetta entrambe le grafie
      if (/[.*+?^${}()|[\]\\-]/.test(ch)) return `\\${ch}`; // metacarattere regex → letterale
      return ch;
    })
    .join("");
}

// Toponimi stradali italiani (comprese abbreviazioni col punto). Testo semplice, reso
// case-insensitive da ciLiteral(); "piazzale" prima di "piazza" per preferire il match lungo.
const STREET_KEYWORDS = [
  "via", "viale", "v.le", "piazzale", "piazza", "p.zza", "largo", "vicolo",
  // "localita" SENZA accento non è un refuso da tollerare, è la grafia più comune in un
  // gestionale: chi compila un campo di testo scrive spesso senza accentate. `ciLiteral()`
  // rende insensibile alle MAIUSCOLE, non agli accenti — quindi "Localita Ronchetto 12"
  // passava intera, con civico, mentre "Località Ronchetto 12" veniva redatta.
  // Vale anche per "citta" nei toponimi composti.
  "corso", "c.so", "strada", "strade", "str.", "località", "localita", "loc.",
  "frazione", "fraz.", "borgo", "contrada", "salita", "rotonda",
  "circonvallazione", "lungolago", "lungomare", "traversa",
];
const STREET_KEYWORD = `(?:${STREET_KEYWORDS.map(ciLiteral).join("|")})`;

// Prefisso del civico: "n", "n.", "numero" oppure "civico", in qualsiasi grafia.
const CIVIC_NUM_PREFIX = `(?:${ciLiteral("n")}(?:\\.|${ciLiteral("umero")})?|${ciLiteral("civico")})`;

// Il nome della via può iniziare con un articolo/preposizione MINUSCOLI prima della prima parola
// maiuscola: "Via dei Mille", "Viale della Vittoria", "Via dell'Artigianato". Questi connettori
// sono opzionali; resta comunque richiesta una parola maiuscola (così "via libera 3" non matcha).
const NAME_CONNECTORS = ["dei", "del", "della", "delle", "degli", "dello", "di", "il", "lo", "la", "le"];
const NAME_LEAD = `(?:(?:${NAME_CONNECTORS.map(ciLiteral).join("|")}|[Dd]ell['’]|[Dd]egl['’]|[Ll]['’])\\s*)?`;

// Parola-chiave stradale + nome PROPRIO (iniziale maiuscola) + eventuale "n."/"civico" + NUMERO.
// Il numero è obbligatorio: è ciò che rende l'indirizzo "esatto". Il numero può avere un suffisso
// (lettera "8B", frazione "12/A", "bis"/"ter") che va consumato per intero.
const CIVIC_NUM = `\\d+(?:\\s*\\/\\s*[0-9A-Za-z]+|[A-Za-z]|\\s+(?:${ciLiteral("bis")}|${ciLiteral("ter")}))?`;
const CIVIC_ADDRESS_RE = new RegExp(
  `\\b${STREET_KEYWORD}\\s+${NAME_LEAD}\\p{Lu}[\\p{L}'’.]*(?:\\s+\\p{L}[\\p{L}'’.]*){0,3}\\s*,?\\s*(?:${CIVIC_NUM_PREFIX}\\s*)?${CIVIC_NUM}\\b`,
  "gu",
);

// ── Indirizzo STRUTTURATO noto (layer a) ─────────────────────────────────────
// Quando il gestionale ci dà l'indirizzo civico esatto (`<Indirizzo>` in localita), non ci
// affidiamo al solo pattern generico: costruiamo un redattore SU MISURA per QUELL'indirizzo e le
// sue varianti (spazi/virgole/"n."/abbreviazioni/maiuscole). È il layer a più alta precisione —
// sull'indirizzo NOTO possiamo essere case-insensitive senza falsi positivi, perché stiamo
// cercando una stringa specifica, non un pattern di lingua. Vale anche col nome della via SENZA
// numero: per QUESTO immobile quella via È la posizione privata.
function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Numero civico con eventuale suffisso (lettera, "bis/ter", frazione "7/A"), come stringa regex.
const CIVIC_NUM_SUFFIX = `(?:\\s*(?:\\/\\s*\\d+|${ciLiteral("bis")}|${ciLiteral("ter")}|[A-Za-z]))?`;

/**
 * Regex che redige l'indirizzo strutturato noto e le sue varianti tipografiche.
 * Ritorna null se l'indirizzo è vuoto o non contiene una parte stradale utile.
 */
export function structuredAddressRegex(address: string | undefined | null): RegExp | null {
  const cleaned = (address ?? "").trim().replace(/\s+/g, " ");
  if (!cleaned) return null;
  // Stacca un eventuale numero civico finale (con "n."/"civico" e suffisso); il resto è la via.
  const m = cleaned.match(
    /^(.*?)[\s,]*(?:n\.?|numero|civico)?\s*(\d+(?:\s*(?:\/\s*\d+|bis|ter|[A-Za-z]))?)?\s*$/iu,
  );
  const streetPart = (m?.[1] ?? cleaned).trim();
  const number = m?.[2]?.trim();
  const words = streetPart.split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;
  // Il feed abbrevia spesso il nome ("Via Goffredo Mameli" scritto "Via Mameli"): richiediamo la
  // parola-chiave + la parola SALIENTE (l'ultima, di norma il cognome), con le parole intermedie
  // NOTE rese OPZIONALI. Usiamo le PAROLE EFFETTIVE dell'indirizzo (non "una parola qualsiasi"),
  // così non si scavalcano parole di contenuto estranee ("Via Roma con vista Mameli" NON è un match).
  const keyword = escapeRe(words[0]);
  const nameWords = words.slice(1);
  let streetRe: string;
  if (nameWords.length === 0) {
    streetRe = keyword;
  } else {
    const lastToken = escapeRe(nameWords[nameWords.length - 1]);
    const interior = nameWords
      .slice(0, -1)
      .map((w) => `(?:${escapeRe(w)}[\\s.,]+)?`)
      .join("");
    streetRe = `${keyword}[\\s.,]+${interior}${lastToken}`;
  }
  // Il numero, se noto, è OPZIONALE nel match: per QUESTO immobile la via È già la posizione
  // privata, quindi si redige anche una menzione senza civico ("affacciato su Via Petrarca").
  const numRe = number
    ? `(?:[\\s,]*(?:${CIVIC_NUM_PREFIX}\\s*)?${escapeRe(number).replace(/\s+/g, "\\s*")}${CIVIC_NUM_SUFFIX})?`
    : "";
  // "giu": sull'indirizzo NOTO la case-insensitività è sicura (nessun `\p{Lu}` da proteggere qui).
  return new RegExp(`\\b${streetRe}${numRe}\\b`, "giu");
}

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
  opts: { showAddress: boolean; comune?: string; sourceAddress?: string },
): RedactionOutcome {
  let civicRedactions = 0;
  let phoneRedactions = 0;
  let out = text;

  if (!opts.showAddress) {
    const replacement = opts.comune?.trim() ? opts.comune.trim() : "zona riservata";
    // Layer (a): l'indirizzo strutturato NOTO e le sue varianti, con la massima precisione.
    const structured = structuredAddressRegex(opts.sourceAddress);
    if (structured) {
      out = out.replace(structured, () => {
        civicRedactions += 1;
        return replacement;
      });
    }
    // Layer (b): il pattern generico via/piazza… + numero, per gli indirizzi non strutturati.
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
  opts: { showAddress: boolean; comune?: string; sourceAddress?: string },
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
