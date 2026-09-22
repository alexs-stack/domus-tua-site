"use client";

// MarkSegno: il cuore che resta a schermo. Alberto il 13 settembre 2026 ha
// scelto «Si stacca da 1024» (A21; D34, spec §6.1):
//   · da 1280 px, a scroll 0, il segno sta esattamente sopra il badge della
//     testata, che va a opacità 0 e si ferma nello stesso fotogramma; nei primi
//     px della testata, legato allo scroll, il centro scivola nel margine a 4vw
//     e il lato scende a clamp(40px, 3,75vw, 56px); la y resta sull'asse della
//     testata;
//   · da 1024 a 1279 compare nel margine fra metà testata e testata, opacità
//     0 → 1 e scala 0,8 → 1;
//   · sotto 1024, con reduced-motion e senza JS resta `hidden` e la testata è
//     com'era; su /case/* (A26) il Header non lo monta.
// T1: sopra [data-bg="foto"] le tacche virano all'avorio (tema.ts, `.dt-segno`
// in globals.css); il monogramma resta grigio e rosso (C23, direttiva della
// cliente del 2026-08-26). Fratello di <header>, aria-hidden, senza clic (il
// cuore cliccabile resta il logo), z-40: sotto il banner cookie (z-60), i
// dialoghi (z-70) e il preloader (z-96). Nessun antenato trasformato: è fixed
// dentro il frammento del Header. I gsap.set e il listener del ticker che
// partono dallo scroll sono fuori dal contesto di GSAP: la pulizia li toglie a
// mano.
import { useRef, useState, type RefObject } from "react";
import { usePathname } from "next/navigation";
import { gsap, useGSAP, ScrollTrigger } from "../../lib/motion/gsap";
import { MQ } from "../../lib/motion/mq";
import { MARK_TEMA_CODA_S } from "../../lib/motion/mark";
import { temaAt, type Tema } from "../../lib/motion/tema";
import RotatingMark from "./RotatingMark";

export type MarkSegnoProps = {
  /** Lo span della testata che contiene il badge (`data-segno-slot`). */
  slotRef: RefObject<HTMLElement | null>;
  /** La riga della testata, alta `--dt-head-h`. */
  rowRef: RefObject<HTMLElement | null>;
  /** true quando il segno ha preso il posto del badge: la testata lo ferma. */
  onActive: (on: boolean) => void;
};

/** Il lato del segno a riposo, in px: il badge della testata è h-14 w-14. */
const LATO = 56;

export default function MarkSegno({ slotRef, rowRef, onActive }: MarkSegnoProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [acceso, setAcceso] = useState(false);
  const pathname = usePathname();

  useGSAP(
    () => {
      const el = ref.current;
      const row = rowRef.current;
      if (!el || !row) return;
      const html = document.documentElement;
      const mm = gsap.matchMedia();
      mm.add({ lg: `${MQ.motionOk} and ${MQ.lg}`, xl: MQ.xl }, (ctx) => {
        const lg = Boolean(ctx.conditions?.lg);
        const xl = Boolean(ctx.conditions?.xl);
        if (!lg) return;
        // Il badge della testata: il genitore dell'anello, che non ruota.
        const badge = xl ? (slotRef.current?.querySelector("[data-rot-ring]")?.parentElement ?? null) : null;
        let testata = row.offsetHeight;
        let partenza = { cx: 0.04 * window.innerWidth, cy: testata / 2 };
        const misura = () => {
          testata = row.offsetHeight;
          const r = badge?.getBoundingClientRect();
          partenza =
            r && r.width > 0
              ? { cx: r.left + r.width / 2, cy: r.top + window.scrollY + r.height / 2 }
              : { cx: 0.04 * window.innerWidth, cy: testata / 2 };
        };

        let tema: Tema | null = null;
        let visibile = false;
        const applica = () => {
          if (html.hasAttribute("data-preloader")) return;
          const vw = window.innerWidth;
          const lato = Math.min(56, Math.max(40, 0.0375 * vw));
          const cxFine = 0.04 * vw;
          const y = window.scrollY;
          let cx = cxFine;
          let scala = lato / LATO;
          let opacita = 1;
          if (xl) {
            const p = Math.min(1, Math.max(0, y / testata));
            cx = partenza.cx + (cxFine - partenza.cx) * p;
            scala = (LATO + (lato - LATO) * p) / LATO;
          } else {
            const q = Math.min(1, Math.max(0, (y - 0.5 * testata) / (0.5 * testata)));
            opacita = q;
            scala = (lato / LATO) * (0.8 + 0.2 * q);
          }
          const cy = partenza.cy;
          gsap.set(el, { x: cx - LATO / 2, y: cy - LATO / 2, scale: scala, opacity: opacita, transformOrigin: "50% 50%" });
          if (!visibile) {
            visibile = true;
            if (badge) gsap.set(badge, { opacity: 0 });
            el.hidden = false;
            setAcceso(true);
            onActive(true);
          }
          const prossimo: Tema = opacita > 0 ? temaAt(cx, cy) : (tema ?? "grafite");
          if (prossimo !== tema) {
            tema = prossimo;
            el.setAttribute("data-tema", prossimo);
          }
        };
        // D67: dopo ogni evento il segno si rilegge a ogni tick di GSAP per
        // MARK_TEMA_CODA_S (tempo di GSAP), finché gli scrub numerici dei
        // corridoi hanno finito di muovere le zone foto: un salto manda un solo
        // evento di scroll e la cartolina (scrub 0,9) si ritira dopo. Il
        // listener gira dopo il motore di GSAP e legge le zone già dipinte.
        let fino = 0;
        let inCoda = false;
        const passo = (t: number) => {
          applica();
          if (t >= fino) {
            gsap.ticker.remove(passo);
            inCoda = false;
          }
        };
        const chiedi = () => {
          fino = gsap.ticker.time + MARK_TEMA_CODA_S;
          if (inCoda) return;
          inCoda = true;
          gsap.ticker.add(passo);
        };
        const rimisura = () => {
          misura();
          chiedi();
        };

        // Lo scroll della pagina e dei contenitori orizzontali (Voci), in cattura.
        document.addEventListener("scroll", chiedi, { capture: true, passive: true });
        window.addEventListener("resize", rimisura);
        ScrollTrigger.addEventListener("refresh", rimisura);
        const sipario = new MutationObserver(chiedi);
        sipario.observe(html, { attributeFilter: ["data-preloader"] });
        const zone = new MutationObserver(chiedi);
        zone.observe(document.body, { subtree: true, attributeFilter: ["data-bg"] });
        misura();
        applica();

        return () => {
          gsap.ticker.remove(passo);
          document.removeEventListener("scroll", chiedi, { capture: true });
          window.removeEventListener("resize", rimisura);
          ScrollTrigger.removeEventListener("refresh", rimisura);
          sipario.disconnect();
          zone.disconnect();
          el.hidden = true;
          el.removeAttribute("data-tema");
          gsap.set(el, { clearProps: "transform,opacity" });
          if (badge) gsap.set(badge, { clearProps: "opacity" });
          setAcceso(false);
          onActive(false);
        };
      });
    },
    { dependencies: [pathname], revertOnUpdate: true }
  );

  return (
    <div
      ref={ref}
      data-segno
      aria-hidden
      hidden
      className="dt-segno pointer-events-none fixed left-0 top-0 z-40 flex h-14 w-14 items-center justify-center"
    >
      <RotatingMark className="h-14 w-14" paused={!acceso} />
    </div>
  );
}
