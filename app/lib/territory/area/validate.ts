// Regole di APPROVABILITÀ di un fatto d'area (Prompt 9): cosa impedisce di approvarlo/pubblicarlo.

import { findSubjectiveViolations } from "./subjective";
import type { AreaFact } from "./types";

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
