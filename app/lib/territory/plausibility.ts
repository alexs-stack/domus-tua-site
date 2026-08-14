// Validazione di PLAUSIBILITÀ di una coordinata a livello di immobile (Prompt 8).
//
// Una geocodifica o una coordinata curata SBAGLIATA (comune omonimo altrove, refuso, geocoder che
// cade sul centro Italia) non deve MAI pubblicarsi come origine dell'immobile: si confronta con il
// centroide comunale atteso e, se troppo lontana o fuori dai limiti geografici, si ROUTA A REVISIONE
// (l'immobile ripiega su zona/comune, mai su un punto implausibile).

import { haversineMeters, type GeoCoord } from "./geo";

/** Distanza massima ammessa (km) fra la coordinata e il centroide del comune atteso. */
export const MAX_PLAUSIBLE_KM = 12;

/** Limiti geografici della Lombardia allargati (pilota): fuori da qui è certamente un errore. */
export const REGION_BOUNDS = { minLat: 44.5, maxLat: 46.7, minLng: 8.0, maxLng: 11.5 };

export type PlausibilityVerdict = "ok" | "out-of-bounds" | "too-far";

export interface PlausibilityResult {
  verdict: PlausibilityVerdict;
  ok: boolean;
  /** Distanza dal centroide comunale in metri (per il report di revisione). */
  distanceMeters: number;
}

/**
 * Verifica una coordinata a livello di immobile rispetto al centroide del comune atteso.
 *  • fuori dai limiti regionali → out-of-bounds (errore grossolano);
 *  • oltre `maxKm` dal centroide → too-far (comune sbagliato/refuso);
 *  • altrimenti → ok.
 */
export function checkPlausibility(
  coord: GeoCoord,
  municipalityCentroid: GeoCoord,
  opts: { maxKm?: number; bounds?: typeof REGION_BOUNDS } = {},
): PlausibilityResult {
  const bounds = opts.bounds ?? REGION_BOUNDS;
  const maxKm = opts.maxKm ?? MAX_PLAUSIBLE_KM;
  const distanceMeters = haversineMeters(coord, municipalityCentroid);

  if (
    coord.lat < bounds.minLat ||
    coord.lat > bounds.maxLat ||
    coord.lng < bounds.minLng ||
    coord.lng > bounds.maxLng
  ) {
    return { verdict: "out-of-bounds", ok: false, distanceMeters };
  }
  if (distanceMeters > maxKm * 1000) {
    return { verdict: "too-far", ok: false, distanceMeters };
  }
  return { verdict: "ok", ok: true, distanceMeters };
}
