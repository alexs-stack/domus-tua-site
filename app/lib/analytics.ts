// Misurazione — punto 07 della checklist ("Analytics, Search Console ed eventi di
// conversione attivi PRIMA del lancio, non dopo").
//
// PERCHÉ VERCEL ANALYTICS E NON GA4
// Non per gusto: per il consenso. GA4 è basato su cookie, quindi vive dietro il banner —
// e chi rifiuta sparisce dalle misure. Su un sito che il banner ce l'ha davvero e lo
// rispetta (app/lib/consent.ts), significa misurare solo la metà di traffico che accetta,
// cioè non sapere niente di preciso proprio nei primi giorni dopo la migrazione, che sono
// gli unici in cui i numeri servono davvero. Vercel Analytics non scrive cookie e non
// legge nulla dal dispositivo: misura tutti, senza chiedere niente.
//
// ⚠️ COSA QUESTO NON VUOL DIRE
// «Nessun cookie» risolve la regola sui cookie (ePrivacy: consenso per memorizzare o
// leggere informazioni sul dispositivo), NON tutto il GDPR. Il trattamento resta, e il
// fornitore va nominato nell'informativa privacy fra i responsabili. Quella riga la
// scrive il legale, non questo file: vedi docs/legal-launch-inventory.md.
//
// LA REGOLA DEGLI EVENTI
// Il documento di sintesi è esplicito: «Misurare le richieste, non l'estetica. Se dopo 60
// giorni i contatti non crescono, togliere animazioni, non aggiungerne». Le pagine viste
// le conta Vercel da sé; qui stanno SOLO le azioni che valgono un contatto. Ogni nome è
// una costante: un evento battuto a mano con una lettera diversa è un evento che non
// esiste, e te ne accorgi tre mesi dopo quando il grafico è vuoto.

import { track } from "@vercel/analytics";

/**
 * Le uniche conversioni che contano. Se un giorno se ne aggiunge una, si aggiunge QUI:
 * l'elenco è anche la documentazione di cosa il sito considera un risultato.
 *
 *  • `lead_valutazione`  → il proprietario ha inviato il modulo. È il fatturato.
 *  • `lead_whatsapp`     → ha aperto WhatsApp. È un contatto, con meno attrito e meno dati.
 *  • `lead_telefono`     → ha toccato il numero. Su mobile è una chiamata; su desktop no,
 *                          ed è il motivo per cui il punto di partenza viene registrato.
 */
export const CONVERSIONS = {
  valutazione: "lead_valutazione",
  whatsapp: "lead_whatsapp",
  telefono: "lead_telefono",
} as const;

export type ConversionName = (typeof CONVERSIONS)[keyof typeof CONVERSIONS];

/**
 * Da dove è partita l'azione. Serve a rispondere alla domanda che decide il lavoro
 * editoriale dei mesi successivi: quale blocco della pagina produce contatti e quale
 * occupa soltanto spazio.
 *
 * È un array e non un'unione scritta a mano perché serve anche a RUNTIME: SiteAnalytics
 * lo usa per validare gli attributi `data-conv-source` letti dal DOM. Con due elenchi
 * separati — il tipo qui e il Set là — bastava aggiungere una voce sola per avere un
 * attributo che TypeScript accetta e il listener scarta in silenzio.
 */
export const CONVERSION_SOURCES = [
  "hero",
  "header",
  "footer",
  "barra-mobile",
  "modulo",
  "assistente",
  "scheda-immobile",
  "fluttuante",
] as const;

export type ConversionSource = (typeof CONVERSION_SOURCES)[number];

/**
 * Registra una conversione.
 *
 * NIENTE DATI PERSONALI QUI DENTRO, mai: né nome, né email, né telefono, né indirizzo
 * dell'immobile. Le proprietà ammesse sono solo categorie (da dove, che tipo di richiesta),
 * cioè cose che descrivono il COMPORTAMENTO e non la persona. Il contenuto del lead viaggia
 * sul suo canale (app/api/lead), che è l'unico posto autorizzato a vederlo.
 *
 * Non lancia mai: se lo script non è caricato — anteprima locale, blocco da parte di un
 * ad-blocker, rete assente — `track` è una funzione vuota. Una misura mancata non deve
 * impedire un contatto.
 */
export function trackConversion(
  name: ConversionName,
  source: ConversionSource,
  extra?: { intent?: string }
): void {
  try {
    track(name, { source, ...(extra?.intent ? { intent: extra.intent } : {}) });
  } catch {
    // Volutamente silenzioso: vedi sopra.
  }
}
