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
import { LASTRA_NIENTE, useLastra, type Lastra } from "./motion/useLastra";
import { useLocale } from "./i18n/LocaleProvider";
import { gsap, ScrollTrigger } from "../lib/motion/gsap";
import { MQ } from "../lib/motion/mq";
import { clipSides } from "../lib/motion/clip";
import { ANTICIPO, CORSA_SVH, PIAN_SVH } from "../lib/motion/lastra";
import { ambient } from "../lib/media";

/* Congedo — la testa col video a destra, l'entrata alla Lusion a schermo intero e la cartolina
   (spec 2026-09-13 §3.18; A35 di Alberto, 19-20 set.: «vorrei avere queste animazione di
   entrata nel video come nel sito di lusion»; A42, 20 set.: «il video va a destra della
   scritta, poi con lo scroll si apre con l'attuale animazione» e «deve diventare a schermo
   intero pieno come era dei commit fa»).
   La TESTA sta in flusso SOPRA lo schermo, inchiostro su crema: a sinistra l'h2 e il comando
   «Contattaci», a destra lo SLOT 16:9 (largo come la metà, min(42vw, 640px)) dove vive la
   miniatura del video: niente lettere sulla fotografia (D108, D111). Da 1024 px e 640 px
   d'altezza con motion ok (MQ.corridor, D22) lo SCHERMO è sticky, 100vw × 100svh, col video
   che lo riempie tutto. Il gesto è uno in tre tempi sullo stesso media (A28.9):
   1. l'ENTRATA (useLastra): il video parte nello slot a destra del titolo e lungo 100svh cresce
      piegandosi come un foglio fino allo schermo intero. Comincia 65svh PRIMA dell'aggancio
      dello sticky (0,65 · 100), così a e 0 la testa è tutta a schermo, scorre via mentre il
      foglio cresce, e il foglio finisce di aprirsi 35svh dopo l'aggancio, a schermo fermo. A
      scroll fermo il foglio si distende da solo nella misura che ha (nessuna calamita, nessuno
      scroll-hijack); pianerottolo di 20svh a foglio disteso;
   2. la CARTOLINA (A19 e A20, 13 set.): il video si ritira in `inset(8% 22%)`;
   3. il FOOTER sale da sotto crescendo da 0,75 a 1.
   Sotto la soglia lo schermo è la banda 16:9 di sempre (alta almeno 70svh), in flusso, lo slot
   non esiste e nessuna entrata; la banda si ritira in `inset(4% 14%)` da 768 e `inset(4% 10%)`
   sotto (D29). Con reduced-motion e senza JS la pagina è completa e ferma: testa a una colonna,
   banda piena col poster. Il loop è la clip da 02:00 del master (A29, scripts/media/congedo.mjs). */

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

/* LA TIMELINE DEL CORRIDOIO, IN svh (A35, A42).
   Start: lo schermo dista ANTICIPO · CORSA_SVH = 65svh dall'aggancio. End: il footer, che sta
   8svh sopra il fondo della corsa (`margin-top: -8svh`, globals.css), arriva al 40 % del
   viewport (`clamp(top 40%)`). Fra i due: 100 (schermo) + 135 (corsa, --corridor-run: 100 − 65
   + 20 + 80) − 8 − 40 + 65 (anticipo) = 252svh. */
const CART_RUN_SVH = 80;
const TL_SVH = 100 + CORSA_SVH + PIAN_SVH + CART_RUN_SVH - 8 - 40; // 252
/** Il tratto dell'entrata, lineare: e 0 → 1 su 100svh, cioè 100/252 = 0,397 della timeline. */
const E_UNO = CORSA_SVH / TL_SVH;
/** La cartolina comincia dopo il pianerottolo: (100 + 20)/252 = 0,476. */
const CART_AT = (CORSA_SVH + PIAN_SVH) / TL_SVH;
/** La cartolina di A19-A20 stava su una timeline di 100 + 80 − 8 − 40 = 132svh: i suoi
    numeri (0,54 · 0,85 · 0,545) restano quelli e si riportano su 252. */
const CART_SVH = 100 + CART_RUN_SVH - 8 - 40; // 132
const B_CART = 0.54;
const S_CART = 0.85;
const FOOT_AT_CART = 0.545;
/** Il bordo basso: 0,54 · 132/252 = 0,283; gli altri tre lati: 0,85 · 132/252 = 0,445. */
const DUR_B = (B_CART * CART_SVH) / TL_SVH;
const DUR_S = (S_CART * CART_SVH) / TL_SVH;
/** Il footer entra a (120 + 0,545 · 132)/252 = 0,762 della timeline (era 0,545 su 132svh). */
const FOOT_AT = (CORSA_SVH + PIAN_SVH + FOOT_AT_CART * CART_SVH) / TL_SVH;

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
  const testaRef = useRef<HTMLDivElement | null>(null);
  const screenRef = useRef<HTMLDivElement | null>(null);
  const slotRef = useRef<HTMLDivElement | null>(null);
  const clipRef = useRef<HTMLDivElement | null>(null);
  const markerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const footerRef = useRef<HTMLElement | null>(null);
  const stRef = useRef<ScrollTrigger | null>(null);
  const footRef = useRef<FootState>({ ctx: null, off: [] });
  const lastraRef = useRef<Lastra>(LASTRA_NIENTE);
  // La verità di `e` dopo un refresh di ScrollTrigger: il progresso della timeline su [0, E_UNO].
  const eRef = useRef<() => number>(() => 0);

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
  // Il loop parte in vista, anche durante l'entrata: il foglio piega il video che
  // suona, come Lusion (Alberto, 20 set.). La clip è quella da 02:00 (A29).
  useAmbientVideo(videoRef, clipRef, { sources: { hd: ambient.congedo.sd, sd: ambient.congedo.sd } });

  // L'entrata alla Lusion (A35, A42): vive da sola dentro MQ.corridor, il canvas
  // lo crea lei; la timeline qui sotto le passa `e` a ogni tick del primo tratto.
  useLastra({ sectionRef, screenRef, slotRef, clipRef, markerRef, videoRef, eRef }, lastraRef);

  useCorridor(sectionRef, {
    id: "cartolina",
    stick: "top",
    // L'anticipo si misura sull'altezza a riposo della testa in flusso, MAI su
    // offsetTop dello schermo sticky, che si sposta quando è agganciato
    // (direttive A35: trappola misurata). `start` è una funzione: la timeline
    // gira con invalidateOnRefresh e rilegge la testa a ogni refresh (lingua).
    start: () => `top+=${(testaRef.current?.offsetHeight ?? 0) - window.innerHeight * (CORSA_SVH / 100) * ANTICIPO} top`,
    endTrigger: footerRef,
    end: "clamp(top 40%)",
    deps: [locale],
    // Da 1024: PRIMA il tratto dell'entrata, lineare, e 0 → 1 in 0 → E_UNO; poi,
    // da CART_AT, il bordo basso a 8 % in DUR_B e gli altri tre a 8/22/22 % in
    // DUR_S; il footer da FOOT_AT a 1. Ease dtCartolina sulla cartolina, `none`
    // sull'entrata (il secondary `none` del registro, chapters.ts).
    // I tratti sono `fromTo`: la timeline di useCorridor gira con
    // `invalidateOnRefresh` (useCorridor.ts), e un refresh a metà corridoio
    // rilegge i valori di partenza dal `vars` dichiarato, non dal proxy com'è in
    // quel momento. Così finestra e foglio non saltano in avanti e, risalendo in
    // cima al corridoio, la banda si riapre e il foglio si richiude (A19 e A20).
    build: (tl) => {
      const pr = { e: 0 };
      const f = { b: 0, s: 0 };
      clearClip(clipRef.current, markerRef.current);
      eRef.current = () => Math.min(1, Math.max(0, tl.progress() / E_UNO));
      tl.fromTo(pr, { e: 0 }, { e: 1, duration: E_UNO, ease: "none", onUpdate: () => lastraRef.current.set(pr.e) }, 0)
        .fromTo(f, { b: 0 }, { b: 1, duration: DUR_B, ease: "dtCartolina", onUpdate: () => paintClip(clipRef.current, markerRef.current, SIDES_LG, f) }, CART_AT)
        .fromTo(f, { s: 0 }, { s: 1, duration: DUR_S, ease: "dtCartolina", onUpdate: () => paintClip(clipRef.current, markerRef.current, SIDES_LG, f) }, CART_AT)
        .add(() => {}, 1);
      if (sectionRef.current) armFooter(footRef.current, footerRef.current, tl, FOOT_AT, sectionRef.current, "top top");
      stRef.current = tl.scrollTrigger ?? null;
    },
    // Sotto la soglia, con motion ok: niente sticky, nessuna entrata; la banda si
    // ritira mentre il bordo basso dello schermo sale dal fondo al 30 % del
    // viewport, e il footer, che le sta attaccato, cresce nello stesso tratto (D29).
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
  // pieni e fermi. Lo stesso allo smontaggio. (La lastra si smonta da sé: MQ.corridor.)
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
      className="dt-postcard relative bg-cream"
    >
      {/* La testa: in flusso SOPRA lo schermo, inchiostro su crema (D108, D111).
          Da lg coi corridoi è la riga a due colonne del sito (grid, gap 6vw): a
          sinistra titolo e comando, a destra lo slot 16:9 della miniatura, largo
          come la metà e a filo del margine, dove useLastra porta il video (A42).
          Altrove lo slot non esiste. La sua altezza a riposo è la quota su cui si
          misura l'anticipo dell'entrata. */}
      <div ref={testaRef} className="dt-postcard_testa dt-row">
        <RevealGroup className="dt-postcard_testo">
          {/* h2 a peso 500 (globals.css:318-322): la crenatura dei caratteri
              legge la chiave display-500 della tabella (D20, spec §2.3). In mezza
              colonna resta d1 (la cliente vuole scritte grandi; è la frase di
              chiusura) e va a capo a ogni parola: max-w 8ch. */}
          <SplitTitle
            as="h2"
            id="congedo-title"
            font="display-500"
            className="max-w-[12ch] text-balance font-display text-d1 text-ink lg:max-w-[8ch]"
          >
            {c.title}
          </SplitTitle>
          {/* Un blocco con un link entra solo in opacità: ruolo still (spec §2.2,
              D21). Le regole .dt-btn sono unlayered: per la taglia d4 leggera
              serve `!`. */}
          <Reveal role="still">
            <Cta href="#contatti" variant="ghost" arrow={false} className="mt-8 !text-d4 !font-light">
              {c.cta}
            </Cta>
          </Reveal>
        </RevealGroup>
        <div ref={slotRef} className="dt-postcard_slot" aria-hidden />
      </div>
      {/* Lo schermo: sticky sopra la soglia dei corridoi (CSS generica di
          `[data-corridor]`), 100vw × 100svh, tutto video; altrimenti la banda
          16:9 di sempre in flusso, alta almeno 70svh sul telefono (dove della
          fotografia si vede un terzo). Sopra la soglia NON ritaglia (globals.css:
          `overflow: visible`), perché in via scala il ritaglio DOM sale nello
          slot della testa; `overflow-clip` resta sotto. `pointer-events-none`: la
          sua scatola trasparente non deve prendere i clic del footer che le
          scorre sopra; il ritaglio li riaccende. Il canvas della lastra (via gl)
          lo appende useLastra qui dentro, `fixed` sul viewport. */}
      <div ref={screenRef} data-corridor-screen className="dt-postcard_screen pointer-events-none relative aspect-video min-h-[70svh] w-full overflow-clip">
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
        {/* Il marcatore A21: in cartolina segue l'inset del ritaglio (paintClip);
            in `chiusa` e `piega` è un 1×1 con translate + scale sull'ingombro del
            foglio (`data-foglio`, useLastra). */}
        <div ref={markerRef} data-bg="foto" aria-hidden className="pointer-events-none absolute inset-0" />
      </div>
      <div data-corridor-run aria-hidden className="hidden" />
    </section>
  );
}
