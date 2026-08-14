// Costanti condivise dell'arricchimento territoriale.
//
// La versione dello schema entra nel fingerprint (vedi ./fingerprint.ts) e in ogni record
// persistito: un bump invalida i record vecchi (diventano "stale") e forza un ri-arricchimento
// controllato, senza mai pubblicare dati prodotti da uno schema superato.

/**
 * Versione corrente dello schema di arricchimento. Incrementare a ogni modifica incompatibile.
 *  • v1 → v2 (Territory V2): il vecchio `coordSource` binario diventa la gerarchia di precisione
 *    `originPrecision` + `originAccuracyMeters` + `originLabel`, e la vista pubblica porta
 *    `originBasis`. Migrazione in app/lib/territory/migrate.ts (i draft NON diventano approvati).
 */
export const TERRITORY_SCHEMA_VERSION = 2;

/**
 * Raggio APPROSSIMATO di incertezza (metri) per livello di precisione dell'origine. È il metadato
 * di accuratezza che accompagna ogni origine: onesto su "quanto è preciso il punto da cui misuro".
 */
export const ORIGIN_ACCURACY_METERS: Record<
  "property-coordinate" | "address-geocode" | "zone-centroid" | "municipality-centroid",
  number
> = {
  "property-coordinate": 0,
  "address-geocode": 60,
  "zone-centroid": 500,
  "municipality-centroid": 2000,
};
