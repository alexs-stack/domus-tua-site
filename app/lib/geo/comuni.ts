// Geografia dei comuni per la mappa "Case in vendita" (Prompt: mappa immobili in vendita).
//
// Il feed RealSmart NON fornisce coordinate: solo comune + provincia (l'indirizzo civico è
// spesso omesso per privacy). Quindi la mappa è a livello di COMUNE, non del singolo immobile
// — niente geocoding, niente posizioni esatte delle case (privacy-safe, deterministico).
//
// Qui: una piccola tabella comune→coordinate (area di Tradate, provincia di Varese) e il
// raggruppamento degli immobili DISPONIBILI per comune. I comuni non in tabella non vengono
// persi: finiscono in una lista "Altre zone" accanto alla mappa (vedi PropertyMap).

import type { Property } from "../properties";

/** Coordinate approssimative (centro comune) per il posizionamento relativo dei pin. */
export const COMUNI_COORDS: Record<string, { lat: number; lng: number }> = {
  tradate: { lat: 45.708, lng: 8.906 },
  "abbiate guazzone": { lat: 45.712, lng: 8.92 },
  "venegono superiore": { lat: 45.735, lng: 8.898 },
  "venegono inferiore": { lat: 45.72, lng: 8.895 },
  venegono: { lat: 45.727, lng: 8.896 },
  "castiglione olona": { lat: 45.755, lng: 8.867 },
  "lonate ceppino": { lat: 45.7, lng: 8.882 },
  "gornate olona": { lat: 45.745, lng: 8.858 },
  gornate: { lat: 45.745, lng: 8.858 },
  "vedano olona": { lat: 45.775, lng: 8.855 },
  carnago: { lat: 45.705, lng: 8.845 },
  cairate: { lat: 45.68, lng: 8.87 },
  lozza: { lat: 45.78, lng: 8.85 },
  malnate: { lat: 45.79, lng: 8.88 },
  varese: { lat: 45.82, lng: 8.825 },
  "gazzada schianno": { lat: 45.79, lng: 8.86 },
  morazzone: { lat: 45.76, lng: 8.83 },
  "caronno varesino": { lat: 45.72, lng: 8.84 },
  "solbiate arno": { lat: 45.69, lng: 8.83 },
  mornago: { lat: 45.71, lng: 8.78 },
  sumirago: { lat: 45.72, lng: 8.79 },
  albizzate: { lat: 45.71, lng: 8.81 },
  "jerago con orago": { lat: 45.7, lng: 8.82 },
  "cavaria con premezzo": { lat: 45.69, lng: 8.81 },
  "oggiona con santo stefano": { lat: 45.68, lng: 8.82 },
  besnate: { lat: 45.68, lng: 8.79 },
  gallarate: { lat: 45.66, lng: 8.79 },
  "locate varesino": { lat: 45.72, lng: 8.93 },
  lomazzo: { lat: 45.7, lng: 9.04 },
  saronno: { lat: 45.625, lng: 9.03 },
  // Sud-ovest (asse Busto/Gallarate) e est (verso Como)
  "appiano gentile": { lat: 45.735, lng: 9.01 },
  "fagnano olona": { lat: 45.655, lng: 8.9 },
  samarate: { lat: 45.63, lng: 8.79 },
  "solbiate olona": { lat: 45.66, lng: 8.885 },
  "olgiate olona": { lat: 45.63, lng: 8.865 },
  marnate: { lat: 45.64, lng: 8.885 },
  "gorla maggiore": { lat: 45.66, lng: 8.9 },
  "gorla minore": { lat: 45.645, lng: 8.9 },
  "cassano magnago": { lat: 45.665, lng: 8.82 },
  "busto arsizio": { lat: 45.61, lng: 8.85 },
  cislago: { lat: 45.66, lng: 8.975 },
  gerenzano: { lat: 45.64, lng: 9.0 },
  mozzate: { lat: 45.68, lng: 8.95 },
  carbonate: { lat: 45.7, lng: 8.955 },
};

export interface TownGroup {
  /** Chiave usata dal filtro comune di PropertySearch (= zone.split(",")[0].trim()). */
  key: string;
  /** Nome comune leggibile (senza "(VA)"). */
  town: string;
  /** Numero di immobili DISPONIBILI in questo comune. */
  count: number;
  /** Coordinate, se il comune è nella tabella; altrimenti undefined → lista "Altre zone". */
  coords?: { lat: number; lng: number };
}

/** Normalizza il nome comune per il match in tabella (minuscolo, senza "(prov)"/accenti/spazi). */
function normalizeTown(town: string): string {
  return town
    .replace(/\s*\(.*\)\s*$/, "") // togli "(VA)"
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // togli accenti (diacritici combinanti)
    .replace(/\s+/g, " ")
    .trim();
}

/** Nome comune leggibile (togli il suffisso provincia). */
function displayTown(key: string): string {
  return key.replace(/\s*\(.*\)\s*$/, "").trim();
}

/**
 * Raggruppa gli immobili DISPONIBILI (mai i venduti) per comune, con conteggio e coordinate.
 * Ordina per numero di immobili (desc), poi alfabetico. Nessun dato inventato.
 */
export function groupAvailableByTown(properties: Property[]): TownGroup[] {
  const byKey = new Map<string, number>();
  for (const p of properties) {
    if (p.sold) continue; // mai i venduti in mappa
    const key = p.zone.split(",")[0]!.trim();
    if (!key) continue;
    byKey.set(key, (byKey.get(key) ?? 0) + 1);
  }
  return Array.from(byKey.entries())
    .map(([key, count]) => ({
      key,
      town: displayTown(key),
      count,
      coords: COMUNI_COORDS[normalizeTown(key)],
    }))
    .sort((a, b) => b.count - a.count || a.town.localeCompare(b.town, "it"));
}
