import { runAssistantTurn } from "../../lib/assistant/agent";
import { ASSISTANT_LIMIT, MAX_BODY_BYTES } from "../../lib/assistant/config";
import { parseAssistantRequest } from "../../lib/assistant/request";
import { errorStreamResponse, eventStreamResponse } from "../../lib/assistant/stream";
import { clientIp, rateLimitShared } from "../../lib/security/rateLimit";

// Assistente conversazionale. Il client invia la cronologia, il server esegue il turno e
// risponde in STREAMING (SSE): il primo testo compare subito, senza attendere i tool.
// Stateless: nulla viene scritto su disco o in database.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Tetto di durata della funzione. Deve stare SOPRA il timeout del turno (25 s) perché sia
 * quest'ultimo a scattare per primo, con un messaggio utile, invece di un 504 muto.
 */
export const maxDuration = 30;

export async function POST(req: Request) {
  // 1. Rate limit per IP: è l'endpoint più costoso del sito (più chiamate modello per turno).
  const rl = await rateLimitShared(`assistant:${clientIp(req)}`, ASSISTANT_LIMIT);
  if (!rl.ok) {
    return errorStreamResponse("rate-limited", 429, {
      "retry-after": String(rl.retryAfterSeconds),
    });
  }

  // 2. Dimensione del body prima di leggerlo: nessun payload enorme entra in memoria.
  const declaredLength = Number(req.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return errorStreamResponse("bad-request", 413);
  }

  let raw: unknown;
  try {
    const text = await req.text();
    // Il content-length può mancare o mentire: ricontrolliamo sul testo effettivo.
    if (text.length > MAX_BODY_BYTES) return errorStreamResponse("bad-request", 413);
    raw = JSON.parse(text);
  } catch {
    return errorStreamResponse("bad-request", 400);
  }

  // 3. Validazione di schema (ruoli, lunghezze, campi ignoti, percorso relativo).
  const validated = parseAssistantRequest(raw);
  if (!validated.ok) return errorStreamResponse(validated.code, 400);

  // 4. Turno in streaming. `req.signal` propaga l'annullamento dal browser fino al provider.
  const events = runAssistantTurn({
    messages: validated.request.messages,
    pagePath: validated.request.pagePath,
    abortSignal: req.signal,
  });

  return eventStreamResponse(events);
}
