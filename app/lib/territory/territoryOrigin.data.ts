// UNICA FONTE dei dati d'origine CURATI a mano (Prompt 8). SERVER-ONLY.
//
// Qui vivono, per codice RealSmart, le decisioni umane che alzano la precisione dell'origine:
//   • MANUAL_COORDS         — coordinate curate a mano (property-coordinate, massima fiducia);
//   • GEOCODE_AUTHORIZATIONS — autorizzazioni esplicite alla geocodifica dell'indirizzo;
//   • GEOCODE_CACHE          — coordinate già geocodificate (prodotte dal job editoriale);
//   • ZONES / ZONE_OF_CODE   — centroidi di zona e assegnazione immobile→zona.
//
// VUOTO di proposito: nessun immobile lascia la precisione zona/comune finché un umano non aggiunge
// qui una voce con la sua traccia (fonte/revisore/data). REVOCA = rimuovere la voce → al refresh si
// torna in automatico a zona/comune. Le coordinate NON finiscono MAI nel bundle del browser.

import {
  TerritoryManualCoordSchema,
  TerritoryZoneCentroidSchema,
  type TerritoryManualCoord,
  type TerritoryZoneCentroid,
} from "./types";
import type { GeocodeAuthorization, OriginSources } from "./originAuthz";
import { geocodeAddressKey } from "./geocoder";

if (typeof window !== "undefined") {
  throw new Error("[territory/origin.data] dati d'origine curati: modulo server-only.");
}

/** Coordinate curate a mano per codice RealSmart (property-coordinate). Vuoto di default. */
const MANUAL_COORDS: Record<string, TerritoryManualCoord> = {};

/** Autorizzazioni alla geocodifica dell'indirizzo per codice (address-geocode). Vuoto di default. */
const GEOCODE_AUTHORIZATIONS: Record<string, GeocodeAuthorization> = {};

/** Cache dei geocode già prodotti (chiave = geocodeAddressKey). Vuoto di default. */
const GEOCODE_CACHE: Record<string, { lat: number; lng: number }> = {};

/** Centroidi di zona curati (slug → zona). Vuoto di default. */
const ZONES: Record<string, TerritoryZoneCentroid> = {};

/** Assegnazione immobile→zona (codice → slug zona). Vuoto di default. */
const ZONE_OF_CODE: Record<string, string> = {};

// Validazione a import-time (in build): una voce sbagliata rompe la build, non la pagina.
for (const [code, mc] of Object.entries(MANUAL_COORDS)) {
  const r = TerritoryManualCoordSchema.safeParse(mc);
  if (!r.success) throw new Error(`[origin.data] coord manuale non valida (${code}): ${r.error.message}`);
}
for (const [slug, z] of Object.entries(ZONES)) {
  const r = TerritoryZoneCentroidSchema.safeParse(z);
  if (!r.success) throw new Error(`[origin.data] zona non valida (${slug}): ${r.error.message}`);
}

/** Fonti d'origine di produzione, costruite dai dati curati (vuoti finché non si aggiunge nulla). */
export function defaultOriginSources(): OriginSources {
  return {
    manualCoord: (code) => MANUAL_COORDS[code],
    geocodeAuthorization: (code) => GEOCODE_AUTHORIZATIONS[code],
    cachedGeocode: (address, municipality) => GEOCODE_CACHE[geocodeAddressKey(address, municipality)],
    zoneFor: (code) => {
      const slug = ZONE_OF_CODE[code];
      return slug ? ZONES[slug] : undefined;
    },
  };
}
