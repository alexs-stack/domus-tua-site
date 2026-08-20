// Facciata UNICA per gli immobili visibili sul sito.
// Tutti i componenti/pagine devono leggere gli immobili da qui (mai importare
// direttamente app/lib/properties.ts).
//
// DEFAULT (live): gli immobili arrivano dal feed XML pubblico RealSmart via getLiveListings(),
//       normalizzati in Property. Per lo sviluppo offline si torna alla fixture demo ricca
//       impostando NEXT_PUBLIC_USE_REALSMART="false". Vedi docs/realsmart-integration-notes.md.

import { properties, getProperty, type Property } from "./properties";
import {
  getLiveListings,
  getLiveListingsSnapshot,
  mockModeAllowed,
  type ListingsSource,
} from "./realsmart/client";
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
 * e le viste con filtro disponibilità esplicito. Per una vetrina comporre con onlyAvailable():
 * nessun venduto tra i disponibili.
 */
export async function getVisibleListings(): Promise<Property[]> {
  // Fixture statica demo SOLO nella modalità offline esplicita fuori produzione (stesso cancello
  // dei mock RealSmart). In produzione reale non viene mai servita: si va live (che a sua volta
  // fallisce chiuso su errore, mai mock).
  if (mockModeAllowed()) return properties;
  const live = await getLiveListings();
  return live.map(normalizedToProperty);
}

export async function getVisibleListing(slug: string): Promise<Property | undefined> {
  if (mockModeAllowed()) return getProperty(slug);
  const live = await getVisibleListings();
  return live.find((p) => p.slug === slug);
}

/** Stato REALE della sorgente immobili a runtime (per /api/health). Nessun segreto esposto. */
export interface ListingsRuntimeStatus {
  /** Provenienza effettiva: live | stale | mock | unavailable. */
  source: ListingsSource;
  /** true se lo snapshot ha dati usabili; false = fail-closed vuoto. */
  ok: boolean;
  /** true se serve l'ultimo-buono dopo un refresh fallito. */
  stale: boolean;
  /** Immobili pubblicabili nello snapshot attuale. */
  itemCount: number;
  /** ISO 8601: quando il dato servito è stato scaricato (freschezza reale). null se nessun dato reale. */
  fetchedAt: string | null;
  /** ISO 8601: quando è stato tentato l'ultimo refresh (successo o meno). */
  lastAttemptAt: string;
}

/**
 * Legge lo snapshot reale (stessa cache del sito) e ne estrae lo stato diagnostico.
 * In modalità mock offline (dev/test) riporta `source: "mock"`. In produzione riflette
 * live/stale/unavailable senza mai esporre URL o credenziali del feed.
 */
export async function getListingsRuntimeStatus(): Promise<ListingsRuntimeStatus> {
  const snap = await getLiveListingsSnapshot();
  return {
    source: snap.source,
    ok: snap.ok,
    stale: snap.stale,
    itemCount: snap.itemCount,
    fetchedAt: snap.fetchedAt,
    lastAttemptAt: snap.lastAttemptAt,
  };
}
