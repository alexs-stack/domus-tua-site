// URL CANONICO di una fonte d'area (Prompt 5).
//
// A cosa serve, in una riga: far sì che la STESSA pagina letta due volte produca la stessa riga
// nel database invece di due.
//
// Non è pignoleria. Le fonti d'area sono pagine istituzionali, e ci si arriva da posti diversi —
// un risultato di ricerca con `?utm_source=`, un link con `#contenuto`, la versione `www` e
// quella senza, con e senza barra finale. Sono tutte la stessa pagina. Senza canonicalizzazione
// la tabella delle fonti si riempie di copie, il conteggio smette di voler dire qualcosa, e
// soprattutto il rilevamento delle modifiche non funziona più: due righe con due impronte non si
// confrontano fra loro.
//
// COSA NON SI TOCCA. I parametri di query che SELEZIONANO contenuto (`?id=`, `?pagina=`) restano:
// toglierli farebbe collassare pagine diverse sulla stessa riga, che è il difetto opposto e
// peggiore. Si tolgono solo i parametri di tracciamento, che per definizione non cambiano ciò che
// la pagina dice.

/**
 * Parametri di TRACCIAMENTO: non selezionano contenuto, quindi due URL che differiscono solo per
 * questi sono la stessa pagina. Elenco chiuso e conservativo — nel dubbio un parametro resta.
 */
const TRACKING_PARAMS = [
  "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "utm_id",
  "gclid", "fbclid", "msclkid", "mc_cid", "mc_eid", "igshid", "ref", "ref_src", "_ga",
];

export interface CanonicalUrlResult {
  ok: true;
  /** L'URL canonico: quello che va in `canonical_url` e nell'id della fonte. */
  canonical: string;
  /** L'host normalizzato, per l'allow-list e per riconoscere l'ente proprietario. */
  host: string;
  /** true se qualcosa è stato normalizzato rispetto all'originale. */
  changed: boolean;
}

export interface CanonicalUrlError {
  ok: false;
  reason:
    | "not-a-url"
    | "unsupported-scheme"
    | "no-host"
    | "credentials-in-url"
    | "too-long";
}

/** Oltre questa lunghezza un URL non è una pagina istituzionale: è un incidente. */
const MAX_URL_LENGTH = 2000;

/**
 * Riduce un URL alla sua forma canonica, o dice perché non è utilizzabile.
 *
 * Non lancia mai: le fonti arrivano da input umano e da risultati di ricerca, e un URL storto
 * deve produrre uno scarto motivato, non un'eccezione a metà di un job che ne sta processando
 * cinquanta.
 */
export function canonicalizeUrl(input: string): CanonicalUrlResult | CanonicalUrlError {
  const raw = String(input ?? "").trim();
  if (raw.length === 0) return { ok: false, reason: "not-a-url" };
  if (raw.length > MAX_URL_LENGTH) return { ok: false, reason: "too-long" };

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, reason: "not-a-url" };
  }

  // Solo http/https. `javascript:`, `data:`, `file:` non sono fonti: sono vettori.
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, reason: "unsupported-scheme" };
  }
  if (!url.hostname) return { ok: false, reason: "no-host" };
  // Credenziali nell'URL: si scarta invece di ripulirle. Un URL con dentro una password non va
  // "sistemato" e salvato — va segnalato a chi l'ha incollato.
  if (url.username || url.password) return { ok: false, reason: "credentials-in-url" };

  // Schema: si preferisce https. Una fonte istituzionale servita in chiaro esiste, ma se
  // risponde anche in https è la stessa pagina e va contata una volta.
  url.protocol = "https:";

  // Host: minuscolo, senza `www.` e senza porta di default. `www.comune.tradate.va.it` e
  // `comune.tradate.va.it` sono lo stesso ente e la stessa pagina.
  url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");
  url.port = "";

  // Il frammento è navigazione dentro la pagina, non un'altra pagina.
  url.hash = "";

  // Parametri: si tolgono solo quelli di tracciamento, e si ORDINA il resto — `?a=1&b=2` e
  // `?b=2&a=1` sono la stessa richiesta, e senza ordinamento sarebbero due righe.
  for (const param of TRACKING_PARAMS) url.searchParams.delete(param);
  const sorted = [...url.searchParams.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  url.search = "";
  for (const [k, v] of sorted) url.searchParams.append(k, v);

  // Barra finale: si toglie tranne che sulla radice. `/servizi` e `/servizi/` sono la stessa
  // pagina su ogni CMS istituzionale italiano che abbiamo visto.
  if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.replace(/\/+$/, "");
  }
  // Doppie barre interne: `/a//b` → `/a/b`.
  url.pathname = url.pathname.replace(/\/{2,}/g, "/");

  const canonical = url.toString();
  return { ok: true, canonical, host: url.hostname, changed: canonical !== raw };
}

/**
 * Il DOMINIO REGISTRABILE, per riconoscere che due host appartengono allo stesso ente.
 *
 * ⚠️ NON si usa per decidere se un host è autorizzato, e la ragione è concreta: sotto
 * `regione.lombardia.it` il dominio registrabile è `lombardia.it`, quindi autorizzare la Regione
 * autorizzerebbe in blocco qualunque sito sotto `lombardia.it`. L'autorizzazione passa da
 * `isHostUnder` (./policy.ts), che confronta per suffisso e concede esattamente ciò che è scritto.
 *
 * Serve invece a RAGGRUPPARE: nei rapporti editoriali, per dire quante fonti distinte vengono
 * dallo stesso registrante. Euristica volutamente semplice, tarata sui domini che questo dominio
 * applicativo incontra; non è una PSL completa e non pretende di esserlo.
 */
export function registrableDomain(host: string): string {
  const parts = host.toLowerCase().split(".").filter(Boolean);
  if (parts.length <= 2) return parts.join(".");
  // Suffissi italiani a due livelli: il dominio registrabile ne prende tre.
  const twoLevel = new Set(["gov.it", "edu.it", "co.uk", "org.uk"]);
  const lastTwo = parts.slice(-2).join(".");
  if (twoLevel.has(lastTwo)) return parts.slice(-3).join(".");
  // Domini provinciali italiani (`va.it`, `mi.it`): due lettere + `it`.
  if (parts.length >= 3 && /^[a-z]{2}$/.test(parts[parts.length - 2]) && parts[parts.length - 1] === "it") {
    return parts.slice(-3).join(".");
  }
  return lastTwo;
}

/** true se i due URL puntano alla stessa pagina una volta canonicalizzati. */
export function sameCanonicalPage(a: string, b: string): boolean {
  const ca = canonicalizeUrl(a);
  const cb = canonicalizeUrl(b);
  return ca.ok && cb.ok && ca.canonical === cb.canonical;
}
