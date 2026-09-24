// L'orchestrazione dal feed ai job d'area.
//
// Il test che conta più di tutti è «un cambio di prezzo non rigenera niente». È la differenza
// fra un'automazione sostenibile e una che rifà la descrizione d'area di un comune intero perché
// un appartamento è calato di cinquemila euro.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { diffListings, runAreaAutomation } from "../orchestrate";
import { locationFingerprint, jobIdempotencyKey } from "../fingerprint";
import { InMemoryAreaRepository } from "../../store/memory";
import { resolveAreaIdentity } from "../../identity";
import type { NormalizedProperty } from "../../../../realsmart/types";
import type { PropertyAreaContextRecord } from "../../store/repository";

const NOW = new Date("2026-08-20T10:00:00.000Z");

function listing(over: {
  codice: string;
  comune?: string;
  zona?: string;
  price?: number;
  title?: string;
}): NormalizedProperty {
  const area = resolveAreaIdentity({
    municipality: over.comune ?? "Tradate",
    neighbourhood: over.zona,
  });
  return {
    id: over.codice,
    slug: over.codice,
    title: over.title ?? "Immobile",
    descriptionParagraphs: [],
    structuredFactLines: [],
    keptFactLines: [],
    contentPreservation: 1,
    placeholderQuarantined: false,
    excerpt: "x",
    price: over.price ?? 250000,
    priceLabel: "€ 250.000",
    contract: "vendita",
    type: "Appartamento",
    town: over.comune ?? "Tradate",
    province: "",
    area,
    showAddress: false,
    docVerified: false,
    sqm: 90,
    rooms: 3,
    bedrooms: 2,
    baths: 1,
    features: [],
    facts: [],
    factsReview: [],
    images: [],
    status: "published",
    badges: [],
    publishedAt: "",
    updatedAt: "2026-08-01T00:00:00.000Z",
    sourceRef: { codice: over.codice },
    normalizedBy: "deterministic",
  };
}

function contextOf(l: NormalizedProperty, over: Partial<PropertyAreaContextRecord> = {}): PropertyAreaContextRecord {
  return {
    realSmartCode: l.sourceRef.codice,
    areaKey: l.area.areaKey,
    sourceHash: locationFingerprint({ realSmartCode: l.sourceRef.codice, area: l.area }),
    publicOriginType: "municipality-centroid",
    publicOriginLabel: l.area.municipalityLabel ?? "",
    locationPrecision: l.area.precision,
    calculatedAt: "2026-08-01T00:00:00.000Z",
    status: "draft",
    ...over,
  };
}

describe("l'impronta di collocazione filtra ciò che non riguarda il territorio", () => {
  test("IL TEST CHE CONTA: un cambio di PREZZO non muove l'impronta", () => {
    // Senza questo filtro, ogni ritocco di listino rigenererebbe la descrizione d'area del
    // comune: costo per niente, e una coda di revisione piena di roba identica alla precedente.
    const a = listing({ codice: "2001", price: 250000 });
    const b = listing({ codice: "2001", price: 239000 });
    assert.equal(
      locationFingerprint({ realSmartCode: "2001", area: a.area }),
      locationFingerprint({ realSmartCode: "2001", area: b.area }),
    );
  });

  test("nemmeno un cambio di titolo la muove", () => {
    const a = listing({ codice: "2001", title: "Trilocale" });
    const b = listing({ codice: "2001", title: "Trilocale ristrutturato" });
    assert.equal(
      locationFingerprint({ realSmartCode: "2001", area: a.area }),
      locationFingerprint({ realSmartCode: "2001", area: b.area }),
    );
  });

  test("un cambio di COMUNE la muove", () => {
    const a = listing({ codice: "2001", comune: "Tradate" });
    const b = listing({ codice: "2001", comune: "Gallarate" });
    assert.notEqual(
      locationFingerprint({ realSmartCode: "2001", area: a.area }),
      locationFingerprint({ realSmartCode: "2001", area: b.area }),
    );
  });

  test("un cambio di QUARTIERE la muove", () => {
    const a = listing({ codice: "2001", zona: "Abbiate Guazzone" });
    const b = listing({ codice: "2001", zona: "Ceppine" });
    assert.notEqual(
      locationFingerprint({ realSmartCode: "2001", area: a.area }),
      locationFingerprint({ realSmartCode: "2001", area: b.area }),
    );
  });

  test("immobili diversi nella stessa area hanno impronte diverse", () => {
    const a = listing({ codice: "2001" });
    const b = listing({ codice: "2002" });
    assert.notEqual(
      locationFingerprint({ realSmartCode: "2001", area: a.area }),
      locationFingerprint({ realSmartCode: "2002", area: b.area }),
    );
  });

  test("una coordinata che si muove di pochi metri non conta", () => {
    // Micro-variazioni di geocodifica non devono far ripartire nulla. ~3 decimali ≈ 110 m.
    const l = listing({ codice: "2001" });
    assert.equal(
      locationFingerprint({ realSmartCode: "2001", area: l.area, origin: { lat: 45.70812, lng: 8.90634 } }),
      locationFingerprint({ realSmartCode: "2001", area: l.area, origin: { lat: 45.70819, lng: 8.90641 } }),
    );
  });

  test("una coordinata malformata non fa cadere il calcolo", () => {
    const l = listing({ codice: "2001" });
    assert.equal(
      locationFingerprint({ realSmartCode: "2001", area: l.area, origin: { lat: NaN, lng: 8.9 } }),
      locationFingerprint({ realSmartCode: "2001", area: l.area }),
    );
  });

  test("la chiave di idempotenza contiene l'impronta", () => {
    // È così che due sync concorrenti sullo stesso cambiamento accodano UN job solo.
    const fp = "abc123";
    assert.equal(
      jobIdempotencyKey({ jobType: "research-sources", targetId: "it|||tradate|", fingerprint: fp }),
      jobIdempotencyKey({ jobType: "research-sources", targetId: "it|||tradate|", fingerprint: fp }),
    );
    assert.notEqual(
      jobIdempotencyKey({ jobType: "research-sources", targetId: "it|||tradate|", fingerprint: fp }),
      jobIdempotencyKey({ jobType: "research-sources", targetId: "it|||tradate|", fingerprint: "diverso" }),
    );
  });
});

describe("diff", () => {
  test("nuovo, cambiato, invariato, ritirato", () => {
    const a = listing({ codice: "2001" });
    const b = listing({ codice: "2002", zona: "Ceppine" });
    const nuovo = listing({ codice: "2003" });
    const sparito = listing({ codice: "2004" });

    const known = new Map([
      ["2001", contextOf(a)],
      ["2002", contextOf(listing({ codice: "2002" }))], // prima senza quartiere → cambiato
      ["2004", contextOf(sparito)], // non più nel feed → ritirato
    ]);

    const changes = diffListings({ listings: [a, b, nuovo], known });
    const byCode = Object.fromEntries(changes.map((c) => [c.realSmartCode, c.kind]));
    assert.deepEqual(byCode, {
      "2001": "unchanged",
      "2002": "changed",
      "2003": "added",
      "2004": "retired",
    });
  });

  test("un immobile già marcato ritirato non torna a essere ritirato ogni volta", () => {
    const sparito = listing({ codice: "2004" });
    const known = new Map([["2004", contextOf(sparito, { retired: true })]]);
    assert.deepEqual(diffListings({ listings: [], known }), []);
  });

  test("il diff è puro: si può eseguire senza toccare nulla", () => {
    // È ciò che rende possibile il dry-run — «cosa succederebbe?» senza spendere niente.
    const known = new Map<string, PropertyAreaContextRecord>();
    const before = JSON.stringify([...known]);
    diffListings({ listings: [listing({ codice: "2001" })], known });
    assert.equal(JSON.stringify([...known]), before);
  });
});

describe("orchestrazione", () => {
  const run = (listings: NormalizedProperty[], repo = new InMemoryAreaRepository(), runId = "run-1") =>
    runAreaAutomation({ listings, repo, now: NOW, runId }).then((report) => ({ report, repo }));

  test("un profilo per area, riusato da tutti gli immobili di quell'area", async () => {
    // È l'unica cosa che rende sostenibile il costo su un catalogo di duecento annunci: la
    // ricerca delle fonti si paga una volta per area, non una per immobile.
    const { report, repo } = await run([
      listing({ codice: "2001" }),
      listing({ codice: "2002" }),
      listing({ codice: "2003" }),
    ]);
    assert.equal(report.profilesCreated, 1);
    assert.equal(report.profilesReused, 2);
    assert.equal((await repo.listProfiles()).length, 1);
  });

  test("la ricerca fonti si accoda una volta sola; il contesto immobile per ciascuno", async () => {
    const { report, repo } = await run([listing({ codice: "2001" }), listing({ codice: "2002" })]);
    const jobs = await repo.listJobs();
    assert.equal(jobs.filter((j) => j.jobType === "research-sources").length, 1);
    assert.equal(jobs.filter((j) => j.jobType === "compute-property-context").length, 2);
    assert.equal(report.jobsEnqueued, 3);
  });

  test("rieseguire sullo stesso feed non accoda niente", async () => {
    // L'idempotenza end-to-end: il cron gira ogni trenta minuti e il feed cambia raramente.
    const repo = new InMemoryAreaRepository();
    const listings = [listing({ codice: "2001" }), listing({ codice: "2002" })];
    await run(listings, repo, "run-1");
    const { report } = await run(listings, repo, "run-2");
    assert.equal(report.changed, 0);
    assert.equal(report.skipped, 2);
    assert.equal(report.jobsEnqueued, 0);
  });

  test("un cambio di prezzo non produce lavoro", async () => {
    const repo = new InMemoryAreaRepository();
    await run([listing({ codice: "2001", price: 250000 })], repo, "run-1");
    const jobsBefore = (await repo.listJobs()).length;

    const { report } = await run([listing({ codice: "2001", price: 219000 })], repo, "run-2");
    assert.equal(report.changed, 0);
    assert.equal(report.jobsEnqueued, 0);
    assert.equal((await repo.listJobs()).length, jobsBefore);
  });

  test("un immobile che cambia quartiere invece sì", async () => {
    const repo = new InMemoryAreaRepository();
    await run([listing({ codice: "2001", zona: "Abbiate Guazzone" })], repo, "run-1");
    const { report } = await run([listing({ codice: "2001", zona: "Ceppine" })], repo, "run-2");
    assert.equal(report.changed, 1);
    // Quartiere nuovo = area nuova = profilo nuovo, e la ricerca fonti riparte per quell'area.
    assert.equal(report.profilesCreated, 1);
  });

  test("un immobile sparito si marca ritirato, e l'area resta", async () => {
    // Fatti e narrativa sono conoscenza sul TERRITORIO, non sull'immobile: serviranno al
    // prossimo annuncio nella stessa via.
    const repo = new InMemoryAreaRepository();
    await run([listing({ codice: "2001" })], repo, "run-1");
    const profilesBefore = await repo.listProfiles();

    const { report } = await run([], repo, "run-2");
    assert.equal(report.retired, 1);
    assert.equal((await repo.getPropertyContext("2001"))?.retired, true);
    assert.deepEqual(await repo.listProfiles(), profilesBefore, "il profilo d'area è stato toccato");
  });

  test("un immobile senza comune resta pubblicabile ma non entra nella pipeline", async () => {
    const orfano = listing({ codice: "2001" });
    const { report, repo } = await run([{ ...orfano, area: resolveAreaIdentity({}) }]);
    assert.deepEqual(report.unresolved, ["2001"]);
    assert.equal(report.changed, 0);
    assert.equal((await repo.listProfiles()).length, 0);
    assert.equal((await repo.listJobs()).length, 0);
  });

  test("i profili nascono BOZZA: nessuna area entra nel sito senza revisione", async () => {
    const { repo } = await run([listing({ codice: "2001" })]);
    const [profile] = await repo.listProfiles();
    assert.equal(profile.status, "draft");
    assert.equal(profile.approvedBy, undefined);
  });

  test("l'invalidazione è mirata: la scheda toccata e il profilo del suo comune", async () => {
    // Non "tutto il territorio", che butterebbe la cache di duecento pagine per un immobile.
    const { report } = await run([listing({ codice: "2001" })]);
    assert.deepEqual(report.revalidateTags, [
      "territory:listing:2001",
      "territory:profile:tradate",
    ]);
  });

  test("il tetto di job si dichiara invece di troncare in silenzio", async () => {
    // Difesa contro il caso peggiore: un cambio di versione di prompt che rende "cambiati"
    // tutti gli immobili insieme. Un troncamento taciuto si legge come "abbiamo coperto tutto".
    const many = Array.from({ length: 10 }, (_, i) => listing({ codice: `20${i}`, comune: `Comune${i}` }));
    const report = await runAreaAutomation({
      listings: many,
      repo: new InMemoryAreaRepository(),
      now: NOW,
      runId: "run-1",
      maxJobsPerRun: 4,
    });
    assert.ok(report.jobsEnqueued <= 4);
    assert.ok(report.errors.some((e) => /tetto di 4 job/.test(e)), report.errors.join("; "));
  });

  test("ogni esecuzione lascia un rapporto", async () => {
    const { repo } = await run([listing({ codice: "2001" })]);
    const [run1] = await repo.listAutomationRuns();
    assert.equal(run1.runId, "run-1");
    assert.equal(run1.discovered, 1);
    assert.equal(run1.outcome, "ok");
  });

  test("l'orchestrazione non genera testi e non chiama provider", async () => {
    // Deve poter girare in un cron con un budget di tempo stretto, e non deve poter consumare
    // budget AI da sola: accoda il lavoro, non lo esegue.
    const { repo } = await run([listing({ codice: "2001" })]);
    assert.equal((await repo.listNarratives()).length, 0);
    const [run1] = await repo.listAutomationRuns();
    assert.equal(run1.providerCalls, 0);
    assert.equal(run1.aiTokens, 0);
  });

  test("ogni decisione lascia una traccia di revisione", async () => {
    const { repo } = await run([listing({ codice: "2001" })]);
    const events = await repo.listReviewEvents();
    assert.ok(events.length > 0);
    assert.ok(events.every((e) => e.actor.startsWith("automation:")));
  });
});
