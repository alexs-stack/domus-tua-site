// Geometria della stella a 5 punte per le clip-path del capitolo recensioni
// (rif. tecnica: codrops/FullscreenClipEffect — inset morphing; qui il morph
// è tra poligoni a 10 vertici, stessa topologia → GSAP interpola punto a punto).
//
// Il rapporto raggio interno/esterno 0.475 dà la stella "piena" delle recensioni
// (Google-like), non il pentagramma sottile. Punta in alto (rotazione -90°).

export const STAR_INNER_RATIO = 0.475;

/** I 10 vertici (outer/inner alternati) di una stella centrata in (cx, cy). */
export function starVertices(
  cx: number,
  cy: number,
  outer: number,
  inner: number = outer * STAR_INNER_RATIO
): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i < 5; i++) {
    const aOuter = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    const aInner = aOuter + Math.PI / 5;
    pts.push([cx + outer * Math.cos(aOuter), cy + outer * Math.sin(aOuter)]);
    pts.push([cx + inner * Math.cos(aInner), cy + inner * Math.sin(aInner)]);
  }
  return pts;
}

/**
 * `polygon(...)` in percentuali dell'elemento (w×h in px): la stella resta
 * geometricamente regolare anche su elementi non quadrati (viewport).
 */
export function starClipPath(
  w: number,
  h: number,
  cx: number,
  cy: number,
  outer: number,
  inner?: number
): string {
  const pts = starVertices(cx, cy, outer, inner)
    .map(([x, y]) => `${((x / w) * 100).toFixed(3)}% ${((y / h) * 100).toFixed(3)}%`)
    .join(", ");
  return `polygon(${pts})`;
}

/**
 * Stella "aperta": stessa topologia a 10 punti ma con tutti i vertici fuori
 * dal riquadro → l'area visibile è l'intero elemento. È lo stato fullscreen
 * del morph (equivalente dell'`inset(0% round 0)` del riferimento).
 */
export function fullscreenStarClipPath(w: number, h: number): string {
  const r = Math.hypot(w, h);
  // inner deve coprire la diagonale: outer = diagonale / ratio, con margine.
  return starClipPath(w, h, w / 2, h / 2, (r / STAR_INNER_RATIO) * 0.62, r * 0.62);
}

/** Stella statica su elemento quadrato (le 5 tessere): costante, usata anche nel CSS. */
export const STAR_CLIP_SQUARE =
  "polygon(50% 0%, 63.96% 30.79%, 97.55% 34.55%, 72.59% 57.34%, 79.39% 90.45%, 50% 73.75%, 20.61% 90.45%, 27.41% 57.34%, 2.45% 34.55%, 36.04% 30.79%)";
