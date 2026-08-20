// CORE della generazione: da annuncio normalizzato → PROPOSTA di copy (draft), o fallback sicuro.
//
// Ordine (mandato):
//  1. normalizzazione deterministica → arriva già fatta in `base`;
//  2. redazione indirizzi/telefoni PRIMA della chiamata al modello (guards.redactForPrompt);
//  3. prompt costruito SOLO dai campi sorgente (niente conoscenza esterna, niente area);
//  4. chiamata al modello (retry+backoff+timeout), output in schema STRETTO;
//  5. guard deterministici sull'output: indirizzo/telefono/claim-legale/numero inventato → SCARTO.
// Niente di tutto ciò pubblica: si produce un record `draft` che una revisione dovrà approvare.

import type { NormalizedProperty, RealSmartListingRaw } from "../types";
import { redactForPrompt, checkGeneratedText, type SourceFacts } from "./guards";
import { parseModelOutput, type CopyModel } from "./schema";
import { sourceHash } from "./hash";
import { PROMPT_VERSION, type GeneratedCopyRecord, type GenerationCost } from "./record";

// Tariffe indicative (USD per 1M token) — override d'ambiente. Servono al tetto di spesa e al
// report, non alla fatturazione: un ordine di grandezza, non un contratto.
const USD_PER_1M_INPUT = Number(process.env.REALSMART_AI_USD_IN) || 0.1;
const USD_PER_1M_OUTPUT = Number(process.env.REALSMART_AI_USD_OUT) || 0.4;

export function estimateCost(usage: { inputTokens: number; outputTokens: number }): GenerationCost {
  const usd =
    (usage.inputTokens / 1_000_000) * USD_PER_1M_INPUT +
    (usage.outputTokens / 1_000_000) * USD_PER_1M_OUTPUT;
  return { inputTokens: usage.inputTokens, outputTokens: usage.outputTokens, usd };
}

/** I fatti sorgente citabili: comune + i numeri dell'annuncio (mq/locali/camere/bagni/prezzo). */
export function sourceFactsOf(base: NormalizedProperty): SourceFacts {
  const numbers = [base.sqm, base.rooms, base.bedrooms, base.baths, base.price]
    .filter((n) => typeof n === "number" && n > 0)
    .map(String);
  return { comune: base.town, numbers };
}

/** Costruisce il prompt SOLO dal testo sorgente (già redatto) e dai fatti. Nessuna area, nessun web. */
export function buildPrompt(redactedParagraphs: string[], base: NormalizedProperty): string {
  const facts = sourceFactsOf(base);
  return [
    "Sei un editor immobiliare. Riscrivi la descrizione qui sotto in italiano, più chiara e calda,",
    "SENZA aggiungere fatti. Regole assolute:",
    "- usa SOLO le informazioni presenti nel testo e nei dati; non inventare metrature, distanze,",
    "  servizi, anni o toponimi; se un dato non c'è, non lo citare;",
    "- NIENTE indirizzi civici, NIENTE numeri di telefono, NIENTE affermazioni legali o di",
    "  conformità (a norma, conforme, certificato, sanato, agibile…);",
    "- non descrivere la zona/città (non è nell'incarico);",
    `- comune: ${facts.comune || "(non indicato)"}; numeri leciti: ${facts.numbers.join(", ") || "(nessuno)"}.`,
    'Rispondi SOLO con JSON: {"paragrafi": ["...", "..."]}. Nessun testo fuori dal JSON.',
    "",
    "TESTO SORGENTE:",
    redactedParagraphs.join("\n"),
  ].join("\n");
}

export type GenerationOutcome =
  | { ok: true; record: GeneratedCopyRecord }
  | { ok: false; reason: string; cost?: GenerationCost };

/**
 * Genera una PROPOSTA (draft) per un annuncio. `now` iniettato (niente Date.now nel core).
 * Non pubblica nulla. Non lancia: ogni errore/violazione diventa `{ ok:false, reason }`.
 */
export async function generateDraft(
  base: NormalizedProperty,
  raw: RealSmartListingRaw,
  model: CopyModel,
  opts: { now: string; retries?: number; timeoutMs?: number; sleep?: (ms: number) => Promise<void> },
): Promise<GenerationOutcome> {
  const retries = opts.retries ?? 2;
  const timeoutMs = opts.timeoutMs ?? 20_000;
  const sleep = opts.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));

  const facts = sourceFactsOf(base);
  const redacted = base.descriptionParagraphs.map((p) =>
    redactForPrompt(p, { showAddress: base.showAddress, comune: base.town }),
  );
  if (redacted.join("").trim().length === 0) return { ok: false, reason: "fonte-vuota" };

  const prompt = buildPrompt(redacted, base);

  // Chiamata con retry + backoff esponenziale. Il timeout è dentro il modello.
  let lastErr = "errore";
  let text = "";
  let usage = { inputTokens: 0, outputTokens: 0 };
  let called = false;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const r = await model.generate({ prompt, timeoutMs });
      text = r.text;
      usage = r.usage;
      called = true;
      break;
    } catch (err) {
      lastErr = err instanceof Error ? err.message : "errore";
      if (attempt < retries) await sleep(2 ** attempt * 200);
    }
  }
  if (!called) return { ok: false, reason: `provider-giu:${lastErr}` };

  const cost = estimateCost(usage);

  const parsed = parseModelOutput(text);
  if (!parsed.ok) return { ok: false, reason: parsed.reason, cost };

  // Guard deterministici su OGNI paragrafo generato. Una sola violazione → scarto l'intero output.
  const warnings: string[] = [];
  for (const par of parsed.value.paragrafi) {
    const g = checkGeneratedText(par, { showAddress: base.showAddress, source: facts });
    if (!g.ok) return { ok: false, reason: `guard:${g.violations.join(",")}`, cost };
    // Avviso non bloccante: paragrafo molto più lungo dell'originale = possibile deriva.
    if (par.length > 1200) warnings.push(`paragrafo lungo (${par.length})`);
  }

  const record: GeneratedCopyRecord = {
    listingId: base.sourceRef.codice,
    sourceHash: sourceHash(raw),
    status: "draft",
    paragraphs: parsed.value.paragrafi,
    warnings,
    provenance: {
      provider: model.provider,
      model: model.model,
      promptVersion: PROMPT_VERSION,
      generatedAt: opts.now,
      cost,
    },
  };
  return { ok: true, record };
}
