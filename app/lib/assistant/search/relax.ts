// Zero risultati → un solo allentamento sensato, calcolato sui dati.
//
// Il programma chiede di proporre "UN solo rilassamento sensato dei criteri". Farlo decidere
// al modello significherebbe farglielo indovinare: direbbe "prova ad alzare il budget" senza
// sapere se sopra quel budget c'è davvero qualcosa. Qui invece si PROVANO le alternative sui
// dati veri e si restituisce solo quella che produce risultati, col numero esatto.
//
// Ordine di preferenza: dal compromesso che di solito pesa meno a quello che pesa di più.
// Il prezzo per primo perché è la leva su cui le persone sono più spesso flessibili; la
// tipologia per ultima perché rinunciarvi cambia proprio la cosa che si sta cercando.

import { applyFilters } from "../../ai/rank";
import type { ParsedSearch } from "../../ai/types";
import type { NormalizedProperty } from "../../realsmart/types";
import type { Property } from "../../properties";
import { refine, type RefineCriteria } from "./refine";
import { nearbyComuni } from "./nearby";

export interface Relaxation {
  /** Che cosa si allenta. */
  criterio: "prezzo" | "caratteristiche" | "comune" | "locali" | "superficie" | "tipologia" | "camere" | "bagni";
  /** Frase pronta, in italiano, da riformulare col proprio tono. */
  descrizione: string;
  /** Quanti immobili si troverebbero allentando SOLO questo. */
  risultati: number;
}

const euro = (n: number) => new Intl.NumberFormat("it-IT").format(Math.round(n));

interface Candidate {
  criterio: Relaxation["criterio"];
  descrizione: string;
  filters: ParsedSearch;
  extra: RefineCriteria;
}

/**
 * Costruisce le alternative da provare, in ordine di preferenza.
 * Ogni alternativa allenta UN solo criterio: mescolarne due renderebbe impossibile
 * spiegare all'utente cosa ha ceduto.
 */
function candidates(
  filters: ParsedSearch,
  extra: RefineCriteria,
  comuniDisponibili: string[],
  comunePulito?: string,
): Candidate[] {
  const out: Candidate[] = [];

  if (filters.maxBudget) {
    const raised = Math.round((filters.maxBudget * 1.15) / 1000) * 1000;
    out.push({
      criterio: "prezzo",
      descrizione: `alzando il budget fino a ${euro(raised)} €`,
      filters: { ...filters, maxBudget: raised },
      extra,
    });
  }

  if (filters.features?.length) {
    const kept = filters.features.slice(0, -1);
    const dropped = filters.features[filters.features.length - 1];
    out.push({
      criterio: "caratteristiche",
      descrizione: `rinunciando a "${dropped.toLowerCase()}"`,
      filters: { ...filters, features: kept.length ? kept : undefined },
      extra,
    });
  }

  // Le coordinate si cercano col NOME del comune, non con la chiave di zona del catalogo.
  if (comunePulito && filters.comune && filters.comune !== "Tutti") {
    const vicini = nearbyComuni(comunePulito, comuniDisponibili);
    if (vicini.length > 0) {
      out.push({
        criterio: "comune",
        descrizione: `guardando anche nei comuni vicini (${vicini.join(", ")})`,
        // Il filtro comune cade: il conteggio comprende i vicini con immobili.
        filters: { ...filters, comune: undefined },
        extra,
      });
    }
  }

  if (extra.camereMin && extra.camereMin > 1) {
    out.push({
      criterio: "camere",
      descrizione: `accettando ${extra.camereMin - 1} camere`,
      filters,
      extra: { ...extra, camereMin: extra.camereMin - 1 },
    });
  }

  if (extra.bagniMin && extra.bagniMin > 1) {
    out.push({
      criterio: "bagni",
      descrizione: `accettando ${extra.bagniMin - 1} bagno`,
      filters,
      extra: { ...extra, bagniMin: extra.bagniMin - 1 },
    });
  }

  if (filters.minRooms && filters.minRooms > 1) {
    out.push({
      criterio: "locali",
      descrizione: `accettando ${filters.minRooms - 1} locali`,
      filters: { ...filters, minRooms: filters.minRooms - 1 },
      extra,
    });
  }

  if (filters.minSqm) {
    const lowered = Math.round((filters.minSqm * 0.85) / 5) * 5;
    out.push({
      criterio: "superficie",
      descrizione: `scendendo a ${lowered} m²`,
      filters: { ...filters, minSqm: lowered },
      extra,
    });
  }

  if (filters.type && filters.type !== "Tutte") {
    out.push({
      criterio: "tipologia",
      descrizione: "aprendo ad altre tipologie di immobile",
      filters: { ...filters, type: undefined },
      extra,
    });
  }

  return out;
}

/**
 * Il primo allentamento che produce davvero risultati, oppure null.
 *
 * null significa che nessun singolo compromesso basta: in quel caso l'assistente non deve
 * inventarne uno, deve proporre il contatto col team.
 */
export function suggestRelaxation(
  listings: Property[],
  normalizedBySlug: Map<string, NormalizedProperty>,
  filters: ParsedSearch,
  extra: RefineCriteria,
  comuniDisponibili: string[],
  comunePulito?: string,
): Relaxation | null {
  for (const candidate of candidates(filters, extra, comuniDisponibili, comunePulito)) {
    const found = refine(
      applyFilters(listings, candidate.filters),
      normalizedBySlug,
      candidate.extra,
    );
    if (found.length > 0) {
      return {
        criterio: candidate.criterio,
        descrizione: candidate.descrizione,
        risultati: found.length,
      };
    }
  }
  return null;
}
