// Verificatore INDIPENDENTE (app/lib/realsmart/privacyVerify.ts).
//
// Il punto di questi test è dimostrare l'INDIPENDENZA dal redattore: il verificatore deve
// intercettare fughe che il redattore, per costruzione, potrebbe non vedere — altrimenti sarebbe
// un controllo tautologico. In particolare usa toponimi che privacy.ts NON ha in lista.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  verifyRedaction,
  hasAddressLeak,
  hasPhoneLeak,
  sourceAddressTokens,
} from "../privacyVerify";

describe("indipendenza: MECCANISMO diverso dal redattore", () => {
  // Il verificatore è una rete di sicurezza su input ARBITRARIO (come se una futura regressione del
  // redattore lasciasse passare qualcosa). Il confronto per TOKEN con l'indirizzo noto è una logica
  // che il redattore non ha: intercetta la fuga anche col numero PRIMA della via — ordine che un
  // pattern "via → numero" non coprirebbe. Qui passiamo testo grezzo direttamente al verificatore.
  test("indirizzo noto col numero PRIMA della via (ordine invertito) = fuga per token", () => {
    const v = verifyRedaction("vi aspettiamo al 7 di Via Petrarca", {
      showAddress: false,
      sourceAddress: "Via Petrarca 7",
    });
    assert.equal(v.ok, false);
    assert.ok(v.reasons.includes("leak-address-structured-token"));
  });

  // Corpus indipendente: la sua lista di toponimi è autonoma (salita, rotonda, circonvallazione…)
  // e cattura anche i nomi con articolo minuscolo ("Rotonda dei Mille"). Test DIRETTO del corpus.
  for (const addr of ["Salita Castello 5", "Rotonda dei Mille 3", "Circonvallazione Ovest 12"]) {
    test(`il corpus indipendente intercetta "${addr}"`, () => {
      assert.equal(hasAddressLeak(addr), true);
      assert.equal(verifyRedaction(addr, { showAddress: false }).ok, false);
    });
  }
});

describe("confronto per token con l'indirizzo strutturato noto", () => {
  test("via NOTA e civico NOTO che co-occorrono = fuga (anche con parole in mezzo)", () => {
    const v = verifyRedaction("si trova in Via Petrarca, proprio al numero 7 del palazzo", {
      showAddress: false,
      sourceAddress: "Via Petrarca 7",
    });
    assert.equal(v.ok, false);
    assert.ok(v.reasons.includes("leak-address-structured-token"));
  });

  test("solo il nome della via, senza il civico noto → non è la fuga strutturata", () => {
    const v = verifyRedaction("il quartiere attorno a Petrarca è servito", {
      showAddress: false,
      sourceAddress: "Via Petrarca 7",
    });
    assert.ok(!v.reasons.includes("leak-address-structured-token"));
  });

  test("sourceAddressTokens estrae nome-via (senza accenti/toponimo) e civico", () => {
    const t = sourceAddressTokens("Località San Rocco 12/A");
    assert.deepEqual(t.number, "12");
    assert.ok(t.streetTokens.includes("rocco"));
    assert.ok(!t.streetTokens.includes("localita"), "il toponimo è una stopword");
  });
});

describe("testo pulito e casi con showAddress=true", () => {
  test("testo senza indirizzo/telefono → ok", () => {
    assert.equal(verifyRedaction("Trilocale luminoso a Tradate, 120 mq.", { showAddress: false }).ok, true);
  });
  test("con showAddress=true l'indirizzo autorizzato non è una fuga", () => {
    const v = verifyRedaction("Villa in Via Petrarca 7.", { showAddress: true, sourceAddress: "Via Petrarca 7" });
    assert.equal(v.reasons.some((r) => r.startsWith("leak-address")), false);
  });
});

describe("rilevatore telefonico indipendente (per conteggio-cifre)", () => {
  test("intercetta i recapiti", () => {
    for (const t of ["333 1234567", "+39 333 123 4567", "0331 123456", "chiama il 3487654321"]) {
      assert.equal(hasPhoneLeak(t), true, t);
    }
  });
  test("NON scambia prezzi/misure per telefoni", () => {
    for (const t of ["€ 420.000", "1.250.000 euro", "1.200 €", "120 mq", "200 m²", "anno 2024"]) {
      assert.equal(hasPhoneLeak(t), false, t);
    }
  });
  test("il telefono è una fuga anche con showAddress=true", () => {
    assert.equal(verifyRedaction("Info 333 1234567", { showAddress: true }).ok, false);
  });
});
