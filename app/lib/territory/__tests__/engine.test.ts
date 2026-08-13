// Matrice di test del motore di arricchimento (Prompt 5).
// Provider fake + repository in memoria + orologio iniettato: tutto deterministico, zero rete.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { enrichListing, type EnrichmentDeps } from "../engine";
import { defaultEnrichmentConfig } from "../config";
import { FakePlacesProvider, type FakePlace } from "../provider/fake";
import { ProviderResponseError, type TerritoryPlacesProvider } from "../provider/provider";
import { MemoryTerritoryRepository } from "../store/memory";
import type { ResolvedOrigin } from "../origin";
import type { NormalizedProperty } from "../../realsmart/types";
import type { ListingTerritoryEnrichment } from "../types";

const NOW = () => new Date("2026-08-13T10:00:00.000Z");
const TRADATE: ResolvedOrigin = {
  coord: { lat: 45.708, lng: 8.906 },
  precision: "municipality-centroid",
  accuracyMeters: 2000,
  label: "Tradate",
  municipality: "tradate",
};

/** Immobile minimo: il motore legge solo codice, comune e updatedAt. */
function property(over: { codice?: string; town?: string; updatedAt?: string } = {}): NormalizedProperty {
  return {
    sourceRef: { codice: over.codice ?? "1043" },
    town: over.town ?? "Tradate",
    updatedAt: over.updatedAt ?? "2026-08-01",
  } as unknown as NormalizedProperty;
}

/** Provider con contatore di chiamate, per verificare i percorsi di skip. */
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
    resolveOrigin: over.resolveOrigin ?? (() => TRADATE),
  };
}

/** Approva un record (status + ogni POI) senza AI, come farebbe l'editor. */
function approve(rec: ListingTerritoryEnrichment): ListingTerritoryEnrichment {
  return {
    ...rec,
    status: "approved",
    pois: rec.pois.map((p) => ({
      ...p,
      approval: { state: "approved", approvedBy: "test", approvedAt: rec.updatedAt },
    })),
  };
}

describe("1) nuovo immobile → bozza salvata", () => {
  test("crea un draft con POI non approvati e distanza in linea d'aria", async () => {
    const deps = makeDeps();
    const out = await enrichListing(property(), deps);
    assert.equal(out.action, "enriched");
    if (out.action !== "enriched") return;
    assert.equal(out.record.status, "draft");
    assert.ok(out.record.pois.length > 0);
    assert.ok(out.record.pois.every((p) => p.approval.state === "draft"));
    assert.ok(out.record.pois.every((p) => p.distanceMethod === "straight-line"));
    assert.ok(out.record.pois.every((p) => p.coord)); // coordinata server-side presente
    assert.equal((await deps.repository.getListingEnrichment("1043"))?.status, "draft");
  });
});

describe("2) immobile invariato (approvato+fresco) → skip senza chiamata", () => {
  test("nessuna chiamata al provider quando impronta invariata e dato approvato fresco", async () => {
    const repository = new MemoryTerritoryRepository();
    const first = await enrichListing(property(), makeDeps({ repository }));
    assert.equal(first.action, "enriched");
    if (first.action !== "enriched") return;
    await repository.putListingEnrichment(approve(first.record));

    const s = spy(new FakePlacesProvider());
    const out = await enrichListing(property(), makeDeps({ repository, provider: s.provider }));
    assert.equal(out.action, "skipped-unchanged");
    assert.equal(s.calls(), 0);
  });
});

describe("3) coordinate cambiate → ri-arricchito, preserva l'approvato", () => {
  test("fingerprint diverso → nuova bozza con lastApprovedPublic conservato", async () => {
    const repository = new MemoryTerritoryRepository();
    const first = await enrichListing(property(), makeDeps({ repository }));
    if (first.action !== "enriched") return assert.fail("primo run non arricchito");
    await repository.putListingEnrichment(approve(first.record));

    // Nuova origine (stesso comune, coordinata diversa) → impronta diversa.
    const moved: ResolvedOrigin = { ...TRADATE, coord: { lat: 45.72, lng: 8.9 } };
    const out = await enrichListing(property(), makeDeps({ repository, resolveOrigin: () => moved }));
    assert.equal(out.action, "enriched");
    if (out.action !== "enriched") return;
    assert.equal(out.record.status, "draft");
    assert.ok(out.record.lastApprovedPublic, "l'ultimo pubblico approvato deve essere preservato");
    assert.equal(out.record.lastApprovedPublic?.pois.length, first.record.pois.length);
  });
});

describe("4) UltimaModifica cambiata → ri-arricchito", () => {
  test("stesso comune/origine ma updatedAt diverso → non skippa", async () => {
    const repository = new MemoryTerritoryRepository();
    const first = await enrichListing(property({ updatedAt: "2026-08-01" }), makeDeps({ repository }));
    if (first.action !== "enriched") return assert.fail();
    await repository.putListingEnrichment(approve(first.record));

    const s = spy(new FakePlacesProvider());
    const out = await enrichListing(
      property({ updatedAt: "2026-08-12" }),
      makeDeps({ repository, provider: s.provider }),
    );
    assert.equal(out.action, "enriched");
    assert.equal(s.calls(), 1);
  });
});

describe("5) coordinate mancanti → skip", () => {
  test("origine non risolvibile → skipped-missing-coordinates, nessuna chiamata", async () => {
    const s = spy(new FakePlacesProvider());
    const out = await enrichListing(
      property({ town: "Comune Sconosciuto" }),
      makeDeps({ provider: s.provider, resolveOrigin: () => null }),
    );
    assert.equal(out.action, "skipped-missing-coordinates");
    assert.equal(s.calls(), 0);
  });

  test("codice mancante → skipped-missing-code", async () => {
    const out = await enrichListing(property({ codice: "" }), makeDeps());
    assert.equal(out.action, "skipped-missing-code");
  });
});

describe("6) comune disabilitato → skip", () => {
  test("origine risolta ma comune fuori dal pilota → skipped-disabled-municipality", async () => {
    const s = spy(new FakePlacesProvider());
    const disabled: ResolvedOrigin = { ...TRADATE, municipality: "milano" };
    const out = await enrichListing(
      property(),
      makeDeps({ provider: s.provider, resolveOrigin: () => disabled }),
    );
    assert.equal(out.action, "skipped-disabled-municipality");
    assert.equal(s.calls(), 0);
  });
});

describe("7) risposta provider malformata → failed", () => {
  test("errore di risposta → record failed, fallimento sanificato", async () => {
    const provider = new FakePlacesProvider({ failWith: new ProviderResponseError("fake", "malformato") });
    const repository = new MemoryTerritoryRepository();
    const out = await enrichListing(property(), makeDeps({ repository, provider }));
    assert.equal(out.action, "failed");
    if (out.action !== "failed") return;
    assert.equal(out.failure.kind, "invalid-response");
    assert.equal((await repository.getListingEnrichment("1043"))?.status, "failed");
  });
});

describe("8) copertura parziale del provider → arricchito con sottoinsieme", () => {
  test("categorie mancanti non fanno fallire: bozza con quelle disponibili", async () => {
    const provider = new FakePlacesProvider({ omitCategories: ["railway-station", "school"] });
    const out = await enrichListing(property(), makeDeps({ provider }));
    assert.equal(out.action, "enriched");
    if (out.action !== "enriched") return;
    const cats = new Set(out.record.pois.map((p) => p.category));
    assert.equal(cats.has("railway-station"), false);
    assert.equal(cats.has("school"), false);
    assert.ok(cats.has("pharmacy"));
  });
});

describe("9) rate limiting → failed (rate-limit)", () => {
  test("429 dal provider → fallimento di tipo rate-limit", async () => {
    const provider = new FakePlacesProvider({ rateLimited: true });
    const out = await enrichListing(property(), makeDeps({ provider }));
    assert.equal(out.action, "failed");
    if (out.action !== "failed") return;
    assert.equal(out.failure.kind, "rate-limit");
  });
});

describe("10) enrichment stale → ri-arricchito", () => {
  test("record approvato ma vecchio oltre la freschezza → non skippa", async () => {
    const repository = new MemoryTerritoryRepository();
    const first = await enrichListing(property(), makeDeps({ repository }));
    if (first.action !== "enriched") return assert.fail();
    // Approvato ma con retrievedAt molto vecchio.
    await repository.putListingEnrichment({
      ...approve(first.record),
      retrievedAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    });
    const s = spy(new FakePlacesProvider());
    const out = await enrichListing(property(), makeDeps({ repository, provider: s.provider }));
    assert.equal(out.action, "enriched");
    assert.equal(s.calls(), 1);
  });
});

describe("11) preservazione dell'ultimo record approvato su fallimento", () => {
  test("provider fallisce ma il record approvato resta pubblicabile", async () => {
    const repository = new MemoryTerritoryRepository();
    const first = await enrichListing(property(), makeDeps({ repository }));
    if (first.action !== "enriched") return assert.fail();
    await repository.putListingEnrichment(approve(first.record));

    const provider = new FakePlacesProvider({ rateLimited: true });
    const out = await enrichListing(property({ updatedAt: "2026-08-12" }), makeDeps({ repository, provider }));
    assert.equal(out.action, "failed");
    if (out.action !== "failed") return;
    assert.equal(out.preservedApproved, true);
    const stored = await repository.getListingEnrichment("1043");
    assert.equal(stored?.status, "approved"); // dati approvati NON distrutti
    assert.equal(stored?.failure?.kind, "rate-limit");
  });
});

describe("12) POI duplicati → deduplicati", () => {
  test("stesso luogo due volte → una sola voce", async () => {
    const dup: FakePlace[] = [
      { providerId: "x/1", category: "pharmacy", name: "Farmacia Unica", coord: { lat: 45.7085, lng: 8.9065 } },
      { providerId: "x/2", category: "pharmacy", name: "Farmacia Unica", coord: { lat: 45.7085, lng: 8.9065 } },
    ];
    const provider = new FakePlacesProvider({ places: dup });
    const out = await enrichListing(property(), makeDeps({ provider }));
    assert.equal(out.action, "enriched");
    if (out.action !== "enriched") return;
    assert.equal(out.record.pois.filter((p) => p.category === "pharmacy").length, 1);
  });
});

describe("13) ordinamento deterministico", () => {
  test("stessi ingressi (stesso now) → record identico", async () => {
    const a = await enrichListing(property(), makeDeps());
    const b = await enrichListing(property(), makeDeps());
    assert.equal(a.action, "enriched");
    assert.equal(b.action, "enriched");
    if (a.action !== "enriched" || b.action !== "enriched") return;
    assert.deepEqual(a.record, b.record);
  });

  test("max 2 POI per categoria", async () => {
    const many: FakePlace[] = [
      { providerId: "p/1", category: "pharmacy", name: "F1", coord: { lat: 45.7082, lng: 8.9061 } },
      { providerId: "p/2", category: "pharmacy", name: "F2", coord: { lat: 45.7083, lng: 8.9062 } },
      { providerId: "p/3", category: "pharmacy", name: "F3", coord: { lat: 45.7084, lng: 8.9063 } },
    ];
    const out = await enrichListing(property(), makeDeps({ provider: new FakePlacesProvider({ places: many }) }));
    if (out.action !== "enriched") return assert.fail();
    assert.equal(out.record.pois.filter((p) => p.category === "pharmacy").length, 2);
  });
});
