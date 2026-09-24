// L'evidenza Domus D.O.C. sul singolo immobile (docVerified) NON si deduce dal marketing:
// il badge "Documenti verificati" e l'affermazione "verificata" richiedono un override esplicito.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { normalizeRealSmartListing } from "../normalize";
import { validateOverrides } from "../overrides";
import type { RealSmartListingRaw } from "../types";

function mkRaw(over: Partial<RealSmartListingRaw> = {}): RealSmartListingRaw {
  return {
    codice: "SENZA-OVERRIDE",
    riferimento: "RIF",
    titolo: "Trilocale",
    descrizione: "Un trilocale luminoso.",
    prezzo: 250000,
    tipologia: "Appartamento",
    contratto: "vendita",
    localita: { comune: "Tradate", provincia: "VA" },
    mq: 90,
    locali: 3,
    camere: 2,
    bagni: 1,
    statoPubblicazione: "published",
    caratteristiche: [],
    media: [],
    ...over,
  } as RealSmartListingRaw;
}

describe("docVerified NON dedotto dal marketing", () => {
  test("caratteristica 'Documenti verificati' SENZA override → docVerified false, nessun badge", () => {
    const p = normalizeRealSmartListing(
      mkRaw({ caratteristiche: ["Documenti verificati", "Conformità controllata"] }),
    );
    assert.equal(p.docVerified, false, "il marketing non deve attestare il protocollo");
    assert.ok(!p.badges.includes("Documenti verificati"), "il badge non si deduce dalle caratteristiche");
  });

  test("descrizione che parla di conformità/verifiche → docVerified resta false", () => {
    const p = normalizeRealSmartListing(
      mkRaw({ descrizione: "Immobile con documenti verificati e conformità controllata prima della vendita." }),
    );
    assert.equal(p.docVerified, false);
    assert.ok(!p.badges.includes("Documenti verificati"));
  });
});

describe("override docVerified — schema", () => {
  const base = { codice: "T1", motivo: "m", fonte: "APE 2026", data: "2026-01-01", autore: "Raffaela" };

  test("true e false sono ammessi", () => {
    assert.deepEqual(validateOverrides([{ ...base, docVerified: true }]), []);
    assert.deepEqual(validateOverrides([{ ...base, codice: "T2", docVerified: false }]), []);
  });

  test("un valore non booleano è un errore (niente coercizione da stringa)", () => {
    const errs = validateOverrides([{ ...base, docVerified: "true" }]);
    assert.ok(errs.some((e) => /docVerified/.test(e)), errs.join("; "));
  });
});
