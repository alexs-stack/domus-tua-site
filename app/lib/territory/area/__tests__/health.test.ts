// Stato di salute, allarmi e sicurezza dei log.
//
// La modalità di guasto che questo modulo esiste per prendere: la pipeline non si rompe, SMETTE
// DI PRODURRE. Il sito continua a funzionare, le pagine mostrano l'ultimo dato approvato, e
// l'unica differenza è che quel dato invecchia. Nessun errore, nessun 500, nessuno che se ne
// accorga finché un cliente non chiede perché la stazione citata è chiusa da un anno.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  collectAreaHealth,
  evaluateAreaAlerts,
  findLogSafetyViolations,
  isLogSafe,
  assertLogSafe,
  type AreaHealthSnapshot,
} from "../health";
import { InMemoryAreaRepository } from "../store/memory";
import { AREA_SCHEMA_VERSION, AREA_PROMPT_VERSION } from "../types";
import type { AreaFact, AreaNarrative, AreaProfile } from "../types";

const AREA_KEY = "it|lombardia|va|tradate|";
const NOW = new Date("2026-08-20T10:00:00.000Z");

function profile(over: Partial<AreaProfile> = {}): AreaProfile {
  return {
    areaKey: AREA_KEY,
    label: "Tradate",
    municipalityAreaKey: AREA_KEY,
    scope: "municipality",
    status: "draft",
    schemaVersion: AREA_SCHEMA_VERSION,
    ...over,
  };
}

function fact(over: Partial<AreaFact> & { id: string }): AreaFact {
  return {
    municipality: "Tradate",
    category: "transport",
    scope: "municipality",
    text: `Fatto ${over.id}.`,
    translations: [],
    source: {
      url: `https://esempio.it/${over.id}`,
      owner: "Comune di Tradate",
      retrievedAt: "2026-08-01T00:00:00.000Z",
    },
    reviewBy: "2027-02-01T00:00:00.000Z",
    status: "draft",
    conflicts: [],
    schemaVersion: AREA_SCHEMA_VERSION,
    ...over,
  };
}

function narrative(over: Partial<AreaNarrative> = {}): AreaNarrative {
  return {
    areaKey: AREA_KEY,
    locale: "it",
    title: "Vivere a Tradate",
    intro: "Testo.",
    sections: [{ category: "transport", heading: "Mobilità", body: "Testo.", factIds: ["af_1"] }],
    claimMap: [{ claim: "Testo.", factIds: ["af_1"] }],
    sourceIdsUsed: ["as_1"],
    factsHash: "h",
    promptVersion: AREA_PROMPT_VERSION,
    generatedAt: "2026-08-19T10:00:00.000Z",
    status: "draft",
    schemaVersion: AREA_SCHEMA_VERSION,
    ...over,
  };
}

async function populated() {
  const repo = new InMemoryAreaRepository();
  await repo.putProfile(profile());
  await repo.putFact(AREA_KEY, fact({ id: "af_1", status: "draft" }));
  await repo.putFact(
    AREA_KEY,
    fact({
      id: "af_2",
      status: "approved",
      approvedBy: "redazione",
      approvedAt: "2026-08-10T00:00:00.000Z",
    }),
  );
  // Scaduto: la data di revisione è passata.
  await repo.putFact(AREA_KEY, fact({ id: "af_3", reviewBy: "2026-01-01T00:00:00.000Z" }));
  await repo.upsertSource({
    sourceId: "as_1",
    areaKey: AREA_KEY,
    url: "https://esempio.it/a",
    canonicalUrl: "https://esempio.it/a",
    owner: "Comune di Tradate",
    sourceType: "municipality",
    retrievedAt: "2026-08-01T00:00:00.000Z",
    reviewBy: "2026-01-01T00:00:00.000Z", // scaduta
    contentHash: "h",
    status: "active",
  });
  await repo.putNarrative(narrative({ qualityScore: 92 }));
  await repo.putPropertyContext({
    realSmartCode: "2001",
    areaKey: AREA_KEY,
    sourceHash: "h",
    publicOriginType: "municipality-centroid",
    publicOriginLabel: "Tradate",
    locationPrecision: "municipality",
    calculatedAt: "2026-08-19T10:00:00.000Z",
    status: "draft",
  });
  await repo.putPropertyContext({
    realSmartCode: "2002",
    areaKey: AREA_KEY,
    sourceHash: "h2",
    publicOriginType: "municipality-centroid",
    publicOriginLabel: "Tradate",
    locationPrecision: "unresolved",
    calculatedAt: "2026-08-19T10:00:00.000Z",
    status: "draft",
  });
  return repo;
}

describe("fotografia dello stato", () => {
  test("conta ciò che è FERMO, non solo ciò che esiste", async () => {
    // «Quanti fatti ci sono» non dice niente. «Quanti sono scaduti» dice se qualcuno sta
    // seguendo il lavoro.
    const snapshot = await collectAreaHealth(await populated(), { now: NOW });
    assert.equal(snapshot.staleFacts, 1);
    assert.equal(snapshot.staleSources, 1);
    assert.equal(snapshot.narrativesAwaitingApproval, 1);
  });

  test("gli stati si contano per categoria", async () => {
    const snapshot = await collectAreaHealth(await populated(), { now: NOW });
    assert.deepEqual(snapshot.profilesByStatus, { draft: 1 });
    assert.equal(snapshot.factsByStatus.draft, 2);
    assert.equal(snapshot.factsByStatus.approved, 1);
    assert.deepEqual(snapshot.narrativesByStatus, { draft: 1 });
  });

  test("copertura: aree toccate, aree davvero pubblicate", async () => {
    // Sono due numeri diversi, e confonderli è il modo in cui si crede di avere copertura.
    const repo = await populated();
    let snapshot = await collectAreaHealth(repo, { now: NOW });
    assert.equal(snapshot.areasCovered, 1);
    assert.equal(snapshot.areasPublished, 0);

    await repo.putNarrative(
      narrative({
        status: "approved",
        approvedBy: "redazione",
        approvedAt: "2026-08-20T09:00:00.000Z",
        qualityScore: 97,
      }),
    );
    snapshot = await collectAreaHealth(repo, { now: NOW });
    assert.equal(snapshot.areasPublished, 1);
  });

  test("immobili senza area risolvibile si contano a parte", async () => {
    const snapshot = await collectAreaHealth(await populated(), { now: NOW });
    assert.equal(snapshot.listingsWithArea, 1);
    assert.equal(snapshot.listingsWithoutArea, 1);
  });

  test("una narrativa in attesa da settimane è BLOCCATA, non solo in attesa", async () => {
    const repo = await populated();
    const snapshot = await collectAreaHealth(repo, { now: NOW, stuckAfterDays: 0 });
    assert.equal(snapshot.narrativesStuck, 1);
  });

  test("punteggio medio di qualità", async () => {
    // È la metrica che dice se il generatore sta PEGGIORANDO: una media che scende nel tempo
    // è il segnale che un cambio di prompt ha rotto qualcosa.
    const snapshot = await collectAreaHealth(await populated(), { now: NOW });
    assert.equal(snapshot.averageQualityScore, 92);
  });

  test("uno store vuoto non produce numeri finti", async () => {
    const snapshot = await collectAreaHealth(new InMemoryAreaRepository(), { now: NOW });
    assert.equal(snapshot.areasCovered, 0);
    assert.equal(snapshot.hoursSinceLastRun, null);
    assert.equal(snapshot.averageQualityScore, null);
    assert.equal(snapshot.lastRunOutcome, null);
  });
});

describe("allarmi", () => {
  const base: AreaHealthSnapshot = {
    at: NOW.toISOString(),
    listingsWithArea: 10,
    listingsRetired: 0,
    listingsWithoutArea: 0,
    areasCovered: 4,
    areasPublished: 3,
    profilesByStatus: {},
    factsByStatus: {},
    narrativesByStatus: {},
    jobsByState: {},
    staleSources: 0,
    staleFacts: 0,
    narrativesAwaitingApproval: 0,
    narrativesStuck: 0,
    deadLetterJobs: 0,
    retryingJobs: 0,
    lastRunAt: "2026-08-20T09:00:00.000Z",
    hoursSinceLastRun: 1,
    lastRunOutcome: "ok",
    providerCalls: 0,
    aiTokens: 0,
    costEur: 0,
    averageQualityScore: 96,
  };

  test("uno stato sano non produce allarmi", () => {
    assert.deepEqual(evaluateAreaAlerts(base), []);
  });

  test("la sincronizzazione ferma è CRITICA", () => {
    // È il guasto che non si vede: nessun errore, solo dati che invecchiano.
    const alerts = evaluateAreaAlerts({ ...base, hoursSinceLastRun: 30 });
    const alert = alerts.find((a) => a.code === "sync-sla-missed");
    assert.ok(alert);
    assert.equal(alert.severity, "critical");
  });

  test("un job in lettera morta basta", () => {
    // Ogni lettera morta è lavoro che non verrà più fatto, e nessuno lo saprebbe.
    const alerts = evaluateAreaAlerts({ ...base, deadLetterJobs: 1 });
    assert.ok(alerts.some((a) => a.code === "dead-letter-jobs" && a.severity === "critical"));
  });

  test("fonti scadute oltre soglia", () => {
    assert.deepEqual(evaluateAreaAlerts({ ...base, staleSources: 3 }, { maxStaleSources: 2 }).map((a) => a.code), [
      "stale-sources",
    ]);
  });

  test("un CALO di copertura si vede solo confrontando", () => {
    // Nessuna soglia assoluta lo prenderebbe: quattro aree è un buon numero, quattro dopo che
    // ieri erano dieci è un guasto.
    const previous = { ...base, areasCovered: 10 };
    const alerts = evaluateAreaAlerts(base, {}, previous);
    assert.ok(alerts.some((a) => a.code === "coverage-drop" && a.severity === "critical"));
    // Senza il confronto, lo stesso stato è pulito.
    assert.deepEqual(evaluateAreaAlerts(base), []);
  });

  test("una copertura in crescita non allarma", () => {
    assert.deepEqual(evaluateAreaAlerts(base, {}, { ...base, areasCovered: 2 }), []);
  });

  test("mai eseguita: avviso, non allarme critico", () => {
    // Un sistema appena installato non è un sistema rotto.
    const alerts = evaluateAreaAlerts({ ...base, hoursSinceLastRun: null, lastRunAt: null });
    assert.deepEqual(alerts.map((a) => [a.code, a.severity]), [["sync-never-ran", "warning"]]);
  });
});

describe("sicurezza dei log", () => {
  test("i campi utili passano", () => {
    // areaKey, comune e codice RealSmart sono GIÀ pubblici (compaiono nelle URL): senza di
    // loro un log non serve a diagnosticare niente.
    assert.equal(
      isLogSafe({
        automationRunId: "run-1",
        areaKey: "it|lombardia|va|tradate|",
        realSmartCode: "2001",
        sourceHash: "abc123",
        errorClass: "SourceUnreachable",
      }),
      true,
    );
  });

  test("le coordinate non passano, in nessuna forma", () => {
    assert.ok(!isLogSafe({ lat: 45.708, lng: 8.906 }));
    assert.ok(!isLogSafe({ posizione: "45.70812, 8.90634" }));
  });

  test("nemmeno annidate in fondo a un oggetto", () => {
    // È il modo realistico in cui una coordinata finisce in un log: non un campo `lat` in cima,
    // ma un oggetto passato per intero a console.error mentre si diagnostica un guasto — cioè
    // quando nessuno sta pensando alla privacy.
    const violations = findLogSafetyViolations({
      runId: "run-1",
      context: { listing: { code: "2001", origin: { lat: 45.708, lng: 8.906 } } },
    });
    assert.ok(violations.length > 0);
    assert.ok(violations.some((v) => v.includes("context.listing.origin")));
  });

  test("indirizzi, telefoni e credenziali non passano", () => {
    assert.ok(!isLogSafe({ nota: "La sede è in Via Piave 14, Tradate." }));
    assert.ok(!isLogSafe({ nota: "chiamare 0331 844898" }));
    assert.ok(!isLogSafe({ serviceRoleKey: "eyJhbGciOi" }));
    assert.ok(!isLogSafe({ config: { apiKey: "abc" } }));
  });

  test("dentro un array si guarda comunque", () => {
    assert.ok(!isLogSafe({ items: [{ code: "2001" }, { lat: 45.708 }] }));
  });

  test("assertLogSafe LANCIA invece di ripulire in silenzio", () => {
    // Ripulire in automatico nasconderebbe che qualcuno ha passato un oggetto con dentro una
    // coordinata, e il prossimo lo rifarebbe. L'eccezione arriva in sviluppo, dove costa niente.
    assert.throws(() => assertLogSafe({ lat: 45.708 }), /riga di log non sicura/);
    const safe = { automationRunId: "run-1", areaKey: "it|||tradate|" };
    assert.equal(assertLogSafe(safe), safe);
  });

  test("i nomi di chi approva restano nell'audit, non nei log operativi", () => {
    // L'audit li conserva per obbligo; un log operativo non ne ha bisogno, e in un log finiscono
    // per essere copiati altrove.
    assert.ok(!isLogSafe({ approvedBy: "redazione" }));
    assert.ok(!isLogSafe({ actor: "mario.rossi" }));
  });
});
