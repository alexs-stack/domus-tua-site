"use client";

// Preloader "Arco Domus" — prima visita della sessione: l'ORCHESTRATORE del
// film, non più il suo motore. Non rende markup: quello è di
// PreloaderShell.tsx (server). Non muove più la maschera: quello è CSS.
//
// Coreografia rif. era-residence.com (reverse-engineering/era-residence/):
// lockup + progress, poi una PORTA AD ARCO sale dal fondo (maschera CSS a
// 4 layer, vedi globals.css) e ci si "tuffa" dentro l'hero: al tuffo parte
// INTRO_EVENT e HeroCinematic accende le lettere. La foto dell'hero resta a
// scale 1 — è la sagoma del preloader a coincidere con lei pixel su pixel.
//
// COM'È FATTA, DAL 2026-08-17 (onda «parità mobile 2», Fase 1, opzione D —
// docs/mobile-parity-2.md §8.5):
//   • IL FILM INTERO È CSS. Atto I (sagoma, marchio, lettere, firma, caps,
//     payoff), atto II (linea di carica), atto III (porta ad arco), atto IV
//     (tuffo), congedo del lockup, anelli eco, autohide: tutto @keyframes in
//     globals.css («Preloader»), sul markup reso dal server, deterministico
//     dal primo paint. La ragione è misurata due volte: la baseline di Fase 0
//     (§5.3) aveva visto che con questo componente in `dynamic ssr:false` il
//     chunk arrivava dopo il failsafe (opzione C: atto I in CSS); poi la
//     misura di Fase 1 (build pulita, CPU ×4 + Slow-4G, 390: docs/shots/
//     intro-390-fase1-smoke2) ha visto che il JS della home atterra a 8-12 s,
//     `data-pre-live` non compare mai e porta+tuffo — ancora GSAP — NON
//     suonavano mai sul telefono lento. Nessuna scelta «al mount» può
//     ripararlo: il film doveva esistere PRIMA del JavaScript, tutto.
//   • QUESTO MODULO, al mount, trova la shell (#dt-preloader), legge quanto
//     tempo è già passato sull'orologio CSS (`getAnimations()` sull'anello
//     del badge o sul primo char, `timeline.currentTime − startTime`; di
//     riserva `performance.now() − __dtPreT0` del boot script) e da lì:
//       (a) mette i TIMER relativi a quell'orologio: `data-pre-act2` a
//           INTRO_T.act1End (chiude la finestra del will-change), INTRO_EVENT a
//           INTRO_T.dive (l'handoff all'hero), `finish()` a INTRO_MS (Lenis,
//           sessionStorage, attributi, warmup) — se un istante è già passato,
//           subito;
//       (b) gestisce lo SKIP (tocco/click/tasto): `html[data-pre-skip]` +
//           `--pre-skip` (l'ora CSS) mandano le keyframe dritte al tuffo, e i
//           timer si riallineano;
//       (c) RIPIEGA su GSAP — `html[data-pre-gsap]`, che spegne le keyframe
//           CSS degli atti II-IV — SOLO se il browser non registra le custom
//           property (`!("registerProperty" in CSS)`: Safari < 16.4, Firefox <
//           128 — senza @property i valori scatterebbero al 50 % invece di
//           interpolare) o se le keyframe non sono mai partite. Lì guidano i
//           tween di sempre, posizionati sull'orologio CSS.
//   • È UN SOLO MONTAGGIO: 4,63 s su telefono e desktop (INTRO_T in
//     lib/motion/intro-constants.ts). Sotto i 768 cambiano SOLO le geometrie
//     dell'arco (40→58→165 vw contro 24→36→125) e il congedo del lockup —
//     parametri (custom property in globals.css; `G` qui è il ripiego), non
//     atti (legge 1 e 3 del mandato; è ciò che fa ERA).
//   • L'attributo <html data-preloader> è messo dal boot script del layout
//     PRIMA del primo paint: qui si orchestra e si smonta.
//   • Una volta per sessione (sessionStorage), skip con tocco/click/tasto.
//   • Assente con reduced-motion e senza JS (l'attributo non c'è mai).
//   • Non blocca l'LCP: l'hero sotto continua fetch/decode; l'overlay è solo
//     un layer fixed sopra — ed è proprio ciò che l'arco rivela.
//   • Ripiego senza mask-composite: sipario a salire (clip-path), stesso
//     ritmo — in CSS, e in GSAP nel ramo di ripiego.
import { useEffect } from "react";
import { gsap, useGSAP, MQ } from "../../lib/motion/gsap";
import {
  registerWarmup,
  runWarmup,
  scheduleIdleWarmup,
  warmAllImages,
  warmFirstFold,
} from "../../lib/motion/warmup";
import { getLenis } from "./SmoothScroll";
import {
  INTRO_EVENT,
  INTRO_KEY,
  INTRO_MS,
  INTRO_T,
  PRE_FAILSAFE_MS,
  WARM_FIRST_FOLD_MS,
} from "../../lib/motion/intro-constants";

// Ri-esportati per i chiamanti storici (HeroCinematic, CookieConsent, e2e):
// la sorgente è lib/motion/intro-constants.ts, che non è "use client" e la
// legge anche il layout server per il boot script.
export { INTRO_EVENT, INTRO_KEY };

/** True se il preloader è attivo in questo istante (per l'handoff dell'hero). */
export function isIntroRunning(): boolean {
  return typeof document !== "undefined" && document.documentElement.hasAttribute("data-preloader");
}

// L'evento di handoff parte UNA SOLA VOLTA per documento, da qualunque
// percorso: fine naturale, skip, abort, scheda nascosta, e anche dal
// percorso di recupero (il chunk atterrato dopo che il failsafe ha già tolto
// l'attributo). Chi ascolta — HeroCinematic per le lettere, CookieConsent per
// il banner — non deve mai restare appeso. Sta a livello di modulo e non
// dentro l'effect proprio perché i percorsi sono più d'uno: la bandiera
// dev'essere la stessa per tutti.
let introFired = false;
function fireIntro() {
  if (introFired) return;
  introFired = true;
  window.dispatchEvent(new Event(INTRO_EVENT));
}

/**
 * L'handoff è già partito? Per chi si iscrive a INTRO_EVENT DOPO che è stato
 * sparato. Il caso è reale con il film in CSS: se questo modulo idrata a tuffo
 * già cominciato (elapsed ≥ INTRO_T.dive) spara l'evento nel proprio layout
 * effect, che nell'albero viene PRIMA di quello di HeroCinematic e del banner
 * cookie — l'evento è già passato quando loro attaccano il listener, e senza
 * questa lettura resterebbero appesi alla propria rete (HERO_REST_MS dal
 * mount) con l'arco già aperto. Chi ascolta chiede prima qui, poi si iscrive.
 */
export function hasIntroFired(): boolean {
  return introFired;
}

/** Il boot script segna qui che il sipario era previsto (vedi layout.tsx). */
type BootFlags = { __dtPreArmed?: number; __dtPreFailsafe?: number; __dtPreT0?: number };
const boot = () => window as unknown as BootFlags;

// Le ease dell'arco ("dtLoader", "dtDiveIn") vivono nel vocabolario condiviso
// (lib/motion/gsap.ts): le usa anche il sipario ad arco di PageTransition.

/**
 * Quanto è già passato dell'intro, in secondi, letto dall'OROLOGIO CSS.
 *
 * Si legge `timeline.currentTime − startTime` di un'animazione CSS della
 * shell, NON il suo `currentTime`: un'animazione finita (fill `both`) tiene
 * il `currentTime` FERMO alla propria fine — la prima lettera del titolo
 * finisce a 1,42 s, e un JS arrivato a 2,5 s avrebbe letto 1,42 e messo la
 * porta un secondo in ritardo. `startTime` invece resta l'istante in cui la
 * CSS l'ha fatta partire (il primo style della shell, con l'attributo già
 * su <html>), anche a animazione finita. Si campionano più nodi in ordine —
 * l'overlay stesso (porta/tuffo: l'animazione che lo skip riposiziona), poi
 * l'anello del badge (giro infinito: non finisce mai, e il suo `currentTime`
 * è di riserva anche dove `startTime` non fosse un numero), poi la prima
 * lettera — e vince il primo che risponde: partono tutti nello stesso style
 * update, quindi segnano la stessa ora.
 *
 * Se `getAnimations()` manca (browser datati) si ripiega su `performance.now()
 * − __dtPreT0`, l'istante in cui il boot script ha messo l'attributo — di poco
 * anteriore al primo paint, quindi al più si è in leggero anticipo, mai in
 * ritardo. Zero se il boot script non è mai girato (non dovrebbe: senza di
 * lui non c'è l'attributo e non si arriva qui).
 */
function elapsedFromCss(samples: ReadonlyArray<Element | null | undefined>): number {
  let ms = NaN;
  for (const sample of samples) {
    try {
      const anim = sample?.getAnimations?.()[0];
      if (!anim) continue;
      const now = anim.timeline?.currentTime;
      const start = anim.startTime;
      if (typeof now === "number" && typeof start === "number") {
        ms = now - start;
        break;
      }
      // Riserva: vale solo finché l'animazione corre (vedi sopra); l'anello
      // gira all'infinito, quindi per lui vale sempre.
      if (typeof anim.currentTime === "number") {
        ms = anim.currentTime;
        break;
      }
    } catch {
      /* getAnimations assente o capriccioso: si passa al prossimo, poi la riserva */
    }
  }
  if (!Number.isFinite(ms)) {
    const t0 = boot().__dtPreT0;
    ms = typeof t0 === "number" ? performance.now() - t0 : 0;
  }
  return Math.max(0, ms / 1000);
}

/** Le keyframe degli atti III-IV (porta/tuffo, o il sipario di ripiego). */
const FILM_ANIMATIONS = new Set(["dt-pre-door", "dt-pre-dive", "dt-pre-curtain"]);

/**
 * La CSS sta davvero guidando il film? Vero se su uno dei nodi c'è
 * un'animazione CSS con uno dei nomi di FILM_ANIMATIONS: `getAnimations()`
 * restituisce anche le animazioni ancora nel proprio delay (la porta parte a
 * 2,25: al mount è quasi sempre lì) e quelle finite con fill. Falso se
 * `getAnimations` manca, se le keyframe non sono partite (foglio di stile
 * non applicato, attributo caduto) o se il browser non le ha riconosciute:
 * in tutti questi casi guida GSAP.
 */
function cssFilmAlive(nodes: ReadonlyArray<Element | null | undefined>): boolean {
  for (const node of nodes) {
    try {
      const anims = node?.getAnimations?.() ?? [];
      for (const a of anims) {
        const name = (a as CSSAnimation).animationName;
        if (typeof name === "string" && FILM_ANIMATIONS.has(name)) return true;
      }
    } catch {
      /* getAnimations assente o capriccioso: si passa al prossimo */
    }
  }
  return false;
}

export default function Preloader() {
  /* Chi torna sul sito, o chi ha reduced-motion, non vede il sipario: il
     precarico non ha una copertura dietro cui girare e non deve rubare tempo
     al primo rendering. Parte quindi a ruota libera, appena il thread respira.
     `runWarmup` e' idempotente: se l'intro c'e' stata, qui non fa nulla. */
  useEffect(() => {
    if (document.documentElement.hasAttribute("data-preloader")) return;

    /* IL RECUPERO — il difetto §5.3 dell'audit di parità mobile.
       Se il failsafe del boot script (PRE_FAILSAFE_MS) è scattato PRIMA che
       questo modulo idratasse — rete lentissima, thread bloccato — l'attributo
       è già sparito: l'atto I in CSS è comunque suonato, l'arco no, e non lo
       si replica. Fin qui si usciva in silenzio, e restava appeso chi
       aspettava l'handoff: HeroCinematic e CookieConsent avrebbero atteso la
       propria rete a HERO_REST_MS per accorgersene. `__dtPreArmed` distingue
       "sipario mai previsto" da "sipario previsto e già ritirato" — a
       posteriori non c'è altro modo di saperlo — e qui l'evento parte subito.
       Le due righe su Lenis sono la cintura: la bretella l'ha SmoothScroll,
       che osserva la caduta dell'attributo e si rilascia da solo (serve anche
       per il caso in cui questo modulo non idrati MAI, che da qui dentro
       sarebbe impossibile da coprire). Sono idempotenti da entrambi i lati. */
    if (boot().__dtPreArmed) {
      fireIntro();
      gsap.ticker.lagSmoothing(0);
      getLenis()?.start();
    }
    scheduleIdleWarmup();
  }, []);


  useGSAP(() => {
    const html = document.documentElement;
    // La shell resa dal server: se manca (layout diverso, test) non c'è
    // niente da orchestrare — si esce senza toccare l'attributo, che cadrà
    // col failsafe del boot script.
    const root = document.getElementById("dt-preloader");
    if (!root || !html.hasAttribute("data-preloader")) return;

    // Le geometrie del telefono, decise una volta sola e lette da qui in poi.
    // `MQ.belowDesktop` (767.98) e non 767: alle larghezze frazionarie — zoom
    // del browser, dpr non interi — un buco di un pixel lascerebbe spenti sia
    // questo ramo sia le regole CSS gemelle, che usano la stessa soglia.
    const mobile = window.matchMedia(MQ.belowDesktop).matches;

    // Il JS è al timone (dei timer, dello skip, della chiusura — il film è
    // CSS): lo dice a e2e, filmstrip e sonde. Siamo in un layout effect:
    // l'attributo entra nel paint in cui l'orchestrazione si arma.
    html.setAttribute("data-pre-live", "");

    // I timer sull'orologio CSS: si cancellano tutti negli abort e in finish.
    const timers = new Set<number>();
    const clearTimers = () => {
      timers.forEach((t) => window.clearTimeout(t));
      timers.clear();
    };

    // `completed`: sessionStorage va scritto solo quando l'intro è stata
    // davvero vista/saltata dall'utente — mai negli abort (StrictMode/HMR),
    // altrimenti in dev l'intro non si rivede più.
    // I listener di skip vanno TOLTI qui: il componente resta montato per
    // tutta la sessione e un preventDefault residuo sul keydown romperebbe
    // ogni input di testo del sito dopo l'intro.
    let removeSkipListeners = () => {};
    let finished = false;
    const finish = (completed: boolean) => {
      if (finished) return;
      finished = true;
      if (completed) {
        try {
          sessionStorage.setItem(INTRO_KEY, "1");
        } catch {
          /* storage pieno/bloccato: pazienza, si rivedrà */
        }
      }
      clearTimers();
      removeSkipListeners();
      html.removeAttribute("data-preloader");
      html.removeAttribute("data-pre-live");
      html.removeAttribute("data-pre-act2");
      html.removeAttribute("data-pre-gsap");
      html.removeAttribute("data-pre-skip");
      // Ripristina il contratto Lenis↔ScrollTrigger (vedi sotto).
      gsap.ticker.lagSmoothing(0);
      getLenis()?.start();
      // Sul telefono il registro del precarico NON è stato drenato dietro il
      // sipario (vedi più sotto il perché): parte adesso, a ruota libera,
      // dopo l'handoff. Su desktop `runWarmup` è già partito e questa riga
      // non fa nulla — `scheduleIdleWarmup` esce subito se è già in corso.
      scheduleIdleWarmup();
    };

    const media = window.matchMedia("(prefers-reduced-motion: no-preference)");
    // Cintura e bretelle: l'inline script già esclude reduced-motion,
    // ma se l'utente lo attiva tra paint e idratazione chiudiamo subito.
    if (!media.matches) {
      fireIntro();
      finish(true);
      return;
    }

    // Deep-link con ancora (/#contatti): la coreografia dell'arco presuppone
    // pagina in cima e combatterebbe lo scroll all'ancora di Next — niente
    // intro, si va dritti al contenuto richiesto.
    // La decisione è già stata presa prima del paint dallo script di boot
    // (layout.tsx), che in quel caso non mette nemmeno l'attributo: qui non
    // ci si arriva più. La guardia resta come rete — costa un confronto,
    // e l'alternativa è un sipario che litiga con uno scroll all'ancora.
    if (window.location.hash) {
      fireIntro();
      finish(true);
      return;
    }

    // Il JS è arrivato: il failsafe del boot script (PRE_FAILSAFE_MS, il
    // numero sta in intro-constants.ts e layout.tsx lo interpola) non deve
    // più strappare l'attributo per conto suo (tab nascosta, idratazione
    // lenta). Da qui la responsabilità di chiudere è SOLO di questo effect.
    try {
      window.clearTimeout(boot().__dtPreFailsafe);
    } catch {
      /* boot script mai eseguito: nulla da pulire */
    }

    getLenis()?.stop();
    // L'arco rivela l'hero: la pagina deve essere in cima (reload a metà
    // pagina, scroll restoration). Lenis è già fermo: salto istantaneo.
    window.scrollTo(0, 0);

    // Il jank di avvio (idratazione, decode immagini) con lagSmoothing(0)
    // farebbe saltare la timeline in avanti di secondi al primo tick.
    // Durante l'intro lo scroll è bloccato, quindi lo smoothing è sicuro;
    // finish() lo riporta a 0 (contratto SmoothScroll/Lenis). Vale per il
    // ramo GSAP; nel ramo CSS non c'è timeline, ma il contratto è lo stesso.
    gsap.ticker.lagSmoothing(500, 33);

    const panel = root.querySelector<HTMLElement>("[data-pre-panel]");
    const content = root.querySelector<HTMLElement>("[data-pre-content]");
    const firstChar = root.querySelector<HTMLElement>("[data-pre-char]");
    const ring = root.querySelector<SVGElement>("[data-rot-ring]");
    const progress = root.querySelector<HTMLElement>("[data-pre-progress]");
    const track = root.querySelector<HTMLElement>("[data-pre-track]");
    if (!panel || !content) {
      fireIntro();
      finish(true);
      return;
    }

    // La porta ad arco vive su una maschera additiva con mask-composite: la
    // CSS la applica da sé (`@supports`), qui si aggiunge la classe storica
    // per e2e e sonde; dove non è supportata (browser datati) si ripiega sul
    // sipario clip-path — anche lui in CSS, e in GSAP nel ramo di ripiego.
    const supportsArch =
      typeof CSS !== "undefined" && CSS.supports("mask-composite", "add");
    if (supportsArch) root.classList.add("is-arch", "dt-arch-mask");

    // L'orologio: quanto è già passato del film in CSS. Tutto ciò che segue
    // — timer, timeline di ripiego, skip — si posiziona qui, così i suoi
    // istanti sono quelli del film, non «da quando è arrivato il JavaScript».
    // Si campiona PRIMA la root: è la sua animazione (porta/tuffo) che lo skip
    // riposiziona con `--pre-skip`, quindi è il SUO start time che conta; poi
    // l'anello e la prima lettera (stesso style update, stessa ora).
    const elapsed = elapsedFromCss([root, ring, firstChar]);
    const mountedAt = performance.now();
    /** L'ora del film ADESSO, in secondi: l'orologio CSS più il tempo da qui. */
    const now = () => elapsed + (performance.now() - mountedAt) / 1000;

    // ── IL PRECARICO: DIETRO IL SIPARIO, MAI OLTRE IL SIPARIO ───────────
    // Parte SUBITO, in parallelo all'intro: i secondi dell'animazione sono
    // tempo che l'utente sta gia' aspettando: e' li' che va messo il lavoro
    // che altrimenti cadrebbe sul primo scroll.
    //
    // Su DESKTOP: tutte le immagini della pagina, non solo quelle delle scene
    // animate (richiesta del cliente: «caricare tutto prima di entrare»). Si
    // iscrive PRIMA di avviare il precarico, cosi' entra nel primo giro di
    // raccolta. Scadenza 4,5 s SUL FILM contro un'intro di 4,63: l'attesa è
    // coperta dal sipario per costruzione, non per fortuna. (Il conto
    // comprende la corsa dei font: vedi il commento in warmup.ts.)
    //
    // Su TELEFONO no, ed è una decisione, non una svista: `warmAllImages`
    // sveglia OGNI immagine del documento e le mette in gara con la foto
    // dell'hero — cioè con l'unica immagine che l'arco sta per scoprire —
    // sulla connessione in cui quella gara si perde. Qui si aspetta solo il
    // primo schermo, senza svegliare niente, con scadenza WARM_FIRST_FOLD_MS
    // (3 s ≤ intro − tuffo: sta dentro il sipario per costruzione); il
    // registro (Header, CharFlip, Fioritura, TeamTrail) passa da
    // `scheduleIdleWarmup()` in `finish()`, cioè DOPO l'handoff. Il «caricare
    // tutto prima di entrare» del cliente resta com'è dove è stato misurato —
    // su desktop. Su un telefono significherebbe spendere il piano dati del
    // visitatore per immagini sette schermate più in basso.
    //
    // ENTRAMBE LE SCADENZE SONO SULL'OROLOGIO DEL FILM, non «da adesso»: il
    // film è partito `elapsed` secondi fa e `finish()` aspetta questa promessa.
    // Con il JS arrivato a 2 s (il caso normale sul telefono, non quello di
    // scuola) una scadenza contata dal mount finirebbe 2 s dopo il tuffo: la
    // CSS ha già sfumato l'overlay (autohide) ma l'attributo — e con lui
    // overflow:hidden e Lenis fermo — resterebbe fino a 6,5 s. Si sottrae
    // quindi ciò che è già passato; a zero la promessa si risolve subito.
    const filmMs = Math.round(elapsed * 1000);
    let scaldata: Promise<void>;
    if (mobile) {
      scaldata = warmFirstFold(Math.max(0, WARM_FIRST_FOLD_MS - filmMs));
    } else {
      registerWarmup(warmAllImages);
      scaldata = runWarmup(Math.max(0, 4500 - filmMs));
    }
    /** true se l'utente ha saltato l'intro: allora non si aspetta il precarico. */
    let saltata = false;

    // La fine del film: il sipario si alza solo quando le scene pesanti sono
    // calde. `runWarmup` e' partito insieme all'intro e ha una scadenza sua:
    // nel caso normale ha gia' finito e questo `then` e' immediato, su rete
    // lenta rinuncia e si entra comunque. Nessuno resta chiuso fuori dal
    // sito perche' un fiore non era pronto.
    // `.catch` prima del `.then`: se il precarico rifiuta (basta una immagine
    // che non arriva), senza questa rete la promessa non si risolve mai,
    // `finish` non viene chiamato e il sipario resta su per sempre.
    const onFilmEnd = () => {
      if (saltata) finish(true);
      else void scaldata.catch(() => {}).then(() => finish(true));
    };

    // L'unica cosa che il JS fa per l'atto I è chiudere la finestra del
    // `will-change` delle lettere quando l'ultima ha finito (INTRO_T.act1End):
    // `data-pre-act2` su <html> toglie la promozione (globals.css). Sagoma,
    // marchio, lettere, firma, caps e payoff stanno già salendo per conto della
    // CSS: qui NON si tocca nessuno di quei nodi — un `fromTo` li riporterebbe
    // a zero con un salto visibile.
    const unwill = () => html.setAttribute("data-pre-act2", "");

    // Gli istanti del film che contano qui: l'handoff (il tuffo, o il bordo
    // del sipario che scopre l'hero) e la fine.
    const diveAt = supportsArch ? INTRO_T.dive : INTRO_T.curtain;
    const endAt = supportsArch ? INTRO_MS / 1000 : INTRO_T.curtain + INTRO_T.curtainDur;
    const diveDur = supportsArch ? INTRO_T.diveDur : INTRO_T.curtainDur;

    // ── CHI GUIDA? ──────────────────────────────────────────────────────
    // La CSS, di default (le keyframe di globals.css stanno correndo da prima
    // di questo mount). GSAP SOLO in ripiego: browser che non registra le
    // custom property (senza @property la maschera scatterebbe al 50 %), o
    // keyframe della porta/tuffo/sipario mai partite (getAnimations non le
    // vede), o un remount (StrictMode/HMR) che trova già `data-pre-gsap` —
    // le keyframe CSS sono spente da allora e riaccenderle le farebbe
    // RIPARTIRE da zero (un'animazione tolta e rimessa riparte), non
    // riprendere dal punto giusto.
    const cssDrives =
      !html.hasAttribute("data-pre-gsap") &&
      typeof CSS !== "undefined" &&
      "registerProperty" in CSS &&
      cssFilmAlive([root, panel]);

    // Se l'orologio CSS dice che il film è già FINITO non c'è più niente da
    // orchestrare: si chiude subito, come il failsafe avrebbe fatto. Il caso è
    // reale, non di scuola (ed è ESATTAMENTE il telefono lento misurato: JS a
    // 8-12 s): il failsafe è un setTimeout, e su un thread bloccato
    // dall'idratazione gli effect girano PRIMA dei timer in coda —
    // l'attributo è ancora su <html> col film finito da un pezzo. Senza
    // questa uscita, nel ramo GSAP `time()` arriverebbe in fondo e farebbe
    // scattare `onComplete` (→ finish) qui dentro, PRIMA che i listener di
    // skip siano attaccati: resterebbero appesi per tutta la sessione.
    if (elapsed >= endAt) {
      unwill();
      fireIntro();
      finish(true);
      return;
    }

    /** Il tuffo è già cominciato (o lo skip l'ha fatto cominciare)? */
    let diving = elapsed >= diveAt;
    /** Chiamato dallo skip: salta al tuffo. Impostato dal ramo che guida. */
    let seekToDive: () => void;
    /** Chiusura immediata (reduced-motion in corsa, scheda nascosta). */
    let closeNow: () => void = () => finish(true);
    /** Pulizia della timeline di ripiego negli abort (nel ramo CSS: niente). */
    let abortTimeline = () => {};

    if (cssDrives) {
      // ── LA CSS GUIDA: qui solo i timer, sull'orologio del film ─────────
      // `at(t, fn)`: fn all'istante t del film; se è già passato, subito.
      const at = (t: number, fn: () => void) => {
        const ms = (t - now()) * 1000;
        if (ms <= 0) fn();
        else timers.add(window.setTimeout(fn, ms));
      };
      // LO SKIP PUÒ ESSERE GIÀ AVVENUTO, PRIMA CHE QUESTO CODICE ESISTESSE.
      // Dal 2026-08-18 il primo tocco lo raccoglie lo script di boot (vedi
      // layout.tsx): il film è in CSS, e sarebbe assurdo che il suo unico
      // comando aspettasse React — misurato a 360, un tocco a 650 ms veniva
      // servito a 2 792, cioè 2,1 s dopo, perché l'idratazione arrivava
      // allora. Se l'attributo c'è già, qui si prende atto: il tuffo sta
      // suonando dall'ora scritta in `__dtPreSkipAt`, e i timer si allineano
      // a quella invece che al film intero.
      const skipAt = html.hasAttribute("data-pre-skip")
        ? (window as unknown as { __dtPreSkipAt?: number }).__dtPreSkipAt
        : undefined;
      const giaSaltato = typeof skipAt === "number";

      at(INTRO_T.act1End, unwill);
      if (giaSaltato) {
        diving = true;
        unwill();
        fireIntro();
      } else {
        at(diveAt, () => {
          diving = true;
          fireIntro();
        });
      }
      // La chiusura: a fine film. Se un timer arriva in ritardo (thread
      // occupato) l'autohide CSS ha già sfumato l'overlay a PRE_AUTOHIDE_MS:
      // l'utente vede la pagina, e qui si tolgono attributo e blocco scroll
      // appena si può. Il timer sta in `endTimer` perché lo skip lo sposta.
      let endTimer = 0;
      const scheduleEnd = (t: number) => {
        window.clearTimeout(endTimer);
        timers.delete(endTimer);
        const ms = Math.max(0, (t - now()) * 1000);
        endTimer = window.setTimeout(onFilmEnd, ms);
        timers.add(endTimer);
      };
      // Con lo skip già avvenuto la fine è «ora dello skip + tuffo», non la
      // fine del film: è lo stesso conto che fa `seekToDive` qui sotto.
      scheduleEnd(giaSaltato ? skipAt! + diveDur : endAt);

      // ── GLI EVENTI DEL FILM PRIMA DEI TIMER ──────────────────────────
      // I setTimeout qui sopra sono una rete, non l'orologio: sotto carico
      // (misurato in e2e con quattro worker, 2026-08-18) un timer arriva
      // 200-1 000 ms DOPO l'istante del film — l'hero si accendeva fino a un
      // secondo dopo che la porta l'aveva già scoperto, e l'attributo restava
      // su <html> a film finito. Le animazioni CSS invece corrono sul loro
      // orologio e Chromium privilegia rAF/animazioni sui timer: quindi
      // l'handoff parte da `animationstart` del tuffo (o del sipario di
      // ripiego) e la chiusura da `animationend` dello stesso — l'istante
      // vero, non la sua stima. Con lo skip la CSS cambia gli animation-delay
      // e il tuffo entra in fase attiva «adesso»: `animationstart` scatta
      // ancora (l'animazione entra nella fase attiva), e `animationend`
      // segue 1,5 s dopo — coerente coi timer che seekToDive risposta.
      // Gli eventi dei figli (le lettere, la linea) risalgono fino a `root`:
      // si filtra sul nome, e si ascolta solo il bersaglio giusto.
      const isDiveAnim = (e: AnimationEvent) =>
        e.target === root && (e.animationName === "dt-pre-dive" || e.animationName === "dt-pre-curtain");
      const onAnimStart = (e: AnimationEvent) => {
        if (!isDiveAnim(e)) return;
        diving = true;
        fireIntro();
      };
      const onAnimEnd = (e: AnimationEvent) => {
        if (!isDiveAnim(e)) return;
        onFilmEnd();
      };
      root.addEventListener("animationstart", onAnimStart);
      root.addEventListener("animationend", onAnimEnd);
      const prevAbort = abortTimeline;
      abortTimeline = () => {
        root.removeEventListener("animationstart", onAnimStart);
        root.removeEventListener("animationend", onAnimEnd);
        prevAbort();
      };

      // Lo skip in CSS: «entra ADESSO». `html[data-pre-skip]` cambia gli
      // animation-delay delle keyframe (globals.css): ciò che precede il
      // tuffo va alla propria fine, il tuffo parte dall'ora del film che si
      // scrive in `--pre-skip` (la CSS non sa che ora è; il delay va contato
      // dallo start time dell'animazione, cioè dal primo paint). Il tuffo
      // suona comunque per intero (1,5 s a ogni larghezza): lo skip taglia il
      // preambolo, non la porta — un taglio secco lascerebbe l'arco a metà.
      seekToDive = () => {
        // I listener del boot script non servono più: da qui comanda questo
        // modulo (e un doppio `--pre-skip` riposizionerebbe il tuffo).
        (window as unknown as { __dtPreSkipOff?: () => void }).__dtPreSkipOff?.();
        const t = now();
        root.style.setProperty("--pre-skip", `${t.toFixed(3)}s`);
        html.setAttribute("data-pre-skip", "");
        diving = true;
        fireIntro();
        scheduleEnd(t + diveDur);
      };
    } else {
      // ── IL RIPIEGO: GSAP guida gli atti II-IV, come prima di D ─────────
      // `data-pre-gsap` spegne le keyframe CSS degli atti II-IV (le regole in
      // globals.css sono `:not([data-pre-gsap])`); l'autohide CSS della ROOT
      // va disattivato (quelle dei figli — l'atto I — continuano: sono il
      // film). Da qui l'attributo resta fino a finish (vedi «CHI GUIDA?»).
      html.setAttribute("data-pre-gsap", "");
      root.style.animation = "none";

      const tl = gsap.timeline({
        defaults: { ease: "domus" },
        onComplete: onFilmEnd,
      });

      // ── LE GEOMETRIE, IN UN POSTO SOLO ────────────────────────────────
      // I TEMPI sono di INTRO_T (intro-constants.ts) e sono gli stessi a ogni
      // larghezza; qui stanno solo i numeri che dipendono dallo schermo — gli
      // stessi delle custom property di globals.css (--arch-w0/1/2, --arch-y1,
      // --pre-exit-y), che sono la sorgente per il film CSS:
      //   • l'arco: 40→58→165 vw sotto i 768 (su 390px 24 vw sarebbero 94px,
      //     una feritoia, non una porta), 24→36→125 vw sopra;
      //   • la quota di riposo 16 vh / 15 vh, e le quote 104 vh → −100 vh
      //     restano `vh` PURI, come ERA: sui browser mobili `vh` è il viewport
      //     grande, quindi 104vh sta sotto il bordo anche a barra URL nascosta
      //     e 16vh è visibile in entrambi gli stati della barra. Un `svh` qui
      //     sarebbe l'errore, non la correzione — e dentro un singolo tween di
      //     custom property NON si mescolano unità (CSSPlugin le convertirebbe
      //     misurandole, e sarebbe un salto);
      //   • `s1`/`s2` = arch-w / arch-w0: il fattore unitless che gli anelli
      //     eco usano in `scale()` (globals.css: --arch-s) invece di
      //     ricalcolare width/height/top per frame — transform, non layout;
      //   • il congedo del lockup: −20 px sul telefono, −28 su desktop.
      const G = mobile
        ? { w0: 40, w1: 58, w2: 165, y1: "16vh", uscitaY: -20 }
        : { w0: 24, w1: 36, w2: 125, y1: "15vh", uscitaY: -28 };
      const vw = (n: number) => `${n}vw`;
      const s1 = G.w1 / G.w0;
      const s2 = G.w2 / G.w0;

      tl.addLabel("act1done", INTRO_T.act1End).call(unwill, [], "act1done");

      // ── Atto II — la linea di carica (a scatti, come un vero load) ────
      if (progress && track) {
        tl.to(progress, { autoAlpha: 1, duration: 0.25, ease: "none" }, INTRO_T.progress).fromTo(
          track,
          { yPercent: -100 },
          { yPercent: 0, duration: INTRO_T.trackDur, ease: "dtLoader" },
          INTRO_T.track
        );
      }

      // ── Atto III — la porta ad arco, e il tuffo ───────────────────────
      // Il contenuto si congeda mentre la porta sale; l'handoff all'hero
      // (INTRO_EVENT → le lettere di HeroCinematic) parte esattamente col tuffo.
      tl.addLabel("arch", INTRO_T.arch);
      tl.to(
        content,
        { y: G.uscitaY, autoAlpha: 0, duration: INTRO_T.exitDur, ease: "domus.inOut" },
        INTRO_T.exit
      );
      const markDive = () => {
        diving = true;
        fireIntro();
      };
      if (supportsArch) {
        tl.fromTo(
          root,
          { "--arch-w": vw(G.w0), "--arch-y": "104vh", "--arch-s": 1 },
          {
            "--arch-w": vw(G.w1),
            "--arch-y": G.y1,
            "--arch-s": s1,
            duration: INTRO_T.archDur,
            ease: "domus.inOut",
          },
          "arch"
        )
          .addLabel("dive", INTRO_T.dive)
          .call(markDive, [], "dive")
          .to(
            root,
            {
              "--arch-w": vw(G.w2),
              "--arch-y": "-100vh",
              "--arch-s": s2,
              duration: INTRO_T.diveDur,
              ease: "dtDiveIn",
            },
            "dive"
          );
      } else {
        // Fallback: sipario che sale, handoff appena il bordo scopre l'hero.
        // Stessi tempi del desktop, a ogni larghezza (2,6 + 0,9 = 3,50 s).
        tl.addLabel("dive", INTRO_T.curtain)
          .call(markDive, [], "dive")
          .to(
            panel,
            {
              clipPath: "inset(0% 0% 100% 0%)",
              duration: INTRO_T.curtainDur,
              ease: "domus.inOut",
            },
            "dive"
          );
      }

      // ── L'ALLINEAMENTO ALL'OROLOGIO CSS ───────────────────────────────
      // La timeline è nata a t=0 ma il film sta suonando da `elapsed`
      // secondi: la si porta lì. `time()` non attraversa le callback (come
      // `seek`), quindi ciò che è già passato va rifatto a mano — la finestra
      // del will-change, e l'handoff se il JS è arrivato a tuffo iniziato.
      tl.time(elapsed);
      if (elapsed >= INTRO_T.act1End) unwill();
      if (diving) fireIntro();

      // Skip: seek() sopprime le callback attraversate: l'evento va sparato
      // a mano. Il tuffo suona comunque per intero.
      seekToDive = () => {
        diving = true;
        fireIntro();
        tl.seek("dive");
      };

      // Reduced-motion o scheda nascosta a metà: `tl.progress(1)` chiama
      // onComplete → finish. Nel ramo CSS lo fa `finish` direttamente.
      closeNow = () => tl.progress(1);
      abortTimeline = () => tl.kill();
    }

    // Skip: al primo tocco/click/tasto si salta dritti al tuffo (mai
    // bloccare). IL TOCCO È COPERTO: il listener è `pointerdown`, che nasce
    // anche dal dito. Da sapere: saltare fa il tuffo intero (1,5 s a ogni
    // larghezza): lo skip taglia il preambolo, non la porta.
    const skip = () => {
      if (diving) return;
      // Saltare vuol dire "entra ADESSO": aspettare il precarico
      // contraddirebbe l'unico gesto con cui l'utente ha detto che ha fretta.
      // Il riscaldamento non si annulla, prosegue per conto suo — arrivera'
      // in ritardo su qualche scena, che e' esattamente il compromesso che
      // chi salta ha scelto.
      saltata = true;
      unwill();
      seekToDive();
    };
    const onPointerSkip = () => skip();
    const onKeySkip = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // Solo tasti "di contenuto": F5/DevTools/media key restano al browser.
      const usable =
        e.key === "Enter" || e.key === " " || e.key === "Escape" || e.key.length === 1;
      if (!usable) return;
      // La guardia "intro già al tuffo" PRIMA di preventDefault, non dentro
      // skip(): è l'inversione che nell'onda 9 rese i campi inservibili in
      // produzione. Qui il listener viene staccato a fine intro, quindi oggi
      // non fa danno — ma l'ordine sbagliato resta una trappola per il
      // prossimo che tocchi la pulizia.
      if (diving) return;
      // preventDefault: sotto l'overlay può esserci un elemento focalizzato
      // (es. un bottone) — il tasto salta l'intro, non deve attivare altro.
      e.preventDefault();
      skip();
    };
    // Chiusura immediata, senza suonare il tuffo (1.5s di motion ampio non
    // richiesto): reduced-motion attivato DURANTE l'intro, o scheda nascosta.
    // `saltata` come nello skip: chi ha lasciato la scheda o vuole meno
    // movimento non sta aspettando il precarico. Senza questa riga la
    // chiusura passa dal ramo che ATTENDE `scaldata`, e al ritorno si trova
    // la pagina finita che non scorre.
    const closeImmediately = () => {
      saltata = true;
      fireIntro();
      closeNow();
    };
    const onMediaChange = () => {
      if (media.matches) return;
      closeImmediately();
    };
    // Tab in background: il ticker GSAP si congela e la timeline non
    // avanzerebbe (col rischio di riaffiorare a caso al rientro); le
    // animazioni CSS invece corrono anche in background, ma i timer no — si
    // chiude subito in entrambi i casi, l'utente al ritorno trova la pagina
    // pronta.
    const onVisibility = () => {
      if (!document.hidden) return;
      closeImmediately();
    };
    window.addEventListener("pointerdown", onPointerSkip);
    window.addEventListener("keydown", onKeySkip);
    media.addEventListener("change", onMediaChange);
    document.addEventListener("visibilitychange", onVisibility);
    removeSkipListeners = () => {
      window.removeEventListener("pointerdown", onPointerSkip);
      window.removeEventListener("keydown", onKeySkip);
      media.removeEventListener("change", onMediaChange);
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // Caso limite: la pagina è già nascosta al mount (aperta in tab in
    // background) — chiudi subito invece di strisciare.
    if (document.hidden) onVisibility();

    return () => {
      clearTimers();
      abortTimeline();
      removeSkipListeners();
      // Abort a metà intro (StrictMode double-mount, HMR): l'attributo
      // `data-preloader` RESTA, così il re-run immediato ricostruisce
      // l'orchestrazione dal punto giusto — l'orologio è quello CSS, non «da
      // quando è nato l'effect» (prima veniva rimosso e in dev l'intro non
      // si vedeva mai). Restano anche `data-pre-gsap` (le keyframe spente non
      // vanno riaccese: ripartirebbero da zero) e `data-pre-skip`. Si
      // ripristinano solo i contratti globali e si ri-arma il failsafe del
      // boot script: se il remount non arrivasse mai, l'overlay si toglie
      // comunque. `data-pre-live` invece va tolto: dice "il JS è al timone",
      // e in questo istante non lo è più. Il remount lo rimette.
      // Il riarmo è lo stesso numero del failsafe di boot (PRE_FAILSAFE_MS):
      // stesso mestiere, stesso orologio — non un terzo numero che si
      // dichiara allineato agli altri due senza esserlo.
      if (html.hasAttribute("data-preloader")) {
        html.removeAttribute("data-pre-live");
        gsap.ticker.lagSmoothing(0);
        getLenis()?.start();
        boot().__dtPreFailsafe = window.setTimeout(() => {
          fireIntro();
          html.removeAttribute("data-preloader");
        }, PRE_FAILSAFE_MS);
      }
    };
  });

  // Nessun markup: la shell è di PreloaderShell.tsx (server). Rendere null a
  // ogni render — server e client — è ciò che tiene l'idratazione pulita.
  return null;
}
