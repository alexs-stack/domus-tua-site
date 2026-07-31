// Loop dell'agente, con modello finto (ai/test): deterministico, nessuna rete, nessun costo.

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { simulateReadableStream } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { runAssistantTurn } from "../agent";
import { FALLBACK_REPLY } from "../prompt";
import type { AssistantEvent, ClientMessage } from "../types";
import { fixtureListings } from "./fixtures";

const USAGE = {
  inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 20, text: 20, reasoning: undefined },
};

/** Modello che emette del testo e basta. */
function textModel(chunks: string[]) {
  return new MockLanguageModelV4({
    doStream: async () => ({
      stream: simulateReadableStream({
        chunks: [
          { type: "text-start", id: "t1" },
          ...chunks.map((delta) => ({ type: "text-delta" as const, id: "t1", delta })),
          { type: "text-end", id: "t1" },
          {
            type: "finish" as const,
            finishReason: { unified: "stop" as const, raw: undefined },
            usage: USAGE,
          },
        ],
        chunkDelayInMs: 0,
      }),
    }),
  });
}

/**
 * Modello che al primo passo chiama un tool e al secondo risponde.
 * `captureSystem` riceve il system prompt del primo passo, per verificare il contesto.
 */
function toolThenTextModel(
  toolName: string,
  input: unknown,
  reply: string,
  captureSystem?: (system: string) => void,
) {
  let step = 0;
  return new MockLanguageModelV4({
    doStream: async ({ prompt }) => {
      if (step === 0 && captureSystem) {
        const system = prompt.find((m) => m.role === "system");
        captureSystem(typeof system?.content === "string" ? system.content : "");
      }
      step += 1;

      if (step === 1) {
        return {
          stream: simulateReadableStream({
            chunks: [
              {
                type: "tool-call" as const,
                toolCallId: "call-1",
                toolName,
                input: JSON.stringify(input),
              },
              {
                type: "finish" as const,
                finishReason: { unified: "tool-calls" as const, raw: undefined },
                usage: USAGE,
              },
            ],
            chunkDelayInMs: 0,
          }),
        };
      }

      return {
        stream: simulateReadableStream({
          chunks: [
            { type: "text-start" as const, id: "t1" },
            { type: "text-delta" as const, id: "t1", delta: reply },
            { type: "text-end" as const, id: "t1" },
            {
              type: "finish" as const,
              finishReason: { unified: "stop" as const, raw: undefined },
              usage: USAGE,
            },
          ],
          chunkDelayInMs: 0,
        }),
      };
    },
  });
}

async function collect(
  model: MockLanguageModelV4,
  messages: ClientMessage[] = [{ role: "user", content: "Cerco una villa a Tradate" }],
): Promise<AssistantEvent[]> {
  const events: AssistantEvent[] = [];
  for await (const event of runAssistantTurn({ messages, model, listings: fixtureListings() })) {
    events.push(event);
  }
  return events;
}

const textOf = (events: AssistantEvent[]) =>
  events
    .filter((e): e is Extract<AssistantEvent, { type: "text" }> => e.type === "text")
    .map((e) => e.value)
    .join("");

describe("runAssistantTurn", () => {
  it("trasmette il testo a pezzi e chiude con done", async () => {
    const events = await collect(textModel(["Ciao", ", ", "come posso aiutarti?"]));

    assert.equal(textOf(events), "Ciao, come posso aiutarti?");
    assert.ok(events.filter((e) => e.type === "text").length > 1, "il testo deve arrivare in streaming");
    assert.equal(events.at(-1)?.type, "done");
  });

  it("emette le card immobili prima del testo che le commenta", async () => {
    const events = await collect(
      toolThenTextModel("search_listings", { query: "villa a Tradate con giardino" }, "Eccone una."),
    );

    const listingIndex = events.findIndex((e) => e.type === "listings");
    const textIndex = events.findIndex((e) => e.type === "text");
    assert.ok(listingIndex >= 0, "nessuna card emessa");
    assert.ok(listingIndex < textIndex, "le card devono precedere il commento");
    assert.equal(events.at(-1)?.type, "done");
  });

  it("con zero risultati non emette nessuna card", async () => {
    const events = await collect(
      toolThenTextModel(
        "search_listings",
        { query: "villa a Tradate", prezzoMax: 1000 },
        "Non ho trovato nulla con questi criteri.",
      ),
    );

    assert.equal(events.filter((e) => e.type === "listings").length, 0);
  });

  it("mette gli immobili già mostrati nel contesto, per i riferimenti ordinali", async () => {
    let system = "";
    const model = toolThenTextModel(
      "get_listing_details",
      { slug: "villa-giardino-tradate" },
      "Sì, ha il box doppio.",
      (s) => {
        system = s;
      },
    );

    await collect(model, [
      { role: "user", content: "Cerco una villa" },
      { role: "assistant", content: "Eccone due", listingSlugs: ["villa-giardino-tradate"] },
      { role: "user", content: "La prima ha il garage?" },
    ]);

    assert.match(system, /IMMOBILI GIÀ MOSTRATI/);
    assert.match(system, /villa-giardino-tradate/);
  });

  it("scarta gli slug inesistenti inviati dal client", async () => {
    let system = "";
    const model = textModel(["Certo."]);
    const events: AssistantEvent[] = [];
    for await (const event of runAssistantTurn({
      messages: [
        { role: "user", content: "Cerco casa" },
        { role: "assistant", content: "Ecco", listingSlugs: ["villa-inventata-dall-utente"] },
        { role: "user", content: "Parlami della prima" },
      ],
      model: new MockLanguageModelV4({
        doStream: async ({ prompt }) => {
          const s = prompt.find((m) => m.role === "system");
          system = typeof s?.content === "string" ? s.content : "";
          return model.doStream({ prompt } as never);
        },
      }),
      listings: fixtureListings(),
    })) {
      events.push(event);
    }

    assert.ok(!system.includes("villa-inventata-dall-utente"), "slug falso finito nel contesto");
    assert.ok(!system.includes("IMMOBILI GIÀ MOSTRATI"), "contesto costruito su un immobile inesistente");
  });

  it("su errore del provider risponde in fallback, non con una bolla vuota", async () => {
    const model = new MockLanguageModelV4({
      doStream: async () => {
        throw new Error("provider irraggiungibile");
      },
    });

    const events = await collect(model);

    assert.equal(textOf(events), FALLBACK_REPLY);
    assert.ok(
      events.some((e) => e.type === "error" && e.value.code === "provider-unavailable"),
      "manca l'evento di errore",
    );
    assert.equal(events.at(-1)?.type, "done");
  });

  it("non lascia mai il turno senza testo", async () => {
    // Il modello si ferma senza produrre nulla (finish immediato).
    const model = new MockLanguageModelV4({
      doStream: async () => ({
        stream: simulateReadableStream({
          chunks: [
            {
              type: "finish" as const,
              finishReason: { unified: "stop" as const, raw: undefined },
              usage: USAGE,
            },
          ],
          chunkDelayInMs: 0,
        }),
      }),
    });

    const events = await collect(model);
    assert.equal(textOf(events), FALLBACK_REPLY);
    assert.equal(events.at(-1)?.type, "done");
  });

  it("segnala una risposta troncata dal tetto di token", async () => {
    // Senza questo, una frase tagliata a metà veniva mostrata come risposta finita.
    const model = new MockLanguageModelV4({
      doStream: async () => ({
        stream: simulateReadableStream({
          chunks: [
            { type: "text-start" as const, id: "t1" },
            { type: "text-delta" as const, id: "t1", delta: "La villa ha un giardino di circa" },
            { type: "text-end" as const, id: "t1" },
            {
              type: "finish" as const,
              finishReason: { unified: "length" as const, raw: undefined },
              usage: USAGE,
            },
          ],
          chunkDelayInMs: 0,
        }),
      }),
    });

    const events = await collect(model);

    assert.ok(
      events.some((e) => e.type === "incomplete" && e.value.reason === "length"),
      "manca la segnalazione di risposta incompleta",
    );
    // Il testo già prodotto resta: è valido, manca solo il seguito.
    assert.match(textOf(events), /La villa ha un giardino/);
    assert.equal(events.at(-1)?.type, "done");
  });

  it("una risposta completa non viene segnalata come incompleta", async () => {
    const events = await collect(textModel(["Ecco cosa ho trovato."]));
    assert.ok(!events.some((e) => e.type === "incomplete"));
  });

  it("non contatta la rete per interpretare la ricerca", async () => {
    // Il tool usa il parser locale: una seconda chiamata al modello in mezzo al turno
    // ritarderebbe il primo token e raddoppierebbe il costo di ogni ricerca.
    const realFetch = globalThis.fetch;
    const calls: string[] = [];
    globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      calls.push(String(input));
      return realFetch(input, init);
    };

    try {
      await collect(
        toolThenTextModel("search_listings", { query: "villa a Tradate con giardino" }, "Eccone una."),
      );
    } finally {
      globalThis.fetch = realFetch;
    }

    assert.deepEqual(calls, [], `il tool ha chiamato la rete: ${calls.join(", ")}`);
  });

  it("un tool chiamato con input non valido non fa cadere il turno", async () => {
    // `query` è obbligatoria: lo schema zod rifiuta la chiamata e l'AI SDK la trasforma
    // in un tool-error che il modello vede, senza interrompere lo streaming.
    const events = await collect(
      toolThenTextModel("search_listings", { comune: 42 }, "Mi serve qualche dettaglio in più."),
    );

    assert.ok(textOf(events).length > 0);
    assert.equal(events.at(-1)?.type, "done");
  });

  it("un nome di tool inesistente non fa cadere il turno", async () => {
    const events = await collect(
      toolThenTextModel("cancella_database", { x: 1 }, "Non posso farlo."),
    );

    assert.ok(textOf(events).length > 0);
    assert.equal(events.at(-1)?.type, "done");
  });
});

describe("audit finale — costo del contesto", () => {
  it("il numero di immobili messi nel prompt ha un tetto", async () => {
    // Il client controlla quanti slug rimandare indietro. Senza tetto, un client ostile
    // (o semplicemente una conversazione lunga) fa crescere il prompt di sistema a ogni
    // richiesta: più token, più costo, su ogni turno.
    let system = "";
    const slugs = fixtureListings().properties.map((p) => p.slug);
    const messages: ClientMessage[] = [];
    // 12 messaggi dell'assistente, ognuno con tutti gli slug del catalogo.
    for (let i = 0; i < 12; i++) {
      messages.push({ role: "user", content: `cerco casa ${i}` });
      messages.push({ role: "assistant", content: "ecco", listingSlugs: slugs });
    }
    messages.push({ role: "user", content: "e adesso?" });

    for await (const _ of runAssistantTurn({
      messages,
      model: new MockLanguageModelV4({
        doStream: async ({ prompt }) => {
          const s = prompt.find((m) => m.role === "system");
          system = typeof s?.content === "string" ? s.content : "";
          return {
            stream: simulateReadableStream({
              chunks: [
                { type: "text-start" as const, id: "t" },
                { type: "text-delta" as const, id: "t", delta: "ok" },
                { type: "text-end" as const, id: "t" },
                {
                  type: "finish" as const,
                  finishReason: { unified: "stop" as const, raw: undefined },
                  usage: USAGE,
                },
              ],
              chunkDelayInMs: 0,
            }),
          };
        },
      }),
      listings: fixtureListings(),
    })) {
      void _;
    }

    const righe = system.split("\n").filter((r) => /^\d+\.\s/.test(r));
    assert.ok(righe.length > 0, "il contesto degli immobili mostrati è sparito del tutto");
    assert.ok(righe.length <= 8, `${righe.length} immobili nel prompt: manca un tetto`);
  });
});
