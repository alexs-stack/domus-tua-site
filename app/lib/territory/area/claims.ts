// SCOMPOSIZIONE IN AFFERMAZIONI VERIFICABILI di un fatto d'area.
//
// PERCHÉ ESISTE — un errore vero, commesso su questo repository. Era stata scritta, e presentata
// come esemplare, questa frase:
//
//   «Dalla stazione di Tradate la linea S40 di Trenord porta diretti a Milano Cadorna e a Como San
//    Giovanni.»
//
// Ha superato TUTTI i controlli automatici: nessun giudizio (subjective.ts), nessun burocratese,
// dati concreti, fonte citata (quality.ts). Ed era sbagliata due volte: Tradate non è sulla S40, e
// non esiste un collegamento diretto con Como San Giovanni. Il punto è che nessun controllo
// deterministico può sapere se un'affermazione è VERA: può solo dire com'è scritta.
//
// Quello che invece si può fare — ed è ciò che serve davvero al revisore — è SPEZZARE la frase nelle
// singole cose che afferma, e chiedergli di verificarle UNA PER UNA contro la fonte. Chi legge una
// frase scorrevole annuisce; chi ha davanti tre caselle ne controlla tre. Nel caso sopra: «la linea
// è la S40?» e «arriva a Como San Giovanni?» sarebbero cadute subito.
//
// Questo file NON verifica nulla: prepara il lavoro di chi verifica.

/** Tipo di affermazione, perché alcune invecchiano più in fretta di altre. */
export type ClaimKind =
  | "designazione" // sigla di linea/strada: S40, RE5, SS233 — cambia con gli orari e i riassetti
  | "entità" // ente, luogo, operatore: Trenord, ASST Sette Laghi, Milano Cadorna
  | "quantità"; // numero, con o senza unità: 4.800 ettari, 12 posti

export interface AreaClaim {
  kind: ClaimKind;
  /** Il frammento da verificare, così com'è nel testo. */
  value: string;
  /** Domanda pronta per il revisore. */
  question: string;
  /**
   * true se l'affermazione è particolarmente soggetta a cambiare (sigle di linea, orari, numeri di
   * servizio): va ri-verificata a ogni revisione, non solo alla prima approvazione.
   */
  volatile: boolean;
}

/** Sigle di linea/strada: S40, RE5, R17, SS233, "statale 233". */
const DESIGNAZIONE = /\b(?:[SR]E?\d{1,3}|SS\s?\d{1,3}|statale\s+\d{1,3})\b/gi;

/** Quantità con eventuale unità. Richiede almeno una cifra. */
const QUANTITA = /\b\d{1,3}(?:[.\s]\d{3})*(?:,\d+)?\s*(?:ettari|ettaro|metri|m|km|minuti|min|ore|abitanti|posti|%)?\b/gi;

/**
 * Sequenze con iniziale maiuscola (nomi propri), inclusi i composti con trattino/apostrofo:
 * "Milano Cadorna", "Saronno–Laveno", "ASST dei Sette Laghi".
 */
const ENTITA = /\p{Lu}[\p{L}'’]*(?:[\s–-]+(?:d[ei]l?|de|della|dei|delle)?\s*\p{Lu}[\p{L}'’]*)*/gu;

/** Parole che iniziano una frase e non sono nomi propri: non vanno chieste come entità. */
const APERTURE = new Set([
  "la", "il", "lo", "le", "i", "gli", "un", "una", "uno", "nel", "nella", "dal", "dalla",
  "a", "ad", "in", "di", "da", "per", "con", "su", "tra", "fra", "questo", "questa",
]);

function dedupe(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    const key = v.trim().toLowerCase();
    if (key.length === 0 || seen.has(key)) continue;
    seen.add(key);
    out.push(v.trim());
  }
  return out;
}

/**
 * Ripulisce un'entità estratta: toglie l'articolo/preposizione iniziale («Il Parco Pineta» →
 * «Parco Pineta») e scarta i frammenti troppo corti, come la «S» avanzata da una sigla già contata.
 */
function normalizzaEntita(grezza: string): string | null {
  const parole = grezza.trim().split(/\s+/);
  while (parole.length > 1 && APERTURE.has(parole[0].toLowerCase())) parole.shift();
  const pulita = parole.join(" ").trim();
  if (pulita.length < 3) return null; // singole lettere/sigle spezzate: rumore, non affermazioni
  return pulita;
}

/**
 * Estrae le affermazioni verificabili contenute nel testo di un fatto d'area. Deterministica.
 * Non giudica: elenca ciò che un revisore deve poter spuntare contro la fonte.
 */
export function extractClaims(testo: string): AreaClaim[] {
  const claims: AreaClaim[] = [];

  for (const d of dedupe(testo.match(DESIGNAZIONE) ?? [])) {
    claims.push({
      kind: "designazione",
      value: d,
      question: `«${d}» è davvero la sigla corretta? (le sigle cambiano con i riassetti di linea)`,
      volatile: true,
    });
  }

  for (const q of dedupe(testo.match(QUANTITA) ?? [])) {
    // Le cifre già contate come designazione non si ripetono.
    if (claims.some((c) => c.value.toLowerCase().includes(q.toLowerCase()))) continue;
    claims.push({
      kind: "quantità",
      value: q,
      question: `«${q}» corrisponde al dato della fonte?`,
      volatile: false,
    });
  }

  // Entità: ripulite dall'articolo iniziale e dai frammenti troppo corti.
  const grezze = testo.match(ENTITA) ?? [];
  const entita = grezze
    .map(normalizzaEntita)
    .filter((e): e is string => e !== null)
    .filter((e) => !APERTURE.has(e.toLowerCase()));
  for (const e of dedupe(entita)) {
    // Già coperta da una designazione (es. la "S" residua di "S40"): non si chiede due volte.
    if (claims.some((c) => c.value.toLowerCase() === e.toLowerCase() || c.value.toLowerCase().startsWith(e.toLowerCase()))) continue;
    claims.push({
      kind: "entità",
      value: e,
      question: `la fonte conferma «${e}» (nome e ruolo esatti)?`,
      volatile: false,
    });
  }

  return claims;
}

/**
 * Checklist pronta da incollare nel pacchetto di review. Una riga per affermazione, con il segno
 * di spunta: il revisore le percorre una a una invece di approvare una frase intera a colpo d'occhio.
 */
export function claimsChecklist(testo: string): string[] {
  const claims = extractClaims(testo);
  if (claims.length === 0) return ["- [ ] la frase non contiene dati verificabili: serve un fatto più concreto"];
  return claims.map((c) => `- [ ] ${c.question}${c.volatile ? " ⟳ da ricontrollare a ogni revisione" : ""}`);
}

/** true se il testo contiene almeno un'affermazione volatile (sigle di linea, numeri di servizio). */
export function hasVolatileClaim(testo: string): boolean {
  return extractClaims(testo).some((c) => c.volatile);
}
