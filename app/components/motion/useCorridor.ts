"use client";

/* useCorridor: i corridoi sticky dei capitoli. A19 di Alberto (13 set.,
   «Sticky dove serve»), soglia unica D22: 1024 px di larghezza, 640 di
   altezza, motion ok (MQ.corridor).

   Com'è fatto:
   - il layout sta in globals.css prima del paint, sotto :root[data-hero-intro]
     e la media query del corridoio: sticky, schermo 100svh per lo stick top,
     spaziatore [data-corridor-run];
   - il JS scrive --corridor-stick sul wrapper al montaggio e a ogni
     refreshInit, crea la timeline con lo scrub del registro (chapters.ts),
     mette [data-on] quando la timeline esiste e chiede un refresh a scroll
     fermo (whenStill di gsap.ts, D53);
   - sotto la soglia, con motion ok, gira `phone`: mai sticky, mai scroll-hijack.
   Nastro, stelle e rotaia non passano di qui: hanno le loro meccaniche e lo
   stesso gate.

   REGOLE (spec §2.7 e §8):
   - transform solo sui discendenti dello schermo, mai sul wrapper, sullo
     schermo o sui loro antenati. Unica eccezione dichiarata: il footer della
     cartolina, che non è antenato di nulla di sticky;
   - nessun antenato con overflow hidden, auto o scroll: rompe lo sticky
     (clip va bene);
   - i TESTI dello schermo stanno dentro lo schermo nella lingua più lunga
     (corridors.spec.ts lo misura in it e de); le foto possono uscire;
   - un corridoio per componente client: `build` è una funzione e non passa
     da un server component;
   - mai pin, pinSpacing, anticipatePin (no-pin.test.ts);
   - la rete di tastiera parte solo su :focus-visible (correzione bloccante 3
     di homeC, per tutti i corridoi): un clic del mouse non sposta la pagina;
   - il focusin si ascolta sull'host, non sullo schermo: nella finestra di Open
     Domus (A19, spec §3.10) i focalizzabili stanno nello stage, fratello dello
     schermo. */
import type { RefObject } from "react";
import { gsap, ScrollTrigger, useGSAP, requestRefresh, whenStill } from "../../lib/motion/gsap";
import { MQ } from "../../lib/motion/mq";
import { scrubOf, type CorridorId } from "../../lib/motion/chapters";
import {
  cuesValid,
  DEFAULT_END,
  defaultStart,
  endNetDue,
  nearestVisibleProgress,
  stepCues,
  stickTopFor,
} from "../../lib/motion/corridor-math";
import { getLenis } from "./SmoothScroll";

export type Cue = { at: number; forward: () => void; backward?: () => void };

export type CorridorOptions = {
  /** Chiave in chapters.ts: da lì arriva lo scrub (A20). */
  id: CorridorId;
  /** bottom: schermo più alto del viewport, aggancio a min(0, innerHeight − H). */
  stick?: "top" | "bottom";
  /** Default "top top" (stick top) o `top ${stickTop}px` (stick bottom). */
  start?: string | (() => string);
  /** Default "bottom bottom". */
  end?: string | (() => string);
  /** Cartolina: il footer. */
  endTrigger?: RefObject<Element | null>;
  /** Riempie la timeline su una durata 1. */
  build: (tl: gsap.core.Timeline, q: (sel: string) => HTMLElement[]) => void;
  cues?: Cue[];
  /** Scroll che rende visibile `el`; null = nessuno scroll. Default: bisezione sul progresso. */
  focus?: (el: Element, st: ScrollTrigger) => number | null;
  /** Sotto MQ.corridor con motion ok, mai sticky; può restituire un cleanup. */
  phone?: (q: (sel: string) => HTMLElement[]) => void | (() => void);
  /** Per esempio [locale]. */
  deps?: unknown[];
};

export function useCorridor(ref: RefObject<HTMLElement | null>, o: CorridorOptions): void {
  useGSAP(
    () => {
      const root = ref.current;
      const screen = root?.querySelector<HTMLElement>("[data-corridor-screen]");
      if (!root || !screen) return;
      const stick = o.stick ?? "top";
      const cues = o.cues ?? [];
      if (process.env.NODE_ENV !== "production") {
        if (root.dataset.corridor !== o.id) console.warn(`useCorridor: manca data-corridor="${o.id}" sul wrapper`);
        if ((root.dataset.stick ?? "top") !== stick) console.warn(`useCorridor: data-stick diverso da "${stick}"`);
        if (!cuesValid(cues)) console.warn("useCorridor: cue fuori da (0, 1] o non in ordine");
      }
      const select = gsap.utils.selector(root);
      const q = (sel: string) => select(sel) as HTMLElement[];

      const mm = gsap.matchMedia();
      mm.add({ corridor: MQ.corridor, motionOk: MQ.motionOk }, (ctx) => {
        const c = ctx.conditions as { corridor: boolean; motionOk: boolean };
        if (!c.motionOk) return;
        if (!c.corridor) {
          const undo = o.phone?.(q);
          return typeof undo === "function" ? undo : undefined;
        }

        let stickTop = 0;
        const measure = () => {
          stickTop = stickTopFor(stick, window.innerHeight, screen.offsetHeight);
          root.style.setProperty("--corridor-stick", `${stickTop}px`);
        };
        measure();
        ScrollTrigger.addEventListener("refreshInit", measure);

        const resolve = (v: string | (() => string) | undefined, fallback: () => string) => () =>
          typeof v === "function" ? v() : (v ?? fallback());

        const fired = cues.map(() => false);
        const runCues = (p: number) => {
          for (const s of stepCues(cues, fired, p)) {
            const cue = cues[s.index];
            if (s.dir === "forward") cue.forward();
            else cue.backward?.();
          }
        };

        const tl = gsap.timeline({
          defaults: { ease: "none", immediateRender: false },
          scrollTrigger: {
            trigger: root,
            start: resolve(o.start, () => defaultStart(stick, stickTop)),
            end: resolve(o.end, () => DEFAULT_END),
            endTrigger: o.endTrigger?.current ?? undefined,
            scrub: scrubOf(o.id),
            invalidateOnRefresh: true,
            onUpdate: (self) => runCues(self.progress),
          },
        });
        o.build(tl, q);

        // Dopo ogni refresh: i cue mancanti e la rete di fine documento (spec
        // §2.7, verdetto sistema bloccante 2, D22). Con endTrigger conta st.end.
        const afterRefresh = () => {
          const st = tl.scrollTrigger;
          if (!st) return;
          runCues(st.progress);
          const due = endNetDue({
            scrollY: window.scrollY,
            innerHeight: window.innerHeight,
            scrollHeight: document.documentElement.scrollHeight,
            wrapperBottom: root.getBoundingClientRect().bottom,
            progress: tl.progress(),
            hasEndTrigger: Boolean(o.endTrigger),
            stEnd: st.end,
          });
          if (!due) return;
          tl.progress(1);
          runCues(1);
        };
        ScrollTrigger.addEventListener("refresh", afterRefresh);

        // Il fuoco di default (A19, spec §2.7: a 1280×720 st.start non basta):
        // il progresso più vicino in cui il rettangolo dell'elemento, a schermo
        // agganciato, sta dentro [0, innerHeight].
        const defaultFocus = (el: Element, st: ScrollTrigger): number | null => {
          const now = el.getBoundingClientRect();
          if (now.top >= 0 && now.bottom <= window.innerHeight) return null;
          const saved = tl.progress();
          const visibleAt = (p: number) => {
            tl.progress(p);
            const er = el.getBoundingClientRect();
            const top = stickTop + (er.top - screen.getBoundingClientRect().top);
            return top >= 0 && top + er.height <= window.innerHeight;
          };
          const p = nearestVisibleProgress(st.progress, visibleAt);
          tl.progress(saved);
          return p === null ? null : st.start + p * (st.end - st.start);
        };

        const onFocus = (e: FocusEvent) => {
          const el = e.target;
          const st = tl.scrollTrigger;
          if (!(el instanceof Element) || !st || !el.matches(":focus-visible")) return;
          const y = (o.focus ?? defaultFocus)(el, st);
          if (y === null) return;
          const lenis = getLenis();
          if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
          else window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior });
          ScrollTrigger.update();
          st.getTween()?.progress(1);
        };
        root.addEventListener("focusin", onFocus);

        root.setAttribute("data-on", "");
        // Il refresh dopo data-on, a scroll fermo (D53, whenStill di gsap.ts): il
        // corridoio dell'hero è il primo ScrollTrigger della home e monta con
        // l'arrivo nativo al frammento ancora in volo; il refresh forzato lo
        // cancellerebbe. L'attesa si annulla nel cleanup.
        const stopRefresh = whenStill(() => requestRefresh());

        return () => {
          stopRefresh();
          root.removeEventListener("focusin", onFocus);
          ScrollTrigger.removeEventListener("refreshInit", measure);
          ScrollTrigger.removeEventListener("refresh", afterRefresh);
          root.removeAttribute("data-on");
          root.style.removeProperty("--corridor-stick");
        };
      });
    },
    { scope: ref, dependencies: o.deps ?? [], revertOnUpdate: true },
  );
}
