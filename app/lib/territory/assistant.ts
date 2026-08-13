// Forma SICURA dei dati territoriali per l'assistente conversazionale.
//
// È il payload che il modello riceve: SOLO dato approvato e coord-free, con nome, distanza in
// linea d'aria e data. Nessuna coordinata, nessun ID provider, nessun payload grezzo. I nomi dei
// luoghi restano tali e quali (dato, non istruzione): il prompt impone di trattarli come testo.

import { TERRITORY_POI_CATEGORIES, TERRITORY_CATEGORY_LABEL_IT, type TerritoryPoiCategory } from "./categories";
import { formatDistance } from "./view";
import type { PublicListingTerritory } from "./types";

export interface AssistantTerritoryPlace {
  nome: string;
  /** Distanza in metri (numero) per confronti deterministici. */
  distanzaMetri: number;
  /** Distanza in forma leggibile, es. "≈ 250 m". Sempre in linea d'aria. */
  distanza: string;
}

export interface AssistantTerritoryCategory {
  categoria: TerritoryPoiCategory;
  etichetta: string;
  luoghi: AssistantTerritoryPlace[];
}

export interface AssistantTerritory {
  categorie: AssistantTerritoryCategory[];
  /** Etichetta esplicita del metodo: mai percorribilità. */
  metodo: string;
  /** Data del dato, in forma leggibile italiana (es. "13 agosto 2026"). */
  aggiornatoAl: string;
  /** Attribuzione della fonte (es. "© OpenStreetMap contributors"). */
  fonte: string;
}

function formatUpdatedIt(retrievedAt: string): string {
  const date = new Date(retrievedAt);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("it", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

/**
 * Converte la vista pubblica nel payload dell'assistente. Ritorna null se non c'è nulla di
 * mostrabile (nessuna categoria con luoghi): così il tool passa null e il modello lo dice.
 */
export function toAssistantTerritory(
  territory: PublicListingTerritory | null | undefined,
): AssistantTerritory | null {
  if (!territory || territory.pois.length === 0) return null;

  const categorie: AssistantTerritoryCategory[] = [];
  for (const categoria of TERRITORY_POI_CATEGORIES) {
    const luoghi = territory.pois
      .filter((p) => p.category === categoria)
      .slice(0, 2)
      .map((p) => ({
        nome: p.name,
        distanzaMetri: p.distanceMeters,
        distanza: formatDistance(p.distanceMeters, "it"),
      }));
    if (luoghi.length > 0) {
      categorie.push({ categoria, etichetta: TERRITORY_CATEGORY_LABEL_IT[categoria], luoghi });
    }
  }
  if (categorie.length === 0) return null;

  const fonte = [...new Set(territory.pois.map((p) => p.attribution))].join(" · ");
  return {
    categorie,
    metodo: "distanza indicativa in linea d'aria",
    aggiornatoAl: formatUpdatedIt(territory.retrievedAt),
    fonte,
  };
}
