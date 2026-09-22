// Gli orologi dell'intro, in un posto solo.
//
// La lezione dei «sette orologi» (docs/mobile-parity.md §5.2, poi §3.3 di
// docs/mobile-parity-2.md): il failsafe del boot script, il riarmo negli
// abort, l'autohide CSS, la rete dell'hero, il warmup del telefono, il budget
// e2e e le reti a valle si dichiaravano tutti «allineati» fra loro e ognuno
// aveva il suo numero. Da qui in poi i numeri nascono QUI e basta.
//
// Questo modulo è volutamente puro: niente "use client", niente import. Lo
// legge il root layout (server) per interpolare il boot script inline, lo
// leggono i client (Preloader, HeroCinematic, CookieConsent), lo legge il
// test `app/lib/__tests__/intro-clocks.test.ts`, che rilegge anche
// globals.css e layout.tsx con una regex e pretende che i numeri rimasti in
// CSS (autohide, hero-rest, le keyframe di TUTTI e quattro gli atti, le
// bezier = ease di gsap.ts) combacino con questi: un orologio cambiato da
// solo fa fallire `npm test`.

/** Nome dell'evento di handoff (Preloader → HeroCinematic, CookieConsent). */
export const INTRO_EVENT = "dt:intro:done";
/**
 * Chiave sessionStorage della macchina a stati del sipario (spec §6.2; Alberto,
 * 13 set. 2026, A18, A20, A26): assente, INTRO_FILM, INTRO_SHORT o INTRO_QUIET.
 * La legge il boot script del layout prima del primo paint.
 */
export const INTRO_KEY = "dt-intro-seen";

/**
 * La scaletta, in secondi dal primo fotogramma. È UN solo montaggio, a ogni
 * larghezza (onda «parità mobile 2», legge 3).
 *
 * Atto I (CSS, dal primo paint, anche senza JS): sagoma da 0,15 · lettere del
 *   titolo da 0,12 (stagger .075) · firma da 0,60 (stagger .065) · caps da
 *   0,40 (stagger .11) · payoff da 0,65 (stagger .14). L'ultima lettera in moto
 *   è la 13ª della firma: 0,60 + 1,30 + 12×0,065 ≈ 2,68 → `act1End`.
 * Atto II (CSS): linea di carica 0,60→2,15 · congedo del lockup 2,35→2,90.
 * LA GOMMA (22 set. 2026, Alberto: «devi sostituire l'entrata ad arco del
 *   preloader con questo, al centro dello schermo, affianco a Raffaela, alla sua
 *   destra»): al posto della porta ad arco e del tuffo (atti III-IV, CSS dal
 *   17 agosto) c'è DomusTuaPreloader, che Preloader.tsx monta a `gomma` sotto
 *   la sagoma. Il suo tempo è JavaScript (rAF), non CSS: il foglio scuro è suo,
 *   la gomma disegna il cuore del logo al centro dello schermo, a destra della
 *   mano tesa di Raffaela, e dentro il cuore c'è la foto dell'hero rimpicciolita;
 *   poi la cancellatura si allarga (l'handoff) e la foto scende al suo posto.
 *   Senza JS la gomma non esiste: il sipario sfuma da solo a `senzaJs` (+0,1
 *   l'autohide), come finiva il film di prima.
 */
/**
 * IL TEMPO DEL FILM, in un numero solo. 1 = la timeline com'era nata (4,63 s
 * totali, il montaggio del desktop di sempre), ed è quella di oggi. 2 = la
 * versione lenta (9,26 s), in uso dal 2026-08-19 (31f4231) al 2026-09-10
 * (456026a).
 *
 * TEMPO = 2 fu una scelta di PRODOTTO: la cliente l'aveva chiesta il
 * 2026-08-18, e fu misurata prima di prenderla: «il preloader dev'essere lento
 * come prima, sia da mobile che da desktop — è bello da vedere con le
 * animazioni lente». La lettura era
 * giusta e la causa non era una timeline accorciata: fino alla Fase 1 il film
 * cominciava solo quando atterrava il chunk JS (misurato allora: 2,4-4,7 s di
 * fondo scuro immobile), quindi l'insieme occupava 7-9 s. Da quando è CSS,
 * parte al primo fotogramma e finisce 2-4 s prima: stessi atti, meno intro da
 * guardare. Raddoppiare il film restituiva il tempo, come animazione e non
 * come attesa.
 *
 * Il riferimento della tecnica (era-residence.com, dossier §4) tiene 10,15 s
 * a ogni larghezza: TEMPO = 2 dava 9,26 s, cioè lì; TEMPO = 1 ne dà la metà.
 * Tutto scala insieme — atti, stagger, reti, failsafe, autohide, keyframe
 * CSS — e `intro-clocks.test.ts` lo pretende.
 */
/* 2026-09-10: la cliente chiede un «preloader piu veloce» (riferito da
   Alberto) e Alberto sceglie «Stesso film di oggi ma dimezzato»: TEMPO torna
   a 1. Il riferimento visivo (immobiliaregoldengoal.it) non ha nessun
   preloader. Il 2026-09-11 Alberto ha chiesto l'animazione di entrata «come
   prima»: è tornato l'ingresso (la sagoma sulla banda dell'hero), la durata è
   rimasta 4,63 s. Se «come prima» comprendesse anche i 9,26 s è una domanda
   aperta: non cambiare questo numero senza chiederlo. */
export const TEMPO = 1;

export const INTRO_T = {
  figure: 0.15 * TEMPO,
  figureDur: 0.9 * TEMPO,
  chars: 0.12 * TEMPO,
  charsDur: 1.3 * TEMPO,
  charsStagger: 0.075 * TEMPO,
  script: 0.6 * TEMPO,
  scriptDur: 1.3 * TEMPO,
  scriptStagger: 0.065 * TEMPO,
  caps: 0.4 * TEMPO,
  capsDur: 0.85 * TEMPO,
  capsStagger: 0.11 * TEMPO,
  payoff: 0.65 * TEMPO,
  payoffDur: 1.25 * TEMPO,
  payoffStagger: 0.14 * TEMPO,
  /** Fine dell'ultimo char dell'atto I: qui cade il `will-change` delle lettere. */
  act1End: 2.7 * TEMPO,
  progress: 0.55 * TEMPO,
  track: 0.6 * TEMPO,
  trackDur: 1.55 * TEMPO,
  /**
   * La gomma entra in scena: Preloader.tsx monta DomusTuaPreloader qui, dove
   * partiva la porta ad arco; poi il suo `delay` (0,3 s a foglio pieno) e il
   * tratto da 2,55, mentre il lockup si congeda (2,35→2,90).
   */
  gomma: 2.25 * TEMPO,
  exit: 2.35 * TEMPO,
  exitDur: 0.55 * TEMPO,
  /**
   * Col JS arrivato dopo di qui la gomma suona `veloce`: chi ha già aspettato
   * sull'atto I finito recupera il ritardo invece di allungare l'attesa.
   */
  tardi: 3.13 * TEMPO,
  /** Fin qui il boot script offre lo skip prima che il JS arrivi (dopo: skipCoda + 0,1 < autohide). */
  skip: 3.13 * TEMPO,
  /** Dopo uno skip servito senza JS, quanto il sipario aspetta il JS prima di sfumare (autohide a +0,1). */
  skipCoda: 1.5 * TEMPO,
  /**
   * LA RETE SENZA JS: la gomma è JavaScript, e se non è partita entro qui il
   * sipario sfuma da solo (autohide a +0,1) e l'hero entra per conto suo. È la
   * fine del film di prima (tuffo 3,13 + 1,5): senza JS si entra quando si
   * entrava, e chi ha il JS lo spegne montando la gomma.
   */
  senzaJs: 4.63 * TEMPO,
} as const;

/** La fine del sipario SENZA la gomma (la rete CSS): 4,63 s. */
export const INTRO_MS = Math.round(INTRO_T.senzaJs * 1000);

/**
 * I tempi della gomma, in ms: gli stessi di SPEEDS in DomusTuaPreloader.tsx
 * (il test intro-clocks li confronta; qui non si importa un modulo "use client",
 * che il layout server riceverebbe come riferimento e non come valore).
 * `normale` nel film a tempo; `veloce` nella porta corta, dopo uno skip e col JS
 * in ritardo (INTRO_T.tardi).
 */
export const GOMMA_TEMPI = {
  normale: { delay: 300, draw: 2300, hold: 360, exit: 1050 },
  veloce: { delay: 200, draw: 1500, hold: 240, exit: 820 },
} as const;

/** Il film a tempo: la cancellatura comincia ad allargarsi (l'handoff) a 2,25 + 0,3 + 2,3 + 0,36 = 5,21 s. */
export const GOMMA_REVEAL_MS =
  Math.round(INTRO_T.gomma * 1000) + GOMMA_TEMPI.normale.delay + GOMMA_TEMPI.normale.draw + GOMMA_TEMPI.normale.hold;
/** E finisce (la gomma si smonta, cade l'attributo) a 5,21 + 1,05 = 6,26 s. */
export const GOMMA_MS = GOMMA_REVEAL_MS + GOMMA_TEMPI.normale.exit;

/**
 * La geometria del logo della gomma: i default di DomusTuaPreloader (larghezza
 * = 26 % del lato minore fra 132 e 240 px, centro a 0,47 dell'altezza, sempre
 * al centro in orizzontale), passati per esteso da Preloader.tsx perché la foto
 * dell'hero rimpicciolita (hero.ts `DISCESA`) si centra sullo stesso punto.
 * Al centro dello schermo, a destra della mano tesa di Raffaela: sul desktop la
 * sua mano arriva al 33 % della larghezza, sul telefono il logo le sta sopra.
 */
export const GOMMA_LOGO = { ratio: 0.26, min: 132, max: 240, centroY: 0.47 } as const;

/**
 * L'autohide CSS (globals.css `dt-pre-autohide`): senza JS la gomma non parte e
 * il sipario sfuma da solo a INTRO_MS + 100 ms. Con il JS al timone la gomma
 * lo spegne al montaggio (`html[data-gomma]`) e questa rete non si vede mai.
 */
export const PRE_AUTOHIDE_MS = INTRO_MS + 100;

/**
 * Quanto il boot script aspetta il JS prima di togliere `html[data-preloader]`
 * (e con lui `overflow:hidden`) da solo. Sta DOPO la fine del film — non deve
 * mai tagliare un'intro CSS legittima, che ora suona intera senza JS — e dopo
 * l'autohide: prima l'overlay sfuma, poi cade l'attributo. È un setTimeout:
 * su un thread bloccato dall'idratazione scatta più tardi, accettato — la
 * pagina sotto è già visibile (autohide) e solo lo scroll aspetta. Se il JS
 * arriva prima lo cancella (Preloader.tsx); se arriva dopo, percorso di
 * recupero (`__dtPreArmed`).
 */
export const PRE_FAILSAFE_MS = INTRO_MS + 600;

/**
 * Le reti a valle: hero-rest/hero-intro in CSS, la `safety` di HeroCinematic e
 * CookieConsent. Senza JS il sipario si apre all'autohide (4,73 s): la rete CSS
 * scatta lì più un margine (4,93 s), cioè quando la pagina si scopre. Col JS le
 * reti si spengono all'armamento e le lettere aspettano l'handoff della gomma
 * (5,21 s a tempo); la `safety` di fold.ts conta dal montaggio, quindi scatta
 * dopo. Se il JS arriva dopo che la rete è già scattata, HeroCinematic lo
 * deduce dall'orologio e non rifà l'ingresso.
 */
export const HERO_REST_MS = PRE_AUTOHIDE_MS + 200;
/**
 * La stessa rete SENZA intro (visita di ritorno, hash profondo): non c'è
 * nessun sipario che si apre, quindi un numero da film sarebbe presto — la rete
 * scatterebbe prima dell'idratazione su una macchina lenta e HeroCinematic,
 * trovandola scattata, salterebbe il rito del primo scroll (misurato in e2e
 * col carico dei quattro worker, 2026-08-18). A caldo la rete è quella di
 * sempre: 6 s, «se il bundle non arriva mai». Il boot script marca
 * `data-hero-rest="intro"` solo quando l'intro suona; la CSS e
 * HeroCinematic leggono i due casi.
 */
export const HERO_REST_WARM_MS = 6000;

/**
 * Chiave sessionStorage dello scroll alla ricarica (D22). Preloader.tsx ci
 * scrive `{ p, y, id, dy }` al pagehide:
 * - `p`: percorso;
 * - `y`: scrollY;
 * - `id`: section in vista;
 * - `dy`: scarto dentro la section.
 * Alla ricarica la rilegge per tornare al capitolo. La legge anche
 * e2e/corridors.spec.ts.
 */
export const LAST_Y_KEY = "dt-last-y";

/**
 * Warmup del telefono: `warmFirstFold` deve scadere PRIMA che la cancellatura
 * si allarghi (GOMMA_REVEAL_MS), così l'attesa è coperta dal sipario per
 * costruzione. È anche il `ready` che Preloader.tsx passa alla gomma.
 */
export const WARM_FIRST_FOLD_MS = 3000;

/* LA PORTA CORTA. Alberto il 13 settembre 2026 ha scelto la coreografia piena
   (A18) e la fedeltà letterale (A20): il film intero suona alla prima entrata
   nella home, ogni altro caricamento completo ha la porta corta, e su /case/*
   nessun sipario (A26). Le decisioni di lavoro D31 tolgono lo skip e il fondo
   espresso, e niente corta con ancora, back/forward, scheda nascosta,
   prerender o ricarica oltre mezzo schermo (spec §6.2). Dal 22 settembre la
   corta è la gomma `veloce` sul pannello avorio profondo, montata appena il JS
   arriva, senza l'atto I e senza la linea di carica; senza JS il pannello
   sfuma da solo a SHORT_MS + 100, la fine della corta di prima (porta 0,88 +
   tuffo 1,5). Il test intro-clocks rilegge questi numeri in globals.css e nel
   boot script. */

/** Il film intero è stato armato in questa sessione. */
export const INTRO_FILM = "1";
/** È stata armata una porta corta e mai il film. */
export const INTRO_SHORT = "c";
/** Silenzio: nessun sipario (fixture e2e e sonde). */
export const INTRO_QUIET = "q";
/** Una ricarica più in basso di questa frazione di viewport non ha sipario (D31). */
export const RELOAD_KEEP_Y = 0.5;

export const SHORT_T = {
  /** La rete senza JS della corta: la sua fine di prima (porta 0,88 + tuffo 1,5). */
  senzaJs: 2.38 * TEMPO,
  /** La sagoma su «/» entra in 0,3 s. */
  figureDur: 0.3 * TEMPO,
} as const;

/** La fine della corta SENZA la gomma (la rete CSS): 2,38 s. */
export const SHORT_MS = Math.round(SHORT_T.senzaJs * 1000);
/** L'autohide CSS della corta, come quello del film: fine + 100 ms. */
export const PRE_SHORT_AUTOHIDE_MS = SHORT_MS + 100;
/** Il failsafe del boot script per la corta: fine + 600 ms. */
export const PRE_SHORT_FAILSAFE_MS = SHORT_MS + 600;
/** La rete dell'hero e dei gruppi sopra la piega con la corta: autohide + 200 ms. */
export const HERO_REST_SHORT_MS = PRE_SHORT_AUTOHIDE_MS + 200;

/**
 * Il ritardo della rete per il valore di `data-hero-rest` o `data-hero-intro`
 * scritto dal boot script: "intro" col film, "short" con la corta, "" o
 * assente a caldo. Un solo posto per i tre casi (A18, A20): un ternario a due
 * casi farebbe cadere la corta sulla rete a caldo da 6 s.
 */
export function heroRestMs(value: string | null): number {
  if (value === "intro") return HERO_REST_MS;
  if (value === "short") return HERO_REST_SHORT_MS;
  return HERO_REST_WARM_MS;
}
