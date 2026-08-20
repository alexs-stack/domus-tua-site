// Test dei cancelli di sicurezza dell'endpoint cron (auth + feature flag).
// Non esegue l'arricchimento: verifica che senza segreto/autorizzazione/flag NON si proceda.

import { test, describe, afterEach } from "node:test";
import assert from "node:assert/strict";

import { GET } from "../route";

// Ripristina SOLO le chiavi che i test toccano, senza sostituire l'oggetto process.env
// (sostituirlo romperebbe il binding nativo per gli altri file di test nello stesso processo).
const KEYS = ["CRON_SECRET", "TERRITORY_ENRICHMENT_ENABLED"] as const;
const SAVED = new Map(KEYS.map((k) => [k, process.env[k]]));
afterEach(() => {
  for (const k of KEYS) {
    const v = SAVED.get(k);
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
});

function req(headers: Record<string, string> = {}): Request {
  return new Request("https://example.test/api/cron/territory", { headers });
}

describe("GET /api/cron/territory — cancelli", () => {
  test("senza CRON_SECRET → 503", async () => {
    delete process.env.CRON_SECRET;
    const res = await GET(req());
    assert.equal(res.status, 503);
  });

  test("autorizzazione errata → 401", async () => {
    process.env.CRON_SECRET = "s3cret";
    const res = await GET(req({ authorization: "Bearer wrong" }));
    assert.equal(res.status, 401);
  });

  test("autorizzato ma feature flag spento → 503 (disabled)", async () => {
    process.env.CRON_SECRET = "s3cret";
    process.env.TERRITORY_ENRICHMENT_ENABLED = "false";
    const res = await GET(req({ authorization: "Bearer s3cret" }));
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.disabled, true);
  });
});
