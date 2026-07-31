// Lettore dello stream SSE dell'assistente, lato browser.
//
// Poche righe di proposito: il protocollo è "un JSON per riga data:". Niente libreria,
// niente peso aggiunto al bundle. Vive in app/lib/assistant/ ma importa SOLO ./types
// (nessun modulo server, nessun segreto).

import type { AssistantEvent } from "./types";

/**
 * Legge la risposta SSE e produce gli eventi man mano che arrivano.
 *
 * Difensivo su tre fronti: una riga malformata viene ignorata invece di rompere lo stream,
 * un buffer che cresce oltre misura viene troncato, e l'interruzione da parte dell'utente
 * (AbortController) chiude semplicemente il ciclo.
 */
export async function* readAssistantStream(
  response: Response,
): AsyncGenerator<AssistantEvent, void, undefined> {
  const body = response.body;
  if (!body) return;

  const reader = body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += value;

      let index = buffer.indexOf("\n\n");
      while (index !== -1) {
        const chunk = buffer.slice(0, index);
        buffer = buffer.slice(index + 2);

        const line = chunk.split("\n").find((l) => l.startsWith("data:"));
        if (line) {
          try {
            yield JSON.parse(line.slice(5).trim()) as AssistantEvent;
          } catch {
            // Riga non interpretabile: la saltiamo, lo stream continua.
          }
        }

        index = buffer.indexOf("\n\n");
      }

      // Argine difensivo: senza delimitatore il buffer non deve crescere all'infinito.
      if (buffer.length > 64 * 1024) buffer = "";
    }
  } finally {
    reader.releaseLock();
  }
}
