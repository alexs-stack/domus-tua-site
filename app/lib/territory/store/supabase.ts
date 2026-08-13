// Adattatore Supabase: PREVISTO ma DISABILITATO nell'MVP.
//
// L'ADR-001 indica Supabase come strada di produzione futura (quando servisse scrittura a runtime
// o un'interfaccia editoriale). Nell'MVP non è cablato: l'integrazione non è configurata nel
// repository e richiede autenticazione. Per rispettare "keep it disabled without configuration"
// (Prompt 3), qui NON si indovina lo schema delle API: la costruzione fallisce con un errore
// operativo chiaro finché le variabili non sono presenti e l'adattatore non viene implementato.

import { TerritoryStorageError } from "./repository";

export interface SupabaseStoreEnv {
  url?: string;
  serviceRoleKey?: string;
}

/**
 * Punto di costruzione dell'adattatore Supabase. Oggi fallisce SEMPRE in modo esplicito:
 *  • se mancano le variabili → errore di configurazione (fail-safe, mai storage effimero);
 *  • se presenti → errore "non implementato nell'MVP", così nessuno crede sia attivo.
 * Quando verrà implementato, si leggerà la documentazione ufficiale Supabase prima di scrivere
 * qualunque query (constraint: non indovinare formati/endpoint).
 */
export function createSupabaseTerritoryRepository(env: SupabaseStoreEnv): never {
  if (!env.url || !env.serviceRoleKey) {
    throw new TerritoryStorageError(
      "Adattatore Supabase selezionato ma non configurato: imposta SUPABASE_URL e " +
        "SUPABASE_SERVICE_ROLE_KEY, oppure usa TERRITORY_STORE_ADAPTER=json|filesystem.",
    );
  }
  throw new TerritoryStorageError(
    "Adattatore Supabase non implementato nell'MVP (vedi ADR-001). Resta disabilitato: " +
      "usa lo store JSON committato in produzione.",
  );
}
