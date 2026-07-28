"use client";

// Magnetic — attrazione fisica sottile per le CTA principali (solo pointer fine
// + no reduced-motion). L'elemento segue il cursore di una frazione e torna a
// riposo con una molla morbida. Wrappa il contenuto senza cambiarne il layout.
import { useRef, type ReactNode } from "react";
import { gsap, useGSAP, MQ } from "../../lib/motion/gsap";

type Props = {
  children: ReactNode;
  className?: string;
  /** 0…1 — quanto l'elemento segue il cursore */
  strength?: number;
};

export default function Magnetic({ children, className = "", strength = 0.22 }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const mm = gsap.matchMedia();
      mm.add(`${MQ.motionOk} and ${MQ.finePointer}`, () => {
        // will-change solo quando l'effetto è davvero attivo (touch/reduced-motion
        // non promuovono un layer inutile sul CTA dell'hero).
        gsap.set(el, { willChange: "transform" });
        const xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" });
        const yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });
        // Tween di ritorno elastico: va ucciso al rientro del puntatore, altrimenti
        // (creato DOPO i quickTo, senza overwrite) vince il render su x/y e il
        // tracking magnetico resta morto/jittera finché l'elastico non finisce.
        let leaveTween: gsap.core.Tween | null = null;

        const onMove = (e: PointerEvent) => {
          if (leaveTween) {
            leaveTween.kill();
            leaveTween = null;
          }
          const r = el.getBoundingClientRect();
          xTo((e.clientX - (r.left + r.width / 2)) * strength);
          yTo((e.clientY - (r.top + r.height / 2)) * strength);
        };
        const onLeave = () => {
          leaveTween = gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.45)" });
        };

        el.addEventListener("pointermove", onMove);
        el.addEventListener("pointerleave", onLeave);
        return () => {
          el.removeEventListener("pointermove", onMove);
          el.removeEventListener("pointerleave", onLeave);
          gsap.set(el, { clearProps: "willChange" });
        };
      });
    },
    { scope: ref, dependencies: [strength] }
  );

  return (
    // data-magnetic: hook passivo per il cursor custom (l'anello si fonde
    // col bottone quando il magnetismo prende il controllo).
    <div ref={ref} data-magnetic className={`inline-flex ${className}`}>
      {children}
    </div>
  );
}
