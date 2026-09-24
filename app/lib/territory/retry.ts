// Politica di RETRY dei refresh di profilo (Prompt 6).
//
// Un refresh che fallisce non deve bloccare il lavoro sano: si ritenta con BACKOFF ESPONENZIALE +
// JITTER, onorando l'eventuale Retry-After del provider, fino a un tetto di tentativi oltre il quale
// il profilo va in DEAD-LETTER (richiede intervento umano, niente più retry automatici).
//
// Modulo PURO: il jitter usa un generatore casuale INIETTABILE (default Math.random) così i test
// sono deterministici. Nessun accesso a rete/env.

/** Tentativi consecutivi falliti oltre i quali si va in dead-letter. */
export const MAX_ATTEMPTS = 6;

/** Backoff base e tetto (ms): 1ª ritentata ~1 min, poi raddoppia fino a ~1 giorno. */
export const BACKOFF_BASE_MS = 60_000;
export const BACKOFF_CAP_MS = 24 * 60 * 60_000;

export interface RetryState {
  attempts?: number;
  nextAttemptAt?: string;
  deadLettered?: boolean;
}

/**
 * Ritardo (ms) prima del prossimo tentativo, dato il numero di tentativi FALLITI finora.
 *  • backoff esponenziale `base * 2^(attempts-1)`, limitato a `cap`;
 *  • jitter "full": uniforme in [ritardo/2, ritardo] per sparpagliare i retry concorrenti;
 *  • se il provider ha indicato un Retry-After, si usa il MAGGIORE fra i due.
 */
export function backoffDelayMs(
  attempts: number,
  opts: { retryAfterMs?: number; random?: () => number } = {},
): number {
  const random = opts.random ?? Math.random;
  const exp = Math.min(BACKOFF_CAP_MS, BACKOFF_BASE_MS * 2 ** Math.max(0, attempts - 1));
  const jittered = exp / 2 + random() * (exp / 2); // full jitter, mai sotto la metà
  return Math.max(jittered, opts.retryAfterMs ?? 0);
}

/**
 * Nuovo stato di retry DOPO un fallimento. Incrementa i tentativi, calcola nextAttemptAt, e mette
 * in dead-letter oltre MAX_ATTEMPTS (nessun nextAttemptAt → non più ripreso automaticamente).
 */
export function nextRetryState(
  prevAttempts: number,
  now: Date,
  opts: { retryAfterMs?: number; random?: () => number } = {},
): Required<Pick<RetryState, "attempts" | "deadLettered">> & { nextAttemptAt?: string } {
  const attempts = prevAttempts + 1;
  if (attempts >= MAX_ATTEMPTS) {
    return { attempts, deadLettered: true }; // dead-letter: stop retry automatici
  }
  const delay = backoffDelayMs(attempts, opts);
  return { attempts, deadLettered: false, nextAttemptAt: new Date(now.getTime() + delay).toISOString() };
}

/** true se un profilo è ELEGGIBILE al retry adesso: non dead-letter e nextAttemptAt passato/assente. */
export function isRetryDue(state: RetryState | undefined, now: Date): boolean {
  if (!state) return true;
  if (state.deadLettered) return false;
  if (!state.nextAttemptAt) return true;
  const next = Date.parse(state.nextAttemptAt);
  return Number.isNaN(next) || now.getTime() >= next;
}
