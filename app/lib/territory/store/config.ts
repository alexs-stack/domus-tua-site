// Configurazione (server-only) e factory dello storage territoriale.
//
// Regola d'oro (Prompt 3): un adattatore di produzione NON configurato deve fallire con un errore
// operativo chiaro, MAI ripiegare in silenzio su storage effimero. Perciò in produzione l'adattatore
// va scelto esplicitamente; la memoria (effimera) è ammessa solo con un opt-in esplicito.

import { join } from "node:path";
import type { TerritoryRepository } from "./repository";
import { TerritoryStorageError } from "./repository";
import { MemoryTerritoryRepository } from "./memory";
import { FilesystemTerritoryRepository } from "./filesystem";
import { JsonTerritoryRepository } from "./json";
import { createSupabaseTerritoryRepository } from "./supabase";

if (typeof window !== "undefined") {
  throw new Error("[territory/store] configurazione storage server-only");
}

export type TerritoryStoreAdapter = "memory" | "filesystem" | "json" | "supabase";

const KNOWN_ADAPTERS: readonly TerritoryStoreAdapter[] = [
  "memory",
  "filesystem",
  "json",
  "supabase",
];

export interface TerritoryStoreConfig {
  adapter: TerritoryStoreAdapter;
  /** Cartella dei file privati committati (adattatori json/filesystem). */
  dataDir: string;
  supabase: { url?: string; serviceRoleKey?: string };
  allowEphemeral: boolean;
  isProduction: boolean;
}

/** Ambiente come semplice mappa: process.env vi è assegnabile, e i test passano oggetti parziali. */
type EnvLike = Record<string, string | undefined>;

function readEnv(env: EnvLike, name: string): string | undefined {
  const raw = env[name];
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** Cartella di default dei dati territoriali committati. */
export function defaultDataDir(): string {
  return join(process.cwd(), "app/lib/territory/data");
}

/**
 * Legge e VALIDA la configurazione dello storage dalle variabili d'ambiente (server-only).
 * Non costruisce nulla: separare lettura da costruzione rende la config testabile.
 */
export function readTerritoryStoreConfig(
  env: EnvLike = process.env,
): TerritoryStoreConfig {
  const isProduction = readEnv(env, "NODE_ENV") === "production";
  const requested = readEnv(env, "TERRITORY_STORE_ADAPTER");

  if (requested !== undefined && !KNOWN_ADAPTERS.includes(requested as TerritoryStoreAdapter)) {
    throw new TerritoryStorageError(
      `TERRITORY_STORE_ADAPTER="${requested}" non riconosciuto. Valori ammessi: ${KNOWN_ADAPTERS.join(", ")}.`,
    );
  }

  // Default: in produzione NIENTE default silenzioso (fail-safe); in sviluppo → filesystem.
  let adapter: TerritoryStoreAdapter;
  if (requested !== undefined) {
    adapter = requested as TerritoryStoreAdapter;
  } else if (isProduction) {
    throw new TerritoryStorageError(
      "TERRITORY_STORE_ADAPTER non impostato in produzione. Imposta 'json' (store committato) " +
        "per non ripiegare mai su storage effimero.",
    );
  } else {
    adapter = "filesystem";
  }

  return {
    adapter,
    dataDir: readEnv(env, "TERRITORY_DATA_DIR") ?? defaultDataDir(),
    supabase: {
      url: readEnv(env, "SUPABASE_URL"),
      serviceRoleKey: readEnv(env, "SUPABASE_SERVICE_ROLE_KEY"),
    },
    allowEphemeral: readEnv(env, "TERRITORY_ALLOW_EPHEMERAL") === "true",
    isProduction,
  };
}

/** Costruisce il repository dall'ambiente (o da una config esplicita nei test). */
export function createTerritoryRepository(
  config: TerritoryStoreConfig = readTerritoryStoreConfig(),
): TerritoryRepository {
  switch (config.adapter) {
    case "memory":
      // La memoria è effimera: in produzione è ammessa solo con opt-in esplicito.
      if (config.isProduction && !config.allowEphemeral) {
        throw new TerritoryStorageError(
          "Adattatore 'memory' effimero in produzione: rifiutato. Usa 'json', oppure imposta " +
            "TERRITORY_ALLOW_EPHEMERAL=true solo se sai che i dati non devono sopravvivere.",
        );
      }
      return new MemoryTerritoryRepository();
    case "filesystem":
      return new FilesystemTerritoryRepository(config.dataDir);
    case "json":
      return new JsonTerritoryRepository(config.dataDir);
    case "supabase":
      return createSupabaseTerritoryRepository(config.supabase);
    default: {
      const exhaustive: never = config.adapter;
      throw new TerritoryStorageError(`Adattatore non gestito: ${String(exhaustive)}`);
    }
  }
}
