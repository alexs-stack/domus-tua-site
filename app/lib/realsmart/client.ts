// Client RealSmart — punto di ingresso unico per gli immobili "live" del sito.
//
// STATO: feed XML pubblico RealSmart COLLEGATO. getLiveListings() scarica, parsa e normalizza
// gli annunci reali dell'agenzia; mapping e campi sono da validare col cliente prima del
// lancio definitivo (checklist: docs/realsmart-live-validation.md).
//
// COMPORTAMENTO SU ERRORE DEL FEED — regola di sicurezza (Prompt 3 del reaudit):
//   In produzione un immobile FINTO non deve MAI essere spacciato per reale. Perciò, se il
//   feed cade:
//     1) si serve l'ultimo snapshot BUONO in memoria dell'istanza (dato reale, solo un po'
//        vecchio: `source: "stale"`), se disponibile;
//     2) altrimenti si fallisce CHIUSI (`source: "unavailable"`, lista vuota): le pagine
//        mostrano lo stato "vuoto" garbato già esistente e il resto del sito regge.
//   I mock demo (app/lib/realsmart/mocks.ts) NON sono più un ripiego di produzione: si servono
//   SOLO nella modalità offline esplicita (NEXT_PUBLIC_USE_REALSMART="false") e SOLO fuori
//   produzione — vedi mockModeAllowed().
//
// Comportamento per ambiente (flag NEXT_PUBLIC_USE_REALSMART):
//   • dev locale: modalità mock offline con USE_REALSMART="false" (nessuna rete);
//   • Vercel preview/produzione: RealSmart live (default ON); su errore → stale/unavailable.
// Dettagli, domande aperte e note: docs/realsmart-integration-notes.md.

import { XMLParser } from "fast-xml-parser";
import { getRealSmartConfig, mockAuthorized } from "./env";
import { getMockRealSmartListings } from "./mocks";
import { selectLastKnownGoodStore, type LastKnownGoodStore } from "./lastKnownGood";
import { normalizeListings } from "./normalize";
import { parseRealSmartPayload } from "./parse";
import { getAiNormalizer } from "./aiNormalizer";
import { buildOverridesReport } from "./overrides";
import { listingOverrides } from "./overrides.data";
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
 * Provenienza degli immobili di uno snapshot:
 *  • "live"        → feed reale, appena scaricato;
 *  • "stale"       → ultimo snapshot BUONO in memoria, servito dopo un refresh fallito
 *                    (dato reale, solo un po' vecchio);
 *  • "mock"        → fixture demo, SOLO modalità offline esplicita fuori produzione;
 *  • "unavailable" → fail-closed: feed caduto e nessun buono precedente, lista vuota.
 */
export type ListingsSource = "live" | "stale" | "mock" | "unavailable";

/** true se lo snapshot viene dal gestionale REALE (live o ultimo-buono), non da mock/vuoto. */
export function isRealListingSource(source: ListingsSource): boolean {
  return source === "live" || source === "stale";
}

/** Immobili + diagnostica del dato, memorizzati insieme nella stessa voce di cache. */
export interface ListingsSnapshot {
  listings: NormalizedProperty[];
  source: ListingsSource;
  /**
   * ISO 8601: quando il DATO SERVITO è stato scaricato dal feed (freschezza reale). Su "stale"
   * resta l'ORIGINALE dell'ultimo-buono — un dato vecchio NON si spaccia per appena scaricato.
   * `null` quando non c'è alcun dato reale servito (unavailable / mai riuscito).
   */
  fetchedAt: string | null;
  /** ISO 8601: quando è stato TENTATO l'ultimo refresh. Distinto da fetchedAt (successo vs tentativo). */
  lastAttemptAt: string;
  /** Numero di immobili pubblicabili nello snapshot. */
  itemCount: number;
  /** Avvisi deterministici totali sui record (qualità dati), server-only. */
  warnings: number;
  /** true se stiamo servendo l'ultimo-buono dopo un refresh fallito. */
  stale: boolean;
  /** true se lo snapshot contiene dati usabili; false = fail-closed (vuoto). */
  ok: boolean;
}

/**
 * I dati demo (fixture) sono ammessi SOLO fuori produzione e SOLO con la modalità offline
 * esplicita NEXT_PUBLIC_USE_REALSMART="false".
 *
 * PERCHÉ `VERCEL_ENV` E NON `NODE_ENV`. `next build`/`next start` impostano NODE_ENV="production"
 * in QUALSIASI ambiente, CI compresa: usarlo forzerebbe le build di CI/anteprima — che girano di
 * proposito con USE_REALSMART="false" per essere deterministiche e senza rete — a scaricare il
 * feed live. Il segnale della produzione VERA (il sito pubblico su Vercel) è VERCEL_ENV="production".
 *
 * In produzione reale i mock NON vengono mai serviti: se per errore il flag fosse "false", si
 * prende comunque la strada live e, se cade, si fallisce chiusi — mai un immobile finto. È il
 * cancello unico usato anche dalla facciata app/lib/listings.ts per la fixture statica.
 */
export function mockModeAllowed(): boolean {
  // Intento offline (flag pubblico) + AUTORIZZAZIONE server-only (mockAuthorized): entrambe
  // necessarie. In produzione vera mockAuthorized() è sempre false → mai un immobile finto,
  // qualunque cosa dicano NEXT_PUBLIC_USE_REALSMART o VERCEL_ENV.
  return !getRealSmartConfig().useRealSmart && mockAuthorized();
}

/**
 * Scarica il feed XML pubblico RealSmart e lo trasforma in forma GREZZA (RealSmartListingRaw[]).
 *
 * SOLO percorso live: nessuna diramazione ai mock. Il payload (unknown) passa SEMPRE per
 * parseRealSmartPayload(), difensivo (mai throw su dati sporchi, entry non valide scartate).
 * Lancia solo su errore di RETE/HTTP o XML non parsabile — lì decide loadListings.
 *
 * NB: il feed è collegato. Resta da confermare col cliente il MAPPING dei campi (province,
 *     classe energetica, campi mancanti), non l'endpoint. Vedi docs/realsmart-live-validation.md.
 */
async function fetchLiveRaw(): Promise<RealSmartListingRaw[]> {
  const config = getRealSmartConfig();
  // getRealSmartConfig() garantisce config.feedUrl (default al feed pubblico dell'agenzia).
  const res = await fetch(config.feedUrl!, {
    headers: config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : undefined,
    // Il feed grezzo è ~2.6MB (oltre il limite di 2MB della Data Cache di Next): NON lo
    // memorizziamo qui (no-store). A cachare è unstable_cache sul RISULTATO normalizzato
    // (molto più piccolo), condiviso tra worker/richieste e rivalidato ogni REVALIDATE_SECONDS.
    cache: "no-store",
    // Timeout duro: se il feed è lento/irraggiungibile la fetch NON deve appendere il build
    // (SSG di ~186 pagine /case) fino al timeout della piattaforma. Su errore → decide loadListings.
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`RealSmart feed ${res.status}`);
  const xml = await res.text(); // decodifica UTF-8 corretta (niente mojibake da iframe)
  const parser = new XMLParser({ ignoreAttributes: true, trimValues: true });
  const payload = parser.parse(xml) as unknown; // ← unico confine payload → RealSmartListingRaw[]
  return parseRealSmartPayload(payload);
}

/**
 * Ultimo snapshot BUONO in memoria di questa istanza.
 *
 * Best-effort, PER-ISTANZA (serverless): non è uno store durevole condiviso, sopravvive finché
 * l'istanza resta calda. Copre il caso comune — un blip del feed durante una rivalidazione su
 * un'istanza già scaldata — senza introdurre un database esterno (fuori scope senza approvazione:
 * vedi la proposta in docs/realsmart-integration-notes.md). A freddo, senza un buono precedente,
 * si fallisce chiusi. Viene aggiornato SOLO su fetch riuscita: non lo sovrascriviamo mai con
 * stale/unavailable, così continua a servire l'ultimo dato davvero buono.
 */
let lkgStore: LastKnownGoodStore = selectLastKnownGoodStore();

/** Adapter dell'ultimo-buono attivo ("memory" | "durable"), per /api/health. Nessun segreto. */
export function lastKnownGoodKind(): LastKnownGoodStore["kind"] {
  return lkgStore.kind;
}

/** Reset di ultimo-buono E cache in-process — SOLO per i test, per isolare gli scenari. */
export function __resetRealSmartStateForTests(): void {
  lkgStore = selectLastKnownGoodStore();
  revalidateListingsSnapshot();
}

/** Alias storico (compatibilità coi test esistenti). */
export const __resetLastKnownGoodForTests = __resetRealSmartStateForTests;

/** Normalizza, filtra e ordina i grezzi in uno snapshot pubblicabile con diagnostica. */
async function buildSnapshot(
  raw: RealSmartListingRaw[],
  source: ListingsSource,
): Promise<ListingsSnapshot> {
  // ── ISOLAMENTO DEGLI ERRORI ─────────────────────────────────────────────
  // Un SINGOLO annuncio malformato non deve mai far cadere l'intero catalogo:
  // `normalizeListings` normalizza uno per uno e SCARTA chi lancia (mai una
  // pagina vuota per un record rotto). L'AI è di norma spenta (deterministico è
  // il default) e ha comunque un fallback sicuro — vedi ./aiNormalizer.ts.
  const { listings: normalizedAll, skipped } = await normalizeListings(raw, getAiNormalizer());
  const normalized = normalizedAll.filter((p) => !HIDDEN_STATUSES.has(p.status));

  // Riepilogo di qualità (server-only, mai in pagina): record scartati e avvisi
  // deterministici. Un numero che cresce nel tempo = il feed va sistemato a monte.
  const warned = normalized.reduce((acc, p) => acc + (p.warnings?.length ?? 0), 0);
  if (skipped.length > 0 || warned > 0) {
    console.warn(
      `[realsmart] qualità dati: ${skipped.length} annunci scartati, ${warned} avvisi su ${raw.length} record ` +
        "(dettaglio: npm run audit:listings-content).",
    );
  }

  // Override ORFANI: puntano a un immobile che il gestionale non espone più. Non è un errore
  // di build (l'immobile può essere stato ritirato) ma va sempre segnalato, altrimenti resta
  // lì per anni. Il report completo è in `npm run audit:listings-content`.
  const { orfani } = buildOverridesReport(listingOverrides, raw.map((r) => r.codice));
  if (orfani.length > 0) {
    console.warn(
      `[realsmart] ${orfani.length} override senza immobile corrispondente nel feed: ${orfani.join(", ")}`,
    );
  }

  // Ordina prima gli immobili "In evidenza", poi per data di aggiornamento
  // (ISO 8601 → confronto lessicografico OK), le stringhe vuote finiscono in coda.
  const listings = normalized.sort((a, b) => {
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

  const nowIso = new Date().toISOString();
  return {
    listings,
    source,
    fetchedAt: nowIso,
    lastAttemptAt: nowIso,
    itemCount: listings.length,
    warnings: warned,
    stale: false,
    ok: true,
  };
}

/**
 * Immobili pubblicabili sul sito, in forma pulita e già filtrata, con diagnostica.
 *
 * Comportamento (vedi intestazione del file):
 *  • modalità mock offline (dev/test, USE_REALSMART="false") → fixture demo, `source: "mock"`;
 *  • live riuscito → dato reale, `source: "live"`, memorizzato come ultimo-buono;
 *  • live fallito con ultimo-buono in memoria → `source: "stale"` (dato reale, un po' vecchio);
 *  • live fallito senza ultimo-buono → fail-closed, `source: "unavailable"`, lista vuota.
 *
 * `fetchRaw` è iniettabile: di default scarica il feed reale; nei test si passa una sorgente
 * deterministica per verificare live/stale/unavailable senza rete.
 *
 * Esportata NON memorizzata: `getLiveListingsSnapshot` la avvolge in unstable_cache, che fuori
 * dal runtime di Next non è utilizzabile — così gli scenari sono testabili davvero.
 */
export async function loadListings(
  fetchRaw: () => Promise<RealSmartListingRaw[]> = fetchLiveRaw,
): Promise<ListingsSnapshot> {
  // Modalità mock offline: SOLO dev/test con flag esplicito + autorizzazione server-only. Mai in prod.
  if (mockModeAllowed()) {
    return buildSnapshot(getMockRealSmartListings(), "mock");
  }

  const attemptedAt = new Date().toISOString();
  try {
    const snapshot = await buildSnapshot(await fetchRaw(), "live");
    await lkgStore.write(snapshot); // memorizza l'ultimo buono (SOLO su successo)
    return snapshot;
  } catch (err) {
    // Motivo server-only, MAI esposto al client e SENZA URL/credenziali del feed. Un errore
    // ripetuto qui = il gestionale è instabile e va indagato prima/dopo il lancio.
    console.error(
      "[realsmart] feed non disponibile:",
      err instanceof Error ? err.message : String(err),
    );
    const good = await lkgStore.read();
    if (good) {
      // Ultimo-buono: dato REALE, solo un po' vecchio. Meglio dei mock e di una pagina vuota.
      // `fetchedAt` resta l'ORIGINALE (non si finge freschezza); `lastAttemptAt` segna il tentativo.
      return { ...good, source: "stale", stale: true, lastAttemptAt: attemptedAt };
    }
    // Fail-closed: nessun buono precedente. MAI i mock in produzione. Lista vuota + stato
    // "non disponibile": il catalogo mostra il suo stato vuoto garbato, il resto del sito regge.
    // `fetchedAt: null` — non c'è alcun dato reale servito: non lo si data come se fosse fresco.
    return {
      listings: [],
      source: "unavailable",
      fetchedAt: null,
      lastAttemptAt: attemptedAt,
      itemCount: 0,
      warnings: 0,
      stale: true,
      ok: false,
    };
  }
}

/**
 * Finestra di caching NEGATIVA (in secondi). Uno snapshot NON utilizzabile (unavailable) non deve
 * restare in cache per l'intera finestra positiva di 12 minuti: se il feed si riprende, il sito
 * deve tornare a mostrarlo in fretta. Perciò un risultato fail-closed si ricontrolla dopo ~1 minuto.
 */
export const NEGATIVE_REVALIDATE_SECONDS = 60;

interface SnapshotCacheEntry {
  snapshot: ListingsSnapshot;
  at: number; // Date.now() al momento della memorizzazione
}
let snapshotCache: SnapshotCacheEntry | null = null;
let snapshotInFlight: Promise<ListingsSnapshot> | null = null;

/** TTL in ms per uno snapshot: positivo se usabile, negativo (breve) se fail-closed. Esportato per i test. */
export function snapshotTtlMs(snapshot: ListingsSnapshot): number {
  // TTL POSITIVO per i dati usabili (live/stale/mock), TTL NEGATIVO breve per il fail-closed.
  return (snapshot.ok ? REVALIDATE_SECONDS : NEGATIVE_REVALIDATE_SECONDS) * 1000;
}

/**
 * Immobili pubblicabili sul sito CON la diagnostica del dato, con cache in-process RETRY-AWARE.
 *
 * SCELTA DI CACHING (Prompt 3). Sostituisce `unstable_cache` (TTL unico e fisso) con un memo a due
 * TTL: uno snapshot BUONO vive ~12 minuti (limita il polling del feed), uno snapshot FAIL-CLOSED
 * vive solo ~1 minuto (recupero rapido appena il feed torna). Un `inFlight` singolo evita che a
 * freddo N pagine scarichino il feed in parallelo (single-flight). Il tag di rivalidazione
 * on-demand non era usato da nessuno: `revalidateListingsSnapshot()` resta il gancio per il futuro.
 *
 * Compromesso: si perde la persistenza cross-istanza della Data Cache di Next; la copre, quando
 * approvato, lo store DUREVOLE dell'ultimo-buono (app/lib/realsmart/lastKnownGood.ts).
 */
export async function getLiveListingsSnapshot(
  fetchRaw?: () => Promise<RealSmartListingRaw[]>,
): Promise<ListingsSnapshot> {
  const now = Date.now();
  if (snapshotCache && now - snapshotCache.at < snapshotTtlMs(snapshotCache.snapshot)) {
    return snapshotCache.snapshot;
  }
  if (snapshotInFlight) return snapshotInFlight; // single-flight: una sola elaborazione concorrente
  snapshotInFlight = loadListings(fetchRaw)
    .then((snapshot) => {
      snapshotCache = { snapshot, at: Date.now() };
      return snapshot;
    })
    .finally(() => {
      snapshotInFlight = null;
    });
  return snapshotInFlight;
}

/** Svuota la cache in-process dello snapshot (rivalidazione on-demand / test). */
export function revalidateListingsSnapshot(): void {
  snapshotCache = null;
  snapshotInFlight = null;
}

/**
 * Immobili pubblicabili sul sito, in forma pulita e filtrata.
 * Wrapper storico su getLiveListingsSnapshot: stessa cache, stessa fetch, senza provenienza.
 */
export async function getLiveListings(): Promise<NormalizedProperty[]> {
  return (await getLiveListingsSnapshot()).listings;
}
