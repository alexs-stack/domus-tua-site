// Guardie dell'endpoint di revalidazione mirata (Prompt 15): senza segreto è invisibile (404), con
// segreto sbagliato rifiuta (401), senza codice/comune è una richiesta malformata (400). Non
// esercita la revalidazione vera (richiede il runtime Next); qui contano le difese d'accesso.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { POST } from "../../../api/territory/revalidate/route";

const URL = "http://localhost/api/territory/revalidate";

function req(headers: Record<string, string>, body?: unknown): Request {
  return new Request(URL, { method: "POST", headers, body: body === undefined ? undefined : JSON.stringify(body) });
}

describe("/api/territory/revalidate — accesso", () => {
  test("senza TERRITORY_REVALIDATE_SECRET → 404 (endpoint non rivelato)", async () => {
    delete process.env.TERRITORY_REVALIDATE_SECRET;
    const res = await POST(req({ authorization: "Bearer x" }, { code: "1043" }));
    assert.equal(res.status, 404);
  });

  test("segreto configurato ma authorization errata → 401", async () => {
    process.env.TERRITORY_REVALIDATE_SECRET = "s3cr3t";
    const res = await POST(req({ authorization: "Bearer sbagliato" }, { code: "1043" }));
    assert.equal(res.status, 401);
    delete process.env.TERRITORY_REVALIDATE_SECRET;
  });

  test("autorizzato ma senza codice né comune → 400", async () => {
    process.env.TERRITORY_REVALIDATE_SECRET = "s3cr3t";
    const res = await POST(req({ authorization: "Bearer s3cr3t", "content-type": "application/json" }, {}));
    assert.equal(res.status, 400);
    delete process.env.TERRITORY_REVALIDATE_SECRET;
  });

  test("autorizzato ma JSON invalido → 400", async () => {
    process.env.TERRITORY_REVALIDATE_SECRET = "s3cr3t";
    const res = await POST(new Request(URL, { method: "POST", headers: { authorization: "Bearer s3cr3t" }, body: "non-json{" }));
    assert.equal(res.status, 400);
    delete process.env.TERRITORY_REVALIDATE_SECRET;
  });
});
