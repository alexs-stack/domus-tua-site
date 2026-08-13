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
import type { AssistantTerritory } from "../../territory/assistant";

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
      /** Servizi vicini VERIFICATI (coord-free), o null se non disponibili/approvati. */
      territorio: AssistantTerritory | null;
      nota: string;
      notaTerritorio: string;
    };

export function createGetListingDetails(ctx: ToolContext) {
  return tool({
    description:
      "Recupera i dettagli aggiornati di un immobile a partire dal suo slug, inclusi — quando disponibili e verificati — i servizi vicini (stazione, farmacia, supermercato, scuola, parco) con la distanza indicativa in linea d'aria. Usalo quando l'utente chiede qualcosa su un immobile specifico già mostrato, per confrontarne due, per verificare una caratteristica o per sapere cosa c'è nei dintorni. Non inventare mai lo slug: usa solo quelli che hai ricevuto.",
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

      // Dati territoriali VERIFICATI (coord-free). Il resolver legge solo dato approvato locale:
      // mai una chiamata esterna, mai coordinate. null quando il flag è spento o non c'è dato.
      const territorio = ctx.territory ? await ctx.territory(normalized.sourceRef.codice) : null;

      const notaTerritorio = territorio
        ? "Servizi vicini VERIFICATI: usa SOLO questi. Le distanze sono in linea d'aria: dillo esplicitamente, mai tempi a piedi o in auto. Non commentare sicurezza, prestigio, adeguatezza a un tipo di persona, composizione del quartiere o qualità delle scuole. Tieni distinti i fatti dell'immobile da quelli della zona."
        : "Nessun dato territoriale verificato per questo immobile: se te lo chiedono, di' \"Non dispongo ancora di dati verificati su questo punto\" e proponi il team. Non dedurre nulla dal nome del comune né dalla tua conoscenza generale.";

      return {
        esito: "ok",
        immobile: toListingPayload(property, normalized),
        descrizione: property.excerpt,
        territorio,
        nota: "Rispondi solo con questi dati. Un campo null significa che l'informazione non è disponibile: dillo esplicitamente, non dedurre che l'immobile non abbia quella caratteristica.",
        notaTerritorio,
      };
    },
  });
}
