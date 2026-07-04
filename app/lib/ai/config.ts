// Configurazione della ricerca AI per gli immobili.
// Tutto opt-in via env var (server-only): senza chiavi la ricerca resta comunque
// funzionante grazie al parser locale + ranking per parole chiave (vedi parseQuery.ts / rank.ts).

/** Chiave Anthropic per il parsing della frase in filtri (Claude Haiku). Vuota = parser locale. */
export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";

/** Modello usato per il parsing. Haiku 4.5: veloce ed economico, adatto al task. */
export const AI_SEARCH_MODEL = process.env.AI_SEARCH_MODEL || "claude-haiku-4-5-20251001";

/** Chiave Voyage per gli embeddings (ranking semantico). Vuota = ranking per parole chiave. */
export const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY || "";

/** Modello embeddings Voyage (override via env se cambia). */
export const VOYAGE_MODEL = process.env.VOYAGE_MODEL || "voyage-3.5-lite";

/** true se possiamo usare Claude per il parsing (altrimenti: parser locale deterministico). */
export const aiParseEnabled = ANTHROPIC_API_KEY.length > 0;

/** true se possiamo usare gli embeddings (altrimenti: ranking per parole chiave). */
export const semanticEnabled = VOYAGE_API_KEY.length > 0;

/** Lunghezza massima della query accettata (guardrail anti-abuso). */
export const MAX_QUERY_LEN = 300;
