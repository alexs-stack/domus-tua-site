// Stato della sorgente dati immobili — helper leggibile per badge di anteprima e /api/health.
//
// SERVER-ONLY (legge getRealSmartConfig). Descrive la modalità PREVISTA dal flag pubblico,
// non se a runtime una singola richiesta è caduta nel fallback ai mock (quello è tracciato
// via log in client.ts, vedi getLiveListings). Nessun segreto esposto: solo modalità e booleani.

import { getRealSmartConfig } from "./env";
import type { DataSourceMode } from "../demoStatus";

export interface ListingDataSourceStatus {
  /** Modalità prevista: "realsmart" (feed live) o "mock" (fixture demo). */
  mode: DataSourceMode;
  /** true se un URL feed è disponibile (default pubblico incluso). */
  feedConfigured: boolean;
  /**
   * true se, in caso di errore del feed live, il sito può ripiegare sui mock invece di
   * mostrare una pagina vuota. Oggi sempre true (i mock sono sempre disponibili).
   */
  fallbackPossible: boolean;
}

/**
 * Ritorna lo stato della sorgente immobili in forma sintetica.
 * - Modalità mock: NEXT_PUBLIC_USE_REALSMART === "false".
 * - Modalità realsmart: qualsiasi altro valore (default ON, il feed pubblico è collegato).
 */
export function getListingDataSourceStatus(): ListingDataSourceStatus {
  const config = getRealSmartConfig();
  return {
    mode: config.useRealSmart ? "realsmart" : "mock",
    feedConfigured: (config.feedUrl ?? "").trim().length > 0,
    fallbackPossible: true,
  };
}
