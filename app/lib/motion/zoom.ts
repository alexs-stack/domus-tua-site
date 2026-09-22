// Services, capitolo 11 (spec 2026-09-13 §3.12; A20 di Alberto, D27): l'interno
// della foto scende da ZOOM_FROM a 1 mentre la scatola entra.
// `sizes` chiede i pixel resi all'inizio dello zoom (regola dei `sizes` di
// DESIGN.md): scatola × rapporto del file × ZOOM_FROM. La scatola è
// `.dt-media-half`: 90vw sotto 768 px, 84vw fino a 1023, 42vw da 1024 con
// tetto 640 px (moduli media di globals.css), quindi 640 px da 1524 in su.
export const ZOOM_FROM = 1.15;

export function zoomSizes(ratio: number, z = ZOOM_FROM): string {
  const k = Math.max(1, ratio) * z;
  return `(max-width:767px) ${Math.ceil(90 * k)}vw, (max-width:1023px) ${Math.ceil(84 * k)}vw, (min-width:1524px) ${Math.ceil(640 * k)}px, ${Math.ceil(42 * k)}vw`;
}
