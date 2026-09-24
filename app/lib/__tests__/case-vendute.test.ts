// /case-vendute pubblica un'affermazione sui RISULTATI dell'agenzia. È la pagina più
// facile da gonfiare e la più costosa da smentire, quindi qui si difendono due cose sole:
// che «venduto» voglia dire venduto, e che i numeri portino con sé il loro campione.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { isCompletedSale, soldDetectionDate } from "../realsmart/soldOverrides";

const detected = JSON.parse(
  readFileSync(join(process.cwd(), "app/lib/realsmart/sold-detected.json"), "utf8")
) as { items: Record<string, { sold: boolean; cover: string; text?: string }> };

const read = (p: string) => readFileSync(join(process.cwd(), "app", p), "utf8");

describe("«venduto» vuol dire venduto", () => {
  test("un preliminare o una proposta accettata NON contano come vendita", () => {
    // Al 2026-08-08 erano 9 schede. Il badge dice che l'immobile è impegnato — quindi
    // fuori dalla vetrina, giustamente — ma un preliminare può ancora saltare: non è un
    // risultato da rivendicare.
    const preCompletion = Object.entries(detected.items).filter(
      ([, v]) => v.sold && /PRELIMIN|PROPOST|ACCETT|COMPROM/i.test(v.text ?? "")
    );
    assert.ok(
      preCompletion.length > 0,
      "il campione non contiene più badge pre-rogito: se il gestionale è cambiato, verificare che il filtro serva ancora"
    );
    for (const [codice, v] of preCompletion) {
      assert.equal(
        isCompletedSale(codice, v.cover),
        false,
        `${codice} ("${v.text}") verrebbe pubblicato come venduto`
      );
    }
  });

  test("un badge VENDUTO pulito conta", () => {
    const clean = Object.entries(detected.items).find(
      ([, v]) => v.sold && /^\s*VENDUTO\s*$/i.test(v.text ?? "")
    );
    assert.ok(clean, "nessun badge VENDUTO pulito nel campione");
    assert.equal(isCompletedSale(clean[0], clean[1].cover), true);
  });

  test("la copertina cambiata invalida l'esito (vale anche qui)", () => {
    const [codice, v] = Object.entries(detected.items).find(([, x]) => x.sold)!;
    assert.equal(isCompletedSale(codice, v.cover), true);
    assert.equal(
      isCompletedSale(codice, "https://esempio.invalid/altra-copertina.jpg"),
      false,
      "con una copertina diversa l'esito OCR è stantìo e non va usato"
    );
  });
});

describe("la pagina non afferma ciò che non sa", () => {
  const src = read("case-vendute/CaseVenduteContent.tsx");
  const page = read("case-vendute/page.tsx");

  test("nessun prezzo: quello del gestionale è di richiesta, non di rogito", () => {
    assert.doesNotMatch(src, /\{p\.price\}/, "la card stampa un prezzo");
    assert.doesNotMatch(src, /price:/, "il tipo della card espone un prezzo");
  });

  test("nessuna promessa di tempi di vendita", () => {
    // La FAQ del sito si rifiuta di promettere tempi ed è la riga più credibile che
    // l'agenzia abbia: una pagina di risultati non può contraddirla.
    assert.doesNotMatch(src, /in \d+ giorni|tempo medio|mediamente in/i);
  });

  test("il conteggio viaggia sempre col suo denominatore", () => {
    // "168 vendute" da solo non si può leggere. Il campione (le schede pubblicate) è
    // parte del dato, non un dettaglio.
    assert.match(src, /statTotal/, "manca il totale delle schede pubblicate");
    assert.match(page, /total: all\.length/, "il denominatore non viene dalla stessa fonte");
  });

  test("il taglio della griglia è dichiarato, non silenzioso", () => {
    assert.match(page, /MAX_CARDS/);
    assert.match(src, /shownNote/, "il numero di schede mostrate non viene dichiarato in pagina");
  });

  test("la data del rilevamento esiste ed è quella del file", () => {
    assert.equal(soldDetectionDate(), (detected as unknown as { generatedAt: string }).generatedAt);
  });
});
