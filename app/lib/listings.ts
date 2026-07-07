// Facciata UNICA per gli immobili visibili sul sito.
// Tutti i componenti/pagine devono leggere gli immobili da qui (mai importare
// direttamente app/lib/properties.ts).
//
// DEFAULT (live): gli immobili arrivano dal feed XML pubblico RealSmart via getLiveListings(),
//       normalizzati in Property. Per lo sviluppo offline si torna alla fixture demo ricca
//       impostando NEXT_PUBLIC_USE_REALSMART="false". Vedi docs/realsmart-integration-notes.md.

import { properties, getProperty, type Property } from "./properties";
import { getLiveListings } from "./realsmart/client";
import { normalizedToProperty } from "./realsmart/toProperty";

// Stato server-safe della sorgente dati (modalità PREVISTA + feed configurato). Riesportato
// qui perché la facade è il punto unico da cui leggere gli immobili.
// NB: `wasFallback` (una singola richiesta è caduta nei mock?) NON è esposto: nel flusso con
// unstable_cache è inaffidabile. Il fallback effettivo si monitora dai log server
// ("[realsmart] feed non disponibile → fallback ai mock", vedi client.ts). Il badge di
// anteprima mostra quindi la modalità prevista, non l'esito runtime.
export { getListingDataSourceStatus } from "./realsmart/status";
export type { ListingDataSourceStatus } from "./realsmart/status";

// Default ON: il feed RealSmart reale è collegato. Si torna alla fixture demo solo
// impostando NEXT_PUBLIC_USE_REALSMART="false" (utile per sviluppo offline).
const USE_REALSMART = process.env.NEXT_PUBLIC_USE_REALSMART !== "false";

export async function getVisibleListings(): Promise<Property[]> {
  if (USE_REALSMART) {
    const live = await getLiveListings();
    return live.map(normalizedToProperty);
  }
  return properties;
}

export async function getVisibleListing(slug: string): Promise<Property | undefined> {
  if (USE_REALSMART) {
    const live = await getVisibleListings();
    return live.find((p) => p.slug === slug);
  }
  return getProperty(slug);
}
