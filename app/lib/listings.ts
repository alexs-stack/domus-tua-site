// Facciata UNICA per gli immobili visibili sul sito.
// Tutti i componenti/pagine devono leggere gli immobili da qui (mai importare
// direttamente app/lib/properties.ts).
//
// DEFAULT (live): gli immobili arrivano dal feed XML pubblico RealSmart via getLiveListings(),
//       normalizzati in Property. Per lo sviluppo offline si torna alla fixture demo ricca
//       impostando NEXT_PUBLIC_USE_REALSMART="false". Vedi docs/realsmart-integration-notes.md.

import { properties, getProperty, type Property } from "./properties";
import { onlyAvailable } from "./availability";
import { getLiveListings } from "./realsmart/client";
import { isRealSmartLive } from "./realsmart/env";
import { normalizedToProperty } from "./realsmart/toProperty";

// Stato server-safe della sorgente dati (modalità PREVISTA + feed configurato). Riesportato
// qui perché la facade è il punto unico da cui leggere gli immobili.
// NB: `wasFallback` (una singola richiesta è caduta nei mock?) NON è esposto: nel flusso con
// unstable_cache è inaffidabile. Il fallback effettivo si monitora dai log server
// ("[realsmart] feed non disponibile → fallback ai mock", vedi client.ts). Il badge di
// anteprima mostra quindi la modalità prevista, non l'esito runtime.
export { getListingDataSourceStatus } from "./realsmart/status";
export type { ListingDataSourceStatus } from "./realsmart/status";

// Il predicato di disponibilità vive in app/lib/availability.ts (modulo puro, usabile anche
// dai componenti client): riesportato qui perché la facciata è il punto unico degli immobili.
export { isAvailable, isSold, onlyAvailable } from "./availability";

/**
 * TUTTI gli immobili della sorgente attiva, venduti inclusi.
 *
 * Usare solo dove il venduto ha senso: la scheda /case/[slug] (che mostra il banner "venduto")
 * e le viste con filtro disponibilità esplicito. Per una vetrina usare getAvailableListings().
 */
export async function getVisibleListings(): Promise<Property[]> {
  if (isRealSmartLive()) {
    const live = await getLiveListings();
    return live.map(normalizedToProperty);
  }
  return properties;
}

/**
 * Solo gli immobili ancora sul mercato. È questa la lista da usare in ogni vetrina
 * ("le nostre case", risultati di ricerca, mappa): nessun venduto tra i disponibili.
 */
export async function getAvailableListings(): Promise<Property[]> {
  return onlyAvailable(await getVisibleListings());
}

export async function getVisibleListing(slug: string): Promise<Property | undefined> {
  if (isRealSmartLive()) {
    const live = await getVisibleListings();
    return live.find((p) => p.slug === slug);
  }
  return getProperty(slug);
}
