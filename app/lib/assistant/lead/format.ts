// Composizione dell'email che arriva all'agenzia.
//
// Deve essere leggibile in due secondi da chi la apre sul telefono: chi scrive, come
// richiamarlo, cosa vuole. Niente HTML dal modello, niente conversazione allegata.

import { SITE_URL } from "../config";
import type { Lead } from "./validate";

export interface ComposedEmail {
  subject: string;
  text: string;
  /** Indirizzo a cui risponde il tasto "Rispondi". Presente solo se il cliente ha lasciato una email. */
  replyTo?: string;
}

/** Titolo dell'immobile di interesse, quando lo slug corrisponde a un immobile reale. */
export interface ListingContext {
  slug: string;
  title: string;
  zone: string;
  price: string;
}

export function composeLeadEmail(lead: Lead, listing?: ListingContext): ComposedEmail {
  const subject = listing
    ? `Richiesta dal sito — ${listing.title}`
    : `Richiesta dal sito — ${lead.nome}`;

  const righe = [
    `Nome: ${lead.nome}`,
    lead.email ? `Email: ${lead.email}` : null,
    lead.telefono ? `Telefono: ${lead.telefono}` : null,
    "",
    "Messaggio:",
    lead.messaggio,
  ];

  if (listing) {
    righe.push(
      "",
      "Immobile di interesse:",
      `${listing.title} — ${listing.zone} — ${listing.price}`,
      `${SITE_URL}/case/${listing.slug}`,
    );
  }

  if (lead.pagePath) {
    righe.push("", `Pagina di origine: ${SITE_URL}${lead.pagePath}`);
  }

  righe.push(
    "",
    "—",
    "Richiesta inviata dall'assistente del sito. La conversazione non viene conservata.",
    "Rispondendo a questa email scrivi direttamente al cliente.",
  );

  return {
    subject,
    text: righe.filter((r) => r !== null).join("\n"),
    replyTo: lead.email,
  };
}
