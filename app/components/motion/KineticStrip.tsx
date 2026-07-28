"use client";

// KineticStrip — eco tipografica di chiusura: le due frasi dell'hero tornano,
// gigantesche e quasi-invisibili, su due righe centrate che contro-derivano
// con lo scroll. La deriva è SIMMETRICA (±drift attorno al centro): quando la
// strip è a metà viewport le righe sono perfettamente allineate e leggibili,
// mai tagliate a metà parola. Decorativa (aria-hidden): il claim vero vive
// nell'hero. Senza JS o con reduced-motion resta una filigrana ferma centrata.
import { useRef } from "react";
import { gsap, useGSAP, MQ } from "../../lib/motion/gsap";
import { useDict } from "../i18n/LocaleProvider";

type Props = {
  className?: string;
};

export default function KineticStrip({ className = "" }: Props) {
  const d = useDict();
  const lines = [d.hero.title1, d.hero.title2];
  const ref = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      const mm = gsap.matchMedia();
      mm.add(MQ.motionOk, () => {
        gsap.utils.toArray<HTMLElement>("[data-kinetic-line]", root).forEach((el, i) => {
          const dir = i % 2 === 0 ? 1 : -1;
          // ±4%: abbastanza per sentire il movimento, mai abbastanza da uscire.
          gsap.fromTo(
            el,
            { xPercent: 4 * dir },
            {
              xPercent: -4 * dir,
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
      });
    },
    { scope: ref, dependencies: [lines[0]], revertOnUpdate: true }
  );

  return (
    <div ref={ref} aria-hidden className={`overflow-hidden py-6 sm:py-10 ${className}`}>
      {lines.map((line, i) => (
        <div key={i} className="flex justify-center">
          <span
            data-kinetic-line
            className="whitespace-nowrap font-display text-[6.4vw] font-medium italic leading-[1.12] tracking-[-0.02em] text-ink/[0.07]"
          >
            {line}
          </span>
        </div>
      ))}
    </div>
  );
}
