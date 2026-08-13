// Costanti condivise dell'arricchimento territoriale.
//
// La versione dello schema entra nel fingerprint (vedi ./fingerprint.ts) e in ogni record
// persistito: un bump invalida i record vecchi (diventano "stale") e forza un ri-arricchimento
// controllato, senza mai pubblicare dati prodotti da uno schema superato.

/** Versione corrente dello schema di arricchimento. Incrementare a ogni modifica incompatibile. */
export const TERRITORY_SCHEMA_VERSION = 1;
