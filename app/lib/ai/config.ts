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

// ─── Assistente conversazionale ──────────────────────────────────────────────
// Stesse chiavi server-only della ricerca. L'assistente è dietro un flag PUBBLICO separato:
// il backend può essere pronto (chiave presente) senza che il widget sia visibile.

/**
 * Modello dell'assistente. Haiku 4.5 è la scelta del progetto: veloce ed economico per un
 * assistente di sito, con gli strumenti a fare il lavoro deterministico. Si sostituisce con
 * AI_ASSISTANT_MODEL senza toccare il codice.
 */
export const AI_ASSISTANT_MODEL = process.env.AI_ASSISTANT_MODEL || "claude-haiku-4-5-20251001";

/** true se il widget è visibile sul sito. Distinto dalla configurazione del provider. */
export const assistantEnabled = process.env.NEXT_PUBLIC_ENABLE_ASSISTANT === "true";

/** true se il provider può rispondere. Senza chiave l'assistente resta sul fallback. */
export const assistantConfigured = ANTHROPIC_API_KEY.length > 0;

/** Tetto di token per risposta: contiene costo e latenza, e taglia le risposte fiume. */
export const ASSISTANT_MAX_TOKENS = 800;

/** Timeout per singola chiamata al provider (ms). */
export const ASSISTANT_TIMEOUT_MS = 25_000;

/** Quanti giri di strumenti al massimo in un turno, prima della risposta finale. */
export const ASSISTANT_MAX_TOOL_ROUNDS = 4;

/** Quanti messaggi di cronologia inviare al modello (la sessione vive solo nel client). */
export const ASSISTANT_MAX_HISTORY = 12;
