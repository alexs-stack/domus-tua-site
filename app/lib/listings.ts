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

// Ref immobili "in evidenza" scelti a mano dall'agenzia (vincono su tutto). Vuoto = selezione
// automatica. Popolare con i riferimenti commerciali (Property.ref) da mettere in home.
const FEATURED_REFS: string[] = [];

// Cover di ripiego usata da toProperty quando l'immobile non ha foto: da penalizzare nella
// selezione "in evidenza" (preferiamo immobili con immagini reali).
const PLACEHOLDER_COVER = "/images/premium_01_living_tv_divano.jpg";

/**
 * Immobili "in evidenza" per la home (Prompt 7). Regole:
 *  1) MAI immobili venduti/non disponibili — filtro `!sold` a monte;
 *  2) ordine: featured manuale → aggiornati di recente → immagini più forti/reali.
 * Non fabbrica dati: se ci sono meno di `limit` immobili disponibili, ne ritorna meno.
 */
/**
 * Selezione PURA degli immobili "in evidenza" (testabile). Filtra i venduti e ordina.
 * Nessuna rete, nessun dato inventato.
 */
export function selectFeatured(
  list: Property[],
  opts: { limit?: number; featuredRefs?: string[] } = {},
): Property[] {
  const limit = opts.limit ?? 3;
  const featuredSet = new Set(opts.featuredRefs ?? FEATURED_REFS);
  const available = list.filter((p) => !p.sold);

  const isFeatured = (p: Property) => (p.ref && featuredSet.has(p.ref) ? 1 : 0);
  const updatedTs = (p: Property) => (p.updatedAt ? Date.parse(p.updatedAt) || 0 : 0);
  const realCover = (p: Property) => (p.cover && p.cover !== PLACEHOLDER_COVER ? 1 : 0);
  const galleryStrength = (p: Property) => Math.min(p.gallery?.length ?? 0, 12);

  return [...available]
    .sort((a, b) => {
      const f = isFeatured(b) - isFeatured(a);
      if (f !== 0) return f; // 1) featured manuale
      const u = updatedTs(b) - updatedTs(a);
      if (u !== 0) return u; // 2) aggiornati di recente
      const c = realCover(b) - realCover(a);
      if (c !== 0) return c; // 3a) foto reale prima del placeholder
      return galleryStrength(b) - galleryStrength(a); // 3b) più immagini = più forte
    })
    .slice(0, limit);
}

export async function getFeaturedListings(limit = 3): Promise<Property[]> {
  const all = await getVisibleListings();
  return selectFeatured(all, { limit });
}

export async function getVisibleListing(slug: string): Promise<Property | undefined> {
  if (USE_REALSMART) {
    const live = await getVisibleListings();
    return live.find((p) => p.slug === slug);
  }
  return getProperty(slug);
}
