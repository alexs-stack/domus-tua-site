// LA FINESTRA DI OPEN DOMUS, COME DATI.
//
// Com'è fatta oggi (A57 e A58 di Alberto, 22 set. 2026, sera): un NASTRO come «Tra la Pineta e
// Milano» (HorizonScroller, spec 2026-09-13 §3.5), con la facciata che sale davanti. Parole esatte:
// A58 «togli l'animazione dell'immagine di open domus all'entrata, mantieni la stessa posizione ma
// lasciala a schermo intero da subito (non serve neanche l'animazione di uscita che si chiude,
// perché con il punto 5 con lo scroll orizzontale andando verso destra usciamo dalla foto)»;
// A57 «aggiungere lo stesso effetto di scroll orizzontale con gsap e animazione entrata immagine
// come in "Tra la Pineta e Milano" nella sezione Open domus della home, all'altezza dello
// screenshot allegato» — lo screenshot è la facciata a schermo intero con la cima delle terrazze
// sotto il bordo alto.
// Tre pannelli: la foto (9:16, intera, il titolo sul cielo che è la carta), il claim col video di
// Teresa, le due liste con la CTA e Raffaela sulla soglia. Nel corridoio la cornice della foto sale
// dentro lo schermo agganciato (la «salita», `leadDistance`) finché la cima del soggetto non sta a
// `leadTop` del viewport — la posa dello screenshot —, poi il nastro scorre di lato e la foto esce a
// sinistra. Niente tende, niente stage in scala, niente chiusura in cartolina: la foto è a schermo
// intero da subito, in flusso, come le teste (A45). Sotto la soglia dei corridoi, con reduced-motion
// e senza JS i tre pannelli sono in colonna e la foto è intera.
// Il modulo non importa GSAP e non tocca il DOM: lo leggono OpenDomus.tsx, finestra.test.ts e gli e2e.

// A47: la foto è intera e larga tutto a ogni larghezza (la scatola ha il rapporto della sorgente,
// `--dt-od-ar`): nessun cover che ritagli, come SIZES_TESTA.
export const SIZES_FINESTRA = "100vw";

/** La foto del terzo pannello: Raffaela sulla soglia (A57; 2:3, intera, alta 80svh nel nastro). */
export const PORTA = {
  file: "/images/reali/raffaela-porta-alta.jpg",
  sorgente: [2560, 3816] as const,
  /** nel nastro la scatola è alta 80svh e larga di conseguenza; in colonna è larga come la riga */
  sizes: "(max-width: 1023px) 90vw, 40vw",
} as const;

export const FINESTRA = {
  /**
   * A57: la salita finisce quando la cima del soggetto della foto (finestra.json `cielo.cima`) sta a
   * questa frazione del viewport dal bordo alto: è la posa dello screenshot di Alberto (la cima
   * delle terrazze a ~100 px su 981).
   */
  leadTop: 0.1,
  /** i pannelli del nastro: la foto, il claim col video, le liste con Raffaela sulla soglia */
  panels: 3,
} as const;

/**
 * La salita della facciata prima del nastro, in px: la cima del soggetto (cima × altezza resa della
 * foto) meno `leadTop × vh`, mai negativa. È la corsa verticale che HorizonScroller aggiunge
 * all'altezza della sezione (il gesto resta 1:1) e che scrubba sulla cornice prima del track.
 */
export function leadDistance(o: { cima: number; fotoH: number; vh: number }): number {
  return Math.max(0, o.cima * o.fotoH - FINESTRA.leadTop * o.vh);
}
