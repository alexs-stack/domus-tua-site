// Lettura a runtime dello stato "venduto" derivato dalle copertine.
//
// Due sorgenti, in ordine di priorità:
//  1) sold-manual.json  → override manuali dell'agenzia (vincono sempre): true = forza venduto,
//     false = forza disponibile (utile per correggere un raro falso positivo/negativo OCR).
//  2) sold-detected.json → esito dell'OCR sulle copertine (scripts/detect-sold.ts).
//
// Costo ZERO a runtime: sono due import JSON statici, nessuna rete, nessun OCR nel percorso di
// richiesta. La rigenerazione avviene offline/in CI (vedi scripts/detect-sold.ts).

import detected from "./sold-detected.json";
import manual from "./sold-manual.json";

type DetectedItem = { sold: boolean; cover: string };
const detectedItems = (detected.items ?? {}) as Record<string, DetectedItem>;
const manualOverrides = (manual.overrides ?? {}) as Record<string, boolean>;

/**
 * True se l'immobile risulta venduto/affittato.
 *
 * @param codice codice gestionale (chiave primaria RealSmart)
 * @param cover  URL della copertina corrente; l'esito OCR è considerato valido SOLO se la
 *               copertina non è cambiata da quando è stato generato (se l'agenzia sostituisce
 *               la foto, si aspetta la prossima esecuzione di detect-sold invece di fidarsi
 *               di un dato potenzialmente stantìo).
 */
export function isListingSold(codice: string, cover: string): boolean {
  if (codice in manualOverrides) return manualOverrides[codice];
  const d = detectedItems[codice];
  return !!d && d.sold && d.cover === cover;
}
