// Cache di query per origine (Prompt 5): riuso del profilo, single-flight, invalidazione,
// preservazione dell'ultimo profilo buono e delle approvazioni per-immobile.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { ProfileRefresher } from "../profileCache";
import { deriveListingFromProfile } from "../engine";
import { defaultEnrichmentConfig } from "../config";
import { FakePlacesProvider } from "../provider/fake";
import type { TerritoryPlacesProvider } from "../provider/provider";
import { MemoryTerritoryRepository } from "../store/memory";
import type { ResolvedOrigin } from "../origin";
import type { ListingTerritoryEnrichment, MunicipalityTerritoryProfile } from "../types";

const NOW = () => new Date("2026-08-13T10:00:00.000Z");
const TRADATE: ResolvedOrigin = {
  coord: { lat: 45.708, lng: 8.906 },
  precision: "municipality-centroid",
  accuracyMeters: 2000,
  label: "Tradate",
  municipality: "tradate",
};

/** Provider con contatore e ritardo opzionale (per esercitare il single-flight). */
function counting(delayMs = 0): { provider: TerritoryPlacesProvider; calls: () => number } {
  const inner = new FakePlacesProvider();
  let calls = 0;
  return {
    provider: {
      name: inner.name,
      attribution: inner.attribution,
      enabled: inner.enabled,
      async searchNearby(input) {
        calls++;
        if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
        return inner.searchNearby(input);
      },
    },
    calls: () => calls,
  };
}

function refresher(over: Partial<Parameters<typeof makeDepsForRefresher>[0]> = {}) {
  return makeDepsForRefresher(over);
}
function makeDepsForRefresher(over: {
  provider?: TerritoryPlacesProvider;
  repository?: MemoryTerritoryRepository;
  config?: ReturnType<typeof defaultEnrichmentConfig>;
  maxQueries?: number | null;
}) {
  const repository = over.repository ?? new MemoryTerritoryRepository();
  const r = new ProfileRefresher({
    provider: over.provider ?? new FakePlacesProvider(),
    repository,
    config: over.config ?? defaultEnrichmentConfig(),
    now: NOW,
    maxQueries: over.maxQueries ?? null,
  });
  return { r, repository };
}

describe("riuso e single-flight", () => {
  test("stessa origine due volte in sequenza → 1 query, la 2ª è cache hit", async () => {
    const c = counting();
    const { r } = refresher({ provider: c.provider });
    const a = await r.resolve(TRADATE);
    const b = await r.resolve(TRADATE);
    assert.equal(a.source, "refreshed");
    assert.equal(b.source, "hit");
    assert.equal(c.calls(), 1);
  });

  test("N risoluzioni CONCORRENTI della stessa origine → una sola query (single-flight)", async () => {
    const c = counting(15);
    const { r } = refresher({ provider: c.provider });
    const [a, b, d] = await Promise.all([r.resolve(TRADATE), r.resolve(TRADATE), r.resolve(TRADATE)]);
    assert.equal(c.calls(), 1, "nessuna tempesta di refresh concorrenti");
    assert.equal(r.queries(), 1);
    // Uno ha eseguito la query, gli altri l'hanno condivisa.
    assert.equal([a, b, d].filter((x) => x.queried).length, 1);
  });
});

describe("invalidazione deterministica", () => {
  test("stessa config → hit; raggio diverso → nuova query", async () => {
    const repository = new MemoryTerritoryRepository();
    const c1 = counting();
    const { r: r1 } = refresher({ provider: c1.provider, repository });
    await r1.resolve(TRADATE); // popola il profilo (raggio 1500)

    // Nuovo run, STESSA config → hit.
    const c2 = counting();
    const { r: r2 } = refresher({ provider: c2.provider, repository });
    assert.equal((await r2.resolve(TRADATE)).source, "hit");
    assert.equal(c2.calls(), 0);

    // Nuovo run, RAGGIO diverso → impronta diversa → refresh.
    const c3 = counting();
    const { r: r3 } = refresher({
      provider: c3.provider,
      repository,
      config: { ...defaultEnrichmentConfig(), searchRadiusMeters: 3000 },
    });
    assert.equal((await r3.resolve(TRADATE)).source, "refreshed");
    assert.equal(c3.calls(), 1);
  });
});

describe("fallimento del provider → ultimo profilo buono", () => {
  test("con profilo esistente: stale (dato vecchio conservato)", async () => {
    const repository = new MemoryTerritoryRepository();
    const { r: ok } = refresher({ repository });
    await ok.resolve(TRADATE); // profilo buono

    // Forza un refresh (raggio diverso) con provider che fallisce → stale.
    const failing = new FakePlacesProvider({ rateLimited: true });
    const { r } = refresher({
      provider: failing,
      repository,
      config: { ...defaultEnrichmentConfig(), searchRadiusMeters: 3000 },
    });
    const res = await r.resolve(TRADATE);
    assert.equal(res.source, "stale");
    assert.ok(res.profile, "conserva l'ultimo profilo buono");
  });

  test("senza profilo esistente: unavailable (nessun buco, nessuna eccezione)", async () => {
    const failing = new FakePlacesProvider({ rateLimited: true });
    const { r } = refresher({ provider: failing });
    const res = await r.resolve(TRADATE);
    assert.equal(res.source, "unavailable");
    assert.equal(res.profile, null);
  });
});

describe("deriveListingFromProfile: approvazioni per-immobile preservate", () => {
  test("la decisione dell'editor su un POI sopravvive al refresh del profilo", async () => {
    const { r } = refresher({});
    const res = await r.resolve(TRADATE);
    const profile = res.profile as MunicipalityTerritoryProfile;
    const targetId = profile.pois[0].providerId;

    // L'editor ha approvato quel POI su QUESTO immobile.
    const existing: ListingTerritoryEnrichment = {
      schemaVersion: profile.schemaVersion,
      realSmartCode: "1043",
      municipality: "tradate",
      origin: profile.origin,
      originPrecision: profile.originPrecision,
      originAccuracyMeters: profile.originAccuracyMeters,
      originLabel: profile.originLabel,
      fingerprint: profile.fingerprint,
      status: "approved",
      pois: [{ ...profile.pois[0], approval: { state: "approved", approvedBy: "editor", approvedAt: NOW().toISOString() } }],
      retrievedAt: profile.retrievedAt,
      updatedAt: profile.retrievedAt,
    };

    const derived = deriveListingFromProfile(
      "1043",
      TRADATE,
      profile,
      existing,
      defaultEnrichmentConfig(),
      NOW(),
      undefined,
    );
    const targetPoi = derived.pois.find((p) => p.providerId === targetId);
    assert.equal(targetPoi?.approval.state, "approved", "l'approvazione per-immobile è preservata");
    // I POI nuovi (non presenti prima) nascono draft.
    assert.ok(derived.pois.filter((p) => p.providerId !== targetId).every((p) => p.approval.state === "draft"));
  });
});
