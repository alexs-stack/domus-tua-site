// Consegna dei lead — matrice di configurazione e reporting VERITIERO.
//
// Il modello (docs/lead-delivery.md): un lead del form segue due strade indipendenti —
//  • WhatsApp lato client: UX immediata, NON una consegna (è l'utente a premere invio);
//  • /api/lead lato server: email (Resend) e/o Google Sheet (SHEETS_WEBHOOK_URL).
// Il vecchio `leadBackend` ignorava l'email e chiamava WhatsApp un "backend": qui si verifica
// che demoStatus/checklist dicano la verità su cosa viene davvero recapitato.

import { test, describe, afterEach } from "node:test";
import assert from "node:assert/strict";

import { getDemoStatus, demoChecklist, type DemoStatus } from "../demoStatus";

const ORIG_SHEET = process.env.SHEETS_WEBHOOK_URL;
afterEach(() => {
  if (ORIG_SHEET === undefined) delete process.env.SHEETS_WEBHOOK_URL;
  else process.env.SHEETS_WEBHOOK_URL = ORIG_SHEET;
});

// DemoStatus minimale per esercitare la sola riga "Lead" della checklist.
function status(over: Partial<DemoStatus>): DemoStatus {
  return {
    previewBadge: false,
    i18nEnabled: false,
    logoConfigured: true,
    listingsMode: "realsmart",
    trustindexLive: false,
    heroVideoLive: false,
    leadEmailConfigured: false,
    leadSheetConfigured: false,
    searchAiConfigured: false,
    semanticRankingConfigured: false,
    ...over,
  };
}

function leadRow(s: DemoStatus) {
  const row = demoChecklist(s).find((r) => r.label === "Lead");
  assert.ok(row, "manca la riga Lead nella checklist");
  return row;
}

describe("checklist Lead — matrice email × sheet, veritiera", () => {
  test("né email né sheet → 'Solo WhatsApp (nessuna consegna server)', non ok", () => {
    const row = leadRow(status({ leadEmailConfigured: false, leadSheetConfigured: false }));
    assert.match(row.value, /Solo WhatsApp/);
    assert.equal(row.ok, false, "senza email né sheet il lead NON è consegnato lato server");
  });

  test("solo email → 'Email', ok", () => {
    const row = leadRow(status({ leadEmailConfigured: true, leadSheetConfigured: false }));
    assert.equal(row.value, "Email");
    assert.equal(row.ok, true);
  });

  test("solo sheet → 'Google Sheet', ok (il lead arriva comunque lato server)", () => {
    const row = leadRow(status({ leadEmailConfigured: false, leadSheetConfigured: true }));
    assert.equal(row.value, "Google Sheet");
    assert.equal(row.ok, true);
  });

  test("email + sheet → 'Email + Google Sheet', ok", () => {
    const row = leadRow(status({ leadEmailConfigured: true, leadSheetConfigured: true }));
    assert.equal(row.value, "Email + Google Sheet");
    assert.equal(row.ok, true);
  });

  test("WhatsApp non compare come consegna quando c'è una consegna reale", () => {
    const row = leadRow(status({ leadEmailConfigured: true }));
    assert.ok(!/WhatsApp/.test(row.value), "WhatsApp non è una consegna: non deve etichettare l'email");
  });
});

describe("getDemoStatus — leadSheetConfigured segue SHEETS_WEBHOOK_URL", () => {
  test("SHEETS_WEBHOOK_URL vuota → leadSheetConfigured false", () => {
    delete process.env.SHEETS_WEBHOOK_URL;
    assert.equal(getDemoStatus().leadSheetConfigured, false);
  });

  test("SHEETS_WEBHOOK_URL impostata → leadSheetConfigured true", () => {
    process.env.SHEETS_WEBHOOK_URL = "https://script.google.com/macros/s/AKfy.../exec";
    assert.equal(getDemoStatus().leadSheetConfigured, true);
  });

  test("leadEmailConfigured è un booleano (canale Resend condiviso con l'assistente)", () => {
    assert.equal(typeof getDemoStatus().leadEmailConfigured, "boolean");
  });
});
