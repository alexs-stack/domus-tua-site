// Guard deterministici (redazione pre-modello, rilevatori) e parsing dello schema stretto.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { redactForPrompt, hasCivicAddress, hasPhoneNumber, hasLegalClaim, checkGeneratedText } from "../guards";
import { parseModelOutput } from "../schema";

describe("redazione pre-modello", () => {
  test("indirizzo → comune (showAddress=false), telefono rimosso", () => {
    const r = redactForPrompt("Trilocale in Via Roma 10, tel. 0331 123456.", { showAddress: false, comune: "Tradate" });
    assert.ok(!hasCivicAddress(r), r);
    assert.ok(!hasPhoneNumber(r), r);
    assert.ok(r.includes("Tradate"));
  });
  test("showAddress=true tiene l'indirizzo ma toglie il telefono", () => {
    const r = redactForPrompt("Via Roma 10, 333 1234567.", { showAddress: true, comune: "Tradate" });
    assert.ok(hasCivicAddress(r));
    assert.ok(!hasPhoneNumber(r));
  });
});

describe("rilevatori — niente falsi positivi su misure/prezzi", () => {
  test("misure e prezzi non sono indirizzi né telefoni", () => {
    for (const s of ["120 mq", "3 locali", "€ 420.000", "piano 2"]) {
      assert.ok(!hasCivicAddress(s), s);
      assert.ok(!hasPhoneNumber(s), s);
    }
  });
  test("claim legale riconosciuto", () => {
    assert.ok(hasLegalClaim("immobile conforme e a norma"));
    assert.ok(!hasLegalClaim("immobile luminoso e comodo"));
  });
  test("numero coerente con la fonte non è violazione", () => {
    const g = checkGeneratedText("Trilocale di 90 mq.", { showAddress: false, source: { comune: "Tradate", numbers: ["90"] } });
    assert.equal(g.ok, true);
  });
});

describe("schema stretto", () => {
  test("valido", () => {
    const r = parseModelOutput('{"paragrafi":["ok."]}');
    assert.equal(r.ok, true);
  });
  test("recupera il JSON avvolto in ```json", () => {
    const r = parseModelOutput('```json\n{"paragrafi":["ok."]}\n```');
    assert.equal(r.ok, true);
  });
  test("campo extra → rifiuto (.strict)", () => {
    assert.equal(parseModelOutput('{"paragrafi":["ok."],"x":1}').ok, false);
  });
  test("paragrafi non-array → rifiuto", () => {
    assert.equal(parseModelOutput('{"paragrafi":"testo"}').ok, false);
  });
  test("array vuoto → rifiuto", () => {
    assert.equal(parseModelOutput('{"paragrafi":[]}').ok, false);
  });
});
