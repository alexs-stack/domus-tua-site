// Regressione del filtro per comune (ricerca in linguaggio naturale + filtri client).
//
// Bug coperto: con i dati RealSmart live `Property.zone` vale "Tradate (VA)". Quando la facet
// dei comuni conservava quel suffisso, il parser locale cercava `\bTradate \(VA\)\b` nella frase
// e non agganciava mai "villa a Tradate": senza ANTHROPIC_API_KEY il filtro comune era inerte.
// Le fixture qui sotto sono controllate (nessun immobile del feed reale).

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { comuneOf, comuniFacet, canonicalComune, matchesComune } from "../comune";
import { parseQueryLocal } from "../ai/parseQuery";
import { applyFilters } from "../ai/rank";
import { groupAvailableByTown } from "../geo/comuni";
import type { Property } from "../properties";
import type { SearchFacets } from "../ai/types";

/** Immobile minimo: contano solo i campi usati dai filtri. */
function fixture(over: Partial<Property> & { slug: string; zone: string }): Property {
  return {
    title: "Immobile di prova",
    type: "Appartamento",
    status: "Vendita",
    price: "€ 250.000",
    priceValue: 250000,
    sqm: "100 m²",
    rooms: "3 locali",
    beds: "2 camere",
    baths: "1 bagno",
    badges: [],
    cover: "/images/test.jpg",
    gallery: ["/images/test.jpg"],
    excerpt: "Immobile di prova.",
    description: ["Immobile di prova."],
    features: [],
    ...over,
  };
}

// Forma "live": comune + provincia, come costruito da realsmart/toProperty.ts.
const LISTINGS: Property[] = [
  fixture({ slug: "villa-tradate", zone: "Tradate (VA)", type: "Villa", priceValue: 480000 }),
  fixture({ slug: "trilocale-tradate", zone: "Tradate (VA)", priceValue: 230000 }),
  fixture({ slug: "villa-venegono", zone: "Venegono Inferiore (VA)", type: "Villa", priceValue: 520000 }),
  fixture({ slug: "bilocale-varese", zone: "Varese (VA)", priceValue: 180000 }),
  // Forma "demo": zona descrittiva dopo la virgola, senza provincia.
  fixture({ slug: "attico-tradate-centro", zone: "Tradate, centro", type: "Attico", priceValue: 420000 }),
  fixture({ slug: "villa-tradate-venduta", zone: "Tradate (VA)", type: "Villa", priceValue: 600000, availability: "sold" }),
];

const facets: SearchFacets = {
  comuni: comuniFacet(LISTINGS),
  types: ["Appartamento", "Attico", "Villa", "Commerciale", "Terreno"],
  featureLabels: ["Giardino", "Box / posto auto", "Terrazzo", "Doppi servizi"],
};

describe("comuneOf", () => {
  test("toglie la provincia e la zona descrittiva", () => {
    assert.equal(comuneOf("Tradate (VA)"), "Tradate");
    assert.equal(comuneOf("Tradate, centro"), "Tradate");
    assert.equal(comuneOf("Venegono Inferiore (VA)"), "Venegono Inferiore");
    assert.equal(comuneOf("Tradate"), "Tradate");
    assert.equal(comuneOf(""), "");
  });
});

describe("comuniFacet", () => {
  test("espone nomi puliti, unici e ordinati, con 'Tutti' in cima", () => {
    assert.deepEqual(facets.comuni, ["Tutti", "Tradate", "Varese", "Venegono Inferiore"]);
  });
});

describe("parseQueryLocal — comune", () => {
  test("aggancia il comune scritto in chiaro dall'utente", () => {
    // Il caso del bug: facet costruita dai dati live, comune scritto senza provincia.
    assert.equal(parseQueryLocal("villa a Tradate", facets).comune, "Tradate");
  });

  test("aggancia anche senza accenti/maiuscole e col nome più lungo", () => {
    assert.equal(parseQueryLocal("cerco casa a tradate", facets).comune, "Tradate");
    assert.equal(
      parseQueryLocal("villa a venegono inferiore", facets).comune,
      "Venegono Inferiore",
    );
  });

  test("non inventa un comune quando non è nominato", () => {
    assert.equal(parseQueryLocal("trilocale luminoso con terrazzo", facets).comune, undefined);
  });

  test("resta robusto se la facet arriva ancora con la provincia", () => {
    const legacy: SearchFacets = { ...facets, comuni: ["Tutti", "Tradate (VA)", "Varese (VA)"] };
    assert.equal(parseQueryLocal("villa a Tradate", legacy).comune, "Tradate (VA)");
  });
});

describe("applyFilters — comune", () => {
  test("filtra sugli immobili del comune, qualunque sia la forma di zone", () => {
    const slugs = applyFilters(LISTINGS, { comune: "Tradate" }).map((p) => p.slug);
    // "Tradate (VA)" e "Tradate, centro" combaciano; il venduto resta escluso.
    assert.deepEqual(slugs, ["villa-tradate", "trilocale-tradate", "attico-tradate-centro"]);
  });

  test("accetta anche il valore con provincia (output del modello o vecchi link)", () => {
    const slugs = applyFilters(LISTINGS, { comune: "Tradate (VA)" }).map((p) => p.slug);
    assert.deepEqual(slugs, ["villa-tradate", "trilocale-tradate", "attico-tradate-centro"]);
  });

  test("'Tutti' non filtra nulla", () => {
    assert.equal(applyFilters(LISTINGS, { comune: "Tutti" }).length, 5); // tutti tranne il venduto
  });

  test("un comune senza immobili non restituisce risultati", () => {
    assert.deepEqual(applyFilters(LISTINGS, { comune: "Como" }), []);
  });
});

describe("catena completa parser locale -> filtro", () => {
  test("'villa a Tradate sotto 500000' trova la villa di Tradate", () => {
    const filters = parseQueryLocal("villa a Tradate sotto 500000", facets);
    assert.deepEqual(
      { comune: filters.comune, type: filters.type, maxBudget: filters.maxBudget },
      { comune: "Tradate", type: "Villa", maxBudget: 500000 },
    );
    assert.deepEqual(applyFilters(LISTINGS, filters).map((p) => p.slug), ["villa-tradate"]);
  });
});

describe("allineamento tendina / mappa / filtro", () => {
  test("ogni chiave della mappa è una voce della tendina e filtra davvero", () => {
    // La tendina di PropertySearch usa comuniFacet(properties); la mappa groupAvailableByTown.
    for (const g of groupAvailableByTown(LISTINGS)) {
      assert.ok(facets.comuni.includes(g.key), `chiave mappa fuori dalla tendina: ${g.key}`);
      assert.equal(g.town, g.key);
      assert.equal(applyFilters(LISTINGS, { comune: g.key }).length, g.count);
    }
  });

  test("canonicalComune riporta il testo libero alla chiave della tendina", () => {
    assert.equal(canonicalComune(facets.comuni, "tradate"), "Tradate");
    assert.equal(canonicalComune(facets.comuni, "Tradate (VA)"), "Tradate");
    assert.equal(canonicalComune(facets.comuni, "Milano"), undefined);
    assert.equal(canonicalComune(facets.comuni, ""), undefined);
  });

  test("matchesComune ignora accenti e maiuscole", () => {
    assert.ok(matchesComune("Cantù (CO)", "cantu"));
    assert.ok(matchesComune("Tradate (VA)", "TRADATE"));
    assert.ok(!matchesComune("Tradate (VA)", "Varese"));
  });
});
