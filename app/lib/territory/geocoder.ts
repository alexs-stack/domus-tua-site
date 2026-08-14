// Geocoder territoriale (Prompt 8) — interfaccia SEPARATA dal provider di POI.
//
// Trasforma un INDIRIZZO APPROVATO in una coordinata a livello di immobile, SOLO in un job editoriale
// controllato (mai durante una richiesta utente o il render di pagina). Il risultato è validato
// (plausibilità) e memorizzato in una CACHE DUREVOLE: lo stesso indirizzo approvato non si geocodifica
// due volte. La coordinata resta server-only; al pubblico va solo il livello di precisione.
//
// POLICY (constraint 5): usare SOLO geocoder con termini che lo consentono, rispettando attribuzione,
// rate-limit e caching. NIENTE scraping di pagine mappa per consumatori. Il geocoder reale
// (Nominatim/OpenStreetMap) resta DISABILITATO finché non è configurato esplicitamente.

import type { GeoCoord } from "./geo";
import { isSafeEndpoint, UnsafeEndpointError } from "./endpointPolicy";

export type GeocoderProvider = "manual" | "nominatim" | "fake";

export interface GeocodeResult {
  coord: GeoCoord; // SERVER-ONLY
  provider: GeocoderProvider;
  /** ISO 8601 del recupero. */
  retrievedAt: string;
  /** Attribuzione obbligatoria della fonte (es. "© OpenStreetMap contributors"). */
  attribution: string;
}

export interface TerritoryGeocoder {
  readonly provider: GeocoderProvider;
  readonly enabled: boolean;
  /** Geocodifica un indirizzo (in un dato comune, per disambiguare). `null` se non trovato. */
  geocode(input: { address: string; municipality: string; signal?: AbortSignal }): Promise<GeocodeResult | null>;
}

/** Cache DUREVOLE dei geocode: chiave = indirizzo normalizzato. */
export interface GeocodeCache {
  read(addressKey: string): Promise<GeocodeResult | null>;
  write(addressKey: string, result: GeocodeResult): Promise<void>;
}

/** Chiave stabile di un indirizzo per la cache (case/spazi normalizzati, comune incluso). */
export function geocodeAddressKey(address: string, municipality: string): string {
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  return `${norm(municipality)}|${norm(address)}`;
}

/** Cache in memoria (test/dev). L'adattatore durevole si appoggia allo store Territory (ADR-004). */
export function createMemoryGeocodeCache(): GeocodeCache {
  const map = new Map<string, GeocodeResult>();
  return {
    async read(key) {
      return map.get(key) ?? null;
    },
    async write(key, result) {
      map.set(key, result);
    },
  };
}

/** Geocoder deterministico per i test: coordinate iniettate per indirizzo. */
export function createFakeGeocoder(fixtures: Record<string, GeoCoord>, retrievedAt: string): TerritoryGeocoder {
  return {
    provider: "fake",
    enabled: true,
    async geocode({ address }) {
      const coord = fixtures[address.trim()];
      if (!coord) return null;
      return { coord: { ...coord }, provider: "fake", retrievedAt, attribution: "fake" };
    },
  };
}

/**
 * Geocoder Nominatim (OpenStreetMap) — DISABILITATO senza configurazione esplicita.
 *
 * Prima di attivarlo (constraint 5): leggere la Nominatim Usage Policy — max 1 req/s, User-Agent
 * identificativo obbligatorio, caching dei risultati (fatto: GeocodeCache), niente uso di massa,
 * attribuzione ODbL. Va usato SOLO in un job editoriale a basso volume sugli indirizzi APPROVATI.
 */
export function createNominatimGeocoder(env: {
  baseUrl?: string;
  userAgent?: string;
  enabled?: boolean;
}): TerritoryGeocoder {
  const enabled = env.enabled === true && !!env.userAgent;
  return {
    provider: "nominatim",
    enabled,
    async geocode({ address, municipality, signal }) {
      if (!enabled) {
        throw new Error(
          "Geocoder Nominatim disabilitato: richiede User-Agent identificativo e opt-in esplicito " +
            "(vedi la Usage Policy). Usa coordinate curate a mano o abilita in un job controllato.",
        );
      }
      const base = env.baseUrl ?? "https://nominatim.openstreetmap.org";
      // Difesa SSRF (Prompt 16): il baseUrl configurato deve essere HTTPS, host in allowlist, mai una
      // rete interna. Un endpoint iniettato verso 169.254.169.254 o localhost viene rifiutato QUI.
      if (!isSafeEndpoint(`${base}/search`)) {
        throw new UnsafeEndpointError(base, "baseUrl del geocoder non in allowlist o rete privata");
      }
      const q = encodeURIComponent(`${address}, ${municipality}, Italia`);
      const res = await fetch(`${base}/search?format=jsonv2&limit=1&q=${q}`, {
        headers: { "User-Agent": env.userAgent!, "Accept-Language": "it" },
        signal,
      });
      if (!res.ok) throw new Error(`Nominatim ${res.status}`);
      const data = (await res.json()) as Array<{ lat?: string; lon?: string }>;
      const first = data[0];
      if (!first?.lat || !first?.lon) return null;
      return {
        coord: { lat: Number(first.lat), lng: Number(first.lon) },
        provider: "nominatim",
        retrievedAt: new Date().toISOString(),
        attribution: "© OpenStreetMap contributors",
      };
    },
  };
}
