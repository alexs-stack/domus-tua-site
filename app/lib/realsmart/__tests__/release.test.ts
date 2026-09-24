// Cancello di rilascio (app/lib/realsmart/release.ts) — logica pura.
//
// Distingue il degrado a runtime (tollerato) dalla sicurezza di rilascio: un deploy di produzione
// non deve promuovere un catalogo vuoto/implausibile quando il feed live è richiesto.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { evaluateRelease } from "../release";

const policy = (over = {}) => ({ requireLive: true, minListings: 5, allowEmpty: false, ...over });

describe("evaluateRelease", () => {
  test("feed non richiesto (dev/anteprima/mock): sempre READY", () => {
    const r = evaluateRelease(
      { source: "mock", ok: true, itemCount: 0 },
      policy({ requireLive: false }),
    );
    assert.equal(r.verdict, "READY");
    assert.equal(r.ready, true);
  });

  test("live con abbastanza immobili: READY", () => {
    const r = evaluateRelease({ source: "live", ok: true, itemCount: 42 }, policy());
    assert.equal(r.verdict, "READY");
    assert.equal(r.ready, true);
  });

  test("stale è sorgente reale: READY se sopra soglia", () => {
    const r = evaluateRelease({ source: "stale", ok: true, itemCount: 10 }, policy());
    assert.equal(r.ready, true);
  });

  test("unavailable (fail-closed): BLOCKED", () => {
    const r = evaluateRelease({ source: "unavailable", ok: false, itemCount: 0 }, policy());
    assert.equal(r.verdict, "BLOCKED");
    assert.equal(r.ready, false);
    assert.ok(r.reasons.length > 0);
  });

  test("mock in produzione (config errata): BLOCKED, non è sorgente reale", () => {
    const r = evaluateRelease({ source: "mock", ok: true, itemCount: 99 }, policy());
    assert.equal(r.verdict, "BLOCKED");
    assert.ok(r.reasons.some((x) => /non reale/.test(x)));
  });

  test("sotto la soglia minima: BLOCKED", () => {
    const r = evaluateRelease({ source: "live", ok: true, itemCount: 2 }, policy({ minListings: 5 }));
    assert.equal(r.ready, false);
    assert.ok(r.reasons.some((x) => /soglia/.test(x)));
  });

  test("override esplicito auditabile: OVERRIDDEN, promuovibile ma segnalato", () => {
    const r = evaluateRelease(
      { source: "unavailable", ok: false, itemCount: 0 },
      policy({ allowEmpty: true }),
    );
    assert.equal(r.verdict, "OVERRIDDEN");
    assert.equal(r.ready, true);
    assert.ok(r.reasons.some((x) => /override/.test(x)));
  });
});
