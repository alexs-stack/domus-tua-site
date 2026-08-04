// Configurazione della ricerca AI per gli immobili.
// Tutto opt-in via env var (server-only): senza chiavi la ricerca resta comunque
// funzionante grazie al parser locale + ranking per parole chiave (vedi parseQuery.ts / rank.ts).

import { AI_PROVIDER, ANTHROPIC_API_KEY, GEMINI_API_KEY, aiEnabled, byProvider } from "./provider";

export { AI_PROVIDER, ANTHROPIC_API_KEY, GEMINI_API_KEY };

/**
 * Modello usato per il parsing della frase in filtri, per provider.
 *
 * Gemini 2.5 Flash e non Flash Lite: a parità di latenza (~0,9 s) la Lite si è messa a
 * inventare caratteristiche mai chieste — su "bilocale luminoso a Como senza giardino"
 * aggiungeva Ascensore e Aria condizionata, che poi filtrano via risultati buoni.
 * Su Claude resta Haiku 4.5, stessa classe di costo e latenza.
 * Gli ID sono nelle union tipizzate dei rispettivi provider (verificato in
 * node_modules/@ai-sdk/google e node_modules/@ai-sdk/anthropic).
 */
export const AI_SEARCH_MODEL =
  process.env.AI_SEARCH_MODEL ||
  byProvider({ google: "gemini-2.5-flash", anthropic: "claude-haiku-4-5-20251001" });

/** Chiave Voyage per gli embeddings (ranking semantico). Vuota = ranking per parole chiave. */
export const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY || "";

/** Modello embeddings Voyage (override via env se cambia). */
export const VOYAGE_MODEL = process.env.VOYAGE_MODEL || "voyage-3.5-lite";

/** true se possiamo usare un modello per il parsing (altrimenti: parser locale deterministico). */
export const aiParseEnabled = aiEnabled;

/** true se possiamo usare gli embeddings (altrimenti: ranking per parole chiave). */
export const semanticEnabled = VOYAGE_API_KEY.length > 0;

/** Lunghezza massima della query accettata (guardrail anti-abuso). */
export const MAX_QUERY_LEN = 300;
