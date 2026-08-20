// Lettore territoriale dell'assistente (Prompt 13) — SOLO store approvato, MAI provider live.
//
// Espone due letture, entrambe da dato GIÀ approvato e fresco (nessuna chiamata esterna durante la
// chat, constraint 9):
//   • forListing(codice)   → POI pubblici di UN immobile, con base d'origine (property/zone/comune);
//   • forMunicipality(nome) → fatti d'area VERIFICATI del comune (trasporti, servizi…), con fonte.
// I due oggetti sono TIPI DISTINTI: l'assistente non deve confondere "l'immobile ha…" con "il comune
// offre…". Nessuna coordinata, nessun indirizzo, nessun ID provider, nessuna nota interna esce di qui.

import { toPublicListingTerritory } from "../../territory/public";
import { toAssistantTerritory, type AssistantTerritory } from "../../territory/assistant";
import { getPublicAreaProfile } from "../../territory/area/data";
import { AREA_CATEGORY_LABEL_IT } from "../../territory/area/categories";
import { readEnrichmentConfig } from "../../territory/config";
import type { KnowledgeLocale } from "../../territory/area/types";
import type { TerritoryRepository } from "../../territory/store/repository";

export type { AssistantTerritory } from "../../territory/assistant";

/** Fatto d'area in forma assistente: etichetta italiana, testo neutro, fonte e data di revisione. */
export interface AssistantAreaFact {
  categoria: string;
  testo: string;
  /** Proprietario della fonte primaria (es. "Comune di Tradate"). */
  fonte: string;
  /** URL pubblico della fonte, se disponibile. */
  fonteUrl?: string;
  /** Data di revisione/verifica, leggibile in italiano. */
  rivistoAl: string;
}

/** Profilo d'area del comune: fatti VERIFICATI, distinti dai POI di un immobile. */
export interface AssistantAreaProfile {
  comune: string;
  fatti: AssistantAreaFact[];
}

export interface AssistantTerritoryReader {
  /** Territorio pubblico approvato+fresco per un immobile (per RealSmart code). null se assente. */
  forListing(realSmartCode: string): Promise<AssistantTerritory | null>;
  /** Profilo d'area verificato per un comune. null se non c'è nulla di pubblicabile. */
  forMunicipality(municipality: string): Promise<AssistantAreaProfile | null>;
}

function formatReviewedIt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("it", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

export interface StoreTerritoryReaderDeps {
  repository: TerritoryRepository;
  now: () => Date;
  freshnessDays?: number;
  maxPerCategory?: number;
  locale?: KnowledgeLocale;
  /** Iniettabile per i test: fonte dei fatti d'area (default = modulo verificato server-only). */
  areaProfile?: typeof getPublicAreaProfile;
}

/**
 * Lettore basato sullo store durevole + modulo dei fatti d'area. NON contatta provider: legge solo
 * ciò che è già stato approvato e revisionato. Restituisce null in modo sicuro quando manca/è stale.
 */
export function createStoreTerritoryReader(deps: StoreTerritoryReaderDeps): AssistantTerritoryReader {
  const areaProfile = deps.areaProfile ?? getPublicAreaProfile;
  const locale: KnowledgeLocale = deps.locale ?? "it";

  return {
    async forListing(realSmartCode) {
      const record = await deps.repository.getListingEnrichment(realSmartCode);
      if (!record) return null;
      // toPublicListingTerritory applica: approvato + fresco + POI approvati + niente coordinate.
      const pub = toPublicListingTerritory(record, {
        now: deps.now(),
        freshnessDays: deps.freshnessDays ?? readEnrichmentConfig().freshnessDays,
        ...(deps.maxPerCategory !== undefined ? { maxPerCategory: deps.maxPerCategory } : {}),
      });
      return toAssistantTerritory(pub);
    },

    async forMunicipality(municipality) {
      const profile = areaProfile(municipality, { now: deps.now(), locale });
      if (!profile || profile.facts.length === 0) return null;
      return {
        comune: profile.municipality,
        fatti: profile.facts.map((f) => ({
          categoria: AREA_CATEGORY_LABEL_IT[f.category],
          testo: f.text,
          fonte: f.sourceOwner,
          ...(f.sourceUrl ? { fonteUrl: f.sourceUrl } : {}),
          rivistoAl: formatReviewedIt(f.reviewedAt),
        })),
      };
    },
  };
}
