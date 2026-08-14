// Tool — get_area_profile: fatti d'area VERIFICATI di un comune (Prompt 13).
//
// Da usare quando la domanda riguarda il COMUNE/la ZONA ("com'è vivere a Tradate?", "com'è servita
// la zona?"), non un immobile specifico. Legge SOLO fatti approvati/freschi/senza conflitti dallo
// store verificato: nessuna ricerca web, nessuna chiamata provider durante la chat. Se non c'è nulla
// di pubblicabile → esito "non-disponibile": l'assistente lo dice e NON inventa.

import { tool } from "ai";
import { z } from "zod";
import { normalizeMunicipality } from "../../territory/geo";
import type { ToolContext } from "./context";
import type { AssistantAreaProfile } from "./territory";

const inputSchema = z.object({
  comune: z
    .string()
    .min(1)
    .max(80)
    .describe("Il nome del comune di cui l'utente chiede (es. \"Tradate\"). Solo comuni citati dall'utente o dai risultati."),
});

export type AreaProfileResult =
  | { esito: "non-disponibile"; comune: string; nota: string }
  | { esito: "ok"; profilo: AssistantAreaProfile; nota: string };

export function createGetAreaProfile(ctx: ToolContext) {
  return tool({
    description:
      "Fornisce fatti verificati sul COMUNE o sulla ZONA (trasporti, collegamenti, servizi comunali, sanità, scuole, parchi), non su un immobile. Usalo per domande come \"com'è vivere a Tradate?\" o \"la zona è ben collegata?\". Non descrive un immobile: per quello usa get_listing_details.",
    inputSchema,
    execute: async ({ comune }): Promise<AreaProfileResult> => {
      // La feature è attiva (il tool è registrato solo in quel caso), ma difendiamoci comunque.
      if (!ctx.territory) {
        return {
          esito: "non-disponibile",
          comune,
          nota: "Nessun profilo d'area disponibile. Non inventare fatti sul comune: rispondi da ciò che sai e proponi il contatto col team.",
        };
      }

      const profilo = await ctx.territory.forMunicipality(normalizeMunicipality(comune));
      ctx.sink?.emit({
        kind: "assistant-tool",
        tool: "get_area_profile",
        hadTerritory: profilo !== null,
        ...(ctx.turnId ? { turnId: ctx.turnId } : {}),
      });
      if (!profilo) {
        ctx.sink?.emit({ kind: "assistant-fallback", reason: "missing", scope: "area", ...(ctx.turnId ? { turnId: ctx.turnId } : {}) });
        return {
          esito: "non-disponibile",
          comune,
          nota: "Non ho fatti verificati e aggiornati su questo comune. Dillo con semplicità e NON inventare trasporti, servizi o distanze. Puoi proporre il contatto col team per informazioni sulla zona.",
        };
      }

      return {
        esito: "ok",
        profilo,
        nota: "Questi sono fatti sul COMUNE/la zona, non su un immobile: di' \"il comune\"/\"la zona\", mai \"l'immobile\". Riporta i fatti così come sono, cita la fonte e la data di revisione, senza giudizi (niente \"sicuro\", \"prestigioso\", \"ideale per…\"). Non aggiungere fatti non presenti qui.",
      };
    },
  });
}
