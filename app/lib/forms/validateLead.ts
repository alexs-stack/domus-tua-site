// Validazione + sanitizzazione del payload lead lato server (/api/lead).
//
// Obiettivo: rendere la cattura lead sicura e pulita prima di persistere sul Google Sheet.
//  • Whitelist dei campi: tutto ciò che non è previsto viene SCARTATO (no injection nel foglio).
//  • Cap di lunghezza per campo: taglia payload abnormi (difesa da abuso), non rompe input reali.
//  • Intento tra i quattro ammessi; nome e contatto obbligatori; consenso, se presente, = true.
//
// Il flusso WhatsApp lato client NON passa da qui e resta invariato: questa validazione riguarda
// solo il salvataggio server-side. Vedi docs/form-backend-next-step.md.

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
  consent?: boolean;
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

/** Estrae una stringa trimmata e troncata al cap; undefined se assente/vuota o non-stringa. */
function str(v: unknown, max: number): string | undefined {
  if (typeof v !== "string") return undefined;
  const trimmed = v.trim();
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

  // Consenso: se PRESENTE nel payload deve essere true. Se assente, ammesso (lo enforce il form).
  let consent: boolean | undefined;
  if ("consent" in p) {
    if (p.consent !== true) return { ok: false, error: "missing-consent" };
    consent = true;
  }

  // Costruzione whitelist: solo campi noti, ognuno troncato al proprio cap.
  const lead: ValidatedLead = { intent, name, contact };
  const place = str(p.place, MAX.place);
  if (place) lead.place = place;
  const propertyType = str(p.propertyType, MAX.propertyType);
  if (propertyType) lead.propertyType = propertyType;
  const budget = str(p.budget, MAX.budget);
  if (budget) lead.budget = budget;
  const features = str(p.features, MAX.features);
  if (features) lead.features = features;
  const message = str(p.message, MAX.message);
  if (message) lead.message = message;
  if (consent !== undefined) lead.consent = consent;

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
