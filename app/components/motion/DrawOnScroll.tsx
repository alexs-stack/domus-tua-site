"use client";

// DrawOnScroll — i tratti SVG del Segno Domus (e della firma) si disegnano
// quando entrano nel viewport: dasharray/dashoffset calcolati a runtime
// (getTotalLength), quindi funziona anche quando la firma verrà sostituita
// con quella reale. Senza JS o con reduced-motion il segno resta statico e
// completo (mai nascosto), come impone docs/segno-domus.md.
import { useRef, type ElementType, type ReactNode } from "react";
import { gsap, useGSAP, MQ } from "../../lib/motion/gsap";

type Props = {
  children: ReactNode;
  className?: string;
  /** ritardo in secondi */
  delay?: number;
  /** durata del tratto in secondi */
  duration?: number;
  /** ritardo tra un tratto e l'altro */
  stagger?: number;
  as?: ElementType;
};

export default function DrawOnScroll({
  children,
  className = "",
  delay = 0,
  duration = 1.1,
  stagger = 0.18,
  as: Tag = "span",
}: Props) {
  const ref = useRef<HTMLElement | null>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const paths = Array.from(el.querySelectorAll<SVGPathElement>("path"));
      if (paths.length === 0) return;

      const mm = gsap.matchMedia();
      mm.add(MQ.motionOk, () => {
        // +2 per nascondere il puntino dei linecap arrotondati a tratto "vuoto".
        paths.forEach((p) => {
          const len = p.getTotalLength() + 2;
          p.style.strokeDasharray = `${len}`;
          p.style.strokeDashoffset = `${len}`;
        });
        gsap.to(paths, {
          strokeDashoffset: 0,
          duration,
          delay,
          stagger,
          ease: "power2.inOut",
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
          onComplete: () => {
            // Ripristina lo stato pristino: nessun residuo inline sul segno.
            paths.forEach((p) => {
              p.style.removeProperty("stroke-dasharray");
              p.style.removeProperty("stroke-dashoffset");
            });
          },
        });

        return () => {
          paths.forEach((p) => {
            p.style.removeProperty("stroke-dasharray");
            p.style.removeProperty("stroke-dashoffset");
          });
        };
      });
    },
    { scope: ref, dependencies: [delay, duration, stagger] }
  );

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
