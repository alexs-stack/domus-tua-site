// Classificazione semantica dell'immobile e fatti pertinenti alla categoria.
//
// Il difetto coperto: le card commerciali si descrivevano come case — CTA
// «Scopri la casa» e numeri residenziali (camere, bagni) su negozi, capannoni,
// terreni. La regola vive ora in un posto solo (app/lib/propertyKind.ts) e la
// consumano card, anteprima e striscia della scheda. Qui si verifica la regola,
// non i tre componenti che la usano.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { propertyCategory, isResidential, factApplies, coreFacts } from "../propertyKind";
import { toType } from "../realsmart/toProperty";
import type { Property } from "../properties";

// ── Le quattro fixture richieste (Prompt 2) ────────────────────────────────
type CardFacts = Pick<Property, "type" | "sqm" | "rooms" | "beds" | "baths">;

/** Residenziale completo: tutti e quattro i numeri hanno senso. */
const residentialComplete: CardFacts = {
  type: "Villa",
  sqm: "210 m²",
  rooms: "5 locali",
  beds: "4 camere",
  baths: "3 bagni",
};
/** Commerciale completo — E con camere/bagni riportati dal feed per RUMORE:
    non devono comparire, perché sono concetti residenziali. */
const commercialComplete: CardFacts = {
  type: "Commerciale",
  sqm: "180 m²",
  rooms: "4 locali",
  beds: "2 camere",
  baths: "1 bagno",
};
/** Commerciale con i campi opzionali mancanti (il caso reale più comune). */
const commercialMissing: CardFacts = {
  type: "Commerciale",
  sqm: "95 m²",
  rooms: "—",
  beds: "—",
  baths: "—",
};
/** Terreno: solo la superficie è un fatto. */
const landComplete: CardFacts = {
  type: "Terreno",
  sqm: "1.200 m²",
  rooms: "—",
  beds: "—",
  baths: "—",
};

describe("propertyKind — categoria", () => {
  test("residenziale / commerciale / terreno", () => {
    assert.equal(propertyCategory("Appartamento"), "residential");
    assert.equal(propertyCategory("Attico"), "residential");
    assert.equal(propertyCategory("Villa"), "residential");
    assert.equal(propertyCategory("Commerciale"), "commercial");
    assert.equal(propertyCategory("Terreno"), "land");
  });

  test("isResidential decide la CTA («casa» solo per l'abitativo)", () => {
    assert.equal(isResidential("Appartamento"), true);
    assert.equal(isResidential("Attico"), true);
    assert.equal(isResidential("Villa"), true);
    assert.equal(isResidential("Commerciale"), false);
    assert.equal(isResidential("Terreno"), false);
  });
});

describe("propertyKind — fatti pertinenti alla categoria", () => {
  test("residenziale: superficie, locali, camere, bagni", () => {
    for (const k of ["sqm", "rooms", "beds", "baths"] as const) {
      assert.equal(factApplies("Villa", k), true, k);
    }
  });

  test("commerciale: superficie e locali, MAI camere o bagni", () => {
    assert.equal(factApplies("Commerciale", "sqm"), true);
    assert.equal(factApplies("Commerciale", "rooms"), true);
    assert.equal(factApplies("Commerciale", "beds"), false);
    assert.equal(factApplies("Commerciale", "baths"), false);
  });

  test("terreno: solo superficie", () => {
    assert.equal(factApplies("Terreno", "sqm"), true);
    for (const k of ["rooms", "beds", "baths"] as const) {
      assert.equal(factApplies("Terreno", k), false, k);
    }
  });
});

describe("propertyKind — coreFacts (ciò che la card rende davvero)", () => {
  test("residenziale completo: quattro numeri, in ordine", () => {
    assert.deepEqual(
      coreFacts(residentialComplete).map((f) => f.key),
      ["sqm", "rooms", "beds", "baths"]
    );
  });

  test("commerciale completo: camere e bagni soppressi anche se il feed li dà", () => {
    const keys = coreFacts(commercialComplete).map((f) => f.key);
    assert.deepEqual(keys, ["sqm", "rooms"]);
    assert.ok(!keys.includes("beds"), "una card commerciale non mostra camere");
    assert.ok(!keys.includes("baths"), "una card commerciale non mostra bagni");
  });

  test("commerciale con opzionali mancanti: solo la superficie, nessuna etichetta vuota", () => {
    assert.deepEqual(
      coreFacts(commercialMissing).map((f) => f.key),
      ["sqm"]
    );
  });

  test("terreno: solo superficie, mai locali", () => {
    assert.deepEqual(
      coreFacts(landComplete).map((f) => f.key),
      ["sqm"]
    );
  });

  test("nessun valore vuoto o «—» finisce tra i fatti resi", () => {
    for (const fx of [residentialComplete, commercialComplete, commercialMissing, landComplete]) {
      for (const f of coreFacts(fx)) {
        assert.ok(f.value && f.value !== "—", `valore reso non valido: ${f.key}=${f.value}`);
      }
    }
  });
});

describe("toType — mappatura RealSmart, incluse categorie malformate", () => {
  test("residenziale", () => {
    assert.equal(toType("Appartamento"), "Appartamento");
    assert.equal(toType("Attico"), "Attico");
    assert.equal(toType("Villa singola"), "Villa");
    assert.equal(toType("Casa a schiera"), "Villa");
    assert.equal(toType("Rustico da ristrutturare"), "Villa");
  });

  test("non residenziale: box/garage/magazzino confluiscono in Commerciale, non più in Appartamento", () => {
    for (const raw of [
      "Negozio",
      "Ufficio",
      "Capannone",
      "Laboratorio",
      "Magazzino",
      "Deposito",
      "Box auto",
      "Garage singolo",
      "Autorimessa",
      "Posto auto scoperto",
    ]) {
      assert.equal(toType(raw), "Commerciale", raw);
    }
  });

  test("terreno", () => {
    assert.equal(toType("Terreno edificabile"), "Terreno");
    assert.equal(toType("Terreni agricoli"), "Terreno");
  });

  test("categoria sconosciuta o malformata non esplode e ricade su un tipo valido e classificabile", () => {
    for (const raw of ["", "   ", "???", "Xyzzy", "12345", "\n\t"]) {
      const t = toType(raw);
      assert.ok(
        ["Appartamento", "Attico", "Villa", "Commerciale", "Terreno"].includes(t),
        `${JSON.stringify(raw)} → ${t}`
      );
      assert.ok(["residential", "commercial", "land"].includes(propertyCategory(t)));
    }
  });
});
