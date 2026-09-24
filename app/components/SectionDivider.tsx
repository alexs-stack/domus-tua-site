"use client";

import { useRef } from "react";
import { SegnoDomus } from "./BrandMotif";
import { gsap, useGSAP, MQ } from "../lib/motion/gsap";

// Punto filza della cucitura (viewBox 1200×100): una S morbida con una sola
// ansa gentile, condivisa da traccia di fondo e filo rosso sovrapposti.
const STITCH_D = "M -20 38 C 260 78, 480 18, 720 52 S 1050 70, 1220 44";

// Divisore di sezione con il Segno Domus al centro. Firma visiva ricorrente
// che sostituisce i bordi generici tra sezioni. All'ingresso nel viewport le
// hairline si aprono dal centro e il segno si disegna (stroke-draw) — il
// "timbro" ricorrente della pagina. Senza JS o con reduced-motion resta statico.
//
// Variante "stitch": il filo rosso attraversa il blocco a tutta larghezza come
// punto di cucitura sartoriale sopra una traccia tratteggiata che lo aspetta
// (stessa grammatica di Method). Il filo si "cuce" in scrub rivelando in
// clip-path un wrapper dell'SVG rosso — NON stroke-dashoffset, che romperebbe
// il pattern tratteggiato. Al centro il Segno si annoda su un bottone del tone.
export default function SectionDivider({
  className = "",
  tone = "cream",
  variant = "segno",
}: {
  className?: string;
  /** colore di sfondo su cui poggia (fade laterali / bottone del nodo) */
  tone?: "cream" | "paper" | "cream-deep";
  variant?: "segno" | "stitch";
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      if (variant === "stitch") {
        // Lo stato "non cucito" esiste solo qui dentro: senza JS o con
        // reduced-motion la cucitura è completa e statica.
        mm.add(MQ.motionOk, () => {
          const thread = el.querySelector<HTMLElement>("[data-stitch-thread]");
          if (!thread) return;
          gsap.fromTo(
            thread,
            { clipPath: "inset(0 100% 0 0)" },
            {
              clipPath: "inset(0 0% 0 0)",
              ease: "none",
              scrollTrigger: { trigger: el, start: "top 85%", end: "top 40%", scrub: true },
            }
          );
        });
        return;
      }
      mm.add(MQ.motionOk, () => {
        const lines = el.querySelectorAll<HTMLElement>("[data-line]");
        const paths = Array.from(el.querySelectorAll<SVGPathElement>("path"));
        paths.forEach((p) => {
          const len = p.getTotalLength() + 2;
          p.style.strokeDasharray = `${len}`;
          p.style.strokeDashoffset = `${len}`;
        });

        // Replay a ogni passaggio: il dash resta inline (niente pulizia
        // all'onComplete — senza dasharray il ridisegno non esisterebbe);
        // il revert statico vive nel cleanup del matchMedia qui sotto.
        const tl = gsap.timeline({
          scrollTrigger: { trigger: el, start: "top 90%", toggleActions: "restart none none reverse" },
          defaults: { ease: "expo.out" },
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

  if (variant === "stitch") {
    const knotBg =
      tone === "paper" ? "bg-paper" : tone === "cream-deep" ? "bg-cream-deep" : "bg-cream";
    return (
      <div ref={ref} className={`relative h-28 overflow-hidden ${className}`} aria-hidden>
        {/* Traccia di fondo: il percorso che aspetta il filo. */}
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 1200 100"
          preserveAspectRatio="none"
          fill="none"
        >
          <path d={STITCH_D} stroke="var(--color-line)" strokeWidth="1" strokeDasharray="2 6" />
        </svg>
        {/* Filo rosso: SVG gemello in un wrapper rivelato in clip-path (scrub). */}
        <div data-stitch-thread className="absolute inset-0">
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 1200 100"
            preserveAspectRatio="none"
            fill="none"
          >
            <path
              d={STITCH_D}
              stroke="var(--color-red)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="12 8"
            />
          </svg>
        </div>
        {/* Il nodo: il Segno su un bottone del tone, dove la cucitura si annoda.
            top ≈ y del path al centro del viewBox (~42/100). */}
        <span
          className={`absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 rounded-full px-3.5 py-2 ${knotBg}`}
        >
          <SegnoDomus className="h-4 w-11 text-red/70" />
        </span>
      </div>
    );
  }

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
