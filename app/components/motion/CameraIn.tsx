"use client";

// CameraIn — "dolly" cinematografico d'ingresso: il contenuto della sezione
// entra in scena con una micro-zoomata (scale 0.96→1 + risalita) legata allo
// scroll. Sempre visibile (niente opacity: dentro ci sono link e testo SEO),
// solo desktop + motion ok — su mobile la scena resta ferma.
// VINCOLO: wrappare solo contenuto SENZA sticky/fixed all'interno
// (il transform del wrapper diventerebbe il loro containing block).
import { useRef, type ElementType, type ReactNode } from "react";
import { gsap, useGSAP, MQ } from "../../lib/motion/gsap";

type Props = {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  /** Intensità della zoomata (scala iniziale). */
  from?: number;
};

export default function CameraIn({ children, className = "", as: Tag = "div", from = 0.96 }: Props) {
  const ref = useRef<HTMLElement | null>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add(`${MQ.motionOk} and ${MQ.desktop}`, () => {
        gsap.fromTo(
          el,
          { scale: from, y: 30, transformOrigin: "50% 62%" },
          {
            scale: 1,
            y: 0,
            ease: "none",
            scrollTrigger: { trigger: el, start: "top 94%", end: "top 42%", scrub: true },
          }
        );
      });
    },
    { scope: ref }
  );

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Tag ref={ref as any} className={className}>
      {children}
    </Tag>
  );
}
