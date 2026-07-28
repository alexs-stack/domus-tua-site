"use client";

// ScrubWords — il claim si "legge" con lo scroll: ogni parola passa da spenta
// (opacity bassa) ad accesa, in sequenza, legata alla posizione di scroll
// (scrub). Pensato per le bande scure con una sola frase importante.
// a11y: frase intera in uno <span> sr-only (aria-label su role=paragraph è
// "naming prohibited" e non affidabile), parole animate aria-hidden con
// spazi reali nel DOM (innerText/copy/crawler leggono le parole separate).
// Senza JS o con reduced-motion: testo pieno, statico.
import { useRef, type ElementType } from "react";
import { gsap, useGSAP, MQ } from "../../lib/motion/gsap";

type Props = {
  text: string;
  as?: ElementType;
  className?: string;
};

export default function ScrubWords({ text, as: Tag = "p", className = "" }: Props) {
  const ref = useRef<HTMLElement | null>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const words = el.querySelectorAll<HTMLElement>("[data-w]");
      if (words.length === 0) return;

      const mm = gsap.matchMedia();
      mm.add(MQ.motionOk, () => {
        gsap.fromTo(
          words,
          { opacity: 0.16 },
          {
            opacity: 1,
            ease: "none",
            duration: 1,
            stagger: 0.4,
            scrollTrigger: {
              trigger: el,
              start: "top 82%",
              end: "top 38%",
              scrub: true,
            },
          }
        );
      });
    },
    // revertOnUpdate: al cambio di `text` (switch lingua runtime) il context
    // viene revertato PRIMA di ri-eseguire il callback: senza, useGSAP con
    // dependencies non vuote differisce il cleanup all'unmount e ogni switch
    // accumulerebbe un matchMedia + tween + ScrollTrigger duplicati sugli
    // stessi <span data-w> riusati da React.
    { scope: ref, dependencies: [text], revertOnUpdate: true }
  );

  return (
    <Tag ref={ref} className={className}>
      {/* Testo completo per screen reader e estrazione testo (aria-label su <p> non è affidabile) */}
      <span className="sr-only">{text}</span>
      {text.split(" ").map((w, i) => (
        <span key={i} data-w aria-hidden className="inline-block mr-[0.26em]">
          {/* Spazio reale nel DOM: collassa a fine riga (nessun effetto visivo) ma separa le parole in innerText/copy/crawler */}
          {w + " "}
        </span>
      ))}
    </Tag>
  );
}
