"use client";

import { useRef } from "react";
import { SegnoDomus } from "./BrandMotif";
import { gsap, useGSAP, MQ } from "../lib/motion/gsap";

// Divisore di sezione con il Segno Domus al centro. Firma visiva ricorrente
// che sostituisce i bordi generici tra sezioni. All'ingresso nel viewport le
// hairline si aprono dal centro e il segno si disegna (stroke-draw) — il
// "timbro" ricorrente della pagina. Senza JS o con reduced-motion resta statico.
export default function SectionDivider({
  className = "",
  tone = "cream",
}: {
  className?: string;
  /** colore di sfondo su cui poggia (per i fade laterali) */
  tone?: "cream" | "paper" | "cream-deep";
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add(MQ.motionOk, () => {
        const lines = el.querySelectorAll<HTMLElement>("[data-line]");
        const paths = Array.from(el.querySelectorAll<SVGPathElement>("path"));
        paths.forEach((p) => {
          const len = p.getTotalLength() + 2;
          p.style.strokeDasharray = `${len}`;
          p.style.strokeDashoffset = `${len}`;
        });

        const tl = gsap.timeline({
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
          defaults: { ease: "expo.out" },
          onComplete: () => {
            paths.forEach((p) => {
              p.style.removeProperty("stroke-dasharray");
              p.style.removeProperty("stroke-dashoffset");
            });
          },
        });
        tl.fromTo(lines, { scaleX: 0 }, { scaleX: 1, duration: 1.1 }).to(
          paths,
          { strokeDashoffset: 0, duration: 0.9, ease: "power2.inOut", stagger: 0.15 },
          0.15
        );

        return () => {
          paths.forEach((p) => {
            p.style.removeProperty("stroke-dasharray");
            p.style.removeProperty("stroke-dashoffset");
          });
        };
      });
    },
    { scope: ref }
  );

  const fade =
    tone === "paper"
      ? "from-paper"
      : tone === "cream-deep"
        ? "from-cream-deep"
        : "from-cream";

  return (
    <div
      ref={ref}
      className={`mx-auto flex max-w-[1240px] items-center gap-5 px-5 sm:px-8 ${className}`}
      aria-hidden
    >
      <span data-line className={`h-px flex-1 origin-right bg-gradient-to-r ${fade} via-line to-line`} />
      <SegnoDomus className="h-4 w-11 shrink-0" />
      <span data-line className={`h-px flex-1 origin-left bg-gradient-to-l ${fade} via-line to-line`} />
    </div>
  );
}
