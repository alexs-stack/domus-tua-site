// Embeddings per il ranking semantico, da Voyage oppure da Gemini.
//
// Due strade perché la prima, da sola, ha tenuto spento per mesi un livello già scritto:
// Voyage vuole una chiave in più, di un fornitore in più. Gemini gli embeddings li fa e la
// sua chiave è già lì. Chi risponde lo decide `EMBEDDINGS_PROVIDER` in config.ts.
//
// Difensivo, e questo NON cambia: se non c'è provider, o la chiamata fallisce, o va in
// timeout, la funzione ritorna null e il chiamante usa il ranking per parole chiave.
// Nessuno dei due percorsi può far cadere una risposta.

import { createGoogle } from "@ai-sdk/google";
import { embedMany } from "ai";
import {
  EMBEDDINGS_DIMENSION,
  EMBEDDINGS_PROVIDER,
  GEMINI_API_KEY,
  GEMINI_EMBEDDING_MODEL,
  VOYAGE_API_KEY,
  VOYAGE_MODEL,
} from "./config";

type VoyageResponse = { data?: { embedding?: number[] }[] };

/** Timeout condiviso: un ranking lento vale meno di un ranking assente ma immediato. */
const TIMEOUT_MS = 10000;

async function embedVoyage(texts: string[], inputType: "document" | "query") {
  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      authorization: `Bearer ${VOYAGE_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: VOYAGE_MODEL,
      input: texts,
      input_type: inputType,
      output_dimension: EMBEDDINGS_DIMENSION,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as VoyageResponse;
  return data.data?.map((d) => d.embedding).filter((e): e is number[] => Array.isArray(e)) ?? null;
}

async function embedGemini(texts: string[], inputType: "document" | "query") {
  const google = createGoogle({ apiKey: GEMINI_API_KEY });
  // `taskType` è l'equivalente di `input_type` su Voyage: dice al modello se sta indicizzando
  // o se sta cercando. Ometterlo costa precisione sulle domande brevi, che sono quasi tutte.
  const { embeddings } = await embedMany({
    model: google.textEmbeddingModel(GEMINI_EMBEDDING_MODEL),
    values: texts,
    abortSignal: AbortSignal.timeout(TIMEOUT_MS),
    providerOptions: {
      google: {
        outputDimensionality: EMBEDDINGS_DIMENSION,
        taskType: inputType === "query" ? "RETRIEVAL_QUERY" : "RETRIEVAL_DOCUMENT",
      },
    },
  });
  return embeddings;
}

/**
 * Calcola gli embeddings di una lista di testi. `inputType` distingue documento vs query:
 * entrambi i provider ne tengono conto per il retrieval. Ritorna null su qualsiasi errore.
 *
 * Il controllo finale sulla lunghezza vale per tutti e due: un provider che restituisce
 * meno vettori dei testi chiesti disallineerebbe l'accoppiamento vettore↔voce, e da lì in
 * poi ogni similarità sarebbe calcolata contro il documento sbagliato. Meglio null.
 */
export async function embed(
  texts: string[],
  inputType: "document" | "query",
): Promise<number[][] | null> {
  if (EMBEDDINGS_PROVIDER === null || texts.length === 0) return null;
  try {
    const out =
      EMBEDDINGS_PROVIDER === "voyage"
        ? await embedVoyage(texts, inputType)
        : await embedGemini(texts, inputType);
    return out && out.length === texts.length ? out : null;
  } catch {
    return null;
  }
}

/** Similarità coseno tra due vettori della stessa dimensione. */
export function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
