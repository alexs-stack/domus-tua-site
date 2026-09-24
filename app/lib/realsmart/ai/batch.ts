// Generazione a LOTTI (offline) + transizioni di revisione. Fuori dal percorso di richiesta.
//
// Controlli d'abuso/costo del mandato: tetto di batch, concorrenza, idempotenza (niente
// rigenerazione se la fonte non è cambiata), tetto di spesa e kill switch. Ogni generazione lascia
// un record con provenienza e costo. Niente pubblica in automatico: si producono `draft`.

import type { NormalizedProperty, RealSmartListingRaw } from "../types";
import { generateDraft } from "./generate";
import { sourceHash } from "./hash";
import type { CopyModel } from "./schema";
import type { GeneratedCopyStore } from "./store";
import { GENERATION_LIMITS, type GenerationLimits, type GeneratedCopyRecord } from "./record";

export interface BatchItem {
  base: NormalizedProperty;
  raw: RealSmartListingRaw;
}

export interface BatchSummary {
  requested: number;
  generated: number;
  skippedIdempotent: number;
  failed: { listingId: string; reason: string }[];
  totalCostUsd: number;
  stoppedBy: "completato" | "tetto-spesa" | "kill-switch" | "tetto-batch";
}

/**
 * Genera draft per un lotto di annunci. `now`/`killed` iniettabili (niente Date.now/env nel core).
 * Idempotente: salta gli annunci che hanno già un record per l'hash corrente della fonte.
 */
export async function generateBatch(
  items: readonly BatchItem[],
  model: CopyModel,
  store: GeneratedCopyStore,
  opts: {
    now: string;
    killed?: boolean;
    limits?: GenerationLimits;
    sleep?: (ms: number) => Promise<void>;
  },
): Promise<BatchSummary> {
  const limits = opts.limits ?? GENERATION_LIMITS;
  const summary: BatchSummary = {
    requested: items.length,
    generated: 0,
    skippedIdempotent: 0,
    failed: [],
    totalCostUsd: 0,
    stoppedBy: "completato",
  };

  if (opts.killed) {
    summary.stoppedBy = "kill-switch";
    return summary;
  }

  const capped = items.slice(0, limits.maxBatch);
  if (items.length > limits.maxBatch) summary.stoppedBy = "tetto-batch";

  // A blocchi di `concurrency`. Il tetto di spesa si controlla tra un blocco e l'altro.
  for (let i = 0; i < capped.length; i += limits.concurrency) {
    if (summary.totalCostUsd >= limits.costCapUsd) {
      summary.stoppedBy = "tetto-spesa";
      break;
    }
    const block = capped.slice(i, i + limits.concurrency);
    const results = await Promise.all(
      block.map(async (item) => {
        const hash = sourceHash(item.raw);
        // Idempotenza: già presente per questa fonte → nessun costo, nessuna rigenerazione.
        if (await store.get(item.base.sourceRef.codice, hash)) {
          return { kind: "skip" as const, id: item.base.sourceRef.codice };
        }
        const out = await generateDraft(item.base, item.raw, model, {
          now: opts.now,
          retries: limits.retries,
          timeoutMs: limits.timeoutMs,
          sleep: opts.sleep,
        });
        return out.ok
          ? { kind: "ok" as const, record: out.record, cost: out.record.provenance.cost.usd }
          : { kind: "fail" as const, id: item.base.sourceRef.codice, reason: out.reason, cost: out.cost?.usd ?? 0 };
      }),
    );
    for (const r of results) {
      if (r.kind === "skip") summary.skippedIdempotent += 1;
      else if (r.kind === "ok") {
        await store.put(r.record);
        summary.generated += 1;
        summary.totalCostUsd += r.cost;
      } else {
        summary.failed.push({ listingId: r.id, reason: r.reason });
        summary.totalCostUsd += r.cost;
      }
    }
  }

  return summary;
}

// ── Transizioni di revisione ─────────────────────────────────────────────────

async function transition(
  store: GeneratedCopyStore,
  listingId: string,
  sourceHash: string,
  patch: Partial<GeneratedCopyRecord>,
): Promise<GeneratedCopyRecord | null> {
  const rec = await store.get(listingId, sourceHash);
  if (!rec) return null;
  const next = { ...rec, ...patch };
  await store.put(next);
  return next;
}

export function submitForReview(store: GeneratedCopyStore, id: string, hash: string) {
  return transition(store, id, hash, { status: "review" });
}

export function approveCopy(store: GeneratedCopyStore, id: string, hash: string, reviewer: string, now: string) {
  return transition(store, id, hash, { status: "published", reviewedBy: reviewer, reviewedAt: now });
}

export function rejectCopy(store: GeneratedCopyStore, id: string, hash: string, reviewer: string, now: string) {
  return transition(store, id, hash, { status: "rejected", reviewedBy: reviewer, reviewedAt: now });
}
