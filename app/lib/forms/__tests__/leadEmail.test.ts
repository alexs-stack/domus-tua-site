// Notifica email del lead (composizione + trasporto Resend riusato).
//
// La composizione è pura e si verifica sul contenuto. Il trasporto si verifica
// col `fetch` INIETTATO — successo, rifiuto del provider, rete caduta — senza
// chiave reale e senza contattare nessuno.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { composeContactLeadEmail, notifyLeadByEmail } from "../leadEmail";
import { deliver } from "../../assistant/lead/send";
import type { ValidatedLead } from "../validateLead";

const LEAD: ValidatedLead = {
  intent: "seller",
  name: "Maria Rossi",
  phone: "333 1234567",
  email: "maria@example.com",
  place: "Tradate",
  surface: "120",
  timing: "Entro 3 mesi",
  message: "Vorrei vendere il mio trilocale.",
  consent: true,
};

describe("composeContactLeadEmail — contenuto", () => {
  test("include nome, recapiti e i campi valorizzati; reply-to = email", () => {
    const email = composeContactLeadEmail(LEAD);
    assert.match(email.subject, /Maria Rossi/);
    assert.match(email.text, /Telefono: 333 1234567/);
    assert.match(email.text, /Email: maria@example\.com/);
    assert.match(email.text, /Superficie: 120 m²/);
    assert.match(email.text, /Tempistica: Entro 3 mesi/);
    assert.match(email.text, /Vorrei vendere il mio trilocale\./);
    assert.equal(email.replyTo, "maria@example.com");
  });

  test("i campi assenti non lasciano righe vuote o etichette orfane", () => {
    const email = composeContactLeadEmail({ intent: "question", name: "Luca", phone: "3331112223", consent: true });
    assert.doesNotMatch(email.text, /Email:/);
    assert.doesNotMatch(email.text, /Superficie:/);
    assert.doesNotMatch(email.text, /Budget:/);
    // Senza email non c'è reply-to.
    assert.equal(email.replyTo, undefined);
  });

  test("solo `contact` (candidatura): appare come recapito, senza duplicare telefono/email", () => {
    const email = composeContactLeadEmail({ intent: "career", name: "Ada", contact: "ada@x.it", consent: true });
    assert.match(email.text, /Contatto: ada@x\.it/);
    assert.doesNotMatch(email.text, /Telefono:/);
  });
});

describe("trasporto — fetch iniettato, nessuna chiave reale", () => {
  const config = { apiKey: "test-key", from: "sito@domustua.it", to: "immobiliare@domustua.it" };

  test("il provider conferma con id → inviato", async () => {
    const fakeFetch = (async () =>
      new Response(JSON.stringify({ id: "em_123" }), { status: 200 })) as unknown as typeof fetch;
    const res = await deliver(composeContactLeadEmail(LEAD), config, fakeFetch);
    assert.deepEqual(res, { esito: "inviato", id: "em_123" });
  });

  test("il provider rifiuta (HTTP 422) → fallito", async () => {
    const fakeFetch = (async () => new Response("no", { status: 422 })) as unknown as typeof fetch;
    const res = await deliver(composeContactLeadEmail(LEAD), config, fakeFetch);
    assert.equal(res.esito, "fallito");
  });

  test("la rete cade → fallito (mai un falso successo)", async () => {
    const fakeFetch = (async () => {
      throw new Error("ECONNREFUSED");
    }) as unknown as typeof fetch;
    const res = await deliver(composeContactLeadEmail(LEAD), config, fakeFetch);
    assert.equal(res.esito, "fallito");
  });
});

describe("notifyLeadByEmail — senza chiave configurata (stato di produzione oggi)", () => {
  test("non contatta nessun provider e dichiara non-configurato", async () => {
    let called = false;
    const spyFetch = (async () => {
      called = true;
      return new Response("{}", { status: 200 });
    }) as unknown as typeof fetch;
    const res = await notifyLeadByEmail(LEAD, spyFetch);
    // Senza ASSISTANT_EMAIL_API_KEY il canale non esiste: nessuna consegna.
    assert.equal(res.esito, "non-configurato");
    assert.equal(called, false, "senza chiave non si deve mai contattare il provider");
  });
});
