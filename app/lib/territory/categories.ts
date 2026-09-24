// Categorie di punti d'interesse (POI) del pilota territoriale.
//
// L'MVP censisce ESATTAMENTE cinque categorie oggettive e verificabili: stazione, farmacia,
// supermercato, scuola, parco pubblico. Niente giudizi di qualità/prestigio/sicurezza (constraint 8)
// e niente dati sensibili di quartiere (constraint 9): solo la PRESENZA di un servizio e la sua
// distanza approssimata in linea d'aria.

/** Le cinque categorie del pilota, in ordine di visualizzazione stabile. */
export const TERRITORY_POI_CATEGORIES = [
  "railway-station",
  "pharmacy",
  "supermarket",
  "school",
  "park",
] as const;

export type TerritoryPoiCategory = (typeof TERRITORY_POI_CATEGORIES)[number];

/** true se il valore è una delle cinque categorie note. */
export function isTerritoryPoiCategory(value: unknown): value is TerritoryPoiCategory {
  return (
    typeof value === "string" &&
    (TERRITORY_POI_CATEGORIES as readonly string[]).includes(value)
  );
}

/**
 * Etichette italiane per la UI. Ogni categoria ha SEMPRE un'etichetta testuale: nessuna
 * informazione è affidata alla sola icona (requisito di accessibilità del Prompt 8).
 */
export const TERRITORY_CATEGORY_LABEL_IT: Record<TerritoryPoiCategory, string> = {
  "railway-station": "Stazione ferroviaria",
  pharmacy: "Farmacia",
  supermarket: "Supermercato",
  school: "Scuola",
  park: "Parco pubblico",
};
