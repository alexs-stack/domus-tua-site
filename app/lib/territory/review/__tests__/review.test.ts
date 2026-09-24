// Test del workspace di review editoriale (Prompt 10): servizio + artefatti.
//
// Copre gli invarianti richiesti: concorrenza ottimistica (un editor con dati vecchi NON sovrascrive),
// audit su OGNI scrittura, nessun auto-publish, coordinate nascoste di default e visibili solo se
// autorizzate, approvazione in blocco solo per stesso profilo e con conferma esplicita, e artefatti
// deterministici e PII-safe.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { MemoryTerritoryRepository } from "../../store/memory";
import { TerritoryConcurrencyError } from "../../store/repository";
import { TERRITORY_SCHEMA_VERSION } from "../../constants";
import { ApprovalError } from "../../approval";
import { TerritoryReviewService } from "../service";
import {
  buildReviewPack,
  renderReviewPackMarkdown,
  serializeReviewPackJson,
} from "../artifacts";
import type { ListingTerritoryEnrichment, TerritoryPoi } from "../../types";

const AT = "2026-08-13T10:00:00.000Z";

function poi(providerId: string, name: string, distanceMeters: number): TerritoryPoi {
  return {
    providerId,
    category: "pharmacy",
    name,
    distanceMeters,
    distanceMethod: "straight-line",
    source: { provider: "fake", retrievedAt: AT, attribution: "© Test" },
    approval: { state: "draft" },
    coord: { lat: 45.71, lng: 8.9 }, // server-only: deve restare nascosta di default
  };
}

function draft(over: Partial<ListingTerritoryEnrichment> = {}): ListingTerritoryEnrichment {
  return {
    schemaVersion: TERRITORY_SCHEMA_VERSION,
    realSmartCode: "1043",
    municipality: "tradate",
    originPrecision: "municipality-centroid",
    originAccuracyMeters: 2000,
    originLabel: "Tradate",
    origin: { lat: 45.708, lng: 8.906 },
    fingerprint: {
      municipality: "tradate",
      coordKey: "45.708,8.906",
      ultimaModifica: "2026-08-01",
      schemaVersion: TERRITORY_SCHEMA_VERSION,
      hash: "deadbeef",
    },
    status: "draft",
    pois: over.pois ?? [poi("a", "Farmacia A", 120), poi("b", "Farmacia B", 300)],
    retrievedAt: AT,
    updatedAt: AT,
    ...over,
  };
}

async function seed(records: ListingTerritoryEnrichment[]): Promise<TerritoryReviewService> {
  const repo = new MemoryTerritoryRepository();
  for (const r of records) await repo.putListingEnrichment(r);
  return new TerritoryReviewService(repo, { now: () => new Date(AT) });
}

describe("TerritoryReviewService — coda e lettura", () => {
  test("listForReview include solo draft/stale/failed, con versione", async () => {
    const svc = await seed([
      draft({ realSmartCode: "1", status: "draft" }),
      draft({ realSmartCode: "2", status: "approved" }),
      draft({ realSmartCode: "3", status: "stale" }),
    ]);
    const rows = await svc.listForReview();
    assert.deepEqual(rows.map((r) => r.realSmartCode).sort(), ["1", "3"]);
    assert.equal(rows[0]?.version, AT);
  });

  test("coordinate NASCOSTE di default, visibili solo se autorizzato", async () => {
    const svc = await seed([draft()]);
    const hidden = await svc.getReviewItem("1043");
    assert.equal(hidden?.originCoord, undefined);
    assert.equal(hidden?.pois.every((p) => p.coord === undefined), true);

    const shown = await svc.getReviewItem("1043", { includeCoordinates: true });
    assert.deepEqual(shown?.originCoord, { lat: 45.708, lng: 8.906 });
    assert.deepEqual(shown?.pois[0]?.coord, { lat: 45.71, lng: 8.9 });
  });
});

describe("TerritoryReviewService — scritture", () => {
  test("approveListing pubblica ESPLICITAMENTE e registra audit", async () => {
    const svc = await seed([draft()]);
    const before = await svc.getReviewItem("1043");
    assert.equal(before?.status, "draft"); // niente auto-publish

    const after = await svc.approveListing("1043", before!.version, { actor: "raffaela", at: AT, note: "ok" });
    assert.equal(after.status, "approved");
    assert.equal(after.lastApprovedPublic?.pois.length, 2);

    const audit = await svc.getAudit("1043");
    assert.equal(audit.length, 1);
    assert.equal(audit[0]?.action, "approve");
    assert.equal(audit[0]?.actor, "raffaela");
    assert.equal(audit[0]?.toStatus, "approved");
  });

  test("concorrenza ottimistica: una scrittura con versione VECCHIA fallisce", async () => {
    const svc = await seed([draft()]);
    const v1 = (await svc.getReviewItem("1043"))!.version;
    // prima scrittura ok → la versione avanza
    await svc.approveListing("1043", v1, { actor: "a", at: "2026-08-13T11:00:00.000Z" });
    // seconda scrittura con la versione vecchia → conflitto
    await assert.rejects(
      () => svc.approveListing("1043", v1, { actor: "b", at: "2026-08-13T12:00:00.000Z" }),
      TerritoryConcurrencyError,
    );
    // l'audit del tentativo fallito NON viene registrato (la put fallisce prima)
    const audit = await svc.getAudit("1043");
    assert.equal(audit.length, 1);
  });

  test("addNote traccia senza cambiare stato", async () => {
    const svc = await seed([draft()]);
    const ev = await svc.addNote("1043", { actor: "raffaela", at: AT, note: "verificare farmacia B" });
    assert.equal(ev.action, "note");
    assert.equal((await svc.getReviewItem("1043"))?.status, "draft");
  });
});

describe("TerritoryReviewService — approvazione in blocco", () => {
  test("planBulkApprove esige STESSO profilo (impronta)", async () => {
    const svc = await seed([
      draft({ realSmartCode: "1", fingerprint: { ...draft().fingerprint, hash: "aaa" } }),
      draft({ realSmartCode: "2", fingerprint: { ...draft().fingerprint, hash: "bbb" } }),
    ]);
    await assert.rejects(() => svc.planBulkApprove(["1", "2"]), ApprovalError);
  });

  test("applyBulkApprove richiede conferma esplicita", async () => {
    const svc = await seed([
      draft({ realSmartCode: "1", fingerprint: { ...draft().fingerprint, hash: "same" } }),
      draft({ realSmartCode: "2", fingerprint: { ...draft().fingerprint, hash: "same" } }),
    ]);
    const plan = await svc.planBulkApprove(["1", "2"]);
    await assert.rejects(() => svc.applyBulkApprove(plan, { actor: "x", at: AT }, false), ApprovalError);

    const n = await svc.applyBulkApprove(plan, { actor: "x", at: AT }, true);
    assert.equal(n, 2);
    assert.equal((await svc.getReviewItem("1"))?.status, "approved");
    assert.equal((await svc.getReviewItem("2"))?.status, "approved");
  });
});

describe("Artefatti di review — deterministici e PII-safe", () => {
  test("pack senza coordinate: nessun lat/lng nel Markdown né nel JSON", async () => {
    const svc = await seed([draft()]);
    const pack = await buildReviewPack(svc, { generatedAt: AT });
    assert.equal(pack.includesCoordinates, false);

    const md = renderReviewPackMarkdown(pack);
    const json = serializeReviewPackJson(pack);
    assert.equal(md.includes("45.708"), false);
    assert.equal(md.includes("45.71"), false);
    assert.equal(json.includes("45.708"), false);
    assert.equal(json.includes("originCoord"), false);
    // etichetta d'origine leggibile presente
    assert.equal(md.includes('"Tradate"'), true);
    // istruzioni CLI di approvazione presenti
    assert.equal(md.includes("territory:review -- approve 1043 --by="), true);
  });

  test("serializzazione JSON è deterministica (stabile a parità di input)", async () => {
    const svc = await seed([draft({ realSmartCode: "b" }), draft({ realSmartCode: "a" })]);
    const p1 = serializeReviewPackJson(await buildReviewPack(svc, { generatedAt: AT }));
    const p2 = serializeReviewPackJson(await buildReviewPack(svc, { generatedAt: AT }));
    assert.equal(p1, p2);
    // ordinati per codice
    assert.ok(p1.indexOf('"realSmartCode": "a"') < p1.indexOf('"realSmartCode": "b"'));
  });

  test("pack con coordinate: incluse SOLO quando autorizzato", async () => {
    const svc = await seed([draft()]);
    const pack = await buildReviewPack(svc, { generatedAt: AT, includeCoordinates: true });
    assert.equal(pack.includesCoordinates, true);
    assert.equal(serializeReviewPackJson(pack).includes("45.708"), true);
  });
});
