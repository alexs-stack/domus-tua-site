// Il TRASPORTO reale del collettore: HTTP e robots.txt. SERVER-ONLY.
//
// Tenuto separato da ./collector.ts di proposito. La logica del collettore — cancelli, budget,
// impronte, invariato/cambiato — è pura e testabile senza rete; qui c'è l'unico pezzo che la
// rete la tocca davvero. Sostituirlo (un proxy, una cache, un archivio offline) non richiede di
// rileggere la logica.
//
// TRE COMPORTAMENTI che valgono la pena di essere espliciti.
//
// 1. NON SI SEGUONO redirect fuori dall'host di partenza. Un redirect verso un altro dominio
//    scavalcherebbe l'elenco ammesso: si è autorizzato a interrogare il comune, non chiunque il
//    comune decida di indicare.
// 2. SI LEGGE SOLO TESTO, e a lunghezza limitata. Un PDF da quaranta megabyte o un video non
//    sono fonti d'area: sono un modo di esaurire il budget.
// 3. ROBOTS SI RISPETTA, e in caso di dubbio si NEGA. Un robots.txt irraggiungibile o illeggibile
//    non è un permesso: è l'assenza di una risposta, e su un sito di terzi l'assenza di risposta
//    si tratta come un no.

import type { PageFetcher, RobotsChecker } from "./collector";

if (typeof window !== "undefined") {
  throw new Error("[territory/area/sources] trasporto HTTP: modulo server-only.");
}

/**
 * Lo user-agent con cui ci si presenta.
 *
 * Contiene un contatto, e non è cortesia formale: è il modo in cui l'amministratore di un sito
 * comunale può chiedere di smettere invece di limitarsi a bloccare un indirizzo IP.
 */
export const AREA_USER_AGENT =
  "DomusTuaAreaBot/1.0 (+https://www.domustua.com; ricerca fonti territoriali; info@domustua.com)";

/** Tipi che vale la pena scaricare. Tutto il resto non è una fonte d'area leggibile. */
const READABLE_TYPES = ["text/html", "text/plain", "application/xhtml+xml", "application/json"];

/**
 * Il recuperatore di produzione.
 *
 * Legge lo stream a pezzi e si ferma al limite di byte invece di scaricare tutto e poi tagliare:
 * su una pagina inattesa da cinquanta megabyte, tagliare dopo significa averla già scaricata.
 */
export const httpFetcher: PageFetcher = async (url, { timeoutMs, maxBytes }) => {
  const response = await fetch(url, {
    headers: { "user-agent": AREA_USER_AGENT, accept: READABLE_TYPES.join(", ") },
    // Un redirect cross-host scavalcherebbe l'elenco ammesso: si gestisce a mano.
    redirect: "manual",
    signal: AbortSignal.timeout(timeoutMs),
    cache: "no-store",
  });

  // 3xx: si accetta SOLO se resta sullo stesso host. Altrimenti è una fonte diversa, e come tale
  // deve passare dai cancelli invece di entrare di lato.
  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get("location");
    if (!location) return { status: response.status, text: "", truncated: false };
    const target = new URL(location, url);
    if (target.host !== new URL(url).host) {
      return { status: response.status, text: "", truncated: false };
    }
    return httpFetcher(target.toString(), { timeoutMs, maxBytes });
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!response.ok) {
    return { status: response.status, text: "", truncated: false, contentType };
  }
  if (!READABLE_TYPES.some((t) => contentType.includes(t))) {
    // Non è un errore della fonte: è un formato che non sappiamo leggere. Si dichiara con 415,
    // che il collettore tratta come irraggiungibile e non ritenta.
    return { status: 415, text: "", truncated: false, contentType };
  }

  const body = response.body;
  if (!body) return { status: response.status, text: "", truncated: false, contentType };

  const reader = body.getReader();
  const decoder = new TextDecoder("utf-8");
  let text = "";
  let bytes = 0;
  let truncated = false;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > maxBytes) {
      truncated = true;
      await reader.cancel(); // si smette di scaricare, non si scarica e poi si taglia
      break;
    }
    text += decoder.decode(value, { stream: true });
  }
  text += decoder.decode();

  return { status: response.status, text, truncated, contentType };
};

// ─────────────────────────────────────────────────────────────
// robots.txt
// ─────────────────────────────────────────────────────────────

interface RobotsRules {
  /** Prefissi vietati per il nostro user-agent (o per `*`). */
  disallow: string[];
  /** Prefissi esplicitamente permessi: vincono sul disallow più corto. */
  allow: string[];
}

/**
 * Analizza un `robots.txt`, tenendo i gruppi che si applicano a noi.
 *
 * Un gruppo specifico per il nostro user-agent, se c'è, SOSTITUISCE quello generico `*` — è così
 * che lo standard funziona, ed è anche il modo in cui un amministratore ci può dare regole
 * diverse da quelle che dà ai motori di ricerca.
 */
export function parseRobots(content: string, userAgent = AREA_USER_AGENT): RobotsRules {
  const token = userAgent.split("/")[0].toLowerCase();
  const groups = new Map<string, RobotsRules>();
  let current: string[] = [];
  let expectingAgents = true;

  for (const line of content.split(/\r?\n/)) {
    const clean = line.split("#")[0].trim();
    if (clean.length === 0) continue;
    const [rawKey, ...rest] = clean.split(":");
    const key = rawKey.trim().toLowerCase();
    const value = rest.join(":").trim();

    if (key === "user-agent") {
      if (!expectingAgents) {
        current = [];
        expectingAgents = true;
      }
      current.push(value.toLowerCase());
      if (!groups.has(value.toLowerCase())) groups.set(value.toLowerCase(), { disallow: [], allow: [] });
      continue;
    }
    if (key !== "disallow" && key !== "allow") continue;
    expectingAgents = false;
    for (const agent of current) {
      const group = groups.get(agent)!;
      if (key === "disallow" && value.length > 0) group.disallow.push(value);
      if (key === "allow" && value.length > 0) group.allow.push(value);
    }
  }

  // Il gruppo specifico vince sul generico, e non si sommano.
  const specific = [...groups.entries()].find(([agent]) => agent.includes(token));
  return specific?.[1] ?? groups.get("*") ?? { disallow: [], allow: [] };
}

/** true se il percorso è consentito dalle regole. La regola più SPECIFICA (più lunga) vince. */
export function isPathAllowed(rules: RobotsRules, path: string): boolean {
  const longest = (list: string[]): number =>
    list.filter((p) => path.startsWith(p)).reduce((max, p) => Math.max(max, p.length), -1);
  const deny = longest(rules.disallow);
  const allow = longest(rules.allow);
  if (deny < 0) return true;
  return allow >= deny;
}

/**
 * Il controllore di produzione, con cache per host.
 *
 * `robots.txt` si legge una volta per host e vale per tutte le sue pagine: rileggerlo a ogni
 * URL sarebbe una richiesta in più per ogni fonte, cioè raddoppiare il traffico verso un sito
 * che stiamo già disturbando.
 */
export function createRobotsChecker(options: { timeoutMs?: number } = {}): RobotsChecker {
  const cache = new Map<string, RobotsRules | null>();
  const timeoutMs = options.timeoutMs ?? 5000;

  return async (host, path) => {
    if (!cache.has(host)) {
      try {
        const response = await fetch(`https://${host}/robots.txt`, {
          headers: { "user-agent": AREA_USER_AGENT },
          signal: AbortSignal.timeout(timeoutMs),
          cache: "no-store",
        });
        if (response.status === 404) {
          // Nessun robots.txt = nessuna restrizione dichiarata. È l'unico caso in cui l'assenza
          // di regole significa permesso, ed è quello che dice lo standard.
          cache.set(host, { disallow: [], allow: [] });
        } else if (response.ok) {
          cache.set(host, parseRobots(await response.text()));
        } else {
          cache.set(host, null); // risposta anomala: si nega
        }
      } catch {
        cache.set(host, null); // irraggiungibile: si nega
      }
    }

    const rules = cache.get(host);
    // `null` = non si è potuto sapere. Su un sito di terzi l'assenza di risposta si tratta come
    // un no: il fatto si prende altrove, o non si prende.
    if (rules === null || rules === undefined) return false;
    return isPathAllowed(rules, path);
  };
}
