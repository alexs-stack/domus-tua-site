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
 * Raffaela nella foto, in frazione dell'altezza (A74: la figura intera posata su FIGURA di
 * scripts/media/hero-raffaela.mjs, testa a 1833 e suole a 2352 px su 3812; la striscia del telefono è
 * tagliata ai lati dallo stesso WebP, quindi le quote verticali sono le stesse).
 */
export const RAFFAELA = { testa: 0.481, piedi: 0.617 } as const;

/**
 * A75 (Alberto, 22 set. 2026, notte): «la foto risale su dal basso … fino a dove Raffaela dell'immagine
 * entra nella prospettiva». Il respiro fra le sue suole e il fondo del primo schermo, in svh: il CSS lo
 * porta come `--dt-hero-respiro: 6svh` (hero-alto.test li confronta).
 */
export const RESPIRO_SVH = 6;

/**
 * La salita a riposo, in px (D-A75-1, supera D-A49-1): quanto la foto sale sotto la testata perché
 * Raffaela stia INTERA nel primo schermo (la banda, `--dt-band-h`), le suole a `respiro` px dal fondo:
 * è l'inquadratura d'arrivo dell'entrata e quella ferma (reduced-motion, senza JS, a caldo). Mai
 * negativa (sul telefono e sui tablet alti la foto sta già tutta nel primo schermo e resta al suo
 * posto) e mai oltre la cima del blocco (`testo`), che resta sotto la testata. Sopra la banda la foto
 * non si vede: da D-A75-2 il riquadro la ritaglia al bordo della testata (niente logo e menu sopra la
 * villa). Nel CSS è `margin-top: clamp(-testo·H, band − piedi·H − respiro, 0)` sullo strato, in
 * percentuali della larghezza.
 */
export function salitaRiposo(o: { testo: number; piedi: number; fotoH: number; band: number; respiro: number }): number {
  return Math.min(o.testo * o.fotoH, Math.max(0, o.piedi * o.fotoH - o.band + o.respiro));
}

/**
 * A79 (Alberto: «a questa altezza si deve chiudere/rimpicciolire prima, attualmente si chiude troppo in
 * fondo e non si nota neanche quando scrolli»): la cartolina dell'hero corre mentre il FONDO della foto va
 * dal 130 % al 35 % del viewport (ChiusuraFoto `fondo`), un viewport abbondante di scroll con la piscina e il
 * lockup in scena; prima partiva quando il fondo del lockup passava la cima dello schermo e restava solo la
 * coda. Al 130 % il blocco bianco è già uscito dall'alto (1440×900: 60 px sopra il bordo a 1908×894).
 */
export const CHIUSURA: readonly [number, number] = [130, 35];

/**
 * L'ENTRATA (A75): all'handoff del sipario (il tuffo del preloader, INTRO_T.dive o `--pre-skip`; con la
 * porta corta SHORT_T.dive) il lockup «Domus Tua» e la firma entrano al CENTRO del primo schermo, sulla
 * carta, coi ruoli `title` e `accent` di Era scritti in CSS; la foto è sotto, fuori campo. Poi la foto
 * sale dal basso fino all'inquadratura d'arrivo, davanti al lockup (che è dietro di lei e risale più
 * piano, come un fondale), e si ferma quando Raffaela è intera. Tutti i tempi in secondi dall'handoff;
 * globals.css li porta a mano nel blocco «L'ENTRATA DELL'HERO» e hero-alto.test li confronta.
 */
export const ENTRATA = {
  /** Le lettere del lockup: groupDelay("title", 0), stagger 0,05, 1,2 s, dtOut (ROLES.title). */
  lettere: 0.3,
  staggerLettere: 0.05,
  /** La firma: groupDelay("accent", 0), stagger 0,1, 1,2 s, dtOut, origine 50 % 100 % (ROLES.accent). */
  firma: 0.3,
  staggerFirma: 0.1,
  durata: 1.2,
  /**
   * La foto comincia a salire qui: il tuffo del preloader finisce a +1,5 e il lockup formato resta solo
   * sulla carta per 0,7 s, il tempo di leggere «Domus Tua» e la firma (misurato sulla pellicola a
   * 1908×894: con +1,9 la pausa era 0,4 s e la firma non si leggeva).
   */
  sale: 2.2,
  /** Quanto dura la salita: ease domus.inOut, la curva della porta del preloader (0.66,0,0.22,1). */
  saleDurata: 2.1,
  /** Il lockup risale di questi svh mentre la foto gli passa davanti (il fondale: meno della metà della foto). */
  fondale: 55,
  /**
   * Da qui il lockup sfuma, in `sfumaDurata` con dtIn: è sparito prima che il lockup sull'acqua entri in
   * scena col suo rito (sul telefono a +1,15 s dalla salita, misurato a 390×844), così i due «Domus Tua»
   * non stanno mai insieme nello schermo; sul desktop la villa gli passa davanti mentre si ritira.
   */
  sfuma: 2.4,
  sfumaDurata: 0.9,
} as const;

/**
 * LA DISCESA (Alberto, 22 set. 2026, con la gomma al posto dell'arco): «nel preloader sotto lo sfondo
 * scuro mettiamo, invisibile, la foto dell'hero rimpicciolita al centro dello schermo, così quando avviene
 * l'animazione della gomma a forma del logo del cuore fa il reveal; poi, allo zoom del cuore,
 * contemporaneamente la foto scende dove doveva essere, e poi risale come fa già». La foto è quella vera
 * (la scatola `.dt-testa_foto` dello strato, nessuna copia e nessun secondo download): finché la gomma
 * disegna sta rimpicciolita e centrata sul logo; quando la cancellatura comincia ad allargarsi (l'handoff)
 * torna in `durata` al suo posto nello strato, che in quell'istante è giù fuori campo (il `from` di
 * `dt-hero-sale`), e a `ENTRATA.sale` risale come prima. Preloader.tsx scrive la scala e la quota su
 * <html> (`--gomma-foto-s`, `--gomma-foto-y`), globals.css fa il resto («L'ENTRATA DELL'HERO»).
 */
export const DISCESA = {
  /** La foto rimpicciolita è larga così tante volte il logo: il cuore sta tutto dentro la foto. */
  larghezza: 1.3,
  /**
   * La quota della foto (frazione della sua altezza) che cade sul centro del logo: il centro di Raffaela
   * (RAFFAELA, 0,481-0,617), così lei resta intera nel rombo vuoto al centro del cuore e mai tagliata dai
   * tratti (A27); nei lobi la villa, in basso l'acqua.
   */
  centro: 0.549,
  /**
   * Quanto dura il ritorno al suo posto: domus.inOut, la curva della salita. Più della cancellatura
   * (1,05 s): quando la pagina è scoperta tutta la foto è ancora a metà strada, e la si vede scendere.
   */
  durata: 1.6,
  /**
   * L'entrata dell'hero (le lettere, poi la salita a `ENTRATA.sale`) parte così tanti secondi dopo che la
   * cancellatura ha cominciato ad allargarsi: le lettere stanno DIETRO la foto, e nel primo mezzo secondo
   * la foto rimpicciolita è ancora al centro, col cielo trasparente sopra il tetto (pellicola a 1440, 23
   * set.: con l'orologio all'handoff spuntavano pezzi di «Domus» dentro il cuore, sopra la villa).
   */
  entrata: 0.5,
} as const;

/** Altezza / larghezza di una sorgente a quattro decimali: il token `--dt-hero-hw` di globals.css. */
export const hwDi = (sorgente: readonly number[]): number => Number((sorgente[1] / sorgente[0]).toFixed(4));
