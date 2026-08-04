// Modello simulato per l'eval.
//
// A cosa serve DAVVERO: non a fingere un punteggio, ma a verificare che l'harness e i grader
// funzionino prima di spendere in chiamate reali. Un grader che non sa riconoscere un immobile
// inventato darebbe un 100% rassicurante e falso; un harness che non registra gli strumenti
// direbbe "0% di scelta corretta" facendo sospettare il modello invece del proprio codice.
//
// Copre inoltre per intero il gruppo "errore": provider giù, output vuoto, tool inesistente,
// input di tool non valido. Quei casi con un modello vero non si potrebbero riprodurre.

import { simulateReadableStream } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import type { LanguageModel } from "ai";
import type { EvalCase } from "./cases";

const USAGE = {
  inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 20, text: 20, reasoning: undefined },
};

const finish = (reason: "stop" | "tool-calls" = "stop") =>
  ({ type: "finish" as const, finishReason: { unified: reason, raw: undefined }, usage: USAGE });

const testo = (t: string) => [
  { type: "text-start" as const, id: "t" },
  { type: "text-delta" as const, id: "t", delta: t },
  { type: "text-end" as const, id: "t" },
  finish(),
];

/** Strumento che un assistente ragionevole userebbe per questo caso. */
function toolPlausibile(caso: EvalCase): { name: string; input: unknown } | null {
  const atteso = caso.toolAttesi?.[0];
  if (!atteso) return null;
  const ultimo = caso.turni[caso.turni.length - 1];

  switch (atteso) {
    case "search_listings":
      return { name: "search_listings", input: { query: ultimo } };
    case "get_listing_details":
      // Slug plausibile del catalogo di prova: il grader verificherà che esista.
      return { name: "get_listing_details", input: { slug: "villa-giardino-tradate" } };
    case "retrieve_agency_knowledge":
      return { name: "retrieve_agency_knowledge", input: { domanda: ultimo } };
    case "prepare_whatsapp_handoff":
      return { name: "prepare_whatsapp_handoff", input: { motivo: ultimo } };
    case "prepare_email_enquiry":
      return { name: "prepare_email_enquiry", input: { oggetto: "Richiesta", riepilogo: ultimo } };
    default:
      return null;
  }
}

/**
 * Risposta di ripiego che soddisfa i vincoli formali: breve, senza markdown, con un canale
 * umano quando il caso lo richiede. Non è "una buona risposta": è una risposta che permette
 * di distinguere un fallimento dell'harness da un fallimento del modello.
 */
function rispostaGenerica(caso: EvalCase): string {
  if (caso.richiedeHandoff) {
    return "Ti metto in contatto con il team: puoi scriverci su WhatsApp o lasciare una richiesta.";
  }
  if (caso.deveContenere?.length) {
    return `Ecco quello che posso dirti: ${caso.deveContenere.join(", ")}.`;
  }
  return "Su questo non ho informazioni verificate. Preferisci che ti metta in contatto con il team?";
}

/**
 * Guasti che vivono NEL provider o nel comportamento del modello: un modello vero, che
 * funziona, non può riprodurli. `feed-giu` non è qui perché quello si riproduce davvero —
 * `runCase` svuota il catalogo e il modello reale ci ragiona sopra.
 */
const GUASTI_DA_SIMULARE = ["provider-giu", "output-vuoto", "tool-inesistente", "tool-input-invalido"];

/**
 * true se il caso va eseguito col modello simulato ANCHE in modalità reale.
 *
 * Senza questo, in modalità reale i casi di guasto finivano al provider vero, che rispondeva
 * normalmente: il grader chiedeva un canale umano a una risposta che non ne aveva bisogno e
 * il gruppo "errore" produceva fallimenti inventati. Peggio: un gruppo che sembra misurare la
 * degradazione dell'assistente e invece non misura niente.
 */
export function richiedeModelloSimulato(caso: EvalCase): boolean {
  return caso.guasto !== undefined && GUASTI_DA_SIMULARE.includes(caso.guasto);
}

/** Costruisce il modello simulato adatto al caso, incluso il guasto da riprodurre. */
export function modelloSimulato(caso: EvalCase): LanguageModel {
  if (caso.guasto === "provider-giu") {
    return new MockLanguageModelV4({
      doStream: async () => {
        throw new Error("provider irraggiungibile");
      },
    });
  }

  if (caso.guasto === "output-vuoto") {
    return new MockLanguageModelV4({
      doStream: async () => ({
        stream: simulateReadableStream({ chunks: [finish()], chunkDelayInMs: 0 }),
      }),
    });
  }

  // Primo passo: chiamata a uno strumento; secondo passo: risposta testuale.
  const primoPasso = (() => {
    if (caso.guasto === "tool-inesistente") {
      return { name: "cancella_database", input: { x: 1 } };
    }
    if (caso.guasto === "tool-input-invalido") {
      // `query` è obbligatoria: lo schema zod deve respingere la chiamata senza far cadere il turno.
      return { name: "search_listings", input: { comune: 42 } };
    }
    return toolPlausibile(caso);
  })();

  let passo = 0;
  return new MockLanguageModelV4({
    doStream: async () => {
      passo += 1;
      if (passo === 1 && primoPasso) {
        return {
          stream: simulateReadableStream({
            chunks: [
              {
                type: "tool-call" as const,
                toolCallId: `call-${passo}`,
                toolName: primoPasso.name,
                input: JSON.stringify(primoPasso.input),
              },
              finish("tool-calls"),
            ],
            chunkDelayInMs: 0,
          }),
        };
      }
      return {
        stream: simulateReadableStream({ chunks: testo(rispostaGenerica(caso)), chunkDelayInMs: 0 }),
      };
    },
  });
}
