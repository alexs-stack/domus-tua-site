// Livello semantico OPZIONALE del retrieval sulla knowledge base.
//
// Serve a coprire le domande formulate con parole diverse da quelle del corpus
// ("mi conviene affidarmi a voi?" → processo di vendita). È un'aggiunta, non una sostituzione:
// il retrieval lessicale resta sempre attivo e sufficiente da solo.
//
// Difensivo per costruzione: senza VOYAGE_API_KEY, o se la chiamata fallisce o va in timeout,
// tutto qui dentro ritorna null e il chiamante prosegue col solo lessicale. L'assistente non
// deve MAI dipendere da questo file per funzionare.
//
// Nessun vector database: il corpus è di decine di voci e i vettori stanno in una Map in
// cache. Introdurre un database vettoriale ora sarebbe infrastruttura senza beneficio.

import { unstable_cache } from "next/cache";
import { cosine, embed } from "../../ai/embeddings";
import { semanticEnabled } from "../../ai/config";
import { verifiedEntries, type KnowledgeEntry } from "./entries";

/**
 * Similarità minima perché una voce sia considerata pertinente.
 *
 * È la guardia di onestà del livello semantico: la ricerca vettoriale restituisce sempre
 * "la cosa più vicina", anche quando niente è vicino. Senza una soglia, una domanda fuori
 * corpus otterrebbe comunque una fonte e l'assistente risponderebbe a fianco della domanda
 * invece di ammettere che non lo sa.
 *
 * ⚠️ Valore di partenza prudente, NON ancora tarato su dati reali: serve VOYAGE_API_KEY per
 * misurarlo. Fino ad allora conviene tenerlo alto: essere troppo selettivi costa una
 * risposta "non lo so" (recuperabile), essere troppo permissivi costa una risposta sbagliata.
 */
export const SEMANTIC_FLOOR = Number(process.env.ASSISTANT_SEMANTIC_FLOOR) || 0.6;

/** Testo rappresentativo di una voce per l'embedding. */
function entryText(entry: KnowledgeEntry): string {
  return `${entry.title}. ${entry.content} ${entry.keywords.join(", ")}`.trim();
}

/**
 * Vettori delle voci verificate, calcolati una volta e messi in cache.
 * Il corpus vive nel codice, quindi cambia solo con un deploy: la finestra di rivalidazione
 * è lunga e il tag permette comunque di invalidare a mano.
 */
const loadVectors = async (): Promise<Record<string, number[]> | null> => {
  const entries = verifiedEntries();
  if (entries.length === 0) return null;

  const vectors = await embed(entries.map(entryText), "document");
  if (!vectors) return null;

  const map: Record<string, number[]> = {};
  entries.forEach((entry, i) => {
    if (vectors[i]) map[entry.id] = vectors[i];
  });
  return map;
};

export const getKnowledgeVectors = unstable_cache(loadVectors, ["assistant-knowledge-vectors-v1"], {
  revalidate: 24 * 60 * 60,
  tags: ["assistant-knowledge"],
});

/**
 * Similarità della domanda con ogni voce verificata.
 * Ritorna null quando il livello semantico non è disponibile: è il segnale al chiamante
 * di proseguire col solo lessicale, non un errore.
 */
export async function semanticScores(query: string): Promise<Map<string, number> | null> {
  if (!semanticEnabled) return null;

  try {
    const [vectors, queryVectors] = await Promise.all([
      getKnowledgeVectors(),
      embed([query], "query"),
    ]);
    const queryVector = queryVectors?.[0];
    if (!vectors || !queryVector) return null;

    const scores = new Map<string, number>();
    for (const [id, vector] of Object.entries(vectors)) {
      scores.set(id, cosine(queryVector, vector));
    }
    return scores;
  } catch (err) {
    // Il livello semantico non deve mai far cadere una risposta.
    console.error(
      "[assistant] retrieval semantico non disponibile:",
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}
