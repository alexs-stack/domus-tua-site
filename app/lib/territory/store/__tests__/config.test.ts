// Test della configurazione e della factory: il comportamento fail-safe è parte del contratto.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  readTerritoryStoreConfig,
  createTerritoryRepository,
  type TerritoryStoreConfig,
} from "../config";
import { MemoryTerritoryRepository } from "../memory";
import { FilesystemTerritoryRepository } from "../filesystem";
import { JsonTerritoryRepository } from "../json";
import { TerritoryStorageError } from "../repository";

function baseConfig(over: Partial<TerritoryStoreConfig> = {}): TerritoryStoreConfig {
  return {
    adapter: "memory",
    dataDir: "/tmp/does-not-matter",
    supabase: {},
    allowEphemeral: false,
    isProduction: false,
    ...over,
  };
}

describe("readTerritoryStoreConfig", () => {
  test("sviluppo senza variabili → default filesystem", () => {
    const cfg = readTerritoryStoreConfig({ NODE_ENV: "development" });
    assert.equal(cfg.adapter, "filesystem");
  });

  test("PRODUZIONE senza adapter → errore fail-safe (niente default silenzioso)", () => {
    assert.throws(
      () => readTerritoryStoreConfig({ NODE_ENV: "production" }),
      TerritoryStorageError,
    );
  });

  test("adapter sconosciuto → errore", () => {
    assert.throws(
      () =>
        readTerritoryStoreConfig({
          TERRITORY_STORE_ADAPTER: "redis",
        }),
      TerritoryStorageError,
    );
  });

  test("rispetta TERRITORY_DATA_DIR e adapter esplicito", () => {
    const cfg = readTerritoryStoreConfig({
      TERRITORY_STORE_ADAPTER: "json",
      TERRITORY_DATA_DIR: "/data/territory",
    });
    assert.equal(cfg.adapter, "json");
    assert.equal(cfg.dataDir, "/data/territory");
  });
});

describe("createTerritoryRepository", () => {
  test("memory in sviluppo → MemoryTerritoryRepository", () => {
    assert.ok(createTerritoryRepository(baseConfig({ adapter: "memory" })) instanceof MemoryTerritoryRepository);
  });

  test("memory in PRODUZIONE senza opt-in → rifiutato (niente storage effimero)", () => {
    assert.throws(
      () => createTerritoryRepository(baseConfig({ adapter: "memory", isProduction: true })),
      TerritoryStorageError,
    );
  });

  test("memory in produzione CON opt-in esplicito → ammesso", () => {
    assert.ok(
      createTerritoryRepository(
        baseConfig({ adapter: "memory", isProduction: true, allowEphemeral: true }),
      ) instanceof MemoryTerritoryRepository,
    );
  });

  test("filesystem e json → adattatori corrispondenti", () => {
    assert.ok(createTerritoryRepository(baseConfig({ adapter: "filesystem" })) instanceof FilesystemTerritoryRepository);
    assert.ok(createTerritoryRepository(baseConfig({ adapter: "json" })) instanceof JsonTerritoryRepository);
  });

  test("supabase senza configurazione → errore chiaro (disabilitato)", () => {
    assert.throws(
      () => createTerritoryRepository(baseConfig({ adapter: "supabase" })),
      TerritoryStorageError,
    );
  });

  test("supabase configurato ma non implementato → errore esplicito", () => {
    assert.throws(
      () =>
        createTerritoryRepository(
          baseConfig({ adapter: "supabase", supabase: { url: "https://x.supabase.co", serviceRoleKey: "k" } }),
        ),
      /non implementato/,
    );
  });
});
