// Fingerprint deterministico dell'ORIGINE di query (Prompt 5).
//
// Decide se serve una NUOVA chiamata al provider per un'origine. L'impronta è keyed sui PARAMETRI
// DELLA QUERY — coordinata arrotondata, raggio, categorie, provider, versione schema — e NON sulla
// UltimaModifica dell'immobile: così un immobile che cambia (prezzo, testo) senza spostarsi NON
// innesca una nuova query, e N immobili sullo stesso centroide condividono la stessa impronta →
// una sola query. L'hash è un FNV-1a a 32 bit: stabilità e zero dipendenze (gira anche nei CLI).

import { roundCoord, type GeoCoord } from "./geo";
import { TERRITORY_SCHEMA_VERSION } from "./constants";
import type { EnrichmentFingerprint, TerritoryProvider } from "./types";

export interface FingerprintInput {
  municipality: string;
  origin: GeoCoord;
  /** Raggio di ricerca in metri (fa parte della chiave di query). */
  radiusMeters: number;
  /** Categorie richieste: l'ordine non conta (normalizzato internamente). */
  categories: readonly string[];
  /** Provider di dati (fake | osm-overpass). */
  provider: TerritoryProvider;
  schemaVersion?: number;
  /** Decimali di arrotondamento della coordinata (default 3 ≈ ~110 m). */
  roundDp?: number;
}

/** Serializza una coordinata arrotondata in una chiave stabile, es. "45.708,8.906". */
export function coordKeyOf(origin: GeoCoord, dp = 3): string {
  const r = roundCoord(origin, dp);
  return `${r.lat.toFixed(dp)},${r.lng.toFixed(dp)}`;
}

/** Chiave stabile e ORDINE-INDIPENDENTE delle categorie: ordinate e unite. */
export function categoriesKeyOf(categories: readonly string[]): string {
  return [...new Set(categories)].sort().join(",");
}

/** FNV-1a 32-bit → stringa esadecimale a 8 cifre. Deterministico e senza dipendenze. */
function fnv1a(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    // moltiplicazione FNV mantenuta a 32 bit senza overflow float.
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

/**
 * Costruisce il fingerprint dell'origine di query. L'hash riassume coordinata + raggio + categorie +
 * provider + schema. Il campo `ultimaModifica` è mantenuto per compatibilità di schema ma è VUOTO:
 * dalla Prompt 5 non entra più nell'hash (i parametri di query hanno preso il suo posto).
 */
export function buildFingerprint(input: FingerprintInput): EnrichmentFingerprint {
  const schemaVersion = input.schemaVersion ?? TERRITORY_SCHEMA_VERSION;
  const dp = input.roundDp ?? 3;
  const coordKey = coordKeyOf(input.origin, dp);
  const municipality = input.municipality;
  const catKey = categoriesKeyOf(input.categories);
  const hash = fnv1a(
    `${municipality}|${coordKey}|r${input.radiusMeters}|${catKey}|${input.provider}|v${schemaVersion}`,
  );
  return { municipality, coordKey, ultimaModifica: "", schemaVersion, hash };
}

/** true se due impronte coincidono (confronto sull'hash, che riassume tutti gli ingressi). */
export function fingerprintsEqual(
  a: EnrichmentFingerprint | undefined,
  b: EnrichmentFingerprint | undefined,
): boolean {
  return a !== undefined && b !== undefined && a.hash === b.hash;
}
