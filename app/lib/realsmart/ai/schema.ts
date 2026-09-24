// Schema STRETTO dell'output del modello + contratto del modello (iniettabile).
//
// Il modello deve restituire SOLO `{ paragrafi: string[] }`: riscrive la narrativa, niente altro.
// Campi sconosciuti = rifiuto. Nessun campo per fatti, indirizzi, prezzi: quelli vengono dalla
// fonte, non dal modello (i guard deterministici lo fanno rispettare a valle).

import { z } from "zod";

export const CopyOutputSchema = z
  .object({
    paragrafi: z.array(z.string().trim().min(1)).min(1).max(8),
  })
  .strict(); // .strict() = qualunque chiave in più fa fallire il parse

export type CopyOutput = z.infer<typeof CopyOutputSchema>;

export type ParseResult =
  | { ok: true; value: CopyOutput }
  | { ok: false; reason: string };

/** Parsa in modo difensivo il testo del modello (JSON) contro lo schema stretto. Non lancia. */
export function parseModelOutput(raw: string): ParseResult {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    // A volte i modelli avvolgono il JSON in ```json … ```: un tentativo di recupero, poi si molla.
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) return { ok: false, reason: "output-non-json" };
    try {
      json = JSON.parse(m[0]);
    } catch {
      return { ok: false, reason: "output-non-json" };
    }
  }
  const parsed = CopyOutputSchema.safeParse(json);
  if (!parsed.success) {
    return { ok: false, reason: `schema-invalido:${parsed.error.issues[0]?.path.join(".") || "?"}` };
  }
  return { ok: true, value: parsed.data };
}

/** Uso del modello per una generazione, restituito insieme al testo. */
export interface ModelUsage {
  inputTokens: number;
  outputTokens: number;
}

/**
 * Contratto del modello di copy. Iniettabile: in produzione lo avvolge il provider Gemini
 * (docs/ai-enrichment.md), nei test un modello FINTO. Non deve mai lanciare per input normali;
 * per timeout/errore rete lancia, e il core lo gestisce come fallback.
 */
export interface CopyModel {
  provider: string;
  model: string;
  generate(input: { prompt: string; timeoutMs: number }): Promise<{ text: string; usage: ModelUsage }>;
}
