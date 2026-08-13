// Copy Domus D.O.C. della scheda (app/lib/domusDoc.ts): l'affermazione sul SINGOLO immobile
// («questo immobile è verificato») appare solo con evidenza; altrimenti copy neutra di metodo.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { domusDocSafety, type DocLocale } from "../domusDoc";

const LOCALES: DocLocale[] = ["it", "en", "fr", "de", "es"];

// Frasi che AFFERMANO un esito sul singolo immobile (participio "controllati/verificati…").
const PER_PROPERTY_CLAIM = /questo immobile|this property|ce bien|diese immobilie|esta propiedad/i;

describe("variante NEUTRA (default, senza evidenza) — nessuna certificazione del singolo immobile", () => {
  for (const locale of LOCALES) {
    test(`[${locale}] non afferma che questo immobile è stato certificato`, () => {
      const doc = domusDocSafety(locale, false);
      assert.ok(!PER_PROPERTY_CLAIM.test(doc.text) || /team|équipe|equipo/i.test(doc.text),
        `neutra non deve affermare l'esito sul singolo immobile: "${doc.text}"`);
      // La variante neutra it rimanda al team per le verifiche del singolo immobile.
      if (locale === "it") {
        assert.ok(/metodo/i.test(doc.title), doc.title);
        assert.ok(/te lo conferma il team/i.test(doc.text), doc.text);
        assert.ok(!/controllati prima della vendita/i.test(doc.text), doc.text);
      }
      assert.equal(doc.eyebrow, "Domus D.O.C.");
      assert.equal(doc.points.length, 3);
    });
  }
});

describe("variante VERIFICATA (con evidenza) — l'affermazione sul singolo immobile", () => {
  for (const locale of LOCALES) {
    test(`[${locale}] afferma il protocollo su questo immobile`, () => {
      const doc = domusDocSafety(locale, true);
      assert.ok(PER_PROPERTY_CLAIM.test(doc.text), `verificata deve riferirsi al singolo immobile: "${doc.text}"`);
      if (locale === "it") {
        assert.ok(/controllati prima della vendita/i.test(doc.text), doc.text);
      }
      assert.equal(doc.eyebrow, "Domus D.O.C.");
    });
  }
});

describe("locale sconosciuto → ripiego su italiano", () => {
  test("una lingua non supportata usa l'italiano", () => {
    assert.deepEqual(domusDocSafety("pt", false), domusDocSafety("it", false));
    assert.deepEqual(domusDocSafety("zz", true), domusDocSafety("it", true));
  });
});
