// Scheduler EQUO, resumabile, idempotente (Prompt 6): fairness, lease, retry non-bloccante, dry-run.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { syncListings } from "../sync";
import { defaultEnrichmentConfig, type EnrichmentConfig } from "../config";
import { FakePlacesProvider } from "../provider/fake";
import { ProviderRateLimitError, type TerritoryPlacesProvider } from "../provider/provider";
import { MemoryTerritoryRepository } from "../store/memory";
import type { EnrichmentDeps } from "../engine";
import type { ResolvedOrigin } from "../origin";
import type { NormalizedProperty } from "../../realsmart/types";

function property(codice: string, town: string): NormalizedProperty {
  return { sourceRef: { codice }, town, updatedAt: "2026-08-01" } as unknown as NormalizedProperty;
}

function spy(inner: TerritoryPlacesProvider): { provider: TerritoryPlacesProvider; calls: () => number } {
  let calls = 0;
  return {
    provider: {
      name: inner.name,
      attribution: inner.attribution,
      enabled: inner.enabled,
      searchNearby: (i) => {
        calls++;
        return inner.searchNearby(i);
      },
    },
    calls: () => calls,
  };
}

/** Origine unica per ogni comune "cN": coordinate deterministiche, sempre risolvibile. */
function uniqueOrigin(p: NormalizedProperty): ResolvedOrigin {
  const n = Number.parseInt((p.town.match(/\d+/)?.[0] ?? "0"), 10);
  return {
    coord: { lat: 45 + n / 1000, lng: 8 + n / 1000 },
    precision: "municipality-centroid",
    accuracyMeters: 2000,
    label: p.town,
    municipality: p.town.toLowerCase().replace(/\s+/g, "-"),
  };
}

function makeDeps(over: Partial<EnrichmentDeps> & { config?: EnrichmentConfig } = {}): EnrichmentDeps & {
  repository: MemoryTerritoryRepository;
} {
  const repository = (over.repository as MemoryTerritoryRepository) ?? new MemoryTerritoryRepository();
  return {
    provider: over.provider ?? new FakePlacesProvider(),
    repository,
    now: over.now ?? (() => new Date("2026-08-13T10:00:00.000Z")),
    config: over.config ?? defaultEnrichmentConfig(),
    resolveOrigin: over.resolveOrigin ?? uniqueOrigin,
  };
}

describe("fairness: nessuna starvation (30 immobili, budget 5)", () => {
  test("tutto il lavoro eleggibile è raggiunto nei run successivi", async () => {
    const repository = new MemoryTerritoryRepository();
    // 30 comuni distinti → 30 profili. Tutti abilitati.
    const towns = Array.from({ length: 30 }, (_, i) => `Comune ${i}`);
    const listings = towns.map((t, i) => property(`c${i}`, t));
    const config = {
      ...defaultEnrichmentConfig(),
      enabledMunicipalities: towns.map((t) => t.toLowerCase().replace(/\s+/g, "-")),
    };

    let runs = 0;
    for (let r = 0; r < 8; r++) {
      const s = spy(new FakePlacesProvider());
      const report = await syncListings(listings, makeDeps({ repository, provider: s.provider, config }), {
        dryRun: false,
        maxCalls: 5,
        executionId: `run-${r}`,
      });
      runs++;
      assert.ok(s.calls() <= 5, `run ${r}: budget rispettato (${s.calls()})`);
      const done = (await repository.listEnrichmentMetadata()).length;
      if (done === 30) break;
    }

    const done = await repository.listEnrichmentMetadata();
    assert.equal(done.length, 30, "tutti i 30 immobili raggiunti");
    assert.equal(runs, 6, "30 profili / 5 per run = esattamente 6 run, senza affamare nessuno");
  });
});

describe("idempotenza: due run simultanei, mai doppio arricchimento", () => {
  test("il lease (o la freschezza del profilo) impedisce una seconda query", async () => {
    const repository = new MemoryTerritoryRepository();
    // Provider LENTO condiviso: i due run sono davvero concorrenti.
    const inner = new FakePlacesProvider();
    let calls = 0;
    const slow: TerritoryPlacesProvider = {
      name: inner.name,
      attribution: inner.attribution,
      enabled: inner.enabled,
      async searchNearby(i) {
        calls++;
        await new Promise((res) => setTimeout(res, 20));
        return inner.searchNearby(i);
      },
    };
    const listings = [property("c1", "Comune 1")];
    const cfg = { ...defaultEnrichmentConfig(), enabledMunicipalities: ["comune-1"] };
    const [a, b] = await Promise.all([
      syncListings(listings, makeDeps({ repository, provider: slow, config: cfg }), { dryRun: false, maxCalls: 5, executionId: "A" }),
      syncListings(listings, makeDeps({ repository, provider: slow, config: cfg }), { dryRun: false, maxCalls: 5, executionId: "B" }),
    ]);
    assert.equal(calls, 1, "una sola query nonostante i due run concorrenti");
    // Uno ha arricchito, l'altro ha saltato (lease) o riusato (hit): mai due arricchimenti reali.
    assert.ok(a.enriched + b.enriched >= 1);
    assert.equal((await repository.listEnrichmentMetadata()).length, 1);
  });
});

describe("retry: i falliti ritentano con backoff, senza bloccare i sani", () => {
  test("un profilo che fallisce va in backoff e NON blocca l'altro comune", async () => {
    const repository = new MemoryTerritoryRepository();
    const config = { ...defaultEnrichmentConfig(), enabledMunicipalities: ["comune-1", "comune-2"] };
    // Provider che FALLISCE solo per Comune 1 (lat ~45.001), ok per Comune 2.
    const inner = new FakePlacesProvider();
    const partial: TerritoryPlacesProvider = {
      name: inner.name,
      attribution: inner.attribution,
      enabled: inner.enabled,
      async searchNearby(i) {
        if (Math.round(i.origin.lat * 1000) === 45001) throw new ProviderRateLimitError("fake");
        return inner.searchNearby(i);
      },
    };
    const listings = [property("c1", "Comune 1"), property("c2", "Comune 2")];
    let clock = new Date("2026-08-13T10:00:00.000Z");
    const deps = makeDeps({ repository, provider: partial, config, now: () => clock });

    // Run 1: Comune 1 fallisce, Comune 2 riesce → il fallimento NON blocca il sano.
    const r1 = await syncListings(listings, deps, { dryRun: false, maxCalls: 5, executionId: "r1", random: () => 0.5 });
    assert.equal(r1.enriched, 1, "Comune 2 arricchito nonostante il fallimento di Comune 1");
    assert.equal(r1.failed, 1);
    const p1 = await repository.getMunicipalityProfile("comune-1");
    assert.equal(p1?.attempts, 1);
    assert.ok(p1?.nextAttemptAt, "backoff programmato");

    // Run 2 SUBITO: Comune 1 è in backoff (retry-pending), non viene ri-interrogato.
    const s2 = spy(partial);
    const r2 = await syncListings(listings, makeDeps({ repository, provider: s2.provider, config, now: () => clock }), {
      dryRun: false,
      maxCalls: 5,
      executionId: "r2",
    });
    assert.equal(r2.retryPending, 1, "Comune 1 in backoff → saltato");
    assert.equal(s2.calls(), 0, "nessuna query mentre il backoff è attivo");

    // Run 3 dopo la scadenza del backoff (clock avanzato di 1 ora): Comune 1 ritentato.
    clock = new Date("2026-08-13T11:30:00.000Z");
    const s3 = spy(new FakePlacesProvider()); // ora il provider funziona
    const r3 = await syncListings(listings, makeDeps({ repository, provider: s3.provider, config, now: () => clock }), {
      dryRun: false,
      maxCalls: 5,
      executionId: "r3",
    });
    assert.ok(s3.calls() >= 1, "scaduto il backoff, Comune 1 viene ritentato");
    assert.equal(r3.enriched >= 1, true);
  });
});

describe("dry-run: zero query, zero scritture, stima accurata", () => {
  test("pianifica soltanto", async () => {
    const repository = new MemoryTerritoryRepository();
    const s = spy(new FakePlacesProvider());
    const config = { ...defaultEnrichmentConfig(), enabledMunicipalities: ["comune-1", "comune-2"] };
    const listings = [property("c1", "Comune 1"), property("c2", "Comune 2"), property("c3", "Comune 1")];
    const report = await syncListings(listings, makeDeps({ repository, provider: s.provider, config }), {
      dryRun: true,
      maxCalls: 5,
    });
    assert.equal(s.calls(), 0, "nessuna query");
    assert.equal((await repository.listEnrichmentMetadata()).length, 0, "nessuna scrittura");
    assert.equal(report.wouldEnrich, 3);
    assert.equal(report.estimatedProviderCalls, 2, "3 immobili, 2 comuni → 2 query stimate");
  });
});
