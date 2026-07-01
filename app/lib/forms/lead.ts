// Modello del lead e formattazione del messaggio WhatsApp.
//
// Stato attuale (MVP): il lead NON viene salvato da nessuna parte. `formatLeadMessage`
// costruisce solo il testo che viene precompilato in WhatsApp (vedi ./whatsapp.ts).
//
// TODO (backend lead — vedi docs/form-backend-next-step.md):
//   Quando si aggiunge una destinazione server (email transazionale, Google Sheets,
//   Supabase o CRM/RealSmart), questo stesso oggetto `Lead` è il payload da inviare.
//   Aggiungere allora i campi di contesto (`sourcePage`, `propertyRef`, `consent`,
//   `createdAt`) e una funzione `submitLead(lead): Promise<...>` accanto a questo file,
//   mantenendo `formatLeadMessage` per il canale WhatsApp.

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
