// Tool 1 — search_listings: ricerca sugli immobili RealSmart visibili e disponibili.
//
// Riusa il parser NL e il ranking già esistenti (app/lib/ai/parseQuery.ts, app/lib/ai/rank.ts).
// Sopra ci mette: filtri espliciti sovrascrivibili dal modello (per gli affinamenti tipo
// "solo quelle sotto 250 mila"), i criteri che la UI del sito non offre (camere, bagni),
// la spiegazione calcolata della pertinenza e, a zero risultati, un allentamento verificato
// sui dati invece di un consiglio a caso.

import { tool } from "ai";
import { z } from "zod";
import { parseQueryLocal } from "../../ai/parseQuery";
import { applyFilters, rankResults } from "../../ai/rank";
import type { FeatureLabel, ParsedSearch, SearchFacets } from "../../ai/types";
import { RESULTS_PER_SEARCH } from "../config";
import { explainMatch } from "../search/explain";
import { hasCoordinates, nearbyComuni } from "../search/nearby";
import { refine, type RefineCriteria } from "../search/refine";
import { suggestRelaxation, type Relaxation } from "../search/relax";
import type { ToolContext } from "./context";
import { toListingCard, toListingPayload, type ListingPayload } from "./payload";

/**
 * Caratteristiche cercabili = quelle che il feed RealSmart espone davvero.
 * Chiedere al modello di filtrare su qualcosa che il gestionale non fornisce produrrebbe
 * risposte negative false.
 */
const FEATURE_LABELS: FeatureLabel[] = [
  "Giardino",
  "Box / posto auto",
  "Terrazzo",
  "Doppi servizi",
  "Ascensore",
  "Aria condizionata",
];
const TYPES = ["Appartamento", "Attico", "Villa", "Commerciale", "Terreno"] as const;

const inputSchema = z.object({
  query: z
    .string()
    .min(1)
    .max(300)
    .describe(
      "La richiesta in italiano, completa di tutto ciò che l'utente ha chiesto finora nella conversazione. Esempio: 'villa a Tradate sotto 300 mila con giardino'.",
    ),
  contratto: z.enum(["Vendita", "Affitto"]).optional().describe("Solo se l'utente lo ha detto."),
  tipologia: z.enum(TYPES).optional(),
  comune: z.string().max(60).optional().describe("Nome del comune, se l'utente ne ha indicato uno."),
  prezzoMax: z.number().int().positive().optional().describe("Tetto di spesa in euro."),
  prezzoMin: z.number().int().positive().optional(),
  localiMin: z.number().int().positive().max(20).optional().describe("Numero minimo di locali totali."),
  camereMin: z.number().int().positive().max(15).optional().describe("Numero minimo di camere da letto."),
  bagniMin: z.number().int().positive().max(10).optional().describe("Numero minimo di bagni."),
  mqMin: z.number().int().positive().max(5000).optional(),
  mqMax: z.number().int().positive().max(5000).optional(),
  caratteristiche: z
    .array(z.enum(["Giardino", "Box / posto auto", "Terrazzo", "Doppi servizi", "Ascensore", "Aria condizionata"]))
    .optional()
    .describe("Solo le caratteristiche RICHIESTE. Se l'utente le esclude ('senza giardino'), non includerle."),
  ancheComuniVicini: z
    .boolean()
    .optional()
    .describe("true se l'utente si accontenta anche dei comuni vicini a quello indicato."),
});

/** Un immobile trovato, con il motivo per cui è pertinente. */
export interface SearchHit extends ListingPayload {
  /** Criteri richiesti che questo immobile soddisfa davvero. Può essere vuoto. */
  perche: string[];
}

export type SearchListingsResult =
  | { esito: "non-disponibile"; nota: string }
  | {
      /** Il comune chiesto non ha immobili disponibili: va detto, non aggirato. */
      esito: "comune-non-coperto";
      comune: string;
      comuniVicini: string[];
      nota: string;
    }
  | {
      esito: "nessun-risultato";
      totale: 0;
      criteriApplicati: Record<string, unknown>;
      /** Unico compromesso verificato sui dati, oppure null se nessuno basta. */
      allentamento: Relaxation | null;
      nota: string;
    }
  | {
      esito: "ok";
      totale: number;
      criteriApplicati: Record<string, unknown>;
      mostrati: SearchHit[];
      /** Comuni vicini con immobili, quando la ricerca era su un comune solo. */
      comuniVicini?: string[];
      nota: string;
    };

/**
 * Unisce i filtri dedotti dal parser con quelli espliciti del modello.
 * Gli espliciti VINCONO: nascono da un affinamento diretto dell'utente ("solo sotto 250").
 */
function mergeFilters(
  parsed: ParsedSearch,
  input: z.infer<typeof inputSchema>,
  zoneKeyByComune: Map<string, string>,
): { filters: ParsedSearch; comunePulito?: string } {
  const merged: ParsedSearch = { ...parsed };

  if (input.contratto) merged.contract = input.contratto;
  if (input.tipologia) merged.type = input.tipologia;
  if (input.prezzoMax) merged.maxBudget = input.prezzoMax;
  if (input.prezzoMin) merged.minBudget = input.prezzoMin;
  if (input.localiMin) merged.minRooms = input.localiMin;
  if (input.mqMin) merged.minSqm = input.mqMin;
  if (input.mqMax) merged.maxSqm = input.mqMax;
  if (input.caratteristiche?.length) merged.features = input.caratteristiche;

  // Un comune esplicito vale solo se esiste nel catalogo disponibile.
  const requested = input.comune?.trim().toLowerCase();
  if (requested && zoneKeyByComune.has(requested)) merged.comune = input.comune!.trim();

  // Il NOME del comune ("Tradate") e la CHIAVE DI ZONA del catalogo ("Tradate (VA)") non
  // sempre coincidono: oggi sì, perché il feed non espone la provincia, ma il codice non
  // può dipendere da questo. Teniamo entrambi: la chiave serve ad applyFilters, il nome
  // pulito alle coordinate dei comuni vicini (che non conoscono il formato di zona).
  let comunePulito: string | undefined;
  if (merged.comune) {
    const key = merged.comune.trim().toLowerCase();
    const zoneKey = zoneKeyByComune.get(key);
    if (zoneKey) {
      comunePulito = merged.comune.trim();
      merged.comune = zoneKey;
    } else {
      // Già una chiave di zona (traduzione idempotente): recuperiamo il nome pulito.
      comunePulito = [...zoneKeyByComune.entries()].find(([, v]) => v === merged.comune)?.[0];
    }
  }

  return { filters: merged, comunePulito };
}

/** Riassunto leggibile dei criteri effettivamente applicati. */
function describeFilters(f: ParsedSearch, extra: RefineCriteria): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (f.contract && f.contract !== "Tutte") out.contratto = f.contract;
  if (f.type && f.type !== "Tutte") out.tipologia = f.type;
  if (f.comune && f.comune !== "Tutti") out.comune = f.comune;
  if (f.maxBudget) out.prezzoMax = f.maxBudget;
  if (f.minBudget) out.prezzoMin = f.minBudget;
  if (f.minRooms) out.localiMin = f.minRooms;
  if (extra.camereMin) out.camereMin = extra.camereMin;
  if (extra.bagniMin) out.bagniMin = extra.bagniMin;
  if (f.minSqm) out.mqMin = f.minSqm;
  if (f.maxSqm) out.mqMax = f.maxSqm;
  if (f.features?.length) out.caratteristiche = f.features;
  return out;
}

export function createSearchListings(ctx: ToolContext) {
  return tool({
    description:
      "Cerca gli immobili in vendita o in affitto seguiti dall'agenzia. Restituisce solo immobili realmente disponibili: i venduti e gli annunci non pubblici non compaiono. Usalo ogni volta che l'utente cerca casa o affina una ricerca. Non usarlo per domande non immobiliari.",
    inputSchema,
    execute: async (input): Promise<SearchListingsResult> => {
      const { listings } = ctx;

      if (!listings.available) {
        return {
          esito: "non-disponibile",
          nota: "Il catalogo immobili non è consultabile in questo momento. Dillo all'utente e proponi WhatsApp o telefono. Non citare nessun immobile.",
        };
      }

      const facets: SearchFacets = {
        comuni: ["Tutti", ...listings.comuni],
        types: [...TYPES],
        featureLabels: FEATURE_LABELS,
      };

      // Parser LOCALE, non quello con percorso AI. `parseQuery` chiamerebbe Claude Haiku ogni
      // volta che ANTHROPIC_API_KEY è presente — cioè sempre, quando l'assistente funziona —
      // aggiungendo una seconda chiamata al modello in mezzo al turno, prima che l'utente veda
      // una parola. Qui non serve: la comprensione del linguaggio naturale la fa già il
      // modello agente, che ha i filtri espliciti nello schema di questo tool.
      // (/api/search continua a usare parseQuery completo: lì non c'è nessun modello a monte.)
      // Comune chiesto esplicitamente ma senza immobili disponibili: dirlo, non cercare
      // altrove in silenzio. Restituire case di Tradate a chi ha chiesto Milano è una
      // risposta sbagliata data con sicurezza — l'utente non ha modo di accorgersene.
      const chiesto = input.comune?.trim();
      if (chiesto && !listings.zoneKeyByComune.has(chiesto.toLowerCase())) {
        return {
          esito: "comune-non-coperto",
          comune: chiesto,
          comuniVicini: nearbyComuni(chiesto, listings.comuni),
          nota: "In questo comune non ci sono immobili disponibili. Dillo chiaramente PRIMA di proporre altro. Se ci sono comuni vicini, offrili come alternativa; altrimenti proponi WhatsApp o email. Non mostrare immobili di altre zone come se fossero la risposta alla domanda.",
        };
      }

      const parsed = parseQueryLocal(input.query, facets);
      const { filters, comunePulito } = mergeFilters(parsed, input, listings.zoneKeyByComune);
      const extra: RefineCriteria = { camereMin: input.camereMin, bagniMin: input.bagniMin };
      const criteriApplicati = describeFilters(filters, extra);

      // "Anche nei comuni vicini": il filtro comune cade e il ranking porta comunque avanti
      // i più pertinenti. Se non conosciamo la posizione del comune non fingiamo di saperla.
      const effective =
        input.ancheComuniVicini && comunePulito && hasCoordinates(comunePulito)
          ? { ...filters, comune: undefined }
          : filters;

      const candidates = refine(
        applyFilters(listings.properties, effective),
        listings.normalizedBySlug,
        extra,
      );

      if (candidates.length === 0) {
        return {
          esito: "nessun-risultato",
          totale: 0,
          criteriApplicati,
          allentamento: suggestRelaxation(
            listings.properties,
            listings.normalizedBySlug,
            effective,
            extra,
            listings.comuni,
            comunePulito,
          ),
          nota: "Nessun immobile corrisponde. Dillo chiaramente. Se c'è un allentamento, proponi SOLO quello, citandone il numero di risultati. Se è null, non inventarne uno: offri WhatsApp o email. Non mostrare immobili di ricerche precedenti.",
        };
      }

      const { slugs } = await rankResults(candidates, effective);
      const bySlug = new Map(candidates.map((p) => [p.slug, p]));

      const selected = slugs
        .slice(0, RESULTS_PER_SEARCH)
        .map((slug) => bySlug.get(slug))
        .filter((p): p is NonNullable<typeof p> => p != null);

      const mostrati = selected
        .map((property) => {
          const normalized = listings.normalizedBySlug.get(property.slug);
          if (!normalized) return null;
          return {
            ...toListingPayload(property, normalized),
            perche: explainMatch(normalized, filters, extra),
          };
        })
        .filter((p): p is SearchHit => p != null);

      if (mostrati.length > 0) {
        // Le card compaiono in chat adesso, agganciate a QUESTA ricerca.
        ctx.emit({
          type: "listings",
          value: selected.filter((p) => mostrati.some((m) => m.slug === p.slug)).map(toListingCard),
        });
      }

      // Comuni vicini con immobili: utili per "avete qualcosa qui intorno?".
      const comuniVicini =
        comunePulito && !input.ancheComuniVicini
          ? nearbyComuni(comunePulito, listings.comuni)
          : undefined;

      return {
        esito: "ok",
        totale: candidates.length,
        criteriApplicati,
        mostrati,
        ...(comuniVicini?.length ? { comuniVicini } : {}),
        nota: "Le schede complete sono già visibili all'utente sotto la tua risposta: non incollare URL e non ripetere tutti i dettagli. Cita al massimo 2-3 immobili e usa il campo `perche` per dire in una frase perché sono pertinenti. Un campo null significa informazione non disponibile, non assenza: dillo così.",
      };
    },
  });
}
