// Robustezza della normalizzazione RealSmart: segnaposto, avvisi deterministici,
// output deterministico, ISOLAMENTO degli errori (un record rotto non rompe il
// catalogo), e preparazione AI (opzionale, con fallback sicuro, provider finto).

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { normalizeRealSmartListing, normalizeListings } from "../normalize";
import { cleanField, isPlaceholder, validateListing } from "../validate";
import { applyAiNormalization, getAiNormalizer, type AiNormalizer } from "../aiNormalizer";
import type { RealSmartListingRaw } from "../types";

// ── Fixtures: valido, incompleto, malformato ───────────────────────────────
const validRaw: RealSmartListingRaw = {
  codice: "T100",
  titolo: "Trilocale luminoso ristrutturato",
  descrizione: "Bel trilocale ristrutturato con terrazzo abitabile.",
  prezzo: "250.000",
  tipologia: "Appartamento",
  contratto: "vendita",
  localita: { comune: "Tradate", provincia: "VA" },
  mq: "95",
  locali: 3,
  camere: 2,
  bagni: 1,
  classeEnergetica: "B",
  statoPubblicazione: "published",
  media: [{ url: "https://cloud.realsmart.it/1.jpg", tipo: "foto" }],
};

/** Incompleto: prezzo/foto/comune mancanti, tipologia e classe = SEGNAPOSTO,
    stato non fra quelli mappati. Normalizza senza lanciare, ma con avvisi. */
const incompleteRaw: RealSmartListingRaw = {
  codice: "T200",
  titolo: "TERRENO EDIFICABILE VICINO AL CENTRO",
  tipologia: "N/D",
  classeEnergetica: "-",
  statoPubblicazione: "in_lavorazione",
  localita: { comune: "", provincia: "" },
};

/** Malformato: `caratteristiche` non è un array → `normalizeRealSmartListing`
    lancia. Serve a provare l'isolamento degli errori nel lotto. */
const malformedRaw = {
  codice: "BAD",
  titolo: "Record rotto",
  caratteristiche: 42,
} as unknown as RealSmartListingRaw;

describe("cleanField — i segnaposto diventano assenti, non dati", () => {
  test("segnaposto → undefined", () => {
    for (const p of ["N/D", "n.d.", "-", "  --  ", "da definire", "Non disponibile", "", "   "]) {
      assert.equal(cleanField(p), undefined, JSON.stringify(p));
    }
  });
  test("valori veri → trimmati e mantenuti", () => {
    assert.equal(cleanField("  Villa  "), "Villa");
    assert.equal(cleanField("A4"), "A4");
    assert.equal(cleanField(2), "2");
  });
  test("isPlaceholder distingue vuoto da segnaposto", () => {
    assert.equal(isPlaceholder("N/D"), true);
    assert.equal(isPlaceholder(""), false); // vuoto non è un segnaposto scritto
    assert.equal(isPlaceholder("Villa"), false);
  });
});

describe("normalize — deterministico e con segnaposto ripuliti", () => {
  test("stesso input → stesso output (deterministico)", () => {
    assert.deepEqual(normalizeRealSmartListing(validRaw), normalizeRealSmartListing(validRaw));
  });
  test("record valido: nessun avviso, campi puliti, normalizedBy deterministico", () => {
    const v = normalizeRealSmartListing(validRaw);
    assert.equal(v.warnings, undefined);
    assert.equal(v.normalizedBy, "deterministic");
    assert.equal(v.type, "Appartamento");
    assert.equal(v.price, 250000);
    assert.equal(v.energyClass, "B");
  });
  test("record incompleto: segnaposto ripuliti, stato non mappato nascosto", () => {
    const inc = normalizeRealSmartListing(incompleteRaw);
    assert.equal(inc.type, "Immobile"); // "N/D" → ripiego, non "N/D" in pagina
    assert.equal(inc.energyClass, undefined); // "-" → assente
    assert.equal(inc.status, "draft"); // stato non mappato → nascosto per sicurezza
    assert.equal(inc.price, 0);
    assert.equal(inc.priceLabel, "Prezzo su richiesta");
  });
});

describe("validateListing — avvisi deterministici sui dati sospetti", () => {
  test("il record incompleto accende gli avvisi giusti", () => {
    const inc = normalizeRealSmartListing(incompleteRaw);
    const codes = (inc.warnings ?? []).map((w) => w.code);
    for (const c of [
      "images-missing",
      "price-missing",
      "type-missing",
      "location-missing",
      "surface-missing",
      "status-unmapped",
      "placeholder-field",
    ]) {
      assert.ok(codes.includes(c as never), `manca l'avviso ${c}: ${codes.join(",")}`);
    }
  });
  test("l'avviso conserva il valore GREZZO per diagnostica", () => {
    const w = validateListing(normalizeRealSmartListing(incompleteRaw), incompleteRaw);
    const status = w.find((x) => x.code === "status-unmapped");
    assert.equal(status?.raw, "in_lavorazione");
  });
  test("un record valido non produce avvisi", () => {
    assert.deepEqual(validateListing(normalizeRealSmartListing(validRaw), validRaw), []);
  });
});

describe("normalizeListings — un record rotto non rompe il catalogo", () => {
  test("il malformato è scartato, gli altri passano", async () => {
    const { listings, skipped } = await normalizeListings([validRaw, malformedRaw, incompleteRaw]);
    assert.equal(listings.length, 2, "restano i due record buoni");
    assert.equal(skipped.length, 1, "solo il malformato è scartato");
    assert.equal(skipped[0].codice, "BAD");
    assert.ok(listings.some((l) => l.id === "T100"));
    assert.ok(listings.some((l) => l.id === "T200"));
  });
});

describe("preparazione AI — opzionale, deterministico di default, fallback sicuro", () => {
  const base = normalizeRealSmartListing(validRaw);

  test("senza configurazione, getAiNormalizer è null (deterministico)", () => {
    assert.equal(getAiNormalizer(), null);
  });

  test("ai=null → record invariato, resta deterministico", async () => {
    const out = await applyAiNormalization(base, validRaw, null);
    assert.equal(out, base);
    assert.equal(out.normalizedBy, "deterministic");
  });

  test("provider finto: migliora e marca normalizedBy=ai", async () => {
    const fakeAi: AiNormalizer = {
      async enhance(b) {
        return { ...b, excerpt: `${b.excerpt} [rivisto]` };
      },
    };
    const out = await applyAiNormalization(base, validRaw, fakeAi);
    assert.equal(out.normalizedBy, "ai");
    assert.match(out.excerpt, /\[rivisto\]$/);
  });

  test("provider che lancia → fallback SICURO al deterministico", async () => {
    const brokenAi: AiNormalizer = {
      async enhance() {
        throw new Error("provider non raggiungibile");
      },
    };
    const out = await applyAiNormalization(base, validRaw, brokenAi);
    assert.equal(out.normalizedBy, "deterministic");
    assert.deepEqual(out, base);
  });

  test("nel lotto, un provider finto marca ogni record", async () => {
    const fakeAi: AiNormalizer = { async enhance(b) { return b; } };
    const { listings } = await normalizeListings([validRaw], fakeAi);
    assert.equal(listings[0].normalizedBy, "ai");
  });
});
