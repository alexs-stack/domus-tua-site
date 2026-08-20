// Audit immutabile + backup/export/import deterministico (Prompt 7).

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { MemoryTerritoryRepository } from "../memory";
import { exportTerritory, serializeBundle, importTerritory } from "../backup";
import type { ListingTerritoryEnrichment, MunicipalityTerritoryProfile } from "../../types";

const FP = {
  municipality: "tradate",
  coordKey: "45.708,8.906",
  ultimaModifica: "",
  schemaVersion: 2,
  hash: "abc12345",
};

function listing(code: string): ListingTerritoryEnrichment {
  return {
    schemaVersion: 2,
    realSmartCode: code,
    municipality: "tradate",
    origin: { lat: 45.708, lng: 8.906 },
    originPrecision: "municipality-centroid",
    originAccuracyMeters: 2000,
    originLabel: "Tradate",
    fingerprint: FP,
    status: "approved",
    pois: [],
    retrievedAt: "2026-08-13T10:00:00.000Z",
    updatedAt: "2026-08-13T10:00:00.000Z",
  };
}

function profile(): MunicipalityTerritoryProfile {
  return {
    schemaVersion: 2,
    municipality: "tradate",
    origin: { lat: 45.708, lng: 8.906 },
    originPrecision: "municipality-centroid",
    originAccuracyMeters: 2000,
    originLabel: "Tradate",
    fingerprint: FP,
    status: "draft",
    pois: [],
    retrievedAt: "2026-08-13T10:00:00.000Z",
    updatedAt: "2026-08-13T10:00:00.000Z",
  };
}

describe("audit immutabile", () => {
  test("append + list (dal più recente); la storia non si modifica", async () => {
    const repo = new MemoryTerritoryRepository();
    const e1 = await repo.appendAuditEvent({ at: "2026-08-13T10:00:00.000Z", action: "approve", actor: "editor", realSmartCode: "1043" });
    await repo.appendAuditEvent({ at: "2026-08-13T10:05:00.000Z", action: "publish", actor: "editor", realSmartCode: "1043" });
    const list = await repo.listAuditEvents();
    assert.equal(list.length, 2);
    assert.equal(list[0].action, "publish", "il più recente per primo");
    // e1 resta identico dopo altri append (append-only, nessuna mutazione).
    const still = (await repo.listAuditEvents({ realSmartCode: "1043" })).find((e) => e.id === e1.id);
    assert.deepEqual(still, e1);
  });

  test("filtro per codice e id auto-assegnato PII-safe", async () => {
    const repo = new MemoryTerritoryRepository();
    await repo.appendAuditEvent({ at: "2026-08-13T10:00:00.000Z", action: "refresh", actor: "cron", realSmartCode: "A" });
    await repo.appendAuditEvent({ at: "2026-08-13T10:00:00.000Z", action: "refresh", actor: "cron", realSmartCode: "B" });
    const a = await repo.listAuditEvents({ realSmartCode: "A" });
    assert.equal(a.length, 1);
    assert.ok(a[0].id.startsWith("evt_"));
  });

  test("un evento con coordinate viene RIFIUTATO dallo schema (nessuna PII)", async () => {
    const repo = new MemoryTerritoryRepository();
    await assert.rejects(() =>
      repo.appendAuditEvent({ at: "2026-08-13T10:00:00.000Z", action: "approve", actor: "e", lat: 45.7 } as never),
    );
  });
});

describe("backup export/import", () => {
  test("export è DETERMINISTICO (due serializzazioni identiche)", async () => {
    const repo = new MemoryTerritoryRepository();
    await repo.putMunicipalityProfile(profile());
    await repo.putListingEnrichment(listing("1043"));
    await repo.putListingEnrichment(listing("1001"));
    await repo.appendAuditEvent({ at: "2026-08-13T10:00:00.000Z", action: "approve", actor: "editor", realSmartCode: "1043" });

    const s1 = serializeBundle(await exportTerritory(repo, "2026-08-13T12:00:00.000Z"));
    const s2 = serializeBundle(await exportTerritory(repo, "2026-08-13T12:00:00.000Z"));
    assert.equal(s1, s2);
    // Chiavi ordinate: 1001 prima di 1043 nel testo serializzato.
    assert.ok(s1.indexOf('"1001"') < s1.indexOf('"1043"'));
  });

  test("round-trip: export → import in un repo fresco → stessi dati", async () => {
    const src = new MemoryTerritoryRepository();
    await src.putMunicipalityProfile(profile());
    await src.putListingEnrichment(listing("1043"));
    await src.appendAuditEvent({ at: "2026-08-13T10:00:00.000Z", action: "approve", actor: "editor", realSmartCode: "1043" });

    const bundle = await exportTerritory(src, "2026-08-13T12:00:00.000Z");
    const dst = new MemoryTerritoryRepository();
    const res = await importTerritory(dst, bundle, { actor: "cli", at: "2026-08-13T13:00:00.000Z" });
    assert.equal(res.listings, 1);
    assert.equal(res.profiles, 1);

    assert.deepEqual(await dst.getListingEnrichment("1043"), await src.getListingEnrichment("1043"));
    assert.deepEqual(await dst.getMunicipalityProfile("tradate"), await src.getMunicipalityProfile("tradate"));
    // L'import lascia una traccia di audit.
    assert.ok((await dst.listAuditEvents()).some((e) => e.action === "import"));
  });
});
