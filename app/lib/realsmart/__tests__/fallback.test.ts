// Che cosa succede quando RealSmart non risponde.
//
// Il feed è l'unica fonte degli immobili: se cade, la scheda non deve né esplodere né mostrare
// una pagina vuota. Il client ripiega sui mock locali e logga il motivo. Questo test verifica
// che il ripiegamento avvenga davvero e che il contenuto servito in quel caso sia pulito
// quanto quello reale (paragrafi veri, nessun tag, fatti con provenienza).

import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";

import { getMockRealSmartListings } from "../mocks";
import { normalizeRealSmartListing } from "../normalize";
import { normalizedToProperty } from "../toProperty";

describe("provider RealSmart indisponibile", () => {
  const original = process.env.REALSMART_FEED_URL;

  before(() => {
    // Indirizzo non risolvibile: simula il feed irraggiungibile.
    process.env.REALSMART_FEED_URL = "http://127.0.0.1:1/realsmart-non-raggiungibile.xml";
  });
  after(() => {
    if (original === undefined) delete process.env.REALSMART_FEED_URL;
    else process.env.REALSMART_FEED_URL = original;
  });

  test("il caricamento ripiega sui mock invece di lanciare", async () => {
    // loadListings è la funzione NON memorizzata: getLiveListings la avvolge in unstable_cache,
    // che richiede il runtime di Next e qui non è disponibile.
    const { loadListings } = await import("../client");
    // Ritorna anche la PROVENIENZA del dato: serve all'assistente, che non deve mai citare
    // immobili mock come reali (app/lib/assistant/listings.ts).
    const { listings, source } = await loadListings();
    assert.equal(source, "mock", "col feed irraggiungibile la sorgente è il ripiego");
    assert.ok(listings.length > 0, "la lista non deve mai essere vuota");
    for (const l of listings) {
      assert.ok(l.slug.length > 0);
      assert.ok(l.descriptionParagraphs.length > 0, `${l.slug}: descrizione vuota nel ripiego`);
    }
  });

  test("il contenuto di ripiego è pulito quanto quello reale", () => {
    const properties = getMockRealSmartListings()
      .map(normalizeRealSmartListing)
      .map(normalizedToProperty);

    assert.ok(properties.length > 0);
    for (const p of properties) {
      assert.ok(p.description.length > 0, `${p.slug}: nessun paragrafo`);
      for (const par of p.description) {
        assert.ok(par.trim().length > 0, `${p.slug}: paragrafo vuoto`);
        assert.ok(!/<br|<[a-z/][^>]*>/i.test(par), `${p.slug}: markup nel testo`);
      }
      for (const f of p.facts ?? []) {
        assert.ok(["override", "realsmart", "descrizione"].includes(f.source), f.key);
        assert.notEqual(f.value, "—");
      }
    }
  });
});
