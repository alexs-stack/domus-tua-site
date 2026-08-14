// Test di CABLAGGIO: i sottosistemi progettati nei prompt 14/16 devono essere davvero COLLEGATI,
// non solo definiti. Sono i test che falliscono se qualcuno scollega l'osservabilità, il budget
// mensile, la ritenzione o la precisione di zona — cioè se tornano a essere scheletri.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { ProfileRefresher } from "../profileCache";
import { MemoryTerritoryRepository } from "../store/memory";
import { FakePlacesProvider } from "../provider/fake";
import { MemorySink, guarded, findPrivacyViolations } from "../observe";
import { readEnrichmentConfig } from "../config";
import { evaluateCallBudget, readBudgets } from "../budget";
import { shouldPurgeTerritory } from "../lifecycle";
import { parseZoneField, buildZoneIndex, zoneKey } from "../zone";
import { resolveAuthorizedOrigin } from "../originAuthz";
import { TERRITORY_SCHEMA_VERSION } from "../constants";
import type { ResolvedOrigin } from "../origin";
import type { ListingTerritoryEnrichment } from "../types";
import type { NormalizedProperty } from "../../realsmart/types";

const NOW = new Date("2026-08-14T10:00:00.000Z");
const ORIGIN: ResolvedOrigin = {
  coord: { lat: 45.708, lng: 8.906 },
  precision: "municipality-centroid",
  accuracyMeters: 2000,
  label: "Tradate",
  municipality: "tradate",
};

function refresher(over: Partial<ConstructorParameters<typeof ProfileRefresher>[0]> = {}) {
  return new ProfileRefresher({
    provider: new FakePlacesProvider(),
    repository: new MemoryTerritoryRepository(),
    config: readEnrichmentConfig({}),
    now: () => NOW,
    ...over,
  });
}

describe("osservabilità CABLATA nel percorso di refresh", () => {
  test("un refresh emette provider-call (con latenza) e profile-cache", async () => {
    const sink = new MemorySink();
    await refresher({ sink, runId: "run_test01" }).resolve(ORIGIN);

    const call = sink.events.find((e) => e.kind === "provider-call");
    assert.ok(call, "manca l'evento provider-call: l'osservabilità non è collegata");
    assert.equal(call.outcome, "ok");
    assert.equal(typeof call.latencyMs, "number");
    assert.equal(call.municipality, "tradate");
    assert.equal(call.runId, "run_test01");

    const cache = sink.events.find((e) => e.kind === "profile-cache");
    assert.ok(cache, "manca l'evento profile-cache");
    assert.equal(cache.result, "refreshed");
  });

  test("una cache HIT emette profile-cache=hit senza provider-call", async () => {
    const sink = new MemorySink();
    const repository = new MemoryTerritoryRepository();
    const r1 = refresher({ repository });
    await r1.resolve(ORIGIN); // popola
    const r2 = refresher({ repository, sink });
    await r2.resolve(ORIGIN); // ora è hit

    assert.equal(sink.events.filter((e) => e.kind === "provider-call").length, 0);
    assert.equal(sink.events.find((e) => e.kind === "profile-cache")?.result, "hit");
  });

  test("un fallimento del provider emette provider-call outcome=failed con il tipo di guasto", async () => {
    const sink = new MemorySink();
    const provider = new FakePlacesProvider({ rateLimited: true });
    await refresher({ provider, sink }).resolve(ORIGIN);
    const call = sink.events.find((e) => e.kind === "provider-call");
    assert.equal(call?.outcome, "failed");
    assert.equal(call?.failure, "rate-limit");
  });

  test("gli eventi emessi restano PII-safe (nessuna coordinata)", async () => {
    const sink = new MemorySink();
    await refresher({ sink }).resolve(ORIGIN);
    assert.ok(sink.events.length > 0);
    for (const e of sink.events) assert.deepEqual(findPrivacyViolations(e), []);
    // NB: si cercano CHIAVI JSON, non sottostringhe: "lat" comparirebbe dentro "latencyMs".
    const json = JSON.stringify(sink.events);
    for (const bad of ["45.708", "8.906", '"lat"', '"lng"', '"coord"']) {
      assert.equal(json.includes(bad), false, `evento con campo proibito ${bad}`);
    }
  });

  test("il sink guarded scarta un evento sporco anche se emesso dal percorso reale", () => {
    const inner = new MemorySink();
    guarded(inner).emit({ kind: "public-impression", municipality: "45.7085,8.9065" });
    assert.equal(inner.events.length, 0);
  });
});

describe("budget mensile CABLATO (non solo definito)", () => {
  test("gate negativo → nessuna query, ma il profilo esistente resta servito", async () => {
    const repository = new MemoryTerritoryRepository();
    // Primo run: popola il profilo.
    await refresher({ repository }).resolve(ORIGIN);

    // Secondo run con budget esaurito: nessuna NUOVA chiamata, dato preservato.
    let calls = 0;
    const provider = new FakePlacesProvider();
    const counting = {
      ...provider,
      name: provider.name,
      attribution: provider.attribution,
      enabled: provider.enabled,
      searchNearby: async (i: Parameters<typeof provider.searchNearby>[0]) => {
        calls += 1;
        return provider.searchNearby(i);
      },
    };
    const sink = new MemorySink();
    const r = refresher({
      repository,
      provider: counting,
      sink,
      allowProviderCall: () => false,
      // forza il ricalcolo: config diversa → impronta diversa → non è un hit
      config: { ...readEnrichmentConfig({}), searchRadiusMeters: 999 },
    });
    const result = await r.resolve(ORIGIN);

    assert.equal(calls, 0, "il budget esaurito NON deve lasciar partire una chiamata");
    assert.equal(result.source, "budget-skipped");
    assert.ok(result.profile, "il profilo approvato resta servito: il budget non cancella dati");
    assert.equal(sink.events.find((e) => e.kind === "profile-cache")?.result, "budget-skipped");
  });

  test("kill switch e tetto mensile decidono allo stesso modo (funzione pura)", () => {
    assert.equal(evaluateCallBudget("poi", 0, readBudgets({ TERRITORY_KILL_SWITCH: "true" })).allowed, false);
    assert.equal(evaluateCallBudget("poi", 5, readBudgets({ TERRITORY_POI_MONTHLY_BUDGET: "5" })).allowed, false);
    assert.equal(evaluateCallBudget("poi", 4, readBudgets({ TERRITORY_POI_MONTHLY_BUDGET: "5" })).allowed, true);
  });
});

describe("ritenzione CABLATA: il repository sa cancellare", () => {
  function record(over: Partial<ListingTerritoryEnrichment> = {}): ListingTerritoryEnrichment {
    return {
      schemaVersion: TERRITORY_SCHEMA_VERSION,
      realSmartCode: "1043",
      municipality: "tradate",
      originPrecision: "municipality-centroid",
      originAccuracyMeters: 2000,
      originLabel: "Tradate",
      origin: { lat: 45.708, lng: 8.906 },
      fingerprint: { municipality: "tradate", coordKey: "45.708,8.906", ultimaModifica: "2026-08-01", schemaVersion: TERRITORY_SCHEMA_VERSION, hash: "abc" },
      status: "disabled",
      pois: [],
      retrievedAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      ...over,
    };
  }

  test("deleteListingEnrichment esiste e cancella davvero", async () => {
    const repo = new MemoryTerritoryRepository();
    await repo.putListingEnrichment(record());
    assert.ok(await repo.getListingEnrichment("1043"));
    assert.equal(await repo.deleteListingEnrichment("1043"), true);
    assert.equal(await repo.getListingEnrichment("1043"), null);
    assert.equal(await repo.deleteListingEnrichment("1043"), false); // idempotente
  });

  test("solo i disabilitati oltre la finestra sono candidati", () => {
    assert.equal(shouldPurgeTerritory(record(), NOW, 90), true);
    assert.equal(shouldPurgeTerritory(record({ status: "approved" }), NOW, 0), false);
    assert.equal(shouldPurgeTerritory(record({ updatedAt: NOW.toISOString() }), NOW, 90), false);
  });
});

describe("precisione di ZONA dal nome dichiarato dal feed", () => {
  test("parseZoneField separa comune e zona", () => {
    assert.deepEqual(parseZoneField("Tradate, Abbiate Guazzone"), { municipality: "tradate", zone: "abbiate-guazzone" });
    assert.deepEqual(parseZoneField("Tradate, centro"), { municipality: "tradate", zone: "centro" });
    // Zona uguale al comune → nessuna sotto-area.
    assert.deepEqual(parseZoneField("Venegono Superiore"), { municipality: "venegono-superiore", zone: null });
  });

  test("chiavi di zona distinte fra comuni diversi (nessuna collisione di \"centro\")", () => {
    assert.notEqual(zoneKey("tradate", "centro"), zoneKey("venegono-superiore", "centro"));
  });

  test("con un centroide curato l'origine diventa zone-centroid (±500 m)", () => {
    const zones = [{ slug: "abbiate-guazzone", label: "Abbiate Guazzone", municipality: "tradate", coord: { lat: 45.7, lng: 8.9 } }];
    const index = buildZoneIndex(zones);
    const property = { town: "Tradate", zoneName: "Abbiate Guazzone", sourceRef: { codice: "1043" } } as NormalizedProperty;
    const { origin } = resolveAuthorizedOrigin(property, { zoneByName: (m, z) => index(m, z) });
    assert.equal(origin?.precision, "zone-centroid");
    assert.equal(origin?.accuracyMeters, 500);
    assert.equal(origin?.label, "Abbiate Guazzone");
  });

  test("senza centroide curato si RIPIEGA in sicurezza sul centroide comunale", () => {
    const property = { town: "Tradate", zoneName: "Abbiate Guazzone", sourceRef: { codice: "1043" } } as NormalizedProperty;
    const { origin } = resolveAuthorizedOrigin(property, { zoneByName: () => undefined });
    assert.equal(origin?.precision, "municipality-centroid");
    assert.equal(origin?.accuracyMeters, 2000);
  });

  test("senza zona dichiarata dal feed non si tenta alcuna precisione di zona", () => {
    const property = { town: "Tradate", sourceRef: { codice: "1043" } } as NormalizedProperty;
    let consulted = false;
    const { origin } = resolveAuthorizedOrigin(property, {
      zoneByName: () => {
        consulted = true;
        return undefined;
      },
    });
    assert.equal(consulted, false, "senza zona nel feed non si consulta l'indice");
    assert.equal(origin?.precision, "municipality-centroid");
  });
});
