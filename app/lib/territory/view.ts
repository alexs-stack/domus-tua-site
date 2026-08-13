// Costruzione della vista "Vivere in zona" — PURA e isomorfa (usabile anche lato client).
//
// Trasforma un PublicListingTerritory (dato approvato) in un modello di vista già localizzato:
// titolo, etichette categoria, distanze formattate, metodo ("in linea d'aria") e data.
// NIENTE coordinate, NIENTE giudizi, NIENTE "a piedi/in auto": qui si formatta solo ciò che è
// nel payload pubblico. Se non c'è nulla da mostrare ritorna null → la sezione si nasconde.

import { TERRITORY_POI_CATEGORIES, type TerritoryPoiCategory } from "./categories";
import type { PublicListingTerritory } from "./types";

export type TerritoryLocale = "it" | "en" | "fr" | "de" | "es";

export interface TerritoryViewPoi {
  name: string;
  /** Es. "≈ 250 m" oppure "≈ 1,2 km". Sempre accompagnata dal metodo testuale. */
  distanceLabel: string;
  sourceUrl?: string;
}

export interface TerritoryViewCategory {
  category: TerritoryPoiCategory;
  label: string;
  pois: TerritoryViewPoi[];
}

export interface TerritoryView {
  title: string;
  /** Etichetta esplicita del metodo: mai percorribilità. */
  methodLabel: string;
  /** Es. "Dati aggiornati al 13 agosto 2026". */
  updatedLabel: string;
  categories: TerritoryViewCategory[];
  /** Attribuzioni uniche del provider (es. "© OpenStreetMap contributors"). */
  attribution: string;
}

interface LocaleStrings {
  title: string;
  method: string;
  updatedPrefix: string;
  categories: Record<TerritoryPoiCategory, string>;
}

const STRINGS: Record<TerritoryLocale, LocaleStrings> = {
  it: {
    title: "Vivere in zona",
    method: "Distanza indicativa in linea d'aria",
    updatedPrefix: "Dati aggiornati al",
    categories: {
      "railway-station": "Stazione ferroviaria",
      pharmacy: "Farmacia",
      supermarket: "Supermercato",
      school: "Scuola",
      park: "Parco pubblico",
    },
  },
  en: {
    title: "Living nearby",
    method: "Approximate straight-line distance",
    updatedPrefix: "Data updated on",
    categories: {
      "railway-station": "Railway station",
      pharmacy: "Pharmacy",
      supermarket: "Supermarket",
      school: "School",
      park: "Public park",
    },
  },
  fr: {
    title: "Vivre dans le quartier",
    method: "Distance indicative à vol d'oiseau",
    updatedPrefix: "Données mises à jour le",
    categories: {
      "railway-station": "Gare ferroviaire",
      pharmacy: "Pharmacie",
      supermarket: "Supermarché",
      school: "École",
      park: "Parc public",
    },
  },
  de: {
    title: "Leben in der Umgebung",
    method: "Ungefähre Luftliniendistanz",
    updatedPrefix: "Daten aktualisiert am",
    categories: {
      "railway-station": "Bahnhof",
      pharmacy: "Apotheke",
      supermarket: "Supermarkt",
      school: "Schule",
      park: "Öffentlicher Park",
    },
  },
  es: {
    title: "Vivir en la zona",
    method: "Distancia aproximada en línea recta",
    updatedPrefix: "Datos actualizados el",
    categories: {
      "railway-station": "Estación de tren",
      pharmacy: "Farmacia",
      supermarket: "Supermercado",
      school: "Escuela",
      park: "Parque público",
    },
  },
};

/** Formatta una distanza in metri, senza mai implicare percorribilità. */
export function formatDistance(meters: number, locale: TerritoryLocale): string {
  if (meters < 1000) return `≈ ${Math.round(meters)} m`;
  const km = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(meters / 1000);
  return `≈ ${km} km`;
}

/** Data del dato in forma lunga localizzata (es. "13 agosto 2026"). */
function formatUpdated(retrievedAt: string, locale: TerritoryLocale): string {
  const date = new Date(retrievedAt);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/**
 * Costruisce il modello di vista, oppure null se non c'è nulla da mostrare.
 * Ri-applica difensivamente ordine categoria e limite di 2 (il payload è già conforme).
 */
export function buildTerritoryView(
  territory: PublicListingTerritory | null | undefined,
  locale: TerritoryLocale,
): TerritoryView | null {
  if (!territory || territory.pois.length === 0) return null;
  const strings = STRINGS[locale] ?? STRINGS.it;

  const categories: TerritoryViewCategory[] = [];
  for (const category of TERRITORY_POI_CATEGORIES) {
    const pois = territory.pois
      .filter((p) => p.category === category)
      .slice(0, 2)
      .map((p) => ({
        name: p.name,
        distanceLabel: formatDistance(p.distanceMeters, locale),
        ...(p.sourceUrl ? { sourceUrl: p.sourceUrl } : {}),
      }));
    if (pois.length > 0) {
      categories.push({ category, label: strings.categories[category], pois });
    }
  }
  if (categories.length === 0) return null;

  const attributions = [...new Set(territory.pois.map((p) => p.attribution))].join(" · ");
  const updated = formatUpdated(territory.retrievedAt, locale);

  return {
    title: strings.title,
    methodLabel: strings.method,
    updatedLabel: updated ? `${strings.updatedPrefix} ${updated}` : "",
    categories,
    attribution: attributions,
  };
}
