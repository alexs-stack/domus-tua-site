"use client";

// IL CORRIDOIO DELLA TESTA DELLE PAGINE INTERNE.
//
// A20 di Alberto (13 settembre 2026, «Fedeltà letterale», spec §5.1): ogni PageHero
// è un corridoio sticky da 1024 px e 640 px d'altezza con motion ok (D22). La
// section porta `data-corridor="page-dive"`: la CSS prima del paint del hook le dà
// 100svh di schermo sticky e 120svh di corsa, così all'idratazione non cambia
// nessuna altezza. Dentro, da 0 a 0,6 il contenuto sale di Δt e la banda, sua
// figlia, di Δb in tutto (dtEase); da 0,4 a 1 la foto passa da 1 a 2 con origine
// 50% 75% (dtIn). Δb e Δt si misurano con offsetTop, che i transform non toccano;
// il fondo del testo di Δt comprende la calligrafia (DIVE_BOTTOM_SEL).
// Nessun pin di GSAP e nessun transform sulla section o sullo schermo. Sotto la
// soglia nessuno sticky: solo lo strato interno della cornice cresce fino a 1,08
// (da 768 px, MQ.desktop) o 1,06 (sotto 768) mentre la banda esce dal viewport.
// PageHero non ha "use client" né hook; oggi lo importano solo moduli client, e
// qui arrivano i figli React così come li compone.
import { useRef, type ReactNode } from "react";
import { useLocale } from "../i18n/LocaleProvider";
import { gsap } from "../../lib/motion/gsap";
import { MQ } from "../../lib/motion/mq";
import { DIVE, DIVE_BOTTOM_SEL, diveDeltas } from "../../lib/motion/page-dive";
import { syncSharp } from "./PageHeroBand";
import { useCorridor, type Cue } from "./useCorridor";

/** Posizione di `el` dentro `root` sommando offsetTop lungo gli offsetParent. */
function offsetIn(el: HTMLElement, root: HTMLElement): number {
  let y = 0;
  let n: HTMLElement | null = el;
  while (n && n !== root) {
    y += n.offsetTop;
    n = n.offsetParent as HTMLElement | null;
  }
  return y;
}

function measure(content: HTMLElement, screen: HTMLElement, band: HTMLElement) {
  let textBottom = 0;
  // Spec §5.1: anche la calligrafia esce dall'alto prima dello zoom (DIVE_BOTTOM_SEL).
  content.querySelectorAll<HTMLElement>(DIVE_BOTTOM_SEL).forEach((t) => {
    textBottom = Math.max(textBottom, offsetIn(t, content) + t.offsetHeight);
  });
  return diveDeltas({ vh: screen.offsetHeight, bandTop: offsetIn(band, content), bandH: band.offsetHeight, textBottom });
}

export default function PageHeroDive({ id, children }: { id?: string; children: ReactNode }) {
  const ref = useRef<HTMLElement | null>(null);
  const { locale } = useLocale();

  const deep = (on: boolean) => {
    const zoom = ref.current?.querySelector<HTMLElement>("[data-dive-zoom]");
    if (!zoom) return;
    zoom.toggleAttribute("data-dive-deep", on);
    syncSharp(zoom);
  };
  const cues: Cue[] = [{ at: DIVE.sharpAt, forward: () => deep(true), backward: () => deep(false) }];

  useCorridor(ref, {
    id: "page-dive",
    stick: "top",
    build: (tl, q) => {
      const [screen] = q("[data-corridor-screen]");
      const [content] = q("[data-dive-content]");
      const [band] = q("[data-dive-band]");
      const [zoom] = q("[data-dive-zoom]");
      if (!screen || !content || !band || !zoom) return;
      const d = () => measure(content, screen, band);
      tl.fromTo(content, { y: 0 }, { y: () => -d().dt, ease: "dtEase", duration: DIVE.liftEnd }, 0)
        .fromTo(
          band,
          { y: 0 },
          {
            y: () => {
              const m = d();
              return m.dt - m.db;
            },
            ease: "dtEase",
            duration: DIVE.liftEnd,
          },
          0,
        )
        .fromTo(
          zoom,
          { scale: 1, transformOrigin: DIVE.origin },
          { scale: DIVE.zoomTo, transformOrigin: DIVE.origin, ease: "dtIn", duration: 1 - DIVE.zoomStart },
          DIVE.zoomStart,
        );
    },
    cues,
    phone: (q) => {
      const section = ref.current;
      const [band] = q("[data-dive-band]");
      const [inner] = q("[data-dive-inner]");
      if (!section || !band || !inner) return;
      gsap.fromTo(
        inner,
        { scale: 1, transformOrigin: DIVE.origin },
        {
          // Spec §5.1: 1,08 fra 768 e 1023, 1,06 sotto 768. D37: da 1024 con altezza sotto 640 (1440×600)
          // MQ.desktop è vero e lo strato cresce fino a 1,08.
          scale: () => (window.matchMedia(MQ.desktop).matches ? DIVE.tabletScale : DIVE.phoneScale),
          transformOrigin: DIVE.origin,
          ease: "none",
          immediateRender: false,
          scrollTrigger: {
            trigger: section,
            start: "top top",
            endTrigger: band,
            end: "bottom top",
            scrub: true,
            invalidateOnRefresh: true,
          },
        },
      );
    },
    deps: [locale],
  });

  return (
    <section ref={ref} id={id} data-corridor="page-dive" data-stick="top" className="dt-dive relative isolate bg-cream">
      <div data-corridor-screen>{children}</div>
      <div data-corridor-run aria-hidden className="hidden" />
    </section>
  );
}
