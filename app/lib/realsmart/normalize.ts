// Normalizzazione: da RealSmartListingRaw (forma grezza gestionale) a NormalizedProperty
// (forma pulita usata dal sito). Funzione PURA e difensiva: nessun side effect, nessuna
// eccezione su campi mancanti. Se il feed reale userà nomi diversi, si adatta qui la mappatura.

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

  return {
    id: raw.codice,
    slug,
    title,
    description: raw.descrizione?.trim() ?? "",
    price,
    priceLabel,
    contract,
    type: raw.tipologia?.trim() ?? "Immobile",
    town,
    province,
    address: addressRaw && addressRaw.length > 0 ? addressRaw : undefined,
    sqm: toNumber(raw.mq),
    rooms: toNumber(raw.locali),
    bedrooms: toNumber(raw.camere),
    baths: toNumber(raw.bagni),
    floor: typeof raw.piano === "number" ? String(raw.piano) : raw.piano?.trim() || undefined,
    energyClass: raw.classeEnergetica?.trim() || undefined,
    features,
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
