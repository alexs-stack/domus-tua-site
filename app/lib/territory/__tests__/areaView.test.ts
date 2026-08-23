// Il modello di vista della sezione "Vivere in zona": intestazione, sintesi, fonti.
//
// Il difetto che questi test chiudono è editoriale prima che tecnico: la sezione si intestava
// sempre allo stesso modo ("La zona in sintesi"), quindi due immobili in due frazioni diverse
// dello stesso comune leggevano la stessa identica intestazione. Ora l'intestazione nomina
// l'area — e in italiano nomina anche la preposizione giusta.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { buildAreaView, areaHeadingStrings } from "../view";
import type { PublicAreaProfile } from "../area/types";

const FACT: PublicAreaProfile["facts"][number] = {
  category: "transport",
  scope: "municipality",
  text: "La stazione di Tradate serve la linea ferroviaria regionale.",
  sourceOwner: "Comune di Tradate",
  sourceUrl: "https://www.comune.tradate.va.it/stazione",
  reviewedAt: "2026-08-01T00:00:00.000Z",
};

function profile(over: Partial<PublicAreaProfile> = {}): PublicAreaProfile {
  return { municipality: "Tradate", facts: [FACT], ...over };
}

describe("intestazione: l'area si nomina, e con la preposizione giusta", () => {
  test('comune → "Vivere a {Comune}"', () => {
    const v = buildAreaView(profile({ label: "Tradate" }), "it");
    assert.equal(v?.title, "Vivere a Tradate");
  });

  test('quartiere → "Vivere in {Quartiere}"', () => {
    // In italiano si vive **a** un comune e **in** un quartiere: sbagliarla è la prima cosa che
    // un lettore locale nota.
    const v = buildAreaView(profile({ label: "Abbiate Guazzone" }), "it");
    assert.equal(v?.title, "Vivere in Abbiate Guazzone");
  });

  test("due frazioni dello stesso comune non hanno la stessa intestazione", () => {
    // È il difetto originario, in una riga.
    const a = buildAreaView(profile({ label: "Abbiate Guazzone" }), "it");
    const b = buildAreaView(profile({ label: "Ceppine" }), "it");
    assert.notEqual(a?.title, b?.title);
  });

  test("senza etichetta si ripiega sul comune, mai su una stringa vuota", () => {
    const v = buildAreaView(profile(), "it");
    assert.equal(v?.title, "Vivere a Tradate");
  });

  test("il titolo della narrativa approvata vince su quello costruito", () => {
    // È passato dal cancello e da una revisione umana: riscriverglielo qui vanificherebbe
    // entrambi.
    const v = buildAreaView(
      profile({
        label: "Tradate",
        narrative: { title: "Vivere a Tradate, fra la stazione e il centro", intro: "…", sections: [] },
      }),
      "it",
    );
    assert.equal(v?.title, "Vivere a Tradate, fra la stazione e il centro");
  });

  test("l'occhiello c'è in tutte le lingue supportate", () => {
    for (const locale of ["it", "en", "fr", "de", "es"] as const) {
      const v = buildAreaView(profile({ label: "Tradate" }), locale);
      assert.ok(v?.eyebrow && v.eyebrow.length > 0, `manca l'occhiello per ${locale}`);
    }
    assert.equal(areaHeadingStrings("it").eyebrow, "Vivere in zona");
  });
});

describe("sintesi e sezioni", () => {
  test("senza narrativa approvata la sintesi è vuota e la sezione mostra i soli fatti", () => {
    // È l'esito corretto, non un ripiego: meglio un elenco sobrio e tracciabile che una prosa
    // che nessuno ha approvato.
    const v = buildAreaView(profile(), "it");
    assert.equal(v?.intro, "");
    assert.deepEqual(v?.sections, []);
    assert.equal(v?.facts.length, 1);
  });

  test("con narrativa approvata arrivano introduzione e sezioni", () => {
    const v = buildAreaView(
      profile({
        narrative: {
          title: "Vivere a Tradate",
          intro: "Introduzione verificata.",
          sections: [
            { category: "transport", heading: "Mobilità", body: "Testo mobilità." },
            { category: "school", heading: "Scuole", body: "Testo scuole." },
          ],
        },
      }),
      "it",
    );
    assert.equal(v?.intro, "Introduzione verificata.");
    assert.deepEqual(v?.sections.map((s) => s.heading), ["Mobilità", "Scuole"]);
  });

  test("le sezioni si riordinano difensivamente sull'ordine canonico", () => {
    // Il guard rifiuta già l'ordine sbagliato a monte. Qui si ri-ordina lo stesso, come si fa
    // per i POI: l'ordine è ciò che rende le schede confrontabili fra loro, e un dato che
    // arriva da uno store non è mai garantito quanto un dato appena validato.
    const v = buildAreaView(
      profile({
        narrative: {
          title: "Vivere a Tradate",
          intro: "…",
          sections: [
            { category: "school", heading: "Scuole", body: "b" },
            { category: "transport", heading: "Mobilità", body: "a" },
          ],
        },
      }),
      "it",
    );
    assert.deepEqual(v?.sections.map((s) => s.heading), ["Mobilità", "Scuole"]);
  });
});

describe("fail-closed", () => {
  test("nessun fatto approvato → nessuna vista", () => {
    assert.equal(buildAreaView(profile({ facts: [] }), "it"), null);
    assert.equal(buildAreaView(null, "it"), null);
    assert.equal(buildAreaView(undefined, "it"), null);
  });

  test("una narrativa senza fatti approvati non basta a far comparire la sezione", () => {
    // Il testo nasce dai fatti: se i fatti non sono pubblicabili, il testo non ha su cosa
    // poggiare, per quanto sia già stato approvato.
    const v = buildAreaView(
      profile({
        facts: [],
        narrative: { title: "Vivere a Tradate", intro: "Testo.", sections: [] },
      }),
      "it",
    );
    assert.equal(v, null);
  });
});

describe("fonti", () => {
  test("ogni fatto porta ente e data di verifica", () => {
    const v = buildAreaView(profile(), "it");
    assert.equal(v?.facts[0].sourceOwner, "Comune di Tradate");
    assert.equal(v?.facts[0].sourceUrl, "https://www.comune.tradate.va.it/stazione");
    assert.match(v!.facts[0].reviewedLabel, /2026/);
  });

  test("l'etichetta del riepilogo fonti è localizzata", () => {
    assert.equal(buildAreaView(profile(), "it")?.sourcesSummary, "Fonti e date di verifica");
    assert.equal(buildAreaView(profile(), "en")?.sourcesSummary, "Sources and verification dates");
  });
});
