"use client";

// Parallax — profondità allo scroll (scrub), GPU-safe (solo transform).
// L'elemento esterno mantiene il layout; il movimento è sul wrapper interno.
// speed > 0 = si muove più lento del flusso (sfondo, lontano);
// speed < 0 = più veloce (primo piano). Range consigliato: -0.5 … 0.5.
// Con `scale` l'interno è sovradimensionato per non scoprire i bordi
// dentro cornici overflow-hidden (immagini).
import { useRef, type CSSProperties, type ElementType, type ReactNode } from "react";
import { gsap, useGSAP, MQ } from "../../lib/motion/gsap";

type Props = {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  innerStyle?: CSSProperties;
  /** -0.5 … 0.5 — intensità e direzione del movimento */
  speed?: number;
  /** ampiezza in px (± range): per elementi piccoli, dove yPercent è impercettibile.
      Il segno di `speed` continua a dare la direzione. */
  range?: number;
  /** sovradimensiona l'interno (es. 1.15 per immagini in cornice) */
  scale?: number;
  /** attivo anche sotto i 768px (default: solo desktop) */
  mobile?: boolean;
  as?: ElementType;
};

export default function Parallax({
  children,
  className = "",
  innerClassName = "",
  innerStyle,
  speed = 0.25,
  range,
  scale,
  mobile = false,
  as: Tag = "div",
}: Props) {
  const outerRef = useRef<HTMLElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const outer = outerRef.current;
      const inner = innerRef.current;
      if (!outer || !inner) return;

      const media = mobile ? MQ.motionOk : `${MQ.motionOk} and ${MQ.desktop}`;
      const mm = gsap.matchMedia();
      mm.add(media, () => {
        // will-change solo mentre l'animazione è attiva (revert lo pulisce):
        // niente layer promossi per utenti reduced-motion / senza scrub.
        gsap.set(inner, { willChange: "transform" });
        // Ampiezza: yPercent per media grandi, px (range) per elementi piccoli.
        const dir = Math.sign(speed) || 1;
        const move = range != null ? { unit: "y" as const, amp: range * dir } : { unit: "yPercent" as const, amp: speed * 14 };
        gsap.fromTo(
          inner,
          { [move.unit]: move.amp, scale: scale ?? 1 },
          {
            [move.unit]: -move.amp,
            scale: scale ?? 1,
            ease: "none",
            scrollTrigger: {
              trigger: outer,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          }
        );
      });
    },
    { scope: outerRef, dependencies: [speed, range, scale, mobile] }
  );

  return (
    <Tag ref={outerRef} className={className}>
      {/* Lo scale di overscan è pre-applicato in SSR: all'idratazione GSAP riscrive
          lo stesso valore → nessun "pop" di zoom visibile sull'immagine (LCP). */}
      <div
        ref={innerRef}
        className={innerClassName}
        style={{
          ...(scale != null ? { transform: `scale(${scale})` } : null),
          ...innerStyle,
        }}
      >
        {children}
      </div>
    </Tag>
  );
}
