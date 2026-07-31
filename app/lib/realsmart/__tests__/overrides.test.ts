// Regressione degli override manuali.
//
// Gli override sono l'ultima parola su un immobile: se sbagliano, sbaglia la pagina pubblica.
// Per questo la validazione è severa (una chiave con un refuso è un errore, non un campo
// ignorato) e ogni voce deve dichiarare motivo, fonte, data e autore.
//
// Le fixture qui sotto sono di prova e non toccano alcun immobile reale. L'ultimo blocco
// invece controlla il file dati di PRODUZIONE (app/lib/realsmart/overrides.data.ts), che oggi
// contiene le descrizioni rimesse in paragrafi degli annunci consegnati in blocco unico.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  applyRemovals,
  buildOverridesReport,
  indexOverrides,
  overrideFacts,
  validateOverrides,
  type ListingOverride,
} from "../overrides";
import { factsFromDescription, factsFromFields, mergeFacts } from "../facts";
import { listingOverrides } from "../overrides.data";

/** Override valido minimo, da estendere nei singoli test. */
function fixture(over: Partial<ListingOverride> = {}): ListingOverride {
  return {
    codice: "9001",
    motivo: "APE consegnato dopo la pubblicazione dell'annuncio",
    fonte: "email dell'agenzia del 12/03/2026",
    data: "2026-03-12",
    autore: "Domus Tua — Raffaela",
    ...over,
  };
}

describe("validateOverrides — schema", () => {
  test("un override completo passa", () => {
    assert.deepEqual(validateOverrides([fixture()]), []);
  });

  test("motivo, fonte, data e autore sono obbligatori", () => {
    const incomplete = { codice: "9001", fatti: [{ key: "ascensore" }] };
    const errors = validateOverrides([incomplete]);
    for (const field of ["motivo", "fonte", "data", "autore"]) {
      assert.ok(errors.some((e) => e.includes(`"${field}"`)), field);
    }
  });

  test("una chiave sconosciuta è un errore, non un campo ignorato", () => {
    const errors = validateOverrides([{ ...fixture(), note: "appunto" }]);
    assert.ok(errors.some((e) => e.includes('chiave sconosciuta "note"')));
  });

  test("codice duplicato rifiutato", () => {
    const errors = validateOverrides([fixture(), fixture()]);
    assert.ok(errors.some((e) => e.includes('codice duplicato "9001"')));
  });

  test("la data deve essere ISO", () => {
    assert.ok(validateOverrides([fixture({ data: "12/03/2026" })]).some((e) => e.includes("YYYY-MM-DD")));
  });

  test("una chiave fuori catalogo richiede gruppo ed etichetta", () => {
    const senza = validateOverrides([fixture({ fatti: [{ key: "vicinoAlParco" }] })]);
    assert.ok(senza.some((e) => e.includes('serve "label"')));
    assert.ok(senza.some((e) => e.includes('serve "group"')));

    const con = validateOverrides([
      fixture({ fatti: [{ key: "vicinoAlParco", group: "forza", label: "Affaccio sul parco" }] }),
    ]);
    assert.deepEqual(con, []);
  });

  test("una chiave del catalogo non può essere spostata di gruppo", () => {
    const errors = validateOverrides([
      fixture({ fatti: [{ key: "ascensore", group: "principali" }] }),
    ]);
    assert.ok(errors.some((e) => e.includes('vive nel gruppo "comfort"')));
  });

  test("descrizione approvata: array di paragrafi non vuoti", () => {
    assert.deepEqual(validateOverrides([fixture({ descrizione: ["Primo.", "Secondo."] })]), []);
    assert.ok(validateOverrides([fixture({ descrizione: [] })]).length > 0);
    assert.ok(validateOverrides([fixture({ descrizione: ["  "] })]).length > 0);
  });

  test("indexOverrides lancia su schema invalido (= build rotta, non pagina sbagliata)", () => {
    assert.throws(
      () => indexOverrides([{ codice: "9001" }]),
      /override non valid/i,
    );
  });
});

describe("override — applicazione e priorità", () => {
  test("l'override vince sul campo RealSmart e sull'estrazione", () => {
    const override = fixture({ fatti: [{ key: "classeEnergetica", value: "A2" }] });
    const merged = mergeFacts(
      overrideFacts(override),
      factsFromFields({ classeEnergetica: "G" }),
      factsFromDescription(["Immobile in classe energetica F."]).facts,
    );
    const energy = merged.filter((f) => f.key === "classeEnergetica");
    assert.equal(energy.length, 1);
    assert.equal(energy[0].value, "A2");
    assert.equal(energy[0].source, "override");
  });

  test("l'override porta con sé la tracciabilità nell'evidenza", () => {
    const [f] = overrideFacts(fixture({ fatti: [{ key: "terrazzi", value: "3" }] }));
    assert.ok(f.evidence?.includes("2026-03-12"));
    assert.ok(f.evidence?.includes("Raffaela"));
  });

  test("rimozione di una caratteristica errata", () => {
    const facts = factsFromFields({ dettagli: { ascensore: true, ariaCondizionata: true } });
    const cleaned = applyRemovals(facts, fixture({ rimuovi: ["ascensore"] }));
    assert.ok(!cleaned.some((f) => f.key === "ascensore"));
    assert.ok(cleaned.some((f) => f.key === "ariaCondizionata"));
  });

  test("dato non pubblicabile: la rimozione batte anche l'estrazione dalla descrizione", () => {
    const facts = mergeFacts(factsFromDescription(["Ampio soggiorno di circa 30 mq."]).facts);
    assert.ok(facts.some((f) => f.key === "soggiorno"));
    assert.deepEqual(applyRemovals(facts, fixture({ rimuovi: ["soggiorno"] })), []);
  });

  test("una chiave nuova viene pubblicata con gruppo ed etichetta dichiarati", () => {
    const [f] = overrideFacts(
      fixture({ fatti: [{ key: "vicinoAlParco", group: "forza", label: "Affaccio sul parco" }] }),
    );
    assert.equal(f.group, "forza");
    assert.equal(f.label, "Affaccio sul parco");
    assert.equal(f.value, undefined);
  });

  test("nessun override → nessuna modifica", () => {
    const facts = factsFromFields({ mq: 100, dettagli: { ascensore: true } });
    assert.deepEqual(overrideFacts(undefined), []);
    assert.deepEqual(applyRemovals(facts, undefined), facts);
  });
});

describe("report degli override", () => {
  const overrides = indexOverrides([
    fixture({ codice: "9001", fatti: [{ key: "classeEnergetica", value: "A2" }] }),
    fixture({ codice: "9002", rimuovi: ["ascensore"], mostraIndirizzo: true }),
  ]);

  test("gli override applicati elencano modifiche e tracciabilità", () => {
    const report = buildOverridesReport(overrides, ["9001", "9002"]);
    assert.equal(report.applicati.length, 2);
    assert.equal(report.orfani.length, 0);
    assert.deepEqual(report.applicati[0].modifiche, ["imposta classeEnergetica = A2"]);
    assert.deepEqual(report.applicati[1].modifiche, ["rimuove ascensore", "pubblica l'indirizzo"]);
    assert.equal(report.applicati[0].autore, "Domus Tua — Raffaela");
  });

  test("un override su un immobile inesistente finisce tra gli orfani", () => {
    const report = buildOverridesReport(overrides, ["9001"]);
    assert.deepEqual(report.orfani, ["9002"]);
    assert.equal(report.applicati.length, 1);
  });

  test("gli altri immobili non vengono toccati", () => {
    const report = buildOverridesReport(overrides, ["9001", "9002", "1234", "5678"]);
    assert.ok(!report.applicati.some((a) => ["1234", "5678"].includes(a.codice)));
  });
});

describe("file dati di produzione", () => {
  test("ogni voce è valida e tracciata", () => {
    for (const [codice, o] of listingOverrides) {
      assert.equal(o.codice, codice);
      for (const field of ["motivo", "fonte", "data", "autore"] as const) {
        assert.ok(o[field] && o[field].trim().length > 0, `${codice}: manca "${field}"`);
      }
      assert.match(o.data, /^\d{4}-\d{2}-\d{2}$/, codice);
    }
  });

  test("le descrizioni sostituite risolvono davvero il problema che dichiarano", () => {
    // Esistono per spezzare blocchi illeggibili: se un paragrafo resta sopra i 1200 caratteri
    // l'override non serve a niente. E nessun paragrafo può essere vuoto.
    for (const [codice, o] of listingOverrides) {
      if (!o.descrizione) continue;
      assert.ok(o.descrizione.length > 1, `${codice}: un solo paragrafo, non risolve nulla`);
      for (const par of o.descrizione) {
        assert.ok(par.trim().length > 0, `${codice}: paragrafo vuoto`);
        assert.ok(par.length <= 1200, `${codice}: paragrafo ancora di ${par.length} caratteri`);
        assert.ok(!/<br|<[a-z/][^>]*>/i.test(par), `${codice}: markup nel testo approvato`);
        assert.ok(!/_{3,}/.test(par), `${codice}: segnaposto non compilato`);
      }
    }
  });

  test("nessun contenuto demo: i codici sono quelli reali del gestionale", () => {
    for (const codice of listingOverrides.keys()) {
      assert.match(codice, /^\d+$/, `${codice}: non è un codice RealSmart`);
    }
  });
});
