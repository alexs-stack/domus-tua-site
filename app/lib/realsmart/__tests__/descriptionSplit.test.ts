// Regressione della separazione fra testo narrativo e righe tecniche.
//
// Il rischio qui è opposto a quello della formattazione: mutilare il copy dell'agenzia per
// evitare una duplicazione. La regola è conservativa — si toglie al massimo una riga INTERA,
// e solo quando ogni suo frammento è già nei box.
//
// Lo snapshot su 20 descrizioni reali (sanitizzate: niente indirizzi, telefoni, email o link)
// è la rete di sicurezza: qualunque modifica alla pipeline che cambi il testo pubblicato
// diventa un diff visibile invece di una sorpresa in produzione.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";

import { splitDescription } from "../descriptionSplit";
import { factsFromDescription, factsFromFields, mergeFacts, type PropertyFact } from "../facts";
import { normalizeRealSmartListing } from "../normalize";
import type { RealSmartListingRaw } from "../types";

const FIXTURES_PATH = new URL("../__fixtures__/descriptions.sample.json", import.meta.url);
const SNAPSHOT_PATH = new URL("../__fixtures__/descriptions.snapshot.json", import.meta.url);

const T447_LINE = "Classe B · Doppio terrazzo · Vista Monte Rosa · Due autorimesse";

/** Fatti pubblicati per l'attico dello screenshot (come li produce la pipeline reale). */
function t447Facts(): PropertyFact[] {
  return mergeFacts(
    factsFromFields({ mq: 176, classeEnergetica: "B", dettagli: { terrazzo: true, box: true } }),
    factsFromDescription([T447_LINE]).facts,
  );
}

describe("splitDescription — riga tecnica interamente strutturata", () => {
  const facts = t447Facts();
  const split = splitDescription(
    ["Ci sono case che salgono di prezzo. E case che salgono di piano.", T447_LINE],
    facts,
  );

  test("la riga telegrafica esce dal testo narrativo", () => {
    assert.deepEqual(split.narrativeParagraphs, [
      "Ci sono case che salgono di prezzo. E case che salgono di piano.",
    ]);
    assert.equal(split.structuredFactLines.length, 1);
    assert.equal(split.structuredFactLines[0].line, T447_LINE);
  });

  test("ogni frammento risulta risolto, anche «Classe B» che viene dal campo <ACE>", () => {
    assert.deepEqual(split.structuredFactLines[0].unresolved, []);
    assert.deepEqual(split.structuredFactLines[0].fragments, [
      "Classe B",
      "Doppio terrazzo",
      "Vista Monte Rosa",
      "Due autorimesse",
    ]);
  });
});

describe("splitDescription — il racconto non si tocca", () => {
  test("una frase narrativa resta nel testo anche se produce dati", () => {
    const line =
      "Il soggiorno di circa 30 mq si apre sul grande terrazzo, raggiungibile anche dalla cucina abitabile.";
    const facts = mergeFacts(factsFromDescription([line]).facts);
    const split = splitDescription([line], facts);

    assert.deepEqual(split.narrativeParagraphs, [line]);
    assert.equal(split.structuredFactLines.length, 0);
    assert.equal(split.contentPreservation, 1);
    // …e i dati sono comunque stati estratti.
    assert.ok(facts.some((f) => f.key === "soggiorno" && f.value === "circa 30 m²"));
    assert.ok(facts.some((f) => f.key === "terrazzi"));
    assert.ok(facts.some((f) => f.key === "cucinaAbitabile"));
  });

  test("un frammento irrisolto conserva l'INTERA riga e la segnala", () => {
    const line = "Classe B · Doppio terrazzo · Certificazione acustica di classe 2";
    const facts = mergeFacts(factsFromFields({ classeEnergetica: "B" }), factsFromDescription([line]).facts);
    const split = splitDescription([line], facts);

    assert.deepEqual(split.narrativeParagraphs, [line]);
    assert.equal(split.structuredFactLines.length, 0);
    assert.equal(split.keptFactLines.length, 1);
    assert.deepEqual(split.keptFactLines[0].unresolved, ["Certificazione acustica di classe 2"]);
  });

  test("nessun riassunto e nessuna parafrasi: le righe conservate sono identiche", () => {
    const paragraphs = [
      "Prima riga narrativa che racconta la casa.",
      "Seconda riga, con una subordinata che prosegue il discorso e lo chiude.",
    ];
    const split = splitDescription(paragraphs, []);
    assert.deepEqual(split.narrativeParagraphs, paragraphs);
  });

  test("una riga con meno di due frammenti non è una riga tecnica", () => {
    const split = splitDescription(["Doppio terrazzo"], factsFromDescription(["Doppio terrazzo"]).facts);
    assert.deepEqual(split.narrativeParagraphs, ["Doppio terrazzo"]);
  });

  test("separatori alternativi: pipe, bullet, punto e virgola", () => {
    for (const sep of [" | ", " • ", "; "]) {
      const line = ["Doppio terrazzo", "Vista Monte Rosa", "Due autorimesse"].join(sep);
      const facts = mergeFacts(factsFromDescription([line]).facts);
      const split = splitDescription([line], facts);
      assert.equal(split.structuredFactLines.length, 1, sep);
    }
  });

  test("descrizione vuota: nessun errore e preservazione piena", () => {
    const split = splitDescription([], []);
    assert.deepEqual(split.narrativeParagraphs, []);
    assert.equal(split.contentPreservation, 1);
  });
});

// ── Snapshot prima/dopo su 20 descrizioni reali sanitizzate ─────────────────

interface SnapshotEntry {
  codice: string;
  paragrafiPrima: number;
  narrativa: string[];
  righeTecnicheRimosse: string[];
  righeTecnicheConservate: { line: string; unresolved: string[] }[];
  preservazione: number;
  fatti: string[];
}

function buildSnapshot(): SnapshotEntry[] {
  const fixtures = JSON.parse(readFileSync(FIXTURES_PATH, "utf8")) as RealSmartListingRaw[];
  return fixtures.map((raw) => {
    const n = normalizeRealSmartListing(raw);
    return {
      codice: n.id,
      paragrafiPrima: n.descriptionParagraphs.length + n.structuredFactLines.length,
      narrativa: n.descriptionParagraphs,
      righeTecnicheRimosse: n.structuredFactLines,
      righeTecnicheConservate: n.keptFactLines.map((l) => ({ line: l.line, unresolved: l.unresolved })),
      preservazione: Number(n.contentPreservation.toFixed(4)),
      fatti: n.facts.map((f) => `${f.key}${f.value ? `=${f.value}` : ""}`).sort(),
    };
  });
}

describe("snapshot su 20 descrizioni reali (sanitizzate)", () => {
  const current = buildSnapshot();

  test("lo snapshot committato corrisponde all'output attuale", () => {
    // Rigenerazione volontaria: UPDATE_SNAPSHOTS=1 npm test — poi si LEGGE il diff in git.
    if (process.env.UPDATE_SNAPSHOTS === "1") {
      writeFileSync(SNAPSHOT_PATH, `${JSON.stringify(current, null, 2)}\n`);
    }
    const committed = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8")) as SnapshotEntry[];
    assert.deepEqual(current, committed);
  });

  test("le 20 descrizioni sono coperte e nessuna resta vuota", () => {
    assert.equal(current.length, 20);
    for (const entry of current) {
      assert.ok(entry.narrativa.length > 0, entry.codice);
      assert.ok(entry.fatti.length > 0, entry.codice);
    }
  });

  test("preservazione del contenuto: nessuna descrizione perde più del 15%", () => {
    for (const entry of current) {
      assert.ok(
        entry.preservazione >= 0.85,
        `${entry.codice}: preservazione ${entry.preservazione}`,
      );
    }
  });

  test("nessun tag, nessuna entità, nessun paragrafo vuoto nel testo pubblicato", () => {
    for (const entry of current) {
      for (const p of entry.narrativa) {
        assert.ok(p.trim().length > 0, entry.codice);
        assert.ok(!/<br|<[a-z/][^>]*>/i.test(p), `${entry.codice}: "${p.slice(0, 60)}"`);
        assert.ok(!/&(amp|lt|gt|nbsp|quot);/i.test(p), entry.codice);
      }
    }
  });

  test("le fixture non contengono dati sensibili non necessari", () => {
    const source = readFileSync(FIXTURES_PATH, "utf8");
    assert.ok(!/[\w.+-]+@(?!esempio\.it)[\w-]+\.[\w.]+/.test(source), "email reale nella fixture");
    assert.ok(!/https?:\/\/(?!esempio\.it)/i.test(source), "URL reale nella fixture");
    assert.ok(
      !/\b(?:Via|Viale|Piazza|Corso)\s+(?!Esempio)[A-ZÀ-Þ]/.test(source),
      "indirizzo reale nella fixture",
    );
  });

  test("ogni riga rimossa dal testo è interamente risolta", () => {
    for (const entry of current) {
      for (const line of entry.righeTecnicheRimosse) {
        assert.ok(line.trim().length > 0, entry.codice);
      }
      for (const kept of entry.righeTecnicheConservate) {
        assert.ok(kept.unresolved.length > 0, `${entry.codice}: riga conservata senza motivo`);
        assert.ok(entry.narrativa.includes(kept.line), `${entry.codice}: riga conservata ma sparita`);
      }
    }
  });
});
