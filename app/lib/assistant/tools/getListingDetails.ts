// Tool 2 — get_listing_details: dettagli aggiornati di un singolo immobile.
//
// È il tool che rende possibili i follow-up ("la seconda ha il garage?", "qual è la più
// grande?", "confronta le prime due") senza che il modello debba dedurre nulla dal titolo.
// Legge dallo stesso snapshot live della ricerca: se un immobile è stato venduto o ritirato
// nel frattempo, semplicemente non c'è più.

import { tool } from "ai";
import { z } from "zod";
import type { ToolContext } from "./context";
import { toListingPayload, type ListingPayload } from "./payload";

const inputSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(160)
    .describe("Lo slug dell'immobile, esattamente come compare nei risultati di search_listings."),
});

export type ListingDetailsResult =
  | { esito: "non-disponibile"; nota: string }
  | { esito: "non-trovato"; slug: string; nota: string }
  | { esito: "ok"; immobile: ListingPayload; descrizione: string; nota: string };

export function createGetListingDetails(ctx: ToolContext) {
  return tool({
    description:
      "Recupera i dettagli aggiornati di un immobile a partire dal suo slug. Usalo quando l'utente chiede qualcosa su un immobile specifico già mostrato, per confrontarne due o per verificare una caratteristica. Non inventare mai lo slug: usa solo quelli che hai ricevuto.",
    inputSchema,
    execute: async ({ slug }): Promise<ListingDetailsResult> => {
      const { listings } = ctx;

      if (!listings.available) {
        return {
          esito: "non-disponibile",
          nota: "Il catalogo immobili non è consultabile in questo momento. Dillo all'utente e proponi WhatsApp o telefono.",
        };
      }

      const normalized = listings.normalizedBySlug.get(slug);
      const property = listings.properties.find((p) => p.slug === slug);

      if (!normalized || !property) {
        return {
          esito: "non-trovato",
          slug,
          nota: "Questo immobile non è tra quelli attualmente disponibili. Non descriverlo e non ipotizzarne le caratteristiche: dì che non risulta più disponibile e proponi un'alternativa o il contatto col team.",
        };
      }

      return {
        esito: "ok",
        immobile: toListingPayload(property, normalized),
        descrizione: property.excerpt,
        nota: "Rispondi solo con questi dati. Un campo null significa che l'informazione non è disponibile: dillo esplicitamente, non dedurre che l'immobile non abbia quella caratteristica.",
      };
    },
  });
}
