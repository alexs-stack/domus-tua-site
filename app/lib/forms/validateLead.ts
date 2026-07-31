// Validazione + sanitizzazione del payload lead lato server (/api/lead).
//
// Obiettivo: rendere la cattura lead sicura e pulita prima di trasformarla in email.
//  • Whitelist dei campi: tutto ciò che non è previsto viene SCARTATO.
//  • Cap di lunghezza per campo: taglia payload abnormi (difesa da abuso), non rompe input reali.
//  • Caratteri di controllo rimossi; a capo ammessi SOLO nel messaggio libero — così un nome con
//    "\n" non può spezzare l'oggetto dell'email.
//  • Intento tra i quattro ammessi; nome e contatto obbligatori; consenso privacy OBBLIGATORIO.
//
// Il flusso WhatsApp lato client NON passa da qui: WhatsApp lo apre l'utente, non il server.
// Vedi docs/lead-email.md.

import type { LeadIntent } from "./lead";

const INTENTS: readonly LeadIntent[] = ["seller", "buyer", "question", "open-domus"];

// Cap massimi per campo (caratteri). Oltre → troncato (difensivo), mai errore.
const MAX = {
  name: 120,
  contact: 160,
  place: 160,
  propertyType: 120,
  budget: 80,
  features: 300,
  message: 1200,
  // metadata
  sourcePage: 200,
  propertySlug: 160,
  locale: 8,
} as const;

/** Lead validato e ripulito, pronto per la persistenza. Solo campi noti e nei limiti. */
export interface ValidatedLead {
  intent: LeadIntent;
  name: string;
  contact: string;
  place?: string;
  propertyType?: string;
  budget?: string;
  features?: string;
  message?: string;
  /** Sempre true: il consenso è obbligatorio, un lead senza consenso viene rifiutato. */
  consent: true;
  // ── metadata ammessi (contesto, non PII sensibile) ──
  sourcePage?: string;
  propertySlug?: string;
  locale?: string;
}

/** Errori "safe": stringhe stabili, nessun dettaglio interno esposto al client. */
export type LeadError =
  | "bad-payload"
  | "invalid-intent"
  | "missing-name"
  | "missing-contact"
  | "missing-consent";

export type LeadValidationResult =
  | { ok: true; lead: ValidatedLead }
  | { ok: false; error: LeadError };

/**
 * Estrae una stringa trimmata, ripulita e troncata al cap; undefined se assente/vuota.
 *
 * Ripulita = via i caratteri di controllo. Gli a capo restano solo dove hanno senso
 * (`multiline`, cioè il messaggio libero): altrove diventerebbero righe fantasma nell'email o,
 * nell'oggetto, un tentativo di spezzare l'intestazione.
 */
function str(v: unknown, max: number, multiline = false): string | undefined {
  if (typeof v !== "string") return undefined;
  const cleaned = multiline
    ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").replace(/\r\n?/g, "\n")
    : v.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s{2,}/g, " ");
  const trimmed = cleaned.trim();
  if (trimmed.length === 0) return undefined;
  return trimmed.slice(0, max);
}

/**
 * Valida e ripulisce un payload lead grezzo.
 * Non lancia mai: ritorna { ok:false, error } con un codice stabile.
 */
export function validateLead(input: unknown): LeadValidationResult {
  if (!input || typeof input !== "object") {
    return { ok: false, error: "bad-payload" };
  }
  const p = input as Record<string, unknown>;

  // Intento obbligatorio e tra quelli ammessi.
  if (typeof p.intent !== "string" || !INTENTS.includes(p.intent as LeadIntent)) {
    return { ok: false, error: "invalid-intent" };
  }
  const intent = p.intent as LeadIntent;

  // Nome e contatto obbligatori.
  const name = str(p.name, MAX.name);
  if (!name) return { ok: false, error: "missing-name" };
  const contact = str(p.contact, MAX.contact);
  if (!contact) return { ok: false, error: "missing-contact" };

  // Consenso privacy: OBBLIGATORIO. Prima era facoltativo lato server (lo imponeva solo il form
  // client): una POST diretta poteva quindi far partire un'email senza consenso registrato.
  if (p.consent !== true) return { ok: false, error: "missing-consent" };

  // Costruzione whitelist: solo campi noti, ognuno troncato al proprio cap.
  const lead: ValidatedLead = { intent, name, contact, consent: true };
  const place = str(p.place, MAX.place);
  if (place) lead.place = place;
  const propertyType = str(p.propertyType, MAX.propertyType);
  if (propertyType) lead.propertyType = propertyType;
  const budget = str(p.budget, MAX.budget);
  if (budget) lead.budget = budget;
  const features = str(p.features, MAX.features);
  if (features) lead.features = features;
  const message = str(p.message, MAX.message, true);
  if (message) lead.message = message;

  // Metadata ammessi (contesto): sourcePage, propertySlug, locale. Tutto il resto è scartato.
  const sourcePage = str(p.sourcePage, MAX.sourcePage);
  if (sourcePage) lead.sourcePage = sourcePage;
  // Accetta sia propertySlug (canonico) sia il vecchio propertyRef come alias.
  const propertySlug = str(p.propertySlug, MAX.propertySlug) ?? str(p.propertyRef, MAX.propertySlug);
  if (propertySlug) lead.propertySlug = propertySlug;
  const locale = str(p.locale, MAX.locale);
  if (locale) lead.locale = locale;

  return { ok: true, lead };
}
