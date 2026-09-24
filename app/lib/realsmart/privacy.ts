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
//     della descrizione non è un dato dell'immobile. Dal §5.8 vale lo stesso per gli indirizzi
//     WEB e le EMAIL: stessa famiglia, stesso trattamento (vedi redactContacts).
//   • Non si toccano misure ("120 mq", "3 locali", "piano 2") né prezzi ("€ 420.000"): i pattern
//     sono scelti per non intercettarli.
//
// Modulo PURO: nessun accesso a rete/env, stesso input → stesso output.

import { trimDanglingWords } from "./italian";

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

// ── Recapiti web ed email ────────────────────────────────────────────────────
//
// Stessa famiglia del telefono: un canale per raggiungere l'agenzia scritto DENTRO il racconto
// dell'immobile. Il §5.8 lo elenca fra i difetti delle schede, e nel feed reale sono due annunci
// su 196 — pochi, e per questo mai corretti alla fonte.
//
// L'email è anche un dato personale quando è nominativa (nome.cognome@), quindi sta qui a pieno
// titolo; il sito web ci sta perché è la stessa cosa vista dall'altro lato — un recapito che
// porta il lettore FUORI dalla scheda, verso una pagina che nessuno controlla più.
const EMAIL_RE = /\b[\w.+-]+@[\w-]+(?:\.[\w-]+)+\b/g;

// Tre forme. La terza — dominio nudo, senza "www" né schema — è volutamente CASE-SENSITIVE e
// senza flag `i`: così "casa.it" viene visto, ma "…in centro.Il giardino…" no, perché dopo il
// punto c'è una maiuscola. E la lista dei TLD è chiusa a cinque voci che NON sono parole
// italiane: nessuna frase può finire su "…qualcosa.it" per caso.
const URL_RE = new RegExp(
  [
    "https?:\\/\\/\\S+",
    "\\bwww\\.[\\w-]+(?:\\.[\\w-]+)+(?:\\/\\S*)?",
    "\\b[a-z0-9][a-z0-9-]{2,}\\.(?:it|com|net|org|eu)\\b(?:\\/\\S*)?",
  ].join("|"),
  "g",
);

/**
 * Parole che rendono una frase INFORMATIVA sull'immobile.
 *
 * Servono a decidere COSA si toglie. Una frase che contiene un recapito e nient'altro è un
 * invito all'azione («Trovi tutto su www.esempio.it»): si toglie intera, e la descrizione resta
 * grammaticale. Una frase che contiene ANCHE un dato dell'immobile («Ampio giardino di 300 mq,
 * planimetrie su www.esempio.it») no: lì si toglie il solo recapito, perché il dato vale più
 * della sintassi — e la frase un po' sbilenca che resta viene comunque segnalata alla fonte.
 *
 * Non basta «ci sono cifre»: un numero di telefono è fatto di cifre e sta proprio nelle frasi
 * che vogliamo togliere.
 */
/**
 * Oltre questa lunghezza, la «frase» che contiene il recapito non è più un invito all'azione.
 *
 * La misura non è arbitraria, viene dal feed. Nella villa di Villaggio Santa Monica manca il
 * punto dopo l'indirizzo web, quindi il confine di frase successivo cade tre righe più in
 * là: togliere «la frase» avrebbe portato via anche «Villa Armonia è più di una casa; è un
 * ritorno alle radici…», che è copy vero dell'agenzia. Un invito all'azione sta in una riga
 * («Trovi tutto su … e ti aspettiamo»: 58 caratteri); trecento no.
 *
 * Oltre la soglia si torna alla rimozione del solo recapito. È lo stesso patto di
 * MAX_BOILERPLATE_RATIO in description.ts: si toglie poco e in modo misurabile, e quando la
 * misura non torna si preferisce una frase sbilenca a un pezzo di annuncio che sparisce.
 */
const MAX_CTA_SENTENCE = 200;

const FACT_WORDS_RE =
  /\b(?:mq|m²|mc|locali?|vani?|camere?|bagni?|piano|piani|classe|giardino|terrazz\w*|box|garage|cantina|balcon\w*|€|euro)\b/i;

/** Confini della frase che contiene la posizione `at` (una frase finisce con . ! ? seguito da spazio o fine). */
function sentenceBounds(text: string, at: number): [number, number] {
  let start = 0;
  for (let i = at - 1; i > 0; i -= 1) {
    if (/[.!?]/.test(text[i]!) && /\s/.test(text[i + 1] ?? " ")) {
      start = i + 1;
      break;
    }
  }
  let end = text.length;
  for (let i = at; i < text.length; i += 1) {
    if (/[.!?]/.test(text[i]!) && (i + 1 >= text.length || /\s/.test(text[i + 1]!))) {
      end = i + 1;
      break;
    }
  }
  return [start, end];
}

/** Toglie email e indirizzi web. Vedi FACT_WORDS_RE per la scelta fra togliere la frase o il solo recapito. */
function redactContacts(text: string): { text: string; count: number } {
  let out = text;
  let count = 0;
  for (const re of [EMAIL_RE, URL_RE]) {
    // Un giro per recapito trovato, con un tetto: il testo cambia sotto i piedi della regex.
    for (let guard = 0; guard < 8; guard += 1) {
      re.lastIndex = 0;
      const m = re.exec(out);
      if (!m) break;
      count += 1;
      const [s, e] = sentenceBounds(out, m.index);
      const frase = out.slice(s, e);
      if (FACT_WORDS_RE.test(frase) || frase.trim().length > MAX_CTA_SENTENCE) {
        // Si tiene la frase, ma non la preposizione che reggeva il recapito: senza questo,
        // «planimetrie su www.esempio.it» diventerebbe «planimetrie su.» — lo stesso difetto
        // che stiamo togliendo, solo creato da noi.
        out = trimDanglingWords(out.slice(0, m.index)) + out.slice(m.index + m[0].length);
      } else {
        out = out.slice(0, s) + out.slice(e);
      }
    }
  }
  return { text: out, count };
}

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
  /** Quanti recapiti web/email sono stati rimossi. */
  linkRedactions: number;
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

  // Recapiti web/email PRIMA di tutto: quando si toglie la frase intera, si evita di lavorare su
  // un testo gia' mutilato dalle altre redazioni. L'annuncio 2044 del feed reale mostra il danno
  // inverso — il telefono tolto lascia «chiama ora lo e» in coda.
  const contatti = redactContacts(out);
  const linkRedactions = contatti.count;
  out = contatti.text;

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
  if (civicRedactions > 0 || phoneRedactions > 0 || linkRedactions > 0) {
    out = out.replace(/[ \t]{2,}/g, " ").replace(/\s+([.,;:])/g, "$1").trim();
  }

  return { text: out, civicRedactions, phoneRedactions, linkRedactions };
}

/** Redige un elenco di paragrafi, scartando quelli rimasti vuoti dopo la redazione. */
export function redactParagraphs(
  paragraphs: readonly string[],
  opts: { showAddress: boolean; comune?: string; sourceAddress?: string },
): {
  paragraphs: string[];
  civicRedactions: number;
  phoneRedactions: number;
  linkRedactions: number;
} {
  let civicRedactions = 0;
  let phoneRedactions = 0;
  let linkRedactions = 0;
  const out: string[] = [];
  for (const par of paragraphs) {
    const r = redactPrivateText(par, opts);
    civicRedactions += r.civicRedactions;
    phoneRedactions += r.phoneRedactions;
    linkRedactions += r.linkRedactions;
    if (r.text.trim().length > 0) out.push(r.text);
  }
  return { paragraphs: out, civicRedactions, phoneRedactions, linkRedactions };
}
