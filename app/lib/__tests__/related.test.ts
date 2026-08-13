// Selezione dei correlati (app/lib/related.ts): un immobile venduto non deve MAI comparire
// come correlato di una scheda disponibile. Nel dataset audìto ogni pagina disponibile aveva
// almeno una card venduta tra i correlati — questo è il test che lo impedisce.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import type { Property } from "../properties";
import { relatedListings } from "../related";

// relatedListings legge solo slug/zone/sold: costruiamo Property minime su quei campi.
function mk(slug: string, zone: string, sold = false): Property {
  return { slug, zone, sold } as unknown as Property;
}

const CURRENT = mk("corrente", "Tradate");

describe("relatedListings — il venduto non entra mai tra i disponibili", () => {
  test("esclude i venduti, tiene i disponibili", () => {
    const all = [
      CURRENT,
      mk("venduto-stessa-zona", "Tradate", true),
      mk("disp-stessa-zona", "Tradate"),
      mk("disp-altra-zona", "Venegono"),
    ];
    const r = relatedListings(all, CURRENT);
    const slugs = r.map((p) => p.slug);
    assert.ok(!slugs.includes("venduto-stessa-zona"), "un venduto è finito tra i correlati");
    assert.deepEqual(slugs, ["disp-stessa-zona", "disp-altra-zona"]);
  });

  test("un pool di soli venduti dà zero correlati, non riempie con venduti", () => {
    const all = [CURRENT, mk("v1", "Tradate", true), mk("v2", "Venegono", true)];
    assert.deepEqual(relatedListings(all, CURRENT), []);
  });
});

describe("relatedListings — immobile corrente e duplicati", () => {
  test("l'immobile corrente non compare tra i propri correlati", () => {
    const all = [CURRENT, mk("altro", "Tradate")];
    const slugs = relatedListings(all, CURRENT).map((p) => p.slug);
    assert.ok(!slugs.includes("corrente"));
    assert.deepEqual(slugs, ["altro"]);
  });

  test("un duplicato dello slug corrente (anche disponibile) viene scartato", () => {
    const all = [CURRENT, mk("corrente", "Tradate"), mk("vero-altro", "Tradate")];
    const slugs = relatedListings(all, CURRENT).map((p) => p.slug);
    assert.deepEqual(slugs, ["vero-altro"]);
  });
});

describe("relatedListings — ordine e limite", () => {
  test("stessa zona prima, poi le altre; a parità l'ordine d'ingresso (deterministico)", () => {
    const all = [
      CURRENT,
      mk("altra-1", "Venegono"),
      mk("stessa-1", "Tradate"),
      mk("altra-2", "Gornate"),
      mk("stessa-2", "Tradate"),
    ];
    const slugs = relatedListings(all, CURRENT).map((p) => p.slug);
    // Le due di Tradate prima (nell'ordine d'ingresso), poi la prima delle altre.
    assert.deepEqual(slugs, ["stessa-1", "stessa-2", "altra-1"]);
  });

  test("mai più di `limit` (default 3)", () => {
    const all = [CURRENT, ...Array.from({ length: 6 }, (_, i) => mk(`d${i}`, "Tradate"))];
    assert.equal(relatedListings(all, CURRENT).length, 3);
  });

  test("meno di `limit` disponibili → ne restituisce meno, senza inventare", () => {
    const all = [CURRENT, mk("solo-uno", "Tradate"), mk("venduto", "Tradate", true)];
    assert.equal(relatedListings(all, CURRENT).length, 1);
  });

  test("limit personalizzato rispettato", () => {
    const all = [CURRENT, mk("a", "Tradate"), mk("b", "Tradate"), mk("c", "Venegono")];
    assert.equal(relatedListings(all, CURRENT, 2).length, 2);
  });
});
