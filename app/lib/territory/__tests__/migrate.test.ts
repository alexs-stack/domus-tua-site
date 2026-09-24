// Migrazione di schema v1 → v2 dei record territoriali.
//
// Regole verificate: coordSource → gerarchia di precisione, aggiunta di accuratezza/etichetta,
// originBasis nella vista pubblica incorporata, e — cruciale — lo status NON cambia (un draft NON
// diventa approvato per una migrazione).

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  migrateListingEnrichmentRaw,
  parseListingEnrichmentMigrated,
  parseMunicipalityProfileMigrated,
} from "../migrate";
import { TERRITORY_SCHEMA_VERSION } from "../constants";

const FP = {
  municipality: "tradate",
  coordKey: "45.708,8.906",
  ultimaModifica: "2026-08-01T00:00:00.000Z",
  schemaVersion: 1,
  hash: "abc123",
};

/** Record v1 come sarebbe stato scritto dallo schema precedente (coordSource, niente precision). */
function v1Record(over: Record<string, unknown> = {}) {
  return {
    schemaVersion: 1,
    realSmartCode: "1043",
    municipality: "venegono-superiore",
    origin: { lat: 45.75, lng: 8.9 },
    coordSource: "municipality-centroid",
    fingerprint: { ...FP, municipality: "venegono-superiore" },
    status: "draft",
    pois: [],
    retrievedAt: "2026-08-13T10:00:00.000Z",
    updatedAt: "2026-08-13T10:00:00.000Z",
    ...over,
  };
}

describe("v1 → v2: campi origine", () => {
  test("municipality-centroid → originPrecision + accuratezza + etichetta dal comune", () => {
    const raw = migrateListingEnrichmentRaw(v1Record()) as Record<string, unknown>;
    assert.equal(raw.schemaVersion, TERRITORY_SCHEMA_VERSION);
    assert.equal(raw.originPrecision, "municipality-centroid");
    assert.equal(raw.originAccuracyMeters, 2000);
    assert.equal(raw.originLabel, "Venegono Superiore");
    assert.ok(!("coordSource" in raw), "il vecchio coordSource è rimosso");
    const parsed = parseListingEnrichmentMigrated(v1Record());
    assert.equal(parsed.success, true, parsed.success ? "" : JSON.stringify(parsed.error?.issues));
  });

  test("lo status è PRESERVATO: un draft resta draft (mai auto-approvato)", () => {
    const draft = parseListingEnrichmentMigrated(v1Record({ status: "draft" }));
    assert.ok(draft.success && draft.data.status === "draft");
    const approved = parseListingEnrichmentMigrated(
      v1Record({
        status: "approved",
        approval: { approvedBy: "Raffaela", approvedAt: "2026-08-12T09:00:00.000Z" },
      }),
    );
    assert.ok(approved.success && approved.data.status === "approved");
  });

  test("la vista pubblica incorporata riceve originBasis (senza coordinate)", () => {
    const lastApprovedPublic = {
      realSmartCode: "1043",
      municipality: "venegono-superiore",
      method: "straight-line",
      retrievedAt: "2026-08-13T10:00:00.000Z",
      pois: [],
    };
    const parsed = parseListingEnrichmentMigrated(
      v1Record({
        status: "approved",
        approval: { approvedBy: "R", approvedAt: "2026-08-12T09:00:00.000Z" },
        lastApprovedPublic,
      }),
    );
    assert.ok(parsed.success, parsed.success ? "" : JSON.stringify(parsed.error?.issues));
    assert.deepEqual(parsed.data.lastApprovedPublic?.originBasis, {
      precision: "municipality-centroid",
      label: "Venegono Superiore",
    });
  });

  test("idempotente: un record già v2 non viene toccato", () => {
    const v2 = migrateListingEnrichmentRaw(v1Record()) as Record<string, unknown>;
    const again = migrateListingEnrichmentRaw(v2);
    assert.deepEqual(again, v2);
  });

  test("il profilo comunale migra allo stesso modo", () => {
    const raw = {
      schemaVersion: 1,
      municipality: "tradate",
      origin: { lat: 45.708, lng: 8.906 },
      coordSource: "municipality-centroid",
      fingerprint: FP,
      status: "draft",
      pois: [],
      retrievedAt: "2026-08-13T10:00:00.000Z",
      updatedAt: "2026-08-13T10:00:00.000Z",
    };
    const parsed = parseMunicipalityProfileMigrated(raw);
    assert.ok(parsed.success && parsed.data.originPrecision === "municipality-centroid");
  });
});

describe("caso limite: vecchio 'property' senza autorizzazione", () => {
  test("migra a property-coordinate ma, senza autorizzazione, viene scartato in lettura (fail-safe)", () => {
    const parsed = parseListingEnrichmentMigrated(v1Record({ coordSource: "property" }));
    // Nessuna autorizzazione esplicita ⇒ un'origine a livello di immobile non è pubblicabile.
    assert.equal(parsed.success, false);
  });
});
