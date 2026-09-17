// LA FINESTRA DI OPEN DOMUS, COME DATI.
//
// Chi l'ha chiesto: A19 e A20 di Alberto (13 settembre), spec 2026-09-13 §3.10. Com'è fatta
// oggi: le tende sono due rettangoli color avorio con un foro poligonale. I poligoni sono
// quelli di era-residence (ERA:2720-2769) riportati alle frazioni 4/9, 5/9, 89/90, 1/90,
// 5/27, 22/27, 13/36, 107/108, 1/108, 23/36. Sotto la soglia dei corridoi la foto si apre
// con due rettangoli sfalsati (scarto 19/68, fessura fra 49 % e 51 %). Il modulo non importa
// GSAP e non tocca il DOM al caricamento: lo leggono OpenDomus.tsx, i test unitari e gli e2e.

export const SHUTTER_L = [
  "polygon(0% 0%, 0% 100%, 44.444% 100%, 44.444% 36.111%, 98.889% 36.111%, 98.889% 99.074%, 44.444% 99.074%, 1.111% 100%, 100% 100%, 100% 0%)",
  "polygon(0% 0%, 0% 100%, 44.444% 100%, 44.444% 18.519%, 98.889% 18.519%, 98.889% 81.481%, 44.444% 81.481%, 1.111% 100%, 100% 100%, 100% 0%)",
  "polygon(0% 0%, 0% 100%, 44.444% 100%, 44.444% 18.519%, 100% 18.519%, 100% 81.481%, 44.444% 81.481%, 1.111% 100%, 100% 100%, 100% 0%)",
] as const;

export const SHUTTER_R = [
  "polygon(0% 0%, 0% 100%, 1.111% 100%, 1.111% 0.926%, 55.556% 0.926%, 55.556% 63.889%, 1.111% 63.889%, 1.111% 100%, 100% 100%, 100% 0%)",
  "polygon(0% 0%, 0% 100%, 1.111% 100%, 1.111% 18.519%, 55.556% 18.519%, 55.556% 81.481%, 1.111% 81.481%, 1.111% 100%, 100% 100%, 100% 0%)",
  "polygon(0% 0%, 0% 100%, 0% 100%, 0% 18.519%, 55.556% 18.519%, 55.556% 81.481%, 0% 81.481%, 0% 100%, 100% 100%, 100% 0%)",
] as const;

export const PHONE_CLIP = [
  "polygon(0% 27.941%, 49% 27.941%, 49% 127.941%, 0% 127.941%, 0% 27.941%, 51% -27.941%, 100% -27.941%, 100% 72.059%, 51% 72.059%, 51% -27.941%)",
  "polygon(0% 0%, 49% 0%, 49% 100%, 0% 100%, 0% 0%, 51% 0%, 100% 0%, 100% 100%, 51% 100%, 51% 0%)",
  "polygon(0% 0%, 50% 0%, 50% 100%, 0% 100%, 0% 0%, 50% 0%, 100% 0%, 100% 100%, 50% 100%, 50% 0%)",
] as const;

// La foto sta sullo stage e non subisce la 1,84: resa 100vw sui viewport larghi almeno 3:2,
// 150vh sopra; fermo 84vw da lg; il quadrato (lato 90vw o 84vw) rende 1,5 volte il lato.
export const SIZES_FINESTRA =
  "(prefers-reduced-motion: reduce) and (min-width: 1024px) 84vw, " +
  "(min-width: 1024px) and (min-aspect-ratio: 3/2) 100vw, " +
  "(min-width: 1024px) and (min-aspect-ratio: 1/1) 150vw, " +
  "(min-width: 1024px) 200vw, " +
  "(max-width: 767.98px) 135vw, 126vw";

export const FINESTRA = {
  /** fine della timeline: 3 schermi dopo «top bottom» della section */
  endVh: 3,
  /** pista sotto lo stage: sgancia schermo e stage a +200vh */
  runSvh: 200,
  /** vuoto sopra il contenuto: l'occhiello non compare nell'angolo del foro */
  contentPadSvh: 22,
  shutterScale: 1.84,
  stageFrom: 0.75,
  /** otturatore 0 → 0,5, montanti 0,5 → 0,6, scale 0,6 → 1 */
  shutterEnd: 0.5,
  mullionEnd: 0.6,
  /** sotto la soglia: M0 → M1 in 1,3 s `dtInOut`, M1 → M2 in 0,2 s `none`, IO a 0,35 */
  phoneOpen: 1.3,
  phoneSnap: 0.2,
  phoneThreshold: 0.35,
} as const;

/** Scroll che porta `offset` (px dal bordo alto del contenuto) al 25 % dello schermo dopo lo sgancio. */
export function finestraFocusY(o: { start: number; vh: number; offset: number }): number {
  return o.start + 4 * o.vh + o.offset - 0.25 * o.vh;
}

/** Distanza di `el` dal bordo alto del contenuto, senza la scala dello stage. */
export function offsetInside(content: HTMLElement, el: Element): number {
  const c = content.getBoundingClientRect();
  const scale = content.offsetWidth ? c.width / content.offsetWidth : 1;
  return (el.getBoundingClientRect().top - c.top) / (scale || 1);
}

/** Ordinata, in percentuale, del punto `index` di un `polygon(...)`. */
export function ordinateOf(polygon: string, index: number): number {
  const corpo = /^polygon\((.*)\)$/.exec(polygon.trim());
  if (!corpo) throw new Error(`non è un polygon: ${polygon}`);
  const punto = corpo[1].split(",")[index];
  if (!punto) throw new Error(`punto ${index} assente in ${polygon}`);
  return Number.parseFloat(punto.trim().split(/\s+/)[1]);
}
