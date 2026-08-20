// Scelta del provider dall'ambiente (server-only).
//
// DEFAULT SICURO: provider `fake` (deterministico, nessuna rete). Il provider REALE (OSM Overpass)
// si attiva SOLO con TERRITORY_PLACES_PROVIDER="osm": "real provider disabled unless explicitly
// configured" (Prompt 7). Così un run senza configurazione non può mai fare una chiamata esterna.

import { FakePlacesProvider } from "./fake";
import { OsmOverpassProvider } from "./osm";
import type { TerritoryPlacesProvider } from "./provider";
import type { EnrichmentConfig } from "../config";
import { isKillSwitchOn } from "../budget";

export interface ProviderChoice {
  provider: TerritoryPlacesProvider;
  /** true se è il provider reale (OSM): utile per stampare avvisi/attribuzione. */
  isReal: boolean;
  /** true se il kill switch ha spento le chiamate esterne (i dati approvati restano serviti). */
  killed?: boolean;
}

export function selectProviderFromEnv(
  config: EnrichmentConfig,
  env: Record<string, string | undefined> = process.env,
): ProviderChoice {
  if (env.TERRITORY_PLACES_PROVIDER === "osm") {
    // KILL SWITCH: il provider reale viene consegnato DISABILITATO → nessuna nuova chiamata parte
    // (searchNearby solleva ProviderDisabledError e il motore conserva l'ultimo dato approvato).
    const killed = isKillSwitchOn(env);
    return {
      provider: new OsmOverpassProvider({ timeoutMs: config.requestTimeoutMs, enabled: !killed }),
      isReal: true,
      killed,
    };
  }
  return { provider: new FakePlacesProvider(), isReal: false };
}
