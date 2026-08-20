// Test di PRESTAZIONE/caching del territorio (Prompt 15): budget del payload pubblico, minimalità
// della proiezione (niente coordinate/storico/categorie inutili), tag di cache MIRATI e le guardie
// dell'endpoint di revalidazione. Deterministico, nessuna rete.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { toPublicListingTerritory } from "../public";
import { territoryCacheTags } from "../publicRead";
import { TERRITORY_SCHEMA_VERSION } from "../constants";
import { TERRITORY_POI_CATEGORIES } from "../categories";
import type { ListingTerritoryEnrichment, TerritoryPoi } from "../types";

const NOW = new Date("2026-08-14T10:00:00.000Z");

/** Budget del payload pubblico serializzato per una scheda immobile (5 categorie piene). ~2.5 KB. */
const PAYLOAD_BUDGET_BYTES = 3000;

function poi(providerId: string, category: TerritoryPoi["category"], name: string, d: number): TerritoryPoi {
  return {
    providerId,
    category,
    name,
    distanceMeters: d,
    distanceMethod: "straight-line",
    source: { provider: "osm-overpass", retrievedAt: NOW.toISOString(), attribution: "© OpenStreetMap contributors", evidence: `${category}=x`, sourceUrl: "https://www.openstreetmap.org/node/1" },
    approval: { state: "approved", approvedBy: "raffaela", approvedAt: NOW.toISOString(), note: "verificato di persona" },
    coord: { lat: 45.7085, lng: 8.9065 },
  };
}

// Record "pieno": 5 categorie × 3 POI = 15 POI, con coordinate, evidenza, storico d'approvazione.
function fullRecord(): ListingTerritoryEnrichment {
  const pois: TerritoryPoi[] = [];
  TERRITORY_POI_CATEGORIES.forEach((c, ci) => {
    for (let i = 0; i < 3; i++) pois.push(poi(`node/${ci}${i}`, c, `Luogo ${c} ${i}`, 100 + ci * 50 + i * 20));
  });
  return {
    schemaVersion: TERRITORY_SCHEMA_VERSION,
    realSmartCode: "1043",
    municipality: "tradate",
    originPrecision: "municipality-centroid",
    originAccuracyMeters: 2000,
    originLabel: "Tradate",
    origin: { lat: 45.708, lng: 8.906 },
    fingerprint: { municipality: "tradate", coordKey: "45.708,8.906", ultimaModifica: "2026-08-01", schemaVersion: TERRITORY_SCHEMA_VERSION, hash: "deadbeef" },
    status: "approved",
    pois,
    retrievedAt: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
  };
}

describe("budget e minimalità del payload pubblico", () => {
  const pub = toPublicListingTerritory(fullRecord(), { now: NOW, freshnessDays: 180, maxPerCategory: 2 });

  test("è presente e limitato a ≤2 POI per categoria", () => {
    assert.ok(pub);
    for (const c of TERRITORY_POI_CATEGORIES) {
      assert.ok(pub.pois.filter((p) => p.category === c).length <= 2);
    }
  });

  test("nessun campo privato: coordinate, providerId, storico d'approvazione, evidenza", () => {
    const json = JSON.stringify(pub);
    // NB: "node/" NON è vietato: compare nel sourceUrl PUBBLICO di OpenStreetMap (link consentito).
    for (const bad of ["lat", "lng", "coord", "providerId", "approvedBy", "\"approval\"", "evidence", "45.70", "raffaela", "verificato"]) {
      assert.equal(json.includes(bad), false, `il payload pubblico NON deve contenere "${bad}"`);
    }
  });

  test("il payload serializzato resta sotto il budget di byte", () => {
    const bytes = Buffer.byteLength(JSON.stringify(pub), "utf8");
    assert.ok(bytes <= PAYLOAD_BUDGET_BYTES, `payload ${bytes} byte oltre il budget ${PAYLOAD_BUDGET_BYTES}`);
  });

  test("record non approvato → null (territorio spento = zero payload)", () => {
    const draft = { ...fullRecord(), status: "draft" as const };
    assert.equal(toPublicListingTerritory(draft, { now: NOW, freshnessDays: 180 }), null);
  });
});

describe("tag di cache MIRATI (invalidazione scoped)", () => {
  test("un immobile porta il tag generico + quello per-immobile + quello per-comune", () => {
    assert.deepEqual(territoryCacheTags("1043", "Tradate"), ["territory", "territory:listing:1043", "territory:profile:tradate"]);
  });

  test("senza comune, solo i tag generico e per-immobile", () => {
    assert.deepEqual(territoryCacheTags("1043"), ["territory", "territory:listing:1043"]);
  });

  test("il comune è normalizzato (slug), mai testo libero", () => {
    const tags = territoryCacheTags("x", "Venegono Superiore");
    assert.ok(tags.includes("territory:profile:venegono-superiore"));
  });
});
