"use client";

/* ═══════════════════════════════════════════════════════════════════════════
   TONESHIFT — la cucitura fra due colori di fondo (2026-08-06).

   PROBLEMA: la home cambia tono cinque volte (cream-deep → paper →
   cream-deep → cream → paper → cream). Ogni cambio disegnava una linea
   orizzontale netta: il taglio che rompe lo scroll immersivo.

   SOLUZIONE: al confine non c'è più un bordo ma un PASSAGGIO. Il colore in
   arrivo sale dal basso dentro la sagoma dell'ARCO — lo stesso arco del
   preloader e del sipario di PageTransition (rif. era-residence): mentre
   sale si allarga, finché le sue gambe superano il viewport e il tono nuovo
   è ovunque. L'occhio legge una porta che si apre, non una giuntura.

   Il sipario fra ROUTE resta com'è: questo vive solo dentro la pagina.

   Progressive enhancement: senza JS o con reduced-motion il blocco è una
   sfumatura verticale piena fra i due toni — una transizione statica onesta,
   mai un taglio. [data-on] arriva solo da JS con motion ok.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP, MQ } from "../../lib/motion/gsap";

export type Tone = "cream" | "cream-deep" | "paper" | "espresso" | "wine" | "graphite";

/* L'arco fa DUE movimenti, non uno solo.
   Salire e allargarsi insieme, in una rampa lineare unica, produce a metà
   corsa una banda larga il 94% del viewport: la porta non si legge mai e
   resta solo un colore che sale piatto. Quindi:
     atto 1 (0 → 0.62)  la porta SALE a larghezza costante — si vede l'arco;
     atto 2 (0.62 → 1)  la porta SI APRE fino a superare il viewport.
   Le gambe dell'arco sono larghe quanto l'arco: senza l'atto 2 il tono nuovo
   coprirebbe solo una striscia centrale. */
const ARCH_START = { "--arch-w": "36vw", "--arch-y": "36svh" };
const ARCH_RISEN = { "--arch-y": "-4svh" };
const ARCH_OPEN = { "--arch-w": "205vw", "--arch-y": "-34svh" };

export default function ToneShift({
  from,
  to,
  className = "",
}: {
  /** tono della sezione che finisce */
  from: Tone;
  /** tono della sezione che comincia */
  to: Tone;
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      const inner = root?.querySelector<HTMLElement>("[data-ts-in]");
      if (!root || !inner) return;

      const mm = gsap.matchMedia();
      mm.add(MQ.motionOk, () => {
        // Senza mask non si può ritagliare un arco: si ripiega su una tenda
        // verticale, la stessa grammatica del fallback di PageTransition.
        const canMask = typeof CSS !== "undefined" && CSS.supports("mask-position", "center 0px");
        root.setAttribute("data-on", canMask ? "arch" : "wipe");

        const st = {
          trigger: root,
          // Comincia appena il blocco entra e finisce quando è ancora a metà
          // schermo: la porta è già aperta prima che l'occhio arrivi al fondo.
          start: "top 96%",
          end: "bottom 45%",
          scrub: 0.4,
          invalidateOnRefresh: true,
        } as const;

        const tween = gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: st });
        if (canMask) {
          tween
            .set(inner, { ...ARCH_START })
            .to(inner, { ...ARCH_RISEN, duration: 0.62 }, 0)
            .to(inner, { ...ARCH_OPEN, duration: 0.38 }, 0.62);
        } else {
          tween.fromTo(inner, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1 }, 0);
        }

        // Il will-change vive solo mentre il passaggio è in scena: mask-position
        // e mask-size ridipingono, e tenere promosso un blocco a tutta larghezza
        // per l'intera pagina è memoria video buttata.
        const live = ScrollTrigger.create({
          trigger: root,
          start: "top bottom",
          end: "bottom top",
          onToggle: (self) =>
            self.isActive ? root.setAttribute("data-live", "") : root.removeAttribute("data-live"),
        });

        return () => {
          root.removeAttribute("data-on");
          root.removeAttribute("data-live");
          tween.scrollTrigger?.kill();
          tween.kill();
          live.kill();
        };
      });
    },
    { scope: rootRef }
  );

  return (
    <div
      ref={rootRef}
      aria-hidden
      className={`dt-toneshift ${className}`}
      style={
        {
          "--ts-from": `var(--color-${from})`,
          "--ts-to": `var(--color-${to})`,
          // Coda della messa a terra da continuare: solo .bg-cream e
          // .bg-cream-deep la portano (vedi globals.css). .bg-paper chiude
          // pulito, e ricopiarla lì disegnerebbe un'ombra che non esiste.
          "--ts-shade": from === "cream" || from === "cream-deep" ? 0.075 : 0,
          // Luce d'apertura della sezione che arriva: .bg-paper la porta già
          // quasi bianca e il pannello la eguaglia da solo, i toni cream no.
          "--ts-bloom": to === "cream" || to === "cream-deep" ? 0.5 : 0,
        } as React.CSSProperties
      }
    >
      <div data-ts-in className="dt-toneshift_in" />
    </div>
  );
}
