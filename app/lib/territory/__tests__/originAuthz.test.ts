// Origine autorizzata a livello di immobile (Prompt 8): geocodifica/zona/coordinata curata.
//
// Copre: assenza di autorizzazione → centroide; coordinata curata → property; geocode autorizzato →
// address; geocode implausibile → revisione + ripiego; provider assente → ripiego; zona; REVOCA;
// showAddress NON basta; coordinate mai nel pubblico.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { resolveAuthorizedOrigin, type OriginSources } from "../originAuthz";
import { createFakeGeocoder, createMemoryGeocodeCache, geocodeAddressKey } from "../geocoder";
import { toPublicListingTerritory } from "../public";
import type { NormalizedProperty } from "../../realsmart/types";
import type { ListingTerritoryEnrichment, TerritoryManualCoord, TerritoryZoneCentroid } from "../types";

function property(over: { codice?: string; address?: string; showAddress?: boolean } = {}): NormalizedProperty {
  return {
    sourceRef: { codice: over.codice ?? "1043" },
    town: "Tradate",
    address: over.address ?? "Via Petrarca 7",
    showAddress: over.showAddress ?? false,
  } as unknown as NormalizedProperty;
}

const MANUAL: TerritoryManualCoord = {
  coord: { lat: 45.71, lng: 8.91 }, // ~1 km dal centroide di Tradate: plausibile
  source: "rilievo cliente",
  reviewedBy: "Raffaela",
  reviewedAt: "2026-08-10T09:00:00.000Z",
};
const GEO_AUTH = { source: "consenso proprietario", reviewedBy: "Raffaela", reviewedAt: "2026-08-10T09:00:00.000Z" };
const ZONE: TerritoryZoneCentroid = {
  slug: "abbiate-guazzone",
  label: "Abbiate Guazzone",
  municipality: "tradate",
  coord: { lat: 45.72, lng: 8.92 },
};

describe("gerarchia autorizzata", () => {
  test("nessuna autorizzazione → municipality-centroid", () => {
    const r = resolveAuthorizedOrigin(property(), {});
    assert.equal(r.origin?.precision, "municipality-centroid");
    assert.equal(r.origin?.authorization, undefined);
  });

  test("coordinata curata plausibile → property-coordinate + autorizzazione tracciata", () => {
    const sources: OriginSources = { manualCoord: (c) => (c === "1043" ? MANUAL : undefined) };
    const r = resolveAuthorizedOrigin(property(), sources);
    assert.equal(r.origin?.precision, "property-coordinate");
    assert.equal(r.origin?.authorization?.precision, "property-coordinate");
    assert.equal(r.origin?.authorization?.reviewedBy, "Raffaela");
    assert.deepEqual(r.origin?.coord, { lat: 45.71, lng: 8.91 });
  });

  test("geocode autorizzato + coord in cache (plausibile) → address-geocode", () => {
    const cache = createMemoryGeocodeCache();
    const sources: OriginSources = {
      geocodeAuthorization: (c) => (c === "1043" ? GEO_AUTH : undefined),
      cachedGeocode: (addr) => (addr === "Via Petrarca 7" ? { lat: 45.709, lng: 8.907 } : undefined),
    };
    const r = resolveAuthorizedOrigin(property(), sources);
    assert.equal(r.origin?.precision, "address-geocode");
    assert.equal(r.origin?.authorization?.precision, "address-geocode");
    void cache;
  });

  test("geocode autorizzato ma coord NON in cache (job non ancora girato) → ripiego comune", () => {
    const sources: OriginSources = { geocodeAuthorization: () => GEO_AUTH, cachedGeocode: () => undefined };
    const r = resolveAuthorizedOrigin(property(), sources);
    assert.equal(r.origin?.precision, "municipality-centroid");
  });

  test("zona assegnata (nessuna autorizzazione) → zone-centroid con etichetta zona", () => {
    const sources: OriginSources = { zoneFor: (c) => (c === "1043" ? ZONE : undefined) };
    const r = resolveAuthorizedOrigin(property(), sources);
    assert.equal(r.origin?.precision, "zone-centroid");
    assert.equal(r.origin?.label, "Abbiate Guazzone");
    assert.equal(r.origin?.authorization, undefined);
  });
});

describe("plausibilità: coordinate sbagliate → revisione, mai pubblicate", () => {
  test("coordinata curata TROPPO LONTANA → scartata, ripiego + item di revisione", () => {
    const far: TerritoryManualCoord = { ...MANUAL, coord: { lat: 45.9, lng: 9.3 } }; // ~35 km
    const sources: OriginSources = { manualCoord: () => far, zoneFor: () => ZONE };
    const r = resolveAuthorizedOrigin(property(), sources);
    assert.notEqual(r.origin?.precision, "property-coordinate");
    assert.equal(r.origin?.precision, "zone-centroid", "ripiega su zona");
    assert.equal(r.review?.precision, "property-coordinate");
    assert.equal(r.review?.reason, "too-far");
  });

  test("coordinata FUORI dai limiti regionali → scartata (out-of-bounds)", () => {
    const bad: TerritoryManualCoord = { ...MANUAL, coord: { lat: 41.9, lng: 12.5 } }; // Roma
    const r = resolveAuthorizedOrigin(property(), { manualCoord: () => bad });
    assert.equal(r.origin?.precision, "municipality-centroid");
    assert.equal(r.review?.reason, "out-of-bounds");
  });
});

describe("revoca e separazione da showAddress", () => {
  test("REVOCA (autorizzazione rimossa) → ritorno automatico a comune/zona", () => {
    const withAuth: OriginSources = { manualCoord: () => MANUAL };
    assert.equal(resolveAuthorizedOrigin(property(), withAuth).origin?.precision, "property-coordinate");
    // Rimosso l'accesso alla coord curata (revoca): ripiego immediato.
    const revoked: OriginSources = { manualCoord: () => undefined };
    assert.equal(resolveAuthorizedOrigin(property(), revoked).origin?.precision, "municipality-centroid");
  });

  test("showAddress=true da solo NON dà precisione a livello di immobile", () => {
    // Nessuna coord curata / geocode autorizzato: showAddress non c'entra con l'origine.
    const r = resolveAuthorizedOrigin(property({ showAddress: true }), {});
    assert.equal(r.origin?.precision, "municipality-centroid");
  });
});

describe("le coordinate non finiscono MAI nel pubblico", () => {
  test("anche con property-coordinate, la vista pubblica non ha coordinate", () => {
    const origin = resolveAuthorizedOrigin(property(), { manualCoord: () => MANUAL }).origin!;
    const record: ListingTerritoryEnrichment = {
      schemaVersion: 2,
      realSmartCode: "1043",
      municipality: "tradate",
      origin: origin.coord,
      originPrecision: origin.precision,
      originAccuracyMeters: origin.accuracyMeters,
      originLabel: origin.label,
      originAuthorization: origin.authorization,
      fingerprint: { municipality: "tradate", coordKey: "45.708,8.906", ultimaModifica: "", schemaVersion: 2, hash: "h" },
      status: "approved",
      pois: [
        {
          providerId: "node/1",
          category: "pharmacy",
          name: "Farmacia",
          distanceMeters: 100,
          distanceMethod: "straight-line",
          source: { provider: "osm-overpass", retrievedAt: "2026-08-13T10:00:00.000Z", attribution: "© OSM" },
          approval: { state: "approved" },
          coord: origin.coord,
        },
      ],
      retrievedAt: "2026-08-13T10:00:00.000Z",
      updatedAt: "2026-08-13T10:00:00.000Z",
    };
    const pub = toPublicListingTerritory(record, { now: new Date("2026-08-13T11:00:00.000Z"), freshnessDays: 180 });
    const json = JSON.stringify(pub);
    assert.ok(!/"lat"|"lng"|"coord"/.test(json), "nessuna coordinata nel pubblico");
    assert.equal(pub?.originBasis.precision, "property-coordinate");
  });
});

describe("geocoder (fake) + chiave di cache", () => {
  test("il geocoder fake ritorna la coord iniettata; chiave stabile", async () => {
    const g = createFakeGeocoder({ "Via Petrarca 7": { lat: 45.71, lng: 8.91 } }, "2026-08-13T10:00:00.000Z");
    const res = await g.geocode({ address: "Via Petrarca 7", municipality: "tradate" });
    assert.deepEqual(res?.coord, { lat: 45.71, lng: 8.91 });
    assert.equal(geocodeAddressKey(" Via  Petrarca 7 ", "Tradate"), geocodeAddressKey("via petrarca 7", "tradate"));
  });
});
