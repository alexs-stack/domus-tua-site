// LA LAMA — i numeri del ruolo `media` (A36 di Alberto, 19 settembre 2026: «per le
// foto non a schermo intero … vorrei questi effetti del sito di era-residence, tipo
// una slide transition di entrata»; decisioni D200-D219 del brief
// .superpowers/sdd/2026-09-13-coreografia-era-residence/qualita/a36/).
//
// Modulo puro, senza "use client", senza GSAP e senza import: lo legge LamaMedia
// nel client, lama.test.ts lo ricalcola. La forma è `animateSlide` di
// era-residence alla lettera (il parallelogramma di Voci, clip.ts): il ritaglio
// apre dal bordo con un lato inclinato del 25 % che si raddrizza mentre corre, e
// nello stesso tempo la foto scivola di X % e si assesta. Differenze dichiarate
// (brief §0): scala 1 sempre (A27: nessuna foto tagliata in nessuno stato),
// scivolo ≤ 10 % e meno dove la persona non lascia margine, verso da destra salvo
// le persone e la regola della fila, uscita 0,4 s con l'immagine ferma.

export type LamaFrom = "left" | "right";

/** Tempi e curve del ruolo (D214): entrata 1,2 s dtInOut (durDt.l), uscita 0,4 s dtIn (durDt.s); nessuna CustomEase nuova. */
export const LAMA = {
  dur: 1.2,
  ease: "dtInOut",
  outDur: 0.4,
  outEase: "dtIn",
  /** Lo scivolo massimo, in percentuale della scatola (era: 25). */
  xMax: 10,
  /** L'IO d'entrata: il «top bottom» di era, 0 px. */
  entryMargin: "0px",
  /** L'IO d'uscita: la linea dell'85 % (D21). */
  exitMargin: "0px 0px -15% 0px",
} as const;

/**
 * Ritardo del membro i-esimo di un gruppo `[data-lama-group]` (D204): 0,3 + i × 0,1,
 * tetto 5, scritto in decimi perché `0.3 + 3 * 0.1` in JS vale 0,6000000000000001.
 */
export function delayFor(i: number): number {
  return (3 + Math.min(Math.max(0, Math.floor(i)), 5)) / 10;
}

const pct = (n: number) => `${Number(n.toFixed(3))}%`;
const clamp01 = (p: number) => Math.min(1, Math.max(0, p));

/**
 * Il ritaglio d'entrata a progresso `e` (già passato per la curva): da destra
 * la testa del bordo sta a 100(1−e) % e il piede a 125(1−e) %; da sinistra è lo
 * specchio. A e 1 il rettangolo pieno, a e 0 una fessura fuori dalla scatola.
 * La famiglia è affine in e: un `to` verso clipSlantFrom(0) ripercorre esattamente
 * l'entrata all'indietro (D213).
 */
export function clipSlantFrom(e: number, from: LamaFrom): string {
  const t = clamp01(e);
  if (from === "right") {
    return `polygon(${pct(100 - 100 * t)} 0%, 100% 0%, ${pct(101 - t)} 100%, ${pct(125 - 125 * t)} 100%)`;
  }
  return `polygon(0% 0%, ${pct(100 * t)} 0%, ${pct(125 * t - 25)} 100%, ${pct(t - 1)} 100%)`;
}

/**
 * Il ritaglio d'uscita da `aperto` (D213): il bordo inclinato parte dal lato
 * opposto e collassa verso il lato d'ingresso, con la foto ferma.
 */
export function clipSlantOut(s: number, from: LamaFrom): string {
  const t = clamp01(s);
  if (from === "right") {
    return `polygon(0% 0%, ${pct(100 - 100 * t)} 0%, ${pct(125 - 125 * t)} 100%, 0% 100%)`;
  }
  return `polygon(${pct(100 * t)} 0%, 100% 0%, 100% 100%, ${pct(125 * t - 25)} 100%)`;
}

/**
 * La X dal margine dei corpi (D201): `m` è il margine libero, in frazione della
 * scatola, fra il riquadro dei corpi e il bordo della finestra a riposo sul lato
 * da cui la foto entra. X = min(10, ⌊100·m⌋); sotto 3 vale 0 (solo il bordo).
 */
export function xDaMargine(m: number): number {
  const x = Math.min(LAMA.xMax, Math.floor(100 * m + 1e-9));
  return x < 3 ? 0 : x;
}

export type LamaId =
  | "sede"
  | "paths-vendi"
  | "paths-acquista"
  | "chi-siamo"
  | "chiavi"
  | "testimonianza-recensione"
  | "testimonianza-consulenza";

/**
 * Le sette foto, con verso e scivolo decisi col numero (brief §3-§4, D201-D203;
 * margini misurati in qualita/a36/sintesi/misure.json):
 * - sede (`consulenza.jpg` a `100% 50%`): la cliente tocca il bordo destro del
 *   file → da sinistra, margine sinistro 13,1 % → 10;
 * - Paths 1 (`raffaela-specchio-profilo.jpg`): da sinistra per la regola della
 *   fila (Voci, che precede, apre da destra: A28 (10)), margine 3,3 % → 3;
 * - Paths 2 (`hero-raffaela-villa.jpg` dal 22 set. 2026, A55; prima `villa-pool.jpg`, 47 %): da sinistra per la stessa regola → 10;
 * - Chi siamo (`villa-pool.jpg`): da destra, 36,5 % → 10;
 * - le chiavi (`raffaela-keys.jpg` a `50% 0%`): da destra, 4,0 % → 4;
 * - la testimonianza con la copertina cotta (`recensione-clienti.jpg`, trim): i
 *   corpi toccano i due bordi → solo il bordo, X 0;
 * - la testimonianza con `consulenza.jpg` (/acquista, senza trim): da sinistra, 10.
 */
export const LAMA_FOR: Record<LamaId, { from: LamaFrom; x: number }> = {
  sede: { from: "left", x: 10 },
  "paths-vendi": { from: "left", x: 3 },
  "paths-acquista": { from: "left", x: 10 },
  "chi-siamo": { from: "right", x: 10 },
  chiavi: { from: "right", x: 4 },
  "testimonianza-recensione": { from: "right", x: 0 },
  "testimonianza-consulenza": { from: "left", x: 10 },
};

/** Il segno dello scivolo: da destra l'interno parte a +X, da sinistra a −X. */
export function xIniziale(id: LamaId): number {
  const { from, x } = LAMA_FOR[id];
  return from === "right" ? x : -x;
}
