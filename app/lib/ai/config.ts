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

/** Chiave Voyage per gli embeddings (ranking semantico). Vuota = si guarda a Gemini. */
export const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY || "";

/** Modello embeddings Voyage (override via env se cambia). */
export const VOYAGE_MODEL = process.env.VOYAGE_MODEL || "voyage-3.5-lite";

/** Modello embeddings Gemini. ID verificato in node_modules/@ai-sdk/google. */
export const GEMINI_EMBEDDING_MODEL =
  process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001";

/**
 * Chi calcola gli embeddings. `null` = nessuno, e il ranking resta per parole chiave.
 *
 * Voyage per primo quando c'è: è un modello nato per il retrieval, ed è la scelta storica
 * del progetto. Ma legare gli embeddings a una SECONDA chiave, di un fornitore in più da
 * aprire e da pagare, ha tenuto spento per mesi un livello già scritto e già testato.
 * Gemini gli embeddings li fa, e la sua chiave è già configurata: la seconda strada esiste
 * per questo, non perché il modello sia migliore.
 *
 * Solo con `AI_PROVIDER=google`: su Claude non ci sono embeddings di prima parte, e usare
 * Gemini solo per i vettori significherebbe una chiave in più — cioè esattamente il
 * problema da cui veniamo.
 */
export type EmbeddingsProvider = "voyage" | "google";

export const EMBEDDINGS_PROVIDER: EmbeddingsProvider | null =
  VOYAGE_API_KEY.length > 0 ? "voyage" : AI_PROVIDER === "google" && GEMINI_API_KEY ? "google" : null;

/** Nome del modello effettivamente in uso, per i report. Vuoto se non c'è provider. */
export const EMBEDDINGS_MODEL =
  EMBEDDINGS_PROVIDER === "voyage"
    ? VOYAGE_MODEL
    : EMBEDDINGS_PROVIDER === "google"
      ? GEMINI_EMBEDDING_MODEL
      : "";

/**
 * Dimensione dei vettori, uguale per entrambi i provider.
 *
 * Compatta di proposito: i vettori del corpus e dei ~200 immobili stanno in una voce di
 * cache, che ha un limite. Su Gemini una dimensione ridotta produce vettori NON normalizzati
 * — irrilevante qui, perché `cosine()` normalizza per conto suo.
 */
export const EMBEDDINGS_DIMENSION = Number(process.env.EMBEDDINGS_DIMENSION) || 512;

/** true se possiamo usare un modello per il parsing (altrimenti: parser locale deterministico). */
export const aiParseEnabled = aiEnabled;

/** true se possiamo usare gli embeddings (altrimenti: ranking per parole chiave). */
export const semanticEnabled = EMBEDDINGS_PROVIDER !== null;

/** Lunghezza massima della query accettata (guardrail anti-abuso). */
export const MAX_QUERY_LEN = 300;
