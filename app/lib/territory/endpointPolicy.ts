// Politica di SICUREZZA degli endpoint esterni (Prompt 16) — difesa da SSRF.
//
// Un endpoint configurato male (o iniettato) NON deve poter puntare a una rete interna/privata
// (metadata cloud 169.254.169.254, localhost, 10./192.168., ecc.). Regola: solo HTTPS, host in
// ALLOWLIST di provider noti, mai un IP privato/loopback/link-local. Se un endpoint non passa, si
// SCARTA: meglio nessuna chiamata che una chiamata verso l'interno.

/** Host approvati per i provider esterni (Overpass + Nominatim). Ampliabile con revisione. */
export const ALLOWED_PROVIDER_HOSTS: readonly string[] = [
  "overpass-api.de",
  "overpass.kumi.systems",
  "maps.mail.ru",
  "nominatim.openstreetmap.org",
];

/** Range/pattern di host NON instradabili verso l'esterno (blocco SSRF). */
function isPrivateHostname(host: string): boolean {
  const h = host.toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".internal") || h.endsWith(".local")) return true;
  // IPv6 loopback / unspecified / link-local / unique-local.
  if (h === "::1" || h === "[::1]" || h === "::" || h.startsWith("fe80:") || h.startsWith("fc") || h.startsWith("fd")) return true;
  // IPv4: valuta gli ottetti solo se è davvero un IPv4.
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    if (a === 127 || a === 10 || a === 0) return true; // loopback / private / "this host"
    if (a === 169 && b === 254) return true; // link-local (metadata cloud!)
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT 100.64.0.0/10
  }
  return false;
}

export interface EndpointCheck {
  ok: boolean;
  reason?: "not-a-url" | "not-https" | "private-host" | "host-not-allowed";
}

/** Verifica un singolo endpoint contro la politica. Puro e testabile. */
export function checkEndpoint(url: string, allowlist: readonly string[] = ALLOWED_PROVIDER_HOSTS): EndpointCheck {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, reason: "not-a-url" };
  }
  if (parsed.protocol !== "https:") return { ok: false, reason: "not-https" };
  const host = parsed.hostname;
  if (isPrivateHostname(host)) return { ok: false, reason: "private-host" };
  if (!allowlist.includes(host.toLowerCase())) return { ok: false, reason: "host-not-allowed" };
  return { ok: true };
}

export function isSafeEndpoint(url: string, allowlist: readonly string[] = ALLOWED_PROVIDER_HOSTS): boolean {
  return checkEndpoint(url, allowlist).ok;
}

/** Tiene SOLO gli endpoint sicuri (per costruire un pool). */
export function filterSafeEndpoints(urls: readonly string[], allowlist: readonly string[] = ALLOWED_PROVIDER_HOSTS): string[] {
  return urls.filter((u) => isSafeEndpoint(u, allowlist));
}

export class UnsafeEndpointError extends Error {
  constructor(url: string, reason: string) {
    super(`Endpoint non sicuro rifiutato (${reason}): ${url}`);
    this.name = "UnsafeEndpointError";
  }
}
