// Regole di APPROVABILITÀ di un fatto d'area (Prompt 9): cosa impedisce di approvarlo/pubblicarlo.

import { findSubjectiveViolations } from "./subjective";
import type { AreaFact } from "./types";

export class AreaApprovalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AreaApprovalError";
  }
}

/**
 * Approva un fatto d'area (editoriale): fallisce se ci sono blocker (soggettivo/conflitti/scaduto).
 * Ritorna un NUOVO fatto approvato con traccia. Nessun auto-approve: sempre esplicito.
 */
export function approveAreaFact(fact: AreaFact, actor: { approver: string; at: string }): AreaFact {
  const blockers = approvalBlockers(fact, new Date(actor.at));
  if (blockers.length > 0) {
    throw new AreaApprovalError(`Fatto ${fact.id} non approvabile: ${blockers.join("; ")}`);
  }
  return { ...fact, status: "approved", approvedBy: actor.approver, approvedAt: actor.at };
}

/** Rifiuta un fatto d'area con traccia. */
export function rejectAreaFact(fact: AreaFact, actor: { approver: string; at: string }): AreaFact {
  return { ...fact, status: "rejected", approvedBy: actor.approver, approvedAt: actor.at };
}

/**
 * Ritorna i motivi (vuoto = ok) per cui un fatto NON può essere approvato/pubblicato:
 *  • linguaggio soggettivo nella copia canonica o in una traduzione approvata;
 *  • conflitti di fonte non risolti (l'editor deve decidere, mai in automatico);
 *  • data di revisione già scaduta (un fatto stale non si approva).
 * `now` opzionale: se assente, la scadenza non è valutata (validazione statica di forma).
 */
export function approvalBlockers(fact: AreaFact, now?: Date): string[] {
  const blockers: string[] = [];

  const canon = findSubjectiveViolations(fact.text);
  for (const v of canon) blockers.push(`testo soggettivo (${v.category}): "${v.match}"`);
  for (const t of fact.translations) {
    if (!t.approved) continue;
    for (const v of findSubjectiveViolations(t.text)) {
      blockers.push(`traduzione ${t.locale} soggettiva (${v.category}): "${v.match}"`);
    }
  }

  if (fact.conflicts.length > 0) {
    blockers.push(`${fact.conflicts.length} conflitto/i di fonte non risolti: decisione editoriale richiesta`);
  }

  if (now) {
    const review = Date.parse(fact.reviewBy);
    if (!Number.isNaN(review) && now.getTime() > review) {
      blockers.push("data di revisione già scaduta (stale)");
    }
  }

  return blockers;
}
