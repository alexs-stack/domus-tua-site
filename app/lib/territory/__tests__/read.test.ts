// Test della lettura pubblica: risoluzione approvato/stale/preservato + gating del flag (Prompt 8).

import { test, describe, afterEach } from "node:test";
import assert from "node:assert/strict";

import { resolvePublicTerritory, getPublicTerritory, getAssistantTerritory } from "../read";
import { MemoryTerritoryRepository } from "../store/memory";
import { TERRITORY_SCHEMA_VERSION } from "../constants";
import type { ListingTerritoryEnrichment, PublicListingTerritory, TerritoryPoi } from "../types";

const NOW = new Date("2026-08-13T10:00:00.000Z");
const FRESH = "2026-08-10T10:00:00.000Z";
const OPTS = { now: NOW, freshnessDays: 180, maxPerCategory: 2 };

function poi(state: "approved" | "draft"): TerritoryPoi {
  return {
    providerId: "node/1",
    category: "pharmacy",
    name: "Farmacia",
    distanceMeters: 200,
    distanceMethod: "straight-line",
    source: { provider: "osm-overpass", retrievedAt: FRESH, attribution: "© OpenStreetMap contributors" },
    approval: { state },
  };
}

const PUBLIC_SNAPSHOT: PublicListingTerritory = {
  realSmartCode: "1043",
  municipality: "tradate",
  method: "straight-line",
  retrievedAt: FRESH,
  pois: [
    { category: "pharmacy", name: "Farmacia", distanceMeters: 200, distanceMethod: "straight-line", provider: "osm-overpass", attribution: "© OpenStreetMap contributors" },
  ],
};

function record(over: Partial<ListingTerritoryEnrichment>): ListingTerritoryEnrichment {
  return {
    schemaVersion: TERRITORY_SCHEMA_VERSION,
    realSmartCode: "1043",
    municipality: "tradate",
    coordSource: "municipality-centroid",
    origin: { lat: 45.708, lng: 8.906 },
    fingerprint: { municipality: "tradate", coordKey: "45.708,8.906", ultimaModifica: "2026-08-01", schemaVersion: TERRITORY_SCHEMA_VERSION, hash: "x" },
    status: "draft",
    pois: [poi("draft")],
    retrievedAt: FRESH,
    updatedAt: FRESH,
    ...over,
  };
}

describe("resolvePublicTerritory", () => {
  test("approvato e fresco → proiezione pubblica", () => {
    const out = resolvePublicTerritory(record({ status: "approved", pois: [poi("approved")] }), OPTS);
    assert.ok(out);
    assert.equal(out.pois.length, 1);
  });

  test("stale (nessun approvato precedente) → null", () => {
    const out = resolvePublicTerritory(
      record({ status: "approved", pois: [poi("approved")], retrievedAt: "2024-01-01T00:00:00.000Z" }),
      OPTS,
    );
    assert.equal(out, null);
  });

  test("draft con ultimo approvato fresco → mostra l'ultimo approvato", () => {
    const out = resolvePublicTerritory(record({ status: "draft", lastApprovedPublic: PUBLIC_SNAPSHOT }), OPTS);
    assert.deepEqual(out, PUBLIC_SNAPSHOT);
  });

  test("draft con ultimo approvato STALE → null", () => {
    const stalePublic = { ...PUBLIC_SNAPSHOT, retrievedAt: "2024-01-01T00:00:00.000Z" };
    const out = resolvePublicTerritory(record({ status: "draft", lastApprovedPublic: stalePublic }), OPTS);
    assert.equal(out, null);
  });

  test("draft senza approvato precedente → null", () => {
    assert.equal(resolvePublicTerritory(record({ status: "draft" }), OPTS), null);
  });
});

describe("getPublicTerritory — flag e fail-safe", () => {
  const KEY = "NEXT_PUBLIC_TERRITORY_SECTION_ENABLED";
  const saved = process.env[KEY];
  afterEach(() => {
    if (saved === undefined) delete process.env[KEY];
    else process.env[KEY] = saved;
  });

  test("flag spento → null anche con dato approvato", async () => {
    delete process.env[KEY];
    const repo = new MemoryTerritoryRepository();
    await repo.putListingEnrichment(record({ status: "approved", pois: [poi("approved")] }));
    assert.equal(await getPublicTerritory("1043", repo), null);
  });

  test("flag acceso + approvato → vista pubblica", async () => {
    process.env[KEY] = "true";
    const repo = new MemoryTerritoryRepository();
    await repo.putListingEnrichment(record({ status: "approved", pois: [poi("approved")] }));
    const out = await getPublicTerritory("1043", repo);
    assert.ok(out);
    assert.equal(out.realSmartCode, "1043");
  });

  test("codice assente → null", async () => {
    process.env[KEY] = "true";
    assert.equal(await getPublicTerritory(undefined), null);
  });

  test("store che lancia → null (la pagina non si rompe)", async () => {
    process.env[KEY] = "true";
    const throwing = {
      getListingEnrichment: async () => {
        throw new Error("store non disponibile");
      },
    } as unknown as import("../store/repository").TerritoryRepository;
    assert.equal(await getPublicTerritory("1043", throwing), null);
  });
});

describe("getAssistantTerritory — flag dedicato", () => {
  const KEY = "TERRITORY_ASSISTANT_ENABLED";
  const saved = process.env[KEY];
  afterEach(() => {
    if (saved === undefined) delete process.env[KEY];
    else process.env[KEY] = saved;
  });

  test("flag assistente spento → null anche con dato approvato", async () => {
    delete process.env[KEY];
    const repo = new MemoryTerritoryRepository();
    await repo.putListingEnrichment(record({ status: "approved", pois: [poi("approved")] }));
    assert.equal(await getAssistantTerritory("1043", repo), null);
  });

  test("flag assistente acceso + approvato → payload assistente", async () => {
    process.env[KEY] = "true";
    const repo = new MemoryTerritoryRepository();
    await repo.putListingEnrichment(record({ status: "approved", pois: [poi("approved")] }));
    const out = await getAssistantTerritory("1043", repo);
    assert.ok(out);
    assert.equal(out.metodo, "distanza indicativa in linea d'aria");
    assert.ok(out.categorie.length > 0);
  });

  test("flag acceso ma dato stale → null", async () => {
    process.env[KEY] = "true";
    const repo = new MemoryTerritoryRepository();
    await repo.putListingEnrichment(
      record({ status: "approved", pois: [poi("approved")], retrievedAt: "2024-01-01T00:00:00.000Z" }),
    );
    assert.equal(await getAssistantTerritory("1043", repo), null);
  });
});
