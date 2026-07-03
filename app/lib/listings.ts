// Facciata UNICA per gli immobili visibili sul sito.
// Tutti i componenti/pagine devono leggere gli immobili da qui (mai importare
// direttamente app/lib/properties.ts).
//
// OGGI: ritorna la fixture demo ricca (gallery, descrizioni, ecc.).
// LIVE: imposta NEXT_PUBLIC_USE_REALSMART="true" (quando client.ts fetchRawListings
//       è collegato al feed reale) → gli immobili arrivano da getLiveListings()
//       normalizzati in Property. Vedi docs/realsmart-integration-notes.md.

import { properties, getProperty, type Property } from "./properties";
import { getLiveListings } from "./realsmart/client";
import { normalizedToProperty } from "./realsmart/toProperty";

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
