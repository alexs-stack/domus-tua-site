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
// TODO(realsmart): il set di variabili obbligatorie dipende dalla modalità reale scelta
// (feed URL vs API REST vs FTP), ancora da confermare col cliente/RealSmart
// (vedi docs/realsmart-client-questions.md). Qui assumiamo lo scenario più probabile:
// un feed/endpoint via URL con eventuale API key. Adeguare quando lo schema sarà noto.

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
 * TODO(realsmart): rivedere in base alla modalità reale (feed/API/FTP) una volta confermata.
 * Per ora lo scenario di partenza è "feed via URL", quindi REALSMART_FEED_URL è il minimo.
 */
const REQUIRED_WHEN_LIVE = ["REALSMART_FEED_URL"] as const;

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
  const useRealSmart = process.env.NEXT_PUBLIC_USE_REALSMART === "true";

  const config: RealSmartConfig = {
    useRealSmart,
    feedUrl: readEnv("REALSMART_FEED_URL"),
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
