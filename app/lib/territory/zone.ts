// Zone: dal NOME DI ZONA del feed al centroide curato (miglioria post-Prompt 18).
//
// PERCHÉ ESISTE. Il feed RealSmart porta già la zona in chiaro ("Tradate, Abbiate Guazzone",
// "Tradate, centro"). Prima, per usare la precisione `zone-centroid`, servivano DUE curature: i
// centroidi E la mappa immobile→zona, codice per codice — lavoro O(annunci) che invecchia a ogni
// nuovo annuncio. Qui la zona si deduce dal nome che il feed già dichiara: si curano UNA VOLTA i
// centroidi (~10 righe) e tutti gli annunci presenti e futuri di quella zona ne beneficiano.
//
// PRIVACY. Un centroide di zona è un punto PUBBLICO (il centro di una frazione/quartiere), non
// l'immobile: non richiede autorizzazione, esattamente come il centroide comunale. Migliora
// l'accuratezza (±500 m invece di ±2000 m) senza avvicinarsi alla casa.

import { normalizeMunicipality } from "./geo";
import type { TerritoryZoneCentroid } from "./types";

/**
 * Estrae lo slug di zona dal campo `zone` del feed, che di norma è "Comune, Zona" oppure il solo
 * comune. Ritorna `null` quando la zona coincide col comune (nessuna sotto-area da risolvere).
 *
 *   "Tradate, Abbiate Guazzone" → { municipality: "tradate", zone: "abbiate-guazzone" }
 *   "Tradate, centro"           → { municipality: "tradate", zone: "centro" }
 *   "Venegono Superiore"        → { municipality: "venegono-superiore", zone: null }
 */
export function parseZoneField(zoneField: string, fallbackTown?: string): {
  municipality: string;
  zone: string | null;
} {
  const parts = zoneField
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  if (parts.length === 0) {
    return { municipality: normalizeMunicipality(fallbackTown ?? ""), zone: null };
  }
  // Primo segmento = comune; i successivi = denominazione della zona.
  const municipality = normalizeMunicipality(parts[0]);
  if (parts.length === 1) return { municipality, zone: null };
  const zone = normalizeMunicipality(parts.slice(1).join(" "));
  // Una "zona" uguale al comune non è una sotto-area.
  return { municipality, zone: zone === municipality || zone.length === 0 ? null : zone };
}

/** Chiave d'indice di una zona: comune + zona, così due "centro" di comuni diversi non collidono. */
export function zoneKey(municipality: string, zone: string): string {
  return `${normalizeMunicipality(municipality)}/${normalizeMunicipality(zone)}`;
}

/**
 * Costruisce un indice di lookup per nome dai centroidi curati. Il risultato è la funzione che il
 * risolutore d'origine consulta: (comune, zona) → centroide, oppure undefined se non curato (e
 * allora si ripiega, in sicurezza, sul centroide comunale).
 */
export function buildZoneIndex(
  zones: readonly TerritoryZoneCentroid[],
): (municipality: string, zone: string) => TerritoryZoneCentroid | undefined {
  const index = new Map<string, TerritoryZoneCentroid>();
  for (const z of zones) index.set(zoneKey(z.municipality, z.slug), z);
  return (municipality, zone) => index.get(zoneKey(municipality, zone));
}
