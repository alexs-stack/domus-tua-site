// Notifica email del lead del form contatti verso l'agenzia.
//
// NON è un secondo canale email: RIUSA il trasporto Resend già integrato per
// l'assistente (app/lib/assistant/lead/send.ts) — stesso provider via HTTP
// diretto, stessa regola («si dichiara inviato solo con conferma del provider»),
// stessa configurazione d'ambiente (server-only, nessuna chiave in dev/test →
// il canale semplicemente non parte, senza fingere un invio).
//
// Qui c'è solo la COMPOSIZIONE: da lead validato a email leggibile. È una
// funzione pura, verificabile senza rete e senza chiavi.

import type { ValidatedLead } from "./validateLead";
import type { ComposedEmail } from "../assistant/lead/format";
import { sendLeadEmail, type SendResult } from "../assistant/lead/send";

const INTENT_LABEL: Record<ValidatedLead["intent"], string> = {
  seller: "Vuole vendere",
  buyer: "Cerca casa",
  question: "Ha una domanda",
  "open-domus": "Open Domus",
  career: "Candidatura",
};

/**
 * Compone l'email di notifica a partire da un lead già validato.
 * Pura e deterministica: nessun accesso a rete, ambiente o orologio.
 * Il tasto «Rispondi» scrive al cliente (reply-to = email, se lasciata).
 */
export function composeContactLeadEmail(lead: ValidatedLead): ComposedEmail {
  const righe: (string | null)[] = [
    `Richiesta dal sito — ${INTENT_LABEL[lead.intent]}`,
    "",
    `Nome: ${lead.name}`,
    lead.phone ? `Telefono: ${lead.phone}` : null,
    lead.email ? `Email: ${lead.email}` : null,
    // Solo per le candidature, che non hanno telefono/email distinti.
    !lead.phone && !lead.email && lead.contact ? `Contatto: ${lead.contact}` : null,
    lead.place ? `Zona/indirizzo: ${lead.place}` : null,
    lead.propertyType ? `Tipologia: ${lead.propertyType}` : null,
    lead.surface ? `Superficie: ${lead.surface} m²` : null,
    lead.budget ? `Budget: ${lead.budget}` : null,
    lead.features ? `Caratteristiche: ${lead.features}` : null,
    lead.timing ? `Tempistica: ${lead.timing}` : null,
    lead.message ? `\nMessaggio:\n${lead.message}` : null,
    lead.sourcePage ? `\nPagina di origine: ${lead.sourcePage}` : null,
    lead.propertySlug ? `Immobile: ${lead.propertySlug}` : null,
    "",
    "—",
    "Richiesta inviata dal form contatti del sito.",
    "Rispondendo a questa email scrivi direttamente al cliente.",
  ];

  return {
    subject: `Richiesta dal sito — ${lead.name}`,
    text: righe.filter((r) => r !== null).join("\n"),
    ...(lead.email ? { replyTo: lead.email } : {}),
  };
}

/**
 * Invia la notifica del lead, se il canale email è configurato.
 * Best-effort: senza chiave torna `non-configurato` (lo stato di oggi in
 * produzione) e non contatta nessun provider — nessuna consegna in produzione
 * finché la chiave non viene impostata di proposito. `fetchImpl` è iniettabile
 * per i test (trasporto deterministico, nessuna chiave reale).
 */
export function notifyLeadByEmail(
  lead: ValidatedLead,
  fetchImpl?: typeof fetch
): Promise<SendResult> {
  return sendLeadEmail(composeContactLeadEmail(lead), fetchImpl);
}
