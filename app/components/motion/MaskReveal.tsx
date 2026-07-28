"use client";

// MaskReveal — ingresso "a sipario" per immagini/cornici: la maschera si apre
// (clip-path) mentre il contenuto interno de-zooma. Alternativa di pregio al
// fade-up per i media. Lo stato nascosto è impostato SOLO via JS (gsap.set):
// senza JS o con reduced-motion il contenuto è sempre visibile.
import { useRef, type ElementType, type ReactNode } from "react";
import { gsap, useGSAP, MQ } from "../../lib/motion/gsap";

type Props = {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  /** direzione da cui si apre il sipario */
  from?: "bottom" | "top" | "left" | "right";
  /** ritardo in secondi */
  delay?: number;
  /** durata in secondi */
  duration?: number;
  /** zoom iniziale del contenuto (1 = nessuno) */
  zoom?: number;
  as?: ElementType;
};

const CLIP: Record<NonNullable<Props["from"]>, string> = {
  bottom: "inset(100% 0% 0% 0%)",
  top: "inset(0% 0% 100% 0%)",
  left: "inset(0% 100% 0% 0%)",
  right: "inset(0% 0% 0% 100%)",
};

export default function MaskReveal({
  children,
  className = "",
  innerClassName = "",
  from = "bottom",
  delay = 0,
  duration = 1.15,
  zoom = 1.12,
  as: Tag = "div",
}: Props) {
  const outerRef = useRef<HTMLElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const outer = outerRef.current;
      const inner = innerRef.current;
      if (!outer || !inner) return;

      const mm = gsap.matchMedia();
      mm.add(MQ.motionOk, () => {
        const tl = gsap.timeline({
          scrollTrigger: { trigger: outer, start: "top 82%", once: true },
          defaults: { duration, ease: "expo.out" },
          delay,
        });
        tl.fromTo(outer, { clipPath: CLIP[from] }, { clipPath: "inset(0% 0% 0% 0%)" }).fromTo(
          inner,
          { scale: zoom },
          { scale: 1, clearProps: "all" },
          "<"
        );
      });
    },
    { scope: outerRef, dependencies: [from, delay, duration, zoom] }
  );

  return (
    <Tag ref={outerRef} className={className}>
      <div ref={innerRef} className={innerClassName}>
        {children}
      </div>
    </Tag>
  );
}
