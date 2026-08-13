// Base di conoscenza dei fatti d'area (Prompt 9): provenienza, guard soggettivo, pubblicazione,
// staleness, conflitti, i18n, import/export.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { AreaFactSchema, type AreaFact } from "../types";
import { findSubjectiveViolations, isFactualText } from "../subjective";
import { toPublicAreaProfile, factsDueForReview, localizeFactText, isPublishable } from "../public";
import { approvalBlockers } from "../validate";
import { parseAreaFactsBundle, serializeAreaFacts, AREA_FACT_TEMPLATE } from "../importExport";
import { getPublicAreaProfile } from "../data";

const NOW = new Date("2026-08-14T10:00:00.000Z");

function fact(over: Partial<AreaFact> = {}): AreaFact {
  return {
    id: over.id ?? "tradate-stazione-01",
    municipality: over.municipality ?? "tradate",
    category: over.category ?? "transport",
    scope: over.scope ?? "municipality",
    text: over.text ?? "La stazione di Tradate è sulla linea ferroviaria regionale.",
    translations: over.translations ?? [],
    source: over.source ?? {
      url: "https://www.comune.tradate.va.it/stazione",
      owner: "Comune di Tradate",
      retrievedAt: "2026-08-01T00:00:00.000Z",
    },
    reviewBy: over.reviewBy ?? "2027-02-14T00:00:00.000Z",
    status: over.status ?? "approved",
    conflicts: over.conflicts ?? [],
    ...(over.approvedBy ? { approvedBy: over.approvedBy } : {}),
    ...(over.approvedAt ? { approvedAt: over.approvedAt } : {}),
  };
}

describe("schema: provenienza obbligatoria", () => {
  test("un fatto senza fonte è RIFIUTATO", () => {
    const bad = { ...fact() } as Record<string, unknown>;
    delete bad.source;
    assert.equal(AreaFactSchema.safeParse(bad).success, false);
  });
  test("un URL non valido è RIFIUTATO", () => {
    assert.equal(AreaFactSchema.safeParse(fact({ source: { url: "non-un-url", owner: "x", retrievedAt: "2026-08-01T00:00:00.000Z" } })).success, false);
  });
});

describe("guard soggettivo", () => {
  const forbidden: Array<[string, string]> = [
    ["Zona sicura e tranquilla, senza criminalità.", "safety"],
    ["Quartiere prestigioso e signorile.", "prestige"],
    ["Le migliori scuole della provincia.", "superlative"],
    ["Zona abitata da famiglie ricche.", "demographic"],
    ["Ottimo investimento: il valore crescerà.", "investment"],
    ["Ideale per famiglie con bambini.", "suitability"],
  ];
  for (const [text, cat] of forbidden) {
    test(`blocca (${cat}): "${text.slice(0, 24)}…"`, () => {
      const v = findSubjectiveViolations(text);
      assert.ok(v.some((x) => x.category === cat), JSON.stringify(v));
    });
  }
  test("un fatto neutro passa", () => {
    assert.equal(isFactualText("La biblioteca comunale è aperta dal lunedì al sabato."), true);
  });
  test("un fatto soggettivo NON è approvabile", () => {
    const blockers = approvalBlockers(fact({ text: "Quartiere prestigioso vicino alle migliori scuole." }));
    assert.ok(blockers.length >= 1);
  });
});

describe("pubblicazione: approvato + fresco + senza conflitti + fattuale", () => {
  test("un fatto valido è pubblicabile e compare nel profilo", () => {
    assert.equal(isPublishable(fact(), NOW), true);
    const profile = toPublicAreaProfile([fact()], { now: NOW, locale: "it", municipality: "tradate" });
    assert.equal(profile?.facts.length, 1);
    // Nessun campo interno/di stato nel pubblico.
    assert.ok(!("status" in (profile!.facts[0] as object)));
  });
  test("draft / scaduto / con conflitto / soggettivo → esclusi", () => {
    const draft = fact({ id: "a", status: "draft" });
    const stale = fact({ id: "b", reviewBy: "2026-01-01T00:00:00.000Z" });
    const conflict = fact({ id: "c", conflicts: [{ source: fact().source, note: "fonte diversa dice altro" }] });
    const subjective = fact({ id: "d", text: "Zona prestigiosa." });
    const profile = toPublicAreaProfile([draft, stale, conflict, subjective], { now: NOW, locale: "it", municipality: "tradate" });
    assert.equal(profile, null, "niente di pubblicabile");
  });
});

describe("i18n: traduzione approvata o ripiego alla canonica", () => {
  test("traduzione APPROVATA usata per la lingua", () => {
    const f = fact({ translations: [{ locale: "en", text: "Tradate station is on the regional line.", approved: true }] });
    assert.equal(localizeFactText(f, "en"), "Tradate station is on the regional line.");
  });
  test("traduzione NON approvata → ripiego alla canonica italiana", () => {
    const f = fact({ translations: [{ locale: "en", text: "draft machine translation", approved: false }] });
    assert.equal(localizeFactText(f, "en"), f.text);
  });
});

describe("staleness / promemoria di revisione", () => {
  test("fatti in scadenza entro N giorni sono elencati", () => {
    const soon = fact({ id: "soon", reviewBy: "2026-08-20T00:00:00.000Z" });
    const later = fact({ id: "later", reviewBy: "2027-06-01T00:00:00.000Z" });
    const due = factsDueForReview([soon, later], NOW, 30);
    assert.deepEqual(due.map((f) => f.id), ["soon"]);
  });
});

describe("import/export", () => {
  test("parse valida e segnala i blocker senza scartare in silenzio", () => {
    const report = parseAreaFactsBundle({ facts: [fact(), fact({ id: "x", text: "Zona prestigiosa." })] });
    assert.equal(report.ok.length, 2);
    assert.equal(report.errors.length, 0);
    assert.ok(report.blockers.some((b) => b.id === "x"));
  });
  test("serialize è deterministico (ordinato per id)", () => {
    const s1 = serializeAreaFacts([fact({ id: "b" }), fact({ id: "a" })]);
    const s2 = serializeAreaFacts([fact({ id: "a" }), fact({ id: "b" })]);
    assert.equal(s1, s2);
    assert.ok(s1.indexOf('"a"') < s1.indexOf('"b"'));
  });
  test("il template è uno scheletro valido per forma (una volta compilato)", () => {
    // Il template ha zone:null; con zone omessa lo schema passa.
    const { zone: _zone, ...rest } = AREA_FACT_TEMPLATE;
    void _zone;
    assert.equal(AreaFactSchema.safeParse(rest).success, true);
  });
});

describe("separazione + nessuna invenzione", () => {
  test("dati vuoti di default → getPublicAreaProfile null (l'assistente non inventa)", () => {
    assert.equal(getPublicAreaProfile("tradate", { now: NOW, locale: "it" }), null);
  });
  test("con fatti approvati, 'com'è vivere a Tradate?' ha di che rispondere (solo fatti d'area)", () => {
    const profile = toPublicAreaProfile(
      [
        fact({ id: "t1", category: "transport" }),
        fact({ id: "s1", category: "municipal-service", text: "La biblioteca comunale è aperta dal lunedì al sabato." }),
      ],
      { now: NOW, locale: "it", municipality: "tradate" },
    );
    assert.equal(profile?.municipality, "tradate");
    assert.equal(profile?.facts.length, 2);
    // Ogni fatto pubblico è tracciabile a una fonte corrente.
    assert.ok(profile!.facts.every((f) => f.sourceUrl.startsWith("http") && f.sourceOwner.length > 0));
  });
});
