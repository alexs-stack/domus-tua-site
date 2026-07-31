// Protocollo SSE: quello che scrive il server deve essere esattamente quello che legge il client.

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readAssistantStream } from "../client";
import { encodeEvent, errorStreamResponse, eventStreamResponse } from "../stream";
import type { AssistantEvent } from "../types";

/** Response finta a partire da pezzi di testo grezzo, per simulare i confini di chunk. */
function responseFrom(chunks: string[]): Response {
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
        controller.close();
      },
    }),
  );
}

async function readAll(response: Response): Promise<AssistantEvent[]> {
  const out: AssistantEvent[] = [];
  for await (const event of readAssistantStream(response)) out.push(event);
  return out;
}

async function* events(list: AssistantEvent[]): AsyncGenerator<AssistantEvent, void, undefined> {
  for (const event of list) yield event;
}

describe("protocollo SSE", () => {
  it("codifica un evento come singola riga data:", () => {
    const raw = new TextDecoder().decode(encodeEvent({ type: "text", value: "ciao" }));
    assert.equal(raw, 'data: {"type":"text","value":"ciao"}\n\n');
  });

  it("fa il giro completo server → client", async () => {
    const sent: AssistantEvent[] = [
      { type: "text", value: "Ecco " },
      { type: "listings", value: [] },
      { type: "text", value: "due proposte." },
      { type: "done" },
    ];

    assert.deepEqual(await readAll(eventStreamResponse(events(sent))), sent);
  });

  it("ricompone un evento spezzato tra due chunk di rete", async () => {
    const parsed = await readAll(
      responseFrom(['data: {"type":"te', 'xt","value":"ciao"}\n', "\n", 'data: {"type":"done"}\n\n']),
    );

    assert.deepEqual(parsed, [{ type: "text", value: "ciao" }, { type: "done" }]);
  });

  it("salta una riga malformata senza interrompere lo stream", async () => {
    const parsed = await readAll(
      responseFrom(["data: {non json}\n\n", 'data: {"type":"text","value":"ok"}\n\n']),
    );

    assert.deepEqual(parsed, [{ type: "text", value: "ok" }]);
  });

  it("la risposta di errore è sempre leggibile e si chiude con done", async () => {
    const response = errorStreamResponse("rate-limited", 429, { "retry-after": "60" });

    assert.equal(response.status, 429);
    assert.equal(response.headers.get("retry-after"), "60");
    assert.deepEqual(await readAll(response), [
      { type: "error", value: { code: "rate-limited" } },
      { type: "done" },
    ]);
  });

  it("non mette in cache e non fa trasformare lo stream dai proxy", () => {
    const response = eventStreamResponse(events([{ type: "done" }]));
    assert.match(response.headers.get("content-type") ?? "", /text\/event-stream/);
    assert.match(response.headers.get("cache-control") ?? "", /no-store/);
    assert.match(response.headers.get("cache-control") ?? "", /no-transform/);
  });
});
