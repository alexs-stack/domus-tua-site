// Preparazione AI per la normalizzazione RealSmart — SCAFFOLD, spento di default.
//
// Regole (dal mandato):
//  • La normalizzazione DETERMINISTICA è il default e l'unica attiva finché non
//    si aggancia un provider reale. L'AI, se ci sarà, MIGLIORA campi già puliti,
//    non li sostituisce, e non è mai obbligatoria.
//  • Si abilita SOLO da configurazione d'ambiente SERVER-ONLY, e SOLO con una
//    chiave presente. Nessuna chiave reale vive nel codice o nei test.
//  • Un fallimento dell'AI ricade in modo sicuro sul deterministico.
//  • Si registra come metadato SE l'AI è stata usata (`normalizedBy`), senza mai
//    loggare contenuto sensibile o segreti.
//
// Il provider reale NON è incluso: `getAiNormalizer()` torna `null` finché non lo
// si implementa dietro questa interfaccia, così l'aggancio futuro non tocca la
// pipeline. I test iniettano un provider FINTO.

import type { NormalizedProperty, RealSmartListingRaw } from "./types";
import { sourceHash } from "./ai/hash";
import { InMemoryGeneratedCopyStore, type GeneratedCopyStore } from "./ai/store";

/** Come è stato prodotto il record: deterministico (default) o migliorato via AI. */
export type NormalizationSource = "deterministic" | "ai";

export interface AiNormalizer {
  /**
   * Migliora un annuncio GIÀ normalizzato in modo deterministico. Deve essere
   * puro rispetto all'ambiente (riceve tutto ciò che gli serve) e non lanciare;
   * in caso di dubbio torna `base` invariato. Non deve MAI inventare fatti.
   */
  enhance(base: NormalizedProperty, raw: RealSmartListingRaw): Promise<NormalizedProperty>;
}

/**
 * Normalizzatore che APPLICA la copy PUBLISHED da uno store — nessuna chiamata al modello nel
 * percorso di richiesta. La GENERAZIONE è offline (app/lib/realsmart/ai/batch.ts); qui si applica
 * solo ciò che una revisione ha già approvato. Difensivo:
 *  • senza record `published` per l'annuncio → torna `base` (deterministico);
 *  • se l'hash della fonte è cambiato dopo l'approvazione (annuncio modificato) → NON applica la
 *    copy vecchia, torna `base`. Così la copy pubblicata non diverge mai dalla fonte corrente.
 */
export function createPublishedCopyNormalizer(store: GeneratedCopyStore): AiNormalizer {
  return {
    async enhance(base, raw) {
      const published = await store.getPublished(base.sourceRef.codice);
      if (!published || published.sourceHash !== sourceHash(raw)) return base;
      return { ...base, descriptionParagraphs: published.paragraphs };
    },
  };
}

/**
 * Store di default: in-memory, per-processo. Non durevole tra deploy (nessun vendor aggiunto in
 * silenzio, per mandato). Il batch offline e il sito nello stesso processo condividono questo
 * store; in produzione va sostituito da uno durevole dietro `GeneratedCopyStore`.
 */
export const defaultCopyStore: GeneratedCopyStore =
  ((globalThis as unknown as { __dtCopyStore?: GeneratedCopyStore }).__dtCopyStore ??=
    new InMemoryGeneratedCopyStore());

/**
 * Il normalizzatore AI attivo, oppure `null` (deterministico).
 *
 * Non più `null` incondizionato: con `REALSMART_AI_NORMALIZE="true"` E una chiave server-only
 * presente, torna un normalizzatore che APPLICA la copy pubblicata dallo store. Senza record
 * pubblicati (lo stato di oggi, store in-memory vuoto), applica comunque nulla → deterministico.
 * La chiave è letta solo nella presenza, mai nel valore. `store` iniettabile per i test.
 */
export function getAiNormalizer(store: GeneratedCopyStore = defaultCopyStore): AiNormalizer | null {
  if (process.env.REALSMART_AI_NORMALIZE !== "true") return null;
  if ((process.env.GEMINI_API_KEY ?? "").trim().length === 0) return null;
  return createPublishedCopyNormalizer(store);
}

/**
 * Applica il normalizzatore AI se presente, con fallback SICURO al deterministico.
 * `ai` è iniettabile: in produzione arriva da `getAiNormalizer()` (di norma null),
 * nei test da un provider finto. Non lancia mai; non logga contenuto o segreti.
 */
export async function applyAiNormalization(
  base: NormalizedProperty,
  raw: RealSmartListingRaw,
  ai: AiNormalizer | null
): Promise<NormalizedProperty> {
  if (!ai) return base; // deterministico: il default
  try {
    const enhanced = await ai.enhance(base, raw);
    // Marchia "ai" SOLO se la copy è stata davvero applicata: enhance torna `base` invariato
    // quando non c'è nulla di pubblicato, e in quel caso resta deterministico (nessun falso "ai on").
    if (enhanced === base) return base;
    return { ...enhanced, normalizedBy: "ai" };
  } catch (err) {
    // Solo il MESSAGGIO dell'errore, mai il contenuto dell'annuncio o la chiave.
    console.error(
      `[realsmart] normalizzazione AI fallita (${base.sourceRef.codice}) → deterministico:`,
      err instanceof Error ? err.message : "errore"
    );
    return base;
  }
}
