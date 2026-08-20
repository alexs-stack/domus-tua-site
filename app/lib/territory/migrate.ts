// Migrazioni di schema dei record territoriali. Lette al confine di LETTURA degli store: un record
// prodotto da uno schema precedente viene portato allo schema corrente PRIMA della validazione.
//
// v1 → v2 (Territory V2):
//   • `coordSource` ("municipality-centroid" | "property") → gerarchia di precisione:
//       "municipality-centroid" → originPrecision "municipality-centroid";
//       "property"              → originPrecision "property-coordinate".
//   • si aggiungono `originAccuracyMeters` (dal livello) e `originLabel` (dal comune);
//   • la vista pubblica incorporata (`lastApprovedPublic`) riceve `originBasis`;
//   • lo `status` è PRESERVATO — un draft NON diventa mai "approved" per una migrazione.
//
// NB sicurezza: un vecchio record "property" NON portava un'autorizzazione esplicita, che v2
// richiede per le origini a livello di immobile. Migrato a "property-coordinate" SENZA
// autorizzazione, non supera la validazione e viene scartato in lettura (fail-safe): un'origine
// a livello di immobile non autorizzata non deve pubblicarsi. Nel pilota "property" non è mai
// stato prodotto, quindi il caso è teorico.

import { ORIGIN_ACCURACY_METERS, TERRITORY_SCHEMA_VERSION } from "./constants";
import { municipalityLabelFromSlug } from "./origin";
import {
  ListingTerritoryEnrichmentSchema,
  MunicipalityTerritoryProfileSchema,
  type OriginPrecision,
} from "./types";

type Raw = Record<string, unknown>;

function isObject(v: unknown): v is Raw {
  return typeof v === "object" && v !== null;
}

function precisionFromCoordSource(coordSource: unknown): OriginPrecision {
  return coordSource === "property" ? "property-coordinate" : "municipality-centroid";
}

/** Aggiunge i campi origine v2 a un record v1 (senza toccare status/approval/pois). */
function upgradeOriginFields(rec: Raw): { rec: Raw; precision: OriginPrecision; label: string } {
  const precision = precisionFromCoordSource(rec.coordSource);
  const municipality = typeof rec.municipality === "string" ? rec.municipality : "";
  const label = municipalityLabelFromSlug(municipality) || municipality || "n/d";
  const { coordSource: _drop, ...rest } = rec;
  void _drop;
  return {
    rec: {
      ...rest,
      schemaVersion: TERRITORY_SCHEMA_VERSION,
      originPrecision: precision,
      originAccuracyMeters: ORIGIN_ACCURACY_METERS[precision],
      originLabel: label,
    },
    precision,
    label,
  };
}

/** Aggiunge `originBasis` a una vista pubblica incorporata che non ce l'ha ancora. */
function upgradePublicView(view: unknown, precision: OriginPrecision, label: string): unknown {
  if (isObject(view) && !("originBasis" in view)) {
    return { ...view, originBasis: { precision, label } };
  }
  return view;
}

function currentVersion(raw: unknown): number {
  return isObject(raw) && typeof raw.schemaVersion === "number" ? raw.schemaVersion : 0;
}

/** Porta un record immobile allo schema corrente (idempotente: v≥2 → invariato). */
export function migrateListingEnrichmentRaw(raw: unknown): unknown {
  if (!isObject(raw) || currentVersion(raw) >= TERRITORY_SCHEMA_VERSION) return raw;
  const { rec, precision, label } = upgradeOriginFields(raw);
  if ("lastApprovedPublic" in rec) {
    rec.lastApprovedPublic = upgradePublicView(rec.lastApprovedPublic, precision, label);
  }
  return rec;
}

/** Porta un profilo comunale allo schema corrente (idempotente). */
export function migrateMunicipalityProfileRaw(raw: unknown): unknown {
  if (!isObject(raw) || currentVersion(raw) >= TERRITORY_SCHEMA_VERSION) return raw;
  return upgradeOriginFields(raw).rec;
}

/** Migra POI-in-lettura e poi valida (safeParse): l'unico ingresso sicuro dagli store. */
export function parseListingEnrichmentMigrated(raw: unknown) {
  return ListingTerritoryEnrichmentSchema.safeParse(migrateListingEnrichmentRaw(raw));
}

export function parseMunicipalityProfileMigrated(raw: unknown) {
  return MunicipalityTerritoryProfileSchema.safeParse(migrateMunicipalityProfileRaw(raw));
}
