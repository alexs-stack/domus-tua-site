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

export type DetectedItem = { sold: boolean; cover: string };
const detectedItems = (detected.items ?? {}) as Record<string, DetectedItem>;
const manualOverrides = (manual.overrides ?? {}) as Record<string, boolean>;

/**
 * Risoluzione PURA dello stato venduto (testabile con fixture). Precedenza:
 *  1) override MANUALE dell'agenzia (vince sempre): true = venduto, false = disponibile
 *     (utile per correggere un falso positivo/negativo dell'OCR);
 *  2) esito OCR: valido SOLO se la copertina non è cambiata da quando è stato generato
 *     (foto sostituita → si aspetta la prossima esecuzione di detect-sold).
 */
export function resolveSold(
  codice: string,
  cover: string,
  manualOv: Record<string, boolean>,
  detectedIt: Record<string, DetectedItem>,
): boolean {
  if (codice in manualOv) return manualOv[codice]!;
  const d = detectedIt[codice];
  return !!d && d.sold && d.cover === cover;
}

/**
 * True se l'immobile risulta venduto/affittato (usa le mappe reali: sold-manual + sold-detected).
 *
 * @param codice codice gestionale (chiave primaria RealSmart)
 * @param cover  URL della copertina corrente
 */
export function isListingSold(codice: string, cover: string): boolean {
  return resolveSold(codice, cover, manualOverrides, detectedItems);
}
