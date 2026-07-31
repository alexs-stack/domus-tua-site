// Lead capture — email, WhatsApp, sicurezza.
//
// Copre il contratto che il form promette all'utente: la conferma appare SOLO se il provider
// email ha accettato il messaggio, e in ogni altro caso restano WhatsApp e telefono. Include
// anche la regressione "nessun Google Sheet": il vecchio backend non deve poter rientrare.
//
// Il provider non viene mai chiamato davvero: `globalThis.fetch` è sostituito da uno stub
// (Resend usa la fetch globale), così i test sono deterministici e offline.

import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { validateLead, type ValidatedLead } from "../forms/validateLead";
import {
  formatLeadEmail,
  getEmailLeadConfig,
  isEmailLeadConfigured,
  replyToFrom,
  sendLeadEmail,
  DEFAULT_LEAD_RECIPIENT,
} from "../forms/email";
import {
  buildWhatsAppUrl,
  buyerSearchWhatsAppMessage,
  listingWhatsAppMessage,
  listingWhatsAppUrl,
  soldListingWhatsAppMessage,
} from "../forms/whatsapp";
import { formatLeadMessage } from "../forms/lead";
import { site, siteUrl } from "../site";
import { rateLimit, LEAD_LIMIT } from "../security/rateLimit";
import { POST } from "../../api/lead/route";

const FIXED_NOW = new Date("2026-03-14T09:30:00.000Z");

/** Payload minimo valido: intento, nome, contatto, consenso. */
function payload(over: Record<string, unknown> = {}) {
  return { intent: "seller", name: "Maria Rossi", contact: "maria@example.it", consent: true, ...over };
}

/** Lead validato dalla fixture: fallisce subito se la fixture non è valida. */
function lead(over: Record<string, unknown> = {}): ValidatedLead {
  const r = validateLead(payload(over));
  if (!r.ok) throw new Error(`fixture non valida: ${r.error}`);
  return r.lead;
}

// ── stub del provider ─────────────────────────────────────────────────────────────────
const realFetch = globalThis.fetch;
let sentRequests: { url: string; body: Record<string, unknown> }[] = [];

function stubProvider(response: { status: number; body: unknown }) {
  process.env.RESEND_API_KEY = "re_test_key";
  process.env.LEAD_FROM_EMAIL = "sito@domustua.it";
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    sentRequests.push({ url, body: JSON.parse(String(init?.body ?? "{}")) });
    return new Response(JSON.stringify(response.body), {
      status: response.status,
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;
}

function unconfigureProvider() {
  delete process.env.RESEND_API_KEY;
  delete process.env.LEAD_FROM_EMAIL;
}

beforeEach(() => {
  sentRequests = [];
  unconfigureProvider();
});

afterEach(() => {
  globalThis.fetch = realFetch;
  unconfigureProvider();
});

/** Richiesta verso /api/lead con un IP dedicato, così i test non si rubano il rate limit. */
function leadRequest(body: unknown, ip: string): Request {
  return new Request("https://domustua.test/api/lead", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

// ══════════════════════════════════════════════════════════════════════════════════════

describe("destinatario e recapiti", () => {
  test("l'email del sito è la casella indicata dal cliente", () => {
    assert.equal(site.email.label, "immobiliare@domustua.it");
    assert.equal(site.email.href, "mailto:immobiliare@domustua.it");
  });

  test("il destinatario di default dei lead è la stessa casella", () => {
    assert.equal(DEFAULT_LEAD_RECIPIENT, "immobiliare@domustua.it");
    assert.equal(getEmailLeadConfig().to, "immobiliare@domustua.it");
  });

  test("il WhatsApp Business è quello indicato dal cliente", () => {
    assert.match(site.whatsapp.href, /wa\.me\/393466042314\b/);
    assert.equal(site.whatsapp.label, "346 6042314");
  });

  test("la chiamata diretta resta disponibile", () => {
    assert.equal(site.phone.href, "tel:+390331844898");
  });
});

describe("validazione del payload", () => {
  test("accetta un lead minimo valido", () => {
    assert.equal(validateLead(payload()).ok, true);
  });

  test("rifiuta un intento sconosciuto", () => {
    assert.deepEqual(validateLead(payload({ intent: "hacker" })), { ok: false, error: "invalid-intent" });
  });

  test("rifiuta nome o contatto mancanti", () => {
    assert.deepEqual(validateLead(payload({ name: "   " })), { ok: false, error: "missing-name" });
    assert.deepEqual(validateLead(payload({ contact: "" })), { ok: false, error: "missing-contact" });
  });

  test("il consenso privacy è obbligatorio anche senza il form", () => {
    // Regressione: prima il consenso era facoltativo lato server e una POST diretta poteva
    // far partire un'email senza consenso registrato.
    const noConsent: Record<string, unknown> = payload();
    delete noConsent.consent;
    assert.deepEqual(validateLead(noConsent), { ok: false, error: "missing-consent" });
    assert.deepEqual(validateLead(payload({ consent: false })), { ok: false, error: "missing-consent" });
  });

  test("scarta i campi non previsti", () => {
    const r = validateLead(payload({ role: "admin", isAdmin: true }));
    assert.equal(r.ok, true);
    if (!r.ok) return;
    assert.equal("role" in r.lead, false);
    assert.equal("isAdmin" in r.lead, false);
  });

  test("tronca i campi abnormi invece di rompersi", () => {
    const r = validateLead(payload({ message: "x".repeat(50_000) }));
    assert.equal(r.ok, true);
    if (!r.ok) return;
    assert.ok((r.lead.message ?? "").length <= 1200);
  });

  test("gli a capo nel nome non possono spezzare l'oggetto dell'email", () => {
    const l = lead({ name: "Maria\r\nBcc: spam@evil.tld" });
    assert.doesNotMatch(l.name, /[\r\n]/);
    assert.doesNotMatch(formatLeadEmail(l, FIXED_NOW).subject, /[\r\n]/);
  });

  test("gli a capo restano nel messaggio libero", () => {
    assert.equal(lead({ message: "Prima riga\nSeconda riga" }).message, "Prima riga\nSeconda riga");
  });
});

describe("corpo dell'email", () => {
  test("porta i dati che servono all'agenzia per richiamare", () => {
    const { subject, text } = formatLeadEmail(
      lead({
        intent: "buyer",
        contact: "333 1234567",
        place: "Tradate",
        propertyType: "Trilocale",
        budget: "fino a 250.000 €",
        message: "Vorrei una visita nel weekend.",
        sourcePage: "/case/villa-tradate",
        propertySlug: "villa-tradate",
      }),
      FIXED_NOW,
    );

    assert.match(subject, /Cerca casa/);
    assert.match(subject, /Maria Rossi/);
    assert.match(text, /Tipo di richiesta: Cerca casa/);
    assert.match(text, /Nome: Maria Rossi/);
    assert.match(text, /Contatto: 333 1234567/);
    assert.match(text, /Vorrei una visita nel weekend\./);
    assert.ok(text.includes(`${siteUrl}/case/villa-tradate`), "manca l'URL dell'immobile");
    assert.match(text, /Pagina di origine: /);
    assert.match(text, /Data e ora: /);
  });

  test("non inventa righe per i campi non forniti", () => {
    const { text } = formatLeadEmail(lead(), FIXED_NOW);
    for (const label of ["Budget:", "Tipologia:", "Caratteristiche:", "Immobile:", "Messaggio:"]) {
      assert.ok(!text.includes(label), `riga "${label}" presente senza dato`);
    }
  });

  test("reply-to solo quando il contatto è un'email", () => {
    assert.equal(replyToFrom("maria@example.it"), "maria@example.it");
    assert.equal(replyToFrom("chiamatemi a maria@example.it grazie"), "maria@example.it");
    assert.equal(replyToFrom("333 1234567"), undefined);
    assert.equal(replyToFrom(""), undefined);
  });
});

describe("invio al provider", () => {
  test("email consegnata: reply-to impostato e destinatario corretto", async () => {
    stubProvider({ status: 200, body: { id: "email_123" } });
    const result = await sendLeadEmail(lead(), FIXED_NOW);
    assert.deepEqual(result, { ok: true, id: "email_123" });

    assert.equal(sentRequests.length, 1);
    const body = sentRequests[0].body as Record<string, unknown>;
    assert.equal(body.to, "immobiliare@domustua.it");
    assert.equal(body.from, "sito@domustua.it");
    assert.equal(body.reply_to ?? body.replyTo, "maria@example.it");
    assert.ok(String(body.text).includes("Maria Rossi"));
    assert.equal(body.html, undefined, "il corpo deve restare in testo semplice");
  });

  test("contatto telefonico: nessun reply-to inventato", async () => {
    stubProvider({ status: 200, body: { id: "email_124" } });
    await sendLeadEmail(lead({ contact: "333 1234567" }), FIXED_NOW);
    const body = sentRequests[0].body as Record<string, unknown>;
    assert.equal(body.reply_to ?? body.replyTo, undefined);
  });

  test("provider non configurato: nessuna chiamata, esito esplicito", async () => {
    const result = await sendLeadEmail(lead(), FIXED_NOW);
    assert.deepEqual(result, { ok: false, reason: "not-configured" });
    assert.equal(sentRequests.length, 0);
  });

  test("errore del provider: mai un falso successo", async () => {
    stubProvider({ status: 422, body: { name: "validation_error", message: "invalid from" } });
    assert.deepEqual(await sendLeadEmail(lead(), FIXED_NOW), { ok: false, reason: "provider-error" });
  });

  test("provider irraggiungibile: errore gestito, niente eccezione", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.LEAD_FROM_EMAIL = "sito@domustua.it";
    globalThis.fetch = (async () => {
      throw new Error("ECONNREFUSED");
    }) as typeof fetch;
    assert.deepEqual(await sendLeadEmail(lead(), FIXED_NOW), { ok: false, reason: "provider-error" });
  });

  test("senza chiavi il provider risulta non configurato", () => {
    assert.equal(isEmailLeadConfigured(), false);
  });
});

describe("/api/lead", () => {
  test("consegna: 200 e ok:true", async () => {
    stubProvider({ status: 200, body: { id: "email_200" } });
    const res = await POST(leadRequest(payload(), "10.0.0.1"));
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { ok: true });
    assert.equal(sentRequests.length, 1);
  });

  test("provider non configurato: 503 not-configured, nessun falso successo", async () => {
    const res = await POST(leadRequest(payload(), "10.0.0.2"));
    assert.equal(res.status, 503);
    assert.deepEqual(await res.json(), { ok: false, reason: "not-configured" });
  });

  test("errore del provider: 502 provider-error", async () => {
    stubProvider({ status: 500, body: { name: "application_error", message: "boom" } });
    const res = await POST(leadRequest(payload(), "10.0.0.3"));
    assert.equal(res.status, 502);
    assert.deepEqual(await res.json(), { ok: false, reason: "provider-error" });
  });

  test("payload invalido: 400 e nessuna email", async () => {
    stubProvider({ status: 200, body: { id: "email_x" } });
    const res = await POST(leadRequest(payload({ name: "" }), "10.0.0.4"));
    assert.equal(res.status, 400);
    assert.equal((await res.json()).reason, "invalid");
    assert.equal(sentRequests.length, 0);
  });

  test("consenso mancante: 400 e nessuna email", async () => {
    stubProvider({ status: 200, body: { id: "email_x" } });
    const body: Record<string, unknown> = payload();
    delete body.consent;
    const res = await POST(leadRequest(body, "10.0.0.5"));
    assert.equal(res.status, 400);
    assert.equal((await res.json()).error, "missing-consent");
    assert.equal(sentRequests.length, 0);
  });

  test("spam (honeypot): risposta ok ma nessuna email spedita", async () => {
    stubProvider({ status: 200, body: { id: "email_x" } });
    const res = await POST(leadRequest(payload({ company: "Acme Bots" }), "10.0.0.6"));
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { ok: true });
    assert.equal(sentRequests.length, 0, "il bot non deve generare email");
  });

  test("payload enorme: rifiutato prima del parsing", async () => {
    stubProvider({ status: 200, body: { id: "email_x" } });
    const req = new Request("https://domustua.test/api/lead", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": "10.0.0.7",
        "content-length": "500000",
      },
      body: JSON.stringify(payload()),
    });
    const res = await POST(req);
    assert.equal(res.status, 413);
    assert.equal(sentRequests.length, 0);
  });

  test("rate limit: dopo la soglia risponde 429 con retry-after", async () => {
    stubProvider({ status: 200, body: { id: "email_x" } });
    const ip = "10.0.0.8";
    for (let i = 0; i < LEAD_LIMIT.limit; i++) {
      const ok = await POST(leadRequest(payload(), ip));
      assert.equal(ok.status, 200, `richiesta ${i + 1} bloccata troppo presto`);
    }
    const blocked = await POST(leadRequest(payload(), ip));
    assert.equal(blocked.status, 429);
    assert.deepEqual(await blocked.json(), { ok: false, reason: "rate-limited" });
    assert.ok(Number(blocked.headers.get("retry-after")) > 0);
  });
});

describe("link WhatsApp", () => {
  test("il testo è codificato e gli altri parametri restano", () => {
    const url = buildWhatsAppUrl("https://wa.me/393466042314?text=vecchio&x=1", "ciao & addio");
    assert.ok(url.startsWith("https://wa.me/393466042314?"));
    assert.match(url, /x=1/);
    assert.match(url, /text=ciao%20%26%20addio/);
    assert.equal(url.match(/text=/g)?.length, 1, "il vecchio text non è stato sostituito");
  });

  test("il fragment non viene corrotto", () => {
    assert.ok(buildWhatsAppUrl("https://wa.me/393466042314#frag", "ciao").endsWith("#frag"));
  });

  test("la scheda immobile porta titolo, riferimento e URL", () => {
    const msg = listingWhatsAppMessage({ slug: "villa-tradate", title: "Villa con giardino", ref: "1043" });
    assert.match(msg, /Villa con giardino/);
    assert.match(msg, /rif\. 1043/);
    assert.ok(msg.includes(`${siteUrl}/case/villa-tradate`), "manca l'URL della scheda");
  });

  test("senza riferimento commerciale non si inventa un rif.", () => {
    assert.doesNotMatch(
      listingWhatsAppMessage({ slug: "villa-tradate", title: "Villa con giardino" }),
      /rif\./,
    );
  });

  test("l'immobile venduto propone una casa simile, con l'URL", () => {
    const msg = soldListingWhatsAppMessage({ slug: "villa-tradate", title: "Villa con giardino" });
    assert.match(msg, /venduto/);
    assert.ok(msg.includes(`${siteUrl}/case/villa-tradate`));
  });

  test("l'URL della scheda finisce codificato nel link", () => {
    const url = listingWhatsAppUrl({ slug: "villa-tradate", title: "Villa" });
    assert.ok(url.includes(encodeURIComponent(`${siteUrl}/case/villa-tradate`)));
  });

  test("i form generali portano il tipo di richiesta", () => {
    assert.match(buyerSearchWhatsAppMessage("villa a Tradate"), /Cerca casa/);
    assert.match(buyerSearchWhatsAppMessage("villa a Tradate"), /villa a Tradate/);
    assert.match(buyerSearchWhatsAppMessage(), /Cerca casa/);
  });

  test("il messaggio del form porta il tipo di richiesta e l'URL dell'immobile", () => {
    const msg = formatLeadMessage({
      intent: "buyer",
      name: "Maria",
      contact: "maria@example.it",
      propertySlug: "villa-tradate",
    });
    assert.match(msg, /Cerca casa/);
    assert.ok(msg.includes(`${siteUrl}/case/villa-tradate`));
  });

  test("il form non apre WhatsApp al posto dell'invio, né dichiara un messaggio inviato", () => {
    // Regressione: il submit apriva WhatsApp e mostrava comunque la conferma, anche quando
    // il backend non aveva salvato nulla. WhatsApp lo apre l'utente, dal ramo di errore.
    const contact = fs.readFileSync(path.join(process.cwd(), "app", "components", "Contact.tsx"), "utf8");
    assert.doesNotMatch(contact, /window\.open\(/);
    assert.match(contact, /await submitLead\(lead\)/);
    assert.match(contact, /if \(result\.ok\)/);
  });
});

describe("rate limit", () => {
  test("blocca oltre la soglia e dice quando riprovare", () => {
    const key = "test:lead:diretto";
    for (let i = 0; i < LEAD_LIMIT.limit; i++) {
      assert.equal(rateLimit(key, LEAD_LIMIT).ok, true, `richiesta ${i + 1} bloccata troppo presto`);
    }
    const blocked = rateLimit(key, LEAD_LIMIT);
    assert.equal(blocked.ok, false);
    if (blocked.ok) return;
    assert.ok(blocked.retryAfterSeconds > 0);
  });
});

describe("regressione: nessun backend Google Sheets / CRM", () => {
  const sources: string[] = [];
  (function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === "__tests__" || entry.name === "__fixtures__") continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.tsx?$/.test(entry.name)) sources.push(full);
    }
  })(path.join(process.cwd(), "app"));

  for (const needle of ["SHEETS_WEBHOOK_URL", "CONTACT_FORM_MODE", "Apps Script", "Google Sheet"]) {
    test(`"${needle}" non compare nel codice`, () => {
      const hits = sources.filter((f) => fs.readFileSync(f, "utf8").includes(needle));
      assert.deepEqual(
        hits.map((f) => path.relative(process.cwd(), f)),
        [],
        "il backend a foglio di calcolo è rientrato: il lead va solo via email",
      );
    });
  }

  test("il tipo LeadBackend ammette solo email", () => {
    const src = fs.readFileSync(path.join(process.cwd(), "app", "lib", "demoStatus.ts"), "utf8");
    assert.match(src, /export type LeadBackend = "email";/);
  });

  test("/api/lead spedisce email e non inoltra a webhook esterni", () => {
    const route = fs.readFileSync(path.join(process.cwd(), "app", "api", "lead", "route.ts"), "utf8");
    assert.match(route, /sendLeadEmail/);
    assert.doesNotMatch(route, /fetch\(/, "la route non deve inoltrare il lead a un endpoint esterno");
  });
});
