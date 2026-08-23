// Costruzione della vista "Vivere in zona" — PURA e isomorfa (usabile anche lato client).
//
// Trasforma un PublicListingTerritory (dato approvato) in un modello di vista già localizzato:
// titolo, etichette categoria, distanze formattate, metodo ("in linea d'aria") e data.
// NIENTE coordinate, NIENTE giudizi, NIENTE "a piedi/in auto": qui si formatta solo ciò che è
// nel payload pubblico. Se non c'è nulla da mostrare ritorna null → la sezione si nasconde.

import { TERRITORY_POI_CATEGORIES, type TerritoryPoiCategory } from "./categories";
import { AREA_CATEGORY_LABEL_IT, AREA_CATEGORY_ORDER } from "./area/categories";
import type { PublicListingTerritory, PublicOriginBasis } from "./types";
import type { PublicAreaProfile } from "./area/types";

export type TerritoryLocale = "it" | "en" | "fr" | "de" | "es";

/** Modalità d'origine, derivata SOLO dalla precisione: guida testo e centro dell'esploratore. */
export type TerritoryOriginMode = "property" | "zone" | "municipality";

export interface TerritoryViewPoi {
  name: string;
  /** Es. "≈ 250 m" oppure "≈ 1,2 km". Sempre accompagnata dal metodo testuale. */
  distanceLabel: string;
  /** Distanza numerica in metri (per l'esploratore schematico). Nessuna coordinata. */
  distanceMeters: number;
  sourceUrl?: string;
}

export interface TerritoryViewCategory {
  category: TerritoryPoiCategory;
  label: string;
  pois: TerritoryViewPoi[];
}

/** Etichette dell'esploratore di distanze (schematico), tutte già localizzate. */
export interface TerritoryExplorerStrings {
  reveal: string;
  hide: string;
  ariaTitle: string;
  caption: string;
  centerLabel: string;
  empty: string;
  filterAll: string;
  filterLegend: string;
}

export interface TerritoryView {
  title: string;
  /**
   * Intestazione del BLOCCO DISTANZE quando sopra c'è già la sezione d'area.
   *
   * Senza, la pagina mostrava «Vivere in zona» come occhiello e di nuovo «Vivere in zona» come
   * sottotitolo delle distanze, a due righe di distanza. Sono due cose diverse — dove ci si
   * trova, e quanto dista da qui — e devono avere due nomi.
   */
  distancesTitle: string;
  /** Etichetta esplicita del metodo: mai percorribilità. */
  methodLabel: string;
  /**
   * Frase esplicita sulla BASE dell'origine: es. "Distanze indicative dal centro di Tradate".
   * Derivata SOLO dalla precisione dell'originBasis: mai "dall'immobile" per un centroide.
   */
  originLabel: string;
  /** Modalità d'origine (property/zone/municipality): per badge e centro dell'esploratore. */
  originMode: TerritoryOriginMode;
  /** Contesto leggibile senza gergo: es. "Comune di Tradate" o "Zona San Rocco". */
  contextLabel: string;
  /** Es. "Dati aggiornati al 13 agosto 2026". */
  updatedLabel: string;
  categories: TerritoryViewCategory[];
  /** Attribuzioni uniche del provider (es. "© OpenStreetMap contributors"). */
  attribution: string;
  /** Stringhe localizzate per l'esploratore schematico (usate dal componente lazy). */
  explorer: TerritoryExplorerStrings;
}

interface LocaleStrings {
  title: string;
  distancesTitle: string;
  method: string;
  updatedPrefix: string;
  /**
   * Frasi che dicono DA DOVE sono misurate le distanze, per livello di precisione. `{label}` è la
   * base leggibile (comune/zona). Mai "dall'immobile" per un centroide: la scelta è vincolata dalla
   * precisione, non dal testo libero.
   */
  origin: { property: string; zone: string; municipality: string };
  /** Contesto senza gergo. `{label}` = comune/zona. */
  context: { property: string; zone: string; municipality: string };
  categories: Record<TerritoryPoiCategory, string>;
  /** Etichette dell'esploratore schematico di distanze. `{label}` = base d'origine. */
  explorer: {
    reveal: string;
    hide: string;
    ariaTitle: string;
    caption: string;
    center: { property: string; zone: string; municipality: string };
    empty: string;
    filterAll: string;
    filterLegend: string;
  };
}

const STRINGS: Record<TerritoryLocale, LocaleStrings> = {
  it: {
    title: "Vivere in zona",
    distancesTitle: "Distanze utili",
    method: "Distanza indicativa in linea d'aria",
    updatedPrefix: "Dati aggiornati al",
    origin: { property: "Distanze indicative dall'immobile", zone: "Distanze indicative dal centro della zona {label}", municipality: "Distanze indicative dal centro di {label}" },
    context: { property: "Comune di {label}", zone: "Zona {label}", municipality: "Comune di {label}" },
    categories: {
      "railway-station": "Stazione ferroviaria",
      pharmacy: "Farmacia",
      supermarket: "Supermercato",
      school: "Scuola",
      park: "Parco pubblico",
    },
    explorer: {
      reveal: "Esplora le distanze",
      hide: "Nascondi lo schema",
      ariaTitle: "Schema delle distanze in linea d'aria",
      caption: "Schema indicativo: le distanze sono in linea d'aria, le direzioni sono illustrative e non reali.",
      center: { property: "Immobile", zone: "Zona {label}", municipality: "{label}" },
      empty: "Nessun luogo per i filtri selezionati.",
      filterAll: "Tutte",
      filterLegend: "Filtra per categoria",
    },
  },
  en: {
    title: "Living nearby",
    distancesTitle: "Useful distances",
    method: "Approximate straight-line distance",
    updatedPrefix: "Data updated on",
    origin: { property: "Approximate distances from the property", zone: "Approximate distances from the centre of the {label} area", municipality: "Approximate distances from the centre of {label}" },
    context: { property: "Municipality of {label}", zone: "{label} area", municipality: "Municipality of {label}" },
    categories: {
      "railway-station": "Railway station",
      pharmacy: "Pharmacy",
      supermarket: "Supermarket",
      school: "School",
      park: "Public park",
    },
    explorer: {
      reveal: "Explore the distances",
      hide: "Hide the diagram",
      ariaTitle: "Straight-line distance diagram",
      caption: "Indicative diagram: distances are straight-line; directions are illustrative, not real.",
      center: { property: "Property", zone: "{label} area", municipality: "{label}" },
      empty: "No places for the selected filters.",
      filterAll: "All",
      filterLegend: "Filter by category",
    },
  },
  fr: {
    title: "Vivre dans le quartier",
    distancesTitle: "Distances utiles",
    method: "Distance indicative à vol d'oiseau",
    updatedPrefix: "Données mises à jour le",
    origin: { property: "Distances indicatives depuis le bien", zone: "Distances indicatives depuis le centre du quartier {label}", municipality: "Distances indicatives depuis le centre de {label}" },
    context: { property: "Commune de {label}", zone: "Quartier {label}", municipality: "Commune de {label}" },
    categories: {
      "railway-station": "Gare ferroviaire",
      pharmacy: "Pharmacie",
      supermarket: "Supermarché",
      school: "École",
      park: "Parc public",
    },
    explorer: {
      reveal: "Explorer les distances",
      hide: "Masquer le schéma",
      ariaTitle: "Schéma des distances à vol d'oiseau",
      caption: "Schéma indicatif : distances à vol d'oiseau ; les directions sont illustratives, non réelles.",
      center: { property: "Bien", zone: "Quartier {label}", municipality: "{label}" },
      empty: "Aucun lieu pour les filtres sélectionnés.",
      filterAll: "Tous",
      filterLegend: "Filtrer par catégorie",
    },
  },
  de: {
    title: "Leben in der Umgebung",
    distancesTitle: "Nützliche Entfernungen",
    method: "Ungefähre Luftliniendistanz",
    updatedPrefix: "Daten aktualisiert am",
    origin: { property: "Ungefähre Entfernungen ab der Immobilie", zone: "Ungefähre Entfernungen ab dem Zentrum des Gebiets {label}", municipality: "Ungefähre Entfernungen ab dem Zentrum von {label}" },
    context: { property: "Gemeinde {label}", zone: "Gebiet {label}", municipality: "Gemeinde {label}" },
    categories: {
      "railway-station": "Bahnhof",
      pharmacy: "Apotheke",
      supermarket: "Supermarkt",
      school: "Schule",
      park: "Öffentlicher Park",
    },
    explorer: {
      reveal: "Entfernungen erkunden",
      hide: "Schema ausblenden",
      ariaTitle: "Schema der Luftliniendistanzen",
      caption: "Orientierungsschema: Entfernungen als Luftlinie; die Richtungen sind illustrativ, nicht real.",
      center: { property: "Immobilie", zone: "Gebiet {label}", municipality: "{label}" },
      empty: "Keine Orte für die gewählten Filter.",
      filterAll: "Alle",
      filterLegend: "Nach Kategorie filtern",
    },
  },
  es: {
    title: "Vivir en la zona",
    distancesTitle: "Distancias útiles",
    method: "Distancia aproximada en línea recta",
    updatedPrefix: "Datos actualizados el",
    origin: { property: "Distancias indicativas desde el inmueble", zone: "Distancias indicativas desde el centro de la zona {label}", municipality: "Distancias indicativas desde el centro de {label}" },
    context: { property: "Municipio de {label}", zone: "Zona {label}", municipality: "Municipio de {label}" },
    categories: {
      "railway-station": "Estación de tren",
      pharmacy: "Farmacia",
      supermarket: "Supermercado",
      school: "Escuela",
      park: "Parque público",
    },
    explorer: {
      reveal: "Explorar las distancias",
      hide: "Ocultar el esquema",
      ariaTitle: "Esquema de distancias en línea recta",
      caption: "Esquema indicativo: distancias en línea recta; las direcciones son ilustrativas, no reales.",
      center: { property: "Inmueble", zone: "Zona {label}", municipality: "{label}" },
      empty: "Ningún lugar para los filtros seleccionados.",
      filterAll: "Todas",
      filterLegend: "Filtrar por categoría",
    },
  },
};

// ─────────────────────────────────────────────────────────────
// Descrizioni d'AREA (fatti verificati del comune/zona) — testo, non solo distanze
// ─────────────────────────────────────────────────────────────

/** Etichette della sezione "La zona": titolo, fonte, data di verifica. */
const AREA_STRINGS: Record<TerritoryLocale, { title: string; sourcePrefix: string; reviewedPrefix: string }> = {
  it: { title: "La zona in sintesi", sourcePrefix: "Fonte", reviewedPrefix: "verificato il" },
  en: { title: "The area at a glance", sourcePrefix: "Source", reviewedPrefix: "verified on" },
  fr: { title: "Le quartier en bref", sourcePrefix: "Source", reviewedPrefix: "vérifié le" },
  de: { title: "Die Gegend auf einen Blick", sourcePrefix: "Quelle", reviewedPrefix: "geprüft am" },
  es: { title: "La zona en breve", sourcePrefix: "Fuente", reviewedPrefix: "verificado el" },
};

/**
 * Occhiello e intestazione della sezione.
 *
 * Due preposizioni e non una: in italiano si vive **a** un comune e **in** un quartiere, e
 * sbagliarla è la prima cosa che un lettore locale nota. Le altre lingue non hanno la distinzione
 * e usano una forma sola — dichiararlo qui evita che qualcuno "corregga" l'italiano per
 * uniformarlo.
 */
const AREA_HEADING_STRINGS: Record<TerritoryLocale, {
  eyebrow: string;
  inMunicipality: string;
  inNeighbourhood: string;
  sourcesSummary: string;
}> = {
  it: {
    eyebrow: "Vivere in zona",
    inMunicipality: "Vivere a {label}",
    inNeighbourhood: "Vivere in {label}",
    sourcesSummary: "Fonti e date di verifica",
  },
  en: {
    eyebrow: "The area",
    inMunicipality: "Living in {label}",
    inNeighbourhood: "Living in {label}",
    sourcesSummary: "Sources and verification dates",
  },
  fr: {
    eyebrow: "Le quartier",
    inMunicipality: "Vivre à {label}",
    inNeighbourhood: "Vivre à {label}",
    sourcesSummary: "Sources et dates de vérification",
  },
  de: {
    eyebrow: "Die Gegend",
    inMunicipality: "Leben in {label}",
    inNeighbourhood: "Leben in {label}",
    sourcesSummary: "Quellen und Prüfdaten",
  },
  es: {
    eyebrow: "La zona",
    inMunicipality: "Vivir en {label}",
    inNeighbourhood: "Vivir en {label}",
    sourcesSummary: "Fuentes y fechas de verificación",
  },
};

export function areaHeadingStrings(locale: TerritoryLocale) {
  return AREA_HEADING_STRINGS[locale] ?? AREA_HEADING_STRINGS.it;
}

export function areaSectionStrings(locale: TerritoryLocale) {
  return AREA_STRINGS[locale] ?? AREA_STRINGS.it;
}

export interface AreaViewFact {
  categoryLabel: string;
  text: string;
  sourceOwner: string;
  sourceUrl?: string;
  reviewedLabel: string;
}

export interface AreaViewSection {
  heading: string;
  body: string;
}

export interface AreaView {
  /** Occhiello sopra il titolo ("VIVERE IN ZONA"). */
  eyebrow: string;
  /** "Vivere in {Quartiere}" quando il quartiere è verificato, altrimenti "Vivere a {Comune}". */
  title: string;
  /** Sintesi 60–90 parole dalla narrativa approvata. Stringa vuota se non c'è narrativa. */
  intro: string;
  /** Sezioni della narrativa, già nell'ordine canonico. Vuoto se non c'è narrativa. */
  sections: AreaViewSection[];
  /** Etichetta del riepilogo fonti (elemento apribile). */
  sourcesSummary: string;
  facts: AreaViewFact[];
}

/** Formatta una distanza in metri, senza mai implicare percorribilità. */
export function formatDistance(meters: number, locale: TerritoryLocale): string {
  if (meters < 1000) return `≈ ${Math.round(meters)} m`;
  const km = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(meters / 1000);
  return `≈ ${km} km`;
}

/**
 * Frase sulla base dell'origine, derivata dalla PRECISIONE (mai dal testo libero): property/
 * address → "dall'immobile"; zone → "dal centro della zona X"; municipality → "dal centro di X".
 * È qui che si rende IMPOSSIBILE etichettare un centroide come distanza dall'immobile.
 */
export function describeOriginBasis(basis: PublicOriginBasis, locale: TerritoryLocale): string {
  const strings = STRINGS[locale] ?? STRINGS.it;
  switch (basis.precision) {
    case "property-coordinate":
    case "address-geocode":
      return strings.origin.property;
    case "zone-centroid":
      return strings.origin.zone.replace("{label}", basis.label);
    case "municipality-centroid":
      return strings.origin.municipality.replace("{label}", basis.label);
  }
}

/** Modalità d'origine derivata dalla precisione: property (immobile) / zone / municipality. */
export function originModeOf(basis: PublicOriginBasis): TerritoryOriginMode {
  switch (basis.precision) {
    case "property-coordinate":
    case "address-geocode":
      return "property";
    case "zone-centroid":
      return "zone";
    case "municipality-centroid":
      return "municipality";
  }
}

/**
 * Costruisce la vista delle DESCRIZIONI D'AREA (fatti verificati del comune/zona) da un profilo
 * pubblico già approvato/fresco/localizzato. Ogni fatto porta la fonte primaria e la data di verifica.
 * Ritorna null se non c'è nulla di pubblicabile → la sezione "La zona" non compare.
 */
/**
 * L'etichetta come va MOSTRATA.
 *
 * Il campo `municipality` di un fatto è testo libero scritto da chi cura i dati, e nulla
 * garantisce le maiuscole: un fatto salvato con `municipality: "tradate"` produceva
 * l'intestazione «Vivere a tradate». L'ha trovato un test già esistente, ed è il genere di
 * difetto che nessuno segnala perché sembra un refuso.
 *
 * La regola è conservativa di proposito: si interviene SOLO se non c'è nemmeno una maiuscola,
 * cioè quando è evidente che nessuno ha scelto la forma. "Abbiate Guazzone" e "Sant'Ambrogio"
 * restano intatte, perché lì la forma è una decisione di chi ha scritto il dato.
 */
function presentableLabel(label: string): string {
  if (/[A-ZÀ-Ù]/.test(label)) return label;
  return label.replace(/(^|[\s'’-])([a-zà-ù])/g, (_, sep: string, ch: string) => sep + ch.toUpperCase());
}

export function buildAreaView(profile: PublicAreaProfile | null | undefined, locale: TerritoryLocale): AreaView | null {
  if (!profile || profile.facts.length === 0) return null;
  const s = areaSectionStrings(locale);
  const h = areaHeadingStrings(locale);

  // INTESTAZIONE. Si usa l'etichetta dell'area — il quartiere quando è verificato — e la
  // preposizione che gli corrisponde. Se il testo approvato ha già un suo titolo, vince quello:
  // è passato dal cancello e da una revisione umana, e riscriverglielo qui vanificherebbe
  // entrambi. Senza né titolo né etichetta si ripiega sull'intestazione generica.
  const label = presentableLabel(profile.label ?? profile.municipality);
  const isNeighbourhood = Boolean(profile.label && profile.label !== profile.municipality);
  const fallbackTitle = (isNeighbourhood ? h.inNeighbourhood : h.inMunicipality).replace("{label}", label);
  const title = profile.narrative?.title ?? (label ? fallbackTitle : s.title);

  // Le sezioni arrivano già ordinate dal generatore (il guard rifiuta l'ordine sbagliato):
  // qui si ri-ordina comunque, difensivamente, come si fa per i POI.
  const sections: AreaViewSection[] = (profile.narrative?.sections ?? [])
    .slice()
    .sort((a, b) => AREA_CATEGORY_ORDER.indexOf(a.category) - AREA_CATEGORY_ORDER.indexOf(b.category))
    .map((x) => ({ heading: x.heading, body: x.body }));

  const facts: AreaViewFact[] = profile.facts.map((f) => ({
    categoryLabel: AREA_CATEGORY_LABEL_IT[f.category],
    text: f.text,
    sourceOwner: f.sourceOwner,
    ...(f.sourceUrl ? { sourceUrl: f.sourceUrl } : {}),
    reviewedLabel: (() => {
      const d = formatUpdated(f.reviewedAt, locale);
      return d ? `${s.reviewedPrefix} ${d}` : "";
    })(),
  }));
  return {
    eyebrow: h.eyebrow,
    title,
    intro: profile.narrative?.intro ?? "",
    sections,
    sourcesSummary: h.sourcesSummary,
    facts,
  };
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
        distanceMeters: p.distanceMeters,
        ...(p.sourceUrl ? { sourceUrl: p.sourceUrl } : {}),
      }));
    if (pois.length > 0) {
      categories.push({ category, label: strings.categories[category], pois });
    }
  }
  if (categories.length === 0) return null;

  const attributions = [...new Set(territory.pois.map((p) => p.attribution))].join(" · ");
  const updated = formatUpdated(territory.retrievedAt, locale);
  const mode = originModeOf(territory.originBasis);
  const label = territory.originBasis.label;
  const fill = (s: string) => s.replace("{label}", label);

  return {
    title: strings.title,
    distancesTitle: strings.distancesTitle,
    methodLabel: strings.method,
    originLabel: describeOriginBasis(territory.originBasis, locale),
    originMode: mode,
    contextLabel: fill(strings.context[mode]),
    updatedLabel: updated ? `${strings.updatedPrefix} ${updated}` : "",
    categories,
    attribution: attributions,
    explorer: {
      reveal: strings.explorer.reveal,
      hide: strings.explorer.hide,
      ariaTitle: strings.explorer.ariaTitle,
      caption: strings.explorer.caption,
      centerLabel: fill(strings.explorer.center[mode]),
      empty: strings.explorer.empty,
      filterAll: strings.explorer.filterAll,
      filterLegend: strings.explorer.filterLegend,
    },
  };
}
