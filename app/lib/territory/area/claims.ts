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
  | "quantità" // numero, con o senza unità: 4.800 ettari, 12 posti
  | "condivisa"; // UNA proprietà attribuita a PIÙ soggetti insieme — vedi sotto

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

/**
 * Determinanti che aprono un sintagma nominale. Servono a riconoscere una COORDINAZIONE fra due
 * soggetti («la biblioteca civica E gli uffici dell'anagrafe») e a distinguerla da una coordinazione
 * fra verbi («attraversa Tradate E collega Varese») o da un nome che contiene «e» («Appiano Gentile
 * e Tradate»), dove il secondo membro non ha determinante.
 */
const DETERMINANTE = /^(?:il|lo|la|i|gli|le|un|uno|una|l['’]|un['’]|dell['’]|degli|delle|dei|del|della)\b/i;

/** L'ultimo sintagma nominale di una proposizione: «…ci sono la biblioteca civica» → «la biblioteca civica». */
const CODA_NOMINALE =
  /(?:\b(?:il|lo|la|i|gli|le|un|uno|una|dei|del|della|degli|delle)\b\s+|\b(?:l|dell|un|nell|sull)['’])[\p{L}'’]+(?:\s+[\p{L}'’]+)*$/iu;

/** Sigle di linea/strada: S40, RE5, R17, SS233, "statale 233". */
const DESIGNAZIONE = /\b(?:[SR]E?\d{1,3}|SS\s?\d{1,3}|statale\s+\d{1,3})\b/gi;

/** Quantità con eventuale unità. Richiede almeno una cifra. */
const QUANTITA = /\b\d+(?:[.\s]\d{3})*(?:,\d+)?\s*(?:ettari|ettaro|metri|km|minuti|min|ore|abitanti|posti|%)?\b/gi;

/**
 * Sequenze con iniziale maiuscola (nomi propri), inclusi i composti con trattino/apostrofo:
 * "Milano Cadorna", "Saronno–Laveno", "ASST dei Sette Laghi".
 */
const ENTITA = /\p{Lu}[\p{L}'’]*(?:[\s–-]+(?:d[ei]l?|de|della|dei|delle)?\s*\p{Lu}[\p{L}'’]*)*/gu;

/**
 * Parole che possono comparire MAIUSCOLE a inizio frase senza essere nomi propri: articoli,
 * preposizioni, ma anche verbi e participi che aprono tipicamente una frase descrittiva
 * («Aperta dal lunedì…», «Ospita corsi serali»), più giorni e mesi.
 *
 * LIMITE DICHIARATO: è una lista, non un analizzatore grammaticale. Un nome proprio raro che apre
 * una frase e non compare altrove può sfuggire, e un verbo non elencato può passare. La scelta è
 * deliberata: un falso positivo («verifica «Aperta»») insegna al revisore a saltare la checklist, ed
 * è il danno peggiore. Meglio una casella in meno che una casella assurda.
 */
export const NON_NOMI_PROPRI = new Set([
  // articoli e preposizioni
  "la", "il", "lo", "le", "i", "gli", "un", "una", "uno", "nel", "nella", "nei", "nelle",
  "dal", "dalla", "dai", "dalle", "del", "della", "dei", "delle", "al", "alla", "ai", "alle",
  "a", "ad", "in", "di", "da", "per", "con", "su", "tra", "fra", "questo", "questa", "questi",
  // aperture verbali/avverbiali tipiche di una frase descrittiva
  "aperta", "aperto", "chiusa", "chiuso", "ospita", "ospitano", "situato", "situata",
  "presente", "presenti", "attivo", "attiva", "dotato", "dotata", "comprende", "include",
  "offre", "offrono", "sorge", "sorgono", "si", "vi", "ci", "non", "ogni", "tutti", "tutte",
  "durante", "oltre", "circa", "inoltre", "sono", "è", "e", "collega", "collegano",
  // giorni e mesi
  "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato", "domenica",
  "gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto",
  "settembre", "ottobre", "novembre", "dicembre",
]);

/** Alias storico interno. */
const APERTURE = NON_NOMI_PROPRI;

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
  // Articolo ELISO attaccato al nome: «L'ospedale», «Dell'ASST». Si toglie il prefisso e si giudica
  // ciò che resta: se riparte in minuscolo è un nome comune, non un ente da verificare.
  let testo = grezza.trim().replace(/^(?:[LDNSC]|Un|Al|Dal|Nel|Sull)['’]/u, "");
  const parole = testo.split(/\s+/);
  while (parole.length > 1 && APERTURE.has(parole[0].toLowerCase())) parole.shift();
  testo = parole.join(" ").trim();
  if (testo.length < 3) return null; // frammenti di sigla o lettere sciolte: rumore
  if (!/^\p{Lu}/u.test(testo)) return null; // dopo l'elisione è un nome comune («ospedale»)
  // Parola SINGOLA che è un'apertura tipica («Aperta», «Ospita», «Martedì»): non è un nome proprio.
  if (parole.length === 1 && APERTURE.has(testo.toLowerCase())) return null;
  return testo;
}

/**
 * AFFERMAZIONI CONDIVISE: una stessa proprietà attribuita a più soggetti in una frase sola.
 *
 * PERCHÉ — il secondo errore vero trovato su questo repository. Era stata scritta:
 *   «In centro a Tradate ci sono la biblioteca civica E gli uffici dell'anagrafe.»
 * Ogni pezzo è vero — la biblioteca esiste, l'anagrafe esiste, Tradate esiste — ma stanno in vie
 * DIVERSE (anagrafe in piazza Mazzini, biblioteca in via Zara): falso è il LEGAME, non i pezzi.
 * È la forma più insidiosa di mezza verità, e l'estrazione per nomi propri non la vedeva nemmeno:
 * su quella frase produceva UNA sola casella, «Tradate».
 *
 * Qui non si pretende di analizzare la grammatica: si riconosce la FORMA a rischio — due sintagmi
 * nominali uniti da «e»/«ed», entrambi con determinante — e si chiede di verificarli separatamente.
 */
function estraiCondivise(testo: string): AreaClaim[] {
  const out: AreaClaim[] = [];
  // Si guarda dentro ogni proposizione: una coordinazione vale nella frase in cui compare.
  for (const frase of testo.split(/[.!?;]+/)) {
    const parti = frase.split(/\s+\b(?:ed|e)\b\s+/i);
    if (parti.length < 2) continue;
    for (let i = 0; i < parti.length - 1; i++) {
      const sinistra = parti[i].trim();
      const destra = parti[i + 1].trim();
      // A sinistra della «e» c'è tutta la proposizione: serve il sintagma nominale FINALE, cioè
      // l'ultimo gruppo che parte da un determinante («…ci sono LA BIBLIOTECA CIVICA»). Prendere
      // l'intera proposizione faceva fallire il riconoscimento — era il difetto della prima stesura.
      const sxNome = sinistra.match(CODA_NOMINALE)?.[0]?.trim() ?? "";
      // Entrambi i membri devono essere sintagmi nominali: è il caso «A e B» che condividono un
      // predicato. Verbo + verbo o nome proprio senza determinante non sono a rischio.
      if (sxNome.length === 0 || !DETERMINANTE.test(destra)) continue;
      // Si tolgono solo virgolette e il punto finale: l'apostrofo fa parte della parola
      // («dell'anagrafe»), toglierlo produceva «dellanagrafe» nella domanda al revisore.
      const a = sxNome.replace(/[«»"]/g, "").trim();
      const b = destra.replace(/[«»"]/g, "").replace(/\.$/, "").trim();
      out.push({
        kind: "condivisa",
        value: `${a} + ${b}`,
        question:
          `la frase dice la STESSA cosa di «${a}» e di «${b}»: la fonte lo conferma per ENTRAMBI, ` +
          "separatamente? (è la forma in cui due cose vere si uniscono in una frase falsa)",
        volatile: false,
      });
    }
  }
  return out;
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

  claims.push(...estraiCondivise(testo));

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
