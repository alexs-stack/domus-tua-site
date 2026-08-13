// TEST DI INTEGRAZIONE — combinazioni che i test dei singoli PR non coprono.
//
// I PR #35 (redazione privacy deterministica) e #36 (Domus D.O.C. evidence-based) modificano
// ENTRAMBI la stessa funzione `normalizeRealSmartListing`, e in particolare lo stesso oggetto di
// ritorno. I loro test verificano i due comportamenti SEPARATAMENTE:
//   • privacy.test.ts prova il modulo puro privacy.ts, mai attraverso normalize;
//   • docVerified.test.ts prova docVerified su descrizioni SENZA indirizzi.
// Nessuno prova che le due politiche coesistano sullo STESSO immobile normalizzato — che è
// esattamente il punto in cui il merge dei due PR poteva rompersi. Questi test bloccano quella
// regressione: la sanitizzazione privacy e l'evidenza D.O.C. devono convivere.

import { test, describe, afterEach } from "node:test";
import assert from "node:assert/strict";

import { normalizeRealSmartListing } from "../normalize";
import { hasCivicAddress, hasPhoneNumber } from "../privacy";
import { listingOverrides } from "../overrides.data";
import type { ListingOverride } from "../overrides";
import type { RealSmartListingRaw } from "../types";

function mkRaw(over: Partial<RealSmartListingRaw> = {}): RealSmartListingRaw {
  return {
    codice: "INT-1",
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

/** Testo pubblico dell'immobile normalizzato (paragrafi + righe fatti + estratto). */
function publicText(p: ReturnType<typeof normalizeRealSmartListing>): string {
  return [
    ...p.descriptionParagraphs,
    ...p.structuredFactLines,
    ...p.keptFactLines,
    p.excerpt,
  ].join("\n");
}

describe("integrazione #35+#36 — privacy e Domus D.O.C. sullo stesso immobile", () => {
  // `listingOverrides` è esposta come ReadonlyMap (produzione); qui, SOLO nel test, la trattiamo
  // come mutabile per iniettare override sintetici e ripulirli subito dopo.
  const mutableOverrides = listingOverrides as Map<string, ListingOverride>;
  const INJECTED: string[] = [];
  function injectOverride(o: ListingOverride) {
    mutableOverrides.set(o.codice.trim(), o);
    INJECTED.push(o.codice.trim());
  }
  afterEach(() => {
    // Non contaminare gli altri test: la mappa override è un modulo condiviso.
    for (const code of INJECTED.splice(0)) mutableOverrides.delete(code);
  });

  test("redazione privacy CABLATA nella normalizzazione (nessun override, showAddress=false di default)", () => {
    const p = normalizeRealSmartListing(
      mkRaw({
        codice: "INT-REDACT",
        descrizione:
          "Splendido trilocale sito in Via Petrarca 7, a due passi dal centro. Tre camere e doppi servizi. Per info 333 1234567.",
      }),
    );
    // Indirizzo civico e telefono spariti da OGNI superficie pubblica (paragrafi, righe fatti, estratto).
    assert.ok(!hasCivicAddress(publicText(p)), `indirizzo residuo: ${publicText(p)}`);
    assert.ok(!hasPhoneNumber(publicText(p)), `telefono residuo: ${publicText(p)}`);
    // Il comune preserva il contesto di zona al posto dell'indirizzo redatto.
    assert.ok(publicText(p).includes("Tradate"), "il comune deve restare a dare contesto");
    // La policy è esplicita e l'evidenza D.O.C. non si inventa senza override.
    assert.equal(p.showAddress, false);
    assert.equal(p.docVerified, false);
    assert.ok(!p.badges.includes("Documenti verificati"));
    // I fatti strutturati sopravvivono alla redazione (non è la descrizione a fornirli qui).
    assert.equal(p.sqm, 90);
    assert.equal(p.rooms, 3);
  });

  test("COESISTENZA: docVerified=true + corpo approvato con indirizzo, showAddress=false → badge D.O.C. e indirizzo redatto", () => {
    injectOverride({
      codice: "INT-COESIST",
      motivo: "test integrazione",
      fonte: "APE 2026",
      data: "2026-01-01",
      autore: "Raffaela",
      docVerified: true,
      mostraIndirizzo: false,
      descrizione: ["Prestigioso attico in Piazza Garibaldi 3, ristrutturato di recente."],
    });
    const p = normalizeRealSmartListing(mkRaw({ codice: "INT-COESIST" }));

    // Lato D.O.C. (#36): evidenza esplicita → affermazione e badge attivi.
    assert.equal(p.docVerified, true, "l'override esplicito attesta il protocollo");
    assert.ok(p.badges.includes("Documenti verificati"), "il badge D.O.C. compare con evidenza");
    // Lato privacy (#35): il corpo approvato passa comunque dalla redazione (mostraIndirizzo=false).
    assert.equal(p.showAddress, false);
    assert.ok(!hasCivicAddress(publicText(p)), `indirizzo residuo nel corpo approvato: ${publicText(p)}`);
  });

  test("le due politiche sono ORTOGONALI: showAddress=true pubblica l'indirizzo ma docVerified resta false senza evidenza", () => {
    injectOverride({
      codice: "INT-ORTO",
      motivo: "test integrazione",
      fonte: "email cliente",
      data: "2026-01-01",
      autore: "Raffaela",
      mostraIndirizzo: true, // indirizzo autorizzato…
      // …ma NESSUN docVerified: l'affermazione D.O.C. non deve accendersi.
      descrizione: ["Villa in Via Petrarca 7, giardino privato."],
    });
    const p = normalizeRealSmartListing(mkRaw({ codice: "INT-ORTO" }));

    assert.equal(p.showAddress, true);
    assert.ok(publicText(p).includes("Via Petrarca 7"), "con showAddress=true l'indirizzo autorizzato resta");
    assert.equal(p.docVerified, false, "senza evidenza il protocollo non si attesta");
    assert.ok(!p.badges.includes("Documenti verificati"));
  });
});
