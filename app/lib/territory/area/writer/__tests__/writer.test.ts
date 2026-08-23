// Il generatore di narrative: cosa garantisce a prescindere dal modello che sta dietro.
//
// Sono quattro proprietà, e nessuna dipende dalla qualità del modello: l'input fattuale è solo
// il fact pack, l'output nasce sempre bozza, l'impronta la calcola il sistema, e un output non
// conforme si scarta invece di aggiustarlo.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  generateNarrative,
  deterministicWriter,
  buildWriterUserPrompt,
  type AreaWriter,
} from "../writer";
import { AREA_WRITER_SYSTEM, buildFactPack, buildRepairPrompt } from "../prompts";
import { AREA_SCHEMA_VERSION, AREA_PROMPT_VERSION } from "../../types";
import type { AreaFact } from "../../types";
import { areaFactsHash } from "../../hash";

const AREA_KEY = "it|lombardia|va|tradate|";
const NOW = new Date("2026-08-20T10:00:00.000Z");

function fact(over: Partial<AreaFact> & { id: string; text: string }): AreaFact {
  return {
    municipality: "Tradate",
    category: "transport",
    scope: "municipality",
    translations: [],
    source: {
      url: "https://www.comune.tradate.va.it/a",
      owner: "Comune di Tradate",
      retrievedAt: "2026-08-01T00:00:00.000Z",
    },
    reviewBy: "2027-02-01T00:00:00.000Z",
    status: "approved",
    approvedBy: "redazione",
    approvedAt: "2026-08-05T00:00:00.000Z",
    conflicts: [],
    schemaVersion: AREA_SCHEMA_VERSION,
    ...over,
  };
}

const FACTS: AreaFact[] = [
  fact({ id: "af_1", category: "transport", text: "La stazione di Tradate serve la linea Saronno–Varese." }),
  fact({ id: "af_2", category: "municipal-service", text: "La biblioteca Frera è in centro a Tradate." }),
];

const input = { areaKey: AREA_KEY, label: "Tradate", locale: "it" as const, facts: FACTS };

describe("il prompt porta i fatti e nient'altro", () => {
  test("il fact pack contiene id, categoria, ambito e testo — non gli URL", () => {
    // Gli URL restano fuori di proposito: il modello non deve poter "ricordare" una fonte o
    // citarla a memoria. L'attribuzione la mette la pagina, dai record.
    const pack = buildFactPack(FACTS);
    assert.match(pack, /af_1/);
    assert.match(pack, /transport/);
    assert.doesNotMatch(pack, /comune\.tradate\.va\.it/);
  });

  test("il fact pack non dichiara lo stato di approvazione", () => {
    // Contiene solo fatti già approvati: ripeterlo suggerirebbe che possa esistere l'alternativa.
    assert.doesNotMatch(buildFactPack(FACTS), /approved|status/i);
  });

  test("il prompt utente non porta la versione precedente se non c'è", () => {
    assert.doesNotMatch(buildWriterUserPrompt(input), /VERSIONE PRECEDENTE/);
  });

  test("il system vieta esplicitamente le distanze dell'immobile", () => {
    // In un testo condiviso da più immobili una distanza sarebbe misurata dal posto sbagliato
    // per tutti tranne uno.
    assert.match(AREA_WRITER_SYSTEM, /distanze specifiche della proprietà/i);
    assert.match(AREA_WRITER_SYSTEM, /Ogni frase fattuale deve avere almeno un factId/i);
  });

  test("il prompt di riparazione dice di RIMUOVERE, non di sostituire", () => {
    // Un modello a cui si chiede di correggere tende a sostituire l'affermazione bocciata con
    // un'altra, spesso peggiore perché nata per riempire un buco.
    const repair = buildRepairPrompt({
      factPackJson: "[]",
      rejectedDraftJson: "{}",
      validationErrorsJson: "[]",
    });
    assert.match(repair, /RIMUOVI COMPLETAMENTE/);
    assert.match(repair, /Non aggiungere nuovi fatti/);
  });
});

describe("le garanzie del generatore", () => {
  test("nessun fatto approvato → nessun testo, e non è un errore", () => {
    // Un'area senza evidenza non deve avere una descrizione: deve non avere la sezione.
    return generateNarrative({ ...input, facts: [] }, deterministicWriter, { now: NOW }).then((r) => {
      assert.equal(r.ok, false);
      assert.match(r.ok === false ? r.reason : "", /nessun fatto approvato/);
    });
  });

  test("l'output nasce SEMPRE bozza", async () => {
    // Anche se il modello prova a dichiararsi approvato.
    const liar: AreaWriter = async (i) => ({
      ...((await deterministicWriter(i, { system: "", user: "" })) as object),
      status: "approved",
      approvedBy: "sé stesso",
      approvedAt: NOW.toISOString(),
    });
    const r = await generateNarrative(input, liar, { now: NOW });
    assert.equal(r.ok, true);
    assert.equal(r.ok && r.narrative.status, "draft");
    assert.equal(r.ok && r.narrative.approvedBy, undefined);
  });

  test("l'impronta dei fatti la calcola il sistema, non il modello", async () => {
    // Se la dichiarasse il modello, un testo potrebbe affermare di nascere da fatti che non ha
    // mai visto — falsificando proprio il meccanismo che dovrebbe scoprirlo.
    const liar: AreaWriter = async (i) => ({
      ...((await deterministicWriter(i, { system: "", user: "" })) as object),
      factsHash: "impronta-inventata",
    });
    const r = await generateNarrative(input, liar, { now: NOW });
    assert.equal(r.ok, true);
    assert.equal(
      r.ok && r.narrative.factsHash,
      areaFactsHash(FACTS, { locale: "it", promptVersion: AREA_PROMPT_VERSION }),
    );
  });

  test("output non conforme: si SCARTA, non si aggiusta", async () => {
    const broken: AreaWriter = async () => ({ title: "Solo un titolo" });
    const r = await generateNarrative(input, broken, { now: NOW });
    assert.equal(r.ok, false);
    assert.match(r.ok === false ? r.reason : "", /non conforme/);
  });

  test("il modello che scrive di un'altra area: si scarta", async () => {
    // Se ha sbagliato area potrebbe aver usato i fatti di quell'area: correggere la chiave
    // nasconderebbe il problema invece di risolverlo.
    const wrongArea: AreaWriter = async (i) => ({
      ...((await deterministicWriter(i, { system: "", user: "" })) as object),
      areaKey: "it|||gallarate|",
    });
    const r = await generateNarrative(input, wrongArea, { now: NOW });
    assert.equal(r.ok, false);
    assert.match(r.ok === false ? r.reason : "", /gallarate/);
  });

  test("il modello viene registrato, quando c'è", async () => {
    const r = await generateNarrative(input, deterministicWriter, { now: NOW, modelId: "modello-x" });
    assert.equal(r.ok && r.narrative.modelId, "modello-x");
  });
});

describe("il generatore deterministico", () => {
  test("compone le sezioni nell'ordine canonico, con le etichette italiane", async () => {
    const r = await generateNarrative(input, deterministicWriter, { now: NOW });
    assert.equal(r.ok, true);
    if (!r.ok) return;
    assert.deepEqual(r.narrative.sections.map((s) => s.category), ["transport", "municipal-service"]);
    assert.deepEqual(r.narrative.sections.map((s) => s.heading), ["Trasporti", "Servizi comunali"]);
  });

  test("ogni sezione è agganciata ai suoi fatti", async () => {
    const r = await generateNarrative(input, deterministicWriter, { now: NOW });
    assert.equal(r.ok, true);
    if (!r.ok) return;
    for (const section of r.narrative.sections) {
      assert.ok(section.factIds.length > 0, `sezione "${section.category}" senza fatti`);
    }
  });

  test("il titolo distingue comune e quartiere", async () => {
    const comune = await generateNarrative(input, deterministicWriter, { now: NOW });
    assert.equal(comune.ok && comune.narrative.title, "Vivere a Tradate");

    const quartiere = await generateNarrative(
      { ...input, areaKey: "it|lombardia|va|tradate|abbiate-guazzone", label: "Abbiate Guazzone" },
      deterministicWriter,
      { now: NOW },
    );
    assert.equal(quartiere.ok && quartiere.narrative.title, "Vivere in Abbiate Guazzone");
  });

  test("omette le categorie senza fatti invece di riempirle", async () => {
    // È la regola editoriale che conta di più: una sezione in meno è corretta, una sezione
    // riempita di generico no.
    const r = await generateNarrative(
      { ...input, facts: [FACTS[0]] },
      deterministicWriter,
      { now: NOW },
    );
    assert.equal(r.ok, true);
    if (!r.ok) return;
    assert.deepEqual(r.narrative.sections.map((s) => s.category), ["transport"]);
  });
});
