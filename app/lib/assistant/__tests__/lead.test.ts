// Canale email: validazione, antispam, composizione e invio.
//
// L'invio non tocca mai la rete: `sendLeadEmail` accetta una `fetch` iniettata, quindi
// successo, rifiuto del provider e timeout sono tutti riproducibili senza chiavi né costi.

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { composeLeadEmail } from "../lead/format";
import { deliver, sendLeadEmail } from "../lead/send";
import { validateLead } from "../lead/validate";
import { emailEnabled } from "../config";

const VALIDO = {
  nome: "Mario Rossi",
  email: "mario@example.com",
  messaggio: "Vorrei informazioni sulla villa con giardino a Tradate.",
  consenso: true as const,
};

describe("validazione della richiesta", () => {
  it("accetta una richiesta completa", () => {
    const result = validateLead(VALIDO);
    assert.equal(result.ok, true);
    assert.equal(result.ok && result.lead.nome, "Mario Rossi");
  });

  it("accetta il telefono al posto dell'email", () => {
    const result = validateLead({ ...VALIDO, email: undefined, telefono: "0331 844898" });
    assert.equal(result.ok, true);
  });

  it("richiede almeno un recapito", () => {
    const result = validateLead({ ...VALIDO, email: undefined });
    assert.equal(result.ok, false);
    assert.equal(!result.ok && result.code, "contatto-mancante");
  });

  it("rifiuta un'email malformata", () => {
    const result = validateLead({ ...VALIDO, email: "non-una-email" });
    assert.equal(!result.ok && result.code, "contatto-non-valido");
  });

  it("rifiuta un telefono che non è un telefono", () => {
    const result = validateLead({ ...VALIDO, email: undefined, telefono: "chiamami!" });
    assert.equal(!result.ok && result.code, "contatto-non-valido");
  });

  it("il consenso privacy è obbligatorio", () => {
    for (const consenso of [false, undefined, "sì", 1]) {
      const result = validateLead({ ...VALIDO, consenso });
      assert.equal(result.ok, false, `consenso accettato: ${String(consenso)}`);
    }
    assert.equal(
      (validateLead({ ...VALIDO, consenso: false }) as { code: string }).code,
      "consenso-mancante",
    );
  });

  it("richiede nome e messaggio", () => {
    assert.equal((validateLead({ ...VALIDO, nome: "" }) as { code: string }).code, "nome-mancante");
    assert.equal(
      (validateLead({ ...VALIDO, messaggio: "" }) as { code: string }).code,
      "messaggio-mancante",
    );
  });

  it("rifiuta i campi non previsti", () => {
    const result = validateLead({ ...VALIDO, ruolo: "admin" });
    assert.equal(result.ok, false);
  });

  it("rifiuta un messaggio oltre il limite", () => {
    const result = validateLead({ ...VALIDO, messaggio: "x".repeat(1501) });
    assert.equal(result.ok, false);
  });

  it("l'honeypot intercetta i bot in silenzio", () => {
    const result = validateLead({ ...VALIDO, azienda: "SEO Services Ltd" });
    assert.equal(result.ok, false);
    assert.equal(!result.ok && result.code, "sospetto");
    // `silenzioso` = rispondere con un finto successo: dirgli che è stato scoperto
    // insegnerebbe al bot come passare.
    assert.equal(!result.ok && result.silenzioso, true);
  });

  it("un messaggio pieno di link è spam", () => {
    const result = validateLead({
      ...VALIDO,
      messaggio: "Visita https://spam.xyz e anche http://altro.top e pure www.terzo.shop!",
    });
    assert.equal(!result.ok && result.code, "troppi-link");
    // NON silenzioso: una persona vera deve poter correggere, non veder sparire la richiesta.
    assert.equal(!result.ok && result.silenzioso, undefined);
  });

  it("un URL completo conta come UNO solo", () => {
    // Regressione: contando schema, "www." e dominio separatamente, un singolo link
    // legittimo valeva tre e la richiesta di un cliente vero spariva in silenzio.
    const result = validateLead({
      ...VALIDO,
      messaggio: "Ho visto questo annuncio: https://www.domustua.com/case/villa — è ancora libero?",
    });
    assert.equal(result.ok, true);
  });

  it("due link restano accettabili: si confrontano due immobili", () => {
    const result = validateLead({
      ...VALIDO,
      messaggio: "Confronto https://www.domustua.com/case/a e https://www.domustua.com/case/b",
    });
    assert.equal(result.ok, true);
  });

  it("rifiuta una pagina di origine non relativa", () => {
    assert.equal(validateLead({ ...VALIDO, pagePath: "https://evil.test" }).ok, false);
    assert.equal(validateLead({ ...VALIDO, pagePath: "//evil.test" }).ok, false);
    assert.equal(validateLead({ ...VALIDO, pagePath: "/case/villa" }).ok, true);
  });
});

describe("composizione dell'email", () => {
  const lead = { nome: "Mario Rossi", email: "mario@example.com", messaggio: "Buongiorno." };

  it("mette il cliente in reply-to, così Rispondi scrive a lui", () => {
    assert.equal(composeLeadEmail(lead).replyTo, "mario@example.com");
  });

  it("senza email del cliente non forza un reply-to", () => {
    const senzaEmail = { nome: "Mario", telefono: "0331 844898", messaggio: "Buongiorno." };
    assert.equal(composeLeadEmail(senzaEmail).replyTo, undefined);
  });

  it("include l'immobile con link assoluto quando c'è", () => {
    const email = composeLeadEmail(lead, {
      slug: "villa-giardino-tradate",
      title: "Villa con giardino",
      zone: "Tradate",
      price: "€ 280.000",
    });
    assert.match(email.subject, /Villa con giardino/);
    assert.match(email.text, /\/case\/villa-giardino-tradate/);
    assert.match(email.text, /^https?:\/\//m);
  });

  it("include la pagina di origine", () => {
    const email = composeLeadEmail({ ...lead, pagePath: "/case/villa-x" });
    assert.match(email.text, /Pagina di origine:.*\/case\/villa-x/);
  });

  it("dice esplicitamente che la conversazione non viene conservata", () => {
    assert.match(composeLeadEmail(lead).text, /non viene conservata/);
  });

  it("non allega mai la conversazione", () => {
    // Nel testo deve comparire solo ciò che l'utente ha scritto nel modulo.
    const email = composeLeadEmail({ ...lead, messaggio: "Solo questo." });
    assert.ok(!email.text.includes("assistente:"), "traccia di conversazione nell'email");
    assert.ok(!email.text.includes("utente:"), "traccia di conversazione nell'email");
  });
});

describe("consegna al provider", () => {
  const email = { subject: "Test", text: "Corpo", replyTo: "mario@example.com" };
  const config = { apiKey: "chiave-di-prova", from: "assistente@domustua.it", to: "immobiliare@domustua.it" };

  /** `fetch` finta: restituisce quel che decide il test e registra cosa è stato inviato. */
  function fakeFetch(response: Response | Error, captured?: { body?: Record<string, unknown> }) {
    return (async (_url: RequestInfo | URL, init?: RequestInit) => {
      if (captured) captured.body = JSON.parse(String(init?.body ?? "{}"));
      if (response instanceof Error) throw response;
      return response;
    }) as typeof fetch;
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

  it("dichiara successo solo con l'identificativo del provider", async () => {
    const result = await deliver(email, config, fakeFetch(json({ id: "msg_123" })));
    assert.deepEqual(result, { esito: "inviato", id: "msg_123" });
  });

  it("una risposta 200 senza id NON è un successo", async () => {
    // È il caso insidioso: la chiamata è andata bene ma non abbiamo conferma della presa in
    // carico. Dire "inviato" qui significherebbe perdere richieste senza accorgersene.
    const result = await deliver(email, config, fakeFetch(json({})));
    assert.equal(result.esito, "fallito");
  });

  it("un rifiuto del provider è un fallimento", async () => {
    const result = await deliver(email, config, fakeFetch(json({ message: "domain not verified" }, 403)));
    assert.equal(result.esito, "fallito");
  });

  it("un errore di rete è un fallimento, non un'eccezione", async () => {
    const result = await deliver(email, config, fakeFetch(new Error("ECONNRESET")));
    assert.equal(result.esito, "fallito");
  });

  it("invia al destinatario giusto, con reply-to al cliente", async () => {
    const captured: { body?: Record<string, unknown> } = {};
    await deliver(email, config, fakeFetch(json({ id: "msg_1" }), captured));

    assert.deepEqual(captured.body?.to, ["immobiliare@domustua.it"]);
    assert.equal(captured.body?.from, "assistente@domustua.it");
    assert.equal(captured.body?.reply_to, "mario@example.com");
  });

  it("senza email del cliente non manda un reply-to vuoto", async () => {
    const captured: { body?: Record<string, unknown> } = {};
    await deliver({ subject: "Test", text: "Corpo" }, config, fakeFetch(json({ id: "m" }), captured));
    assert.ok(!("reply_to" in (captured.body ?? {})));
  });

  it("non invia mai HTML: solo testo", async () => {
    const captured: { body?: Record<string, unknown> } = {};
    await deliver(email, config, fakeFetch(json({ id: "m" }), captured));
    assert.ok(!("html" in (captured.body ?? {})), "HTML nel corpo dell'email");
    assert.equal(typeof captured.body?.text, "string");
  });
});

describe("invio con la configurazione dell'ambiente", () => {
  it("senza chiave configurata non contatta il provider", async () => {
    // Stato di oggi in produzione: il canale email non è ancora configurato.
    assert.equal(emailEnabled, false, "questo test presuppone il canale email non configurato");

    let chiamato = false;
    const result = await sendLeadEmail({ subject: "T", text: "C" }, (async () => {
      chiamato = true;
      return new Response("{}");
    }) as typeof fetch);

    assert.equal(result.esito, "non-configurato");
    assert.equal(chiamato, false, "non deve contattare il provider senza chiave");
  });
});
