"use client";

// ClipMedia — la tendina del capitolo 8, Method (A20 di Alberto, «Fedeltà
// letterale»: un gesto per capitolo; spec 2026-09-13 §2.7 e §3.9). Oggi la usano
// solo le foto degli atti di Method, in home e su /metodo: `<ClipMedia` fuori da
// Method.tsx lo ferma chapters.test.ts.
//
// Come è fatta oggi:
// - valori e innesco da chapters.ts (ease, durata, ritardo, rootMargin, ease
//   d'uscita); forme da clip.ts, solo `inset` a spigolo vivo (C01 della cliente);
// - IntersectionObserver sulla scatola, non ScrollTrigger (D21): ingresso quando
//   la scatola passa il 90 % del viewport; uscita quando risalendo ci torna sotto,
//   e la tendina prosegue nel suo verso (entrate e uscite speculari, A18; replay
//   a ogni passaggio, C22). Da sopra non succede nulla;
// - stato chiuso solo al primo callback e solo se la scatola è sotto il viewport:
//   una foto già in vista non lampeggia;
// - `will-change: clip-path` solo mentre una tween corre;
// - nessuna scala, nessun transform: il clip sta sul modulo media e mai su un
//   antenato di uno sticky;
// - reduced-motion e senza JS: nessuno stile scritto, foto intera.
import { useRef, type CSSProperties, type ReactNode } from "react";
import { gsap, useGSAP, durDt } from "../../lib/motion/gsap";
import { MQ } from "../../lib/motion/mq";
import { chapters } from "../../lib/motion/chapters";
import { clipClosed, clipOpen } from "../../lib/motion/clip";

type ClipMediaProps = {
  chapter: "method";
  from: "left" | "right";
  className?: string;
  /** A61: il rapporto del sorgente, scritto inline sulla scatola (batte il quadrato del modulo). */
  style?: CSSProperties;
  children: ReactNode;
};

export default function ClipMedia({ chapter, from, className = "", style, children }: ClipMediaProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const box = ref.current;
      if (!box) return;
      const { signature, secondary } = chapters[chapter];
      const { time, trigger } = signature;
      if (!("dur" in time) || !("io" in trigger)) {
        throw new Error(`chapters.${chapter}: attesa una firma a tempo con IntersectionObserver`);
      }
      const { dur, delay } = time;
      const { rootMargin, threshold } = trigger.io;
      const exitEase = secondary?.[0]?.ease;
      if (!exitEase) throw new Error(`chapters.${chapter}: manca l'ease d'uscita in secondary[0]`);
      const exitSide = from === "left" ? "right" : "left";

      const mm = gsap.matchMedia();
      mm.add(MQ.motionOk, () => {
        let seen = false;
        let open = true;
        let tweenIn: gsap.core.Tween | null = null;
        let tweenOut: gsap.core.Tween | null = null;
        const promote = () => {
          box.style.willChange = "clip-path";
        };
        const demote = () => {
          box.style.willChange = "";
        };

        const io = new IntersectionObserver(
          ([e]) => {
            if (!e) return;
            if (!seen) {
              seen = true;
              if (e.boundingClientRect.top >= window.innerHeight) {
                gsap.set(box, { clipPath: clipClosed(from) });
                open = false;
              }
              return;
            }
            const line = e.rootBounds?.bottom ?? window.innerHeight * 0.9;
            if (e.isIntersecting && !open) {
              open = true;
              tweenOut?.kill();
              demote();
              tweenIn = gsap.fromTo(
                box,
                { clipPath: clipClosed(from) },
                { clipPath: clipOpen, duration: dur, delay, ease: signature.ease, onStart: promote, onComplete: demote }
              );
            } else if (!e.isIntersecting && open && e.boundingClientRect.top >= line) {
              open = false;
              // Ingresso a metà (o ancora nel ritardo): lo stile inline ha i
              // quattro valori dell'inset e la tendina riparte da lì. Ingresso
              // finito o mai partito (foto già in vista): si parte da clipOpen
              // scritto per intero, non dal valore calcolato che Chromium
              // abbrevia in `inset(0%)` (corsia sistema: sempre quattro valori).
              const partial = tweenIn !== null && tweenIn.progress() < 1;
              tweenIn?.kill();
              const exitVars = {
                clipPath: clipClosed(exitSide),
                duration: durDt.s,
                ease: exitEase,
                onStart: promote,
                onComplete: demote,
              };
              tweenOut = partial
                ? gsap.to(box, exitVars)
                : gsap.fromTo(box, { clipPath: clipOpen }, exitVars);
            }
          },
          { rootMargin, threshold }
        );
        io.observe(box);

        // Tween e set nascono nei callback dell'IO, fuori dal context: si
        // disfano a mano.
        return () => {
          io.disconnect();
          tweenIn?.kill();
          tweenOut?.kill();
          demote();
          box.style.removeProperty("clip-path");
        };
      });
    },
    // revertOnUpdate: al cambio di una prop il matchMedia vecchio, col suo IO,
    // si disfa prima che nasca il nuovo (trappola di useGSAP con dependencies).
    { scope: ref, dependencies: [chapter, from], revertOnUpdate: true }
  );

  return (
    <div ref={ref} data-clip={chapter} data-from={from} className={className} style={style}>
      {children}
    </div>
  );
}
