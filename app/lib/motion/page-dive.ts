// IL TUFFO DELLE PAGINE INTERNE, IN NUMERI.
//
// A20 di Alberto (13 settembre 2026, «Fedeltà letterale») mette il tuffo sticky su
// tutte le 11 PageHero (spec §5.1). Modulo puro, senza "use client" e senza GSAP:
// lo leggono PageHeroDive e PageHeroBand nel client, il test unitario
// app/lib/__tests__/page-hero-dive.test.ts e l'e2e e2e/page-hero-dive.spec.ts,
// con gli stessi numeri.

/** Posizioni e valori della timeline di durata 1 e del ramo sotto soglia. */
export const DIVE = {
  /** Contenuto e banda salgono da 0 a 0,6 con `dtEase`. */
  liftEnd: 0.6,
  /** La foto va da 1 a 2 fra 0,4 e 1 con `dtIn`, origine 50% 75%. */
  zoomStart: 0.4,
  zoomTo: 2,
  origin: "50% 75%",
  /** Formula di A20 in spec §5.1: il testo esce dall'alto con questo margine prima dello zoom. */
  textMargin: 24,
  /** Formula di A20 in spec §5.1: la corsa del testo è almeno 1,25 volte quella della banda, come in Era. */
  bandFactor: 1.25,
  /** Sotto MQ.corridor lo strato interno della cornice cresce fino a qui: 1,08 fra 768 e 1023 (spec §5.1) e, per D37, anche da 1024 con altezza sotto 640. */
  tabletScale: 1.08,
  /** Sotto 768 (spec §5.1). */
  phoneScale: 1.06,
  /** D33: lo strato nitido si accende sopra questo progresso. */
  sharpAt: 0.4,
  /** D33: lo strato nitido esiste solo per sorgenti più larghe di così. */
  sharpMinSrc: 1920,
  /** D33: attesa massima di requestIdleCallback prima di montarlo. */
  sharpIdleMs: 2500,
} as const;

/** D33 e D04: 100vw da 1024 (i byte dell'LCP non cambiano), 108vw fra 768 e 1023 (zoom 1,08), 200vw sotto 768 (scatola 4:5 con sorgente 3:2 e zoom 1,06). */
export const BAND_SIZES = "(max-width: 767.98px) 200vw, (max-width: 1023.98px) 108vw, 100vw";
/** D33: lo strato nitido del corridoio, a DPR 1. */
export const SHARP_SIZES = "200vw";

/**
 * Spec §5.1 (A20): il fondo del testo di Δt è il più basso fra i `data-dive-text` e la calligrafia
 * (`.script-word` di ScriptWord), perché tutto il contenuto esce dall'alto prima dello zoom. La
 * calligrafia resta fuori dal controllo «nessun testo sulla foto»: a p 0 attraversa la banda per
 * scelta (DESIGN.md:583), poi la lascia salendo col resto.
 */
export const DIVE_BOTTOM_SEL = "[data-dive-text], .script-word";

export type DiveBox = { vh: number; bandTop: number; bandH: number; textBottom: number };

/** Δb = max(0, bordo basso della banda − vh); Δt = max(1,25 · Δb, fondo del testo + 24), fondo letto su DIVE_BOTTOM_SEL. Misure a progresso 0, con offsetTop. */
export function diveDeltas(b: DiveBox): { db: number; dt: number } {
  const db = Math.max(0, b.bandTop + b.bandH - b.vh);
  const dt = Math.max(DIVE.bandFactor * db, b.textBottom + DIVE.textMargin);
  return { db, dt };
}
