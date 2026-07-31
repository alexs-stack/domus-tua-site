// WhatsApp — costruzione dei link precompilati. Modulo PURO (nessun side effect, nessun `window`).
//
// WhatsApp è un canale che l'UTENTE apre: qui si prepara solo il link. Nessuna funzione di questo
// modulo invia niente, e nessuna schermata deve dire "messaggio inviato" dopo un click su
// WhatsApp — al massimo "stiamo aprendo WhatsApp". L'unico invio vero è l'email (forms/email.ts).

import { site, siteUrl } from "../site";
import { formatLeadMessage, type Lead, type LeadIntent } from "./lead";

/**
 * Restituisce `baseHref` con il parametro `text` impostato a `message`
 * (correttamente URL-encoded). Se un `?text=` è già presente viene sostituito,
 * altrimenti viene aggiunto. Gli altri eventuali parametri di query restano intatti.
 *
 * @param baseHref URL WhatsApp di partenza (es. `site.whatsapp.href`).
 * @param message  Testo del messaggio in chiaro (verrà codificato con encodeURIComponent).
 */
export function buildWhatsAppUrl(baseHref: string, message: string): string {
  const encoded = encodeURIComponent(message);

  // Separiamo l'eventuale fragment (#...) per non corromperlo.
  const hashIndex = baseHref.indexOf("#");
  const hash = hashIndex >= 0 ? baseHref.slice(hashIndex) : "";
  const withoutHash = hashIndex >= 0 ? baseHref.slice(0, hashIndex) : baseHref;

  const queryIndex = withoutHash.indexOf("?");
  const path = queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash;
  const query = queryIndex >= 0 ? withoutHash.slice(queryIndex + 1) : "";

  // Ricostruiamo i parametri escludendo un eventuale `text` preesistente.
  const params = query
    .split("&")
    .filter((pair) => pair.length > 0 && !/^text=/i.test(pair));

  params.push(`text=${encoded}`);

  return `${path}?${params.join("&")}${hash}`;
}

/** URL pubblico della scheda immobile: l'agenzia deve poter aprire l'annuncio dal messaggio. */
export function listingUrl(slug: string): string {
  return `${siteUrl}/case/${slug}`;
}

export type ListingRef = {
  slug: string;
  title: string;
  /** Riferimento commerciale del gestionale, se il feed lo espone. */
  ref?: string;
};

/**
 * Messaggio per la scheda immobile: titolo, riferimento (se c'è) e URL della scheda.
 * Senza l'URL l'agenzia deve indovinare di quale annuncio si parla.
 */
export function listingWhatsAppMessage(listing: ListingRef): string {
  const rif = listing.ref ? ` (rif. ${listing.ref})` : "";
  return [
    `Ciao Domus Tua, sono interessato/a a "${listing.title}"${rif}.`,
    "Vorrei più informazioni o una visita.",
    listingUrl(listing.slug),
  ].join("\n");
}

/** Messaggio per un immobile risultato venduto: cerco qualcosa di simile. */
export function soldListingWhatsAppMessage(listing: ListingRef): string {
  return [
    `Ciao Domus Tua, "${listing.title}" risulta venduto: sto cercando una casa simile, potete aiutarmi?`,
    listingUrl(listing.slug),
  ].join("\n");
}

/** Etichette del tipo di richiesta, incluse nei messaggi dei form generali. */
const INTENT_LABEL: Record<LeadIntent, string> = {
  seller: "Vuole vendere",
  buyer: "Cerca casa",
  question: "Ha una domanda",
  "open-domus": "Open Domus",
};

/**
 * Messaggio dell'acquirente dalla ricerca (anche a zero risultati): porta sempre il tipo di
 * richiesta, così l'agenzia sa da subito con chi sta parlando.
 */
export function buyerSearchWhatsAppMessage(query?: string): string {
  const searched = query?.trim() ? ` — ho cercato: "${query.trim()}"` : "";
  return [
    `Ciao Domus Tua, sto cercando casa${searched}.`,
    "Non l'ho ancora trovata sul sito, potete aiutarmi?",
    `(Richiesta dal sito · ${INTENT_LABEL.buyer})`,
  ].join("\n");
}

/** Link WhatsApp per un lead completo del form (usato come ripiego se l'email non parte). */
export function leadWhatsAppUrl(lead: Lead): string {
  return buildWhatsAppUrl(site.whatsapp.href, formatLeadMessage(lead));
}

/** Link WhatsApp per una scheda immobile. */
export function listingWhatsAppUrl(listing: ListingRef): string {
  return buildWhatsAppUrl(site.whatsapp.href, listingWhatsAppMessage(listing));
}

/** Link WhatsApp per una scheda venduta. */
export function soldListingWhatsAppUrl(listing: ListingRef): string {
  return buildWhatsAppUrl(site.whatsapp.href, soldListingWhatsAppMessage(listing));
}

/** Link WhatsApp per l'acquirente dalla ricerca. */
export function buyerSearchWhatsAppUrl(query?: string): string {
  return buildWhatsAppUrl(site.whatsapp.href, buyerSearchWhatsAppMessage(query));
}
