// Modello dell'ESPLORATORE schematico di distanze — PURO, isomorfo, testabile (Prompt 12).
//
// Trasforma le categorie di vista (nome + distanza in metri) in un diagramma radiale a percentuali:
// anelli di distanza e punti collocati per DISTANZA (raggio) e per CATEGORIA (angolo di settore).
//
// PRIVACY per costruzione: non esistono coordinate geografiche nel payload pubblico, quindi il
// diagramma NON può rivelare una posizione. Gli angoli sono assegnati per categoria, non per direzione
// reale: sono ILLUSTRATIVI. Il centro rappresenta la base d'origine (immobile/zona/comune), mai una
// coordinata. Tutte le misure sono in percentuale del riquadro (viewBox 100×100, centro 50,50).

import { formatDistance, type TerritoryLocale, type TerritoryViewCategory } from "./view";

/** Raggio massimo (in % dal centro) a cui arriva l'anello esterno. */
const OUTER_RADIUS_PCT = 46;
/** Ladder di distanze "tonde" per gli anelli e per la scala (metri). */
const RING_LADDER: readonly number[] = [100, 250, 500, 750, 1000, 1500, 2000, 3000, 5000, 7500, 10000, 15000];

export interface ExplorerRing {
  distanceMeters: number;
  radiusPct: number;
  label: string;
}

export interface ExplorerPoint {
  key: string;
  category: TerritoryViewCategory["category"];
  categoryLabel: string;
  name: string;
  distanceMeters: number;
  distanceLabel: string;
  angleDeg: number;
  /** Coordinate SCHEMATICHE in percentuale del riquadro (centro 50,50). Nessuna geolocalizzazione. */
  xPct: number;
  yPct: number;
}

export interface ExplorerModel {
  rings: ExplorerRing[];
  points: ExplorerPoint[];
  maxDistanceMeters: number;
  /** Distanza "tonda" a cui corrisponde l'anello esterno (scala). */
  scaleMeters: number;
}

/** Prima distanza della ladder ≥ max; se nessuna, la max stessa (fallback). */
function niceScale(maxMeters: number): number {
  for (const v of RING_LADDER) if (v >= maxMeters) return v;
  return Math.max(maxMeters, RING_LADDER[0]);
}

/** Fino a 3 anelli "tondi" ≤ scala (i più grandi), sempre includendo la scala esterna. */
function ringDistances(scale: number): number[] {
  const below = RING_LADDER.filter((v) => v <= scale);
  const chosen = below.slice(-3);
  if (!chosen.includes(scale)) chosen.push(scale);
  return [...new Set(chosen)].sort((a, b) => a - b);
}

/**
 * Costruisce il modello del diagramma dalle categorie GIÀ filtrate/ordinate dalla UI. Deterministico:
 * stessa input → stesso output. Angoli assegnati per settore di categoria (illustrativi), punti della
 * stessa categoria distribuiti a ventaglio per non sovrapporsi.
 */
export function buildExplorerModel(categories: TerritoryViewCategory[], locale: TerritoryLocale): ExplorerModel {
  const withPois = categories.filter((c) => c.pois.length > 0);
  const allDistances = withPois.flatMap((c) => c.pois.map((p) => p.distanceMeters));
  const maxDistanceMeters = allDistances.length > 0 ? Math.max(...allDistances) : 0;
  const scaleMeters = niceScale(maxDistanceMeters || RING_LADDER[0]);

  const rings: ExplorerRing[] = ringDistances(scaleMeters).map((d) => ({
    distanceMeters: d,
    radiusPct: (d / scaleMeters) * OUTER_RADIUS_PCT,
    label: formatDistance(d, locale),
  }));

  const n = withPois.length;
  const points: ExplorerPoint[] = [];
  withPois.forEach((cat, ci) => {
    // Angolo base del settore della categoria (0° = alto, in senso orario).
    const baseAngle = n > 0 ? (360 / n) * ci : 0;
    const k = cat.pois.length;
    cat.pois.forEach((poi, pi) => {
      // Ventaglio simmetrico entro ±18° attorno al settore per separare i punti della stessa categoria.
      const spread = k > 1 ? ((pi - (k - 1) / 2) / Math.max(k - 1, 1)) * 36 : 0;
      const angleDeg = baseAngle + spread;
      const radiusPct = scaleMeters > 0 ? (poi.distanceMeters / scaleMeters) * OUTER_RADIUS_PCT : 0;
      const rad = (angleDeg * Math.PI) / 180;
      points.push({
        key: `${cat.category}-${pi}`,
        category: cat.category,
        categoryLabel: cat.label,
        name: poi.name,
        distanceMeters: poi.distanceMeters,
        distanceLabel: poi.distanceLabel,
        angleDeg,
        xPct: 50 + radiusPct * Math.sin(rad),
        yPct: 50 - radiusPct * Math.cos(rad),
      });
    });
  });

  return { rings, points, maxDistanceMeters, scaleMeters };
}
