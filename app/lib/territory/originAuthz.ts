// Risoluzione dell'origine AUTORIZZATA a livello di immobile (Prompt 8).
//
// Gerarchia (dalla più fine, ognuna con la propria condizione):
//   1. COORDINATA CURATA a mano (property-coordinate) — massima fiducia, auto-autorizzante;
//   2. GEOCODIFICA autorizzata dell'indirizzo (address-geocode) — richiede un'autorizzazione
//      esplicita + una coord già in cache (il geocoding vero gira solo in un job editoriale);
//   3. CENTROIDE DI ZONA (zone-centroid) — punto pubblico, nessuna autorizzazione;
//   4. CENTROIDE DEL COMUNE (municipality-centroid) — ripiego di sempre.
//
// PRINCIPI. L'autorizzazione è SEPARATA da showAddress: qui non si guarda mai showAddress. Senza
// un'autorizzazione esplicita, l'immobile NON lascia mai la precisione zona/comune. Una coordinata
// implausibile (comune sbagliato, refuso) viene SCARTATA e l'immobile ripiega — mai un punto errato.
// REVOCA = rimuovere l'autorizzazione: al refresh successivo si torna a zona/comune, in automatico.
// Le coordinate restano SEMPRE server-only.

import { ORIGIN_ACCURACY_METERS } from "./constants";
import { checkPlausibility, type PlausibilityVerdict } from "./plausibility";
import { resolveMunicipalityOrigin, type ResolvedOrigin } from "./origin";
import { parseZoneField } from "./zone";
import { normalizeMunicipality } from "./geo";
import type { NormalizedProperty } from "../realsmart/types";
import type { TerritoryManualCoord, TerritoryZoneCentroid } from "./types";

export interface GeocodeAuthorization {
  source: string;
  reviewedBy: string;
  reviewedAt: string;
}

/** Fonti (iniettabili) per la risoluzione autorizzata: curate a mano, cache geocode, zone. */
export interface OriginSources {
  manualCoord?(code: string): TerritoryManualCoord | undefined;
  geocodeAuthorization?(code: string): GeocodeAuthorization | undefined;
  /** Coordinata geocodificata GIÀ in cache (server-only). Il geocoding vero è in un job a parte. */
  cachedGeocode?(address: string, municipality: string): { lat: number; lng: number } | undefined;
  zoneFor?(code: string): TerritoryZoneCentroid | undefined;
  /**
   * Zona dedotta dal NOME che il feed già dichiara ("Tradate, Abbiate Guazzone"). Copre tutti gli
   * annunci presenti e futuri di quella zona senza una mappa codice→zona da mantenere a mano.
   * Consultata dopo `zoneFor` (curatura puntuale) e prima del ripiego comunale.
   */
  zoneByName?(municipality: string, zone: string): TerritoryZoneCentroid | undefined;
}

export interface AuthorizedOriginResult {
  origin: ResolvedOrigin | null;
  /** Coordinata a livello di immobile SCARTATA per implausibilità: da mettere in revisione. */
  review?: { code: string; precision: "property-coordinate" | "address-geocode"; reason: PlausibilityVerdict; distanceMeters: number };
}

function codeOf(property: NormalizedProperty): string {
  return property.sourceRef?.codice?.trim() ?? "";
}

/**
 * Risolve l'origine più precisa AUTORIZZATA e PLAUSIBILE, con ripiego sicuro. Ritorna anche un
 * eventuale item di revisione quando una coordinata di immobile è stata scartata.
 */
export function resolveAuthorizedOrigin(
  property: NormalizedProperty,
  sources: OriginSources = {},
): AuthorizedOriginResult {
  const base = resolveMunicipalityOrigin(property);
  if (!base) return { origin: null }; // comune sconosciuto: niente da fare
  const code = codeOf(property);
  const centroid = base.coord;
  let review: AuthorizedOriginResult["review"];

  // 1) Coordinata curata a mano → property-coordinate (massima fiducia).
  const manual = code ? sources.manualCoord?.(code) : undefined;
  if (manual) {
    const p = checkPlausibility(manual.coord, centroid);
    if (p.ok) {
      return {
        origin: {
          coord: { ...manual.coord },
          precision: "property-coordinate",
          accuracyMeters: ORIGIN_ACCURACY_METERS["property-coordinate"],
          label: base.label,
          municipality: base.municipality,
          authorization: {
            precision: "property-coordinate",
            source: manual.source,
            reviewedBy: manual.reviewedBy,
            reviewedAt: manual.reviewedAt,
          },
        },
      };
    }
    review = { code, precision: "property-coordinate", reason: p.verdict, distanceMeters: p.distanceMeters };
  }

  // 2) Geocodifica autorizzata + coord in cache → address-geocode.
  const geoAuth = code ? sources.geocodeAuthorization?.(code) : undefined;
  const address = (property.address ?? "").trim();
  if (geoAuth && address) {
    const cached = sources.cachedGeocode?.(address, base.municipality);
    if (cached) {
      const p = checkPlausibility(cached, centroid);
      if (p.ok) {
        return {
          origin: {
            coord: { lat: cached.lat, lng: cached.lng },
            precision: "address-geocode",
            accuracyMeters: ORIGIN_ACCURACY_METERS["address-geocode"],
            label: base.label,
            municipality: base.municipality,
            authorization: {
              precision: "address-geocode",
              source: geoAuth.source,
              reviewedBy: geoAuth.reviewedBy,
              reviewedAt: geoAuth.reviewedAt,
            },
          },
          review,
        };
      }
      review = review ?? { code, precision: "address-geocode", reason: p.verdict, distanceMeters: p.distanceMeters };
    }
  }

  // 3) Centroide di zona (pubblico, nessuna autorizzazione).
  //    3a) curatura puntuale per codice; 3b) altrimenti dedotta dal NOME di zona del feed.
  const zoneFromName = (() => {
    if (!sources.zoneByName || !property.zoneName) return undefined;
    const parsed = parseZoneField(property.zoneName, property.town);
    const zoneSlug = parsed.zone ?? normalizeMunicipality(property.zoneName);
    if (!zoneSlug || zoneSlug === base.municipality) return undefined;
    return sources.zoneByName(base.municipality, zoneSlug);
  })();
  const zone = (code ? sources.zoneFor?.(code) : undefined) ?? zoneFromName;
  if (zone) {
    return {
      origin: {
        coord: { ...zone.coord },
        precision: "zone-centroid",
        accuracyMeters: ORIGIN_ACCURACY_METERS["zone-centroid"],
        label: zone.label,
        municipality: base.municipality,
      },
      review,
    };
  }

  // 4) Ripiego: centroide del comune.
  return { origin: base, review };
}

/** Adattatore a `resolveOrigin` del motore (sync, ripiego sicuro): scarta l'eventuale review. */
export function makeAuthorizedResolver(
  sources: OriginSources,
): (property: NormalizedProperty) => ResolvedOrigin | null {
  return (property) => resolveAuthorizedOrigin(property, sources).origin;
}
