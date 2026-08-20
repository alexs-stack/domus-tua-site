// Redazione privacy deterministica (app/lib/realsmart/privacy.ts).
//
// Nel feed audìto 130 descrizioni su 196 contenevano un indirizzo civico con showAddress=false,
// e alcune un telefono. Questi test bloccano la regressione: indirizzi e recapiti non escono, le
// misure e i prezzi restano intatti.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  redactPrivateText,
  redactParagraphs,
  hasCivicAddress,
  hasPhoneNumber,
} from "../privacy";

describe("indirizzi civici — redatti con showAddress=false", () => {
  const cases = [
    "L'immobile è sito in Via Petrarca 7, a due passi dal centro.",
    "Appartamento in Via Monte Rosa n. 12.",
    "Villa in Piazza Garibaldi 3.",
    "In Corso Italia, 15 troviamo un attico.",
    "Trilocale in Viale Europa 8B.",
    // Toponimo SENZA accento: non è un refuso da tollerare, è la grafia più comune in
    // un gestionale — chi compila un campo di testo scrive spesso senza accentate.
    // `ciLiteral()` rende insensibile alle MAIUSCOLE, non agli accenti, quindi questa
    // riga passava intera (civico compreso) mentre la gemella accentata veniva redatta.
    "Rustico in Localita Ronchetto 12, immerso nel verde.",
    "Casale in Località Ronchetto 12, immerso nel verde.",
  ];
  for (const text of cases) {
    test(`redatto: "${text.slice(0, 30)}…"`, () => {
      assert.ok(hasCivicAddress(text), "il rilevatore deve vedere l'indirizzo");
      const r = redactPrivateText(text, { showAddress: false, comune: "Tradate" });
      assert.equal(r.civicRedactions >= 1, true);
      assert.ok(!hasCivicAddress(r.text), `residuo indirizzo: "${r.text}"`);
      assert.ok(r.text.includes("Tradate"), "il comune preserva il contesto di zona");
    });
  }

  test("con showAddress=true l'indirizzo autorizzato resta", () => {
    const text = "Villa in Via Petrarca 7.";
    const r = redactPrivateText(text, { showAddress: true, comune: "Tradate" });
    assert.equal(r.civicRedactions, 0);
    assert.ok(r.text.includes("Via Petrarca 7"));
  });

  test("senza comune noto ripiega su 'zona riservata', ma non lascia l'indirizzo", () => {
    const r = redactPrivateText("Sito in Via Roma 10.", { showAddress: false });
    assert.ok(!hasCivicAddress(r.text));
    assert.ok(r.text.includes("zona riservata"));
  });

  test("collassa la ripetizione del comune", () => {
    const r = redactPrivateText("In Via Roma 10, Tradate.", { showAddress: false, comune: "Tradate" });
    assert.ok(!/Tradate[\s,]+Tradate/i.test(r.text), `duplicato: "${r.text}"`);
  });
});

describe("numeri che NON sono indirizzi — preservati", () => {
  const kept = [
    "Ampio soggiorno di 120 mq con 3 locali.",
    "Prezzo richiesto € 420.000, trattabili.",
    "Immobile al piano 2 con 4 vani e 2 bagni.",
    "A 5 min. dal centro, in un contesto tranquillo.",
    "Classe energetica A, spese condominiali 1.200 € l'anno.",
    "Vista Monte Rosa e doppio terrazzo.",
    "Via libera a 3 offerte in pochi giorni.",
  ];
  for (const text of kept) {
    test(`intatto: "${text.slice(0, 30)}…"`, () => {
      assert.ok(!hasCivicAddress(text), `falso positivo indirizzo in "${text}"`);
      const r = redactPrivateText(text, { showAddress: false, comune: "Tradate" });
      assert.equal(r.text, text, "il testo non-indirizzo non deve cambiare");
      assert.equal(r.civicRedactions, 0);
    });
  }
});

describe("telefoni — rimossi sempre, misure e prezzi salvi", () => {
  const phones = [
    "Per info chiama 333 1234567.",
    "Tel. 0331 123456 per appuntamenti.",
    "Contattaci al +39 333 123 4567.",
    "Cellulare 333.123.4567 disponibile.",
    "Rif. agente 0039 02 12345678.",
  ];
  for (const text of phones) {
    test(`rimosso: "${text.slice(0, 30)}…"`, () => {
      assert.ok(hasPhoneNumber(text), "il rilevatore deve vedere il telefono");
      const r = redactPrivateText(text, { showAddress: true });
      assert.equal(r.phoneRedactions >= 1, true);
      assert.ok(!hasPhoneNumber(r.text), `residuo telefono: "${r.text}"`);
    });
  }

  test("i prezzi raggruppati non sono telefoni", () => {
    for (const price of ["€ 420.000", "1.250.000 euro", "spese 1.200 €", "333.000 € trattabili"]) {
      assert.ok(!hasPhoneNumber(price), `prezzo scambiato per telefono: "${price}"`);
      const r = redactPrivateText(price, { showAddress: true });
      assert.equal(r.text, price);
    }
  });

  test("le misure non sono telefoni", () => {
    for (const m of ["120 mq", "3 locali", "piano 2", "4 vani", "200 m²"]) {
      assert.ok(!hasPhoneNumber(m), `misura scambiata per telefono: "${m}"`);
    }
  });
});

describe("redazione dei paragrafi", () => {
  test("redige ogni paragrafo e scarta quelli svuotati", () => {
    const paragraphs = [
      "Bell'attico in Via Petrarca 7.",
      "0331 123456", // solo un telefono → paragrafo che sparisce
      "Tre camere e doppi servizi.",
    ];
    const r = redactParagraphs(paragraphs, { showAddress: false, comune: "Tradate" });
    assert.ok(!r.paragraphs.some((p) => hasCivicAddress(p)));
    assert.ok(!r.paragraphs.some((p) => hasPhoneNumber(p)));
    assert.equal(r.paragraphs.length, 2, "il paragrafo di solo telefono viene scartato");
    assert.ok(r.civicRedactions >= 1 && r.phoneRedactions >= 1);
  });
});
