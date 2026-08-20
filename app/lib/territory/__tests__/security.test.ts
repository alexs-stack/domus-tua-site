// Regressioni di SICUREZZA/PRIVACY del territorio (Prompt 16): SSRF sugli endpoint, ciclo di vita
// (ritiro/revoca), assenza strutturale di coordinate nelle viste pubbliche, e assenza di segreti.
// Sono i test che devono FALLIRE se una coordinata o un endpoint interno rientrano di soppiatto.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { checkEndpoint, isSafeEndpoint, filterSafeEndpoints } from "../endpointPolicy";
import { OverpassEndpointPool } from "../provider/endpoints";
import { withdrawTerritory, revokeOriginAuthorization, shouldPurgeTerritory } from "../lifecycle";
import { toPublicListingTerritory } from "../public";
import {
  PublicListingTerritorySchema,
  PublicTerritoryPoiSchema,
  PublicOriginBasisSchema,
  isPropertyLevelPrecision,
} from "../types";
import { PublicAreaFactSchema, PublicAreaProfileSchema } from "../area/types";
import { TERRITORY_SCHEMA_VERSION } from "../constants";
import type { ListingTerritoryEnrichment, TerritoryPoi } from "../types";

const NOW = new Date("2026-08-14T10:00:00.000Z");

describe("SSRF: politica degli endpoint esterni", () => {
  test("accetta solo host in allowlist su HTTPS", () => {
    assert.equal(isSafeEndpoint("https://overpass-api.de/api/interpreter"), true);
    assert.equal(isSafeEndpoint("https://nominatim.openstreetmap.org/search"), true);
  });

  test("rifiuta reti interne / metadata cloud / loopback", () => {
    assert.equal(checkEndpoint("https://169.254.169.254/latest/meta-data").reason, "private-host");
    assert.equal(checkEndpoint("https://127.0.0.1/api").reason, "private-host");
    assert.equal(checkEndpoint("https://10.0.0.5/api").reason, "private-host");
    assert.equal(checkEndpoint("https://192.168.1.1/api").reason, "private-host");
    assert.equal(checkEndpoint("https://localhost/api").reason, "private-host");
    assert.equal(checkEndpoint("https://metadata.internal/api").reason, "private-host");
  });

  test("rifiuta HTTP in chiaro e host non in allowlist", () => {
    assert.equal(checkEndpoint("http://overpass-api.de/api").reason, "not-https");
    assert.equal(checkEndpoint("https://evil.example/api").reason, "host-not-allowed");
    assert.equal(checkEndpoint("non-un-url").reason, "not-a-url");
  });

  test("il pool SCARTA gli endpoint non sicuri e lancia se non ne resta nessuno", () => {
    // Un mirror valido + uno interno → resta solo quello valido.
    const pool = new OverpassEndpointPool(["https://overpass-api.de/api/interpreter", "https://169.254.169.254/x"]);
    assert.equal(pool.size, 1);
    // Solo endpoint interni → nessun endpoint sicuro → errore.
    assert.throws(() => new OverpassEndpointPool(["https://127.0.0.1/x"]), /SICURO/);
  });

  test("filterSafeEndpoints tiene solo i sicuri", () => {
    const out = filterSafeEndpoints(["https://overpass-api.de/i", "https://10.0.0.1/i", "http://overpass-api.de/i"]);
    assert.deepEqual(out, ["https://overpass-api.de/i"]);
  });
});

function poi(state: TerritoryPoi["approval"]["state"] = "approved"): TerritoryPoi {
  return {
    providerId: "node/1",
    category: "pharmacy",
    name: "Farmacia",
    distanceMeters: 200,
    distanceMethod: "straight-line",
    source: { provider: "osm-overpass", retrievedAt: NOW.toISOString(), attribution: "© OpenStreetMap contributors" },
    approval: { state },
    coord: { lat: 45.7085, lng: 8.9065 },
  };
}

function propertyRecord(over: Partial<ListingTerritoryEnrichment> = {}): ListingTerritoryEnrichment {
  return {
    schemaVersion: TERRITORY_SCHEMA_VERSION,
    realSmartCode: "1043",
    municipality: "tradate",
    originPrecision: "property-coordinate",
    originAccuracyMeters: 10,
    originLabel: "Tradate",
    origin: { lat: 45.7081, lng: 8.9061 },
    originAuthorization: { precision: "property-coordinate", source: "atto", reviewedBy: "raffaela", reviewedAt: NOW.toISOString() },
    fingerprint: { municipality: "tradate", coordKey: "45.708,8.906", ultimaModifica: "2026-08-01", schemaVersion: TERRITORY_SCHEMA_VERSION, hash: "abc" },
    status: "approved",
    pois: [poi()],
    retrievedAt: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
    ...over,
  };
}

describe("ciclo di vita: ritiro e revoca dell'origine precisa", () => {
  const actor = { actor: "raffaela", at: NOW.toISOString() };

  test("ritiro immobile → disabilitato, precisione ridotta al centroide, autorizzazione rimossa", () => {
    const { record, audit } = withdrawTerritory(propertyRecord(), actor);
    assert.equal(record.status, "disabled");
    assert.equal(record.originPrecision, "municipality-centroid");
    assert.equal(record.originAuthorization, undefined);
    assert.equal(isPropertyLevelPrecision(record.originPrecision), false);
    assert.equal(audit.action, "withdraw");
    // Disabilitato → il pubblico non mostra nulla (nessuna origine esatta esposta).
    assert.equal(toPublicListingTerritory(record, { now: NOW, freshnessDays: 180 }), null);
  });

  test("revoca autorizzazione → precisione ridotta, autorizzazione rimossa, record STALE", () => {
    const { record, audit } = revokeOriginAuthorization(propertyRecord(), actor);
    assert.equal(record.status, "stale");
    assert.equal(record.originPrecision, "municipality-centroid");
    assert.equal(record.originAuthorization, undefined);
    assert.equal(audit.action, "revoke-origin");
    // Stale → non pubblicabile finché non ri-derivato dal centroide.
    assert.equal(toPublicListingTerritory(record, { now: NOW, freshnessDays: 180 }), null);
  });

  test("ritenzione: un record disabilitato oltre la finestra è cancellabile", () => {
    const old = propertyRecord({ status: "disabled", updatedAt: "2026-01-01T00:00:00.000Z" });
    assert.equal(shouldPurgeTerritory(old, NOW, 90), true);
    const recent = propertyRecord({ status: "disabled", updatedAt: NOW.toISOString() });
    assert.equal(shouldPurgeTerritory(recent, NOW, 90), false);
    // Un record NON disabilitato non si cancella mai per ritenzione.
    assert.equal(shouldPurgeTerritory(propertyRecord({ status: "approved" }), NOW, 0), false);
  });
});

describe("le viste pubbliche NON possono contenere coordinate (per costruzione)", () => {
  const strictSchemas = [
    ["PublicListingTerritory", PublicListingTerritorySchema],
    ["PublicTerritoryPoi", PublicTerritoryPoiSchema],
    ["PublicOriginBasis", PublicOriginBasisSchema],
    ["PublicAreaFact", PublicAreaFactSchema],
    ["PublicAreaProfile", PublicAreaProfileSchema],
  ] as const;

  test("gli schemi pubblici sono .strict() (nessun campo extra come lat/lng può passare)", () => {
    for (const [name, schema] of strictSchemas) {
      // Un oggetto minimale + un campo coordinata → deve essere RIFIUTATO dallo strict.
      const withCoord = { lat: 45.7, lng: 8.9, extra: 1 } as Record<string, unknown>;
      const parsed = schema.safeParse(withCoord);
      assert.equal(parsed.success, false, `${name} deve rifiutare campi non previsti (lat/lng)`);
    }
  });

  test("nessuno schema pubblico dichiara un campo di coordinate", () => {
    for (const [name, schema] of strictSchemas) {
      const shape = (schema as { shape?: Record<string, unknown> }).shape ?? {};
      for (const key of Object.keys(shape)) {
        assert.ok(!/^(lat|lng|lon|coord|origin)$/i.test(key), `${name} non deve avere il campo ${key}`);
      }
    }
  });

  test("un payload pubblico reale non contiene lat/lng/coord", () => {
    const pub = toPublicListingTerritory(propertyRecord(), { now: NOW, freshnessDays: 180 });
    const json = JSON.stringify(pub);
    for (const bad of ["\"lat\"", "\"lng\"", "\"coord\"", "45.708", "45.7085"]) {
      assert.equal(json.includes(bad), false, `il payload pubblico non deve contenere ${bad}`);
    }
  });
});

describe("assenza di segreti nelle superfici pubbliche", () => {
  test("un payload pubblico non contiene qualcosa che somigli a una chiave", () => {
    const pub = toPublicListingTerritory(propertyRecord(), { now: NOW, freshnessDays: 180 });
    const raw = JSON.stringify(pub);
    for (const pattern of [/sk-[a-z0-9]/i, /api[_-]?key/i, /secret/i, /bearer /i, /:\/\/[^/]*:[^@]*@/]) {
      assert.doesNotMatch(raw, pattern);
    }
  });
});
