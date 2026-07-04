// Modello del lead, formattazione del messaggio WhatsApp e invio al backend.
//
// Stato: il lead viene (a) inviato a `/api/lead` che, se `SHEETS_WEBHOOK_URL` è
// configurato, lo salva su un Google Sheet (vedi docs/form-backend-next-step.md), e
// (b) precompilato in WhatsApp (formatLeadMessage + ./whatsapp.ts) come canale immediato.
// L'invio al backend è best-effort: se non configurato o fallisce, il WhatsApp funziona
// comunque. In futuro `/api/lead` può instradare anche verso email/CRM/RealSmart.

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
  // ── Contesto (riservato al futuro backend, oggi non usato) ─────────────────
  /** Pagina di origine del lead (es. "/vendi", "/case/<slug>"). */
  sourcePage?: string;
  /** Riferimento immobile se il lead parte da una scheda. */
  propertyRef?: string;
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

  const context = [
    lead.propertyRef ? `immobile ${lead.propertyRef}` : null,
    lead.sourcePage ? `da ${lead.sourcePage}` : null,
  ].filter(Boolean);
  const source = context.length > 0 ? ` · ${context.join(" · ")}` : "";
  lines.push(`(Richiesta dal sito · ${INTENT_LABEL[lead.intent]}${source})`);

  return lines.join("\n");
}

/**
 * Invia il lead al backend (`/api/lead` → Google Sheet se configurato). Best-effort:
 * non lancia mai — in caso di errore/backend non configurato ritorna { ok: false } e il
 * chiamante prosegue col fallback WhatsApp. Da usare lato client nel form contatti.
 */
export async function submitLead(lead: Lead): Promise<{ ok: boolean }> {
  try {
    const res = await fetch("/api/lead", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(lead),
    });
    const data = (await res.json().catch(() => ({ ok: false }))) as { ok?: boolean };
    return { ok: !!data.ok };
  } catch {
    return { ok: false };
  }
}
