// Esegue il contract test sugli adattatori disponibili, più le regole della FABBRICA.
//
// Oggi c'è un solo adattatore (memoria). Quando arriverà quello Supabase basterà aggiungere una
// riga `runAreaRepositoryContract("supabase", …)`: il corpo dei test non si tocca, ed è
// esattamente ciò che rende il contratto utile.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { InMemoryAreaRepository } from "../memory";
import { readAreaStoreConfig, createAreaRepository } from "../config";
import { AreaStorageError } from "../repository";
import { runAreaRepositoryContract } from "./contract";

runAreaRepositoryContract("memoria", () => new InMemoryAreaRepository());

describe("fabbrica dello storage: in produzione o durevole, o si lancia", () => {
  /** Esegue `fn` con env sostituite, e ripristina sempre (anche se il test fallisce). */
  function withEnv(vars: Record<string, string | undefined>, fn: () => void): void {
    const previous: Record<string, string | undefined> = {};
    for (const [k, v] of Object.entries(vars)) {
      previous[k] = process.env[k];
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
    try {
      fn();
    } finally {
      for (const [k, v] of Object.entries(previous)) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
      }
    }
  }

  test("fuori produzione e senza credenziali: memoria", () => {
    withEnv(
      { VERCEL_ENV: undefined, TERRITORY_ENV: undefined, SUPABASE_URL: undefined, SUPABASE_SERVICE_ROLE_KEY: undefined },
      () => {
        assert.equal(readAreaStoreConfig().kind, "memory");
        assert.ok(createAreaRepository() instanceof InMemoryAreaRepository);
      },
    );
  });

  test("in produzione senza credenziali: LANCIA, non ripiega sulla memoria", () => {
    // È il caso che questo file esiste per difendere. Un ripiego silenzioso lascerebbe il sito
    // in piedi, l'editor ad approvare, e al primo riavvio dell'istanza tutto sparirebbe: nessun
    // errore, nessun log, nessuno che colleghi le due cose.
    withEnv(
      { VERCEL_ENV: "production", SUPABASE_URL: undefined, SUPABASE_SERVICE_ROLE_KEY: undefined },
      () => {
        assert.throws(() => createAreaRepository(), AreaStorageError);
        assert.throws(() => createAreaRepository(), /non configurato in produzione/);
      },
    );
  });

  test("con credenziali ma senza adattatore: LANCIA dicendo cosa manca", () => {
    // Meglio fallire qui, con un messaggio che nomina la migrazione da applicare, che alla
    // prima query su una tabella che non esiste.
    withEnv(
      { VERCEL_ENV: undefined, SUPABASE_URL: "https://esempio.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "chiave" },
      () => {
        assert.equal(readAreaStoreConfig().kind, "supabase");
        assert.throws(() => createAreaRepository(), /0002_area_schema\.sql/);
      },
    );
  });
});

describe("la migrazione dice in SQL ciò che il contratto dice in TypeScript", () => {
  const sql = readFileSync(join(process.cwd(), "supabase/migrations/0002_area_schema.sql"), "utf8");
  const down = readFileSync(
    join(process.cwd(), "supabase/migrations/0002_area_schema.down.sql"),
    "utf8",
  );

  test("ci sono tutte e otto le tabelle", () => {
    for (const table of [
      "area_profiles",
      "area_sources",
      "area_facts",
      "area_narratives",
      "property_area_contexts",
      "area_jobs",
      "area_review_events",
      "area_automation_runs",
    ]) {
      assert.match(sql, new RegExp(`create table if not exists ${table}\\b`), `manca ${table}`);
      assert.match(down, new RegExp(`drop table if exists ${table};`), `il rollback non elimina ${table}`);
    }
  });

  test("RLS attiva su ogni tabella, e nessuna policy pubblica", () => {
    // Il browser non deve poter parlare col database, nemmeno in lettura: la pagina legge dal
    // server. Una policy per anon sarebbe la porta da cui esce tutto il resto.
    const enabled = sql.match(/alter table\s+\w+\s+enable row level security/g) ?? [];
    assert.equal(enabled.length, 8, "RLS non attiva su tutte e otto le tabelle");
    assert.doesNotMatch(sql, /create policy/i, "nessuna policy: si passa solo da service_role");
  });

  test("nessun auto-approve: il vincolo esiste in database, non solo nel codice", () => {
    for (const c of ["ck_profile_approval", "ck_fact_approval", "ck_narrative_approval", "ck_ctx_approval"]) {
      assert.match(sql, new RegExp(c), `manca il vincolo ${c}`);
    }
  });

  test("la soglia di qualità vive anche in database", () => {
    // Così uno script che salta il gate applicativo non può comunque approvare un testo scarso.
    assert.match(sql, /quality_score is not null and quality_score >= 95/);
  });

  test("l'audit è immutabile per trigger, non per buona volontà", () => {
    assert.match(sql, /create trigger tr_area_events_immutable/);
    assert.match(sql, /before update or delete on area_review_events/);
  });

  test("l'idempotenza dei job è un vincolo di unicità, non una convenzione", () => {
    assert.match(sql, /idempotency_key\s+text not null unique/);
  });

  test("i duplicati dei fatti li ferma un indice unico", () => {
    assert.match(sql, /create unique index if not exists ux_area_fact_dedup/);
  });

  test("la vista pubblica non espone coordinate", () => {
    // Non è una comodità, è un confine: finché la lettura pubblica passa da qui, non esiste una
    // query che si porti dietro le coordinate private per distrazione.
    const view = sql.slice(sql.indexOf("create or replace view public_property_area"));
    const body = view.slice(0, view.indexOf(";"));
    assert.doesNotMatch(body, /private_origin_lat|private_origin_lng/);
    assert.match(sql, /revoke all on public_property_area from anon, authenticated/);
  });

  test("cancellare una fonte non fa sparire in silenzio i fatti che ne dipendono", () => {
    assert.match(sql, /source_id\s+uuid not null references area_sources \(id\) on delete restrict/);
  });

  test("una chiave d'area non può essere un'etichetta", () => {
    // Il vincolo è in database perché l'etichetta usata come chiave è esattamente il difetto
    // che questo lavoro ha appena tolto dal codice.
    assert.match(sql, /create or replace function area_key_is_canonical/);
    assert.match(sql, /constraint ck_profile_area_key\s+check \(area_key_is_canonical\(area_key\)\)/);
  });

  test("le migrazioni sono transazionali e reversibili", () => {
    for (const [name, src] of [["up", sql], ["down", down]] as const) {
      assert.match(src, /^begin;$/m, `${name}: manca begin`);
      assert.match(src, /^commit;$/m, `${name}: manca commit`);
    }
  });

  test("il file dichiara di NON essere applicato", () => {
    // Finché è vero, deve essere scritto: è la differenza fra "progetto dello schema" e
    // "stato del database".
    assert.match(sql, /NON APPLICATO/);
  });
});
