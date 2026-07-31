// Invio dei lead via EMAIL — unico backend del form contatti.
//
// ⚠️ SERVER-ONLY. Legge `RESEND_API_KEY` e `LEAD_FROM_EMAIL`, che NON sono `NEXT_PUBLIC_*` e non
//    devono mai finire nel bundle del browser. Importare questo modulo solo da route handler o
//    Server Components — mai da un componente "use client".
//
// Nessuna persistenza: il lead diventa un'email e basta. Niente database, niente foglio di
// calcolo, niente gestionale esterno. Se l'email non parte, il sito lo dice e offre WhatsApp e
// telefono: non finge mai di aver inviato la richiesta.
//
// Corpo dell'email in TESTO SEMPLICE, di proposito: il contenuto arriva da un form pubblico e in
// testo semplice non esiste superficie di injection (né HTML né link attivi costruiti dall'utente).

import { Resend } from "resend";
import { site, siteUrl } from "../site";
import type { ValidatedLead } from "./validateLead";
import type { LeadIntent } from "./lead";

/** Destinatario di default dei lead: la casella indicata dal cliente. */
export const DEFAULT_LEAD_RECIPIENT = "immobiliare@domustua.it";

/** Etichette dell'intento, in italiano: l'email la legge l'agenzia. */
const INTENT_LABEL: Record<LeadIntent, string> = {
  seller: "Vuole vendere",
  buyer: "Cerca casa",
  question: "Ha una domanda",
  "open-domus": "Open Domus",
};

export interface EmailLeadConfig {
  /** Chiave del provider (server-only). Assente = invio email non configurato. */
  apiKey?: string;
  /** Mittente verificato sul dominio Resend (server-only). */
  from?: string;
  /** Destinatario: LEAD_TO_EMAIL, altrimenti la casella di default. */
  to: string;
}

function readEnv(name: string): string | undefined {
  const raw = process.env[name];
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** Configurazione corrente. Non lancia mai: l'assenza di chiavi è uno stato, non un errore. */
export function getEmailLeadConfig(): EmailLeadConfig {
  return {
    apiKey: readEnv("RESEND_API_KEY"),
    from: readEnv("LEAD_FROM_EMAIL"),
    to: readEnv("LEAD_TO_EMAIL") ?? DEFAULT_LEAD_RECIPIENT,
  };
}

/** true se il provider può davvero spedire (chiave + mittente verificato). */
export function isEmailLeadConfigured(): boolean {
  const c = getEmailLeadConfig();
  return !!c.apiKey && !!c.from;
}

/** true se il destinatario è valorizzato (lo è sempre: c'è un default esplicito). */
export function isLeadRecipientConfigured(): boolean {
  return getEmailLeadConfig().to.length > 0;
}

export type SendLeadResult =
  | { ok: true; id: string }
  | { ok: false; reason: "not-configured" | "provider-error" };

/**
 * Estrae un'email dal campo `contact` (che accetta "telefono o email").
 * Serve solo per il Reply-To: se l'utente ha lasciato un telefono, il Reply-To non si imposta.
 */
export function replyToFrom(contact: string): string | undefined {
  const match = contact.match(/[^\s<>@,;]+@[^\s<>@,;]+\.[A-Za-z]{2,}/);
  return match ? match[0] : undefined;
}

/** Data e ora dell'invio, fuso di Tradate. */
function formatNow(now: Date): string {
  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Europe/Rome",
  }).format(now);
}

/**
 * Corpo dell'email. Include SOLO i campi valorizzati: nessuna riga "non fornito", nessun
 * segnaposto — chi legge deve poter distinguere "non l'ha scritto" da "ha scritto vuoto".
 */
export function formatLeadEmail(
  lead: ValidatedLead,
  now: Date,
): { subject: string; text: string } {
  const label = INTENT_LABEL[lead.intent];
  const subject = `Richiesta dal sito · ${label} · ${lead.name}`;

  const lines: string[] = [
    `Tipo di richiesta: ${label}`,
    `Nome: ${lead.name}`,
    `Contatto: ${lead.contact}`,
  ];

  if (lead.place) lines.push(`Zona / comune: ${lead.place}`);
  if (lead.propertyType) lines.push(`Tipologia: ${lead.propertyType}`);
  if (lead.budget) lines.push(`Budget: ${lead.budget}`);
  if (lead.features) lines.push(`Caratteristiche: ${lead.features}`);
  if (lead.propertySlug) {
    lines.push(`Immobile: ${lead.propertySlug}`);
    lines.push(`Scheda: ${siteUrl}/case/${lead.propertySlug}`);
  }
  if (lead.message) {
    lines.push("", "Messaggio:", lead.message);
  }

  lines.push("", "—");
  if (lead.sourcePage) lines.push(`Pagina di origine: ${siteUrl}${lead.sourcePage}`);
  lines.push(`Data e ora: ${formatNow(now)}`);
  lines.push(`Consenso privacy: accettato (${siteUrl}/privacy)`);
  lines.push(`Inviato dal sito ${site.name}.`);

  return { subject, text: lines.join("\n") };
}

/**
 * Spedisce il lead. Non lancia mai: l'esito torna come risultato, così il chiamante può dire la
 * verità all'utente (successo solo se il provider ha davvero accettato l'email).
 */
export async function sendLeadEmail(
  lead: ValidatedLead,
  now: Date = new Date(),
): Promise<SendLeadResult> {
  const config = getEmailLeadConfig();
  if (!config.apiKey || !config.from) return { ok: false, reason: "not-configured" };

  const { subject, text } = formatLeadEmail(lead, now);
  const replyTo = replyToFrom(lead.contact);

  try {
    const resend = new Resend(config.apiKey);
    const { data, error } = await resend.emails.send({
      from: config.from,
      to: config.to,
      subject,
      text,
      ...(replyTo ? { replyTo } : {}),
    });
    if (error || !data?.id) {
      // Mai il contenuto del lead nei log: solo il motivo tecnico del provider.
      console.error("[lead] invio email fallito:", error?.message ?? "risposta senza id");
      return { ok: false, reason: "provider-error" };
    }
    return { ok: true, id: data.id };
  } catch (err) {
    console.error("[lead] provider email non raggiungibile:", err instanceof Error ? err.message : err);
    return { ok: false, reason: "provider-error" };
  }
}
