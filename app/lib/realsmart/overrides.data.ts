// ═══════════════════════════════════════════════════════════════════════════
// UNICA FONTE degli override manuali degli immobili.
//
// Qui dentro finiscono SOLO le informazioni che l'agenzia ci comunica e che abbiamo
// verificato: RealSmart resta la fonte principale, questo file gestisce le eccezioni.
//
// COME SI AGGIUNGE UNA MODIFICA → docs/realsmart-overrides.md
//
// In sintesi:
//   1. si parte dal CODICE RealSmart dell'immobile (<Codice>, es. "2055"), non dal titolo;
//   2. si compilano SEMPRE motivo, fonte, data (YYYY-MM-DD) e autore;
//   3. si esegue `npm run check`: un override sbagliato fa fallire la build, non la pagina.
//
// SERVER-ONLY: questo file non deve mai finire nel bundle del browser. La guardia sotto lo
// rende esplicito — se un import client lo trascinasse dentro, l'errore arriva subito.
// ═══════════════════════════════════════════════════════════════════════════

import { indexOverrides, type ListingOverride } from "./overrides";

if (typeof window !== "undefined") {
  throw new Error(
    "[realsmart/overrides] questo modulo è server-only: leggi gli immobili dalla facciata " +
      "app/lib/listings.ts, mai il file degli override.",
  );
}

/**
 * Override attivi in produzione.
 *
 * Volutamente VUOTO: nessun contenuto demo, nessun immobile di esempio. Gli esempi vivono
 * solo nelle fixture di test (app/lib/realsmart/__tests__/overrides.test.ts).
 */
const OVERRIDES: ListingOverride[] = [];

/** Indice codice → override. La validazione avviene qui, a import-time (quindi in build). */
export const listingOverrides = indexOverrides(OVERRIDES);

/** Override di un immobile, se esiste. */
export function getListingOverride(codice: string): ListingOverride | undefined {
  return listingOverrides.get(codice.trim());
}
