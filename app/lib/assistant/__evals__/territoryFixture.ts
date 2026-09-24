// Lettore territoriale FIXTURE per l'eval (Prompt 13): dati sintetici, nessuna rete, nessun provider.
//
// Attiva la feature territorio nell'eval così get_area_profile è registrato e get_listing_details
// restituisce POI per l'immobile di prova. I dati sono inventati attorno a Tradate: servono solo a
// far esercitare la SEPARAZIONE immobile↔zona e le regole di origine/privacy, non a misurare fatti.

import { createStoreTerritoryReader, type AssistantTerritoryReader } from "../tools/territory";
import { MemoryTerritoryRepository } from "../../territory/store/memory";
import { TERRITORY_SCHEMA_VERSION } from "../../territory/constants";
import type { ListingTerritoryEnrichment } from "../../territory/types";
import type { PublicAreaProfile } from "../../territory/area/types";
import type { getPublicAreaProfile } from "../../territory/area/data";

const ISO = new Date().toISOString(); // fresco rispetto a "ora": il record non risulta stale

const RECORD: ListingTerritoryEnrichment = {
  schemaVersion: TERRITORY_SCHEMA_VERSION,
  realSmartCode: "villa-giardino-tradate",
  municipality: "tradate",
  originPrecision: "municipality-centroid",
  originAccuracyMeters: 2000,
  originLabel: "Tradate",
  origin: { lat: 45.708, lng: 8.906 },
  fingerprint: { municipality: "tradate", coordKey: "45.708,8.906", ultimaModifica: "2026-08-01", schemaVersion: TERRITORY_SCHEMA_VERSION, hash: "eval" },
  status: "approved",
  pois: [
    { providerId: "node/1", category: "pharmacy", name: "Farmacia Centrale", distanceMeters: 240, distanceMethod: "straight-line", source: { provider: "osm-overpass", retrievedAt: ISO, attribution: "© OpenStreetMap contributors", evidence: "amenity=pharmacy" }, approval: { state: "approved", approvedBy: "eval", approvedAt: ISO }, coord: { lat: 45.7085, lng: 8.9065 } },
    { providerId: "node/2", category: "railway-station", name: "Stazione di Tradate", distanceMeters: 950, distanceMethod: "straight-line", source: { provider: "osm-overpass", retrievedAt: ISO, attribution: "© OpenStreetMap contributors", evidence: "railway=station" }, approval: { state: "approved", approvedBy: "eval", approvedAt: ISO }, coord: { lat: 45.71, lng: 8.9055 } },
  ],
  retrievedAt: ISO,
  updatedAt: ISO,
};

const AREA: PublicAreaProfile = {
  municipality: "tradate",
  facts: [
    { category: "transport", scope: "municipality", text: "La stazione di Tradate è servita da una linea ferroviaria regionale.", sourceOwner: "Comune di Tradate", sourceUrl: "https://www.comune.tradate.va.it/", reviewedAt: "2026-08-01T00:00:00.000Z" },
    { category: "municipal-service", scope: "municipality", text: "Il comune dispone di biblioteca e anagrafe nel centro cittadino.", sourceOwner: "Comune di Tradate", sourceUrl: "https://www.comune.tradate.va.it/servizi", reviewedAt: "2026-08-01T00:00:00.000Z" },
  ],
};

/** Reader fixture: record approvato per l'immobile di prova + profilo d'area per Tradate. */
export function buildEvalTerritoryReader(): AssistantTerritoryReader {
  const repo = new MemoryTerritoryRepository();
  void repo.putListingEnrichment(RECORD);
  const areaProfile: typeof getPublicAreaProfile = (municipality) =>
    municipality === "tradate" ? AREA : null;
  return createStoreTerritoryReader({ repository: repo, now: () => new Date(), areaProfile });
}
