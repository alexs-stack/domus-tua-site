// Rate limiting leggero in-memory per le API pubbliche (/api/search, /api/lead).
//
// Obiettivo: abuso base (flood/scraping) senza infrastruttura pesante. Sliding-window log
// per IP: teniamo i timestamp delle richieste nella finestra e contiamo.
//
// ⚠️ LIMITE NOTO (MVP): la memoria è PER-ISTANZA. Su Vercel serverless ogni lambda ha la sua
//    Map, quindi il limite è "best-effort", non globale, e si azzera a freddo. È sufficiente
//    per un lancio/preview. In PRODUZIONE ad alto traffico spostare su uno store condiviso
//    (Upstash Redis o Vercel KV): stessa firma, cambia solo l'implementazione dello store.

type Store = Map<string, number[]>;

// Persistente tra hot-reload in dev (il modulo viene rivalutato): evita di azzerare i contatori
// a ogni salvataggio. In prod è comunque una sola valutazione per istanza.
const store: Store =
  ((globalThis as unknown as { __dtRateLimit?: Store }).__dtRateLimit ??= new Map());

// Cap difensivo: se troppi IP distinti riempiono la Map, facciamo pulizia (vedi sweep()).
const MAX_KEYS = 5000;

/** Configurazione di un limite: numero massimo di richieste per finestra. */
export interface RateLimitConfig {
  /** Numero massimo di richieste consentite nella finestra. */
  limit: number;
  /** Ampiezza della finestra in millisecondi. */
  windowMs: number;
}

export type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterSeconds: number };

// Limiti di default (10 minuti = 600_000 ms).
const TEN_MIN = 10 * 60 * 1000;
export const SEARCH_LIMIT: RateLimitConfig = { limit: 20, windowMs: TEN_MIN };
export const LEAD_LIMIT: RateLimitConfig = { limit: 8, windowMs: TEN_MIN };

/** Rimuove le chiavi ormai vuote/scadute quando la Map cresce troppo. */
function sweep(now: number, windowMs: number): void {
  for (const [key, hits] of store) {
    const fresh = hits.filter((t) => now - t < windowMs);
    if (fresh.length === 0) store.delete(key);
    else store.set(key, fresh);
  }
}

/**
 * Registra una richiesta per `key` e dice se è entro il limite.
 * Sliding-window log: teniamo solo i timestamp nella finestra corrente.
 */
export function rateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const { limit, windowMs } = config;

  if (store.size > MAX_KEYS) sweep(now, windowMs);

  const hits = (store.get(key) ?? []).filter((t) => now - t < windowMs);

  if (hits.length >= limit) {
    // Quanto manca perché il più vecchio hit esca dalla finestra.
    const oldest = hits[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    store.set(key, hits); // salva la finestra potata (non aggiungiamo questo hit)
    return { ok: false, retryAfterSeconds };
  }

  hits.push(now);
  store.set(key, hits);
  return { ok: true, remaining: limit - hits.length };
}

/**
 * Estrae l'IP del client dagli header di proxy. Su Vercel `x-forwarded-for` è valorizzato
 * (lista separata da virgole: il primo è il client). Fallback: `x-real-ip`, poi "unknown".
 * "unknown" accomuna i client senza IP noto in un unico bucket: accettabile per l'MVP.
 */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip");
  if (real?.trim()) return real.trim();
  return "unknown";
}
