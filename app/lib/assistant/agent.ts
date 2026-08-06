// Loop dell'agente conversazionale.
//
// Espone un async generator di AssistantEvent: la route lo trasforma in SSE senza
// conoscere nulla del provider AI. Il modello è iniettabile, quindi tutta questa logica è
// testabile in modo deterministico con MockLanguageModelV4 (ai/test), senza rete.
//
// Garanzie:
//  - non lancia mai: qualsiasi errore diventa un evento `error` seguito da `done`;
//  - termina sempre con `done`, anche su abort o timeout;
//  - senza provider AI configurato produce una risposta di fallback utile, non un errore.

import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogle, type GoogleGenerativeAIProviderOptions } from "@ai-sdk/google";
import { isStepCount, streamText, type LanguageModel, type ModelMessage } from "ai";
import {
  AI_PROVIDER,
  ANTHROPIC_API_KEY,
  GEMINI_API_KEY,
  ASSISTANT_MODEL,
  HISTORY_WINDOW,
  MAX_SHOWN_IN_PROMPT,
  MAX_OUTPUT_TOKENS,
  MAX_STEPS,
  TURN_TIMEOUT_MS,
  assistantAiEnabled,
} from "./config";
import { getAssistantListings, type AssistantListings } from "./listings";
import { FALLBACK_REPLY, buildSystemPrompt } from "./prompt";
import { createAssistantTools } from "./tools";
import type { AssistantEvent, ClientMessage, ListingCard } from "./types";

export interface RunTurnOptions {
  /** Cronologia già validata e ripulita dalla route. */
  messages: ClientMessage[];
  /** Pagina da cui scrive l'utente (percorso relativo), se nota. */
  pagePath?: string;
  /** Interruzione dal client (utente che preme "ferma" o chiude la pagina). */
  abortSignal?: AbortSignal;
  /** Override del modello: usato dai test. In produzione resta il default del provider attivo. */
  model?: LanguageModel;
  /** Override degli immobili: usato dai test per non dipendere dal feed. */
  listings?: AssistantListings;
  /**
   * Osservatore degli strumenti invocati. Server-only: i nomi dei tool NON entrano nello
   * stream verso il client. Serve all'eval per misurare se l'assistente sceglie lo strumento
   * giusto — la soglia più importante del programma dopo l'assenza di invenzioni.
   */
  onToolCall?: (toolName: string) => void;
}

/** Modello di produzione. Creato su richiesta: senza chiave non viene mai istanziato. */
function defaultModel(): LanguageModel {
  if (AI_PROVIDER === "google") {
    const google = createGoogle({ apiKey: GEMINI_API_KEY });
    return google(ASSISTANT_MODEL);
  }
  const anthropic = createAnthropic({ apiKey: ANTHROPIC_API_KEY });
  return anthropic(ASSISTANT_MODEL);
}

type StreamProviderOptions = Parameters<typeof streamText>[0]["providerOptions"];

/**
 * Opzioni del provider per il modello di produzione.
 *
 * Su Gemini 3 il ragionamento è ampio di default e si paga quasi tutto sul primo token.
 * Misurato con `npm run eval`, 100 casi reali su gemini-3.6-flash:
 *   - default (dinamico)       → 97/100, strumento 100%, p95 primo token 6032 ms
 *   - thinkingLevel "low"      → 98/100, strumento 100%, p95 3715 ms
 *   - thinkingLevel "minimal"  → 98/100, strumento 100%, p95 2124 ms
 * La qualità non cala: cala solo l'attesa. Da qui il minimo — che resta 124 ms sopra la
 * soglia di programma (p95 ≤ 2 s), l'unica non ancora raggiunta.
 *
 * ⚠️ Come leggere una p95 alta. Il 2026-08-06, quattro `npm run eval` di fila sulla stessa
 * chiave hanno dato p95 in salita monotona: 4569 → 5141 → 7370 → 8096 ms, con gli ultimi
 * casi che tornavano FALLBACK_REPLY senza aver chiamato alcuno strumento — cioè il provider
 * che rifiuta, non il modello che pensa. È la firma del rate limit, non di una regressione.
 * Prima di dare la colpa al codice: aspetta che la quota si liberi e rimisura su una sola
 * esecuzione. Una p95 che PEGGIORA a ogni run consecutivo non sta misurando il codice.
 *
 * Vale solo per i modelli gemini-3.x: `thinkingLevel` su 2.5 verrebbe rifiutato dall'API.
 * Con un modello iniettato (test, eval simulato) non si tocca nulla.
 */
function providerOptions(injected: boolean): StreamProviderOptions {
  if (injected || AI_PROVIDER !== "google" || !ASSISTANT_MODEL.startsWith("gemini-3")) {
    return undefined;
  }
  const options: GoogleGenerativeAIProviderOptions = { thinkingConfig: { thinkingLevel: "minimal" } };
  return { google: options };
}

/**
 * Ricostruisce l'elenco degli immobili già mostrati, tenendo SOLO quelli che esistono
 * ancora nel catalogo live. È la difesa contro l'immobile falso iniettato dal client:
 * uno slug inventato non entra nel prompt e non diventa contesto.
 */
function resolveShownListings(
  messages: ClientMessage[],
  listings: AssistantListings,
): ListingCard[] {
  const seen = new Set<string>();
  const cards: ListingCard[] = [];

  // Si scorre a RITROSO e si taglia a MAX_SHOWN_IN_PROMPT: gli ordinali ("la seconda")
  // guardano all'ultima ricerca, quindi i più recenti sono quelli che servono. Il tetto è
  // controllo dei costi — il numero di slug lo decide il client.
  for (const message of [...messages].reverse()) {
    if (cards.length >= MAX_SHOWN_IN_PROMPT) break;
    if (message.role !== "assistant" || !message.listingSlugs) continue;
    for (const slug of message.listingSlugs) {
      if (cards.length >= MAX_SHOWN_IN_PROMPT) break;
      if (seen.has(slug)) continue;
      const property = listings.properties.find((p) => p.slug === slug);
      if (!property) continue;
      seen.add(slug);
      cards.push({
        slug: property.slug,
        title: property.title,
        zone: property.zone,
        price: property.price,
        type: property.type,
        url: `/case/${property.slug}`,
        cover: property.cover,
      });
    }
  }

  // Rimessi in ordine cronologico: la numerazione mostrata al modello deve corrispondere
  // a quella che l'utente ha visto.
  return cards.reverse();
}

/** Cronologia → messaggi per il modello. Nessun blocco tool: quelli li ricostruisce il prompt. */
function toModelMessages(messages: ClientMessage[]): ModelMessage[] {
  return messages
    .slice(-HISTORY_WINDOW)
    .map((m) => ({ role: m.role, content: m.content }) satisfies ModelMessage);
}

/** Unisce l'abort del client con il timeout del turno. */
function turnSignal(external?: AbortSignal): AbortSignal {
  const timeout = AbortSignal.timeout(TURN_TIMEOUT_MS);
  return external ? AbortSignal.any([external, timeout]) : timeout;
}

export async function* runAssistantTurn(
  options: RunTurnOptions,
): AsyncGenerator<AssistantEvent, void, undefined> {
  // Senza provider AI l'assistente resta utile: risposta deterministica + canali umani.
  if (!assistantAiEnabled && !options.model) {
    yield { type: "text", value: FALLBACK_REPLY };
    yield { type: "done" };
    return;
  }

  const listings = options.listings ?? (await getAssistantListings());
  const shown = resolveShownListings(options.messages, listings);

  // Coda degli eventi prodotti dai tool durante l'esecuzione (card immobili, handoff).
  const pending: AssistantEvent[] = [];
  const tools = createAssistantTools({
    listings,
    pagePath: options.pagePath,
    emit: (event) => pending.push(event),
  });

  let produced = false;
  let failed = false;
  let truncated = false;

  try {
    const result = streamText({
      model: options.model ?? defaultModel(),
      providerOptions: providerOptions(options.model !== undefined),
      system: buildSystemPrompt(shown),
      messages: toModelMessages(options.messages),
      tools,
      stopWhen: isStepCount(MAX_STEPS),
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      abortSignal: turnSignal(options.abortSignal),
      // Il log resta server-side e senza contenuti della conversazione.
      onError({ error }) {
        console.error("[assistant] stream:", error instanceof Error ? error.message : "errore");
      },
    });

    for await (const part of result.stream) {
      while (pending.length > 0) yield pending.shift()!;

      if (part.type === "text-delta") {
        if (part.text.length > 0) {
          produced = true;
          yield { type: "text", value: part.text };
        }
        continue;
      }

      if (part.type === "tool-call") {
        options.onToolCall?.(part.toolName);
        continue;
      }

      // Tetto di token raggiunto: la frase si interrompe a metà. Va segnalato, altrimenti
      // il troncamento passa per una risposta finita.
      if (part.type === "finish") {
        if (part.finishReason === "length") truncated = true;
        continue;
      }

      if (part.type === "error") {
        failed = true;
        break;
      }

      if (part.type === "abort") {
        break;
      }
    }

    while (pending.length > 0) yield pending.shift()!;
  } catch (err) {
    // streamText normalmente non lancia (gli errori arrivano come parte `error`), ma un
    // fallimento a monte — provider non raggiungibile, chiave rifiutata — sì.
    failed = true;
    console.error("[assistant] turno fallito:", err instanceof Error ? err.message : "errore");
  }

  // L'ordine conta: prima si garantisce che ci sia SEMPRE del testo, poi si segnala
  // l'eventuale incompletezza. Un evento "incomplete" su una bolla vuota non direbbe nulla.
  if (!produced) {
    // Nessun testo: provider caduto, oppure il modello si è fermato dopo i tool
    // (es. limite di passi). Meglio una chiusura deterministica che una bolla vuota.
    yield { type: "text", value: FALLBACK_REPLY };
    if (failed) yield { type: "error", value: { code: "provider-unavailable" } };
  } else if (failed) {
    // Testo parziale già a schermo: non lo buttiamo via, ma diciamo che manca il seguito.
    yield { type: "incomplete", value: { reason: "error" } };
  } else if (truncated) {
    yield { type: "incomplete", value: { reason: "length" } };
  }

  yield { type: "done" };
}
