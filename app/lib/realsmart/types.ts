// Tipi per l'integrazione RealSmart (gestionale immobiliare = single source of truth).
//
// Due "mondi" di dati:
//  1) *Raw*  → la forma grezza plausibile esposta da un gestionale (feed/API).
//              I nomi e i formati NON sono ancora confermati: vedi docs/realsmart-integration-notes.md.
//  2) *Normalized* → la forma pulita, tipizzata e stabile che il sito consuma.
//
// Nessuna chiamata reale qui: solo contratti di tipo. La mappatura vive in ./normalize.ts.

// ─────────────────────────────────────────────────────────────
// Stato di pubblicazione di un annuncio (union chiusa).
// ─────────────────────────────────────────────────────────────
export type ListingStatus =
  | "draft" // bozza, non pubblicabile
  | "published" // visibile e attivo
  | "reserved" // sotto proposta / opzionato
  | "sold" // venduto (o affittato) → di norma escluso o marcato
  | "withdrawn"; // ritirato / archiviato → escluso

// Tipo di contratto lato sito (normalizzato).
export type ContractType = "vendita" | "affitto";

// ─────────────────────────────────────────────────────────────
// RAW — forma grezza plausibile dal gestionale.
// I campi sono volutamente permissivi (opzionali / string|number) perché
// non conosciamo ancora il contratto reale del feed RealSmart.
// ─────────────────────────────────────────────────────────────

export interface RealSmartMedia {
  /** URL assoluto o relativo della risorsa (immagine, planimetria, tour). */
  url: string;
  /** Tipo di media come lo espone il gestionale. */
  tipo?: "foto" | "planimetria" | "video" | "virtual-tour" | string;
  /** Ordine di visualizzazione (crescente). Può mancare. */
  ordine?: number;
  /** Didascalia/alt eventuale. */
  didascalia?: string;
}

export interface RealSmartLocation {
  comune: string;
  provincia: string;
  /** Indirizzo civico completo, se pubblicabile. Spesso omesso per privacy. */
  indirizzo?: string;
  cap?: string;
  /** Zona/quartiere (es. "centro", "Abbiate Guazzone"). */
  zona?: string;
}

export interface RealSmartListingRaw {
  /** Codice interno univoco del gestionale (chiave primaria lato RealSmart). */
  codice: string;
  /** Riferimento commerciale mostrato all'utente (es. "RIF. 1043"). */
  riferimento?: string;
  titolo: string;
  descrizione?: string;
  /** Prezzo grezzo: può arrivare come numero o come stringa ("420000", "420.000"). */
  prezzo?: number | string;
  /** Tipologia libera dal gestionale (es. "Appartamento", "Attico", "Villa"). */
  tipologia?: string;
  /** Tipo di contratto grezzo. */
  contratto?: "vendita" | "affitto" | string;
  /** Localizzazione. */
  localita?: RealSmartLocation;
  /** Metri quadri commerciali. */
  mq?: number | string;
  /** Numero locali. */
  locali?: number | string;
  /** Numero bagni. */
  bagni?: number | string;
  /** Numero camere. */
  camere?: number | string;
  /** Piano (es. "2", "Attico", "Terra rialzato"). */
  piano?: number | string;
  /** Classe energetica (es. "A", "B", "G", "A4"). */
  classeEnergetica?: string;
  /** Dotazioni / features libere. */
  caratteristiche?: string[];
  /** Stato pubblicazione grezzo (default: published se assente). */
  statoPubblicazione?: ListingStatus | string;
  /** In evidenza (dal flag Evidenza del feed) → badge "In evidenza". */
  inEvidenza?: boolean;
  /** Media associati (foto, planimetrie, tour). */
  media?: RealSmartMedia[];
  /** Date in formato ISO 8601 se disponibili. */
  dataPubblicazione?: string;
  dataAggiornamento?: string;
}

// ─────────────────────────────────────────────────────────────
// NORMALIZED — forma pulita consumata dal sito.
// Allineata concettualmente al modello Property di app/lib/properties.ts,
// ma con tipi numerici e campi extra utili all'integrazione.
// ─────────────────────────────────────────────────────────────

export interface NormalizedImage {
  src: string;
  alt: string;
}

export interface NormalizedProperty {
  /** Identificativo stabile lato sito (deriva dal codice gestionale). */
  id: string;
  /** Slug URL-safe generato da titolo + comune + codice. */
  slug: string;
  title: string;
  description: string;
  /** Prezzo numerico (0 se non disponibile / su richiesta). */
  price: number;
  /** Prezzo formattato it-IT (es. "€ 420.000" o "Prezzo su richiesta"). */
  priceLabel: string;
  contract: ContractType;
  /** Tipologia normalizzata (stringa libera ma ripulita). */
  type: string;
  town: string;
  province: string;
  address?: string;
  /** Metri quadri (0 se ignoto). */
  sqm: number;
  /** Numero locali (0 se ignoto). */
  rooms: number;
  /** Numero camere da letto (0 se ignoto). */
  bedrooms: number;
  /** Numero bagni (0 se ignoto). */
  baths: number;
  floor?: string;
  energyClass?: string;
  features: string[];
  images: NormalizedImage[];
  status: ListingStatus;
  /** Badge editoriali derivati da status/features (es. "Venduto", "In esclusiva"). */
  badges: string[];
  /** Date ISO 8601 (stringa vuota se non fornite dal gestionale). */
  publishedAt: string;
  updatedAt: string;
  /** Riferimento alla sorgente per debug/tracciabilità. */
  sourceRef: {
    codice: string;
    riferimento?: string;
  };
}
