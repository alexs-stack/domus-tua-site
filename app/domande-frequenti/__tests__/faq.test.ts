// La FAQ è contenuto, e il contenuto qui ha due obblighi: essere lo stesso in tutte le
// lingue (struttura, non parole) e non promettere niente che l'agenzia non possa mantenere.
//
// La corrispondenza fra markup FAQPage e testo visibile NON si verifica qui: markup e
// pagina si incontrano solo nell'HTML servito, quindi la prova sta in e2e/pages.spec.ts.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { faq, faqFlat, faqPick, FAQ_SELLER, FAQ_BUYER } from "../faq";
import { locales, defaultLocale } from "../../lib/i18n/dictionaries";

describe("FAQ — struttura", () => {
  test("ogni lingua ha gli stessi gruppi, nello stesso ordine", () => {
    const riferimento = faq[defaultLocale].map((g) => g.id);
    for (const locale of locales) {
      assert.deepEqual(faq[locale].map((g) => g.id), riferimento, `gruppi diversi in ${locale}`);
    }
  });

  test("ogni lingua ha le stesse domande, nello stesso ordine", () => {
    const riferimento = faqFlat(defaultLocale).map((e) => e.id);
    for (const locale of locales) {
      assert.deepEqual(faqFlat(locale).map((e) => e.id), riferimento, `domande diverse in ${locale}`);
    }
  });

  test("nessun id ripetuto", () => {
    const ids = faqFlat(defaultLocale).map((e) => e.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  test("nessuna domanda o risposta vuota, e ogni domanda è una domanda", () => {
    for (const locale of locales) {
      for (const entry of faqFlat(locale)) {
        assert.ok(entry.q.trim().length > 10, `domanda troppo corta: ${locale}/${entry.id}`);
        assert.ok(entry.a.trim().length > 40, `risposta troppo corta: ${locale}/${entry.id}`);
        assert.match(entry.q.trim(), /[?？]$/, `non è una domanda: ${locale}/${entry.id}`);
      }
    }
  });

  test("i gruppi hanno un titolo in ogni lingua", () => {
    for (const locale of locales) {
      for (const group of faq[locale]) {
        assert.ok(group.title.trim().length > 0, `titolo mancante: ${locale}/${group.id}`);
      }
    }
  });
});

describe("FAQ — i sottoinsiemi dei blocchi compatti", () => {
  test("le domande di /vendi e /acquista esistono davvero", () => {
    for (const locale of locales) {
      assert.equal(faqPick(locale, FAQ_SELLER).length, FAQ_SELLER.length, `venditore, ${locale}`);
      assert.equal(faqPick(locale, FAQ_BUYER).length, FAQ_BUYER.length, `acquirente, ${locale}`);
    }
  });

  test("i due sottoinsiemi non si sovrappongono", () => {
    const overlap = FAQ_SELLER.filter((id) => (FAQ_BUYER as readonly string[]).includes(id));
    assert.deepEqual(overlap, []);
  });

  test("un id inesistente viene semplicemente ignorato, non fa esplodere la pagina", () => {
    // @ts-expect-error — è proprio il caso che il tipo vieta: si verifica il comportamento a runtime.
    assert.deepEqual(faqPick("it", ["non-esiste"]), []);
  });
});

describe("FAQ — disciplina sulle affermazioni", () => {
  // PRODUCT.md: mai promesse indimostrabili. Sono anche le frasi che un cliente ricorda
  // quando non si avverano, ed è per questo che la voce sui tempi dice espressamente
  // che non si promette nulla.
  const PROMESSE = [
    /vendiamo (?:la tua casa )?in \d+ (?:giorni|settimane|mesi)/i,
    /garantiamo la vendita/i,
    /\bal miglior prezzo del mercato\b/i,
    /\bi migliori? (?:agenti|agenzia) (?:d'italia|della provincia|della zona)\b/i,
    /\bsenza rischi\b/i,
    /\bal 100%\b/i,
  ];

  test("nessuna risposta contiene una promessa che non possiamo mantenere", () => {
    for (const locale of locales) {
      for (const entry of faqFlat(locale)) {
        for (const forma of PROMESSE) {
          assert.ok(!forma.test(entry.a), `promessa in ${locale}/${entry.id}: ${forma}`);
        }
      }
    }
  });

  test("la domanda sui tempi dice esplicitamente che non si promette una data", () => {
    const it = faqFlat("it").find((e) => e.id === "tempi");
    assert.ok(it);
    assert.match(it.a, /non lo promettiamo/i);
  });
});
