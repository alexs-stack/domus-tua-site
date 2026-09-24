// Tool 3 — retrieve_agency_knowledge: contenuti aziendali VERIFICATI.
//
// Il retrieval passa solo dalle voci `verified` (app/lib/assistant/knowledge/entries.ts).
// Zero risultati non è un errore: è il segnale che l'assistente deve ammettere di non
// sapere e proporre il team. Ora che il corpus copre tutto il copy pubblicato, i temi su
// cui tace sono pochi e dichiarati — ma il segnale funziona esattamente come prima.

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
    // L'elenco dei temi non è decorativo: è quello che il modello legge per decidere se
    // chiamare lo strumento. Quando il corpus copriva solo contatti e orari, elencarli
    // bastava; ora che copre metodo, D.O.C., Open Domus, vendita, acquisto, valutazione,
    // visite e proposte, ometterli significherebbe avere le risposte e non andarle a
    // prendere. Se aggiungi un'area al corpus, aggiungila anche qui.
    description:
      "Recupera le informazioni verificate su Domus Tua: chi è l'agenzia, contatti, orari, zona servita, il Metodo Domus Tua, il protocollo Domus D.O.C., Open Domus, come si vende e come si compra casa con l'agenzia, la valutazione dell'immobile, visite e appuntamenti, proposte e documenti, costi e provvigioni, privacy, candidature, e cosa l'assistente può e non può fare. Usalo per QUALSIASI domanda sull'agenzia o su come funziona, anche quando pensi di sapere già la risposta. Se non restituisce fonti, l'informazione non è verificata e non va inventata.",
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
        // "Scegli, non riassumere": quando il corpus si è allargato (2026-08-06) le fonti
        // sono diventate più lunghe e il modello ha cominciato a parafrasarle tutte,
        // producendo risposte complete e prolisse dove ne bastavano tre frasi.
        // Più conoscenza deve dare risposte più giuste, non più lunghe.
        nota: "Rispondi usando SOLO queste fonti, con parole tue. Scegli le due o tre informazioni che rispondono davvero a QUESTA domanda e lascia stare il resto: se l'utente vuole saperne di più, te lo chiede. Meglio tre frasi che vanno al punto di un riassunto completo. Non aggiungere dettagli che non compaiono qui e non citare le fonti all'utente.",
      };
    },
  });
}
