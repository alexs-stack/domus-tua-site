// Client RealSmart — punto di ingresso unico per gli immobili "live" del sito.
//
// STATO ATTUALE: nessuna API reale collegata. getLiveListings() ritorna i mock
// normalizzati, così il resto del sito può già consumare NormalizedProperty[].
//
// QUANDO ARRIVERÀ L'INTEGRAZIONE REALE: sostituire il corpo di fetchRawListings()
// con la chiamata al feed/endpoint RealSmart. Il contratto di ritorno resta invariato.
// Dettagli, domande aperte e checklist: docs/realsmart-integration-notes.md.

import { getMockRealSmartListings } from "./mocks";
import { normalizeRealSmartListing } from "./normalize";
import type { NormalizedProperty, RealSmartListingRaw } from "./types";

/**
 * Finestra di rivalidazione ISR (in secondi).
 * RealSmart non è realtime: un polling ogni ~12 minuti è un buon compromesso
 * tra freschezza e carico. In caso di push (webhook/FTP) si può alzare molto
 * e forzare la rivalidazione on-demand. Vedi note di integrazione.
 */
export const REVALIDATE_SECONDS = 12 * 60; // 720s ≈ 12 minuti

/**
 * Stati che NON devono comparire tra gli immobili pubblici.
 * "sold"/"withdrawn"/"draft" vengono esclusi dalla lista live.
 * (Se in futuro si vuole mostrare i "Venduto" come social proof, rimuovere
 *  "sold" da qui: il badge "Venduto" è già derivato in normalize.ts.)
 */
const HIDDEN_STATUSES: ReadonlySet<NormalizedProperty["status"]> = new Set([
  "draft",
  "sold",
  "withdrawn",
]);

/**
 * Recupera gli annunci in forma GREZZA dalla sorgente.
 *
 * OGGI: mock locali.
 *
 * DOMANI (esempio con feed JSON dedicato):
 *
 *   const endpoint = process.env.REALSMART_FEED_URL;      // ← env, non hardcodato
 *   if (!endpoint) return getMockRealSmartListings();      // fallback difensivo
 *   const res = await fetch(endpoint, {
 *     headers: { Authorization: `Bearer ${process.env.REALSMART_API_KEY ?? ""}` },
 *     // Cache ISR di Next: rivalida in background ogni REVALIDATE_SECONDS.
 *     next: { revalidate: REVALIDATE_SECONDS, tags: ["realsmart-listings"] },
 *   });
 *   if (!res.ok) throw new Error(`RealSmart feed ${res.status}`);
 *   const data = (await res.json()) as unknown;
 *   return parseRealSmartPayload(data); // ← mappatura payload → RealSmartListingRaw[]
 *
 * NB: endpoint, schema di auth e forma del payload sono ANCORA IGNOTI.
 *     Vanno confermati con RealSmart/cliente prima di scrivere il parser reale.
 */
async function fetchRawListings(): Promise<RealSmartListingRaw[]> {
  // TODO(realsmart): sostituire con la fetch reale quando endpoint/auth saranno noti.
  return getMockRealSmartListings();
}

/**
 * Immobili pubblicabili sul sito, in forma pulita e già filtrata.
 *
 * - Normalizza ogni annuncio grezzo.
 * - Esclude gli stati non pubblici (venduti/ritirati/bozze).
 * - Ordina dal più recentemente aggiornato.
 *
 * In caso di errore della sorgente reale, il fallback ai mock evita una pagina vuota.
 */
export async function getLiveListings(): Promise<NormalizedProperty[]> {
  let raw: RealSmartListingRaw[];
  try {
    raw = await fetchRawListings();
  } catch {
    // Fallback difensivo: meglio i mock che una lista vuota / errore in pagina.
    // In produzione qui si aggiungerà logging/alerting.
    raw = getMockRealSmartListings();
  }

  const normalized = raw
    .map(normalizeRealSmartListing)
    .filter((p) => !HIDDEN_STATUSES.has(p.status));

  // Ordina per data di aggiornamento (ISO 8601 → confronto lessicografico OK),
  // le stringhe vuote finiscono in coda.
  return normalized.sort((a, b) => {
    const ka = a.updatedAt || a.publishedAt;
    const kb = b.updatedAt || b.publishedAt;
    if (ka === kb) return 0;
    if (!ka) return 1;
    if (!kb) return -1;
    return kb.localeCompare(ka); // più recente prima
  });
}
