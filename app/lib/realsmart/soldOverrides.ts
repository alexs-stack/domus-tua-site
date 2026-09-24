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

/**
 * Quanti immobili sono coperti dalla mappa dei venduti.
 *
 * Serve a `/api/health`: un deploy in cui la mappa è vuota mostrerebbe come disponibili
 * immobili già venduti — è la cosa peggiore che questo sito possa fare, e va vista subito.
 * Conta gli esiti (OCR + override manuali), non i loro contenuti.
 */
export function soldMapSize(): { detected: number; manual: number } {
  return {
    detected: Object.keys(detectedItems).length,
    manual: Object.keys(manualOverrides).length,
  };
}

/**
 * Badge che attestano una trattativa AVVIATA, non una vendita CONCLUSA.
 *
 * L'agenzia sovrappone alla copertina badge diversi lungo il percorso: «PROPOSTA
 * ACCETTATA» quando l'offerta è stata accettata, «PRELIMINARE» a compromesso firmato,
 * «IN TRATTATIVA», e infine «VENDUTO». I primi tre significano che l'immobile non è più
 * disponibile — ma non che sia stato venduto: un preliminare può ancora saltare.
 */
const PRE_COMPLETION = /PRELIMIN|PROPOST|ACCETT|COMPROM|TRATTATIV|RISERV/i;

/**
 * L'immobile è stato VENDUTO davvero, non soltanto impegnato?
 *
 * DUE DOMANDE DIVERSE, DUE PREDICATI DIVERSI — e confonderle costa caro in direzioni
 * opposte:
 *
 *  • `isListingSold` risponde a «lo posso ancora mostrare fra i disponibili?». Lì conviene
 *    essere LARGHI: un immobile con il preliminare firmato non deve comparire in vetrina.
 *    Sbagliare per eccesso nasconde una casa; sbagliare per difetto la vende due volte.
 *
 *  • questa risponde a «posso dire che l'abbiamo venduto?». Qui bisogna essere STRETTI,
 *    perché è un'affermazione pubblica sui risultati dell'agenzia. Al 2026-08-08 il
 *    catalogo conteneva 9 schede con badge «PRELIMINARE» o «PROPOSTA ACCETTATA» marcate
 *    come vendute: nella vetrina è giusto che siano fuori, in una pagina intitolata «le
 *    case che abbiamo venduto» sarebbero nove affermazioni non sostenute.
 *
 * Un override manuale dell'agenzia vale come attestazione diretta: se qualcuno in ufficio
 * ha scritto che quell'immobile è venduto, ne sa più dell'OCR.
 */
export function isCompletedSale(codice: string, cover: string): boolean {
  if (!isListingSold(codice, cover)) return false;
  if (codice in manualOverrides) return manualOverrides[codice];
  const text = (detectedItems[codice] as { text?: string } | undefined)?.text ?? "";
  return !PRE_COMPLETION.test(text);
}

/**
 * Quando è stato eseguito il rilevamento (ISO), o null se il file non lo dichiara.
 *
 * Serve a /case-vendute: quella pagina pubblica un conteggio di vendite, e un conteggio
 * senza la data a cui si riferisce è un numero che invecchia in silenzio. Dichiararla è
 * anche l'unica cosa onesta da fare, visto che lo stato "venduto" NON è un campo del feed
 * ma il risultato di un OCR fatto in un preciso momento (vedi scripts/detect-sold.ts).
 */
export function soldDetectionDate(): string | null {
  const at = (detected as { generatedAt?: string }).generatedAt;
  return typeof at === "string" && at.length > 0 ? at : null;
}
