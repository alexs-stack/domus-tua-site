// Client RealSmart — punto di ingresso unico per gli immobili "live" del sito.
//
// STATO: feed XML pubblico RealSmart COLLEGATO. getLiveListings() scarica, parsa e normalizza
// gli annunci reali dell'agenzia; mapping e campi sono da validare col cliente prima del
// lancio definitivo (checklist: docs/realsmart-live-validation.md). Su errore del feed,
// fallback difensivo ai mock per non mostrare mai una pagina vuota.
//
// Comportamento per ambiente (flag NEXT_PUBLIC_USE_REALSMART):
//   • dev locale: default mock possibile (USE_REALSMART="false") per lavorare offline;
//   • Vercel preview: RealSmart live se il feed è stabile (USE_REALSMART="true"/assente);
//   • produzione: RealSmart live (default ON).
// Dettagli, domande aperte e note: docs/realsmart-integration-notes.md.

import { unstable_cache } from "next/cache";
import { XMLParser } from "fast-xml-parser";
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
 * MODALITÀ MOCK (NEXT_PUBLIC_USE_REALSMART="false"): ritorna i mock locali, nessuna rete —
 * utile per sviluppo offline.
 *
 * MODALITÀ LIVE (default): scarica il feed XML pubblico RealSmart, lo parsa e lo normalizza.
 * Il payload grezzo (unknown) passa SEMPRE per parseRealSmartPayload(), che lo trasforma in
 * RealSmartListingRaw[] in modo difensivo (mai throw su dati sporchi).
 *
 * NB: il feed è collegato e funzionante. Ciò che resta da confermare col cliente è il
 *     MAPPING dei campi (non l'endpoint): province, classe energetica ed eventuali campi
 *     mancanti. Checklist di validazione live: docs/realsmart-live-validation.md.
 */
async function fetchRawListings(): Promise<RealSmartListingRaw[]> {
  const config = getRealSmartConfig();

  // Modalità mock (default): nessuna credenziale richiesta, nessuna rete.
  if (!config.useRealSmart) {
    return getMockRealSmartListings();
  }

  // Modalità live: scarica il feed XML pubblico RealSmart, lo parsa e lo normalizza.
  // getRealSmartConfig() garantisce config.feedUrl (default al feed pubblico dell'agenzia).
  const res = await fetch(config.feedUrl!, {
    headers: config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : undefined,
    // Il feed grezzo è ~2.6MB (oltre il limite di 2MB della Data Cache di Next): NON lo
    // memorizziamo qui (no-store). A cachare è unstable_cache sul RISULTATO normalizzato
    // (molto più piccolo), condiviso tra worker/richieste e rivalidato ogni REVALIDATE_SECONDS.
    cache: "no-store",
    // Timeout duro: se il feed è lento/irraggiungibile la fetch NON deve appendere il build
    // (SSG di ~186 pagine /case) fino al timeout della piattaforma. Su errore -> fallback ai mock.
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`RealSmart feed ${res.status}`);
  const xml = await res.text(); // decodifica UTF-8 corretta (niente mojibake da iframe)
  const parser = new XMLParser({ ignoreAttributes: true, trimValues: true });
  const payload = parser.parse(xml) as unknown; // ← unico confine payload → RealSmartListingRaw[]
  return parseRealSmartPayload(payload);
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
async function loadListings(): Promise<NormalizedProperty[]> {
  let raw: RealSmartListingRaw[];
  try {
    raw = await fetchRawListings();
  } catch (err) {
    // Fallback difensivo: meglio i mock che una lista vuota / errore in pagina.
    // Logghiamo il MOTIVO (server-only, mai esposto al client) per poter MONITORARE i
    // fallback: il badge di anteprima mostra la modalità PREVISTA (RealSmart), non se una
    // singola build/finestra di cache è caduta nei mock. Un fallback ripetuto nei log =
    // il feed è instabile e va indagato prima del lancio.
    console.error(
      "[realsmart] feed non disponibile → fallback ai mock:",
      err instanceof Error ? err.message : err,
    );
    raw = getMockRealSmartListings();
  }

  const normalized = raw
    .map(normalizeRealSmartListing)
    .filter((p) => !HIDDEN_STATUSES.has(p.status));

  // Ordina prima gli immobili "In evidenza", poi per data di aggiornamento
  // (ISO 8601 → confronto lessicografico OK), le stringhe vuote finiscono in coda.
  return normalized.sort((a, b) => {
    const fa = a.badges.includes("In evidenza") ? 0 : 1;
    const fb = b.badges.includes("In evidenza") ? 0 : 1;
    if (fa !== fb) return fa - fb; // "In evidenza" prima
    const ka = a.updatedAt || a.publishedAt;
    const kb = b.updatedAt || b.publishedAt;
    if (ka === kb) return 0;
    if (!ka) return 1;
    if (!kb) return -1;
    return kb.localeCompare(ka); // più recente prima
  });
}

/**
 * Immobili pubblicabili sul sito, in forma pulita e filtrata.
 * Cache condivisa (unstable_cache) sul RISULTATO normalizzato (~1MB, ben sotto il limite):
 * una sola elaborazione per finestra REVALIDATE_SECONDS, riusata da tutte le pagine e
 * invalidabile on-demand via tag "realsmart-listings". Fallback ai mock su errore feed.
 */
export const getLiveListings = unstable_cache(loadListings, ["realsmart-listings-v2"], {
  revalidate: REVALIDATE_SECONDS,
  tags: ["realsmart-listings"],
});
