// Validazione + sanitizzazione del payload lead lato server (/api/lead).
//
// Obiettivo: rendere la cattura lead sicura e pulita prima di persistere sul Google Sheet.
//  • Whitelist dei campi: tutto ciò che non è previsto viene SCARTATO (no injection nel foglio).
//  • Cap di lunghezza per campo: taglia payload abnormi (difesa da abuso), non rompe input reali.
//  • Intento tra quelli ammessi; nome e contatto obbligatori; consenso privacy OBBLIGATORIO
//    (= true, senza coercizioni): il form lo richiede a schermo, ma il confine di sicurezza è
//    qui — una POST diretta che salta il form non deve poter aggirare l'informativa.
//
// Il flusso WhatsApp lato client NON passa da qui e resta invariato: questa validazione riguarda
// solo il salvataggio server-side. Vedi docs/form-backend-next-step.md.

import type { LeadIntent } from "./lead";
import { isEmailFormat, isPhoneFormat, CONTACT_MAX } from "./contactChannel";

const INTENTS: readonly LeadIntent[] = ["seller", "buyer", "question", "open-domus", "career"];

// Cap massimi per campo (caratteri). Oltre → troncato (difensivo), mai errore.
const MAX = {
  name: 120,
  contact: 160,
  phone: CONTACT_MAX.phone,
  email: CONTACT_MAX.email,
  place: 160,
  propertyType: 120,
  surface: 12,
  timing: 80,
  budget: 80,
  features: 300,
  message: 1200,
  // candidature (/lavora-con-noi)
  role: 120,
  experience: 80,
  portfolio: 300,
  // metadata
  sourcePage: 200,
  propertySlug: 160,
  locale: 8,
} as const;

// Il formato di email e telefono vive in ./contactChannel.ts, condiviso col
// form (client): la regola dev'essere la stessa da entrambi i lati.

/** Lead validato e ripulito, pronto per la persistenza. Solo campi noti e nei limiti. */
export interface ValidatedLead {
  intent: LeadIntent;
  name: string;
  /** Recapito combinato (solo candidature, ripiego di retro-compatibilità). */
  contact?: string;
  phone?: string;
  email?: string;
  place?: string;
  propertyType?: string;
  surface?: string;
  timing?: string;
  budget?: string;
  features?: string;
  message?: string;
  role?: string;
  experience?: string;
  portfolio?: string;
  /** Sempre `true`: un lead validato porta con sé il consenso affermativo. Vedi validateLead. */
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
  | "invalid-email"
  | "invalid-phone"
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

/** Solo cifre e separatori tipografici: taglia lettere/simboli dalla superficie. */
function digits(v: string, max: number): string | undefined {
  const only = v.replace(/[^\d]/g, "").slice(0, max);
  return only.length ? only : undefined;
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

  // Nome obbligatorio.
  const name = str(p.name, MAX.name);
  if (!name) return { ok: false, error: "missing-name" };

  // Recapiti: telefono ed email distinti (form contatti), più `contact`
  // combinato (candidature). Se presenti vengono validati nel FORMATO; ne serve
  // ALMENO UNO, o la richiesta non è ricontattabile.
  const phoneRaw = str(p.phone, MAX.phone);
  if (phoneRaw && !isPhoneFormat(phoneRaw)) return { ok: false, error: "invalid-phone" };
  const emailRaw = str(p.email, MAX.email);
  if (emailRaw && !isEmailFormat(emailRaw)) return { ok: false, error: "invalid-email" };
  const contact = str(p.contact, MAX.contact);
  if (!phoneRaw && !emailRaw && !contact) {
    return { ok: false, error: "missing-contact" };
  }

  // Consenso privacy: OBBLIGATORIO e deve valere ESATTAMENTE `true`.
  //
  // Il server è il confine di sicurezza, non il form: la UI richiede la spunta, ma una POST
  // diretta a /api/lead che salti il browser aggirerebbe l'informativa se ci accontentassimo
  // di "consenso assente = ammesso". Un campo mancante viene quindi rifiutato esattamente come
  // `false`. Nessuna coercizione: né la stringa "true", né valori truthy (1, "on") passano —
  // solo il booleano `true`. Ogni intento gestito qui è una raccolta di dati personali che per
  // legge richiede il consenso; non esistono chiamate lead/interne che debbano saltarlo (i bot
  // vengono già fermati prima, dall'honeypot in /api/lead).
  if (p.consent !== true) return { ok: false, error: "missing-consent" };

  // Costruzione whitelist: solo campi noti, ognuno troncato al proprio cap.
  const lead: ValidatedLead = { intent, name, consent: true };
  if (phoneRaw) lead.phone = phoneRaw;
  if (emailRaw) lead.email = emailRaw;
  if (contact) lead.contact = contact;
  const place = str(p.place, MAX.place);
  if (place) lead.place = place;
  const propertyType = str(p.propertyType, MAX.propertyType);
  if (propertyType) lead.propertyType = propertyType;
  // Superficie: solo il numero (i m² li mette la presentazione). "120 m²" → "120".
  const surface = str(p.surface, MAX.surface);
  if (surface) {
    const n = digits(surface, MAX.surface);
    if (n) lead.surface = n;
  }
  const timing = str(p.timing, MAX.timing);
  if (timing) lead.timing = timing;
  const budget = str(p.budget, MAX.budget);
  if (budget) lead.budget = budget;
  const features = str(p.features, MAX.features);
  if (features) lead.features = features;
  const message = str(p.message, MAX.message);
  if (message) lead.message = message;
  // Candidature: valorizzati solo dal form di /lavora-con-noi, scartati altrove
  // come qualunque altro campo non previsto.
  const role = str(p.role, MAX.role);
  if (role) lead.role = role;
  const experience = str(p.experience, MAX.experience);
  if (experience) lead.experience = experience;
  const portfolio = str(p.portfolio, MAX.portfolio);
  if (portfolio) lead.portfolio = portfolio;

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
