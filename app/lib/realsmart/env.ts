// Configurazione d'ambiente per l'integrazione RealSmart.
//
// Principio: le credenziali RealSmart (URL feed, API key, FTP, webhook secret) vivono SOLO
// in variabili d'ambiente server-side — mai hardcodate, mai committate, mai esposte al client.
// Nessuna di queste è `NEXT_PUBLIC_*`: restano fuori dal bundle del browser.
//
// L'unico flag PUBBLICO è NEXT_PUBLIC_USE_REALSMART: un interruttore leggibile anche lato client
// che dice "il sito deve usare i dati live RealSmart" (true) oppure "resta sui mock" (false/assente).
//
// Validazione: le variabili obbligatorie vengono controllate SOLO quando l'integrazione live è
// attiva (NEXT_PUBLIC_USE_REALSMART === "true"). In modalità mock non serve alcuna credenziale,
// così sviluppo/preview girano senza segreti.
//
// Scenario ATTIVO: feed XML pubblico via URL (REALSMART_FEED_URL, con default nel codice) —
// collegato e funzionante, non richiede API key. Gli scenari alternativi (API REST, FTP)
// restano previsti nel tipo ma non sono in uso. Resta da validare col cliente il MAPPING dei
// campi, non la modalità (docs/realsmart-live-validation.md).

/** Configurazione tipizzata consumata dal client RealSmart. */
export interface RealSmartConfig {
  /** True se il sito deve usare i dati live RealSmart; false → mock. */
  useRealSmart: boolean;
  /** URL del feed/endpoint RealSmart (obbligatorio in modalità live). */
  feedUrl?: string;
  /** API key / token per l'autenticazione, se richiesta dal feed. */
  apiKey?: string;
  /** Base URL delle eventuali API REST (scenario alternativo al feed). */
  apiBase?: string;
  /** Secret per verificare la firma dei webhook in ingresso, se attivi. */
  webhookSecret?: string;
}

/**
 * Legge una env var trimmandola; ritorna undefined se assente o vuota.
 * (In alcuni ambienti le variabili non impostate arrivano come stringa vuota.)
 */
function readEnv(name: string): string | undefined {
  const raw = process.env[name];
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Variabili OBBLIGATORIE quando l'integrazione live è attiva.
 * Lo scenario attivo è "feed via URL" e REALSMART_FEED_URL ha un DEFAULT pubblico nel codice
 * (DEFAULT_FEED_URL): nessuna variabile è quindi strettamente obbligatoria per andare live.
 * L'array resta come gancio se un domani si passasse ad auth/API che richiedono credenziali.
 */
const REQUIRED_WHEN_LIVE = [] as const;

// Feed XML pubblico dell'agenzia generato da RealSmart (solo immobili attivi, ~5 update/giorno).
// È un URL PUBBLICO (non un segreto): lo teniamo come default e lo si può sovrascrivere con
// REALSMART_FEED_URL. Configurato in RealSmart → Esportazione annunci → "Invio XML al tuo sito".
const DEFAULT_FEED_URL = "https://www.gestim2002.it/portali/immobili_724.xml";

/**
 * Interruttore "il sito usa il feed live?" — LETTURA UNICA di NEXT_PUBLIC_USE_REALSMART.
 *
 * La stessa espressione era ripetuta in app/lib/listings.ts, app/lib/demoStatus.ts e qui:
 * tre copie della stessa regola, ognuna con il proprio commento. Default ON (abbiamo un feed
 * pubblico reale); si torna ai mock solo con "false" esplicito.
 */
export function isRealSmartLive(): boolean {
  return process.env.NEXT_PUBLIC_USE_REALSMART !== "false";
}

/**
 * Produzione VERA (il sito pubblico davanti alle persone), decisa da segnali SERVER-ONLY.
 *
 * NON si deduce da `NODE_ENV`: `next build`/`next start` lo mettono a "production" anche in CI e in
 * locale. E non ci si affida al SOLO `VERCEL_ENV`: un deploy fuori da Vercel non lo imposterebbe.
 * Perciò: Vercel production OPPURE un'asserzione server-only esplicita `REALSMART_ENV="production"`
 * (per hosting non-Vercel). Il default è "non produzione", ma la sicurezza anti-mock NON dipende
 * da questo default (vedi mockAuthorized): richiede comunque un opt-in server-only positivo.
 */
export function isProductionRuntime(): boolean {
  return process.env.VERCEL_ENV === "production" || readEnv("REALSMART_ENV") === "production";
}

/**
 * Autorizzazione SERVER-ONLY a servire le fixture demo (mock).
 *
 * DIFESA A PIÙ LIVELLI (Prompt 3). Il mock è ammesso SOLO se TUTTE queste condizioni valgono:
 *   1. opt-in server-only esplicito `REALSMART_ALLOW_MOCK="true"` — una `NEXT_PUBLIC_*` o
 *      `VERCEL_ENV` mal configurata NON basta ad accenderlo;
 *   2. NON è produzione vera (isProductionRuntime()).
 * Così un immobile FINTO è IMPOSSIBILE in produzione reale anche se qualcuno sbaglia un flag
 * pubblico: manca comunque l'autorizzazione server-only, che la produzione non imposta mai.
 */
export function mockAuthorized(): boolean {
  return readEnv("REALSMART_ALLOW_MOCK") === "true" && !isProductionRuntime();
}

/** Soglia minima di immobili "plausibile" per promuovere un rilascio (default 5). */
export function releaseMinListings(): number {
  const raw = readEnv("REALSMART_MIN_LISTINGS");
  const n = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n >= 0 ? n : 5;
}

/** Override ESPLICITO e auditabile per promuovere un rilascio a catalogo vuoto/degradato. */
export function releaseAllowEmpty(): boolean {
  return readEnv("REALSMART_ALLOW_EMPTY_RELEASE") === "true";
}

/**
 * Costruisce e valida la configurazione RealSmart dalle env var.
 *
 * - In modalità mock (NEXT_PUBLIC_USE_REALSMART !== "true"): non valida nulla, ritorna
 *   comunque gli eventuali valori presenti (utili per test in staging).
 * - In modalità live (=== "true"): verifica che TUTTE le variabili obbligatorie siano presenti.
 *   Se ne manca qualcuna, lancia un errore chiaro che le ELENCA — così il fallimento è
 *   immediato e diagnosticabile, invece di una fetch verso `undefined`.
 *
 * Nota: l'errore viene lanciato SOLO in modalità live. In modalità mock questa funzione
 * non lancia mai, coerentemente col fallback difensivo del client.
 */
export function getRealSmartConfig(): RealSmartConfig {
  const useRealSmart = isRealSmartLive();

  const config: RealSmartConfig = {
    useRealSmart,
    feedUrl: readEnv("REALSMART_FEED_URL") ?? DEFAULT_FEED_URL,
    apiKey: readEnv("REALSMART_API_KEY"),
    apiBase: readEnv("REALSMART_API_BASE"),
    webhookSecret: readEnv("REALSMART_WEBHOOK_SECRET"),
  };

  if (useRealSmart) {
    const missing = REQUIRED_WHEN_LIVE.filter((name) => readEnv(name) === undefined);
    if (missing.length > 0) {
      throw new Error(
        `[RealSmart] Integrazione live attiva (NEXT_PUBLIC_USE_REALSMART="true") ma mancano ` +
          `le variabili d'ambiente obbligatorie: ${missing.join(", ")}. ` +
          `Impostale in .env.local (dev) o nei secret dell'hosting (prod), ` +
          `oppure disattiva l'integrazione live per restare sui mock.`,
      );
    }
  }

  return config;
}
