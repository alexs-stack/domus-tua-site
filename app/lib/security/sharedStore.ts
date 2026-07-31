// Contatore condiviso per il rate limiting, su Redis via API REST.
//
// PERCHÉ SERVE: il limite in-memory (rateLimit.ts) vive dentro una singola istanza. Su
// Vercel ogni lambda ha la sua Map, quindi chi abusa colpisce istanze diverse e il limite
// reale è un multiplo imprevedibile di quello configurato — e si azzera a ogni freddo.
// Per un sito in preview va bene; per l'endpoint più costoso del sito in produzione no.
//
// Nessuna dipendenza npm: Upstash (e i Redis compatibili) espone un'API REST, e qui parliamo
// HTTP come già facciamo con Anthropic, Voyage e il provider email.
//
// Finestra FISSA, non scorrevole: due comandi (INCR + EXPIRE) invece di una lista di
// timestamp da potare. Meno preciso ai bordi, molto più economico, e per fermare un abuso
// la differenza non conta.

const REDIS_URL = (process.env.RATE_LIMIT_REDIS_URL || "").replace(/\/+$/, "");
const REDIS_TOKEN = process.env.RATE_LIMIT_REDIS_TOKEN || "";

/** true se il contatore condiviso è configurato. */
export const sharedStoreEnabled = REDIS_URL.length > 0 && REDIS_TOKEN.length > 0;

/** Timeout stretto: il rate limit non deve mai diventare il collo di bottiglia. */
const TIMEOUT_MS = 1_500;

type PipelineResult = { result?: number }[];

/**
 * Incrementa il contatore della finestra e ne ritorna il valore.
 *
 * Ritorna `null` quando il contatore condiviso non è disponibile — non configurato, in
 * errore o troppo lento. Il chiamante allora ripiega sul contatore locale: preferiamo un
 * limite più debole a un sito che smette di rispondere perché Redis ha singhiozzato.
 */
export async function incrementWindow(
  key: string,
  windowMs: number,
  fetchImpl: typeof fetch = fetch,
): Promise<number | null> {
  if (!sharedStoreEnabled) return null;

  const seconds = Math.ceil(windowMs / 1000);
  // La chiave include la finestra corrente: allo scadere si passa a una chiave nuova e la
  // vecchia scade da sola. Nessuna pulizia da fare.
  const bucket = `${key}:${Math.floor(Date.now() / windowMs)}`;

  try {
    const res = await fetchImpl(`${REDIS_URL}/pipeline`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${REDIS_TOKEN}`,
        "content-type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", bucket],
        // EXPIRE con NX: la scadenza si imposta solo alla prima richiesta della finestra,
        // così l'ultimo arrivato non allunga il periodo per tutti.
        ["EXPIRE", bucket, String(seconds), "NX"],
      ]),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!res.ok) {
      console.error(`[rate-limit] store condiviso: HTTP ${res.status}`);
      return null;
    }

    const data = (await res.json()) as PipelineResult;
    const count = data[0]?.result;
    return typeof count === "number" ? count : null;
  } catch (err) {
    console.error(
      "[rate-limit] store condiviso non raggiungibile:",
      err instanceof Error ? err.message : "errore",
    );
    return null;
  }
}
