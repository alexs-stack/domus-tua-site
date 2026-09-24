// Tool 3 — retrieve_agency_knowledge: contenuti aziendali VERIFICATI.
//
// Il retrieval passa solo dalle voci `verified` (app/lib/assistant/knowledge/entries.ts).
// Zero risultati non è un errore: è il segnale che l'assistente deve ammettere di non
// sapere e proporre il team. È il comportamento voluto finché il cliente non approva i testi.

import { tool } from "ai";
import { z } from "zod";
import { retrieveKnowledge, type RetrievedKnowledge } from "../knowledge/retrieve";

const inputSchema = z.object({
  domanda: z
    .string()
    .min(1)
    .max(300)
    .describe("La domanda dell'utente sull'agenzia, riformulata in modo chiaro e completo."),
});

export type KnowledgeResult =
  | { esito: "nessuna-fonte"; nota: string }
  | { esito: "ok"; fonti: RetrievedKnowledge[]; nota: string };

export function createRetrieveAgencyKnowledge() {
  return tool({
    description:
      "Recupera le informazioni verificate su Domus Tua: chi è l'agenzia, contatti, orari, zona servita, cosa l'assistente può e non può fare. Usalo per qualsiasi domanda sull'agenzia. Se non restituisce fonti, l'informazione non è verificata e non va inventata.",
    inputSchema,
    execute: async ({ domanda }): Promise<KnowledgeResult> => {
      // Ibrido: lessicale sempre, semantico solo se configurato. Se il livello semantico
      // non è disponibile o fallisce, questa chiamata resta comunque valida.
      const fonti = await retrieveKnowledge(domanda);

      if (fonti.length === 0) {
        return {
          esito: "nessuna-fonte",
          nota: "Non ci sono contenuti verificati su questo tema. Dì con onestà che non lo sai e proponi di mettere l'utente in contatto con il team. Non ricostruire la risposta da solo.",
        };
      }

      return {
        esito: "ok",
        fonti,
        nota: "Rispondi usando SOLO queste fonti, con parole tue e in modo sintetico. Non aggiungere dettagli che non compaiono qui e non citare le fonti all'utente.",
      };
    },
  });
}
