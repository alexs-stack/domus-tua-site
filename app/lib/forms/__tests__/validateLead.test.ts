// Validazione/sanitizzazione lato server del lead (app/lib/forms/validateLead.ts).
//
// Copre i requisiti del form contatti rinnovato: telefono ed email distinti,
// almeno un recapito, formati plausibili, superficie e tempistica, whitelist e
// cap di lunghezza, consenso, payload malformati.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { validateLead } from "../validateLead";

const BASE = {
  intent: "seller" as const,
  name: "Maria Rossi",
  phone: "333 1234567",
  consent: true,
};

describe("validateLead — recapiti telefono/email distinti", () => {
  test("lead valido con telefono passa e viene ripulito", () => {
    const r = validateLead(BASE);
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.equal(r.lead.phone, "333 1234567");
      assert.equal(r.lead.email, undefined);
      assert.equal(r.lead.name, "Maria Rossi");
    }
  });

  test("lead valido con la sola email passa", () => {
    const r = validateLead({ ...BASE, phone: undefined, email: "maria@example.com" });
    assert.equal(r.ok, true);
    if (r.ok) assert.equal(r.lead.email, "maria@example.com");
  });

  test("senza NÉ telefono NÉ email: missing-contact", () => {
    const r = validateLead({ ...BASE, phone: undefined, email: undefined });
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.error, "missing-contact");
  });

  test("email malformata: invalid-email", () => {
    // Ultimo caso: TLD di una sola lettera — non esiste, e prima passava.
    for (const bad of ["maria", "maria@", "@example.com", "maria@example", "a b@c.it", "maria@example.c"]) {
      const r = validateLead({ ...BASE, phone: undefined, email: bad });
      assert.equal(r.ok, false, bad);
      if (!r.ok) assert.equal(r.error, "invalid-email", bad);
    }
  });

  test("telefono malformato: invalid-phone", () => {
    for (const bad of ["12345", "abc", "++39", "chiamami"]) {
      const r = validateLead({ ...BASE, phone: bad, email: undefined });
      assert.equal(r.ok, false, bad);
      if (!r.ok) assert.equal(r.error, "invalid-phone", bad);
    }
  });

  test("telefoni plausibili passano (spazi, trattini, prefisso +)", () => {
    for (const ok of ["333 1234567", "+39 0331 123456", "0331-123456", "(0331) 123456"]) {
      const r = validateLead({ ...BASE, phone: ok, email: undefined });
      assert.equal(r.ok, true, ok);
    }
  });

  test("il form candidature resta compatibile: `contact` combinato è un recapito valido", () => {
    const r = validateLead({ intent: "career", name: "Luca", contact: "333 111 · luca@x.it", consent: true });
    assert.equal(r.ok, true);
    if (r.ok) assert.equal(r.lead.contact, "333 111 · luca@x.it");
  });
});

describe("validateLead — campi obbligatori e consenso", () => {
  test("senza nome: missing-name", () => {
    const r = validateLead({ ...BASE, name: "   " });
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.error, "missing-name");
  });

  test("consenso presente ma false: missing-consent", () => {
    const r = validateLead({ ...BASE, consent: false });
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.error, "missing-consent");
  });

  test("consenso ASSENTE (POST diretta che salta il form): missing-consent", () => {
    // Il buco storico: un campo mancante passava. Il confine è il server, non il form.
    const { consent: _omit, ...noConsent } = BASE;
    void _omit;
    const r = validateLead(noConsent);
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.error, "missing-consent");
  });

  test("consenso non booleano: nessuna coercizione, missing-consent", () => {
    // Né la stringa "true", né i valori truthy (1, "on"): solo il booleano true.
    for (const bad of ["true", "on", 1, "1", "yes", {}, [true]]) {
      const r = validateLead({ ...BASE, consent: bad });
      assert.equal(r.ok, false, JSON.stringify(bad));
      if (!r.ok) assert.equal(r.error, "missing-consent", JSON.stringify(bad));
    }
  });

  test("consenso true: passa, e il lead validato lo porta con sé", () => {
    const r = validateLead(BASE);
    assert.equal(r.ok, true);
    if (r.ok) assert.equal(r.lead.consent, true);
  });

  test("ogni intento ammesso passa con consenso e un recapito", () => {
    for (const intent of ["seller", "buyer", "question", "open-domus", "career"] as const) {
      const r = validateLead({ intent, name: "Maria Rossi", phone: "333 1234567", consent: true });
      assert.equal(r.ok, true, intent);
      if (r.ok) assert.equal(r.lead.intent, intent);
    }
  });

  test("intento fuori lista: invalid-intent", () => {
    const r = validateLead({ ...BASE, intent: "hacker" });
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.error, "invalid-intent");
  });
});

describe("validateLead — payload malformati", () => {
  test("non-oggetto: bad-payload", () => {
    for (const bad of [null, undefined, "stringa", 42, true]) {
      const r = validateLead(bad);
      assert.equal(r.ok, false);
      if (!r.ok) assert.equal(r.error, "bad-payload");
    }
  });

  test("campi ignoti scartati (no injection), campi noti mantenuti", () => {
    const r = validateLead({
      ...BASE,
      email: "maria@example.com",
      evil: "<script>",
      "=IMPORTRANGE": "attacco al foglio",
      place: "Tradate",
    });
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.equal(r.lead.place, "Tradate");
      assert.ok(!("evil" in r.lead));
      assert.ok(!("=IMPORTRANGE" in r.lead));
    }
  });

  test("superficie: tiene solo le cifre, i m² li mette la presentazione", () => {
    const r = validateLead({ ...BASE, surface: "120 m²" });
    assert.equal(r.ok, true);
    if (r.ok) assert.equal(r.lead.surface, "120");
  });

  test("tempistica passa come etichetta", () => {
    const r = validateLead({ ...BASE, timing: "Entro 3 mesi" });
    assert.equal(r.ok, true);
    if (r.ok) assert.equal(r.lead.timing, "Entro 3 mesi");
  });

  test("cap di lunghezza: un messaggio abnorme viene troncato, non rifiutato", () => {
    const r = validateLead({ ...BASE, message: "x".repeat(5000) });
    assert.equal(r.ok, true);
    if (r.ok) assert.ok((r.lead.message?.length ?? 0) <= 1200);
  });
});
