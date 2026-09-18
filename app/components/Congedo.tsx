"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef } from "react";
import Reveal from "./Reveal";
import { Cta } from "./primitives/Cta";
import RevealGroup from "./motion/RevealGroup";
import SplitTitle from "./motion/SplitTitle";
import { getLenis } from "./motion/SmoothScroll";
import { useAmbientVideo } from "./motion/useAmbientVideo";
import { useCorridor } from "./motion/useCorridor";
import { useLocale } from "./i18n/LocaleProvider";
import { gsap, ScrollTrigger } from "../lib/motion/gsap";
import { MQ } from "../lib/motion/mq";
import { clipSides } from "../lib/motion/clip";
import { ambient } from "../lib/media";

/* Congedo — la banda video finale e la cartolina (spec 2026-09-13 §3.18).
   Titolo bianco d1 e link «Contattaci» sopra il volo del drone, senza velo: il
   video è il fondo (spec 10 set. §4.15, rif. immobiliaregoldengoal.it).
   Da 1024 px e 640 px d'altezza con motion ok (MQ.corridor, D22) la banda è uno
   schermo sticky alto 100svh su un corridoio di 80svh: scorrendo il video si
   ritira in una cartolina `inset(8% 22%)` e il footer sale da sotto crescendo
   da 0,75 a 1 (A19 e A20 di Alberto, 13 set.). Sotto la soglia la banda non è
   sticky e si ritira in `inset(4% 14%)` da 768 e `inset(4% 10%)` sotto (D29).
   Con reduced-motion e senza JS la banda resta piena e ferma, col titolo già
   dentro il rettangolo della futura finestra. Il loop è tagliato alla codifica
   senza il logo bruciato (spec §7.2): nessuno zoom per nasconderlo. */

/* L'unico trattamento ammesso sul bianco che sta sopra un'immagine: un'ombra
   di testo, la stessa grammatica della copertina delle cinque stelle. NON è un
   velo — niente rettangolo, niente vignettatura sul video (vietati dalla
   cliente): l'ombra sta attaccata alle lettere, e con il titolo spezzato in
   caratteri la ereditano i caratteri. Due raggi: 2px per staccare il bordo,
   28px per reggere il fotogramma più chiaro del volo. */
const INK_ON_VIDEO = {
  textShadow: "0 1px 2px rgb(0 0 0 / 0.35), 0 0 28px rgb(0 0 0 / 0.45)",
} as const;

const copy = {
  it: { title: "Vendere casa, senza stress.", cta: "Contattaci" },
  en: { title: "Selling your home, without stress.", cta: "Contact us" },
  fr: { title: "Vendre votre bien, sans stress.", cta: "Contactez-nous" },
  de: { title: "Verkaufen ohne Stress.", cta: "Kontakt" },
  es: { title: "Vender casa, sin estrés.", cta: "Contáctanos" },
} as const;

/** I ritiri finali della finestra, in percentuale della banda (spec §3.18, D29). */
const SIDES_LG = { t: 8, r: 22, b: 8, l: 22 };
const SIDES_TAB = { t: 4, r: 14, b: 4, l: 14 };
const SIDES_PHONE = { t: 4, r: 10, b: 4, l: 10 };
type Sides = typeof SIDES_LG;

/** Il footer entra nel viewport a 72svh su 132svh di timeline (lane-homeC §7.2). */
const FOOT_AT = 0.545;

/* Il ritaglio sta su un figlio dello schermo sticky, mai su un antenato, e il
   marcatore `data-bg="foto"` lo segue a ogni fotogramma (A21, spec §6.1). `f.b`
   è la frazione del bordo basso, `f.s` quella degli altri tre lati. */
function paintClip(clip: HTMLElement | null, marker: HTMLElement | null, k: Sides, f: { b: number; s: number }) {
  const t = +(k.t * f.s).toFixed(3);
  const r = +(k.r * f.s).toFixed(3);
  const b = +(k.b * f.b).toFixed(3);
  const l = +(k.l * f.s).toFixed(3);
  if (clip) clip.style.clipPath = clipSides(t, r, b, l);
  if (marker) marker.style.inset = `${t}% ${r}% ${b}% ${l}%`;
}

function clearClip(clip: HTMLElement | null, marker: HTMLElement | null) {
  clip?.style.removeProperty("clip-path");
  marker?.style.removeProperty("inset");
}

/** Il footer della cartolina: il contesto GSAP locale e gli ascolti da togliere. */
type FootState = { ctx: gsap.Context | null; off: Array<() => void> };

/** Toglie stato armato, tween e trigger d'armamento del footer, e gli ascolti della ricarica. */
function dropFooter(s: FootState) {
  for (const off of s.off.splice(0)) off();
  s.ctx?.revert();
  s.ctx = null;
}

/* Il tween del footer è insieme figlio della timeline di useCorridor e dentro il
   contesto locale: quando il ramo di gsap.matchMedia si reverte i due revert si
   incrociano e l'ultimo riscrive sul footer lo stato armato che la `set` gli
   aveva lasciato sotto (scala 0,75 e opacità 0). Le tre proprietà si tolgono a
   mano dopo dropFooter: con reduced-motion e allo smontaggio il footer resta
   pieno, fermo e senza stile inline (A19 e A20 di Alberto, spec 2026-09-13 §3.18). */
function clearFooter(footer: HTMLElement | null) {
  if (!footer) return;
  footer.style.removeProperty("transform");
  footer.style.removeProperty("transform-origin");
  footer.style.removeProperty("opacity");
}

/* IL FOOTER DELLA CARTOLINA (A19 e A20 di Alberto, spec 2026-09-13 §3.18).
   - Sotto il viewport: stato armato fuori schermo con una set (scala 0,75,
     opacità 0, origine 50% 0%) e tween da `at` a 1 con
     `immediateRender: false`.
   - Già a schermo (ricarica in fondo, ancora nell'URL): nessuno stato armato.
     Il trigger d'armamento aspetta `onLeaveBack`, quando la pagina risale
     sopra il capitolo: un footer visibile non passa mai a meno visibile.
   - Alla ricarica il Preloader riporta lo scroll al capitolo dentro gli eventi
     `refresh` di ScrollTrigger, dopo questo montaggio (D22). Fino al refresh
     che segue il load, e finché nessuno tocca rotella, dito, tasti o
     puntatore, dopo ogni refresh si guarda la quota d'arrivo: col footer a
     schermo e lo stato armato si riparte dal ramo «già a schermo».
   Set, tween e trigger stanno in un gsap.context locale. Set e tween possono
   nascere in un callback, fuori dal contesto di matchMedia di useCorridor, e il
   Congedo reverte il contesto da sé a ogni build e phone, al cambio di
   MQ.motionOk e allo smontaggio. */
function armFooter(
  s: FootState,
  el: HTMLElement | null,
  tl: gsap.core.Timeline,
  at: number,
  trigger: Element,
  start: string,
  landing = true,
) {
  dropFooter(s);
  const footer = el;
  if (!footer) return;
  const ctx = gsap.context(() => {});
  s.ctx = ctx;
  let armed = false;
  const inView = () => footer.getBoundingClientRect().top < window.innerHeight;

  const add = () => {
    if (armed) return;
    armed = true;
    ctx.add(() => {
      gsap.set(footer, { scale: 0.75, opacity: 0, transformOrigin: "50% 0%" });
      tl.fromTo(
        footer,
        { scale: 0.75, opacity: 0, transformOrigin: "50% 0%" },
        { scale: 1, opacity: 1, duration: 1 - at, ease: "dtCartolina", immediateRender: false },
        at,
      );
    });
  };

  if (inView()) {
    ctx.add(() => {
      const arm = ScrollTrigger.create({
        trigger,
        start,
        onLeaveBack: () => {
          arm.kill();
          add();
        },
      });
    });
  } else {
    add();
  }

  const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  if (!landing || nav?.type !== "reload") return;
  const INPUTS = ["wheel", "touchstart", "keydown", "pointerdown"] as const;
  let frame = 0;
  function onRefresh() {
    const loaded = document.readyState === "complete";
    cancelAnimationFrame(frame);
    // Il rAF lascia passare lo scroll che il Preloader scrive nello stesso refresh.
    frame = requestAnimationFrame(() => {
      if (armed && inView()) armFooter(s, footer, tl, at, trigger, start, false);
      else if (loaded) off();
    });
  }
  function off() {
    cancelAnimationFrame(frame);
    ScrollTrigger.removeEventListener("refresh", onRefresh);
    for (const type of INPUTS) window.removeEventListener(type, off, true);
  }
  ScrollTrigger.addEventListener("refresh", onRefresh);
  for (const type of INPUTS) window.addEventListener(type, off, { capture: true, passive: true });
  s.off.push(off);
}

export default function Congedo() {
  const { locale } = useLocale();
  const c = copy[locale];
  const sectionRef = useRef<HTMLElement | null>(null);
  const screenRef = useRef<HTMLDivElement | null>(null);
  const clipRef = useRef<HTMLDivElement | null>(null);
  const markerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const footerRef = useRef<HTMLElement | null>(null);
  const stRef = useRef<ScrollTrigger | null>(null);
  const footRef = useRef<FootState>({ ctx: null, off: [] });

  // Il footer è fratello di <main> e lo rende page.tsx con `postcard`: lo si
  // trova nel DOM prima che useCorridor crei il trigger che finisce su di lui
  // (i layout effect di un componente girano nell'ordine in cui sono scritti,
  // e useGSAP è un layout effect).
  useLayoutEffect(() => {
    footerRef.current = document.querySelector<HTMLElement>("footer[data-postcard-foot]");
  }, []);

  // Il volo parte solo con motion ok, da 768 px, con la scheda visibile e senza
  // risparmio dati (spec §2.7). Sorgente 720p a ogni larghezza, non la 1080p:
  // nello sticky il clip-path scritto da JS ridipinge il video a ogni fotogramma
  // e il paint massimo a 1440 con CPU ×4 sfora il tetto di 4 ms con tutt'e due
  // le sorgenti. Su tre lanci per sorgente a macchina scarica
  // (misure/17-paint.mjs): 720p 7,87 · 3,49 · 4,89 ms, 1080p 8,96 · 6,93 · 7,06;
  // il p95 non le distingue (1,8-2,0 in tutti e sei). La 720p taglia le punte ed
  // è la ripiega che spec §3.18 dice di provare per prima, ma il cancello resta
  // rosso: la scelta è di Alberto, coi numeri in risultati.md. Il hook sceglie la
  // sorgente al primo avvicinamento (spec §2.7), quindi la 720p vale per tutta
  // la sessione, non solo durante lo sticky.
  useAmbientVideo(videoRef, clipRef, { sources: { hd: ambient.congedo.sd, sd: ambient.congedo.sd } });

  useCorridor(sectionRef, {
    id: "cartolina",
    stick: "top",
    endTrigger: footerRef,
    end: "clamp(top 40%)",
    deps: [locale],
    // Da 1024: il bordo basso va a 8 % in 0→0,54, gli altri tre a 8/22/22 % in
    // 0→0,85; il footer da 0,545 a 1. Durata 1, ease dtCartolina.
    // I due tratti sono `fromTo`: la timeline di useCorridor gira con
    // `invalidateOnRefresh` (useCorridor.ts), e un refresh a metà corridoio
    // rilegge i valori di partenza dal `vars` dichiarato, non dal proxy `f`
    // com'è in quel momento. Così la finestra non salta in avanti e, risalendo
    // in cima al corridoio, la banda si riapre (A19 e A20 di Alberto, §3.18).
    build: (tl) => {
      const f = { b: 0, s: 0 };
      clearClip(clipRef.current, markerRef.current);
      tl.fromTo(f, { b: 0 }, { b: 1, duration: 0.54, ease: "dtCartolina", onUpdate: () => paintClip(clipRef.current, markerRef.current, SIDES_LG, f) }, 0)
        .fromTo(f, { s: 0 }, { s: 1, duration: 0.85, ease: "dtCartolina", onUpdate: () => paintClip(clipRef.current, markerRef.current, SIDES_LG, f) }, 0)
        .add(() => {}, 1);
      if (sectionRef.current) armFooter(footRef.current, footerRef.current, tl, FOOT_AT, sectionRef.current, "top top");
      stRef.current = tl.scrollTrigger ?? null;
    },
    // Sotto la soglia, con motion ok: niente sticky; la banda si ritira mentre
    // il suo bordo basso sale dal fondo al 30 % del viewport, e il footer, che
    // le sta attaccato, cresce nello stesso tratto (D29).
    phone: () => {
      const screen = screenRef.current;
      if (!screen) return;
      const f = { b: 0, s: 0 };
      const sides = () => (window.matchMedia(MQ.desktop).matches ? SIDES_TAB : SIDES_PHONE);
      clearClip(clipRef.current, markerRef.current);
      // Lo stato di partenza è dichiarato con `fromTo` e i lati si rileggono a
      // ogni fotogramma da `sides()`: nella timeline non resta niente di
      // misurato, quindi niente `invalidateOnRefresh`. Un refresh a metà tratto
      // — il resize della finestra, la barra degli indirizzi del tablet — non
      // sposta il gesto (A19 e A20 di Alberto, spec §3.18, D29).
      const tl = gsap.timeline({
        defaults: { ease: "dtCartolina", immediateRender: false },
        scrollTrigger: {
          trigger: screen,
          start: "bottom bottom",
          end: "clamp(bottom 30%)",
          scrub: 0.9,
        },
      });
      tl.fromTo(f, { b: 0, s: 0 }, { b: 1, s: 1, duration: 0.8, onUpdate: () => paintClip(clipRef.current, markerRef.current, sides(), f) }, 0)
        .add(() => {}, 1);
      armFooter(footRef.current, footerRef.current, tl, 0, screen, "bottom bottom");
      stRef.current = tl.scrollTrigger ?? null;
      return () => {
        clearClip(clipRef.current, markerRef.current);
        dropFooter(footRef.current);
        stRef.current = null;
      };
    },
  });

  // Reduced-motion attivato a pagina aperta (spec §3.18): il contesto di
  // matchMedia toglie timeline e ritiri, qui si tolgono il ritaglio e l'inset
  // scritti a mano e il contesto locale del footer, così banda e footer tornano
  // pieni e fermi. Lo stesso allo smontaggio.
  useEffect(() => {
    const clip = clipRef.current;
    const marker = markerRef.current;
    const foot = footRef.current;
    const mq = window.matchMedia(MQ.motionOk);
    const onChange = () => {
      if (mq.matches) return;
      clearClip(clip, marker);
      dropFooter(foot);
      clearFooter(footerRef.current);
    };
    mq.addEventListener("change", onChange);
    return () => {
      mq.removeEventListener("change", onChange);
      clearClip(clip, marker);
      dropFooter(foot);
      clearFooter(footerRef.current);
    };
  }, []);

  // LA RETE DI TASTIERA (A19 di Alberto; correzione bloccante 3 di homeC, spec §3.18). Il Tab
  // che entra nel footer mentre è ancora a opacità bassa porta la pagina alla
  // fine del gesto e chiude lo scrub: il link a fuoco è pieno. Un clic del mouse
  // su telefono, WhatsApp o e-mail non ha `:focus-visible` e non fa saltare
  // nulla. Il rAF lascia passare prima lo scroll-into-view del browser.
  useEffect(() => {
    const footer = footerRef.current;
    if (!footer) return;
    const onFocus = (e: FocusEvent) => {
      if (!(e.target instanceof Element) || !e.target.matches(":focus-visible")) return;
      requestAnimationFrame(() => {
        const st = stRef.current;
        if (!st || !ScrollTrigger.getAll().includes(st) || window.scrollY >= st.end) return;
        const lenis = getLenis();
        if (lenis) lenis.scrollTo(st.end, { immediate: true, force: true });
        else window.scrollTo({ top: st.end, behavior: "instant" });
        ScrollTrigger.update();
        st.getTween()?.progress(1);
      });
    };
    footer.addEventListener("focusin", onFocus);
    return () => footer.removeEventListener("focusin", onFocus);
  }, []);

  return (
    <section
      ref={sectionRef}
      id="congedo"
      aria-labelledby="congedo-title"
      data-corridor="cartolina"
      data-stick="top"
      className="dt-postcard relative"
    >
      {/* Lo schermo: sticky sotto la soglia dei corridoi (CSS generica di
          `[data-corridor]`), altrimenti la banda 16:9 di sempre. `overflow-clip`
          e non `hidden`: nessun contenitore di scroll che un focus() sposti.
          `pointer-events-none`: la sua scatola trasparente non deve prendere i
          clic del footer che le scorre sopra; ritaglio e testo li riaccendono. */}
      <div
        ref={screenRef}
        data-corridor-screen
        className="dt-postcard_screen pointer-events-none relative aspect-video min-h-[70svh] w-full overflow-clip"
      >
        <div ref={clipRef} data-postcard-clip className="pointer-events-auto absolute inset-0 bg-cream-deep">
          {/* `sizes` della resa al taglio più stretto di ogni larghezza (lane-homeC
              §7.4): sul telefono della banda 16:9 si vede un terzo della
              larghezza. `quality` 60 per non pagarla due volte. */}
          <Image
            src={ambient.congedo.poster}
            alt=""
            fill
            quality={60}
            sizes="(max-width: 767px) 270vw, (max-width: 1023px) 166vw, 134vw"
            className="object-cover"
            style={{ objectPosition: "var(--pc-focus)" }}
          />
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: "var(--pc-focus)" }}
            muted
            loop
            playsInline
            preload="none"
            disablePictureInPicture
            disableRemotePlayback
            aria-hidden
            tabIndex={-1}
          />
        </div>
        <div ref={markerRef} data-bg="foto" aria-hidden className="pointer-events-none absolute inset-0" />
        <RevealGroup className="dt-postcard_copy pointer-events-auto absolute">
          {/* h2 a peso 500 (globals.css:318-322): la crenatura dei caratteri
              legge la chiave display-500 della tabella (D20, spec §2.3). */}
          <SplitTitle
            as="h2"
            id="congedo-title"
            font="display-500"
            className="max-w-[12ch] text-balance font-display text-d1 text-white"
            style={INK_ON_VIDEO}
          >
            {c.title}
          </SplitTitle>
          {/* Un blocco con un link entra solo in opacità: ruolo still (spec §2.2,
              D21). Le regole .dt-btn sono unlayered: per la taglia d4 leggera
              serve `!`. */}
          <Reveal role="still">
            <Cta
              href="#contatti"
              variant="ghost-dark"
              arrow={false}
              className="mt-8 !text-d4 !font-light"
              style={INK_ON_VIDEO}
            >
              {c.cta}
            </Cta>
          </Reveal>
        </RevealGroup>
      </div>
      <div data-corridor-run aria-hidden className="hidden" />
    </section>
  );
}
