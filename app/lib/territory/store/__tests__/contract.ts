// Contract test condiviso dello storage: gira IDENTICO su ogni adattatore (memoria, filesystem…).
// Non è un file *.test.ts: è un helper importato dai test veri, così il comportamento non può
// divergere fra implementazioni.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  TerritoryConcurrencyError,
  TerritoryStorageError,
  type TerritoryRepository,
} from "../repository";
import { TERRITORY_SCHEMA_VERSION } from "../../constants";
import type {
  ListingTerritoryEnrichment,
  MunicipalityTerritoryProfile,
  TerritoryPoi,
  EnrichmentStatus,
} from "../../types";

const RETRIEVED = "2026-08-10T10:00:00.000Z";

function poi(name: string, distanceMeters: number, approved: boolean): TerritoryPoi {
  return {
    providerId: `node/${name}`,
    category: "pharmacy",
    name,
    distanceMeters,
    distanceMethod: "straight-line",
    source: { provider: "fake", retrievedAt: RETRIEVED, attribution: "© Test" },
    approval: { state: approved ? "approved" : "draft" },
  };
}

export function makeRecord(
  code: string,
  over: Partial<ListingTerritoryEnrichment> = {},
): ListingTerritoryEnrichment {
  return {
    schemaVersion: TERRITORY_SCHEMA_VERSION,
    realSmartCode: code,
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
      hash: `hash-${code}`,
    },
    status: (over.status ?? "draft") as EnrichmentStatus,
    pois: over.pois ?? [poi("Farmacia A", 120, true), poi("Farmacia B", 300, false)],
    retrievedAt: RETRIEVED,
    updatedAt: over.updatedAt ?? RETRIEVED,
    ...(over.approval ? { approval: over.approval } : {}),
    ...(over.lastApprovedPublic ? { lastApprovedPublic: over.lastApprovedPublic } : {}),
  };
}

function makeProfile(slug: string): MunicipalityTerritoryProfile {
  return {
    schemaVersion: TERRITORY_SCHEMA_VERSION,
    municipality: slug,
    origin: { lat: 45.708, lng: 8.906 },
    originPrecision: "municipality-centroid",
    originAccuracyMeters: 2000,
    originLabel: "Tradate",
    fingerprint: {
      municipality: slug,
      coordKey: "45.708,8.906",
      ultimaModifica: "2026-08-01",
      schemaVersion: TERRITORY_SCHEMA_VERSION,
      hash: `hash-${slug}`,
    },
    status: "draft",
    pois: [poi("Farmacia A", 120, true)],
    retrievedAt: RETRIEVED,
    updatedAt: RETRIEVED,
  };
}

/**
 * Registra la suite di contratto per un adattatore.
 * @param label nome dell'adattatore (per il report dei test).
 * @param makeRepo fabbrica che ritorna un repository pulito e una cleanup opzionale.
 */
export function runRepositoryContract(
  label: string,
  makeRepo: () => Promise<{ repo: TerritoryRepository; cleanup?: () => void }>,
): void {
  describe(`contratto storage — ${label}`, () => {
    async function fresh() {
      return makeRepo();
    }

    test("get di un codice assente → null", async () => {
      const { repo, cleanup } = await fresh();
      try {
        assert.equal(await repo.getListingEnrichment("nope"), null);
        assert.equal(await repo.getMunicipalityProfile("nope"), null);
      } finally {
        cleanup?.();
      }
    });

    test("put + get: roundtrip fedele, con schemaVersion", async () => {
      const { repo, cleanup } = await fresh();
      try {
        const rec = makeRecord("1043");
        await repo.putListingEnrichment(rec);
        const got = await repo.getListingEnrichment("1043");
        assert.deepEqual(got, rec);
        assert.equal(got?.schemaVersion, TERRITORY_SCHEMA_VERSION);
      } finally {
        cleanup?.();
      }
    });

    test("profilo comune: roundtrip", async () => {
      const { repo, cleanup } = await fresh();
      try {
        const p = makeProfile("tradate");
        await repo.putMunicipalityProfile(p);
        assert.deepEqual(await repo.getMunicipalityProfile("tradate"), p);
      } finally {
        cleanup?.();
      }
    });

    test("listEnrichmentMetadata: leggero (niente pois) e ordinato per codice", async () => {
      const { repo, cleanup } = await fresh();
      try {
        await repo.putListingEnrichment(makeRecord("2010"));
        await repo.putListingEnrichment(makeRecord("1043", { status: "approved" }));
        const meta = await repo.listEnrichmentMetadata();
        assert.deepEqual(meta.map((m) => m.realSmartCode), ["1043", "2010"]);
        assert.equal("pois" in meta[0], false);
        assert.equal(meta[0].poiCount, 2);
        assert.equal(meta[0].approvedPoiCount, 1);
        assert.equal(meta[0].status, "approved");
      } finally {
        cleanup?.();
      }
    });

    test("markStale: cambia stato ma conserva i dati", async () => {
      const { repo, cleanup } = await fresh();
      try {
        await repo.putListingEnrichment(makeRecord("1043", { status: "approved" }));
        await repo.markStale("1043");
        const got = await repo.getListingEnrichment("1043");
        assert.equal(got?.status, "stale");
        assert.equal(got?.pois.length, 2);
      } finally {
        cleanup?.();
      }
    });

    test("markStale su codice inesistente → errore", async () => {
      const { repo, cleanup } = await fresh();
      try {
        await assert.rejects(() => repo.markStale("ghost"), TerritoryStorageError);
      } finally {
        cleanup?.();
      }
    });

    test("recordFailure su record APPROVED: resta approved, dati preservati, failure annotata", async () => {
      const { repo, cleanup } = await fresh();
      try {
        const lastApproved = {
          realSmartCode: "1043",
          municipality: "tradate",
          method: "straight-line" as const,
          originBasis: { precision: "municipality-centroid" as const, label: "Tradate" },
          retrievedAt: RETRIEVED,
          pois: [
            {
              category: "pharmacy" as const,
              name: "Farmacia A",
              distanceMeters: 120,
              distanceMethod: "straight-line" as const,
              provider: "fake" as const,
              attribution: "© Test",
            },
          ],
        };
        await repo.putListingEnrichment(
          makeRecord("1043", { status: "approved", lastApprovedPublic: lastApproved }),
        );
        await repo.recordFailure("1043", {
          at: "2026-08-12T09:00:00.000Z",
          kind: "timeout",
          reason: "provider lento",
        });
        const got = await repo.getListingEnrichment("1043");
        assert.equal(got?.status, "approved"); // dati approvati ancora pubblicabili
        assert.equal(got?.failure?.kind, "timeout");
        assert.deepEqual(got?.lastApprovedPublic, lastApproved);
        assert.equal(got?.updatedAt, "2026-08-12T09:00:00.000Z");
      } finally {
        cleanup?.();
      }
    });

    test("recordFailure su record DRAFT: diventa failed", async () => {
      const { repo, cleanup } = await fresh();
      try {
        await repo.putListingEnrichment(makeRecord("1043", { status: "draft" }));
        await repo.recordFailure("1043", {
          at: "2026-08-12T09:00:00.000Z",
          kind: "rate-limit",
          reason: "429",
        });
        assert.equal((await repo.getListingEnrichment("1043"))?.status, "failed");
      } finally {
        cleanup?.();
      }
    });

    test("concorrenza ottimistica: ifUpdatedAt errato → conflitto", async () => {
      const { repo, cleanup } = await fresh();
      try {
        await repo.putListingEnrichment(makeRecord("1043", { updatedAt: RETRIEVED }));
        await assert.rejects(
          () =>
            repo.putListingEnrichment(makeRecord("1043", { updatedAt: "2026-08-11T00:00:00.000Z" }), {
              ifUpdatedAt: "1999-01-01T00:00:00.000Z",
            }),
          TerritoryConcurrencyError,
        );
        // ifUpdatedAt corretto → passa
        await repo.putListingEnrichment(
          makeRecord("1043", { updatedAt: "2026-08-11T00:00:00.000Z" }),
          { ifUpdatedAt: RETRIEVED },
        );
        assert.equal(
          (await repo.getListingEnrichment("1043"))?.updatedAt,
          "2026-08-11T00:00:00.000Z",
        );
      } finally {
        cleanup?.();
      }
    });

    test("record non valido → rifiutato (nessuna scrittura)", async () => {
      const { repo, cleanup } = await fresh();
      try {
        const bad = { ...makeRecord("1043"), status: "published" } as unknown as ListingTerritoryEnrichment;
        await assert.rejects(() => repo.putListingEnrichment(bad), TerritoryStorageError);
        assert.equal(await repo.getListingEnrichment("1043"), null);
      } finally {
        cleanup?.();
      }
    });
  });
}
