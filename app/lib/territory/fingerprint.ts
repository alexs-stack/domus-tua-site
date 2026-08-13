// Fingerprint deterministico di un arricchimento.
//
// Decide se un immobile va ri-arricchito: se l'impronta è invariata (stessa località, stessa
// coordinata arrotondata, stessa UltimaModifica, stesso schema) il motore SALTA la chiamata al
// provider (constraint: nessuna chiamata inutile). L'hash è un FNV-1a a 32 bit: non serve
// resistenza crittografica, serve stabilità e zero dipendenze (gira ovunque, anche nei CLI).

import { roundCoord, type GeoCoord } from "./geo";
import { TERRITORY_SCHEMA_VERSION } from "./constants";
import type { EnrichmentFingerprint } from "./types";

export interface FingerprintInput {
  municipality: string;
  origin: GeoCoord;
  /** Valore di UltimaModifica del feed (o updatedAt normalizzato). "" se assente. */
  ultimaModifica: string;
  schemaVersion?: number;
  /** Decimali di arrotondamento della coordinata (default 3 ≈ ~110 m). */
  roundDp?: number;
}

/** Serializza una coordinata arrotondata in una chiave stabile, es. "45.708,8.906". */
export function coordKeyOf(origin: GeoCoord, dp = 3): string {
  const r = roundCoord(origin, dp);
  return `${r.lat.toFixed(dp)},${r.lng.toFixed(dp)}`;
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

/** Costruisce il fingerprint completo (ingressi + hash) da un input coerente. */
export function buildFingerprint(input: FingerprintInput): EnrichmentFingerprint {
  const schemaVersion = input.schemaVersion ?? TERRITORY_SCHEMA_VERSION;
  const dp = input.roundDp ?? 3;
  const coordKey = coordKeyOf(input.origin, dp);
  const municipality = input.municipality;
  const ultimaModifica = input.ultimaModifica ?? "";
  const hash = fnv1a(`${municipality}|${coordKey}|${ultimaModifica}|v${schemaVersion}`);
  return { municipality, coordKey, ultimaModifica, schemaVersion, hash };
}

/** true se due impronte coincidono (confronto sull'hash, che riassume tutti gli ingressi). */
export function fingerprintsEqual(
  a: EnrichmentFingerprint | undefined,
  b: EnrichmentFingerprint | undefined,
): boolean {
  return a !== undefined && b !== undefined && a.hash === b.hash;
}
