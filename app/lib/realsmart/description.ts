// Pulizia delle descrizioni RealSmart. Modulo PURO: testo in ingresso, testo in uscita.
//
// Da dove arriva il testo: `<AnnuncioCompleto>` del feed, dentro CDATA. Nel feed reale
// dell'agenzia 158 descrizioni su 193 contengono `<br/>`, e prima di questo modulo finivano
// a schermo COME TESTO ("…in un unico luogo. <br/>La villa che…"): React escapa il markup,
// quindi il tag si vedeva. Altri difetti ricorrenti del sorgente: punto incollato alla parola
// successiva ("comodità.Immagina"), spazi doppi, righe vuote multiple.
//
// Due principi:
//  1. NIENTE HTML. Il testo arriva da un sistema esterno: non lo si interpreta mai come
//     markup, lo si riduce a testo semplice. `<br>` e affini diventano a capo, tutto il resto
//     dei tag sparisce. Nessun `dangerouslySetInnerHTML` a valle.
//  2. NIENTE RISCRITTURE. Frasi e informazioni originali restano quelle: si tolgono solo il
//     markup, gli spazi ridondanti e la firma commerciale dell'agenzia (che è uno slogan
//     ripetuto in coda a ogni annuncio, non un dato sull'immobile).

/** Entità HTML che il gestionale può emettere. Nessuna decodifica generica: solo queste. */
const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
  "&#39;": "'",
  "&nbsp;": " ",
  "&egrave;": "è",
  "&eacute;": "é",
  "&agrave;": "à",
  "&ograve;": "ò",
  "&ugrave;": "ù",
  "&igrave;": "ì",
};

/** Tag che rappresentano un'interruzione di riga o di blocco. */
const BREAK_TAGS = /<\s*\/?\s*(?:br|p|div|li|tr|h[1-6])\s*\/?\s*>/gi;

/**
 * Riduce il testo del gestionale a TESTO SEMPLICE.
 *
 * `<br>`, `</p>`, `<li>`… diventano a capo; ogni altro tag viene rimosso senza lasciare
 * traccia. Il risultato non contiene mai `<` o `>` provenienti da markup: se il feed
 * inviasse `<script>alert(1)</script>`, resta solo `alert(1)` come testo inerte.
 */
export function stripMarkup(input: string): string {
  let out = input.replace(BREAK_TAGS, "\n");
  // Qualsiasi altro tag: via. (Il `<` letterale in un testo tipo "< 100 mq" non ha una
  // chiusura valida e quindi non viene toccato da questa regex.)
  out = out.replace(/<\/?[a-zA-Z][^>]*>/g, "");
  // Commenti e sezioni CDATA annidate.
  out = out.replace(/<!--[\s\S]*?-->/g, "").replace(/<!\[CDATA\[|\]\]>/g, "");
  for (const [entity, char] of Object.entries(ENTITIES)) {
    out = out.split(entity).join(char);
  }
  // Entità numeriche residue (&#233;) — nessuna esecuzione, sola conversione a carattere.
  out = out.replace(/&#(\d{1,5});/g, (_m, code: string) => {
    const n = Number.parseInt(code, 10);
    return n > 0 && n < 0x110000 ? String.fromCodePoint(n) : "";
  });
  return out;
}

/**
 * Normalizza gli spazi senza toccare le parole:
 *  • CRLF → LF, spazi unicode → spazio normale;
 *  • spazi ripetuti → uno solo;
 *  • spazio dopo un punto incollato alla parola successiva ("fine.Inizio" → "fine. Inizio");
 *  • più righe vuote di fila → una sola.
 */
export function normalizeWhitespace(input: string): string {
  return input
    .replace(/\r\n?/g, "\n")
    .replace(/[  -   　]/g, " ")
    .replace(/([.!?;:])([A-ZÀ-ÖØ-Þ])/g, "$1 $2")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Firma commerciale ripetuta in coda agli annunci dell'agenzia.
 * È uno slogan, non un'informazione sull'immobile: si toglie per non ripeterlo in ogni scheda.
 * Nient'altro viene rimosso dal testo originale.
 */
// `[\s\S]*` invece di `.*` con flag `s`: il target TypeScript del progetto è precedente a
// ES2018 e il flag dotAll non è disponibile.
const BOILERPLATE_TAILS: RegExp[] = [
  /con domus tua è\s+facile vendere[\s\S]*$/i,
  /ascolta il tuo cuore[\s\S]*$/i,
  /da oltre\s+\d+\s+anni al tuo fianco\.?\s*$/i,
  /sicuro acquistar\w*\.?\s*$/i,
];

export function stripBoilerplate(text: string): string {
  let out = text;
  let changed = true;
  while (changed) {
    changed = false;
    for (const re of BOILERPLATE_TAILS) {
      const next = out.replace(re, "");
      if (next !== out) {
        out = next.trim();
        changed = true;
      }
    }
  }
  return out.trim();
}

/** Pipeline completa: markup → testo, spazi normalizzati, firma commerciale via. */
export function cleanDescription(input: string | undefined | null): string {
  if (!input) return "";
  return stripBoilerplate(normalizeWhitespace(stripMarkup(input)));
}

/**
 * Divide la descrizione pulita in paragrafi leggibili.
 *
 * Se il testo ha già delle interruzioni (i `<br>` del feed diventano a capo), le rispetta:
 * sono la struttura voluta da chi ha scritto l'annuncio. Se invece è un muro unico senza
 * interruzioni, raggruppa le frasi a tre per volta — nessuna parola viene aggiunta o tolta.
 */
export function toParagraphs(input: string | undefined | null): string[] {
  const clean = cleanDescription(input);
  if (!clean) return [];

  const byBreak = clean
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (byBreak.length > 1) return byBreak;

  const sentences = clean.match(/[^.!?]+[.!?]+/g) ?? [clean];
  const paragraphs: string[] = [];
  for (let i = 0; i < sentences.length; i += 3) {
    const chunk = sentences.slice(i, i + 3).join(" ").trim();
    if (chunk) paragraphs.push(chunk);
  }
  return paragraphs.length > 0 ? paragraphs : [clean];
}

/**
 * Estratto per la card: frasi INTERE, mai tagliate a metà parola.
 * Se la prima frase è già lunghissima, taglia all'ultimo spazio e chiude con "…".
 */
export function excerptFrom(input: string | undefined | null): string {
  const clean = cleanDescription(input).replace(/\n+/g, " ").replace(/ {2,}/g, " ");
  if (!clean) return "";

  const sentences = clean.match(/[^.!?]+[.!?]+/g) ?? [clean];
  const first = sentences[0].trim();
  if (first.length > 170) {
    const cut = first.slice(0, 170);
    const lastSpace = cut.lastIndexOf(" ");
    return `${cut.slice(0, lastSpace > 120 ? lastSpace : 170).trim()}…`;
  }

  let out = "";
  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    const candidate = out ? `${out} ${trimmed}` : trimmed;
    if (out && candidate.length > 150) break;
    out = candidate;
    if (out.length >= 150) break;
  }
  return out;
}
