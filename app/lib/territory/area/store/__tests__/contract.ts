// CONTRACT TEST dello storage d'area: un solo corpo di test, eseguito su ogni adattatore.
//
// Il punto è che le regole verificate qui sono di DOMINIO, non di persistenza. Se vivessero solo
// nell'adattatore in memoria, l'adattatore Supabase potrebbe violarle tutte e i test resterebbero
// verdi — cioè non proverebbero niente sulla produzione. Chi aggiunge un adattatore importa
// `runAreaRepositoryContract` e lo esegue: se passa, si comporta come gli altri.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { AREA_SCHEMA_VERSION, AREA_PROMPT_VERSION } from "../../types";
import type { AreaFact, AreaNarrative, AreaProfile } from "../../types";
import {
  AreaConcurrencyError,
  AreaIntegrityError,
  type AreaRepository,
  type AreaSourceRecord,
  type AreaJobRecord,
} from "../repository";

const AREA_KEY = "it|lombardia|va|tradate|";
const NOW = new Date("2026-08-20T10:00:00.000Z");

export function profileFixture(over: Partial<AreaProfile> = {}): AreaProfile {
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

export function sourceFixture(over: Partial<AreaSourceRecord> = {}): AreaSourceRecord {
  return {
    sourceId: "as_0000000000000001",
    areaKey: AREA_KEY,
    url: "https://www.comune.tradate.va.it/stazione",
    canonicalUrl: "https://www.comune.tradate.va.it/stazione",
    owner: "Comune di Tradate",
    sourceType: "municipality",
    retrievedAt: "2026-08-01T00:00:00.000Z",
    reviewBy: "2027-02-01T00:00:00.000Z",
    contentHash: "abc123",
    status: "active",
    ...over,
  };
}

export function factFixture(over: Partial<AreaFact> = {}): AreaFact {
  return {
    id: "af_0000000000000001",
    municipality: "Tradate",
    category: "transport",
    scope: "municipality",
    text: "La stazione di Tradate è servita da una linea ferroviaria regionale.",
    translations: [],
    source: {
      url: "https://www.comune.tradate.va.it/stazione",
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

export function narrativeFixture(over: Partial<AreaNarrative> = {}): AreaNarrative {
  return {
    areaKey: AREA_KEY,
    locale: "it",
    title: "Vivere a Tradate",
    intro: "Testo introduttivo.",
    sections: [
      { category: "transport", heading: "Mobilità", body: "Testo.", factIds: ["af_0000000000000001"] },
    ],
    claimMap: [{ claim: "La stazione serve una linea regionale.", factIds: ["af_0000000000000001"] }],
    sourceIdsUsed: ["as_0000000000000001"],
    factsHash: "hash-dei-fatti",
    promptVersion: AREA_PROMPT_VERSION,
    generatedAt: "2026-08-20T09:00:00.000Z",
    status: "draft",
    schemaVersion: AREA_SCHEMA_VERSION,
    ...over,
  };
}

export function jobFixture(over: Partial<AreaJobRecord> = {}): AreaJobRecord {
  return {
    idempotencyKey: "research:it|lombardia|va|tradate|:v1",
    jobType: "research-sources",
    targetId: AREA_KEY,
    state: "pending",
    attempts: 0,
    availableAt: "2026-08-20T09:00:00.000Z",
    createdAt: "2026-08-20T09:00:00.000Z",
    ...over,
  };
}

/**
 * Il contratto. `make()` deve restituire uno store VUOTO a ogni chiamata: i casi non devono
 * vedersi fra loro, altrimenti l'ordine di esecuzione diventa parte del risultato.
 */
export function runAreaRepositoryContract(name: string, make: () => AreaRepository): void {
  describe(`contratto storage d'area — ${name}`, () => {
    describe("profili", () => {
      test("scrivere e rileggere", async () => {
        const repo = make();
        await repo.putProfile(profileFixture());
        const read = await repo.getProfile(AREA_KEY);
        assert.equal(read?.label, "Tradate");
        assert.equal(await repo.getProfile("it|||inesistente|"), null);
      });

      test("un profilo APPROVATO senza traccia di chi e quando è rifiutato", async () => {
        // Nessun auto-approve. È la regola che tiene in piedi tutto il resto della catena.
        const repo = make();
        await assert.rejects(
          () => repo.putProfile(profileFixture({ status: "approved" })),
          AreaIntegrityError,
        );
        await repo.putProfile(
          profileFixture({
            status: "approved",
            approvedBy: "redazione",
            approvedAt: "2026-08-20T10:00:00.000Z",
          }),
        );
        assert.equal((await repo.getProfile(AREA_KEY))?.status, "approved");
      });

      test("le frazioni di un comune si trovano dalla chiave di comune", async () => {
        // È la query che permette il riuso dei fatti a scala comunale.
        const repo = make();
        await repo.putProfile(profileFixture());
        await repo.putProfile(
          profileFixture({
            areaKey: "it|lombardia|va|tradate|abbiate-guazzone",
            label: "Abbiate Guazzone",
            scope: "zone",
          }),
        );
        await repo.putProfile(
          profileFixture({ areaKey: "it|||gallarate|", label: "Gallarate", municipalityAreaKey: "it|||gallarate|" }),
        );
        const inTradate = await repo.listProfilesInMunicipality(AREA_KEY);
        assert.deepEqual(inTradate.map((p) => p.label).sort(), ["Abbiate Guazzone", "Tradate"]);
      });

      test("scrittura concorrente: la seconda perde invece di sovrascrivere in silenzio", async () => {
        const repo = make();
        await repo.putProfile(profileFixture());
        await repo.putProfile(profileFixture({ label: "Tradate (agg.)" }), { ifVersion: 1 });
        await assert.rejects(
          () => repo.putProfile(profileFixture({ label: "terzo" }), { ifVersion: 1 }),
          AreaConcurrencyError,
        );
      });
    });

    describe("fonti", () => {
      test("rileggere la stessa fonte non crea una riga nuova", async () => {
        // Senza questo, ogni passaggio del job di ricerca gonfia la tabella di copie della
        // stessa pagina, e il conteggio delle fonti smette di voler dire qualcosa.
        const repo = make();
        await repo.upsertSource(sourceFixture());
        await repo.upsertSource(
          sourceFixture({ sourceId: "as_0000000000000002", contentHash: "def456", status: "changed" }),
        );
        const list = await repo.listSources(AREA_KEY);
        assert.equal(list.length, 1);
        assert.equal(list[0].status, "changed");
      });

      test("fonti di aree diverse non si confondono", async () => {
        const repo = make();
        await repo.upsertSource(sourceFixture());
        await repo.upsertSource(
          sourceFixture({ sourceId: "as_x", areaKey: "it|||gallarate|", canonicalUrl: "https://esempio.it/g" }),
        );
        assert.equal((await repo.listSources(AREA_KEY)).length, 1);
      });
    });

    describe("fatti", () => {
      test("scrivere e rileggere per area e per id", async () => {
        const repo = make();
        await repo.putFact(AREA_KEY, factFixture());
        assert.equal((await repo.getFact("af_0000000000000001"))?.category, "transport");
        assert.equal((await repo.listFacts(AREA_KEY)).length, 1);
      });

      test("stesso testo, stessa fonte, stessa area = UN fatto", async () => {
        // Il duplicato è il modo in cui un fatto già rifiutato rientra dalla finestra con un id
        // nuovo e stato "candidate", come se nessuno l'avesse mai guardato.
        const repo = make();
        await repo.putFact(AREA_KEY, factFixture());
        await assert.rejects(
          () => repo.putFact(AREA_KEY, factFixture({ id: "af_diverso" })),
          AreaIntegrityError,
        );
      });

      test("lo stesso testo da una fonte diversa è ammesso: sono due evidenze", async () => {
        const repo = make();
        await repo.putFact(AREA_KEY, factFixture());
        await repo.putFact(
          AREA_KEY,
          factFixture({
            id: "af_altra_fonte",
            source: {
              url: "https://www.trenord.it/tradate",
              owner: "Trenord",
              retrievedAt: "2026-08-01T00:00:00.000Z",
            },
          }),
        );
        assert.equal((await repo.listFacts(AREA_KEY)).length, 2);
      });

      test("correggere un fatto non lo fa sembrare un duplicato di sé stesso", async () => {
        const repo = make();
        await repo.putFact(AREA_KEY, factFixture());
        await repo.putFact(AREA_KEY, factFixture({ text: "La stazione di Tradate è sulla linea S." }));
        assert.equal((await repo.listFacts(AREA_KEY)).length, 1);
      });

      test("un fatto APPROVATO senza traccia è rifiutato", async () => {
        const repo = make();
        await assert.rejects(
          () => repo.putFact(AREA_KEY, factFixture({ status: "approved" })),
          AreaIntegrityError,
        );
      });

      test("pubblicabili: approvati, freschi, senza conflitti", async () => {
        const repo = make();
        const approved = {
          status: "approved" as const,
          approvedBy: "redazione",
          approvedAt: "2026-08-10T00:00:00.000Z",
        };
        await repo.putFact(AREA_KEY, factFixture({ id: "af_ok", ...approved }));
        await repo.putFact(
          AREA_KEY,
          factFixture({ id: "af_bozza", text: "Testo diverso, ancora bozza." }),
        );
        await repo.putFact(
          AREA_KEY,
          factFixture({
            id: "af_scaduto",
            text: "Testo diverso, fonte scaduta.",
            reviewBy: "2026-01-01T00:00:00.000Z",
            ...approved,
          }),
        );
        await repo.putFact(
          AREA_KEY,
          factFixture({
            id: "af_conflitto",
            text: "Testo diverso, con conflitto aperto.",
            conflicts: [
              {
                source: {
                  url: "https://esempio.it/altra",
                  owner: "Regione Lombardia",
                  retrievedAt: "2026-08-01T00:00:00.000Z",
                },
                note: "la Regione dichiara un orario diverso",
              },
            ],
            ...approved,
          }),
        );

        const publishable = await repo.listPublishableFacts(AREA_KEY, NOW);
        assert.deepEqual(publishable.map((f) => f.id), ["af_ok"]);
      });
    });

    describe("narrative", () => {
      test("scrivere e rileggere per area e lingua", async () => {
        const repo = make();
        await repo.putNarrative(narrativeFixture());
        assert.equal((await repo.getNarrative(AREA_KEY, "it"))?.title, "Vivere a Tradate");
        assert.equal(await repo.getNarrative(AREA_KEY, "en"), null);
      });

      test("una narrativa approvata senza impronta dei fatti è rifiutata", async () => {
        // Senza `factsHash` non si saprebbe MAI se il testo è ancora aderente ai fatti:
        // resterebbe pubblicato all'infinito mentre l'evidenza sotto cambia.
        const repo = make();
        await assert.rejects(
          () =>
            repo.putNarrative(
              narrativeFixture({
                status: "approved",
                approvedBy: "redazione",
                approvedAt: "2026-08-20T10:00:00.000Z",
                factsHash: "",
              }),
            ),
          AreaIntegrityError,
        );
      });

      test("una narrativa superata non si legge più come corrente", async () => {
        const repo = make();
        await repo.putNarrative(narrativeFixture());
        await repo.putNarrative(narrativeFixture({ status: "superseded" }));
        assert.equal(await repo.getNarrative(AREA_KEY, "it"), null);
      });
    });

    describe("job", () => {
      test("la stessa chiave di idempotenza produce UN job", async () => {
        // Due sync concorrenti che scoprono lo stesso immobile cambiato non devono accodare
        // due ricerche identiche: è il doppio del costo per lo stesso risultato.
        const repo = make();
        assert.equal(await repo.enqueueJob(jobFixture()), true);
        assert.equal(await repo.enqueueJob(jobFixture()), false);
        assert.equal((await repo.listJobs()).length, 1);
      });

      test("si prendono solo i job maturi, e prima quelli in attesa da più tempo", async () => {
        const repo = make();
        await repo.enqueueJob(jobFixture({ idempotencyKey: "a", availableAt: "2026-08-20T08:00:00.000Z" }));
        await repo.enqueueJob(jobFixture({ idempotencyKey: "b", availableAt: "2026-08-20T09:00:00.000Z" }));
        // Rimandato dal backoff: NON deve essere preso adesso.
        await repo.enqueueJob(jobFixture({ idempotencyKey: "c", availableAt: "2026-08-20T23:00:00.000Z" }));

        const leased = await repo.leaseJobs({
          holder: "worker-1",
          leaseUntil: "2026-08-20T10:05:00.000Z",
          now: NOW,
          limit: 10,
        });
        assert.deepEqual(leased.map((j) => j.idempotencyKey), ["a", "b"]);
        assert.equal(leased[0].attempts, 1);
        assert.equal(leased[0].lockedBy, "worker-1");
        assert.equal((await repo.listJobs({ state: "pending" })).length, 1);
      });

      test("un job preso non viene ripreso da un altro worker", async () => {
        const repo = make();
        await repo.enqueueJob(jobFixture());
        const first = await repo.leaseJobs({ holder: "w1", leaseUntil: "2026-08-20T10:05:00.000Z", now: NOW, limit: 10 });
        const second = await repo.leaseJobs({ holder: "w2", leaseUntil: "2026-08-20T10:05:00.000Z", now: NOW, limit: 10 });
        assert.equal(first.length, 1);
        assert.equal(second.length, 0);
      });

      test("dopo troppi tentativi un job va in lettera morta, non in ciclo", async () => {
        // Un job che riprova per sempre consuma budget per sempre, e nessuno se ne accorge
        // perché non fallisce mai in modo definitivo.
        const repo = make();
        await repo.enqueueJob(jobFixture());
        for (let i = 0; i < 6; i++) {
          await repo.leaseJobs({ holder: "w", leaseUntil: "2026-08-20T10:05:00.000Z", now: NOW, limit: 1 });
          await repo.completeJob(jobFixture().idempotencyKey, {
            state: "failed",
            error: "fonte irraggiungibile",
            at: NOW.toISOString(),
          });
          const job = await repo.getJob(jobFixture().idempotencyKey);
          if (job?.state === "dead-letter") break;
          // rimette in coda per il giro successivo
          await repo.completeJob(jobFixture().idempotencyKey, { state: "pending", at: NOW.toISOString() });
        }
        assert.equal((await repo.getJob(jobFixture().idempotencyKey))?.state, "dead-letter");
      });
    });

    describe("audit", () => {
      test("gli eventi si aggiungono e si rileggono, più recenti prima", async () => {
        const repo = make();
        await repo.appendReviewEvent({
          areaKey: AREA_KEY,
          subject: "fact",
          subjectId: "af_1",
          action: "generate",
          actor: "job",
          at: "2026-08-20T09:00:00.000Z",
        });
        await repo.appendReviewEvent({
          areaKey: AREA_KEY,
          subject: "fact",
          subjectId: "af_1",
          action: "approve",
          actor: "redazione",
          at: "2026-08-20T10:00:00.000Z",
        });
        const events = await repo.listReviewEvents({ subjectId: "af_1" });
        assert.deepEqual(events.map((e) => e.action), ["approve", "generate"]);
      });

      test("pubblicare senza motivazione non si registra", async () => {
        const repo = make();
        await assert.rejects(
          () =>
            repo.appendReviewEvent({
              areaKey: AREA_KEY,
              subject: "narrative",
              subjectId: "n_1",
              action: "publish",
              actor: "redazione",
            }),
          AreaIntegrityError,
        );
      });

      test("un evento registrato non si modifica", async () => {
        // L'append-only non è una convenzione: un audit riscrivibile non è un audit.
        const repo = make();
        const ev = await repo.appendReviewEvent({
          areaKey: AREA_KEY,
          subject: "fact",
          subjectId: "af_1",
          action: "approve",
          actor: "redazione",
        });
        assert.throws(() => {
          (ev as { actor: string }).actor = "qualcun altro";
        });
        const [stored] = await repo.listReviewEvents({ subjectId: "af_1" });
        assert.equal(stored.actor, "redazione");
      });
    });

    describe("esecuzioni dell'automazione", () => {
      test("si registrano e si rileggono dalla più recente", async () => {
        const repo = make();
        await repo.recordAutomationRun({
          runId: "run-1",
          startedAt: "2026-08-20T08:00:00.000Z",
          discovered: 5,
          changed: 1,
          skipped: 4,
          failed: 0,
          providerCalls: 2,
          aiTokens: 0,
          costEur: 0,
        });
        await repo.recordAutomationRun({
          runId: "run-2",
          startedAt: "2026-08-20T09:00:00.000Z",
          discovered: 5,
          changed: 0,
          skipped: 5,
          failed: 0,
          providerCalls: 0,
          aiTokens: 0,
          costEur: 0,
        });
        const runs = await repo.listAutomationRuns();
        assert.deepEqual(runs.map((r) => r.runId), ["run-2", "run-1"]);
      });
    });
  });
}
