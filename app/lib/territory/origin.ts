// Risoluzione dell'ORIGINE di calcolo per un immobile.
//
// Il feed RealSmart non fornisce coordinate del singolo immobile (ADR-001): nell'MVP l'origine è il
// CENTROIDE del comune, preso dalla tabella già usata per la mappa (app/lib/geo/comuni.ts). Così non
// serve geocoding né alcun dato personale: l'origine è un punto pubblico (centro comune), mai la casa.
//
// Se il comune non è in tabella, l'origine è "mancante" e l'immobile viene saltato (constraint 15:
// ciò che manca resta mancante, non si inventa).

import { COMUNI_COORDS } from "../geo/comuni";
import { normalizeMunicipality, type GeoCoord } from "./geo";
import type { CoordSource } from "./types";
import type { NormalizedProperty } from "../realsmart/types";

export interface ResolvedOrigin {
  coord: GeoCoord;
  coordSource: CoordSource;
  /** Slug normalizzato del comune risolto. */
  municipality: string;
}

/** Indice slug-normalizzato → coordinata, costruito una volta dalla tabella dei comuni. */
const CENTROID_BY_SLUG: Map<string, GeoCoord> = (() => {
  const map = new Map<string, GeoCoord>();
  for (const [key, coord] of Object.entries(COMUNI_COORDS)) {
    map.set(normalizeMunicipality(key), { lat: coord.lat, lng: coord.lng });
  }
  return map;
})();

/** Risolve l'origine dal nome del comune. `null` se non conosciamo il centroide di quel comune. */
export function resolveOriginFromMunicipality(town: string): ResolvedOrigin | null {
  const slug = normalizeMunicipality(town);
  if (slug.length === 0) return null;
  const coord = CENTROID_BY_SLUG.get(slug);
  if (!coord) return null;
  return { coord: { ...coord }, coordSource: "municipality-centroid", municipality: slug };
}

/** Risolutore di default per un immobile normalizzato (usa il suo comune). */
export function resolveMunicipalityOrigin(property: NormalizedProperty): ResolvedOrigin | null {
  return resolveOriginFromMunicipality(property.town);
}
