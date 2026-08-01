// La route della richiesta scritta e /api/health.
//
// Senza ASSISTANT_EMAIL_API_KEY il canale email non è configurato: è lo stato di oggi in
// produzione, e il comportamento da verificare è proprio che NON finga di aver inviato.

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { POST } from "../../../api/assistant/lead/route";
import { GET as HEALTH } from "../../../api/health/route";
import { MAX_BODY_BYTES } from "../config";

// Il rate limit è per IP: senza un IP diverso per test, il sesto invio della suite
// riceverebbe 429 e i test dipenderebbero dall'ordine di esecuzione.
let ipSeq = 0;

function post(body: unknown, ip = `10.0.0.${++ipSeq}`): Request {
  return new Request("http://localhost/api/assistant/lead", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const VALIDO = {
  nome: "Mario Rossi",
  email: "mario@example.com",
  messaggio: "Vorrei informazioni sulla villa con giardino.",
  consenso: true,
};

describe("POST /api/assistant/lead", () => {
  it("senza provider configurato non dichiara mai un invio riuscito", async () => {
    const res = await POST(post(VALIDO));
    const body = (await res.json()) as { ok: boolean; code?: string };

    assert.equal(body.ok, false, "falso successo: la richiesta non è partita davvero");
    assert.equal(body.code, "email-non-configurata");
    assert.equal(res.status, 503);
  });

  it("rifiuta una richiesta senza consenso privacy", async () => {
    const res = await POST(post({ ...VALIDO, consenso: false }));
    const body = (await res.json()) as { ok: boolean; code?: string };
    assert.equal(res.status, 400);
    assert.equal(body.code, "consenso-mancante");
  });

  it("rifiuta una richiesta senza recapito", async () => {
    const res = await POST(post({ ...VALIDO, email: undefined }));
    assert.equal((await res.json() as { code: string }).code, "contatto-mancante");
  });

  it("risponde ok al bot nell'honeypot, senza inviare nulla", async () => {
    const res = await POST(post({ ...VALIDO, azienda: "SEO Ltd" }));
    const body = (await res.json()) as { ok: boolean };
    // Finto successo VOLUTO: il bot non deve capire di essere stato scoperto. Nessuna email
    // parte — e infatti il provider non è nemmeno configurato.
    assert.equal(body.ok, true);
    assert.equal(res.status, 200);
  });

  it("rifiuta un JSON malformato", async () => {
    const res = await POST(post("{ rotto"));
    assert.equal(res.status, 400);
  });

  it("rifiuta un payload enorme", async () => {
    const res = await POST(post({ ...VALIDO, messaggio: "x".repeat(MAX_BODY_BYTES) }));
    assert.equal(res.status, 413);
  });

  it("limita le richieste ripetute dallo stesso IP", async () => {
    const ip = "203.0.113.9";
    const esiti: number[] = [];
    // LEAD_LIMIT è 5 in 10 minuti: il sesto invio deve essere respinto.
    for (let i = 0; i < 6; i++) esiti.push((await POST(post(VALIDO, ip))).status);

    assert.ok(!esiti.slice(0, 5).includes(429), `limite scattato troppo presto: ${esiti}`);
    assert.equal(esiti[5], 429, `il sesto invio doveva essere limitato: ${esiti}`);
  });

  it("gli errori non rivelano dettagli interni", async () => {
    const res = await POST(post({ ...VALIDO, consenso: false }));
    const serialized = JSON.stringify(await res.json());
    for (const leak of ["stack", "resend", "Bearer", "apiKey", "/Users/", "node_modules"]) {
      assert.ok(!serialized.toLowerCase().includes(leak.toLowerCase()), `errore espone "${leak}"`);
    }
  });
});

describe("GET /api/health", () => {
  it("riporta separatamente lo stato di ogni canale dell'assistente", async () => {
    const res = await HEALTH();
    const body = (await res.json()) as {
      integrations: { assistant: Record<string, unknown>; whatsappConfigured: unknown };
    };

    // Il programma chiede queste voci distinte. `whatsappConfigured` sta un livello più su:
    // WhatsApp è un canale del sito, non dell'assistente, e vale anche a chat spenta.
    for (const chiave of [
      "enabled",
      "providerConfigured",
      "leadEmailConfigured",
      "realsmartAvailable",
    ]) {
      assert.ok(chiave in body.integrations.assistant, `manca la voce ${chiave}`);
      assert.equal(
        typeof body.integrations.assistant[chiave],
        "boolean",
        `${chiave} non è un booleano`,
      );
    }
    assert.equal(typeof body.integrations.whatsappConfigured, "boolean");
  });

  it("dice quante voci di conoscenza sono approvate", async () => {
    const body = (await (await HEALTH()).json()) as {
      integrations: { assistant: { knowledgeVerifiedEntries: number } };
    };
    assert.equal(typeof body.integrations.assistant.knowledgeVerifiedEntries, "number");
  });

  it("non espone mai un valore segreto", async () => {
    const serialized = JSON.stringify(await (await HEALTH()).json());
    for (const leak of ["sk-", "Bearer", "ANTHROPIC_API_KEY", "re_", "@domustua.it"]) {
      assert.ok(!serialized.includes(leak), `health espone "${leak}"`);
    }
  });

  it("non viene mai messo in cache", async () => {
    const res = await HEALTH();
    assert.match(res.headers.get("cache-control") ?? "", /no-store/);
  });
});
