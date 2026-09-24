// Quarantena dei segnaposto non compilati (app/lib/realsmart/placeholders.ts).
//
// Regola non negoziabile: non si inventa la misura mancante. Si toglie la frase-misura incompleta,
// così in pagina non compare mai un «____», e il segnale fa fallire l'audit (correzione alla fonte).

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { quarantinePlaceholders, quarantineParagraphs, hasPlaceholder } from "../placeholders";

describe("quarantena del caso reale T447 / codice 2055", () => {
  test("«un ampio bagno di oltre ____ mq» → «un ampio bagno», nessuna misura inventata", () => {
    const r = quarantinePlaceholders(
      "Completano il piano un ampio bagno di oltre ____ mq, un disimpegno e un ripostiglio.",
    );
    assert.equal(r.quarantined, 1);
    assert.ok(!r.text.includes("____"), r.text);
    assert.ok(!/\bmq\b/.test(r.text.split("bagno")[1] ?? ""), "l'unità orfana non resta");
    assert.ok(r.text.includes("un ampio bagno"), r.text);
    assert.ok(!/\d/.test(r.text), "non deve comparire alcun numero inventato");
  });
});

describe("forme di segnaposto", () => {
  for (const s of ["____ mq", "di circa ____ mq", "di oltre ____", "XXX mq", "TBD", "T.B.D.", "N/D"]) {
    test(`rileva e toglie: "${s}"`, () => {
      assert.equal(hasPlaceholder(s), true);
      assert.equal(quarantinePlaceholders(`Testo con ${s} nel mezzo.`).quarantined >= 1, true);
    });
  }
});

describe("non tocca le misure reali", () => {
  for (const s of ["bagno di 15 mq", "soggiorno di circa 30 mq", "120 mq totali", "3 locali", "piano 2"]) {
    test(`intatto: "${s}"`, () => {
      assert.equal(hasPlaceholder(s), false);
      assert.equal(quarantinePlaceholders(s).text, s);
      assert.equal(quarantinePlaceholders(s).quarantined, 0);
    });
  }
});

describe("quarantena sui paragrafi", () => {
  test("scarta il paragrafo rimasto vuoto e conta le quarantene", () => {
    const r = quarantineParagraphs(["____", "Bel trilocale luminoso.", "bagno di oltre ____ mq"]);
    assert.ok(r.quarantined >= 2);
    assert.ok(!r.paragraphs.some((p) => p.includes("____")));
    assert.ok(r.paragraphs.includes("Bel trilocale luminoso."));
    // Il paragrafo di solo «____» sparisce.
    assert.ok(!r.paragraphs.includes(""));
  });
});
