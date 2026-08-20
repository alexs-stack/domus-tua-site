// Rate limiting per le API pubbliche.
//
// Due livelli, con la stessa firma:
//
//  • `rateLimitShared` — CONDIVISO tra le istanze quando RATE_LIMIT_REDIS_URL e
//    RATE_LIMIT_REDIS_TOKEN sono configurate. È la versione usata da TUTTE le route pubbliche
//    (assistant, assistant-lead, lead, search): un solo argine, coerente tra gli endpoint.
//  • `rateLimit` — in-memory, sliding-window log per IP. Fa da fondo quando lo store
//    condiviso manca o non risponde (fail-open: meglio un limite più debole di un 500).
//
// CHIAVE: usare `clientKey(req, prefix)` — l'IP è hashato, non finisce in chiaro nello store, e
// il `prefix` isola gli endpoint (un flood sulla ricerca non consuma la quota dei lead).
//
// ⚠️ LIMITE DEL SOLO IN-MEMORY: la Map vive PER-ISTANZA. Su Vercel serverless ogni lambda ha
//    la sua, quindi chi abusa colpisce istanze diverse e il limite reale è un multiplo
//    imprevedibile di quello configurato; per giunta si azzera a freddo. Va bene per una
//    preview, non per l'endpoint più costoso del sito in produzione.
//
// ⚠️ In entrambi i casi il limite è per IP, che non è un'identità: NAT e reti mobili
//    condividono indirizzi, e chi vuole aggirarlo può cambiarli. È un argine contro flood e
//    scraping, non una difesa contro un attaccante determinato. Vedi docs/assistant-security.md.

import { createHash } from "node:crypto";
import { incrementWindow } from "./sharedStore";

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
/** Cron/admin territoriale: pochi tick leciti in 10 minuti — argine se il segreto trapelasse. */
export const TERRITORY_CRON_LIMIT: RateLimitConfig = { limit: 6, windowMs: TEN_MIN };

/** Rimuove le chiavi ormai vuote/scadute quando la Map cresce troppo. */
function sweep(now: number, windowMs: number): void {
  for (const [key, hits] of store) {
    const fresh = hits.filter((t) => now - t < windowMs);
    if (fresh.length === 0) store.delete(key);
    else store.set(key, fresh);
  }
}

/**
 * Registra una richiesta per `key` e dice se è entro il limite, usando il contatore
 * CONDIVISO quando è configurato (RATE_LIMIT_REDIS_URL + RATE_LIMIT_REDIS_TOKEN).
 *
 * È la versione da usare sulle route: su serverless il contatore in-memory vive dentro una
 * singola istanza, quindi da solo non è un limite vero.
 *
 * Se lo store condiviso non è configurato, è in errore o è lento, si ripiega sul contatore
 * locale: meglio un limite più debole di un sito che smette di rispondere perché Redis ha
 * singhiozzato. Il fallback viene registrato nei log.
 */
export async function rateLimitShared(
  key: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const count = await incrementWindow(key, config.windowMs);

  // Store condiviso non disponibile: contatore locale (best-effort, per-istanza).
  if (count === null) return rateLimit(key, config);

  if (count > config.limit) {
    // Finestra fissa: al massimo si aspetta la durata della finestra.
    return { ok: false, retryAfterSeconds: Math.ceil(config.windowMs / 1000) };
  }
  return { ok: true, remaining: Math.max(0, config.limit - count) };
}

/**
 * Registra una richiesta per `key` e dice se è entro il limite.
 * Sliding-window log: teniamo solo i timestamp nella finestra corrente.
 *
 * ⚠️ Per-ISTANZA. Vedi `rateLimitShared` per la versione utilizzabile in produzione.
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

/**
 * Chiave di rate limit privacy-conscious: `<prefix>:<hash-dell'IP>`.
 *
 * L'IP non finisce MAI in chiaro nella chiave (né in Redis né nella Map in-memory): si conserva
 * solo un hash troncato, deterministico (stesso IP → stessa chiave, il limite regge) e non
 * reversibile. La chiave scade comunque con la finestra (TTL su Redis), quindi nessun dato di
 * navigazione viene trattenuto oltre il necessario. Il `prefix` separa gli endpoint: un flood
 * sulla ricerca non consuma la quota dei lead.
 */
export function clientKey(req: Request, prefix: string): string {
  const hash = createHash("sha256").update(clientIp(req)).digest("base64url").slice(0, 16);
  return `${prefix}:${hash}`;
}
