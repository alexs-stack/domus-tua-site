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
/** Chiave sessionStorage: l'intro suona una volta per sessione. */
export const INTRO_KEY = "dt-intro-seen";

/**
 * La scaletta, in secondi dal primo fotogramma. È UN solo montaggio, a ogni
 * larghezza (onda «parità mobile 2», legge 3): sul telefono cambiano le
 * geometrie dell'arco (vw/vh: globals.css `--arch-w0…`), mai questi tempi.
 *
 * DAL 2026-08-17 (opzione D, docs/mobile-parity-2.md §8.5) TUTTO IL FILM È
 * CSS, deterministico dal primo paint: le keyframe di globals.css portano
 * questi stessi numeri come delay/durate, e il test intro-clocks li rilegge.
 * Il JS (Preloader.tsx) non muove più la maschera: mette i timer di handoff e
 * chiusura sull'orologio CSS, e guida con GSAP SOLO in ripiego (browser senza
 * `@property`, o keyframe mai partite).
 *
 * Atto I (CSS): sagoma da 0,15 · lettere del titolo da 0,12 (stagger .075) ·
 *   firma da 0,60 (stagger .065) · caps da 0,40 (stagger .11) · payoff da
 *   0,65 (stagger .14). L'ultima lettera in moto è la 13ª della firma:
 *   0,60 + 1,30 + 12×0,065 ≈ 2,68 → `act1End`.
 * Atti II-IV (CSS, e GSAP in ripiego): linea di carica 0,60→2,15 · porta
 *   2,25→3,35 · congedo 2,35 · tuffo 3,13→4,63. Porta e tuffo si
 *   SOVRAPPONGONO per 0,22 s (3,13-3,35), come i due tween GSAP di sempre: il
 *   tuffo parte dal valore che la porta ha a 3,13 (progresso 0,8 di
 *   domus.inOut = 0,972 della corsa: `--arch-k` in globals.css) e da lì vince.
 */
export const INTRO_T = {
  figure: 0.15,
  figureDur: 0.9,
  chars: 0.12,
  charsDur: 1.3,
  charsStagger: 0.075,
  script: 0.6,
  scriptDur: 1.3,
  scriptStagger: 0.065,
  caps: 0.4,
  capsDur: 0.85,
  capsStagger: 0.11,
  payoff: 0.65,
  payoffDur: 1.25,
  payoffStagger: 0.14,
  /** Fine dell'ultimo char dell'atto I: qui cade il `will-change` delle lettere. */
  act1End: 2.7,
  progress: 0.55,
  track: 0.6,
  trackDur: 1.55,
  arch: 2.25,
  archDur: 1.1,
  exit: 2.35,
  exitDur: 0.55,
  dive: 3.13,
  diveDur: 1.5,
  /** Ripiego senza mask-composite: sipario clip-path. */
  curtain: 2.6,
  curtainDur: 0.9,
} as const;

/** Durata dell'intro con la maschera ad arco: 3,13 + 1,50 = 4,63 s. */
export const INTRO_MS = Math.round((INTRO_T.dive + INTRO_T.diveDur) * 1000);

/**
 * L'autohide CSS (globals.css `dt-pre-autohide`): il film è tutto CSS, quindi
 * la fine del tuffo è nota anche senza JS — l'overlay va a opacity 0 +
 * visibility hidden appena dopo (INTRO_MS + 100 ms) e senza JS l'intro
 * finisce pulita. Con il JS al timone `finish()` toglie l'attributo prima e
 * questa rete non si vede mai.
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
 * CookieConsent. Con il film in CSS le lettere dell'hero devono accendersi
 * quando la porta si apre ANCHE SENZA JS: la rete CSS scatta al tuffo più un
 * margine (dive + 200 ms ≈ 3,33 s), cioè dentro l'intro, non dopo. Se il JS
 * arriva dopo che la rete è già scattata, HeroCinematic lo deduce
 * dall'orologio e non rifà l'ingresso (le lettere non spariscono e rientrano).
 */
export const HERO_REST_MS = Math.round((INTRO_T.dive + 0.2) * 1000);
/**
 * La stessa rete SENZA intro (visita di ritorno, hash profondo): non c'è
 * nessuna porta che si apre a 3,13, quindi 3,33 s sarebbe presto — la rete
 * scatterebbe prima dell'idratazione su una macchina lenta e HeroCinematic,
 * trovandola scattata, salterebbe il rito del primo scroll (misurato in e2e
 * col carico dei quattro worker, 2026-08-18). A caldo la rete è quella di
 * sempre: 6 s, «se il bundle non arriva mai». Il boot script marca
 * `data-hero-rest="intro"` solo quando l'intro suona; la CSS e
 * HeroCinematic leggono i due casi.
 */
export const HERO_REST_WARM_MS = 6000;

/**
 * Warmup del telefono: `warmFirstFold` deve scadere PRIMA del tuffo, così
 * l'attesa è coperta dal sipario per costruzione (≤ INTRO_MS − tuffo).
 */
export const WARM_FIRST_FOLD_MS = 3000;
