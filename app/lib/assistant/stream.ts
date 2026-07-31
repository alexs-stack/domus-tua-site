// Protocollo SSE dell'assistente: un evento JSON per riga `data:`.
//
// Scritto a mano di proposito. Il client resta la nostra UI custom e il bundle browser non
// cresce di un byte (nessun @ai-sdk/react). Il formato è volutamente banale: chi legge deve
// solo fare JSON.parse di ogni riga `data:`.

import type { AssistantEvent } from "./types";

const encoder = new TextEncoder();

/** Serializza un evento in una riga SSE. */
export function encodeEvent(event: AssistantEvent): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(event)}\n\n`);
}

/**
 * Trasforma il generatore di eventi in una Response SSE.
 *
 * `no-transform` è indispensabile: senza, un proxy che comprime al volo può bufferizzare
 * lo stream e annullare il vantaggio del primo token rapido.
 */
export function eventStreamResponse(
  events: AsyncGenerator<AssistantEvent, void, undefined>,
): Response {
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { value, done } = await events.next();
        if (done) {
          controller.close();
          return;
        }
        controller.enqueue(encodeEvent(value));
      } catch (err) {
        // Il generatore garantisce di non lanciare; questa è la rete di sicurezza finale.
        console.error("[assistant] stream interrotto:", err instanceof Error ? err.message : err);
        controller.enqueue(encodeEvent({ type: "error", value: { code: "error" } }));
        controller.enqueue(encodeEvent({ type: "done" }));
        controller.close();
      }
    },
    async cancel() {
      // L'utente ha chiuso la pagina o premuto "ferma": chiudiamo il generatore, che a sua
      // volta interrompe la chiamata al provider (nessun token pagato a vuoto).
      await events.return();
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-store, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    },
  });
}

/** Risposta SSE con un singolo errore già sanificato (rate limit, body invalido…). */
export function errorStreamResponse(
  code: Extract<AssistantEvent, { type: "error" }>["value"]["code"],
  status: number,
  headers?: HeadersInit,
): Response {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encodeEvent({ type: "error", value: { code } }));
      controller.enqueue(encodeEvent({ type: "done" }));
      controller.close();
    },
  });

  return new Response(stream, {
    status,
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-store, no-transform",
      ...headers,
    },
  });
}
