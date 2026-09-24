// Adattatore Supabase: PROGETTATO, in attesa di AUTORIZZAZIONE (Prompt 7).
//
// STATO. Lo schema durevole di produzione è progettato per intero — vedi le migrazioni in
// `supabase/migrations/0001_territory_schema.sql` (tabelle, indici, RLS server-only, colonne di
// versione per la concorrenza) e la decisione in `docs/adr/004-territory-durable-storage.md`.
//
// NON è attivato: creare/provisionare un progetto Supabase (o Postgres) ed eseguire le migrazioni è
// un'azione infrastrutturale che richiede AUTORIZZAZIONE ESPLICITA del cliente (constraint: non
// creare account/servizi né eseguire migrazioni in produzione senza approvazione). Finché non è
// approvato, questo costruttore fallisce in modo esplicito e sicuro: mai storage effimero, mai un
// adattatore che finge di essere attivo.
//
// ATTIVAZIONE (dopo approvazione): (1) provisioning del progetto; (2) applicare la migrazione;
// (3) implementare qui le query tipizzate contro lo schema (leggendo la doc ufficiale Supabase);
// (4) impostare SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY (server-only) + TERRITORY_STORE_ADAPTER=supabase.

import { TerritoryStorageError } from "./repository";

export interface SupabaseStoreEnv {
  url?: string;
  serviceRoleKey?: string;
}

/**
 * Punto di costruzione dell'adattatore Supabase. Oggi fallisce SEMPRE in modo esplicito:
 *  • se mancano le variabili → errore di configurazione (fail-safe, mai storage effimero);
 *  • se presenti → errore "in attesa di autorizzazione", così nessuno crede sia attivo.
 */
export function createSupabaseTerritoryRepository(env: SupabaseStoreEnv): never {
  if (!env.url || !env.serviceRoleKey) {
    throw new TerritoryStorageError(
      "Adattatore Supabase selezionato ma non configurato: imposta SUPABASE_URL e " +
        "SUPABASE_SERVICE_ROLE_KEY, oppure usa TERRITORY_STORE_ADAPTER=json|filesystem.",
    );
  }
  throw new TerritoryStorageError(
    "Adattatore Supabase progettato ma non ancora attivato (vedi supabase/migrations/ e ADR-004): " +
      "richiede autorizzazione, provisioning e implementazione delle query. Usa lo store JSON " +
      "committato in produzione finché non è approvato.",
  );
}
