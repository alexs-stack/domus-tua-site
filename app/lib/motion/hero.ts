// L'HERO ALTO DELLA HOME, COME DATI (A49 e A71 di Alberto, 22 settembre 2026).
//
// Chi l'ha chiesto: A49, «non c'è né l'immagine alta che fa da sfondo pagina a schermo intero, né
// l'effetto dello scroll dentro l'immagine perché l'hai tagliata a metà e bloccato lo scroll della
// pagina per l'effetto zoom»; A71, «sì, fallo, anche il voto e i due link … e falla no-bg così è più
// bella». Com'è fatto oggi: la foto alta (hero.json, la piscina di Raffaela estesa a 2:3, cielo
// trasparente) è IN FLUSSO come le teste di era (PageHeroTesta, A45/A46): larga tutto, alta quanto è
// resa, nessun corridoio, nessun tuffo, nessuno zoom, nessun lift; le scritte stanno dentro lo strato
// della foto e salgono con lei. Da lg il blocco (occhiello, H1, CTA, i due link, il voto) posa sulla
// foto in bianco nella banda scura — il portico a destra di Raffaela — e il lockup «Domus Tua» con la
// firma sull'acqua, in basso a destra; all'uscita la foto si ritira nella cornice della cartolina
// (ChiusuraFoto, A53). Sotto lg il lockup resta sull'acqua e il blocco segue la foto in inchiostro.
// Il modulo non importa GSAP e non tocca il DOM: lo leggono HeroCinematic.tsx, hero-alto.test.ts e
// gli e2e; globals.css porta gli stessi numeri a mano (il test li confronta).

/** A45: la foto è intera e larga tutto (la scatola ha il rapporto della sorgente): nessun cover che ritagli. */
export const SIZES_HERO = "100vw";

/**
 * Le quote dell'hero, in frazione dell'ALTEZZA della foto. Misurate il 22 set. 2026 con
 * scripts/.probe/a49/acqua.mjs sul WebP col cielo (luminanza e quota di pixel chiari per fasce del 2 %,
 * colonna sinistra x 5-50 %, destra x 50-95 %): il cielo trasparente finisce a 0,192 (`cielo.cima` di
 * hero.json); la villa va da 0,19 a 0,60; Raffaela sta a 0,48-0,615, al centro (x 0,46-0,56); l'acqua
 * da 0,62 a 0,92 ed è CHIARA (L 0,70 a sinistra, 0,54-0,57 a destra fra 0,74 e 0,84); la banda scura
 * vera è il portico a destra di lei, 0,42-0,60 (L 0,28-0,39, chiari < 12 %).
 */
export const HERO = {
  /**
   * D-A49-2: da lg il blocco comincia qui, alla cima del portico a destra di Raffaela (la banda scura
   * misurata), in un terzo di riga a destra (x ≥ 60 %) così nessuna lettera la copre (A27) e la sua mano
   * tesa lo presenta. È anche la PIEGA A RIPOSO (D-A49-1): la foto sale sotto la testata finché il primo
   * schermo non finisce dove comincia il blocco (mai oltre il cielo, mai se la foto è più corta), così
   * il primo schermo è cielo-carta e villa, senza una riga tagliata dalla piega.
   */
  testo: 0.42,
  /** Sotto lg il lockup posa sull'acqua da qui (D-A49-3): la piscina davanti a Raffaela, fino al bordo in cotto. */
  acqua: 0.68,
  /**
   * Da lg il lockup e la firma finiscono qui, sull'acqua a destra (L 0,54-0,57 fra 0,74 e 0,84: grafite
   * 5,5:1, rosso 3:1); sotto resta la CODA libera per la cartolina di A53 (0,15 della foto: 322 px a
   * 1440×900, 229 a 1024×640, sempre più di un quarto di viewport fino a 1024×1366).
   */
  coda: 0.85,
  /** Sotto lg la firma resta sopra il bordo in cotto (0,93-1): il fondo della marca sta a 0,07 dal fondo della foto. */
  cotto: 0.07,
} as const;

/**
 * La salita a riposo, in px (D-A49-1): quanto la foto sale sotto la testata perché il primo schermo
 * (la banda, `--dt-band-h`) finisca dove comincia il blocco; mai oltre il cielo trasparente (il tetto
 * non si taglia mai) e mai negativa (se la foto è più corta del blocco resta al suo posto). Nel CSS è
 * `margin-top: clamp(-cima·H, band − testo·H, 0)` sullo strato, in percentuali della larghezza.
 */
export function salitaRiposo(o: { testo: number; cima: number; fotoH: number; band: number }): number {
  return Math.min(o.cima * o.fotoH, Math.max(0, o.testo * o.fotoH - o.band));
}

/** Altezza / larghezza di una sorgente a quattro decimali: il token `--dt-hero-hw` di globals.css. */
export const hwDi = (sorgente: readonly number[]): number => Number((sorgente[1] / sorgente[0]).toFixed(4));
