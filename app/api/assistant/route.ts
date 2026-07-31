import { runAssistant, type AssistantEvent, type ChatMessage } from "../../lib/ai/assistant";
import { rateLimit, clientIp, ASSISTANT_LIMIT } from "../../lib/security/rateLimit";
import { locales, type Locale } from "../../lib/i18n/dictionaries";

// Assistente conversazionale. Il client invia la cronologia, il server esegue il turno e
// risponde in STREAMING (SSE): il testo compare mentre viene generato.
//
// Stateless per scelta: la conversazione vive solo nel client. Qui non si salva niente —
// nessun database, nessun gestionale, nessun log del contenuto dei messaggi.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Cronologia e lunghezze massime accettate: argine contro payload abnormi. */
const MAX_MESSAGES = 24;
const MAX_LEN = 1000;
const MAX_BODY_BYTES = 64_000;

function sse(event: AssistantEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

/** Risposta di errore in forma di stream: il client ha un solo formato da gestire. */
function errorStream(event: AssistantEvent, status = 200): Response {
  return new Response(sse(event), {
    status,
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export async function POST(req: Request) {
  // Rate limit per IP: un assistente è una risorsa costosa esposta senza autenticazione.
  const rl = rateLimit(`assistant:${clientIp(req)}`, ASSISTANT_LIMIT);
  if (!rl.ok) {
    return new Response(sse({ type: "error", reason: "provider-error" }), {
      status: 429,
      headers: {
        "content-type": "text/event-stream; charset=utf-8",
        "cache-control": "no-store",
        "retry-after": String(rl.retryAfterSeconds),
      },
    });
  }

  const declaredLength = Number(req.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return errorStream({ type: "error", reason: "provider-error" }, 413);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorStream({ type: "error", reason: "provider-error" }, 400);
  }

  const localeRaw = (body as { locale?: unknown })?.locale;
  const locale: Locale =
    typeof localeRaw === "string" && (locales as readonly string[]).includes(localeRaw)
      ? (localeRaw as Locale)
      : "it";

  const raw = (body as { messages?: unknown })?.messages;
  if (!Array.isArray(raw) || raw.length === 0) {
    return errorStream({ type: "error", reason: "provider-error" }, 400);
  }

  // Sanifica: solo ruoli validi, testo non vuoto, lunghezza limitata, ultimi N.
  // Un ruolo diverso da "assistant" diventa "user": il client non può iniettare turni di
  // sistema, che sono l'unico canale di istruzioni dell'assistente.
  const history: ChatMessage[] = raw
    .filter(
      (m): m is { role?: unknown; content: string } =>
        !!m && typeof m === "object" && typeof (m as { content?: unknown }).content === "string",
    )
    .map((m): ChatMessage => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content.slice(0, MAX_LEN),
    }))
    .filter((m) => m.content.trim().length > 0)
    .slice(-MAX_MESSAGES);

  if (history.length === 0 || history[history.length - 1].role !== "user") {
    return errorStream({ type: "error", reason: "provider-error" }, 400);
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        // `req.signal` si annulla quando il client chiude la connessione o preme
        // "interrompi": il turno si ferma davvero, non continua a bruciare token.
        for await (const event of runAssistant(history, locale, req.signal)) {
          controller.enqueue(encoder.encode(sse(event)));
        }
      } catch (err) {
        if (!req.signal.aborted) {
          console.error("[assistant] stream interrotto:", err instanceof Error ? err.message : err);
          controller.enqueue(encoder.encode(sse({ type: "error", reason: "provider-error" })));
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-store",
      connection: "keep-alive",
      // Evita il buffering dei proxy: senza, lo streaming arriva tutto insieme alla fine.
      "x-accel-buffering": "no",
    },
  });
}
