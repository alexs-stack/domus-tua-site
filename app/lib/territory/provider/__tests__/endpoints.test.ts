// Test del pool di endpoint con circuit breaker e salute (Prompt 11). Orologio iniettato → deterministico.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { OverpassEndpointPool } from "../endpoints";

const A = "https://a.example/api/interpreter";
const B = "https://b.example/api/interpreter";

/** Orologio mutabile per pilotare il cooldown. */
function clock(startMs: number) {
  let t = startMs;
  return { now: () => new Date(t), advance: (ms: number) => (t += ms) };
}

describe("OverpassEndpointPool", () => {
  test("default: un solo endpoint, sempre scelto finché sano", () => {
    const pool = new OverpassEndpointPool();
    assert.equal(pool.size, 1);
    const e = pool.pick();
    assert.ok(e && e.startsWith("https://overpass-api.de"));
  });

  test("apre il circuito dopo N fallimenti consecutivi e smette di sceglierlo", () => {
    const c = clock(0);
    const pool = new OverpassEndpointPool([A], { failureThreshold: 3, cooldownMs: 60_000, now: c.now });
    for (let i = 0; i < 3; i++) {
      assert.equal(pool.pick(), A);
      pool.recordFailure(A);
    }
    // circuito aperto: nessun endpoint utilizzabile → null (non si spara traffico)
    assert.equal(pool.pick(), null);
    assert.equal(pool.snapshot()[0].state, "open");
  });

  test("half-open dopo il cooldown; un successo richiude, un fallimento riapre", () => {
    const c = clock(0);
    const pool = new OverpassEndpointPool([A], { failureThreshold: 2, cooldownMs: 60_000, now: c.now });
    pool.recordFailure(A);
    pool.recordFailure(A); // apre
    assert.equal(pool.pick(), null);

    c.advance(60_000); // passato il cooldown → half-open
    assert.equal(pool.pick(), A);
    assert.equal(pool.snapshot()[0].state, "half-open");

    // fallimento in half-open → riapre subito
    pool.recordFailure(A);
    assert.equal(pool.pick(), null);

    c.advance(60_000);
    assert.equal(pool.pick(), A);
    pool.recordSuccess(A); // richiude
    assert.equal(pool.snapshot()[0].state, "closed");
    assert.equal(pool.snapshot()[0].consecutiveFailures, 0);
  });

  test("con più endpoint: preferisce il più sano e ruota su quello aperto", () => {
    const c = clock(0);
    const pool = new OverpassEndpointPool([A, B], { failureThreshold: 2, cooldownMs: 60_000, now: c.now });
    // A fallisce fino ad aprirsi → il pool sceglie B
    pool.recordFailure(A);
    pool.recordFailure(A);
    assert.equal(pool.pick(), B);
  });

  test("a parità di salute rispetta l'ordine di configurazione (deterministico)", () => {
    const pool = new OverpassEndpointPool([A, B]);
    assert.equal(pool.pick(), A);
  });

  test("rifiuta un pool vuoto", () => {
    assert.throws(() => new OverpassEndpointPool([]), /nessun endpoint/);
  });
});
