// Verificatore INDIPENDENTE della redazione privacy — la rete di sicurezza dietro privacy.ts.
//
// PERCHÉ INDIPENDENTE. Un verificatore che richiama la stessa funzione/pattern del redattore è
// tautologico: un buco in `CIVIC_ADDRESS_RE` si rispecchierebbe identico nel controllo e la fuga
// passerebbe inosservata. Qui usiamo due meccanismi DIVERSI, scritti a parte:
//
//   1) CONFRONTO PER TOKEN con l'indirizzo strutturato di fonte (`<Indirizzo>`): se nel testo
//      pubblicato ricompaiono INSIEME il nome della via e il numero civico noti, è una fuga.
//      È logica completamente diversa dal pattern-matching (confronta con la verità nota, non
//      cerca una forma linguistica).
//   2) CORPUS DI FUGA INDIPENDENTE: pattern per indirizzi e telefoni costruiti in modo autonomo
//      (lista toponimi propria, ancoraggio maiuscolo con classe esplicita anziché `\p{Lu}`,
//      rilevatore telefonico per conteggio-cifre anziché per formato). Un errore in privacy.ts
//      non si propaga qui perché il codice non è condiviso.
//
// Tutti gli esiti sono PII-safe: codici-motivo, mai il valore di un indirizzo o di un telefono.

// ── Indirizzo strutturato: token noti ────────────────────────────────────────

const STOPWORDS = new Set([
  "via", "viale", "vle", "piazza", "piazzale", "pzza", "largo", "vicolo", "corso", "cso",
  "strada", "strade", "str", "località", "localita", "loc", "frazione", "fraz", "borgo",
  "contrada", "salita", "rotonda", "n", "nr", "civico", "civ", "numero", "di", "del", "della",
  "dei", "delle", "san", "santa", "santo",
]);

function foldLower(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, ""); // toglie i diacritici: "località" → "localita"
}

export interface SourceAddressTokens {
  /** Parole "nome della via" significative (senza toponimo/stopword), minuscole e senza accenti. */
  streetTokens: string[];
  /** Numero civico noto (solo cifre), se presente. */
  number?: string;
}

/** Estrae i token salienti dell'indirizzo strutturato per il confronto (diverso dal redattore). */
export function sourceAddressTokens(address: string | undefined | null): SourceAddressTokens {
  const cleaned = (address ?? "").trim();
  if (!cleaned) return { streetTokens: [] };
  const numMatch = cleaned.match(/(\d{1,4})(?:\s*\/\s*\w+|\s*[a-z]|\s*bis|\s*ter)?\s*$/i);
  const number = numMatch?.[1];
  const streetTokens = foldLower(cleaned.replace(/\d.*$/, ""))
    .split(/[^a-z]+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
  return { streetTokens, number };
}

// ── Corpus di fuga INDIPENDENTE (indirizzi) ──────────────────────────────────
// Lista toponimi e costruzione DELIBERATAMENTE diverse da privacy.ts: toponimi propri (salita,
// rotonda, circonvallazione…), ancoraggio maiuscolo con `[A-ZÀ-Þ]` (classe esplicita, senza
// `\p{Lu}`), fino a 4 parole nel nome, prefisso civico con "nr."/"civ." oltre a "n."/"civico".
//
// Come per il redattore, NON si può usare il flag globale `i` (renderebbe `[A-ZÀ-Þ]`
// case-insensitive e perderebbe l'ancoraggio anti-"via libera 3"). Qui la case-insensitività del
// SOLO toponimo è ottenuta con un case-folder LOCALE e indipendente da privacy.ts.
function ciKeyword(word: string): string {
  return Array.from(word)
    .map((ch) => {
      const up = ch.toUpperCase();
      const lo = ch.toLowerCase();
      if (up !== lo) return `[${up}${lo}]`;
      if (/[.*+?^${}()|[\]\\-]/.test(ch)) return `\\${ch}`;
      return ch;
    })
    .join("");
}
const INDEP_STREET_WORDS = [
  "v.le", "via", "viale", "piazzale", "piazza", "p.zza", "largo", "vicolo", "c.so", "corso",
  "strada", "strade", "str.", "località", "loc.", "frazione", "fraz.", "borgo", "contrada",
  "salita", "rotonda", "circonvallazione",
];
const INDEP_STREET = `(?:${INDEP_STREET_WORDS.map(ciKeyword).join("|")})`;
// Il nome può iniziare con un articolo minuscolo ("dei Mille", "della Vittoria"); resta comunque
// richiesta una parola maiuscola dopo. Costruzione autonoma (lista propria di connettori).
const INDEP_NAME_LEAD = "(?:(?:dei|del|della|delle|degli|dello|di|il|lo|la|le)\\s+|(?:dell|degl)['’])?";
const INDEP_ADDR_RE = new RegExp(
  `\\b${INDEP_STREET}\\s+${INDEP_NAME_LEAD}[A-ZÀ-Þ][A-Za-zÀ-ÿ'’.]*(?:\\s+[A-Za-zÀ-ÿ'’.]+){0,4}[\\s,]*(?:n\\.?\\s*|nr\\.?\\s*|civ(?:ico)?\\.?\\s*|numero\\s*)?\\d{1,4}[A-Za-z]?\\b`,
  "u",
);

// ── Corpus di fuga INDIPENDENTE (telefoni) ───────────────────────────────────
// Approccio per CONTEGGIO-CIFRE (non per formato): un token con separatori tipografici che, tolti
// i non-numerici, dà 9–12 cifre con prefisso plausibile è un recapito — a meno che il token grezzo
// abbia la forma delle migliaia raggruppate di un prezzo ("1.200.000").
const CANDIDATE_NUM_RE = /(?:\+|00)?[\d][\d\s.\-/]{7,}\d/g;
const GROUPED_THOUSANDS_RE = /^\d{1,3}(?:\.\d{3})+$/; // prezzo: 1.200.000
function isPhoneCandidate(token: string): boolean {
  const raw = token.trim();
  if (GROUPED_THOUSANDS_RE.test(raw)) return false; // prezzo, non telefono
  const digits = raw.replace(/\D/g, "");
  const intl = /^(?:\+|00)?39/.test(raw.replace(/\s/g, ""));
  const national = digits.length;
  if (intl && national >= 10 && national <= 14) return true; // +39 + 8-12 cifre
  if (!intl && (national === 9 || national === 10) && /^(?:0|3)/.test(digits)) return true;
  return false;
}

// ── API pubblica ─────────────────────────────────────────────────────────────

export type LeakReason =
  | "leak-address-structured-token" // il testo contiene INSIEME via e civico noti
  | "leak-address-corpus" // pattern-indirizzo indipendente ha trovato un civico
  | "leak-phone-corpus"; // rilevatore-telefono indipendente ha trovato un recapito

export interface VerifyResult {
  ok: boolean;
  /** Codici-motivo PII-safe (nessun valore di indirizzo/telefono). */
  reasons: LeakReason[];
}

/**
 * true se l'indirizzo strutturato è ricomparso: il token DISTINTIVO (di norma il cognome, l'ultima
 * parola del nome-via) compare VICINO al civico noto (forma-indirizzo), non solo entrambi presenti.
 *
 * PERCHÉ così. Richiedere la sola co-presenza di "un token qualsiasi + il numero" produce falsi
 * positivi: nomi propri comuni ("Andrea", "Francesco", spesso da santi/quartieri) più un numero
 * banale ("1", "9") non sono un indirizzo. Il cognome è la parte identificante, e la PROSSIMITÀ al
 * civico conferma la forma-indirizzo ("… Palladio 1") distinguendola dalla coincidenza.
 */
function hasStructuredAddressLeak(text: string, tokens: SourceAddressTokens): boolean {
  if (!tokens.number || tokens.streetTokens.length === 0) return false;
  const salient = tokens.streetTokens[tokens.streetTokens.length - 1];
  if (salient.length < 4) return false;
  const hay = foldLower(text);
  const numRe = new RegExp(`\\b${tokens.number}\\b`);
  // Il civico deve comparire a ≤25 caratteri dal cognome, PRIMA o DOPO: è la forma "…Cognome, 12"
  // ma anche "al 12 di … Cognome". Fuori da questa finestra è coincidenza, non indirizzo.
  for (let idx = hay.indexOf(salient); idx >= 0; idx = hay.indexOf(salient, idx + 1)) {
    const window = hay.slice(Math.max(0, idx - 25), idx + salient.length + 25);
    if (numRe.test(window)) return true;
  }
  return false;
}

/** true se un candidato-telefono sopravvive nel testo (rilevatore indipendente). */
export function hasPhoneLeak(text: string): boolean {
  const matches = text.match(CANDIDATE_NUM_RE);
  if (!matches) return false;
  return matches.some(isPhoneCandidate);
}

/** true se il corpus-indirizzo indipendente trova un civico nel testo. */
export function hasAddressLeak(text: string): boolean {
  INDEP_ADDR_RE.lastIndex = 0;
  return INDEP_ADDR_RE.test(text);
}

/**
 * Verifica INDIPENDENTE dell'output pubblicato.
 *  • showAddress=false → nessun indirizzo civico deve sopravvivere (token noti + corpus);
 *  • telefono → mai, in nessun caso.
 */
export function verifyRedaction(
  text: string,
  opts: { showAddress: boolean; sourceAddress?: string },
): VerifyResult {
  const reasons: LeakReason[] = [];
  if (!opts.showAddress) {
    if (hasStructuredAddressLeak(text, sourceAddressTokens(opts.sourceAddress))) {
      reasons.push("leak-address-structured-token");
    }
    if (hasAddressLeak(text)) reasons.push("leak-address-corpus");
  }
  if (hasPhoneLeak(text)) reasons.push("leak-phone-corpus");
  return { ok: reasons.length === 0, reasons };
}
