// Filtri extra dell'assistente, applicati sui dati normalizzati.
//
// Perché non estendere `applyFilters` (app/lib/ai/rank.ts): quella funzione è condivisa con
// /api/search e rispecchia esattamente i filtri della UI del sito. L'assistente sa fare
// domande che la UI non offre (camere, bagni), e chi conversa può chiederle. Tenendo il
// livello extra qui, il comportamento del sito resta identico.
//
// Lavora su NormalizedProperty perché lì i numeri sono numeri: `Property.baths` è la stringa
// "2 bagni" e diventa "—" quando il dato manca, e da "—" non si distingue "non ce l'ha" da
// "non lo sappiamo". È la differenza che il programma chiede di non perdere mai.

import type { NormalizedProperty } from "../../realsmart/types";
import type { Property } from "../../properties";

export interface RefineCriteria {
  /** Numero minimo di camere da letto. */
  camereMin?: number;
  /** Numero minimo di bagni. */
  bagniMin?: number;
}

/** true se nessun criterio extra è stato richiesto. */
export function isEmpty(criteria: RefineCriteria): boolean {
  return !criteria.camereMin && !criteria.bagniMin;
}

/**
 * Applica i criteri extra ai candidati.
 *
 * REGOLA: un immobile per cui il dato NON è disponibile (0 nel feed) viene **tenuto**, non
 * scartato. Scartarlo equivarrebbe a dire "non ha due bagni" quando la verità è "non lo
 * sappiamo": trasformerebbe un'assenza di dato in una risposta negativa. Chi consulta il
 * risultato vedrà `bagni: null` e potrà dirlo com'è.
 */
export function refine(
  candidates: Property[],
  normalizedBySlug: Map<string, NormalizedProperty>,
  criteria: RefineCriteria,
): Property[] {
  if (isEmpty(criteria)) return candidates;

  return candidates.filter((property) => {
    const n = normalizedBySlug.get(property.slug);
    if (!n) return true;

    if (criteria.camereMin && n.bedrooms > 0 && n.bedrooms < criteria.camereMin) return false;
    if (criteria.bagniMin && n.baths > 0 && n.baths < criteria.bagniMin) return false;
    return true;
  });
}
