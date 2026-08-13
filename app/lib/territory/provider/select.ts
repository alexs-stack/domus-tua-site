// Scelta del provider dall'ambiente (server-only).
//
// DEFAULT SICURO: provider `fake` (deterministico, nessuna rete). Il provider REALE (OSM Overpass)
// si attiva SOLO con TERRITORY_PLACES_PROVIDER="osm": "real provider disabled unless explicitly
// configured" (Prompt 7). Così un run senza configurazione non può mai fare una chiamata esterna.

import { FakePlacesProvider } from "./fake";
import { OsmOverpassProvider } from "./osm";
import type { TerritoryPlacesProvider } from "./provider";
import type { EnrichmentConfig } from "../config";

export interface ProviderChoice {
  provider: TerritoryPlacesProvider;
  /** true se è il provider reale (OSM): utile per stampare avvisi/attribuzione. */
  isReal: boolean;
}

export function selectProviderFromEnv(
  config: EnrichmentConfig,
  env: Record<string, string | undefined> = process.env,
): ProviderChoice {
  if (env.TERRITORY_PLACES_PROVIDER === "osm") {
    return { provider: new OsmOverpassProvider({ timeoutMs: config.requestTimeoutMs }), isReal: true };
  }
  return { provider: new FakePlacesProvider(), isReal: false };
}
