// Endpoint /api/lead — integrazione: validazione, honeypot, rate limit, malformati.
//
// Nessun canale è configurato in test (né SHEETS_WEBHOOK_URL né la chiave email),
// quindi un lead VALIDO viene accettato ma non consegnato: la route NON deve mai
// dichiarare un invio riuscito che non è avvenuto (ok:false, reason:not-delivered).

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { POST } from "../../../api/lead/route";

// Rate limit per IP: un IP diverso per test così l'ordine non li fa interferire.
let ipSeq = 0;
function post(body: unknown, ip = `10.1.0.${(ipSeq = (ipSeq + 1) % 250) + 1}`): Request {
  return new Request("http://localhost/api/lead", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const VALID = {
  intent: "seller",
  name: "Maria Rossi",
  phone: "333 1234567",
  consent: true,
};

async function json(res: Response) {
  return (await res.json()) as { ok: boolean; error?: string; reason?: string };
}

describe("POST /api/lead", () => {
  test("lead valido: accettato ma, senza canali configurati, non dichiara un invio riuscito", async () => {
    const res = await POST(post(VALID));
    assert.equal(res.status, 200);
    const b = await json(res);
    assert.equal(b.ok, false);
    assert.equal(b.reason, "not-delivered");
  });

  test("JSON malformato → 400", async () => {
    const res = await POST(post("{non-json"));
    assert.equal(res.status, 400);
  });

  test("payload non-oggetto → 400", async () => {
    const res = await POST(post("42"));
    assert.equal(res.status, 400);
  });

  test("senza nome → 400 missing-name", async () => {
    const b = await json(await POST(post({ ...VALID, name: "" })));
    assert.equal(b.error, "missing-name");
  });

  test("senza recapito → 400 missing-contact", async () => {
    const b = await json(await POST(post({ ...VALID, phone: undefined })));
    assert.equal(b.error, "missing-contact");
  });

  test("email non valida → 400 invalid-email", async () => {
    const b = await json(await POST(post({ ...VALID, phone: undefined, email: "non-una-email" })));
    assert.equal(b.error, "invalid-email");
  });

  test("telefono non valido → 400 invalid-phone", async () => {
    const b = await json(await POST(post({ ...VALID, phone: "123" })));
    assert.equal(b.error, "invalid-phone");
  });

  test("senza consenso → 400 missing-consent", async () => {
    const b = await json(await POST(post({ ...VALID, consent: false })));
    assert.equal(b.error, "missing-consent");
  });

  test("honeypot compilato (spam) → 200 ok:true, senza processare né salvare", async () => {
    const res = await POST(post({ ...VALID, company: "Acme Bot Srl" }));
    assert.equal(res.status, 200);
    const b = await json(res);
    assert.equal(b.ok, true);
  });

  test("flood dallo stesso IP (invii ripetuti) → 429 con retry-after", async () => {
    const ip = "10.9.9.9";
    let limited = false;
    for (let i = 0; i < 12; i++) {
      const res = await POST(post(VALID, ip));
      if (res.status === 429) {
        assert.ok(res.headers.get("retry-after"));
        limited = true;
        break;
      }
    }
    assert.ok(limited, "il rate limit deve scattare su invii ripetuti dallo stesso IP");
  });
});
