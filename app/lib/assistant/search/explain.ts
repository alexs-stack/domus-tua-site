// Perché un immobile è pertinente — calcolato, non raccontato.
//
// Il programma chiede di "spiegare in una frase perché ogni risultato è pertinente". Lasciarlo
// dedurre al modello sarebbe un invito a inventare ("perfetto per una famiglia!"). Qui si
// verifica quali criteri l'immobile soddisfa DAVVERO e si passano al modello come elenco: lui
// deve solo metterli in una frase.

import type { ParsedSearch } from "../../ai/types";
import type { NormalizedProperty } from "../../realsmart/types";
import type { RefineCriteria } from "./refine";

const euro = (n: number) => new Intl.NumberFormat("it-IT").format(Math.round(n));

/**
 * Criteri richiesti che questo immobile soddisfa, in italiano.
 *
 * Include solo ciò che è verificabile sul dato: una caratteristica assente dal feed non
 * compare né come sì né come no. L'elenco può essere vuoto (ricerca senza vincoli).
 */
export function explainMatch(
  listing: NormalizedProperty,
  filters: ParsedSearch,
  extra: RefineCriteria,
): string[] {
  const reasons: string[] = [];
  const features = listing.features.map((f) => f.toLowerCase());

  if (filters.comune && filters.comune !== "Tutti") reasons.push(`si trova a ${listing.town}`);

  if (filters.type && filters.type !== "Tutte") reasons.push(`è ${listing.type.toLowerCase()}`);

  if (filters.maxBudget && listing.price > 0) {
    reasons.push(`costa ${euro(listing.price)} €, entro il budget`);
  }
  if (filters.minBudget && listing.price > 0 && !filters.maxBudget) {
    reasons.push(`costa ${euro(listing.price)} €`);
  }

  if (filters.minSqm && listing.sqm > 0) reasons.push(`misura ${listing.sqm} m²`);
  if (filters.maxSqm && listing.sqm > 0 && !filters.minSqm) reasons.push(`misura ${listing.sqm} m²`);

  if (filters.minRooms && listing.rooms > 0) reasons.push(`ha ${listing.rooms} locali`);
  if (extra.camereMin && listing.bedrooms > 0) reasons.push(`ha ${listing.bedrooms} camere`);
  if (extra.bagniMin && listing.baths > 0) reasons.push(`ha ${listing.baths} bagni`);

  for (const requested of filters.features ?? []) {
    const label = requested.toLowerCase();
    // Confermiamo la caratteristica solo se compare davvero tra quelle dell'immobile.
    if (features.some((f) => f.includes(label) || label.includes(f))) {
      reasons.push(`ha ${label}`);
    }
  }

  return reasons;
}
