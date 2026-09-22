// IL NASTRO DI COSTI CHIARI, COME DATI (A72 di Alberto, 22 set. 2026, notte).
//
// Parole esatte: «togliamo il video della piscina, e mettiamo un'altra immagine no-bg alta:
// villa-facciata-piscina-alta-cielo.webp, stesso stile e animazione dello sticky scroll che poi
// diventa scroll orizzontale, ed entra la sezione di Carmine e Seguici». Com'è fatto: un NASTRO come
// la finestra di Open Domus (HorizonScroller con la salita, A57/A65; finestra.ts) con quattro pannelli:
// la facciata della villa bianca con la piscina (costi.json, misurata da scripts/media/finestra.mjs
// sul WebP col cielo trasparente), 2:3, intera, col TITOLO in inchiostro sul cielo che è la carta; il
// claim dei costi (60vw); Carmine (FeaturedTestimonial `panel`, col sipario del nastro e la foto che
// affonda dentro la cornice mentre il pannello attraversa lo schermo); Seguici (Social, titolo per lettera).
// La banda dell'acqua (spec §3.13, D25) è uscita dal codice; i suoi file restano nel repo.
//
// D-A72-1 (mia; rivista la stessa notte dopo Alberto: «non c'è lo sticky scroll che fa salire un po'
// l'immagine»): sul cielo-carta, in inchiostro, sta SOLO il titolo, a destra, come «Open Domus» sta
// sulla facciata; e la salita è quella di A65, il tetto della villa che sale fino a metà delle lettere.
// Sotto il titolo, a destra, la foto ha cielo fino al tetto piatto (0,332 dell'altezza: `cimaTitolo`,
// misurata sul WebP fra il 45 e il 92 % della larghezza); a sinistra ci sono i cipressi (fino a 0,36
// della larghezza, punte a 0,184), e l'inchiostro sui cipressi non si legge: per questo il titolo sta
// a destra. Occhiello, lead e rilancio non stanno né sopra il nastro sulla carta né in bianco sulla
// foto (A70): una salita vera copre tutto ciò che sta sotto il titolo, quindi hanno un pannello loro,
// il CLAIM, come il secondo pannello della finestra (claim in d2 per lettera, intro in misura lead, il
// rilancio pieno). In colonna il titolo sta in flusso prima della foto e il cielo-carta lo continua.
// D-A72-3 (mia): nessuna coda né chiusura in cartolina: la coda della finestra (A67/A68) resta la sola,
// l'hero e il Congedo si chiudono già in cartolina; finito il track lo schermo si sgancia e Seguici se
// ne va col congedo del suo titolo (chapters.ts `social`).
// Il modulo non importa GSAP e non tocca il DOM: lo leggono CostiChiari.tsx, costi.test.ts e gli e2e.

import { leadDistance } from "./finestra";

// A47: la foto è intera e larga tutto a ogni larghezza (la scatola ha il rapporto della sorgente).
export const SIZES_COSTI = "100vw";

export const COSTI = {
  /** Il titolo nel nastro: dal bordo alto dello schermo, come le scritte della coda della finestra (globals.css `.dt-cc_riga`). */
  rigaTop: "12svh",
  /**
   * La cima del soggetto SOTTO il titolo (a destra, dal 45 al 92 % della larghezza): il tetto piatto
   * della villa, in frazione dell'altezza del WebP. Non la cima di costi.json (0,219, le punte dei
   * cipressi a sinistra, dove il titolo non sta). Misurata il 22 set. sul WebP col cielo trasparente.
   */
  cimaTitolo: 0.332,
  /** A65: la salita finisce quando il tetto arriva a questa frazione dell'altezza del titolo, dal suo bordo alto. */
  copri: 0.5,
  /** i pannelli del nastro: la facciata col titolo, il claim dei costi, Carmine, Seguici */
  panels: 4,
} as const;

/**
 * L'arrivo della facciata prima del nastro, in px: il tetto (cimaTitolo × altezza resa della foto)
 * meno `copri` (px dalla cima della cornice dove il tetto deve arrivare: metà del titolo), mai
 * negativo. La stessa formula della salita della finestra (leadDistance).
 */
export function arrivoDistance(o: { fotoH: number; copri: number }): number {
  return leadDistance({ cima: COSTI.cimaTitolo, fotoH: o.fotoH, copri: o.copri });
}
