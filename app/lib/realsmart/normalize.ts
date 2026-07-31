// Normalizzazione: da RealSmartListingRaw (forma grezza gestionale) a NormalizedProperty
// (forma pulita usata dal sito). Funzione PURA e difensiva: nessun side effect, nessuna
// eccezione su campi mancanti. Se il feed reale userà nomi diversi, si adatta qui la mappatura.

import { normalizeDescription } from "./description";
import { factsFromDescription, factsFromFields, mergeFacts } from "./facts";
import { splitDescription } from "./descriptionSplit";
import { getListingOverride } from "./overrides.data";
import { applyRemovals, overrideFacts } from "./overrides";
import type {
  ContractType,
  ListingStatus,
  NormalizedImage,
  NormalizedProperty,
  RealSmartListingRaw,
  RealSmartMedia,
} from "./types";

const VALID_STATUSES: ReadonlySet<string> = new Set<ListingStatus>([
  "draft",
  "published",
  "reserved",
  "sold",
  "withdrawn",
]);

// Formatter it-IT riusabile (separatore migliaia ".", nessun decimale).
const priceFormatter = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

/** Converte in numero un valore che può essere number, stringa "420.000" o undefined. */
function toNumber(value: number | string | undefined | null): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === "string") {
    // Rimuove tutto ciò che non è cifra (punti migliaia, "€", "m²", spazi, ecc.).
    const digits = value.replace(/[^\d]/g, "");
    if (digits.length === 0) return 0;
    const parsed = Number.parseInt(digits, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

/** Rende una stringa URL-safe (accenti rimossi, spazi → trattini). */
function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // rimuove i diacritici (combining marks)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // non alfanumerici → trattino
    .replace(/^-+|-+$/g, "") // trim dei trattini
    .replace(/-{2,}/g, "-"); // collassa trattini multipli
}

/**
 * Rende sentence-case un titolo che arriva quasi tutto in MAIUSCOLO dal feed
 * (es. "TERRENO EDIFICABILE A 5 MIN. DAL CENTRO"). Si attiva SOLO quando almeno
 * il 70% delle lettere è maiuscolo: i titoli già in mixed-case restano intatti.
 * Minuscolizza tutto, poi capitalizza la prima lettera della stringa e la prima
 * lettera dopo ogni terminatore di frase (. ! ?).
 */
function titleize(input: string): string {
  const letters = input.match(/\p{L}/gu) ?? [];
  if (letters.length === 0) return input;

  const upper = letters.filter((ch) => ch !== ch.toLowerCase()).length;
  // Se meno del 70% delle lettere è maiuscolo, il titolo è già mixed-case: non tocchiamo nulla.
  if (upper / letters.length < 0.7) return input;

  const lowered = input.toLowerCase();
  // Capitalizza la prima lettera della stringa e la prima lettera dopo . ! ?
  return lowered.replace(/(^\s*|[.!?]\s+)(\p{L})/gu, (_match, prefix, letter) => {
    return prefix + (letter as string).toUpperCase();
  });
}

/** Normalizza il contratto: default "vendita" se assente/non riconosciuto. */
function normalizeContract(raw: string | undefined): ContractType {
  return raw?.toLowerCase() === "affitto" ? "affitto" : "vendita";
}

/**
 * Normalizza lo stato. Uno stato assente/non riconosciuto NON deve pubblicare per errore
 * (rischio: mostrare un immobile venduto): default "draft" (nascosto dalla lista pubblica).
 * Mappare gli stati reali del feed RealSmart prima del go-live.
 */
function normalizeStatus(raw: string | undefined): ListingStatus {
  if (raw && VALID_STATUSES.has(raw)) {
    return raw as ListingStatus;
  }
  return "draft";
}

/** Ordina i media per `ordine` crescente (undefined in coda) mantenendo stabilità. */
function sortMedia(media: readonly RealSmartMedia[]): RealSmartMedia[] {
  return media
    .map((m, index) => ({ m, index }))
    .sort((a, b) => {
      const oa = typeof a.m.ordine === "number" ? a.m.ordine : Number.MAX_SAFE_INTEGER;
      const ob = typeof b.m.ordine === "number" ? b.m.ordine : Number.MAX_SAFE_INTEGER;
      if (oa !== ob) return oa - ob;
      return a.index - b.index; // fallback: ordine di arrivo
    })
    .map((entry) => entry.m);
}

/** Deriva i badge editoriali da stato + caratteristiche. */
function deriveBadges(
  status: ListingStatus,
  features: readonly string[],
  contract: ContractType,
): string[] {
  const badges: string[] = [];

  // Badge di stato prioritari.
  if (status === "reserved") badges.push("Sotto proposta");
  if (status === "sold") badges.push(contract === "affitto" ? "Affittato" : "Venduto");
  if (status === "withdrawn") badges.push("Ritirato");

  // Badge derivati dalle caratteristiche (match case-insensitive).
  const lower = features.map((f) => f.toLowerCase());
  const has = (needle: string) => lower.some((f) => f.includes(needle));

  if (has("esclusiv")) badges.push("In esclusiva");
  if (has("virtual") || has("tour")) badges.push("Virtual tour");
  if (has("open domus")) badges.push("Open Domus");
  if (has("document") && has("verific")) badges.push("Documenti verificati");

  // Deduplica preservando l'ordine.
  return Array.from(new Set(badges));
}

/** Normalizza un singolo media raw in immagine {src, alt}, con alt di fallback. */
function toImage(media: RealSmartMedia, fallbackAlt: string): NormalizedImage {
  const caption = media.didascalia?.trim();
  return {
    src: media.url,
    alt: caption && caption.length > 0 ? caption : fallbackAlt,
  };
}

/**
 * Normalizza un annuncio grezzo RealSmart nella forma pulita del sito.
 * Difensiva: gestisce campi mancanti senza lanciare eccezioni.
 */
export function normalizeRealSmartListing(raw: RealSmartListingRaw): NormalizedProperty {
  const title = raw.titolo?.trim() ?? "";
  const town = raw.localita?.comune?.trim() ?? "";
  const province = raw.localita?.provincia?.trim() ?? "";

  const contract = normalizeContract(raw.contratto);
  const status = normalizeStatus(raw.statoPubblicazione);

  const price = toNumber(raw.prezzo);
  const priceLabel = price > 0 ? priceFormatter.format(price) : "Prezzo su richiesta";

  const features = (raw.caratteristiche ?? [])
    .map((f) => f.trim())
    .filter((f) => f.length > 0);

  // Slug stabile: titolo + comune + codice (il codice garantisce univocità).
  const slug = slugify([title, town, raw.codice].filter(Boolean).join(" "));

  // Media → solo foto per la gallery del sito; ordinate e con alt sensato.
  const fallbackAlt = [title, town].filter(Boolean).join(" — ") || "Immobile Domus Tua";
  const sortedMedia = sortMedia(raw.media ?? []);
  const images: NormalizedImage[] = sortedMedia
    .filter((m) => m.tipo === undefined || m.tipo === "foto")
    .map((m) => toImage(m, fallbackAlt));

  const addressRaw = raw.localita?.indirizzo?.trim();

  // Override manuale approvato: è la fonte con priorità massima (vedi ./overrides.ts).
  const override = getListingOverride(raw.codice);

  // Descrizione: una sola normalizzazione, riusata da paragrafi, estratto ed estrazione fatti.
  // Se il cliente ci ha fornito un testo approvato, quello sostituisce integralmente il feed.
  const description = normalizeDescription(raw.descrizione);
  const paragraphs = override?.descrizione ?? description.paragraphs;

  // Fatti strutturati, in ordine di priorità: campo esplicito RealSmart > descrizione.
  // Gli override manuali approvati si innestano davanti a tutto in ./overrides.ts.
  const fieldFacts = factsFromFields({
    tipologia: raw.tipologia?.trim(),
    contratto: contract,
    mq: toNumber(raw.mq),
    locali: toNumber(raw.locali),
    camere: toNumber(raw.camere), // MAI dedotte da "locali - 1"
    bagni: toNumber(raw.bagni),
    piano: typeof raw.piano === "number" ? String(raw.piano) : raw.piano,
    classeEnergetica: raw.classeEnergetica,
    statoAttestatoEnergetico: raw.statoAttestatoEnergetico,
    dettagli: raw.dettagli,
  });
  const descriptionFacts = factsFromDescription(paragraphs);

  // override > campo RealSmart > descrizione; poi si tolgono le chiavi non pubblicabili.
  const facts = applyRemovals(
    mergeFacts(overrideFacts(override), fieldFacts, descriptionFacts.facts),
    override,
  );

  // I fatti pubblicati decidono quali righe telegrafiche possono uscire dal testo.
  const split = splitDescription(paragraphs, facts);

  return {
    id: raw.codice,
    slug,
    title: titleize(title),
    description: raw.descrizione?.trim() ?? "",
    // In pagina va la sola narrativa: le righe interamente tecniche vivono nei box.
    descriptionParagraphs: split.narrativeParagraphs,
    structuredFactLines: split.structuredFactLines.map((l) => l.line),
    keptFactLines: split.keptFactLines,
    contentPreservation: split.contentPreservation,
    excerpt: description.excerpt,
    price,
    priceLabel,
    contract,
    type: raw.tipologia?.trim() ?? "Immobile",
    town,
    province,
    address: addressRaw && addressRaw.length > 0 ? addressRaw : undefined,
    // Privacy-first: l'indirizzo civico si pubblica solo se un override lo autorizza.
    showAddress: override?.mostraIndirizzo === true,
    sqm: toNumber(raw.mq),
    rooms: toNumber(raw.locali),
    bedrooms: toNumber(raw.camere),
    baths: toNumber(raw.bagni),
    floor: typeof raw.piano === "number" ? String(raw.piano) : raw.piano?.trim() || undefined,
    energyClass: raw.classeEnergetica?.trim() || undefined,
    features,
    facts,
    factsReview: descriptionFacts.review,
    images,
    status,
    badges: raw.inEvidenza
      ? Array.from(new Set(["In evidenza", ...deriveBadges(status, features, contract)]))
      : deriveBadges(status, features, contract),
    publishedAt: raw.dataPubblicazione?.trim() ?? "",
    updatedAt: raw.dataAggiornamento?.trim() ?? "",
    sourceRef: {
      codice: raw.codice,
      riferimento: raw.riferimento?.trim() || undefined,
    },
  };
}
