"use client";

// KineticStrip — eco tipografica di chiusura: la promessa dell'hero torna,
// gigante in Fraunces corsivo quasi-invisibile, e deriva lateralmente legata
// allo scroll. Decorativa (aria-hidden): il claim vero vive nell'hero.
// Senza JS o con reduced-motion resta una filigrana ferma.
import { useRef } from "react";
import { gsap, useGSAP, MQ } from "../../lib/motion/gsap";
import { useDict } from "../i18n/LocaleProvider";

type Props = {
  /** testo da ripetere; default: le due frasi dell'hero */
  text?: string;
  className?: string;
};

export default function KineticStrip({ text, className = "" }: Props) {
  const d = useDict();
  const line = text ?? `${d.hero.title1} ${d.hero.title2}`;
  const ref = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const root = ref.current;
      const track = trackRef.current;
      if (!root || !track) return;
      const mm = gsap.matchMedia();
      mm.add(MQ.motionOk, () => {
        gsap.fromTo(
          track,
          { xPercent: 0 },
          {
            xPercent: -14,
            ease: "none",
            scrollTrigger: {
              trigger: root,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          }
        );
      });
    },
    { scope: ref, dependencies: [line], revertOnUpdate: true }
  );

  return (
    <div ref={ref} aria-hidden className={`overflow-hidden py-4 sm:py-8 ${className}`}>
      <div
        ref={trackRef}
        className="flex w-max items-baseline whitespace-nowrap font-display text-[12vw] font-medium italic leading-none tracking-[-0.02em] text-ink/[0.06] sm:text-[8.5vw]"
      >
        {[0, 1].map((i) => (
          <span key={i} className="pr-[0.8em]">
            {line}
          </span>
        ))}
      </div>
    </div>
  );
}
