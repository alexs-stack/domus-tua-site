// Scelta dell'adattatore di storage del dominio d'area. SERVER-ONLY.
//
// LA REGOLA, in una riga: in produzione o si ha uno store DUREVOLE, o si LANCIA.
//
// Il ripiego silenzioso sulla memoria è la variante peggiore del guasto, non la più gentile:
// il sito continua a funzionare, l'editor approva fatti e narrative, e al primo riavvio
// dell'istanza tutto sparisce — senza un errore, senza un log, senza che nessuno colleghi le
// due cose. Meglio un errore chiaro all'avvio. È la stessa scelta già presa per lo store
// territoriale (app/lib/territory/store/config.ts) e per il fallback del feed RealSmart.

import { InMemoryAreaRepository } from "./memory";
import { AreaStorageError, type AreaRepository } from "./repository";

if (typeof window !== "undefined") {
  throw new Error("[territory/area/store] storage del dominio d'area: modulo server-only.");
}

export type AreaStoreKind = "memory" | "supabase";

export interface AreaStoreConfig {
  kind: AreaStoreKind;
  /** true se l'ambiente è la produzione VERA (non CI, non anteprima). */
  productionRuntime: boolean;
  /** true se le credenziali dell'adattatore durevole sono presenti. */
  durableConfigured: boolean;
}

function readEnv(name: string): string | undefined {
  const raw = process.env[name];
  if (typeof raw !== "string") return undefined;
  const t = raw.trim();
  return t.length > 0 ? t : undefined;
}

/**
 * Produzione VERA. Come in realsmart/env.ts: `VERCEL_ENV`, non `NODE_ENV` — quest'ultimo vale
 * "production" anche in CI e in ogni `next build`, e userebbe il cancello sbagliato.
 */
export function isProductionRuntime(): boolean {
  return process.env.VERCEL_ENV === "production" || readEnv("TERRITORY_ENV") === "production";
}

/** true se il progetto Supabase è configurato (URL + chiave di servizio). */
export function isDurableStoreConfigured(): boolean {
  return Boolean(readEnv("SUPABASE_URL") && readEnv("SUPABASE_SERVICE_ROLE_KEY"));
}

export function readAreaStoreConfig(): AreaStoreConfig {
  const productionRuntime = isProductionRuntime();
  const durableConfigured = isDurableStoreConfigured();
  return {
    kind: durableConfigured ? "supabase" : "memory",
    productionRuntime,
    durableConfigured,
  };
}

/**
 * L'adattatore attivo.
 *
 * In produzione senza credenziali LANCIA: vedi l'intestazione. Fuori produzione ripiega sulla
 * memoria, che è ciò che serve a test e dry-run dei CLI.
 */
export function createAreaRepository(): AreaRepository {
  const config = readAreaStoreConfig();

  if (config.productionRuntime && !config.durableConfigured) {
    throw new AreaStorageError(
      "[territory/area] storage durevole non configurato in produzione. " +
        "Servono SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY. " +
        "Nessun ripiego in memoria: le approvazioni andrebbero perse al primo riavvio, in silenzio.",
    );
  }

  if (config.durableConfigured) {
    // L'adattatore Supabase non è ancora implementato: le migrazioni
    // (supabase/migrations/0002_area_schema.sql) sono scritte ma NON applicate, e un client che
    // scrive su tabelle inesistenti fallirebbe alla prima query invece che qui.
    //
    // Fallire ADESSO, con questo messaggio, è il comportamento voluto: dice esattamente cosa
    // manca. Quando l'adattatore esisterà, questa riga diventa `return new SupabaseAreaRepository()`.
    throw new AreaStorageError(
      "[territory/area] credenziali Supabase presenti ma l'adattatore durevole non è ancora " +
        "implementato. Applicare supabase/migrations/0002_area_schema.sql e collegare " +
        "SupabaseAreaRepository prima di attivare lo store.",
    );
  }

  return new InMemoryAreaRepository();
}
