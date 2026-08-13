// Sicurezza recensioni in produzione.
//
// Regola: una recensione DEMO non deve mai comparire come reale in un build di
// produzione; la sezione nativa resta nascosta finché non ci sono recensioni
// APPROVATE dal cliente; i dati malformati non arrivano in pagina; nessun dato
// strutturato di recensione finché non c'è contenuto reale, idoneo e visibile.
//
// (Il gate del consenso a Trustindex — permesso/negato senza rompere la pagina —
// è coperto dagli e2e in e2e/consent-reviews.spec.ts.)

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  demoReviews,
  approvedNativeReviews,
  nativeReviews,
  isPublishableReview,
  hasApprovedNativeReviews,
  reviewSummary,
  type Review,
} from "../reviews";

const APP = path.join(process.cwd(), "app");
function productionSources(): string[] {
  const out: string[] = [];
  (function walk(dir: string) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name === "__tests__" || e.name === "__fixtures__") continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (/\.tsx?$/.test(e.name)) out.push(full);
    }
  })(APP);
  return out;
}

describe("recensioni — le demo non passano mai per reali", () => {
  test("ogni recensione demo è status 'demo' (mai 'approved')", () => {
    assert.ok(demoReviews.length > 0);
    for (const r of demoReviews) assert.equal(r.status, "demo", r.id);
  });

  test("PRODUZIONE senza recensioni approvate: sezione nativa vuota (niente demo)", () => {
    assert.equal(hasApprovedNativeReviews, false, "oggi non ci sono recensioni native approvate");
    assert.deepEqual(nativeReviews({ preview: false }), [], "in produzione nessuna card nativa");
  });

  test("ANTEPRIMA/demo: mostra le demo (che il componente etichetta)", () => {
    const shown = nativeReviews({ preview: true });
    assert.equal(shown.length, demoReviews.length);
    assert.ok(shown.every((r) => r.status === "demo"));
  });
});

describe("recensioni — con approvate presenti, solo quelle (anche in produzione)", () => {
  // Simula un set di approvate + la logica del selettore (senza mutare i dati reali).
  const approved: Review[] = [{ ...demoReviews[0], id: "real-1", status: "approved" }];
  const select = (all: Review[], preview: boolean) => {
    const ok = all.filter(isPublishableReview);
    return ok.length > 0 ? ok : preview ? demoReviews : [];
  };

  test("in produzione compaiono le approvate, mai le demo", () => {
    const shown = select([...approved, ...demoReviews], false);
    assert.ok(shown.every((r) => r.status === "approved"));
    assert.ok(!shown.some((r) => r.status === "demo"));
  });
});

describe("recensioni — dati malformati non arrivano in pagina", () => {
  const good: Review = { ...demoReviews[0], id: "ok", status: "approved" };

  test("un record approvato e ben formato è pubblicabile", () => {
    assert.equal(isPublishableReview(good), true);
  });

  test("record malformati o non approvati sono scartati", () => {
    const bads: unknown[] = [
      null,
      undefined,
      42,
      "stringa",
      {},
      { ...good, status: "demo" }, // non approvata
      { ...good, text: "" }, // senza testo
      { ...good, name: "   " }, // senza nome
      { ...good, rating: 0 }, // voto fuori scala
      { ...good, rating: 9 },
      { ...good, date: "non-una-data" }, // data invalida
    ];
    for (const bad of bads) {
      assert.equal(isPublishableReview(bad), false, JSON.stringify(bad));
    }
  });
});

describe("recensioni — struttura futura e conteggi", () => {
  test("l'elenco approvato parte vuoto: niente segnaposto pubblicati", () => {
    assert.deepEqual(approvedNativeReviews, []);
  });

  test("il conteggio è di RECENSIONI, non di clienti distinti", () => {
    assert.match(reviewSummary.label, /recensioni/);
    assert.doesNotMatch(reviewSummary.label, /client|famigli/i);
  });
});

describe("recensioni — nessun dato strutturato finché non c'è contenuto reale (task 9)", () => {
  test("nessuno schema AggregateRating/Review nelle sorgenti di produzione", () => {
    const offenders = productionSources().filter((f) => {
      const src = fs.readFileSync(f, "utf8");
      return /"@type":\s*"(AggregateRating|Review)"|\baggregateRating\s*:/.test(src);
    });
    assert.deepEqual(
      offenders.map((f) => path.relative(process.cwd(), f)),
      [],
      "niente review structured data finché non c'è contenuto reale, idoneo e visibile"
    );
  });
});
