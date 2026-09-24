// Rate limiting condiviso (app/lib/security/rateLimit.ts) — chiavi privacy-conscious, limiti per
// endpoint, finestra, e fail-open quando lo store condiviso non è disponibile.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { clientIp, clientKey, rateLimit, rateLimitShared } from "../rateLimit";
import { sharedStoreEnabled } from "../sharedStore";

function req(headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/x", { method: "POST", headers });
}

describe("clientIp — parsing del proxy", () => {
  test("x-forwarded-for: primo elemento (il client), non il proxy", () => {
    assert.equal(clientIp(req({ "x-forwarded-for": "203.0.113.5, 10.0.0.1, 10.0.0.2" })), "203.0.113.5");
  });
  test("ripiego su x-real-ip", () => {
    assert.equal(clientIp(req({ "x-real-ip": "198.51.100.7" })), "198.51.100.7");
  });
  test("nessun header → 'unknown' (un solo bucket, accettabile per l'MVP)", () => {
    assert.equal(clientIp(req()), "unknown");
  });
});

describe("clientKey — chiave privacy-conscious", () => {
  test("l'IP NON compare in chiaro nella chiave", () => {
    const key = clientKey(req({ "x-forwarded-for": "203.0.113.5" }), "lead");
    assert.ok(!key.includes("203.0.113.5"), `IP in chiaro nella chiave: ${key}`);
    assert.match(key, /^lead:/);
  });
  test("deterministica: stesso IP → stessa chiave (il limite regge)", () => {
    const a = clientKey(req({ "x-forwarded-for": "203.0.113.5" }), "lead");
    const b = clientKey(req({ "x-forwarded-for": "203.0.113.5" }), "lead");
    assert.equal(a, b);
  });
  test("IP diversi → chiavi diverse", () => {
    const a = clientKey(req({ "x-forwarded-for": "203.0.113.5" }), "lead");
    const b = clientKey(req({ "x-forwarded-for": "203.0.113.9" }), "lead");
    assert.notEqual(a, b);
  });
  test("endpoint isolati: prefissi diversi → chiavi diverse (stessa IP)", () => {
    const lead = clientKey(req({ "x-forwarded-for": "203.0.113.5" }), "lead");
    const search = clientKey(req({ "x-forwarded-for": "203.0.113.5" }), "search");
    assert.notEqual(lead, search);
  });
});

describe("rateLimit — finestra in-memory", () => {
  test("ammette fino al limite, poi 429 con retry-after", () => {
    const key = `test-window:${Math.floor(performance.now())}:${Math.random()}`;
    const cfg = { limit: 3, windowMs: 60_000 };
    for (let i = 0; i < 3; i++) assert.equal(rateLimit(key, cfg).ok, true, `richiesta ${i} dovrebbe passare`);
    const blocked = rateLimit(key, cfg);
    assert.equal(blocked.ok, false);
    if (!blocked.ok) assert.ok(blocked.retryAfterSeconds >= 1, "retry-after mancante");
  });

  test("chiavi diverse hanno contatori indipendenti", () => {
    const cfg = { limit: 1, windowMs: 60_000 };
    const a = `k-a:${Math.random()}`;
    const b = `k-b:${Math.random()}`;
    assert.equal(rateLimit(a, cfg).ok, true);
    assert.equal(rateLimit(b, cfg).ok, true, "un IP diverso non deve ereditare il limite di un altro");
    assert.equal(rateLimit(a, cfg).ok, false, "il secondo colpo sulla stessa chiave è limitato");
  });
});

describe("rateLimitShared — fail-open sul locale quando lo store condiviso è giù", () => {
  test("senza Redis configurato usa il contatore in-memory e fa comunque rispettare il limite", async () => {
    assert.equal(sharedStoreEnabled, false, "questo test presuppone Redis non configurato");
    const key = `shared-fallback:${Math.random()}`;
    const cfg = { limit: 2, windowMs: 60_000 };
    assert.equal((await rateLimitShared(key, cfg)).ok, true);
    assert.equal((await rateLimitShared(key, cfg)).ok, true);
    const blocked = await rateLimitShared(key, cfg);
    assert.equal(blocked.ok, false, "oltre il limite deve bloccare anche in fallback");
    if (!blocked.ok) assert.equal(typeof blocked.retryAfterSeconds, "number");
  });
});
