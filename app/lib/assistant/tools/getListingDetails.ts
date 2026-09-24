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
import type { AssistantTerritory } from "./territory";

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
  | {
      esito: "ok";
      immobile: ListingPayload;
      descrizione: string;
      /** Territorio APPROVATO+FRESCO attorno all'immobile (POI/distanze), o null se assente/stale. */
      territorio: AssistantTerritory | null;
      nota: string;
    };

/** Nota che ricorda al modello la separazione immobile↔zona e da dove sono misurate le distanze. */
const NOTA_BASE =
  "Rispondi solo con questi dati. Un campo null significa che l'informazione non è disponibile: dillo esplicitamente, non dedurre che l'immobile non abbia quella caratteristica.";
const NOTA_TERRITORIO_OK =
  " Il campo territorio descrive la ZONA attorno all'immobile, non l'immobile: di' \"nei dintorni\" o \"in zona\", mai \"l'immobile ha\". Riporta le distanze citando SEMPRE la base indicata (territorio.base) e il metodo (in linea d'aria): mai \"a piedi\"/\"in auto\". Cita la fonte e la data. Non dire che un luogo è comodo, sicuro, prestigioso o adatto a un gruppo di persone.";
const NOTA_TERRITORIO_ASSENTE =
  " Nessun dato territoriale approvato e fresco per questo immobile: NON inventare POI o distanze. Se te lo chiedono, dillo e rispondi solo con i dati verificati dell'immobile.";

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

      // Territorio: SOLO se la feature è attiva; sempre dato approvato+fresco, mai coordinate.
      const territorio = ctx.territory ? await ctx.territory.forListing(slug) : null;
      const nota = ctx.territory
        ? NOTA_BASE + (territorio ? NOTA_TERRITORIO_OK : NOTA_TERRITORIO_ASSENTE)
        : NOTA_BASE;

      return {
        esito: "ok",
        immobile: toListingPayload(property, normalized),
        descrizione: property.excerpt,
        territorio,
        nota,
      };
    },
  });
}
