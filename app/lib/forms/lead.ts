// Modello del lead, formattazione del messaggio WhatsApp e invio al backend.
//
// Backend UNICO: `POST /api/lead` → email a immobiliare@domustua.it (vedi ./email.ts).
// Nessuna persistenza, nessun foglio di calcolo, nessun gestionale esterno.
//
// WhatsApp e telefono restano canali paralleli, aperti dall'utente: non sono un fallback
// silenzioso dell'email. Se l'email non parte, il form lo dice e mostra quei due canali —
// non dichiara mai una richiesta inviata quando non lo è.

import { siteUrl } from "../site";

/** Tre intenti chiari + Open Domus (allineati alle tab del form). */
export type LeadIntent = "seller" | "buyer" | "question" | "open-domus";

/**
 * Un lead raccolto dal form contatti. `name` e `contact` sono sempre richiesti;
 * gli altri campi dipendono dall'intento (venditore / acquirente / domanda).
 */
export type Lead = {
  intent: LeadIntent;
  /** Nome e cognome. */
  name: string;
  /** Telefono o email (canale di ricontatto). */
  contact: string;
  // ── Campi opzionali (dipendono dall'intento) ──────────────────────────────
  /** SELLER: comune/indirizzo dell'immobile. BUYER: zona desiderata. */
  place?: string;
  /** SELLER + BUYER: tipologia immobile (es. Trilocale, Villa…). */
  propertyType?: string;
  /** BUYER: budget indicativo. */
  budget?: string;
  /** BUYER: caratteristiche desiderate (giardino, box, ascensore…). */
  features?: string;
  /** SELLER + QUESTION: messaggio libero. */
  message?: string;
  // ── Consenso privacy (obbligatorio quando il lead viene SALVATO su server) ──
  /** true se l'utente ha spuntato il consenso al trattamento (link all'informativa). */
  consent?: boolean;
  // ── Contesto incluso nell'email all'agenzia ────────────────────────────────
  /** Pagina di origine del lead (es. "/vendi", "/case/<slug>"). */
  sourcePage?: string;
  /** Slug della scheda immobile, se il lead parte da un annuncio. */
  propertySlug?: string;
};

/** Etichette leggibili dell'intento per il messaggio WhatsApp (in italiano, per l'agenzia). */
const INTENT_LABEL: Record<LeadIntent, string> = {
  seller: "Vuole vendere",
  buyer: "Cerca casa",
  question: "Ha una domanda",
  "open-domus": "Open Domus",
};

/**
 * Costruisce il testo del messaggio WhatsApp a partire dal lead.
 * Funzione PURA: solo stringa in ingresso e in uscita, nessun side effect.
 * Le righe opzionali vengono incluse solo se valorizzate.
 */
export function formatLeadMessage(lead: Lead): string {
  const lines: string[] = [`Ciao Domus Tua, sono ${lead.name.trim()}.`];

  switch (lead.intent) {
    case "seller": {
      lines.push("Vorrei vendere un immobile.");
      if (lead.place) lines.push(`Immobile a: ${lead.place}`);
      if (lead.propertyType) lines.push(`Tipologia: ${lead.propertyType}`);
      break;
    }
    case "buyer": {
      lines.push("Sto cercando casa.");
      if (lead.place) lines.push(`Zona desiderata: ${lead.place}`);
      if (lead.propertyType) lines.push(`Tipologia: ${lead.propertyType}`);
      if (lead.budget) lines.push(`Budget: ${lead.budget}`);
      if (lead.features) lines.push(`Caratteristiche: ${lead.features}`);
      break;
    }
    case "open-domus": {
      lines.push("Vorrei informazioni su Open Domus.");
      if (lead.place) lines.push(`Zona: ${lead.place}`);
      break;
    }
    case "question": {
      lines.push("Ho una domanda.");
      break;
    }
  }

  if (lead.message) lines.push("", lead.message.trim());

  lines.push("", `Contatto: ${lead.contact.trim()}`);

  lines.push(`(Richiesta dal sito · ${INTENT_LABEL[lead.intent]})`);
  // L'immobile va come URL completo: dal messaggio l'agenzia apre subito la scheda giusta.
  if (lead.propertySlug) lines.push(`${siteUrl}/case/${lead.propertySlug}`);
  else if (lead.sourcePage) lines.push(`${siteUrl}${lead.sourcePage}`);

  return lines.join("\n");
}

/** Motivo del mancato invio, per scegliere il messaggio da mostrare all'utente. */
export type LeadFailureReason =
  | "invalid" // il server ha rifiutato il payload (validazione)
  | "rate-limited" // troppe richieste dallo stesso IP
  | "not-configured" // provider email non configurato su questo ambiente
  | "provider-error" // il provider ha rifiutato o non risponde
  | "network"; // la richiesta non è nemmeno partita

export type SubmitLeadResult = { ok: true } | { ok: false; reason: LeadFailureReason };

/**
 * Invia il lead a `/api/lead`.
 *
 * Non lancia mai, ma NON è best-effort: `ok: true` significa che il provider email ha davvero
 * accettato il messaggio. Il chiamante deve mostrare la conferma solo in quel caso; in tutti
 * gli altri deve offrire WhatsApp e telefono e dire che la richiesta non è partita.
 */
export async function submitLead(lead: Lead): Promise<SubmitLeadResult> {
  let res: Response;
  try {
    res = await fetch("/api/lead", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(lead),
    });
  } catch {
    return { ok: false, reason: "network" };
  }

  const data = (await res.json().catch(() => null)) as
    | { ok?: boolean; reason?: string }
    | null;

  if (res.ok && data?.ok === true) return { ok: true };

  const reason = data?.reason;
  if (reason === "rate-limited") return { ok: false, reason: "rate-limited" };
  if (reason === "not-configured") return { ok: false, reason: "not-configured" };
  if (reason === "provider-error") return { ok: false, reason: "provider-error" };
  if (res.status === 400) return { ok: false, reason: "invalid" };
  return { ok: false, reason: "provider-error" };
}
