// Normalizzazione delle DESCRIZIONI RealSmart (campo <AnnuncioCompleto>).
//
// PERCHÉ ESISTE QUESTO MODULO
// Il gestionale consegna la descrizione come frammento HTML dentro una CDATA: i ritorni a capo
// dell'autore sono codificati come <br/> e non come "\n". Il feed viene letto con
// fast-xml-parser (`ignoreAttributes: true`), che restituisce il contenuto della CDATA come
// TESTO: i "<br/>" quindi NON sono markup per React, sono caratteri che finiscono a schermo.
// Da qui i "<br/>" visibili in pagina.
//
// COSA FA
// Trasforma il testo grezzo in un elenco di paragrafi puliti e sicuri, pronti per essere
// renderizzati come <p>{paragrafo}</p> (mai dangerouslySetInnerHTML).
//
// PRINCIPI (non negoziabili)
//   • funzione PURA, server-side, senza dipendenze: stesso input → stesso output;
//   • NON riscrive, NON riassume, NON parafrasa: il copy dell'agenzia resta parola per parola;
//   • NON raggruppa le frasi "a gruppi di N": i paragrafi nascono solo da separatori REALI
//     presenti nel testo (break HTML, ritorni a capo, giunture di paragrafo perdute);
//   • non perde informazioni, tranne il boilerplate commerciale finale (rimozione esplicita,
//     limitata e misurata: vedi stripBoilerplateFromLine).
//
// ORDINE DELLA PIPELINE (l'ordine conta):
//   1. normalizza i ritorni a capo (CRLF/CR → LF);
//   2. decodifica le entità HTML, anche doppie ("&amp;lt;br/&gt;" → "<br/>");
//   3. elimina i blocchi pericolosi CON il loro contenuto (script/style/iframe/...);
//   4. converte i break e i tag di blocco in ritorni a capo — PRIMA di eliminare gli altri tag,
//      altrimenti "riga1<br/>riga2" collasserebbe in "riga1riga2";
//   5. elimina i tag residui;
//   6. ripulisce spazi, spazi unificatori, caratteri invisibili;
//   7. separa la punteggiatura incollata alla frase successiva;
//   8. costruisce i paragrafi, rimuovendo le firme commerciali riga per riga e unendo i
//      soli frammenti spezzati per errore.

/** Risultato della normalizzazione di una descrizione. */
export interface NormalizedDescription {
  /** Paragrafi puliti, nell'ordine originale. Mai stringhe vuote, mai tag, mai entità. */
  paragraphs: string[];
  /** Estratto per card/meta: frasi intere, mai troncate a metà parola. */
  excerpt: string;
  /** Testo piatto normalizzato (paragrafi uniti da "\n"). Utile ad audit e test. */
  plainText: string;
}

// ── 2. Entità HTML ───────────────────────────────────────────────────────────

/** Entità nominate che compaiono realmente nei feed immobiliari italiani. */
const NAMED_ENTITIES: Readonly<Record<string, string>> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
  hellip: "…",
  laquo: "«",
  raquo: "»",
  ldquo: "“",
  rdquo: "”",
  lsquo: "‘",
  rsquo: "’",
  sup2: "²",
  sup3: "³",
  deg: "°",
  euro: "€",
  bull: "•",
  middot: "·",
  agrave: "à",
  egrave: "è",
  eacute: "é",
  igrave: "ì",
  ograve: "ò",
  ugrave: "ù",
  Agrave: "À",
  Egrave: "È",
  Eacute: "É",
  Igrave: "Ì",
  Ograve: "Ò",
  Ugrave: "Ù",
};

/** Decodifica UNA passata di entità nominate e numeriche (decimali ed esadecimali). */
function decodeEntitiesOnce(input: string): string {
  return input.replace(/&(#[xX]?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]{1,31});/g, (match, body: string) => {
    if (body.startsWith("#")) {
      const isHex = body[1] === "x" || body[1] === "X";
      const code = Number.parseInt(isHex ? body.slice(2) : body.slice(1), isHex ? 16 : 10);
      // Code point non valido o carattere di controllo → si scarta l'entità (mai crash).
      if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff) return "";
      try {
        return String.fromCodePoint(code);
      } catch {
        return "";
      }
    }
    const named = NAMED_ENTITIES[body];
    return named !== undefined ? named : match; // entità sconosciuta: lasciata com'è
  });
}

/**
 * Decodifica le entità fino a stabilità (max 4 passate) per gestire il doppio escaping
 * ("&amp;lt;br/&gt;" → "&lt;br/&gt;" → "<br/>"), tipico dei feed che passano da più sistemi.
 * Il limite di passate evita loop su input costruiti ad arte.
 */
function decodeEntities(input: string): string {
  let out = input;
  for (let i = 0; i < 4; i += 1) {
    const next = decodeEntitiesOnce(out);
    if (next === out) break;
    out = next;
  }
  return out;
}

// ── 3. Markup pericoloso ─────────────────────────────────────────────────────

/** Elementi il cui CONTENUTO non è testo leggibile e non deve mai finire in pagina. */
const DANGEROUS_ELEMENTS = ["script", "style", "iframe", "object", "embed", "noscript", "svg"];

/**
 * Elimina i blocchi pericolosi insieme al loro contenuto, anche se il tag di chiusura manca
 * (un "<script>" non chiuso mangia il resto del frammento: è il comportamento corretto).
 * NB: il sito non usa mai dangerouslySetInnerHTML — React escapa comunque il testo. Questa è
 * una seconda barriera, perché il testo finisce anche in metadata e JSON-LD.
 */
function stripDangerousBlocks(input: string): string {
  let out = input;
  for (const tag of DANGEROUS_ELEMENTS) {
    out = out.replace(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}\\s*>`, "gi"), " ");
    out = out.replace(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*$`, "gi"), " ");
  }
  return out;
}

// ── 4-5. Tag → ritorni a capo, poi rimozione dei tag residui ────────────────

/** Tag che nell'HTML introducono un'interruzione di riga/blocco. */
const BLOCK_TAGS = "p|div|li|ul|ol|tr|table|h[1-6]|section|article|header|footer|blockquote|pre|hr";

function markupToNewlines(input: string): string {
  return (
    input
      // Break in ogni variante: <br>, <br/>, <br />, <BR   />.
      .replace(/<\s*br\s*\/?\s*>/gi, "\n")
      // Tag di blocco (apertura e chiusura) → interruzione di riga.
      .replace(new RegExp(`<\\s*\\/?\\s*(?:${BLOCK_TAGS})\\b[^>]*>`, "gi"), "\n")
      // Celle di tabella → semplice separatore di spazio.
      .replace(/<\s*\/?\s*t[dh]\b[^>]*>/gi, " ")
  );
}

function stripRemainingTags(input: string): string {
  return (
    input
      .replace(/<!--[\s\S]*?-->/g, " ") // commenti HTML
      .replace(/<[^>]*>/g, "") // qualunque tag residuo (già senza break utili)
      .replace(/<[^>]*$/g, "") // tag troncato in coda (feed malformato)
  );
}

// ── 6-7. Pulizia tipografica ────────────────────────────────────────────────

/**
 * Separa la punteggiatura incollata alla frase successiva ("…Tradate.Con una superficie…").
 *
 * Nei feed RealSmart questa giuntura NON è un refuso qualunque: è un a-capo dell'autore perso
 * nel passaggio tra sistemi (le descrizioni senza <br/> sono blocchi unici in cui ogni "‹punto›
 * ‹Maiuscola›" senza spazio coincide con l'inizio del paragrafo successivo). La ricostruiamo
 * quindi come interruzione di PARAGRAFO, non come semplice spazio: nessun testo viene aggiunto,
 * tolto o riordinato.
 *
 * Il lookbehind `(?<!\b[A-Z])` protegge le sigle puntate ("N.B.", "S.p.A.").
 */
function splitGluedSentences(input: string): string {
  return input.replace(/(?<!\b[A-Z])([.!?])([A-ZÀ-ÖØ-Þ])/g, "$1\n$2");
}

/** Normalizza spazi, spazi unificatori e caratteri invisibili. */
function normalizeWhitespace(input: string): string {
  return (
    input
      .replace(/\r\n?/g, "\n") // CRLF / CR → LF
      .replace(/[\u00a0\u202f\u2007]/g, " ") // spazi unificatori (nbsp e simili) → spazio normale
      .replace(/[\u200b-\u200d\ufeff]/g, "") // zero-width e BOM
      .replace(/[\u2028\u2029]/g, "\n") // separatori di riga/paragrafo Unicode
      .replace(/[ \t]+/g, " ") // spazi duplicati (i newline restano intatti)
  );
}

// ── 8. Boilerplate commerciale finale ───────────────────────────────────────

/**
 * Firme commerciali dell'agenzia: la stessa riga ripetuta identica su decine di annunci, che il
 * sito rende già altrove (CTA, blocco recensioni, footer). Ogni regex cattura DALLA firma FINO
 * ALLA FINE DELLA RIGA in cui compare.
 *
 * ATTENZIONE — il taglio è per RIGA, non fino alla fine della descrizione: nel feed reale ci
 * sono annunci in cui dopo la firma arrivano informazioni vere (es. "nell'annuncio sono stati
 * inseriti alcuni render illustrativi"). Tagliare fino in fondo le cancellerebbe.
 */
const BOILERPLATE_TAILS: readonly RegExp[] = [
  /con\s+domus\s*tua[^.]{0,40}\bfacile\s+vendere.*$/i,
  /con\s+domus\s*tua,\s*vendere\s+è\s+facile.*$/i,
  /ascolta il tuo cuore.*$/i,
  /da oltre\s+\d+\s+anni al tuo fianco.*$/i,
  /(?:è\s+)?sicuro acquistar\w*.*$/i,
  // NB: l'ordine conta — le varianti che includono la firma "Domus Tua" vanno provate PRIMA
  // di quelle più corte, altrimenti la firma resta orfana in coda.
  /domus\s*tua[.,:…\s—-]*we love.*$/i,
  /we love home.*$/i,
  /domus\s*tua[…\s.!·-]*$/i, // firma rimasta sola in ultima riga
  /leggi le oltre\s+\d+\s+recensioni.*$/i,
  /grazie per essere arrivato fino a qui.*$/i,
  /domus tua immobiliare\s*·.*$/i,
];

/** Quota massima dell'INTERA descrizione che il boilerplate può portare via. */
const MAX_BOILERPLATE_RATIO = 0.3;
/** Sotto questa soglia il taglio è sempre ammesso, qualunque sia la quota. */
const ALWAYS_SAFE_TAIL_CHARS = 400;

/**
 * Rimuove le firme commerciali riga per riga, anche combinate (più firme in fila).
 *
 * Guardia anti-perdita: un singolo taglio non può portare via più del 30% dell'intera
 * descrizione, a meno che non sia corto (≤400 caratteri). Così un match anomalo all'inizio
 * di un annuncio lungo non può cancellare il contenuto reale.
 */
function stripBoilerplateFromLine(line: string, totalLength: number): string {
  let out = line.trim();
  for (let guard = 0; guard < BOILERPLATE_TAILS.length * 2; guard += 1) {
    let changed = false;
    for (const re of BOILERPLATE_TAILS) {
      const next = out.replace(re, "").trim();
      if (next === out) continue;
      const removed = out.length - next.length;
      if (removed > ALWAYS_SAFE_TAIL_CHARS && removed / totalLength > MAX_BOILERPLATE_RATIO) {
        continue; // taglio troppo ampio: non è una firma in coda, si lascia la riga intera
      }
      out = next;
      changed = true;
      if (out.length === 0) return "";
    }
    if (!changed) break;
  }
  return out;
}

// ── 9. Paragrafi ────────────────────────────────────────────────────────────

/** Un frammento è una CONTINUAZIONE se non può iniziare un paragrafo. */
function isContinuationFragment(line: string): boolean {
  if (line.length === 0) return true;
  // Inizia con punteggiatura di continuazione (", e poi…") o con lettera minuscola.
  if (/^[,;:)»”’…]/.test(line)) return true;
  const first = line[0];
  return /\p{Ll}/u.test(first);
}

/** Il paragrafo precedente è INCOMPLETO se non termina con punteggiatura di chiusura. */
function endsOpen(line: string): boolean {
  return !/[.!?:;»”’…)\]]$/.test(line.trim());
}

/**
 * Costruisce i paragrafi finali.
 *
 * • Ogni interruzione presente nel testo (break HTML, a-capo, giuntura ricostruita) è un
 *   candidato paragrafo: NON si raggruppa per numero di frasi.
 * • Si uniscono SOLO i frammenti chiaramente spezzati per errore: riga che non può iniziare
 *   un paragrafo (minuscola/punteggiatura) dopo una riga rimasta aperta.
 * • Una riga separata da un break resta separata anche se è brevissima
 *   ("Classe B · Doppio terrazzo · Vista Monte Rosa · Due autorimesse").
 */
function toParagraphs(text: string): string[] {
  const lines = text
    .split(/\n+/)
    .map((line) => stripBoilerplateFromLine(line, text.length))
    .filter((line) => line.length > 0);

  const paragraphs: string[] = [];
  for (const line of lines) {
    const previous = paragraphs[paragraphs.length - 1];
    if (previous !== undefined && isContinuationFragment(line) && endsOpen(previous)) {
      paragraphs[paragraphs.length - 1] = `${previous} ${line}`;
      continue;
    }
    paragraphs.push(line);
  }
  return paragraphs;
}

// ── Estratto ────────────────────────────────────────────────────────────────

const EXCERPT_TARGET = 150;
const EXCERPT_HARD_LIMIT = 170;

/** Estratto per frasi intere (mai tagliato a metà parola). */
export function buildExcerpt(paragraphs: readonly string[]): string {
  const source = paragraphs.join(" ").trim();
  if (!source) return "";

  const sentences = source.match(/[^.!?]+[.!?]+/g)?.map((s) => s.trim()) ?? [source];
  const first = sentences[0];
  if (first.length > EXCERPT_HARD_LIMIT) {
    const cut = first.slice(0, EXCERPT_HARD_LIMIT);
    const lastSpace = cut.lastIndexOf(" ");
    return `${cut.slice(0, lastSpace > 120 ? lastSpace : EXCERPT_HARD_LIMIT).trim()}…`;
  }

  let out = "";
  for (const sentence of sentences) {
    const candidate = out ? `${out} ${sentence}` : sentence;
    if (out && candidate.length > EXCERPT_TARGET) break;
    out = candidate;
    if (out.length >= EXCERPT_TARGET) break;
  }
  return out;
}

// ── API pubblica ────────────────────────────────────────────────────────────

/**
 * Normalizza una descrizione RealSmart grezza in paragrafi puliti.
 * Difensiva: input assente/vuoto → risultato vuoto, mai eccezioni.
 */
export function normalizeDescription(raw: string | null | undefined): NormalizedDescription {
  if (typeof raw !== "string" || raw.trim().length === 0) {
    return { paragraphs: [], excerpt: "", plainText: "" };
  }

  let text = raw;
  text = normalizeWhitespace(text); // CRLF prima di tutto: i pattern successivi vedono solo \n
  text = decodeEntities(text); // "&lt;br/&gt;" → "<br/>", "&amp;" → "&", "&nbsp;" → spazio
  text = normalizeWhitespace(text); // le entità appena decodificate possono essere nbsp/zero-width
  text = stripDangerousBlocks(text); // script/style/... spariscono col loro contenuto
  text = markupToNewlines(text); // break e blocchi → "\n"  (PRIMA di togliere i tag)
  text = stripRemainingTags(text); // ogni tag residuo sparisce
  text = normalizeWhitespace(text);
  text = splitGluedSentences(text); // "…piano.Oggi a Tradate…" → nuovo paragrafo

  // toParagraphs applica anche la rimozione delle firme commerciali, riga per riga.
  const paragraphs = toParagraphs(text);
  return {
    paragraphs,
    excerpt: buildExcerpt(paragraphs),
    plainText: paragraphs.join("\n"),
  };
}

/** Scorciatoia: solo i paragrafi. */
export function descriptionParagraphs(raw: string | null | undefined): string[] {
  return normalizeDescription(raw).paragraphs;
}

/** Scorciatoia: solo l'estratto (card, meta description, JSON-LD). */
export function descriptionExcerpt(raw: string | null | undefined): string {
  return normalizeDescription(raw).excerpt;
}
