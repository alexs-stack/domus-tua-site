// Controlli DETERMINISTICI per la copy generata dall'AI — la barriera che NON è mai il modello.
//
// Regola d'oro del mandato: "Never use an LLM as the only privacy control. The baseline redaction
// and blocking rules must be deterministic and testable." Qui vivono quelle regole: girano PRIMA
// della chiamata al modello (sul contesto) e DOPO (sull'output), e un output che le viola viene
// SCARTATO — si ripiega sull'originale sanitizzato. Il modello non ha l'ultima parola.
//
// Cosa blocchiamo nell'output generato:
//  • indirizzi civici esatti (via/piazza + numero) quando l'indirizzo non è autorizzato;
//  • numeri di telefono / recapiti diretti;
//  • affermazioni legali/di conformità ("a norma", "conforme", "certificato", "sanato"…);
//  • FATTI non supportati dalla fonte: numeri (mq, locali, camere, bagni, prezzo) o toponimi
//    (comune) che non compaiono nei campi sorgente = inventati.

// ── Rilevatori privacy (indirizzo civico, telefono) ─────────────────────────
const STREET_KEYWORD =
  "(?:via|viale|v\\.le|piazza(?:le)?|p\\.zza|largo|vicolo|corso|c\\.so|strad[ae]|str\\.|localit[aà]|loc\\.|frazione|fraz\\.|borgo|contrada)";

const CIVIC_ADDRESS_RE = new RegExp(
  `\\b(?i:${STREET_KEYWORD})\\s+\\p{Lu}[\\p{L}'’.]*(?:\\s+\\p{L}[\\p{L}'’.]*){0,3}\\s*,?\\s*(?:(?i:n(?:\\.|umero)?|civico)\\s*)?\\d+[A-Za-z]?\\b`,
  "gu",
);

const PHONE_RE = new RegExp(
  [
    "(?:\\+|00)\\s?39(?:[\\s.\\-/]?\\d){8,12}",
    "\\b0\\d{1,3}(?:[\\s.\\-/]?\\d){6,8}\\b",
    "\\b3\\d{2}(?:[\\s.\\-/]?\\d){7}\\b",
  ].join("|"),
  "g",
);

export function hasCivicAddress(text: string): boolean {
  CIVIC_ADDRESS_RE.lastIndex = 0;
  return CIVIC_ADDRESS_RE.test(text);
}
export function hasPhoneNumber(text: string): boolean {
  PHONE_RE.lastIndex = 0;
  return PHONE_RE.test(text);
}

/**
 * Redazione deterministica del testo SORGENTE prima di darlo al modello (mandato: "address/phone
 * redaction before any model call"). Indirizzi civici → comune (se showAddress=false); telefoni →
 * rimossi. Così il modello non vede nemmeno il dato sensibile, e i guard sull'output sono la seconda
 * barriera, non la prima.
 */
export function redactForPrompt(
  text: string,
  opts: { showAddress: boolean; comune?: string },
): string {
  let out = text;
  if (!opts.showAddress) {
    const repl = opts.comune?.trim() ? opts.comune.trim() : "zona riservata";
    out = out.replace(CIVIC_ADDRESS_RE, repl);
  }
  out = out.replace(PHONE_RE, "");
  return out.replace(/[ \t]{2,}/g, " ").replace(/\s+([.,;:])/g, "$1").trim();
}

// ── Affermazioni legali/di conformità ────────────────────────────────────────
// L'AI non deve MAI attestare uno stato legale/tecnico: quello lo dice la fonte o l'agenzia.
const LEGAL_CLAIM_RE =
  /\b(?:conform[ei]|a\s+norma|sanat[oa]|condonat[oa]|certificat[oaie]|in\s+regola|regolar[ei]|abusiv[oa]|accatastat[oa]|conformità|agibilit[aà]|abitabilit[aà])\b/i;

export function hasLegalClaim(text: string): boolean {
  return LEGAL_CLAIM_RE.test(text);
}

// ── Fatti non supportati dalla fonte ─────────────────────────────────────────

/** Campi sorgente "verificabili" contro cui misurare le affermazioni della copy. */
export interface SourceFacts {
  /** Comune (per non inventare toponimi). */
  comune: string;
  /** Numeri leciti nella copy: mq, locali, camere, bagni, prezzo, piano… come stringhe. */
  numbers: string[];
}

/** Numeri "citabili" senza essere un fatto specifico (anni, misure generiche, ordinali brevi). */
function isBenignNumber(n: string): boolean {
  const v = Number(n);
  // 1..10 = ordinali/piccole quantità di prosa ("due passi", "tre minuti"); 1900..2100 = anni.
  return (v >= 1 && v <= 10) || (v >= 1900 && v <= 2100);
}

export type GuardCode =
  | "indirizzo"
  | "telefono"
  | "claim-legale"
  | "numero-inventato"
  | "toponimo-inventato";

export interface GuardResult {
  ok: boolean;
  violations: GuardCode[];
}

/**
 * Valida un testo generato contro le regole deterministiche.
 * `showAddress=false` → gli indirizzi civici sono una violazione. `source` limita numeri e comune.
 */
export function checkGeneratedText(
  text: string,
  opts: { showAddress: boolean; source: SourceFacts },
): GuardResult {
  const violations: GuardCode[] = [];

  if (!opts.showAddress && hasCivicAddress(text)) violations.push("indirizzo");
  if (hasPhoneNumber(text)) violations.push("telefono");
  if (hasLegalClaim(text)) violations.push("claim-legale");

  // Numeri non supportati: ogni numero "significativo" nel testo deve comparire tra i numeri
  // sorgente (mq/locali/camere/bagni/prezzo). Altrimenti è inventato.
  const allowed = new Set(opts.source.numbers.map((n) => n.replace(/[^\d]/g, "")).filter(Boolean));
  const textNumbers = (text.match(/\d[\d.,]*/g) ?? []).map((n) => n.replace(/[^\d]/g, "")).filter(Boolean);
  for (const n of textNumbers) {
    if (isBenignNumber(n)) continue;
    if (!allowed.has(n)) {
      violations.push("numero-inventato");
      break;
    }
  }

  return { ok: violations.length === 0, violations };
}
