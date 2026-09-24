// Test del modello dell'esploratore schematico di distanze (Prompt 12): geometria deterministica e,
// soprattutto, ASSENZA di qualunque coordinata geografica (privacy per costruzione).

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { buildExplorerModel } from "../explorerModel";
import { buildTerritoryView, type TerritoryViewCategory } from "../view";
import type { PublicListingTerritory, PublicTerritoryPoi } from "../types";

function poi(over: Partial<PublicTerritoryPoi> & { category: PublicTerritoryPoi["category"] }): PublicTerritoryPoi {
  return {
    category: over.category,
    name: over.name ?? "Luogo",
    distanceMeters: over.distanceMeters ?? 250,
    distanceMethod: "straight-line",
    provider: "osm-overpass",
    attribution: "© OpenStreetMap contributors",
    ...(over.sourceUrl ? { sourceUrl: over.sourceUrl } : {}),
  };
}

function categories(pois: PublicTerritoryPoi[]): TerritoryViewCategory[] {
  const territory: PublicListingTerritory = {
    realSmartCode: "1043",
    municipality: "tradate",
    method: "straight-line",
    originBasis: { precision: "municipality-centroid", label: "Tradate" },
    retrievedAt: "2026-08-13T10:00:00.000Z",
    pois,
  };
  return buildTerritoryView(territory, "it")!.categories;
}

describe("buildExplorerModel — geometria", () => {
  const cats = categories([
    poi({ category: "pharmacy", name: "Farmacia A", distanceMeters: 250 }),
    poi({ category: "pharmacy", name: "Farmacia B", distanceMeters: 500 }),
    poi({ category: "railway-station", name: "Stazione", distanceMeters: 900 }),
    poi({ category: "park", name: "Parco", distanceMeters: 1200 }),
  ]);

  test("un punto per POI, con distanza e categoria conservate", () => {
    const m = buildExplorerModel(cats, "it");
    assert.equal(m.points.length, 4);
    const names = m.points.map((p) => p.name).sort();
    assert.deepEqual(names, ["Farmacia A", "Farmacia B", "Parco", "Stazione"]);
  });

  test("scala e anelli tondi ≥ distanza massima", () => {
    const m = buildExplorerModel(cats, "it");
    assert.ok(m.scaleMeters >= m.maxDistanceMeters);
    assert.equal(m.maxDistanceMeters, 1200);
    assert.equal(m.scaleMeters, 1500); // primo gradino della ladder ≥ 1200
    assert.ok(m.rings.length >= 1 && m.rings.length <= 4);
    assert.equal(m.rings.at(-1)?.distanceMeters, 1500);
  });

  test("raggio proporzionale alla distanza (più lontano = più esterno)", () => {
    const m = buildExplorerModel(cats, "it");
    const near = m.points.find((p) => p.name === "Farmacia A")!;
    const far = m.points.find((p) => p.name === "Parco")!;
    const rNear = Math.hypot(near.xPct - 50, near.yPct - 50);
    const rFar = Math.hypot(far.xPct - 50, far.yPct - 50);
    assert.ok(rFar > rNear);
  });

  test("deterministico: stesso input → stesso output", () => {
    assert.deepEqual(buildExplorerModel(cats, "it"), buildExplorerModel(cats, "it"));
  });

  test("input vuoto → nessun punto, nessun crash", () => {
    const m = buildExplorerModel([], "it");
    assert.deepEqual(m.points, []);
  });
});

describe("PRIVACY: nessuna coordinata geografica nel modello", () => {
  test("il modello contiene solo percentuali schematiche, mai lat/lng", () => {
    const cats = categories([poi({ category: "pharmacy", distanceMeters: 300 })]);
    const m = buildExplorerModel(cats, "it");
    const serialized = JSON.stringify(m);
    // Nessun campo di coordinate; i valori sono solo xPct/yPct in [0,100].
    assert.equal(/\b(lat|lng|lon|coord|latitude|longitude)\b/i.test(serialized), false);
    for (const p of m.points) {
      assert.ok(p.xPct >= 0 && p.xPct <= 100);
      assert.ok(p.yPct >= 0 && p.yPct <= 100);
    }
  });
});
