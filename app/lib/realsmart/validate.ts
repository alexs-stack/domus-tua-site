// Validazione deterministica e pulizia dei segnaposto per gli annunci RealSmart.
//
// Due responsabilità, entrambe PURE e senza eccezioni:
//  1. `cleanField` — tratta i SEGNAPOSTO ("N/D", "-", "da definire"…) come campo
//     vuoto: un placeholder mostrato come dato è peggio di un campo assente.
//  2. `validateListing` — produce AVVISI strutturati sui record sospetti (niente
//     foto, prezzo mancante, stato non mappato, ecc.). Alimentano l'audit e i log
//     di go-live; NON finiscono mai in pagina. Il valore grezzo che fa scattare
//     l'avviso è conservato per diagnostica (task: preservare la sorgente).

import type { ListingStatus, NormalizedProperty, RealSmartListingRaw } from "./types";

// Valori che nei feed immobiliari italiani significano "non compilato", scritti
// come se fossero un dato. Confronto case-insensitive sul valore trimmato.
const PLACEHOLDER_VALUES: ReadonlySet<string> = new Set([
  "-",
  "--",
  "---",
  "//",
  "...",
  ".",
  "n/d",
  "n.d.",
  "nd",
  "n/a",
  "n.a.",
  "na",
  "n.p.",
  "da definire",
  "da definirsi",
  "non disponibile",
  "non specificato",
  "nessuno",
  "nessuna",
]);

/**
 * Stringa pulita, oppure `undefined` se assente, vuota o un SEGNAPOSTO.
 * È il filtro unico per i campi testuali: se un campo passa di qui, o è un dato
 * vero o non c'è — mai "N/D" spacciato per contenuto.
 */
export function cleanField(v: string | number | undefined | null): string | undefined {
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : undefined;
  if (typeof v !== "string") return undefined;
  // `\s+` → un solo spazio: il documento cita «doppio spazio nel titolo» fra i
  // difetti della scheda da 770.000 €, e un titolo con due spazi si vede.
  //
  // Attenzione a dove si usa: questo collassa anche gli A CAPO, quindi vale solo
  // per i campi DI UNA RIGA (titolo, comune, provincia, tipologia, classe, piano,
  // indirizzo, riferimento — vedi normalize.ts). La DESCRIZIONE non passa di qui e
  // non deve passarci mai: perderebbe i paragrafi, che sono l'unica punteggiatura
  // di respiro che il testo dell'agenzia possiede.
  const t = v.trim().replace(/\s+/g, " ");
  if (t.length === 0) return undefined;
  if (PLACEHOLDER_VALUES.has(t.toLowerCase())) return undefined;
  return t;
}

/** True se la stringa grezza è un segnaposto (o vuota). */
export function isPlaceholder(v: string | undefined | null): boolean {
  return cleanField(v) === undefined && (v ?? "").trim().length > 0;
}

export type ListingWarningCode =
  | "title-missing"
  | "images-missing"
  | "price-missing"
  | "type-missing"
  | "location-missing"
  | "surface-missing"
  | "status-unmapped"
  | "placeholder-field";

export interface ListingWarning {
  code: ListingWarningCode;
  /** Campo interessato, quando pertinente. */
  field?: string;
  /** Valore GREZZO che ha fatto scattare l'avviso (diagnostica, mai in pagina). */
  raw?: string;
  /** Messaggio interno (audit/log), in italiano. */
  message: string;
}

const KNOWN_STATUSES: ReadonlySet<string> = new Set<ListingStatus>([
  "draft",
  "published",
  "reserved",
  "sold",
  "withdrawn",
]);

/**
 * Avvisi deterministici su un annuncio già normalizzato. Non lancia mai.
 * L'ordine è stabile (utile ai test e a un diff dell'audit).
 */
export function validateListing(
  n: NormalizedProperty,
  raw: RealSmartListingRaw
): ListingWarning[] {
  const w: ListingWarning[] = [];

  if (n.title.trim().length === 0) {
    w.push({ code: "title-missing", field: "titolo", message: "Titolo assente." });
  }
  if (n.images.length === 0) {
    w.push({ code: "images-missing", message: "Nessuna foto: si userà un segnaposto." });
  }
  if (n.price === 0) {
    w.push({
      code: "price-missing",
      field: "prezzo",
      raw: typeof raw.prezzo === "string" ? raw.prezzo : undefined,
      message: "Prezzo mancante o non numerico: mostrato «Prezzo su richiesta».",
    });
  }
  // `type` è "Immobile" solo come RIPIEGO (tipologia assente/segnaposto).
  if (n.type === "Immobile") {
    w.push({
      code: "type-missing",
      field: "tipologia",
      raw: typeof raw.tipologia === "string" ? raw.tipologia : undefined,
      message: "Tipologia assente o segnaposto: ripiego «Immobile».",
    });
  }
  if (n.town.trim().length === 0) {
    w.push({ code: "location-missing", field: "comune", message: "Comune assente." });
  }
  if (n.sqm === 0) {
    w.push({
      code: "surface-missing",
      field: "mq",
      raw: typeof raw.mq === "string" ? raw.mq : undefined,
      message: "Superficie assente o non numerica.",
    });
  }
  // Stato PRESENTE ma non fra quelli mappati → normalizzato a "draft" (nascosto)
  // per sicurezza. È un buco di mappatura da chiudere prima del go-live.
  if (
    typeof raw.statoPubblicazione === "string" &&
    raw.statoPubblicazione.trim().length > 0 &&
    !KNOWN_STATUSES.has(raw.statoPubblicazione.trim())
  ) {
    w.push({
      code: "status-unmapped",
      field: "statoPubblicazione",
      raw: raw.statoPubblicazione,
      message: `Stato «${raw.statoPubblicazione}» non mappato: nascosto per sicurezza (draft).`,
    });
  }
  // Segnaposto lasciati in campi testuali dal gestionale.
  for (const [field, value] of [
    ["classeEnergetica", raw.classeEnergetica],
    ["piano", typeof raw.piano === "string" ? raw.piano : undefined],
  ] as const) {
    if (isPlaceholder(value)) {
      w.push({
        code: "placeholder-field",
        field,
        raw: value ?? undefined,
        message: `Campo «${field}» contiene un segnaposto («${value}»): trattato come vuoto.`,
      });
    }
  }

  return w;
}
