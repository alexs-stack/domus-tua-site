"use client";

// Hairline: il gesto del capitolo 10, Domus D.O.C. (spec 2026-09-13 §3.11).
// A20 di Alberto: un gesto per capitolo, con firma e tratti interni in
// chapters.ts. D26: righe e spina sono struttura del foglio e restano disegnate
// a pagina ferma.
// Com'è fatto oggi: `Hairline` è uno span di 1 px color `--color-line`;
// `useHairlineSheet` osserva la `ul` del foglio con un IntersectionObserver
// (rootMargin della firma). Quando la lista passa la linea le righe si tirano da
// sinistra una dopo l'altra e la spina scende dall'alto; quando la lista torna
// sotto la linea righe e spina proseguono ed escono (C22 della cliente: rigioca
// nei due versi). Uscendo dall'alto non succede nulla. Lo stato chiuso nasce
// solo via JS e solo se al montaggio la lista è sotto lo schermo; rete a
// 2.500 ms dal montaggio come il motore dei testi (spec §2.4), che tira righe
// chiuse in vista solo se l'IntersectionObserver non ha ancora deciso. Ease e
// durate dei tratti interni vengono dalle note di chapters.ts. Righe e spina si
// cercano nel foglio a ogni tween, e il foglio si riarma a ogni cambio di `deps`:
// DomusDocProtocol passa [locale], perché i `li` hanno per chiave il titolo e
// cambiano nodo con la lingua (spec §2.3). Con reduced-motion e senza JS nessun
// clip. Le forme arrivano da clip.ts (C01 della cliente: solo spigoli vivi).
import type { RefObject } from "react";
import { gsap, useGSAP } from "../../lib/motion/gsap";
import { MQ } from "../../lib/motion/mq";
import { chapters } from "../../lib/motion/chapters";
import { clipClosed, clipOpen } from "../../lib/motion/clip";

export type HairlineProps = { chapter: "doc"; axis?: "x" | "y"; className?: string };

// Stagger d'uscita del capitolo 10 (A20 di Alberto, spec §3.11: «0,5 s, circ.in,
// stagger 0,05 dall'ultima»). È l'unico numero del gesto che chapters.ts non
// porta: ease e durate dei tratti interni le legge `tratto()` dalle note di
// chapters.doc.secondary («spina 1,12 s», «uscita 0,5 s»), dove chapters.test.ts
// misura le distanze fra le curve (D18).
const OUT_STAGGER = 0.05;

// Riga in cima al pilastro e spina al centro del foglio (lane-homeB §10, D26). La
// spina si centra con `left` e non con una utility translate: GSAP scrive sul nodo.
const LINEA = {
  x: "inset-x-0 top-0 h-px",
  y: "inset-y-0 left-[calc(50%-0.5px)] w-px",
} as const;

export default function Hairline({ chapter, axis = "x", className = "" }: HairlineProps) {
  return (
    <span
      aria-hidden
      data-hairline={chapter}
      data-axis={axis}
      className={`pointer-events-none absolute bg-line ${LINEA[axis]} ${className}`}
    />
  );
}

function firma(chapter: HairlineProps["chapter"]) {
  const s = chapters[chapter].signature;
  if (!("dur" in s.time) || !("io" in s.trigger)) {
    throw new Error(`chapters.${chapter}: Hairline vuole una firma a tempo con innesco IntersectionObserver`);
  }
  return {
    ease: s.ease,
    dur: s.time.dur,
    delay: s.time.delay,
    stagger: s.time.stagger ?? 0,
    rootMargin: s.trigger.io.rootMargin,
    threshold: s.trigger.io.threshold,
  };
}

/** Ease e durata di un tratto interno, lette dalla nota (`"spina 1,12 s"` → `{ ease, dur: 1.12 }`). */
function tratto(chapter: HairlineProps["chapter"], nota: "spina" | "uscita"): { ease: string; dur: number } {
  const t = chapters[chapter].secondary?.find((s) => s.note.startsWith(nota));
  if (!t) throw new Error(`chapters.${chapter}: manca il tratto interno «${nota}»`);
  const m = /(\d+),(\d+) s/.exec(t.note);
  if (!m) throw new Error(`chapters.${chapter}: il tratto «${nota}» non dice la durata in secondi («${t.note}»)`);
  return { ease: t.ease, dur: Number(`${m[1]}.${m[2]}`) };
}

export function useHairlineSheet(
  sheet: RefObject<HTMLElement | null>,
  chapter: HairlineProps["chapter"],
  deps: unknown[] = [],
): void {
  useGSAP(
    () => {
      const root = sheet.current;
      const list = root?.querySelector("ul");
      if (!root || !list) return;
      const rules = () => gsap.utils.toArray<HTMLElement>(root.querySelectorAll(`[data-hairline="${chapter}"][data-axis="x"]`));
      const spines = () => gsap.utils.toArray<HTMLElement>(root.querySelectorAll(`[data-hairline="${chapter}"][data-axis="y"]`));
      const f = firma(chapter);
      const spina = tratto(chapter, "spina");
      const uscita = tratto(chapter, "uscita");
      const mm = gsap.matchMedia();
      mm.add(MQ.motionOk, (ctx) => {
        let aperto = true;
        if (list.getBoundingClientRect().top > window.innerHeight) {
          gsap.set(rules(), { clipPath: clipClosed("left") });
          gsap.set(spines(), { clipPath: clipClosed("top") });
          aperto = false;
        }
        // I tween nati dopo il setup (IO, rete) passano da `ctx.add`: un cambio di
        // preferenza a pagina aperta li revoca con gli altri e la pagina resta
        // completa e ferma (spec §8, reduced-motion).
        ctx.add("tira", () => {
          gsap.fromTo(
            rules(),
            { clipPath: clipClosed("left") },
            { clipPath: clipOpen, duration: f.dur, delay: f.delay, stagger: f.stagger, ease: f.ease, overwrite: true },
          );
          gsap.fromTo(
            spines(),
            { clipPath: clipClosed("top") },
            { clipPath: clipOpen, duration: spina.dur, delay: f.delay, ease: spina.ease, overwrite: true },
          );
        });
        ctx.add("ritira", () => {
          gsap.to(rules(), {
            clipPath: clipClosed("right"),
            duration: uscita.dur,
            ease: uscita.ease,
            stagger: { each: OUT_STAGGER, from: "end" },
            overwrite: true,
          });
          gsap.to(spines(), { clipPath: clipClosed("bottom"), duration: uscita.dur, ease: uscita.ease, overwrite: true });
        });
        let primo = true;
        // D26: la rete dei 2.500 ms (spec §2.4) salva solo una lista che l'osservatore
        // non ha mai deciso. Dopo un ingresso o un'uscita dell'IO la rete si toglie:
        // righe uscite sotto la linea con la lista in vista restano uscite (C22).
        let deciso = false;
        let rete = 0;
        const io = new IntersectionObserver(
          ([e]) => {
            const sotto = e.boundingClientRect.top >= (e.rootBounds?.bottom ?? window.innerHeight);
            if (e.isIntersecting && !aperto) {
              aperto = true;
              deciso = true;
              window.clearTimeout(rete);
              ctx.tira();
            } else if (!primo && !e.isIntersecting && sotto && aperto) {
              // Il primo avviso descrive la posizione di montaggio: una lista
              // disegnata fra la linea e il fondo non esce (D26). L'ingresso vale
              // anche al primo avviso: scroll ripristinato al capitolo dopo il
              // montaggio (D22, spec §2.7) o tasto End durante l'idratazione.
              aperto = false;
              deciso = true;
              window.clearTimeout(rete);
              ctx.ritira();
            }
            primo = false;
          },
          { rootMargin: f.rootMargin, threshold: f.threshold },
        );
        io.observe(list);
        rete = window.setTimeout(() => {
          const r = list.getBoundingClientRect();
          if (!deciso && !aperto && r.top < window.innerHeight && r.bottom > 0) {
            aperto = true;
            ctx.tira();
          }
        }, 2_500);
        return () => {
          io.disconnect();
          window.clearTimeout(rete);
        };
      });
    },
    { scope: sheet, dependencies: [chapter, ...deps], revertOnUpdate: true },
  );
}
