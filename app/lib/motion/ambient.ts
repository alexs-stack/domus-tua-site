// Video d'ambiente voluti con la coreografia piena (A18-A20 di Alberto; l'acqua
// di Costi chiari con D25 e D28, il drone del Congedo), spec 2026-09-13 §2.7:
// scelta della sorgente. Funzioni pure, senza React né GSAP: le usa
// useAmbientVideo e le rilegge ambient-video.test.ts. La scelta si fa una volta
// per montaggio.
// A60 (Alberto, 22 set. 2026, sera): la storia di Roberta è un video VERTICALE (1080×1920) con
// un file sd largo 720: `ar` e `sdWidth` dicono al conto la forma e la misura della clip; senza,
// valgono i 16:9 e i 1280 px dei video d'ambiente.

export type AmbientPair = { webm: string; mp4: string };
export type AmbientSources = {
  hd: AmbientPair;
  sd?: AmbientPair;
  /** rapporto larghezza/altezza della clip (16/9 di default) */
  ar?: number;
  /** larghezza in px del file sd (1280 di default) */
  sdWidth?: number;
};

/** Il file sd è largo 1.280 px: fino a 1.408 px resi (+10 %) regge, oltre si passa alla hd. */
export const AMBIENT_SD_MAX_PX = 1408;
const SD_WIDTH = 1280;
const AR_16_9 = 16 / 9;

/** Larghezza resa di una clip di rapporto `ar` in `object-cover` dentro la scatola, in pixel del dispositivo. */
export function renderedWidth(boxW: number, boxH: number, dpr: number, ar: number = AR_16_9): number {
  return Math.max(boxW, boxH * ar) * dpr;
}

/** WebM se il browser lo dà per certo (`canPlayType(...) === "probably"`), altrimenti MP4. */
export function pickAmbientSource(s: AmbientSources, box: { w: number; h: number; dpr: number; webm: boolean }): string {
  const sdMax = ((s.sdWidth ?? SD_WIDTH) * AMBIENT_SD_MAX_PX) / SD_WIDTH;
  const pair = s.sd && renderedWidth(box.w, box.h, box.dpr, s.ar ?? AR_16_9) <= sdMax ? s.sd : s.hd;
  return box.webm ? pair.webm : pair.mp4;
}
