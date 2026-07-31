// Comuni vicini — per "avete qualcosa in un comune qui vicino?".
//
// Riusa la tabella di coordinate già presente per la mappa (app/lib/geo/comuni.ts): il feed
// RealSmart non fornisce coordinate, quindi la vicinanza è a livello di COMUNE, non di
// singolo immobile.
//
// ONESTÀ PRIMA DI TUTTO: la tabella non copre tutti i comuni del catalogo (il feed arriva
// fino a Milano, Legnano, Nebbiuno…). Per un comune non in tabella NON inventiamo vicinanze:
// restituiamo una lista vuota e l'assistente lo dice. Una distanza sbagliata manderebbe una
// persona a visitare una casa a quaranta chilometri da dove cercava.

import { COMUNI_COORDS } from "../../geo/comuni";

/** Raggio entro cui due comuni si considerano "vicini". */
const NEARBY_RADIUS_KM = 12;

/** Distanza in km tra due punti (formula dell'emisenoverso). */
function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Chiave normalizzata per la tabella delle coordinate.
 *
 * Il feed RealSmart scrive "Gornate-Olona" col trattino, la tabella "gornate olona" con lo
 * spazio: senza normalizzare, per quel comune non si trovava nessuna coordinata e quindi
 * nessun vicino — in silenzio, che è il modo peggiore di sbagliare.
 */
function chiave(comune: string): string {
  return comune
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ");
}

function coordsOf(comune: string): { lat: number; lng: number } | undefined {
  return COMUNI_COORDS[chiave(comune)];
}

/** true se conosciamo la posizione del comune: senza, nessuna vicinanza è affermabile. */
export function hasCoordinates(comune: string): boolean {
  return coordsOf(comune) !== undefined;
}

/**
 * Comuni del catalogo vicini a quello indicato, dal più vicino, escluso lui stesso.
 *
 * `candidates` sono i comuni che hanno davvero immobili disponibili: non ha senso proporre
 * un comune vicino che poi non offre nulla.
 */
export function nearbyComuni(comune: string, candidates: string[], limit = 3): string[] {
  const origin = coordsOf(comune);
  if (!origin) return [];

  return candidates
    .filter((c) => chiave(c) !== chiave(comune))
    .map((c) => ({ comune: c, coords: coordsOf(c) }))
    .filter((row): row is { comune: string; coords: { lat: number; lng: number } } => !!row.coords)
    .map((row) => ({ comune: row.comune, km: distanceKm(origin, row.coords) }))
    .filter((row) => row.km <= NEARBY_RADIUS_KM)
    .sort((a, b) => a.km - b.km)
    .slice(0, limit)
    .map((row) => row.comune);
}
