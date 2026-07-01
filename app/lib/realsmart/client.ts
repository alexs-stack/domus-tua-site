// Client RealSmart — punto di ingresso unico per gli immobili "live" del sito.
//
// STATO ATTUALE: nessuna API reale collegata. getLiveListings() ritorna i mock
// normalizzati, così il resto del sito può già consumare NormalizedProperty[].
//
// QUANDO ARRIVERÀ L'INTEGRAZIONE REALE: sostituire il corpo di fetchRawListings()
// con la chiamata al feed/endpoint RealSmart. Il contratto di ritorno resta invariato.
// Dettagli, domande aperte e checklist: docs/realsmart-integration-notes.md.

import { getRealSmartConfig } from "./env";
import { getMockRealSmartListings } from "./mocks";
import { normalizeRealSmartListing } from "./normalize";
import { parseRealSmartPayload } from "./parse";
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
 * OGGI: modalità mock. Se l'integrazione live NON è attiva
 * (NEXT_PUBLIC_USE_REALSMART !== "true"), ritorna subito i mock locali.
 *
 * DOMANI (con feed live attivo): quando avremo endpoint/auth reali, la fetch qui sotto
 * va COMPLETATA. Il payload grezzo (unknown) passa SEMPRE per parseRealSmartPayload(),
 * che lo trasforma in RealSmartListingRaw[] in modo difensivo (mai throw su dati sporchi).
 *
 * NB: endpoint, schema di auth e forma del payload sono ANCORA IGNOTI.
 *     Vanno confermati con RealSmart/cliente (docs/realsmart-client-questions.md)
 *     prima di attivare NEXT_PUBLIC_USE_REALSMART="true" in produzione.
 */
async function fetchRawListings(): Promise<RealSmartListingRaw[]> {
  const config = getRealSmartConfig();

  // Modalità mock (default): nessuna credenziale richiesta, nessuna rete.
  if (!config.useRealSmart) {
    return getMockRealSmartListings();
  }

  // Modalità live: getRealSmartConfig() ha già garantito la presenza delle env obbligatorie.
  // TODO(realsmart): completare la fetch reale quando endpoint/auth saranno confermati.
  // Esempio di forma attesa (endpoint/headers/paginazione ancora da definire col cliente):
  //
  //   const res = await fetch(config.feedUrl!, {
  //     headers: config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : undefined,
  //     // Cache ISR di Next: rivalida in background ogni REVALIDATE_SECONDS.
  //     next: { revalidate: REVALIDATE_SECONDS, tags: ["realsmart-listings"] },
  //   });
  //   if (!res.ok) throw new Error(`RealSmart feed ${res.status}`);
  //   const payload = (await res.json()) as unknown;
  //   return parseRealSmartPayload(payload); // ← unico confine payload → RealSmartListingRaw[]
  //
  // Finché la fetch reale non è cablata, riusiamo i mock come payload di prova
  // ma li facciamo comunque passare dal parser, così il percorso live resta verificabile.
  const placeholderPayload: unknown = { listings: getMockRealSmartListings() };
  return parseRealSmartPayload(placeholderPayload);
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
