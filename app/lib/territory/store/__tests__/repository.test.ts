// Esegue il contract test identico su memoria e filesystem (adattatore reale su disco temporaneo).

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { MemoryTerritoryRepository } from "../memory";
import { FilesystemTerritoryRepository, LISTINGS_FILE } from "../filesystem";
import { JsonTerritoryRepository } from "../json";
import { TerritoryStorageError, type TerritoryRepository } from "../repository";
import { runRepositoryContract, makeRecord } from "./contract";

// ── Contratto: memoria ────────────────────────────────────────────────────────
runRepositoryContract("memory", async () => ({ repo: new MemoryTerritoryRepository() }));

// ── Contratto: filesystem (cartella temporanea, ripulita dopo ogni test) ───────
runRepositoryContract("filesystem", async () => {
  const dir = mkdtempSync(join(tmpdir(), "territory-store-"));
  return {
    repo: new FilesystemTerritoryRepository(dir),
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  };
});

// ── Specifico del filesystem: persistenza reale e determinismo del file ────────
describe("filesystem — dettagli su disco", () => {
  test("scrive un file JSON ordinato per chiave e persistente tra istanze", async () => {
    const dir = mkdtempSync(join(tmpdir(), "territory-fs-"));
    try {
      const a = new FilesystemTerritoryRepository(dir);
      await a.putListingEnrichment(makeRecord("2010"));
      await a.putListingEnrichment(makeRecord("1043"));

      const path = join(dir, LISTINGS_FILE);
      assert.equal(existsSync(path), true);
      const keys = Object.keys(JSON.parse(readFileSync(path, "utf8")));
      assert.deepEqual(keys, ["1043", "2010"]); // ordinato per chiave

      // Una nuova istanza rilegge dallo stesso file.
      const b = new FilesystemTerritoryRepository(dir);
      assert.equal((await b.getListingEnrichment("1043"))?.realSmartCode, "1043");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("cartella vuota → letture nulle, nessun errore", async () => {
    const dir = mkdtempSync(join(tmpdir(), "territory-empty-"));
    try {
      const repo = new FilesystemTerritoryRepository(dir);
      assert.equal(await repo.getListingEnrichment("x"), null);
      assert.deepEqual(await repo.listEnrichmentMetadata(), []);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

// ── Adattatore di produzione JSON: legge, ma rifiuta ogni scrittura ────────────
describe("json — produzione read-only", () => {
  test("legge i dati scritti dal filesystem ma blocca le scritture", async () => {
    const dir = mkdtempSync(join(tmpdir(), "territory-json-"));
    try {
      await new FilesystemTerritoryRepository(dir).putListingEnrichment(
        makeRecord("1043", { status: "approved" }),
      );
      // Tipizzato come interfaccia: le scritture usano l'arità del contratto e falliscono a runtime.
      const prod: TerritoryRepository = new JsonTerritoryRepository(dir);
      assert.equal((await prod.getListingEnrichment("1043"))?.status, "approved");

      await assert.rejects(() => prod.putListingEnrichment(makeRecord("2")), TerritoryStorageError);
      await assert.rejects(() => prod.markStale("1043"), TerritoryStorageError);
      await assert.rejects(
        () => prod.recordFailure("1043", { at: "2026-08-12T09:00:00.000Z", kind: "unknown", reason: "x" }),
        TerritoryStorageError,
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
