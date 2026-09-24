// Cancello di RILASCIO del catalogo immobili — logica PURA e testabile.
//
// DISTINZIONE CHIAVE (Prompt 3). Il DEGRADO A RUNTIME e la SICUREZZA DI RILASCIO sono due cose
// diverse:
//   • a runtime, se il feed cade, il sito serve l'ultimo-buono ("stale") o fallisce chiuso
//     ("unavailable") con garbo — è tollerato, il resto del sito regge;
//   • un RILASCIO (promozione di un deploy in produzione) NON deve invece riuscire in silenzio
//     con un catalogo vuoto o implausibile quando il feed live è richiesto: promuoverebbe un sito
//     "senza immobili" come se fosse a posto.
// Questo modulo decide, dato lo stato osservato, se un rilascio è promuovibile — con un override
// ESPLICITO e auditabile per i casi eccezionali. Nessun accesso a rete/env: input → output.

import type { ListingsSource } from "./client";

/** Stato osservato del catalogo (da uno snapshot o da /api/health). */
export interface ReleaseStatus {
  source: ListingsSource;
  ok: boolean;
  itemCount: number;
}

/** Politica di rilascio (derivata dall'ambiente da chi chiama, qui è solo dato). */
export interface ReleasePolicy {
  /** true in produzione vera: il feed live è obbligatorio. */
  requireLive: boolean;
  /** Conteggio minimo plausibile di immobili per promuovere. */
  minListings: number;
  /** Override ESPLICITO e auditabile: promuovi anche se vuoto/degradato. */
  allowEmpty: boolean;
}

export type ReleaseVerdict = "READY" | "BLOCKED" | "OVERRIDDEN";

export interface ReleaseEvaluation {
  verdict: ReleaseVerdict;
  /** true se il rilascio può essere promosso. */
  ready: boolean;
  /** Motivi PII-safe (nessun URL/credenziale del feed). */
  reasons: string[];
}

/** Sorgente da gestionale REALE (live o ultimo-buono), citabile. */
function isRealSource(source: ListingsSource): boolean {
  return source === "live" || source === "stale";
}

/**
 * Valuta se un rilascio è promuovibile.
 *  • se il live NON è richiesto (dev/anteprima/mock voluto) → sempre READY;
 *  • se il live è richiesto → servono sorgente reale (live/stale) e itemCount ≥ minListings;
 *  • se la soglia non è rispettata ma c'è l'override → OVERRIDDEN (promuovibile, ma segnalato);
 *  • altrimenti → BLOCKED.
 */
export function evaluateRelease(status: ReleaseStatus, policy: ReleasePolicy): ReleaseEvaluation {
  if (!policy.requireLive) {
    return { verdict: "READY", ready: true, reasons: ["feed live non richiesto in questo ambiente"] };
  }

  const reasons: string[] = [];
  if (!isRealSource(status.source)) {
    reasons.push(`sorgente "${status.source}" non reale (attese: live/stale)`);
  }
  if (!status.ok) {
    reasons.push("snapshot non utilizzabile (fail-closed)");
  }
  if (status.itemCount < policy.minListings) {
    reasons.push(`solo ${status.itemCount} immobili, sotto la soglia minima di ${policy.minListings}`);
  }

  if (reasons.length === 0) {
    return { verdict: "READY", ready: true, reasons: [`${status.itemCount} immobili live/stale`] };
  }
  if (policy.allowEmpty) {
    return {
      verdict: "OVERRIDDEN",
      ready: true,
      reasons: ["override REALSMART_ALLOW_EMPTY_RELEASE attivo — promozione forzata:", ...reasons],
    };
  }
  return { verdict: "BLOCKED", ready: false, reasons };
}
