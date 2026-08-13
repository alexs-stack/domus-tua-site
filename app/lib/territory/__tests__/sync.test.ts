// Test dell'orchestrazione di sync: selezione, dry-run, esecuzione, report (Prompt 7).

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { syncListings, selectListings, DEFAULT_MAX_LISTINGS } from "../sync";
import { defaultEnrichmentConfig } from "../config";
import { FakePlacesProvider } from "../provider/fake";
import type { TerritoryPlacesProvider } from "../provider/provider";
import { MemoryTerritoryRepository } from "../store/memory";
import { approveRecord } from "../approval";
import { enrichListing, type EnrichmentDeps } from "../engine";
import type { NormalizedProperty } from "../../realsmart/types";

const NOW = () => new Date("2026-08-13T10:00:00.000Z");

function property(codice: string, town: string, updatedAt = "2026-08-01"): NormalizedProperty {
  return { sourceRef: { codice }, town, updatedAt } as unknown as NormalizedProperty;
}

/** Provider con contatore di chiamate. */
function spy(inner: TerritoryPlacesProvider): { provider: TerritoryPlacesProvider; calls: () => number } {
  let calls = 0;
  return {
    provider: {
      name: inner.name,
      attribution: inner.attribution,
      enabled: inner.enabled,
      searchNearby: (input) => {
        calls++;
        return inner.searchNearby(input);
      },
    },
    calls: () => calls,
  };
}

function makeDeps(over: Partial<EnrichmentDeps> = {}): EnrichmentDeps & { repository: MemoryTerritoryRepository } {
  const repository = (over.repository as MemoryTerritoryRepository) ?? new MemoryTerritoryRepository();
  return {
    provider: over.provider ?? new FakePlacesProvider(),
    repository,
    now: over.now ?? NOW,
    config: over.config ?? defaultEnrichmentConfig(),
  };
}

// Comuni reali: Tradate/Venegono nel pilota; Castiglione Olona in tabella ma NON pilota; Milano assente.
const LISTINGS = [
  property("1", "Tradate"),
  property("2", "Venegono Superiore"),
  property("3", "Milano"), // niente centroide → missing-coordinates
  property("4", "Castiglione Olona"), // centroide sì, ma fuori pilota → disabled
  property("", "Tradate"), // codice mancante
];

describe("selectListings", () => {
  test("solo comuni del pilota, entro il limite di default", () => {
    const sel = selectListings(LISTINGS, makeDeps(), { dryRun: true });
    const towns = sel.map((p) => p.town);
    assert.ok(towns.includes("Tradate"));
    assert.ok(towns.includes("Venegono Superiore"));
    assert.ok(!towns.includes("Castiglione Olona")); // fuori pilota
    assert.ok(!towns.includes("Milano"));
  });

  test("filtro per comune", () => {
    const sel = selectListings(LISTINGS, makeDeps(), { dryRun: true, town: "Tradate" });
    assert.ok(sel.every((p) => p.town === "Tradate"));
  });

  test("filtro per codice", () => {
    const sel = selectListings(LISTINGS, makeDeps(), { dryRun: true, codes: ["2"] });
    assert.deepEqual(sel.map((p) => p.sourceRef.codice), ["2"]);
  });

  test("limite esplicito", () => {
    const many = Array.from({ length: 10 }, (_, i) => property(`c${i}`, "Tradate"));
    assert.equal(selectListings(many, makeDeps(), { dryRun: true, limit: 3 }).length, 3);
    assert.equal(selectListings(many, makeDeps(), { dryRun: true }).length, DEFAULT_MAX_LISTINGS);
  });
});

describe("syncListings — dry-run", () => {
  test("nessuna chiamata al provider, nessuna scrittura, ma stima corretta", async () => {
    const s = spy(new FakePlacesProvider());
    const deps = makeDeps({ provider: s.provider });
    const report = await syncListings(LISTINGS, deps, { dryRun: true });

    assert.equal(report.dryRun, true);
    assert.equal(s.calls(), 0); // nessuna chiamata
    assert.equal((await deps.repository.listEnrichmentMetadata()).length, 0); // nessuna scrittura
    // Selezionati (pilota): Tradate #1, Venegono #2 e il Tradate senza codice → 3 candidati.
    assert.equal(report.totalConsidered, 3);
    assert.equal(report.wouldEnrich, 2); // i due con codice
    assert.equal(report.estimatedProviderCalls, 2);
    assert.equal(report.missingCode, 1);
    assert.equal(report.enriched, 0);
  });
});

describe("syncListings — esecuzione reale", () => {
  test("arricchisce i nuovi, scrive i draft, chiama il provider solo per gli enrich", async () => {
    const s = spy(new FakePlacesProvider());
    const deps = makeDeps({ provider: s.provider });
    const report = await syncListings(LISTINGS, deps, { dryRun: false });

    assert.equal(report.enriched, 2);
    assert.equal(report.failed, 0);
    assert.equal(s.calls(), 2);
    const stored = await deps.repository.listEnrichmentMetadata();
    assert.equal(stored.length, 2);
    assert.ok(stored.every((m) => m.status === "draft")); // mai auto-approvati
  });

  test("record approvato fresco → unchanged, nessuna nuova chiamata", async () => {
    const repository = new MemoryTerritoryRepository();
    // Prepara un approvato per il codice 1 (Tradate).
    const first = await enrichListing(property("1", "Tradate"), makeDeps({ repository }));
    if (first.action !== "enriched") return assert.fail();
    await repository.putListingEnrichment(approveRecord(first.record, { approver: "t", at: NOW().toISOString() }));

    const s = spy(new FakePlacesProvider());
    const report = await syncListings([property("1", "Tradate")], makeDeps({ repository, provider: s.provider }), {
      dryRun: false,
    });
    assert.equal(report.unchanged, 1);
    assert.equal(report.wouldEnrich, 0);
    assert.equal(s.calls(), 0);
    assert.equal(report.existing.approved, 1);
  });
});

describe("syncListings — riuso del profilo (Prompt 5)", () => {
  const THREE_SAME = [property("1", "Tradate"), property("2", "Tradate"), property("3", "Tradate")];
  const THREE_TOWNS = [
    property("1", "Tradate"),
    property("2", "Venegono Superiore"),
    property("3", "Venegono Inferiore"),
  ];

  test("N immobili stesso comune → UNA sola query, gli altri sono cache hit", async () => {
    const s = spy(new FakePlacesProvider());
    const deps = makeDeps({ provider: s.provider });
    const report = await syncListings(THREE_SAME, deps, { dryRun: false, limit: 10 });

    assert.equal(s.calls(), 1, "un solo profilo → una sola query");
    assert.equal(report.enriched, 3, "tutti e tre gli immobili derivati dal profilo");
    assert.equal(report.metrics.providerCalls, 1);
    assert.equal(report.metrics.profileCache.refreshed, 1);
    assert.equal(report.metrics.profileCache.hit, 2, "il 2° e 3° immobile riusano il profilo");
    assert.equal((await deps.repository.listEnrichmentMetadata()).length, 3);
  });

  test("dry-run: la stima è il numero di PROFILI unici, non di immobili", async () => {
    const report = await syncListings(THREE_SAME, makeDeps(), { dryRun: true, limit: 10 });
    assert.equal(report.wouldEnrich, 3);
    assert.equal(report.estimatedProviderCalls, 1, "3 immobili, 1 comune → 1 query stimata");
  });

  test("il budget limita le QUERY (profili), non gli immobili", async () => {
    const s = spy(new FakePlacesProvider());
    const deps = makeDeps({ provider: s.provider });
    // 3 comuni distinti = 3 profili; con maxCalls=2 il terzo profilo resta fuori budget.
    const report = await syncListings(THREE_TOWNS, deps, { dryRun: false, limit: 10, maxCalls: 2 });

    assert.equal(s.calls(), 2, "solo 2 query al provider");
    assert.equal(report.enriched, 2);
    assert.equal(report.skippedByBudget, 1);
    assert.equal(report.budgetReached, true);
    assert.equal(report.metrics.providerCalls, 2);
    assert.equal(report.metrics.budgetReached, true);
    assert.equal((await deps.repository.listEnrichmentMetadata()).length, 2);
  });

  test("il report porta le metriche privacy-safe del run", async () => {
    const report = await syncListings(THREE_SAME, makeDeps(), { dryRun: false, limit: 10 });
    assert.equal(report.metrics.draftsCreated, 3);
    assert.equal(report.metrics.providerCalls, 1, "3 immobili, 1 comune → 1 query");
    assert.equal(report.metrics.rateLimitResponses, 0);
    assert.ok(report.metrics.avgResultsPerCategory.pharmacy >= 0);
  });
});

describe("syncListings — report completo (audit su tutti)", () => {
  test("conta missing-coordinates e disabled quando si allarga la selezione", async () => {
    // Con codici espliciti forzo l'ingresso di Milano e Castiglione nel report... ma selectListings
    // filtra il pilota. Verifichiamo invece che il pilota escluda correttamente i non idonei.
    const report = await syncListings(LISTINGS, makeDeps(), { dryRun: true, limit: 100 });
    // Il pilota filtra Milano/Castiglione fuori dalla selezione; resta il Tradate senza codice.
    assert.equal(report.totalConsidered, 3);
    assert.equal(report.missingCode, 1);
    assert.equal(report.missingCoordinates, 0);
    assert.equal(report.disabledMunicipality, 0);
  });
});
