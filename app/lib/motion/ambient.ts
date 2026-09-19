// Video d'ambiente voluti con la coreografia piena (A18-A20 di Alberto; l'acqua
// di Costi chiari con D25 e D28, il drone del Congedo), spec 2026-09-13 §2.7:
// scelta della sorgente. Funzioni pure, senza React né GSAP: le usa
// useAmbientVideo e le rilegge ambient-video.test.ts. La scelta si fa una volta
// per montaggio.

export type AmbientPair = { webm: string; mp4: string };
export type AmbientSources = { hd: AmbientPair; sd?: AmbientPair };

/** Il file sd è largo 1.280 px: fino a 1.408 px resi (+10 %) regge, oltre si passa alla hd. */
export const AMBIENT_SD_MAX_PX = 1408;

/** Larghezza resa di un 16:9 in `object-cover` dentro la scatola, in pixel del dispositivo. */
export function renderedWidth(boxW: number, boxH: number, dpr: number): number {
  return Math.max(boxW, (boxH * 16) / 9) * dpr;
}

/** WebM se il browser lo dà per certo (`canPlayType(...) === "probably"`), altrimenti MP4. */
export function pickAmbientSource(s: AmbientSources, box: { w: number; h: number; dpr: number; webm: boolean }): string {
  const pair = s.sd && renderedWidth(box.w, box.h, box.dpr) <= AMBIENT_SD_MAX_PX ? s.sd : s.hd;
  return box.webm ? pair.webm : pair.mp4;
}
