"use client";

// Preloader — l'ORCHESTRATORE del sipario: il film intero alla prima entrata
// nella home e la porta corta agli altri caricamenti completi (Alberto, 13
// settembre 2026: A18, A20; spec §6.2). Il markup è di PreloaderShell.tsx
// (server), l'atto I è CSS (globals.css, «Preloader»); qui si decide QUANDO
// entra la porta, e la porta è la GOMMA.
//
// LA GOMMA (22 settembre 2026). Alberto: «devi sostituire l'entrata ad arco del
// preloader con questo, al centro dello schermo, affianco a Raffaela, alla sua
// destra», con DomusTuaPreloader.tsx (un preloader a gomma scritto per un sito
// generico); poi: «nel preloader sotto lo sfondo scuro mettiamo, invisibile, la
// foto dell'hero rimpicciolita al centro dello schermo, così quando avviene
// l'animazione della gomma a forma del logo del cuore fa il reveal; poi, allo
// zoom del cuore, contemporaneamente la foto scende dove doveva essere, e poi
// risale come fa già». Com'è fatto:
//   • a INTRO_T.gomma (2,25 s, dove partiva la porta ad arco) questo modulo
//     monta DomusTuaPreloader in un PORTALE nello slot `[data-pre-gomma]` della
//     shell, primo figlio del pannello, con `zIndex` 0: il suo foglio (espresso,
//     come il pannello, che da lì diventa trasparente) sta SOTTO il fondo caldo
//     e la sagoma di Raffaela. La gomma disegna il cuore al centro dello
//     schermo, a destra della mano tesa di lei, mentre il lockup si congeda;
//   • dentro il cuore c'è la foto vera dell'hero, rimpicciolita e centrata sul
//     rombo del logo (hero.ts `DISCESA`, le var `--gomma-foto-*` scritte qui);
//   • quando la cancellatura comincia ad allargarsi (`onReveal`) parte
//     l'handoff: INTRO_EVENT, l'orologio dell'entrata dell'hero
//     (`--dt-entrata-t` = l'ora del film) e la discesa della foto (CSS, su
//     `html[data-gomma="reveal"]`); intanto un rAF legge la larghezza del tratto
//     e buca col cerchio che la segue il fondo caldo e la sagoma, che sono HTML
//     e non stanno nella maschera della gomma;
//   • a gomma finita (`onDone`) si chiude: attributo, Lenis, precarico.
// Il `ready` della gomma è il precarico di sempre (tutte le immagini con
// scadenza sul desktop, la prima piega sul telefono), NON l'evento `load`: qui
// il precarico del desktop promuove a eager ogni immagine della pagina, e il
// `load` arriverebbe solo quando le ha scaricate tutte. Dopo uno skip il
// `ready` è vero subito: chi salta non aspetta il precarico.
// La gomma è JavaScript. Senza JS, o col JS arrivato quando la rete CSS è già
// partita (PRE_AUTOHIDE_MS), il sipario sfuma da solo e l'hero entra per conto
// suo: nessuno resta chiuso fuori perché un chunk tarda.
// Il tempo della gomma è `normale` nel film a tempo e `veloce` nella porta
// corta, dopo uno skip (tocco, click, tasto: «entra adesso») e col JS arrivato
// dopo INTRO_T.tardi.
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { gsap, useGSAP, MQ, ScrollTrigger, requestRefresh } from "../../lib/motion/gsap";
import {
  registerWarmup,
  runWarmup,
  scheduleIdleWarmup,
  warmAllImages,
  warmFirstFold,
} from "../../lib/motion/warmup";
import { getLenis } from "./SmoothScroll";
import DomusTuaPreloader, { BOX, type PreloaderSpeed } from "./DomusTuaPreloader";
import {
  GOMMA_LOGO,
  INTRO_EVENT,
  INTRO_FILM,
  INTRO_KEY,
  INTRO_T,
  LAST_Y_KEY,
  PRE_AUTOHIDE_MS,
  PRE_FAILSAFE_MS,
  PRE_SHORT_AUTOHIDE_MS,
  PRE_SHORT_FAILSAFE_MS,
  WARM_FIRST_FOLD_MS,
} from "../../lib/motion/intro-constants";
import { DISCESA } from "../../lib/motion/hero";
import {
  parseLastY,
  restoreTarget,
  snapshot,
  type ChapterTop,
  type LastY,
} from "../../lib/motion/chapter-scroll";

// Ri-esportati per i chiamanti storici (HeroCinematic, CookieConsent, e2e):
// la sorgente è lib/motion/intro-constants.ts, che non è "use client" e la
// legge anche il layout server per il boot script.
export { INTRO_EVENT, INTRO_KEY };

/** True se il preloader è attivo in questo istante (per l'handoff dell'hero). */
export function isIntroRunning(): boolean {
  return typeof document !== "undefined" && document.documentElement.hasAttribute("data-preloader");
}

// L'evento di handoff parte UNA SOLA VOLTA per documento, da qualunque
// percorso: la cancellatura che si allarga, lo skip, gli abort, la scheda
// nascosta, e anche il percorso di recupero (il chunk atterrato dopo che la
// rete CSS ha già tolto il sipario). Chi ascolta — HeroCinematic per le
// lettere, CookieConsent per il banner — non deve mai restare appeso. Sta a
// livello di modulo e non dentro l'effect proprio perché i percorsi sono più
// d'uno: la bandiera dev'essere la stessa per tutti.
let introFired = false;
function fireIntro() {
  if (introFired) return;
  introFired = true;
  window.dispatchEvent(new Event(INTRO_EVENT));
}

/**
 * L'handoff è già partito? Per chi si iscrive a INTRO_EVENT DOPO che è stato
 * sparato (un modulo idratato a sipario già caduto). Chi ascolta chiede prima
 * qui, poi si iscrive.
 */
export function hasIntroFired(): boolean {
  return introFired;
}

/** Il boot script segna qui che il sipario era previsto (vedi layout.tsx). */
type BootFlags = {
  __dtPreArmed?: number;
  __dtPreFailsafe?: number;
  __dtPreT0?: number;
  __dtPreTop?: number;
  __dtPreTopOff?: () => void;
  __dtPreSkipAt?: number;
  __dtPreSkipOff?: () => void;
};
const boot = () => window as unknown as BootFlags;

/**
 * Quanto è già passato dell'intro, in secondi, letto dall'OROLOGIO CSS.
 *
 * Si legge `timeline.currentTime − startTime` di un'animazione CSS della
 * shell, NON il suo `currentTime`: un'animazione finita (fill `both`) tiene
 * il `currentTime` FERMO alla propria fine — la prima lettera del titolo
 * finisce a 1,42 s, e un JS arrivato a 2,5 s avrebbe letto 1,42. `startTime`
 * invece resta l'istante in cui la CSS l'ha fatta partire (il primo style
 * della shell, con l'attributo già su <html>), anche a animazione finita. Si
 * campionano più nodi in ordine — l'overlay stesso (la rete dell'autohide),
 * poi l'anello del badge (giro infinito: il suo `currentTime` è di riserva
 * anche dove `startTime` non fosse un numero), poi la prima lettera — e vince
 * il primo che risponde: partono tutti nello stesso style update.
 *
 * Se `getAnimations()` manca (browser datati) si ripiega su `performance.now()
 * − __dtPreT0`, l'istante in cui il boot script ha messo l'attributo — di poco
 * anteriore al primo paint, quindi al più si è in leggero anticipo, mai in
 * ritardo. Zero se il boot script non è mai girato.
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

/** Dove sta il logo della gomma, letto dal suo `transform` (px dello schermo, e la scala del logo). */
type LogoGeo = { x: number; y: number; k: number };

/**
 * Il componente posa il logo con `translate(cx cy) scale(k) translate(-mx -my)`
 * (mx, my = centro di BOX): il centro del rombo, l'origine del tracciato, cade
 * in (cx, cy − my·k). Null finché il componente non l'ha scritto.
 */
function logoGeo(logo: Element | null): LogoGeo | null {
  const t = logo?.getAttribute("transform");
  const m = t ? /translate\(\s*([-\d.e]+)[\s,]+([-\d.e]+)\s*\)\s*scale\(\s*([-\d.e]+)\s*\)/.exec(t) : null;
  if (!m) return null;
  const [cx, cy, k] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (![cx, cy, k].every(Number.isFinite)) return null;
  return { x: cx, y: cy - (BOX.y + BOX.h / 2) * k, k };
}

/**
 * Il raggio del cerchio che buca sagoma e fondo, in unità del logo, oltre la
 * metà del tratto che si allarga: il tracciato arriva a 43 unità dall'origine
 * verso sinistra (il lobo sinistro, dalla parte di Raffaela) e a 51 in
 * diagonale. Col fronte vero in anticipo di qualche pixel la sagoma sparisce
 * sul foglio scuro un istante prima che il foglio sotto di lei si scopra:
 * invisibile. In ritardo resterebbe sopra il sito già scoperto.
 */
const BUCO_OLTRE = 46;

/** La gomma montata: dove (lo slot della shell), a che velocità, e i due richiami. */
type Gomma = {
  slot: HTMLElement;
  speed: PreloaderSpeed;
  onReveal: () => void;
  onDone: () => void;
};

export default function Preloader() {
  const [gomma, setGomma] = useState<Gomma | null>(null);
  // Il `ready` della gomma: il precarico dietro il sipario (vedi l'intestazione).
  const [pronta, setPronta] = useState(false);

  /* D65: alla ricarica con un sipario il guardiano del boot script (layout.tsx)
     tiene la pagina in cima con `history.scrollRestoration = "manual"` e lo
     rimette "auto" quando si ritira (`__dtPreTop` 1 → 0). ScrollTrigger, se è
     partito sotto il guardiano, si è segnato "manual" e lo riscriverebbe dopo
     ogni refresh: al ritiro, o subito se è già avvenuto, gli si dice "auto". */
  useEffect(() => {
    const flags = boot();
    if (flags.__dtPreTop === undefined) return;
    const auto = () => ScrollTrigger.clearScrollMemory("auto");
    if (flags.__dtPreTop === 0) auto();
    else flags.__dtPreTopOff = auto;
    return () => {
      if (flags.__dtPreTopOff === auto) flags.__dtPreTopOff = undefined;
    };
  }, []);

  /* Chi torna sul sito, o chi ha reduced-motion, non vede il sipario: il
     precarico non ha una copertura dietro cui girare e non deve rubare tempo
     al primo rendering. Parte quindi a ruota libera, appena il thread respira.
     `runWarmup` e' idempotente: se l'intro c'e' stata, qui non fa nulla. */
  useEffect(() => {
    if (document.documentElement.hasAttribute("data-preloader")) return;

    /* IL RECUPERO — il difetto §5.3 dell'audit di parità mobile.
       Se la rete del boot script (PRE_FAILSAFE_MS) è scattata PRIMA che
       questo modulo idratasse — rete lentissima, thread bloccato — l'attributo
       è già sparito: l'atto I in CSS è comunque suonato, la gomma no, e non la
       si replica. Resterebbe appeso chi aspettava l'handoff: HeroCinematic e
       CookieConsent avrebbero atteso la propria rete a HERO_REST_MS per
       accorgersene. `__dtPreArmed` distingue "sipario mai previsto" da
       "sipario previsto e già ritirato" — a posteriori non c'è altro modo di
       saperlo — e qui l'evento parte subito.
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

  /* Lo scroll torna al capitolo alla ricarica (D22, spec §2.7).
     - Al pagehide si salva { p, y, id, dy } in LAST_Y_KEY, su ogni rotta.
     - Alla ricarica, coi corridoi accesi (MQ.corridor), lo scroll va a
       top(id) + dy a ogni refresh di ScrollTrigger, fino a quello dopo il load
       compreso. Il primo arriva subito dopo il montaggio: i useGSAP dei nastri
       sono effetti di layout e hanno già scritto le loro misure. L'ultimo
       arriva dopo il load, quando è passato anche il ripristino nativo del
       browser.
     - Il primo gesto (rotella, tocco, tasto, puntatore) ferma tutto: chi
       scorre non viene riportato indietro.
     - Non si arma su /case/* né sotto [data-motion-freeze]: /case/[slug]
       resta ferma (A26, D32).
     - Col sipario in scena ([data-preloader]) si ferma: il film porta la
       pagina in cima.
     Fuori dal film: data-preloader si legge e non si scrive. */
  useEffect(() => {
    const tops = (): ChapterTop[] =>
      Array.from(document.querySelectorAll<HTMLElement>("#main section[id]"), (el) => ({
        id: el.id,
        top: Math.round(el.getBoundingClientRect().top + window.scrollY),
      }));
    const save = () => {
      try {
        const state = snapshot(location.pathname, Math.round(window.scrollY), tops());
        sessionStorage.setItem(LAST_Y_KEY, JSON.stringify(state));
      } catch {
        /* storage negato (D22): alla ricarica decide il browser */
      }
    };
    window.addEventListener("pagehide", save);

    let saved: LastY | null = null;
    try {
      saved = parseLastY(sessionStorage.getItem(LAST_Y_KEY));
    } catch {
      saved = null;
    }
    const entry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const navigation = entry?.type;

    const frozen = location.pathname.startsWith("/case/") || document.querySelector("[data-motion-freeze]") !== null;
    const armed = saved !== null && navigation === "reload" && !frozen && window.matchMedia(MQ.corridor).matches;
    const INPUTS = ["wheel", "touchstart", "keydown", "pointerdown"] as const;
    let loaded = document.readyState === "complete";

    function stop() {
      ScrollTrigger.removeEventListener("refresh", onRefresh);
      window.removeEventListener("load", onLoad);
      for (const type of INPUTS) window.removeEventListener(type, stop, true);
    }
    function onLoad() {
      loaded = true;
      requestRefresh();
    }
    function onRefresh() {
      if (document.documentElement.hasAttribute("data-preloader")) {
        stop();
        return;
      }
      const y = restoreTarget(saved, {
        pathname: location.pathname,
        hash: location.hash,
        navigation,
        tops: tops(),
        maxY: document.documentElement.scrollHeight - window.innerHeight,
      });
      if (y !== null && Math.abs(window.scrollY - y) > 1) {
        // Senza `force` (D22): se qualcuno ha fermato Lenis, non si scrolla sotto di lui.
        const lenis = getLenis();
        if (lenis) lenis.scrollTo(y, { immediate: true });
        else window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior });
        ScrollTrigger.update();
      }
      if (loaded) stop();
    }

    if (armed) {
      ScrollTrigger.addEventListener("refresh", onRefresh);
      for (const type of INPUTS) window.addEventListener(type, stop, { capture: true, passive: true });
      if (!loaded) window.addEventListener("load", onLoad, { once: true });
      requestRefresh();
    }

    return () => {
      window.removeEventListener("pagehide", save);
      stop();
    };
  }, []);

  useGSAP(() => {
    const html = document.documentElement;
    // La shell resa dal server: se manca (layout diverso, test) non c'è
    // niente da orchestrare — si esce senza toccare l'attributo, che cadrà
    // con la rete del boot script.
    const root = document.getElementById("dt-preloader");
    if (!root || !html.hasAttribute("data-preloader")) return;

    // Il precarico del telefono aspetta solo la prima piega (vedi sotto).
    // `MQ.belowDesktop` (767.98) e non 767: alle larghezze frazionarie un buco
    // di un pixel lascerebbe spenti sia questo ramo sia le regole CSS gemelle.
    const mobile = window.matchMedia(MQ.belowDesktop).matches;

    // La porta corta (Alberto, 13 settembre 2026: A18, A20; spec §6.2): il
    // boot script scrive "short" su «/» e "short-page" sulle interne. Solo la
    // gomma, `veloce`: nessuno skip, nessun precarico da aspettare, nessuna
    // chiave del film.
    const short = html.getAttribute("data-preloader")?.startsWith("short") ?? false;

    // Il JS è al timone: lo dice a e2e, filmstrip e sonde. Siamo in un layout
    // effect: l'attributo entra nel paint in cui l'orchestrazione si arma.
    html.setAttribute("data-pre-live", "");

    const timers = new Set<number>();
    const clearTimers = () => {
      timers.forEach((t) => window.clearTimeout(t));
      timers.clear();
    };
    // Il rAF del cerchio che segue la cancellatura (da `onReveal` a `finish`).
    let buco = 0;
    // I listener: lo skip si stacca quando la gomma parte, gli altri a `finish`.
    // Il componente resta montato per tutta la sessione, e un preventDefault
    // residuo sul keydown romperebbe ogni campo di testo del sito dopo l'intro.
    let removeSkipListeners = () => {};
    let removeCloseListeners = () => {};
    // L'effect è vivo (StrictMode e HMR lo smontano e lo rifanno).
    let vivo = true;

    // `completed`: sessionStorage va scritto solo quando l'intro è stata
    // davvero vista/saltata dall'utente — mai negli abort (StrictMode/HMR),
    // altrimenti in dev l'intro non si rivede più.
    let finished = false;
    const finish = (completed: boolean) => {
      if (finished) return;
      finished = true;
      // La chiave del film la scrive già il boot script all'armamento: qui
      // resta la cintura. La corta non la tocca mai: se scrivesse INTRO_FILM
      // dopo una corta interna, la home non darebbe più il film (riga 4 della
      // macchina a stati di spec §6.2; Alberto, 13 set. 2026, A18 e A20).
      if (completed && !short) {
        try {
          sessionStorage.setItem(INTRO_KEY, INTRO_FILM);
        } catch {
          /* storage pieno/bloccato: pazienza, si rivedrà */
        }
      }
      clearTimers();
      window.cancelAnimationFrame(buco);
      removeSkipListeners();
      removeCloseListeners();
      html.removeAttribute("data-preloader");
      html.removeAttribute("data-pre-live");
      html.removeAttribute("data-pre-act2");
      html.removeAttribute("data-pre-skip");
      // Ripristina il contratto Lenis↔ScrollTrigger (vedi sotto).
      gsap.ticker.lagSmoothing(0);
      getLenis()?.start();
      // La gomma si smonta da sola a fine corsa; negli altri percorsi (scheda
      // nascosta, reduced-motion in corsa) la si smonta qui, col suo rAF.
      setGomma(null);
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

    // Deep-link con ancora (/#contatti): il sipario presuppone la pagina in
    // cima e combatterebbe lo scroll all'ancora di Next. Il boot script in quel
    // caso non mette nemmeno l'attributo: qui non ci si arriva più, la guardia
    // resta come rete.
    if (window.location.hash) {
      fireIntro();
      finish(true);
      return;
    }

    const slot = root.querySelector<HTMLElement>("[data-pre-gomma]");
    const firstChar = root.querySelector<HTMLElement>("[data-pre-char]");
    const ring = root.querySelector<SVGElement>("[data-rot-ring]");
    if (!slot) {
      fireIntro();
      finish(true);
      return;
    }

    // L'orologio: quanto è già passato del film in CSS. Tutto ciò che segue
    // si posiziona qui, così i suoi istanti sono quelli del film, non «da
    // quando è arrivato il JavaScript».
    const elapsed = elapsedFromCss([root, ring, firstChar]);
    const mountedAt = performance.now();
    /** L'ora del film ADESSO, in secondi: l'orologio CSS più il tempo da qui. */
    const now = () => elapsed + (performance.now() - mountedAt) / 1000;
    /** `fn` all'istante `t` del film; se è già passato, subito. */
    const at = (t: number, fn: () => void) => {
      const ms = (t - now()) * 1000;
      if (ms <= 0) fn();
      else timers.add(window.setTimeout(fn, ms));
    };

    // L'unica cosa che il JS fa per l'atto I è chiudere la finestra del
    // `will-change` delle lettere quando l'ultima ha finito (INTRO_T.act1End):
    // `data-pre-act2` su <html> toglie la promozione (globals.css).
    const unwill = () => html.setAttribute("data-pre-act2", "");

    // LA RETE CSS È GIÀ PARTITA: il sipario sta sfumando da solo (autohide) e
    // l'hero entra per conto suo. Il JS è arrivato tardi (il telefono lento
    // misurato: 8-12 s) e non si rimonta niente: si chiude come la rete avrebbe
    // fatto, e l'handoff parte per chi lo aspetta.
    const reteAt = (short ? PRE_SHORT_AUTOHIDE_MS : PRE_AUTOHIDE_MS) / 1000;
    if (elapsed >= reteAt) {
      unwill();
      fireIntro();
      finish(true);
      return;
    }

    // Il JS è arrivato in tempo: la rete del boot script (PRE_FAILSAFE_MS) non
    // deve più strappare l'attributo per conto suo. Da qui la responsabilità di
    // chiudere è SOLO di questo effect.
    try {
      window.clearTimeout(boot().__dtPreFailsafe);
    } catch {
      /* boot script mai eseguito: nulla da pulire */
    }
    // Lo skip del boot script (quello che serve il primo tocco prima di React)
    // si ritira: da qui lo serve questo modulo. Restando acceso ri-armerebbe
    // la rete a SKIP_TAIL_MS dal tocco, e la gomma `veloce` (2,76 s) verrebbe
    // strappata a metà (misurato il 23 set.: il sipario cadeva a +1,85 s).
    boot().__dtPreSkipOff?.();

    getLenis()?.stop();
    // La gomma scopre l'hero: la pagina deve essere in cima. Alla ricarica la
    // tiene lì il guardiano del boot script (D65, layout.tsx); questa è la
    // cintura. `instant` perché `html` ha `scroll-behavior: smooth` finché
    // Lenis non mette la sua classe.
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    // Il jank di avvio (idratazione, decode immagini) con lagSmoothing(0)
    // farebbe saltare le timeline GSAP in avanti di secondi al primo tick.
    // Durante l'intro lo scroll è bloccato, quindi lo smoothing è sicuro;
    // finish() lo riporta a 0 (contratto SmoothScroll/Lenis).
    gsap.ticker.lagSmoothing(500, 33);

    // ── IL PRECARICO: DIETRO IL SIPARIO, ED È IL `ready` DELLA GOMMA ─────
    // Su DESKTOP tutte le immagini della pagina (richiesta del cliente:
    // «caricare tutto prima di entrare»), con scadenza 4,5 s SUL FILM; sul
    // TELEFONO solo la prima piega, senza svegliare niente, con scadenza
    // WARM_FIRST_FOLD_MS (e il registro dopo l'handoff, in `finish`): sulla
    // connessione del telefono `warmAllImages` metterebbe in gara ogni
    // immagine con la foto dell'hero. Entrambe le scadenze stanno prima che
    // la gomma a tempo finisca di disegnare (GOMMA_REVEAL_MS): la gomma di
    // norma trova la pagina pronta e non batte il cuore; se il precarico
    // rifiuta, la promessa si risolve lo stesso (`.catch`), e la gomma ha
    // comunque il suo `maxWait`.
    const filmMs = Math.round(elapsed * 1000);
    let scaldata: Promise<void>;
    if (short) {
      scaldata = Promise.resolve();
    } else if (mobile) {
      scaldata = warmFirstFold(Math.max(0, WARM_FIRST_FOLD_MS - filmMs));
    } else {
      registerWarmup(warmAllImages);
      scaldata = runWarmup(Math.max(0, 4500 - filmMs));
    }
    void scaldata
      .catch(() => {})
      .then(() => {
        if (vivo) setPronta(true);
      });

    // Nella corta l'atto I non si dipinge (D31: salta [data-pre-content]):
    // la finestra del will-change si chiude subito.
    if (short) unwill();
    else at(INTRO_T.act1End, unwill);

    // L'ENTRATA DELL'HERO aspetta la gomma: il suo orologio (`--dt-entrata-t`,
    // globals.css) ha nel CSS la rete senza JS; da qui lo tiene lontano questo
    // modulo, e ci scrive l'ora vera quando la cancellatura si allarga.
    // L'ora si legge sull'orologio delle animazioni DELL'HERO (la salita dello
    // strato), non su quello della shell: partono nello stesso style update
    // solo se il foglio di stile arriva prima del primo paint. Col CSS caricato
    // dopo (il dev, misurato il 23 set.) l'hero partiva mezzo secondo prima
    // della shell, e le lettere dell'entrata arrivavano in anticipo.
    const entrata = html.hasAttribute("data-hero-entrata");
    const oraEntrata = () => {
      const salita = document
        .querySelector(".dt-hero [data-testa-strato]")
        ?.getAnimations?.()
        .find((a) => (a as CSSAnimation).animationName === "dt-hero-sale");
      const adesso = document.timeline?.currentTime;
      const via = salita?.startTime;
      return typeof adesso === "number" && typeof via === "number" ? (adesso - via) / 1000 : now();
    };
    const orologioEntrata = (dopo: number | null) => {
      if (!entrata) return;
      html.style.setProperty("--dt-entrata-t", dopo === null ? "9999s" : `${(oraEntrata() + dopo).toFixed(3)}s`);
    };
    orologioEntrata(null);

    let logo: Element | null = null;
    let tratto: Element | null = null;

    // LA FOTO NEL CUORE (hero.ts `DISCESA`): la scatola della foto dell'hero,
    // rimpicciolita a `larghezza` volte il logo e con la quota `centro` (il
    // centro di Raffaela) sull'origine del rombo, che il componente ha appena
    // posato. La trasformata parte dal bordo alto della scatola, che è quello
    // dello strato (in questo istante giù fuori campo: il `from` della salita).
    const inquadra = () => {
      if (!entrata) return;
      const g = logoGeo(logo);
      const strato = document.querySelector<HTMLElement>(".dt-hero [data-testa-strato]");
      const box = strato?.querySelector<HTMLElement>("[data-testa-foto-box]");
      if (!g || !strato || !box || box.offsetWidth === 0) return;
      const s = (BOX.w * g.k * DISCESA.larghezza) / box.offsetWidth;
      const y = g.y - strato.getBoundingClientRect().top - s * DISCESA.centro * box.offsetHeight;
      html.style.setProperty("--gomma-foto-s", s.toFixed(4));
      html.style.setProperty("--gomma-foto-y", `${y.toFixed(1)}px`);
    };

    // IL CERCHIO CHE SEGUE LA CANCELLATURA: a ogni fotogramma la larghezza del
    // tratto che si allarga (`stroke-width`, unità del logo) e la posa del logo;
    // centro e raggio vanno sulla shell, dove li leggono le maschere del fondo
    // caldo e della sagoma (globals.css, «La gomma»). Il tratto lo scrive il rAF
    // del componente, e questo può leggerlo un fotogramma prima che lo aggiorni:
    // sulla coda della cancellatura (easeInCubic) il fronte fa 40-50 px a
    // fotogramma, e il fondo caldo restava indietro come una fascia bruna sul
    // sito già scoperto (pellicola a 1440, 23 set.). Si guarda quindi DUE
    // fotogrammi avanti, con la crescita dell'ultimo.
    let wPrima = 0;
    const segui = () => {
      const g = logoGeo(logo);
      const w = Number.parseFloat(tratto?.getAttribute("stroke-width") ?? "0") || 0;
      const avanti = w + 2 * Math.max(0, w - wPrima);
      wPrima = w;
      if (g) {
        root.style.setProperty("--gomma-x", `${g.x.toFixed(1)}px`);
        root.style.setProperty("--gomma-y", `${g.y.toFixed(1)}px`);
        root.style.setProperty("--gomma-r", `${((avanti / 2 + BUCO_OLTRE) * g.k).toFixed(1)}px`);
      }
      buco = window.requestAnimationFrame(segui);
    };

    const onReveal = () => {
      if (!vivo) return;
      // L'handoff: le lettere dell'hero, il banner cookie, l'orologio
      // dell'entrata (la foto intanto scende: CSS su `data-gomma="reveal"`),
      // che parte `DISCESA.entrata` dopo, quando la foto ha lasciato il centro.
      fireIntro();
      orologioEntrata(DISCESA.entrata);
      window.cancelAnimationFrame(buco);
      segui();
    };
    const onDone = () => {
      if (vivo) finish(true);
    };

    // Il componente scrive la posa del logo nel suo effect, dopo il commit:
    // la si aspetta qualche fotogramma (durante il suo `delay` il foglio è
    // pieno, niente è ancora scoperto) e da lì si centra la foto.
    let posa = 0;
    const aspettaLogo = (giri: number) => {
      logo = slot.querySelector("[data-gomma-logo]");
      tratto = slot.querySelector("[data-gomma-swell]");
      if (logoGeo(logo)) {
        inquadra();
        return;
      }
      if (giri > 0) posa = window.requestAnimationFrame(() => aspettaLogo(giri - 1));
    };
    const onResize = () => inquadra();

    let montata = false;
    const monta = (speed: PreloaderSpeed) => {
      if (montata || finished || !vivo) return;
      montata = true;
      // Da qui lo skip non ha più niente da anticipare, e la chiusura è della
      // gomma: nessuna rete del boot script (ri-armata da uno skip servito
      // prima di React) deve togliere l'attributo mentre disegna.
      removeSkipListeners();
      window.clearTimeout(boot().__dtPreFailsafe);
      setGomma({ slot, speed, onReveal, onDone });
      aspettaLogo(30);
      window.addEventListener("resize", onResize);
    };

    // Skip (solo nel film, D31): al primo tocco/click/tasto prima che la gomma
    // entri, l'atto I va alla fine (CSS su `data-pre-skip`) e la gomma parte
    // subito, `veloce`. «Entra ADESSO»: si taglia il preambolo, non la porta.
    // `--pre-skip` è l'ora del film: la rete CSS dello skip ci si allinea (e
    // la gomma la spegne un fotogramma dopo).
    // E chi salta non aspetta il precarico: aspettarlo contraddirebbe l'unico
    // gesto con cui ha detto che ha fretta (era `saltata` prima della gomma).
    // Il `ready` della gomma diventa vero subito e la cancellatura si allarga
    // appena il cuore è disegnato, invece di battere fino alla scadenza del
    // precarico (4,5 s sul film da 768 in su: misurato in CI a 768, handoff a
    // +4,2 s dal JS al timone). Il precarico non si annulla, prosegue dietro.
    const salta = () => {
      unwill();
      setPronta(true);
      monta("veloce");
    };
    const skip = () => {
      if (montata) return;
      html.style.setProperty("--pre-skip", `${now().toFixed(3)}s`);
      html.setAttribute("data-pre-skip", "");
      salta();
    };
    const onPointerSkip = () => skip();
    const onKeySkip = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // Solo tasti "di contenuto": F5/DevTools/media key restano al browser.
      const usable = e.key === "Enter" || e.key === " " || e.key === "Escape" || e.key.length === 1;
      if (!usable) return;
      // La guardia PRIMA di preventDefault: è l'inversione che nell'onda 9
      // rese i campi inservibili in produzione.
      if (montata) return;
      // preventDefault: sotto l'overlay può esserci un elemento focalizzato
      // (es. un bottone) — il tasto salta l'intro, non deve attivare altro.
      e.preventDefault();
      skip();
    };
    if (!short) {
      window.addEventListener("pointerdown", onPointerSkip);
      window.addEventListener("keydown", onKeySkip);
      removeSkipListeners = () => {
        window.removeEventListener("pointerdown", onPointerSkip);
        window.removeEventListener("keydown", onKeySkip);
      };
    }

    // ── QUANDO ENTRA LA GOMMA ───────────────────────────────────────────
    // Nel film a INTRO_T.gomma, `normale`; subito e `veloce` nella corta, dopo
    // uno skip già servito dal boot script (il primo tocco lo raccoglie lui,
    // prima di React: layout.tsx) e col JS arrivato dopo INTRO_T.tardi.
    const giaSaltato = html.hasAttribute("data-pre-skip") && typeof boot().__dtPreSkipAt === "number";
    if (short) {
      monta("veloce");
    } else if (giaSaltato) {
      salta();
    } else {
      at(INTRO_T.gomma, () => monta(now() >= INTRO_T.tardi ? "veloce" : "normale"));
    }

    // Chiusura immediata, senza la cancellatura (motion ampio non richiesto):
    // reduced-motion attivato DURANTE l'intro, o scheda nascosta (la gomma è
    // rAF, che in background si ferma: al ritorno si trova la pagina pronta).
    // L'entrata dell'hero parte adesso.
    const closeImmediately = () => {
      fireIntro();
      orologioEntrata(0);
      finish(true);
    };
    const onMediaChange = () => {
      if (media.matches) return;
      closeImmediately();
    };
    const onVisibility = () => {
      if (!document.hidden) return;
      closeImmediately();
    };
    media.addEventListener("change", onMediaChange);
    document.addEventListener("visibilitychange", onVisibility);
    removeCloseListeners = () => {
      media.removeEventListener("change", onMediaChange);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", onResize);
    };
    // Caso limite: la pagina è già nascosta al mount (aperta in tab in
    // background) — chiudi subito invece di strisciare.
    if (document.hidden) onVisibility();

    return () => {
      vivo = false;
      clearTimers();
      window.cancelAnimationFrame(buco);
      window.cancelAnimationFrame(posa);
      removeSkipListeners();
      removeCloseListeners();
      // Abort a metà intro (StrictMode double-mount, HMR): l'attributo
      // `data-preloader` RESTA, così il re-run immediato ricostruisce
      // l'orchestrazione dal punto giusto — l'orologio è quello CSS. Si
      // ripristinano solo i contratti globali e si ri-arma la rete del boot
      // script: se il remount non arrivasse mai, l'overlay si toglie comunque.
      // `data-pre-live` invece va tolto: dice "il JS è al timone", e in questo
      // istante non lo è più. Il remount lo rimette.
      if (html.hasAttribute("data-preloader")) {
        html.removeAttribute("data-pre-live");
        gsap.ticker.lagSmoothing(0);
        getLenis()?.start();
        boot().__dtPreFailsafe = window.setTimeout(() => {
          fireIntro();
          html.removeAttribute("data-preloader");
        }, short ? PRE_SHORT_FAILSAFE_MS : PRE_FAILSAFE_MS);
      }
    };
  });

  // Fuori dal sipario non si rende niente: server e primo render client danno
  // null, e l'idratazione resta pulita. La gomma entra dopo, in un portale nello
  // slot della shell.
  if (!gomma) return null;
  return createPortal(
    <DomusTuaPreloader
      speed={gomma.speed}
      sheetColor="var(--dt-gomma-foglio)"
      zIndex={0}
      size={{ ratio: GOMMA_LOGO.ratio, min: GOMMA_LOGO.min, max: GOMMA_LOGO.max }}
      verticalCenter={GOMMA_LOGO.centroY}
      ready={pronta}
      onReveal={gomma.onReveal}
      onDone={gomma.onDone}
    />,
    gomma.slot,
  );
}
