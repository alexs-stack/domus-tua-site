// Adattatore Supabase — stato "progettato, non attivato" + percorso di integrazione OPT-IN.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { createSupabaseTerritoryRepository } from "../supabase";
import { TerritoryStorageError } from "../repository";

describe("Supabase: fail-safe finché non attivato", () => {
  test("senza credenziali → errore di configurazione (mai storage effimero)", () => {
    assert.throws(() => createSupabaseTerritoryRepository({}), TerritoryStorageError);
  });

  test("con credenziali → errore 'non ancora attivato' (nessuno crede sia attivo)", () => {
    assert.throws(
      () => createSupabaseTerritoryRepository({ url: "https://x.supabase.co", serviceRoleKey: "k" }),
      /non ancora attivato|autorizzazione/i,
    );
  });
});

// Percorso di integrazione REALE: gira SOLO se sono fornite credenziali di test esplicite
// (TERRITORY_SUPABASE_TEST_URL + _KEY). Altrimenti è saltato — nessun accesso a servizi esterni in CI.
describe("Supabase: contratto reale (opt-in)", () => {
  const url = process.env.TERRITORY_SUPABASE_TEST_URL;
  const key = process.env.TERRITORY_SUPABASE_TEST_KEY;
  test("integrazione contro un progetto di test", { skip: !url || !key }, () => {
    // Quando l'adattatore sarà implementato (post-approvazione), qui si eseguirà il contract test
    // completo contro un progetto Supabase dedicato ai test. Finché non è implementato, resta skip.
    assert.fail("adattatore Supabase non ancora implementato — vedi ADR-004");
  });
});
