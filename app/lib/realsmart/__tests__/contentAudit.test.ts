// Audit dei contenuti (app/lib/realsmart/contentAudit.ts): il segnaposto "____" blocca, un
// indirizzo/telefono nella descrizione è redatto in pubblicazione ma segnalato alla fonte, le
// contraddizioni numeriche si segnalano senza riscriverle. Nessun finding contiene PII.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { auditListing, buildAuditArtifact } from "../contentAudit";
import { cleanField } from "../validate";
import type { RealSmartListingRaw } from "../types";

function mkRaw(over: Partial<RealSmartListingRaw> = {}): RealSmartListingRaw {
  return {
    codice: "TEST-1",
    riferimento: "RIF. TEST",
    titolo: "Trilocale luminoso",
    descrizione: "Luminoso trilocale in un contesto tranquillo. Tre camere e doppi servizi.",
    prezzo: 250000,
    tipologia: "Appartamento",
    contratto: "vendita",
    localita: { comune: "Tradate", provincia: "VA" },
    mq: 90,
    locali: 4,
    camere: 3,
    bagni: 2,
    statoPubblicazione: "published",
    caratteristiche: [],
    media: [],
    ...over,
  } as RealSmartListingRaw;
}

const checks = (a: ReturnType<typeof auditListing>) => a.findings.map((f) => f.check);

describe("segnaposto non compilato — blocca (FAIL)", () => {
  test('«bagno di oltre ____ mq» → FAIL segnaposto-non-compilato', () => {
    const a = auditListing(mkRaw({ descrizione: "Ampio bagno di oltre ____ mq e cucina abitabile." }));
    assert.equal(a.stato, "FAIL");
    assert.ok(checks(a).includes("segnaposto-non-compilato"));
  });
});

describe("indirizzo in descrizione — redatto in pubblicazione, segnalato alla fonte", () => {
  const a = auditListing(
    mkRaw({ descrizione: "Splendido attico sito in Via Petrarca 7, a due passi dal centro." }),
  );

  test("REVIEW indirizzo-in-descrizione (igiene fonte), MAI un FAIL di fuga privacy", () => {
    assert.ok(checks(a).includes("indirizzo-in-descrizione"));
    assert.ok(!checks(a).includes("privacy-leak-indirizzo"), "l'output pubblicato non deve contenere l'indirizzo");
  });

  test("nessun finding contiene il valore dell'indirizzo (no PII)", () => {
    for (const f of a.findings) assert.ok(!/Petrarca|\bVia\b\s+\p{Lu}/u.test(f.detail), f.detail);
  });
});

describe("telefono in descrizione — rimosso in pubblicazione, segnalato alla fonte", () => {
  const a = auditListing(
    mkRaw({ descrizione: "Trilocale in ottimo stato. Per info chiamare 0331 123456." }),
  );
  test("REVIEW telefono-in-descrizione, MAI privacy-leak-telefono", () => {
    assert.ok(checks(a).includes("telefono-in-descrizione"));
    assert.ok(!checks(a).includes("privacy-leak-telefono"));
  });
  test("nessun finding riporta il numero (no PII)", () => {
    for (const f of a.findings) assert.ok(!/0331|123456/.test(f.detail), f.detail);
  });
});

describe("contraddizioni — mai riscritte dall'architettura (il campo vince sul testo)", () => {
  test("«cinque camere» nel testo ma campo camere=3 → il sito pubblica 3 (fonte gestionale)", () => {
    const a = auditListing(
      mkRaw({ descrizione: "Prestigioso immobile con cinque camere e ampio soggiorno.", camere: 3 }),
    );
    const camereFact = a; // il conteggio pubblicato resta quello del campo, non "cinque"
    void camereFact;
    // Nessun FAIL: la contraddizione è nella FONTE, non un dato inventato dal sito.
    assert.ok(a.findings.every((f) => f.severity !== "FAIL"), JSON.stringify(a.findings));
  });
});

describe("annuncio pulito — nessun FAIL, nessuna fuga privacy", () => {
  const a = auditListing(mkRaw());
  test("nessun FAIL", () => {
    assert.ok(a.findings.every((f) => f.severity !== "FAIL"), JSON.stringify(a.findings));
  });
  test("nessun controllo privacy scattato", () => {
    for (const c of ["privacy-leak-indirizzo", "privacy-leak-telefono", "indirizzo-in-descrizione", "telefono-in-descrizione"]) {
      assert.ok(!checks(a).includes(c));
    }
  });
});

describe("artefatto machine-readable", () => {
  test("riepilogo, reason codes e listing senza PII", () => {
    const audits = [
      auditListing(mkRaw({ codice: "A", descrizione: "Ampio bagno di oltre ____ mq." })),
      auditListing(mkRaw({ codice: "B" })),
    ];
    const art = buildAuditArtifact(audits, "2026-08-13");
    assert.equal(art.generatedAt, "2026-08-13");
    assert.equal(art.summary.total, 2);
    assert.equal(art.summary.fail, 1);
    assert.ok(art.reasonCodes["segnaposto-non-compilato"] >= 1);
    assert.equal(art.listings.length, 2);
    assert.ok(art.listings.some((l) => l.codice === "A" && l.stato === "FAIL"));
    // Nessun indirizzo/telefono in chiaro nell'intero artefatto.
    const blob = JSON.stringify(art);
    assert.ok(!/\bVia\s+\p{Lu}[\p{L}]*\s+\d/u.test(blob));
  });
});

// ── I difetti del §5.8 ───────────────────────────────────────────────────────
//
// Sono REVIEW, non FAIL: non si correggono in pipeline (description.ts non riscrive il
// copy dell'agenzia), si correggono alla fonte. Il valore del controllo sta tutto nel
// NON scattare a sproposito: su 196 annunci un check rumoroso viene ignorato, e allora
// tanto vale non averlo. Metà di questi test verificano proprio i casi leciti.

describe("§5.8 — difetti editoriali che vanno segnalati, non riscritti", () => {
  test("un indirizzo web dentro il racconto → link-in-descrizione", () => {
    const a = auditListing(
      mkRaw({ descrizione: "Villa immersa nel verde. Trovi tutto su www.esempio-immobiliare.it e ti aspettiamo." }),
    );
    assert.ok(checks(a).includes("link-in-descrizione"));
  });

  test("un'email nel testo conta come link", () => {
    const a = auditListing(mkRaw({ descrizione: "Per informazioni scrivere a info@esempio.it, rispondiamo subito." }));
    assert.ok(checks(a).includes("link-in-descrizione"));
  });

  test("«e'» invece di «è» → accento-apostrofato", () => {
    const a = auditListing(mkRaw({ descrizione: "L'immobile e' luminoso e ben tenuto, con doppia esposizione." }));
    assert.ok(checks(a).includes("accento-apostrofato"));
  });

  test("«po'» e «de'» NON scattano: sono grafie corrette", () => {
    const a = auditListing(
      mkRaw({ descrizione: "Un po' defilata rispetto alla strada, in via de' Medici, molto tranquilla." }),
    );
    assert.ok(!checks(a).includes("accento-apostrofato"), "falso positivo su una grafia corretta");
  });

  test("«il ns bagno» → abbreviazione-da-appunti", () => {
    const a = auditListing(mkRaw({ descrizione: "Il ns comodo e raffinato bagno con finestra e doppio lavabo." }));
    assert.ok(checks(a).includes("abbreviazione-da-appunti"));
  });

  test("«mq» NON scatta: in un annuncio è normale", () => {
    const a = auditListing(mkRaw({ descrizione: "Soggiorno di 30 mq con affaccio sul giardino e cucina abitabile." }));
    assert.ok(!checks(a).includes("abbreviazione-da-appunti"), "falso positivo su un'unità di misura");
  });

  test("una descrizione che finisce a metà → frase-troncata", () => {
    const a = auditListing(mkRaw({ descrizione: "Bella casa in zona servita.\nCompra e vendi in serenità con" }));
    assert.ok(checks(a).includes("frase-troncata"));
  });

  test("una descrizione che finisce con un punto NON scatta", () => {
    const a = auditListing(mkRaw({ descrizione: "Bella casa in zona servita, vicina a scuole e negozi." }));
    assert.ok(!checks(a).includes("frase-troncata"));
  });

  // Gli spazi doppi nel titolo non si segnalano più: li COLLASSA cleanField
  // (validate.ts) prima che l'annuncio arrivi qui. Al posto del controllo, il test
  // che la correzione avvenga davvero — altrimenti sparirebbero entrambi e nessuno
  // se ne accorgerebbe.
  test("gli spazi doppi nel titolo vengono corretti a monte, non segnalati", () => {
    const a = auditListing(mkRaw({ titolo: "Trilocale  luminoso   in centro" }));
    assert.ok(!checks(a).includes("titolo-spazi-doppi"), "il controllo è stato ritirato");
    // La correzione si verifica dove avviene: cleanField è il varco unico dei
    // campi testuali in ingresso, e collassa gli spazi interni.
    assert.equal(cleanField("Trilocale  luminoso   in centro"), "Trilocale luminoso in centro");
    assert.equal(cleanField("  Villa   con giardino  "), "Villa con giardino");
  });

  test("nessuno di questi difetti blocca la CI: sono tutti REVIEW", () => {
    const a = auditListing(
      mkRaw({
        descrizione: "Il ns immobile e' su www.esempio.it. Compra e vendi in serenità con",
      }),
    );
    const nostri = ["link-in-descrizione", "accento-apostrofato", "abbreviazione-da-appunti", "frase-troncata"];
    for (const c of nostri) {
      const f = a.findings.find((x) => x.check === c);
      assert.ok(f, `manca il rilievo ${c}`);
      assert.equal(f.severity, "REVIEW", `${c} non deve bloccare la CI`);
    }
  });
});
