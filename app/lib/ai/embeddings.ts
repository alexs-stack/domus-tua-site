// Embeddings via Voyage AI (consigliato nell'ecosistema Anthropic) per il ranking semantico.
// Difensivo: se la chiave manca o la chiamata fallisce, ritorna null e il chiamante
// usa il ranking per parole chiave. Nessuna dipendenza npm: solo fetch all'API.

import { VOYAGE_API_KEY, VOYAGE_MODEL, semanticEnabled } from "./config";

type VoyageResponse = { data?: { embedding?: number[] }[] };

/**
 * Calcola gli embeddings di una lista di testi. `inputType` distingue documento vs query
 * (Voyage ottimizza il retrieval). Ritorna null su qualsiasi errore.
 */
export async function embed(
  texts: string[],
  inputType: "document" | "query",
): Promise<number[][] | null> {
  if (!semanticEnabled || texts.length === 0) return null;
  try {
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
        output_dimension: 512, // compatto: tiene la cache dei vettori ben sotto i limiti
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as VoyageResponse;
    const out = data.data?.map((d) => d.embedding).filter((e): e is number[] => Array.isArray(e));
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
