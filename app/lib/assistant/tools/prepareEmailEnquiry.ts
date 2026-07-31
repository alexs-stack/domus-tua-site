// Tool 5 — prepare_email_enquiry: prepara i dati della richiesta via email.
//
// PREPARA, non invia. Apre in chat il mini-form che l'utente compila e conferma.
// L'invio vero (server-side, verso immobiliare@domustua.it) arriva nell'onda 5:
// finché non c'è, il tool NON deve far credere che qualcosa sia partito.

import { tool } from "ai";
import { z } from "zod";
import { LEAD_EMAIL_TO, SITE_URL } from "../config";
import type { ToolContext } from "./context";

const inputSchema = z.object({
  oggetto: z
    .string()
    .min(1)
    .max(120)
    .describe("Oggetto sintetico della richiesta (es. 'Informazioni su villa a Tradate')."),
  riepilogo: z
    .string()
    .min(1)
    .max(600)
    .describe(
      "Riepilogo della richiesta con parole tue: cosa cerca l'utente e cosa vuole sapere. Non inventare dati personali.",
    ),
  slugImmobile: z.string().max(160).optional().describe("Slug dell'immobile di interesse, se c'è."),
});

export type EmailEnquiryResult = {
  esito: "modulo-aperto";
  inviato: false;
  destinatario: string;
  nota: string;
};

export function createPrepareEmailEnquiry(ctx: ToolContext) {
  return tool({
    description:
      "Apre in chat un modulo per lasciare una richiesta scritta all'agenzia. Usalo quando l'utente vuole essere ricontattato via email o lasciare un messaggio. NON invia nulla: i dati li inserisce e conferma l'utente.",
    inputSchema,
    execute: async ({ oggetto, riepilogo, slugImmobile }): Promise<EmailEnquiryResult> => {
      // Come per WhatsApp: l'immobile entra solo se esiste davvero nel catalogo live.
      const property = slugImmobile
        ? ctx.listings.properties.find((p) => p.slug === slugImmobile)
        : undefined;

      const body = [
        riepilogo.trim(),
        property ? `Immobile di interesse: ${property.title} — ${SITE_URL}/case/${property.slug}` : "",
        ctx.pagePath ? `Pagina di origine: ${SITE_URL}${ctx.pagePath}` : "",
      ]
        .filter(Boolean)
        .join("\n\n");

      ctx.emit({
        type: "handoff",
        value: {
          kind: "email",
          to: LEAD_EMAIL_TO,
          subject: oggetto.trim(),
          body,
          listingSlug: property?.slug,
          label: "Lascia una richiesta",
        },
      });

      return {
        esito: "modulo-aperto",
        inviato: false,
        destinatario: LEAD_EMAIL_TO,
        nota: "Il pulsante per lasciare la richiesta è comparso sotto la tua risposta. Invita l'utente a usarlo, indicando nome e recapito. NON dire che la richiesta è stata inviata: parte solo quando la conferma l'utente.",
      };
    },
  });
}
