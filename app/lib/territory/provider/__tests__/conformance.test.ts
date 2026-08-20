// La suite di CONFORMITÀ applicata ai provider concreti (Prompt 11): fake e osm (con fixture) devono
// entrambi rispettare lo stesso contratto di verità/provenienza. Un nuovo provider aggiunto qui
// eredita automaticamente le stesse garanzie.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { FakePlacesProvider } from "../fake";
import { OsmOverpassProvider } from "../osm";
import { checkDisabledMakesNoCall, runConformance, standardScenario } from "../conformance";
import {
  EXPECTED_FIXTURE_NAMES,
  FIXTURE_ORIGIN,
  FIXTURE_RADIUS_M,
  fixtureFetch,
} from "./fixtures/overpass";

const ORIGIN = { lat: FIXTURE_ORIGIN.lat, lng: FIXTURE_ORIGIN.lng };
const NOW = () => new Date("2026-08-13T00:00:00.000Z");

describe("conformità: FakePlacesProvider", () => {
  test("rispetta il contratto sullo scenario standard", async () => {
    const provider = new FakePlacesProvider();
    const violations = await runConformance(provider, standardScenario(ORIGIN));
    assert.deepEqual(violations, []);
  });

  test("rispetta il limite", async () => {
    const provider = new FakePlacesProvider();
    const violations = await runConformance(provider, { ...standardScenario(ORIGIN), limit: 3 });
    assert.deepEqual(violations, []);
  });

  test("un provider disabilitato non fa nulla e solleva", async () => {
    const violations = await checkDisabledMakesNoCall(
      () => new FakePlacesProvider({ enabled: false }),
      standardScenario(ORIGIN),
      () => 0, // il fake non tocca la rete
    );
    assert.deepEqual(violations, []);
  });
});

describe("conformità: OsmOverpassProvider (fixture)", () => {
  function makeOsm(over = {}) {
    const { impl, calls } = fixtureFetch();
    const provider = new OsmOverpassProvider({ fetchImpl: impl, now: NOW, sleepImpl: async () => {}, ...over });
    return { provider, calls };
  }

  test("rispetta il contratto sulla fixture completa", async () => {
    const { provider } = makeOsm();
    const scenario = standardScenario(ORIGIN, FIXTURE_RADIUS_M);
    const violations = await runConformance(provider, scenario);
    assert.deepEqual(violations, []);
  });

  test("classifica esattamente gli attesi (dedup/senza nome/generici/lontani esclusi)", async () => {
    const { provider } = makeOsm();
    const places = await provider.searchNearby({
      origin: ORIGIN,
      radiusMeters: FIXTURE_RADIUS_M,
      categories: [...standardScenario(ORIGIN).categories],
    });
    assert.deepEqual(places.map((p) => p.name).sort(), [...EXPECTED_FIXTURE_NAMES]);
  });

  test("ogni luogo porta un'evidenza di tag (provenienza)", async () => {
    const { provider } = makeOsm();
    const places = await provider.searchNearby({
      origin: ORIGIN,
      radiusMeters: FIXTURE_RADIUS_M,
      categories: [...standardScenario(ORIGIN).categories],
    });
    assert.ok(places.length > 0);
    assert.ok(places.every((p) => p.evidence.key.length > 0 && p.evidence.value.length > 0));
  });

  test("un provider disabilitato non tocca la rete e solleva", async () => {
    const { impl, calls } = fixtureFetch();
    const violations = await checkDisabledMakesNoCall(
      () => new OsmOverpassProvider({ enabled: false, fetchImpl: impl, now: NOW }),
      standardScenario(ORIGIN, FIXTURE_RADIUS_M),
      () => calls.length,
    );
    assert.deepEqual(violations, []);
  });
});
