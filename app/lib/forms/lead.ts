// Modello del lead, formattazione del messaggio WhatsApp e invio al backend.
//
// Stato: il lead viene (a) inviato a `/api/lead` che, se `SHEETS_WEBHOOK_URL` è
// configurato, lo salva su un Google Sheet (vedi docs/form-backend-next-step.md), e
// (b) precompilato in WhatsApp (formatLeadMessage + ./whatsapp.ts) come canale immediato.
// L'invio al backend è best-effort: se non configurato o fallisce, il WhatsApp funziona
// comunque. In futuro `/api/lead` può instradare anche verso email/CRM/RealSmart.

/**
 * Tre intenti chiari + Open Domus (allineati alle tab del form contatti) + le
 * candidature di /lavora-con-noi. `career` NON compare tra le tab del form
 * contatti: ha una pagina e un form suoi (CareerApplication), ma condivide
 * questo modello per non aprire un secondo canale di raccolta da mantenere.
 */
export type LeadIntent = "seller" | "buyer" | "question" | "open-domus" | "career";

/**
 * Un lead raccolto dal form contatti. `name` e `contact` sono sempre richiesti;
 * gli altri campi dipendono dall'intento (venditore / acquirente / domanda).
 */
export type Lead = {
  intent: LeadIntent;
  /** Nome e cognome. */
  name: string;
  /**
   * Canale di ricontatto combinato (telefono O email in un campo solo). Usato
   * OGGI solo dal form candidature (/lavora-con-noi, CareerApplication): il form
   * contatti lo ha sostituito con `phone`/`email` distinti. Resta qui per non
   * rompere quel flusso e per retro-compatibilità del backend.
   */
  contact?: string;
  /** Telefono (form contatti — canale separato da email). */
  phone?: string;
  /** Email (form contatti — canale separato da telefono). */
  email?: string;
  // ── Campi opzionali (dipendono dall'intento) ──────────────────────────────
  /** SELLER: comune/indirizzo dell'immobile. BUYER: zona desiderata. */
  place?: string;
  /** SELLER + BUYER: tipologia immobile (es. Trilocale, Villa…). */
  propertyType?: string;
  /** SELLER + BUYER: superficie indicativa in m² (numero, come stringa). */
  surface?: string;
  /** SELLER + BUYER: tempistica prevista (etichetta leggibile già tradotta). */
  timing?: string;
  /** BUYER: budget indicativo. */
  budget?: string;
  /** BUYER: caratteristiche desiderate (giardino, box, ascensore…). */
  features?: string;
  /** SELLER + QUESTION + CAREER: messaggio libero. */
  message?: string;
  // ── Campi candidatura (solo CAREER) ───────────────────────────────────────
  /** CAREER: area/ruolo per cui ci si candida (etichetta già leggibile). */
  role?: string;
  /** CAREER: esperienza dichiarata nel settore (fascia scelta dal candidato). */
  experience?: string;
  /** CAREER: link a LinkedIn, portfolio o CV online (il sito non riceve allegati). */
  portfolio?: string;
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
  career: "Candidatura",
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
      if (lead.surface) lines.push(`Superficie: ${lead.surface} m²`);
      if (lead.timing) lines.push(`Tempistica: ${lead.timing}`);
      break;
    }
    case "buyer": {
      lines.push("Sto cercando casa.");
      if (lead.place) lines.push(`Zona desiderata: ${lead.place}`);
      if (lead.propertyType) lines.push(`Tipologia: ${lead.propertyType}`);
      if (lead.surface) lines.push(`Superficie: ${lead.surface} m²`);
      if (lead.budget) lines.push(`Budget: ${lead.budget}`);
      if (lead.features) lines.push(`Caratteristiche: ${lead.features}`);
      if (lead.timing) lines.push(`Tempistica: ${lead.timing}`);
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
    case "career": {
      lines.push("Vorrei candidarmi per lavorare con voi.");
      if (lead.role) lines.push(`Area: ${lead.role}`);
      if (lead.experience) lines.push(`Esperienza: ${lead.experience}`);
      if (lead.portfolio) lines.push(`Profilo/CV: ${lead.portfolio}`);
      break;
    }
  }

  if (lead.message) lines.push("", lead.message.trim());

  // Recapiti: telefono ed email separati (form contatti); `contact` combinato è
  // il ripiego per il form candidature, che non li ha ancora distinti.
  const recapiti: string[] = [];
  if (lead.phone?.trim()) recapiti.push(`Telefono: ${lead.phone.trim()}`);
  if (lead.email?.trim()) recapiti.push(`Email: ${lead.email.trim()}`);
  if (recapiti.length === 0 && lead.contact?.trim()) {
    recapiti.push(`Contatto: ${lead.contact.trim()}`);
  }
  lines.push("", ...recapiti);

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
