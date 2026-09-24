// Test del costruttore di vista "Vivere in zona" (Prompt 8).

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { buildTerritoryView, formatDistance } from "../view";
import type { PublicListingTerritory, PublicTerritoryPoi } from "../types";

function poi(over: Partial<PublicTerritoryPoi> & { category: PublicTerritoryPoi["category"] }): PublicTerritoryPoi {
  return {
    category: over.category,
    name: over.name ?? "Luogo",
    distanceMeters: over.distanceMeters ?? 250,
    distanceMethod: "straight-line",
    provider: over.provider ?? "osm-overpass",
    attribution: over.attribution ?? "© OpenStreetMap contributors",
    ...(over.sourceUrl ? { sourceUrl: over.sourceUrl } : {}),
  };
}

function territory(pois: PublicTerritoryPoi[]): PublicListingTerritory {
  return {
    realSmartCode: "1043",
    municipality: "tradate",
    method: "straight-line",
    originBasis: { precision: "municipality-centroid", label: "Tradate" },
    retrievedAt: "2026-08-13T10:00:00.000Z",
    pois,
  };
}

describe("formatDistance", () => {
  test("sotto il km → metri", () => {
    assert.equal(formatDistance(250, "it"), "≈ 250 m");
    assert.equal(formatDistance(0, "it"), "≈ 0 m");
  });
  test("dal km in su → chilometri con decimale localizzato", () => {
    assert.equal(formatDistance(1200, "it"), "≈ 1,2 km"); // virgola in italiano
    assert.equal(formatDistance(1200, "en"), "≈ 1.2 km"); // punto in inglese
  });
});

describe("buildTerritoryView", () => {
  test("dato approvato → vista con categorie, metodo e data", () => {
    const view = buildTerritoryView(
      territory([
        poi({ category: "pharmacy", name: "Farmacia Centrale", distanceMeters: 250 }),
        poi({ category: "railway-station", name: "Stazione di Tradate", distanceMeters: 900 }),
      ]),
      "it",
    );
    assert.ok(view);
    assert.equal(view.title, "Vivere in zona");
    assert.equal(view.methodLabel, "Distanza indicativa in linea d'aria");
    assert.match(view.updatedLabel, /Dati aggiornati al .*2026/);
    // Ordine canonico: stazione prima della farmacia.
    assert.deepEqual(view.categories.map((c) => c.category), ["railway-station", "pharmacy"]);
    assert.equal(view.categories[1].label, "Farmacia");
    assert.equal(view.categories[1].pois[0].distanceLabel, "≈ 250 m");
    assert.equal(view.attribution, "© OpenStreetMap contributors");
  });

  test("nessun dato → null (sezione nascosta)", () => {
    assert.equal(buildTerritoryView(null, "it"), null);
    assert.equal(buildTerritoryView(territory([]), "it"), null);
  });

  test("categorie parziali → solo quelle presenti", () => {
    const view = buildTerritoryView(territory([poi({ category: "park", name: "Parco" })]), "it");
    assert.ok(view);
    assert.deepEqual(view.categories.map((c) => c.category), ["park"]);
  });

  test("nomi lunghi non vengono troncati", () => {
    const longName = "Farmacia Comunale del Quartiere Nord-Est presso il Centro Commerciale";
    const view = buildTerritoryView(territory([poi({ category: "pharmacy", name: longName })]), "it");
    assert.equal(view?.categories[0].pois[0].name, longName);
  });

  test("massimo 2 POI per categoria (difensivo)", () => {
    const view = buildTerritoryView(
      territory([
        poi({ category: "pharmacy", name: "A" }),
        poi({ category: "pharmacy", name: "B" }),
        poi({ category: "pharmacy", name: "C" }),
      ]),
      "it",
    );
    assert.equal(view?.categories[0].pois.length, 2);
  });

  test("nessuna coordinata nel modello di vista", () => {
    const view = buildTerritoryView(territory([poi({ category: "school", name: "Scuola" })]), "it");
    const json = JSON.stringify(view);
    assert.equal(json.includes("lat"), false);
    assert.equal(json.includes("lng"), false);
    assert.equal(json.includes("coord"), false);
  });

  test("locale inglese → titolo ed etichette tradotti", () => {
    const view = buildTerritoryView(territory([poi({ category: "school", name: "School" })]), "en");
    assert.equal(view?.title, "Living nearby");
    assert.equal(view?.categories[0].label, "School");
    assert.equal(view?.methodLabel, "Approximate straight-line distance");
  });

  test("sourceUrl proiettato solo se presente e sicuro", () => {
    const withUrl = buildTerritoryView(
      territory([poi({ category: "park", name: "Parco", sourceUrl: "https://www.openstreetmap.org/node/1" })]),
      "it",
    );
    assert.equal(withUrl?.categories[0].pois[0].sourceUrl, "https://www.openstreetmap.org/node/1");
  });

  test("distanza numerica esposta accanto all'etichetta (per l'esploratore)", () => {
    const view = buildTerritoryView(territory([poi({ category: "pharmacy", distanceMeters: 320 })]), "it");
    assert.equal(view?.categories[0].pois[0].distanceMeters, 320);
    assert.equal(view?.categories[0].pois[0].distanceLabel, "≈ 320 m");
  });

  test("modalità e stringhe esploratore presenti e localizzate", () => {
    const view = buildTerritoryView(territory([poi({ category: "pharmacy" })]), "it");
    assert.equal(view?.originMode, "municipality");
    assert.equal(view?.explorer.reveal, "Esplora le distanze");
    assert.equal(view?.explorer.centerLabel, "Tradate");
  });
});

describe("modalità d'origine: property vs zone vs municipality", () => {
  function withBasis(precision: PublicListingTerritory["originBasis"]["precision"], label: string): PublicListingTerritory {
    return { ...territory([poi({ category: "pharmacy" })]), originBasis: { precision, label } };
  }

  test("property-coordinate → 'dall'immobile', centro 'Immobile'", () => {
    const v = buildTerritoryView(withBasis("property-coordinate", "Via Roma 1"), "it");
    assert.equal(v?.originMode, "property");
    assert.equal(v?.originLabel, "Distanze indicative dall'immobile");
    assert.equal(v?.explorer.centerLabel, "Immobile");
  });

  test("zone-centroid → 'dal centro della zona X'", () => {
    const v = buildTerritoryView(withBasis("zone-centroid", "San Rocco"), "it");
    assert.equal(v?.originMode, "zone");
    assert.equal(v?.originLabel, "Distanze indicative dal centro della zona San Rocco");
    assert.equal(v?.contextLabel, "Zona San Rocco");
    assert.equal(v?.explorer.centerLabel, "Zona San Rocco");
  });

  test("municipality-centroid → 'dal centro di X' (mai dall'immobile)", () => {
    const v = buildTerritoryView(withBasis("municipality-centroid", "Tradate"), "it");
    assert.equal(v?.originMode, "municipality");
    assert.equal(v?.originLabel, "Distanze indicative dal centro di Tradate");
    assert.equal(v?.contextLabel, "Comune di Tradate");
  });
});
