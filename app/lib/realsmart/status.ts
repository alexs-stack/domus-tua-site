// Stato della sorgente dati immobili — helper leggibile per badge di anteprima e /api/health.
//
// SERVER-ONLY (legge getRealSmartConfig). Descrive la modalità PREVISTA dal flag pubblico,
// non se a runtime una singola richiesta è caduta nel fallback ai mock (quello è tracciato
// via log in client.ts, vedi getLiveListings). Nessun segreto esposto: solo modalità e booleani.

import { getRealSmartConfig } from "./env";
import type { DataSourceMode } from "../demoStatus";

export interface ListingDataSourceStatus {
  /** Modalità prevista: "realsmart" (feed live) o "mock" (fixture demo, solo dev/test). */
  mode: DataSourceMode;
  /** true se un URL feed è disponibile (default pubblico incluso). */
  feedConfigured: boolean;
}

/**
 * Ritorna lo stato PREVISTO della sorgente immobili (dal flag, sincrono, nessuna rete).
 * - Modalità mock: NEXT_PUBLIC_USE_REALSMART === "false".
 * - Modalità realsmart: qualsiasi altro valore (default ON, il feed pubblico è collegato).
 *
 * NB: è la modalità ATTESA, non l'esito a runtime. Lo stato reale del feed (live/stale/
 * unavailable, freschezza, conteggio) lo riporta /api/health leggendo lo snapshot vero.
 * Nessun ripiego ai mock in produzione: su errore feed si serve l'ultimo-buono o si
 * fallisce chiusi (vedi app/lib/realsmart/client.ts).
 */
export function getListingDataSourceStatus(): ListingDataSourceStatus {
  const config = getRealSmartConfig();
  return {
    mode: config.useRealSmart ? "realsmart" : "mock",
    feedConfigured: (config.feedUrl ?? "").trim().length > 0,
  };
}
