// Assistente conversazionale — orchestrazione del turno.
//
// SERVER-ONLY: legge ANTHROPIC_API_KEY. Non importare da un componente client.
//
// Cosa fa un turno: costruisce il contesto (immobili live), chiama il modello in STREAMING,
// esegue gli strumenti che chiede, e ripete finché il modello smette di chiamarne — al
// massimo ASSISTANT_MAX_TOOL_ROUNDS volte. Il testo esce token per token man mano che arriva.
//
// Nessuna conversazione viene salvata: la cronologia arriva dal client a ogni richiesta e non
// viene scritta da nessuna parte. Niente CRM, niente database, niente log del contenuto.
//
// Difensivo per costruzione: `runAssistant` non lancia mai. Provider assente, provider in
// errore, timeout, abort — ognuno produce un esito esplicito, e in ogni caso la ricerca
// deterministica e i contatti restano utilizzabili sul sito.

import Anthropic from "@anthropic-ai/sdk";
import {
  ANTHROPIC_API_KEY,
  AI_ASSISTANT_MODEL,
  ASSISTANT_MAX_HISTORY,
  ASSISTANT_MAX_TOKENS,
  ASSISTANT_MAX_TOOL_ROUNDS,
  ASSISTANT_TIMEOUT_MS,
  assistantConfigured,
} from "./config";
import { buildAssistantSystem } from "./knowledge";
import {
  ASSISTANT_TOOLS,
  buildToolContext,
  runTool,
  type ListingCard,
  type ToolContext,
} from "./tools";
import type { Locale } from "../i18n/dictionaries";

export type { ListingCard } from "./tools";

export type ChatMessage = { role: "user" | "assistant"; content: string };

/** Perché un turno non ha prodotto una risposta del modello. */
export type AssistantFailure = "not-configured" | "provider-error" | "timeout" | "aborted";

/** Eventi emessi durante un turno. Il route handler li traduce in SSE. */
export type AssistantEvent =
  | { type: "text"; text: string }
  | { type: "listings"; listings: ListingCard[] }
  /** Strumento invocato in questo turno. Serve agli eval; il client lo ignora. */
  | { type: "tool"; name: string }
  | { type: "done" }
  | { type: "error"; reason: AssistantFailure };

/** Messaggio mostrato quando l'assistente non può rispondere. Il sito resta utilizzabile. */
export const FALLBACK: Record<string, string> = {
  it: "L'assistente non è disponibile in questo momento. Puoi cercare casa con i filtri qui sopra, scriverci su WhatsApp o chiamarci: ti rispondiamo noi.",
  en: "The assistant isn’t available right now. You can search with the filters above, message us on WhatsApp or call us: we’ll reply in person.",
  fr: "L’assistant n’est pas disponible pour le moment. Utilisez les filtres ci-dessus, écrivez-nous sur WhatsApp ou appelez-nous : nous vous répondrons.",
  de: "Der Assistent ist gerade nicht verfügbar. Nutzen Sie die Filter oben, schreiben Sie uns auf WhatsApp oder rufen Sie an: Wir antworten persönlich.",
  es: "El asistente no está disponible ahora. Puedes buscar con los filtros de arriba, escribirnos por WhatsApp o llamarnos: te respondemos nosotros.",
};

export function fallbackText(locale: Locale): string {
  return FALLBACK[locale] ?? FALLBACK.it;
}

/** Client creato per turno: la chiave resta server-side e non viene mai passata al client. */
function makeClient(): Anthropic {
  return new Anthropic({
    apiKey: ANTHROPIC_API_KEY,
    timeout: ASSISTANT_TIMEOUT_MS,
    // Un turno di chat non merita ritentativi lunghi: meglio un fallback rapido e onesto.
    maxRetries: 1,
  });
}

/**
 * Esegue un turno dell'assistente, emettendo eventi man mano.
 *
 * @param history cronologia della sessione, dal client (non viene mai persistita)
 * @param locale  lingua di default del sito
 * @param signal  abort del client: chiudere la scheda o premere "interrompi" ferma il turno
 * @param ctx     contesto degli strumenti; di default gli immobili live. Lo passano gli eval,
 *                che devono girare su un insieme fisso e non sul feed del giorno.
 */
export async function* runAssistant(
  history: ChatMessage[],
  locale: Locale,
  signal?: AbortSignal,
  ctx?: ToolContext,
): AsyncGenerator<AssistantEvent> {
  // Ogni fallimento dice prima cosa fare (filtri, WhatsApp, telefono) e poi dichiara l'errore:
  // chi legge deve trovarsi davanti una via d'uscita, non un messaggio tecnico.
  let emittedText = false;

  if (!assistantConfigured) {
    yield { type: "text", text: fallbackText(locale) };
    yield { type: "error", reason: "not-configured" };
    return;
  }

  const client = makeClient();
  const system = buildAssistantSystem(locale);
  const toolCtx = ctx ?? (await buildToolContext());

  const messages: Anthropic.MessageParam[] = history
    .slice(-ASSISTANT_MAX_HISTORY)
    .map((m) => ({ role: m.role, content: m.content }));

  let shownListings: ListingCard[] = [];

  for (let round = 0; round <= ASSISTANT_MAX_TOOL_ROUNDS; round++) {
    // All'ultimo giro togliamo gli strumenti: il modello DEVE chiudere con del testo, invece
    // di restare in un ciclo di chiamate che non converge.
    const isFinalRound = round === ASSISTANT_MAX_TOOL_ROUNDS;

    let message: Anthropic.Message;
    const buffer: string[] = [];
    let flushed = 0;
    try {
      const stream = client.messages.stream(
        {
          model: AI_ASSISTANT_MODEL,
          max_tokens: ASSISTANT_MAX_TOKENS,
          system,
          messages,
          ...(isFinalRound ? {} : { tools: ASSISTANT_TOOLS }),
        },
        { signal },
      );

      // Il testo esce mentre viene generato: chi legge non aspetta la fine del turno.
      stream.on("text", (delta) => buffer.push(delta));
      const finalPromise = stream.finalMessage();

      // Svuota il buffer periodicamente mentre la risposta arriva.
      let settled = false;
      const finished = finalPromise.then(
        (m) => {
          settled = true;
          return m;
        },
        (err) => {
          settled = true;
          throw err;
        },
      );
      while (!settled) {
        await Promise.race([finished.catch(() => undefined), sleep(40)]);
        while (flushed < buffer.length) {
          emittedText = true;
          yield { type: "text", text: buffer[flushed++] };
        }
      }
      message = await finished;
      while (flushed < buffer.length) {
        emittedText = true;
        yield { type: "text", text: buffer[flushed++] };
      }
    } catch (err) {
      // Il testo già arrivato non si butta: l'utente lo ha davanti.
      while (flushed < buffer.length) {
        emittedText = true;
        yield { type: "text", text: buffer[flushed++] };
      }
      const reason = classifyError(err, signal);
      // Se la risposta non era ancora iniziata, al suo posto va il messaggio di ripiego —
      // tranne quando è stata la persona a interrompere: lì non c'è niente da spiegare.
      if (!emittedText && reason !== "aborted") yield { type: "text", text: fallbackText(locale) };
      yield { type: "error", reason };
      return;
    }

    const toolUses = message.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
    );

    if (toolUses.length === 0) {
      if (shownListings.length > 0) yield { type: "listings", listings: shownListings };
      yield { type: "done" };
      return;
    }

    // Turno assistant con i blocchi tool_use, seguito dai tool_result nello stesso messaggio
    // utente (richiesto dall'API quando gli strumenti sono più d'uno).
    messages.push({ role: "assistant", content: message.content });
    const results: Anthropic.ToolResultBlockParam[] = [];
    for (const tu of toolUses) {
      yield { type: "tool", name: tu.name };
      const outcome = await runTool(tu.name, tu.input, toolCtx);
      if (outcome.listings) shownListings = outcome.listings;
      results.push({
        type: "tool_result",
        tool_use_id: tu.id,
        content: outcome.content,
        ...(outcome.isError ? { is_error: true } : {}),
      });
    }
    messages.push({ role: "user", content: results });
  }

  // Non raggiungibile: l'ultimo giro è senza strumenti e quindi esce sopra. Rete di sicurezza.
  yield { type: "done" };
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function classifyError(err: unknown, signal?: AbortSignal): AssistantFailure {
  if (signal?.aborted) return "aborted";
  if (err instanceof Anthropic.APIUserAbortError) return "aborted";
  if (err instanceof Anthropic.APIConnectionTimeoutError) return "timeout";
  // Il motivo tecnico resta nei log del server: mai il contenuto della conversazione.
  console.error("[assistant] turno fallito:", err instanceof Error ? err.message : err);
  return "provider-error";
}
