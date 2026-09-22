// LA FINESTRA DI OPEN DOMUS, COME DATI.
//
// Com'è fatta oggi (A57 e A58 di Alberto, 22 set. 2026, sera; poi A65-A67 la stessa sera): un NASTRO
// come «Tra la Pineta e Milano» (HorizonScroller, spec 2026-09-13 §3.5), con la facciata che sale
// davanti e una coda che scende dietro. Parole esatte: A58 «togli l'animazione dell'immagine di open
// domus all'entrata, mantieni la stessa posizione ma lasciala a schermo intero da subito (non serve
// neanche l'animazione di uscita che si chiude, perché con il punto 5 con lo scroll orizzontale
// andando verso destra usciamo dalla foto)»; A57 «aggiungere lo stesso effetto di scroll orizzontale
// con gsap e animazione entrata immagine come in "Tra la Pineta e Milano" nella sezione Open domus
// della home, all'altezza dello screenshot allegato»; A65 «quando arriviamo a sto punto esatto dello
// screenshot [il titolo solo sulla carta], vorrei che si bloccasse sticky la scritta e salisse un po'
// l'immagine, fino a coprire da sotto le lettere circa di Open domus con il tetto della casa a scala,
// una volta arrivata lì, si sblocca e parte lo scroll orizzontale»; A66 «nello scroll orizzontale le
// scritte sono troppo piccole, rendile grandi e animate come nell'altro scroll orizzontale, dove le
// scritte si muovono e vanno sopra la foto o dietro»; A67 «al posto dell'immagine di raffaela nello
// scroll orizzontale seconda sezione, vorrei un'altra immagine no bg, in modo che si arriva da destra
// e poi si scende giù con lo scroll normale sull'immagine» (la piscina lunga, scelta da Alberto).
// Tre pannelli: la foto (9:16, intera, il titolo sul cielo che è la carta); il claim in d2 col video
// di Teresa; la coda: la piscina no-bg a tutta larghezza col titolo a gradini, le due liste e il
// rilancio posati sopra. Nel corridoio la SALITA muove solo la scatola della foto (il titolo resta
// fermo) finché la cima delle terrazze non arriva a `copri` dell'altezza del titolo; poi il nastro
// scorre di lato; poi la CODA: la piscina, arrivata già alzata (`codaSopra`), scende 1:1 con lo
// scroll insieme alle scritte finché il suo fondo non tocca il fondo dello schermo, e lì la sezione
// finisce. Niente tende, niente stage in scala, niente chiusura in cartolina. Sotto la soglia dei
// corridoi, con reduced-motion e senza JS i tre pannelli sono in colonna e le foto sono intere.
// Il modulo non importa GSAP e non tocca il DOM: lo leggono OpenDomus.tsx, finestra.test.ts e gli e2e.

// A47: le foto sono intere e larghe tutto a ogni larghezza (le scatole hanno il rapporto della
// sorgente): nessun cover che ritagli, come SIZES_TESTA.
export const SIZES_FINESTRA = "100vw";

export const FINESTRA = {
  /**
   * A65: la salita finisce quando la cima del soggetto della facciata (finestra.json `cielo.cima`)
   * arriva a questa frazione dell'altezza del titolo, dal suo bordo alto: a metà delle lettere, «fino
   * a coprire da sotto le lettere circa di Open Domus con il tetto della casa a scala».
   */
  copri: 0.5,
  /**
   * A67: la coda arriva da destra col soggetto della foto (coda.json `cielo.cima`) a questa frazione
   * del viewport dal bordo alto: sopra c'è la carta del cielo, dove posano le scritte.
   */
  codaSopra: 0.55,
  /** i pannelli del nastro: la foto, il claim col video, la coda */
  panels: 3,
} as const;

/**
 * La salita della facciata prima del nastro, in px: la cima del soggetto (cima × altezza resa della
 * foto) meno `copri` (px dalla cima della cornice dove il tetto deve arrivare: metà del titolo), mai
 * negativa. HorizonScroller la aggiunge all'altezza della sezione (il gesto resta 1:1) e la scrubba
 * sulla scatola della foto prima del track.
 */
export function leadDistance(o: { cima: number; fotoH: number; copri: number }): number {
  return Math.max(0, o.cima * o.fotoH - o.copri);
}

/** Quanto la foto della coda arriva già alzata (≤ 0): il soggetto al `codaSopra` del viewport. */
export function codaFrom(o: { cima: number; fotoH: number; vh: number }): number {
  return -Math.max(0, o.cima * o.fotoH - FINESTRA.codaSopra * o.vh);
}

/** La corsa della coda dopo il nastro: quel che resta della foto sotto lo schermo, mai negativa. */
export function codaDistance(o: { fotoH: number; vh: number; from: number }): number {
  return Math.max(0, o.fotoH - o.vh + o.from);
}
