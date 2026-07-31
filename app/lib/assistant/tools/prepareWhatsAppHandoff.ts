// Tool 4 — prepare_whatsapp_handoff: prepara un link WhatsApp precompilato.
//
// PREPARA, non invia. Nessun messaggio parte da qui: l'utente deve aprire WhatsApp e
// premere invio. Il tool result lo dice esplicitamente al modello, così non può
// affermare "ho inviato il messaggio".

import { tool } from "ai";
import { z } from "zod";
import { buildWhatsAppUrl } from "../../forms/whatsapp";
import { SITE_URL, WHATSAPP_NUMBER } from "../config";
import type { ToolContext } from "./context";

const inputSchema = z.object({
  motivo: z
    .string()
    .min(1)
    .max(200)
    .describe("Perché l'utente vuole essere ricontattato, in una frase (es. 'vorrei vendere casa')."),
  slugImmobile: z
    .string()
    .max(160)
    .optional()
    .describe("Slug dell'immobile di interesse, se la richiesta ne riguarda uno."),
  preferenze: z
    .string()
    .max(200)
    .optional()
    .describe("Preferenze di ricerca già emerse (zona, budget, tipologia), se pertinenti."),
});

export type WhatsAppHandoffResult = {
  esito: "pronto";
  inviato: false;
  messaggio: string;
  nota: string;
};

const BASE_HREF = `https://wa.me/${WHATSAPP_NUMBER}`;

export function createPrepareWhatsAppHandoff(ctx: ToolContext) {
  return tool({
    description:
      "Prepara un messaggio WhatsApp già scritto verso l'agenzia, che l'utente potrà aprire e inviare. Usalo quando l'utente vuole parlare con una persona. NON invia nulla: il messaggio parte solo se lo manda l'utente.",
    inputSchema,
    execute: async ({ motivo, slugImmobile, preferenze }): Promise<WhatsAppHandoffResult> => {
      const lines = ["Ciao Domus Tua,"];

      // L'immobile entra nel messaggio solo se esiste davvero nel catalogo live:
      // impedisce che un immobile inventato (dal modello o dall'utente) finisca in WhatsApp.
      const property = slugImmobile
        ? ctx.listings.properties.find((p) => p.slug === slugImmobile)
        : undefined;

      if (property) {
        lines.push(`sono interessato a "${property.title}" (${property.zone}, ${property.price}).`);
        lines.push(`Scheda: ${SITE_URL}/case/${property.slug}`);
      } else {
        lines.push(`${motivo.trim()}`);
      }

      if (preferenze?.trim()) lines.push(`Preferenze: ${preferenze.trim()}.`);
      lines.push("Potete ricontattarmi? Grazie.");

      const messaggio = lines.join("\n");

      ctx.emit({
        type: "handoff",
        value: {
          kind: "whatsapp",
          url: buildWhatsAppUrl(BASE_HREF, messaggio),
          message: messaggio,
          label: "Scrivi su WhatsApp",
        },
      });

      return {
        esito: "pronto",
        inviato: false,
        messaggio,
        nota: "Il pulsante WhatsApp è già comparso sotto la tua risposta, con il messaggio precompilato. Invita l'utente a premerlo. NON dire che il messaggio è stato inviato: lo invia l'utente.",
      };
    },
  });
}
