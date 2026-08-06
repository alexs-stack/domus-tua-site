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
 * NON HA PIÙ UN DEFAULT, ed è una decisione presa su una misura (2026-08-06,
 * `npm run calibrate:semantic` su gemini-embedding-001):
 *
 *                                      soglia assoluta      z (quanto svetta)
 *     domanda pertinente più debole              0.550                 -0.475
 *     domanda fuori corpus più vicina            0.667                  3.159
 *
 * I due gruppi si sovrappongono: non esiste una soglia che li separi. "Che voto avete su
 * Google?" arriva a 0,625 contro `valutazione-immobile` — col vecchio default di 0,6
 * sarebbe passata, aggirando per caso la voce `reputazione-recensioni`, che è disabilitata
 * APPOSTA. Provata anche la strada relativa (z-score: "somiglia a UNA voce più che alle
 * altre?"), che va persino peggio. Verificato a 512, 1536 e 3072 dimensioni: non è un
 * artefatto del troncamento dei vettori.
 *
 * Quindi: il livello semantico sulla knowledge base è SPENTO finché qualcuno non scrive un
 * numero in `ASSISTANT_SEMANTIC_FLOOR`. Non è un interruttore da girare a occhio — è il
 * modo di dire "ho misurato, ed ecco il valore". Con un altro modello di embeddings la
 * forbice potrebbe esistere: rimisura prima di accendere.
 *
 * Il ranking semantico della RICERCA immobili non è toccato: là i vettori servono a
 * ORDINARE candidati già filtrati, non a decidere se qualcosa è pertinente. Senza soglia
 * da superare, la sovrapposizione misurata qui non lo riguarda.
 */
const configuredFloor = Number(process.env.ASSISTANT_SEMANTIC_FLOOR);
export const SEMANTIC_FLOOR = Number.isFinite(configuredFloor) && configuredFloor > 0
  ? configuredFloor
  : null;

/** Testo rappresentativo di una voce per l'embedding. */
export function entryText(entry: KnowledgeEntry): string {
  return `${entry.title}. ${entry.content} ${entry.keywords.join(", ")}`.trim();
}

/**
 * Impronta del corpus verificato: cambia se cambia una sola parola di una sola voce.
 *
 * Serve nella chiave della cache, e non è un dettaglio. La Data Cache di Vercel sopravvive
 * ai deploy: con una chiave fissa, riscrivere una voce avrebbe lasciato in giro i vettori
 * del testo VECCHIO per un'altra giornata intera, cioè un retrieval semantico che punta a
 * frasi non più esistenti mentre il lessicale è già aggiornato. Con l'impronta nella
 * chiave, un corpus nuovo è semplicemente una voce di cache nuova.
 *
 * FNV-1a a 32 bit: non è crittografia, è un modo compatto di dire "questo testo è cambiato".
 */
function corpusFingerprint(entries: KnowledgeEntry[]): string {
  let hash = 0x811c9dc5;
  for (const entry of entries) {
    const text = `${entry.id} ${entryText(entry)} `;
    for (let i = 0; i < text.length; i++) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
  }
  return (hash >>> 0).toString(36);
}

/**
 * Vettori delle voci verificate, calcolati una volta e messi in cache.
 * Il corpus vive nel codice, quindi cambia solo con un deploy: la finestra di rivalidazione
 * è lunga, l'impronta nella chiave garantisce che un deploy che tocca i testi non riusi i
 * vettori vecchi, e il tag permette comunque di invalidare a mano.
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

export const getKnowledgeVectors = unstable_cache(
  loadVectors,
  ["assistant-knowledge-vectors-v2", corpusFingerprint(verifiedEntries())],
  {
    revalidate: 24 * 60 * 60,
    tags: ["assistant-knowledge"],
  },
);

/**
 * Similarità della domanda con ogni voce verificata.
 * Ritorna null quando il livello semantico non è disponibile: è il segnale al chiamante
 * di proseguire col solo lessicale, non un errore.
 */
export async function semanticScores(query: string): Promise<Map<string, number> | null> {
  // Serve un provider di embeddings E una soglia misurata. Senza la seconda il livello
  // resta spento anche quando la chiave c'è: vedi SEMANTIC_FLOOR.
  if (!semanticEnabled || SEMANTIC_FLOOR === null) return null;

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
