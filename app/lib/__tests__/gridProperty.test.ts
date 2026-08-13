// Proiezione da griglia (toGridProperty): la card serializza SOLO ciò che mostra.
//
// Descrizione, galleria e FATTI strutturati servono alla scheda dell'immobile, non alla card:
// nella griglia (fino a decine di annunci) finivano nell'HTML per niente. `facts` era, dopo
// descrizione e galleria, il campo più pesante — e nessuno lo legge in catalogo (PropertyCard,
// filtro/ranking e ricerca usano features/excerpt/badges/mq…, mai facts).

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { toGridProperty, type Property } from "../properties";

const FULL: Property = {
  slug: "test",
  title: "Trilocale",
  zone: "Tradate",
  type: "Appartamento",
  status: "Vendita",
  price: "€ 250.000",
  priceValue: 250000,
  sqm: "90 m²",
  rooms: "3 locali",
  beds: "2 camere",
  baths: "1 bagno",
  badges: ["In esclusiva"],
  cover: "/img/cover.jpg",
  gallery: ["/img/1.jpg", "/img/2.jpg", "/img/3.jpg"],
  excerpt: "Trilocale luminoso.",
  description: ["Paragrafo uno.", "Paragrafo due."],
  features: ["Terrazzo"],
  facts: [
    { key: "mq", group: "principali", label: "Superficie", value: "90 m²", source: "realsmart", confidence: "alta" },
    { key: "bagni", group: "principali", label: "Bagni", value: "1", source: "realsmart", confidence: "alta" },
  ],
};

describe("toGridProperty — solo ciò che la card mostra", () => {
  const grid = toGridProperty(FULL);

  test("scarta description, gallery e facts", () => {
    assert.ok(!("description" in grid), "description non deve finire nel payload della griglia");
    assert.ok(!("gallery" in grid), "gallery non deve finire nel payload della griglia");
    assert.ok(!("facts" in grid), "facts non deve finire nel payload della griglia");
  });

  test("mantiene i campi mostrati dalla card e usati dal filtro/ranking", () => {
    for (const k of ["slug", "title", "zone", "price", "sqm", "rooms", "beds", "baths", "badges", "cover", "excerpt", "features"] as const) {
      assert.ok(k in grid, `manca il campo di card ${k}`);
    }
    assert.deepEqual(grid.badges, FULL.badges);
    assert.equal(grid.cover, FULL.cover);
  });

  test("il payload della griglia è più leggero dell'immobile completo", () => {
    const full = Buffer.byteLength(JSON.stringify(FULL));
    const lean = Buffer.byteLength(JSON.stringify(grid));
    assert.ok(lean < full, `la griglia (${lean}B) dovrebbe pesare meno dell'immobile completo (${full}B)`);
  });
});
