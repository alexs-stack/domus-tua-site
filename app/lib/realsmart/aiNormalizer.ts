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
 * Il normalizzatore AI attivo, oppure `null` (deterministico).
 * Acceso SOLO con `REALSMART_AI_NORMALIZE="true"` E una chiave server-only
 * presente. Oggi torna sempre `null`: il provider reale non è agganciato, e il
 * deterministico resta il default. La chiave non viene mai letta nel valore, solo
 * nella presenza.
 */
export function getAiNormalizer(): AiNormalizer | null {
  if (process.env.REALSMART_AI_NORMALIZE !== "true") return null;
  const hasKey = (process.env.GEMINI_API_KEY ?? "").trim().length > 0;
  if (!hasKey) return null;
  // Aggancio futuro del provider reale dietro `AiNormalizer`. Finché non esiste,
  // il deterministico resta l'unica strada (nessun falso "AI on" senza codice).
  return null;
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
