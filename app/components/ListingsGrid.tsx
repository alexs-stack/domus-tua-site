"use client";

// ListingsGrid — ingresso batch delle card immobili: un solo ScrollTrigger.batch
// sui figli diretti della griglia invece di un trigger per card. Le card
// contengono link (stretched link + Condividi): si anima opacity, MAI autoAlpha,
// per non toglierle dal tab order mentre sono nascoste.
import { useRef, type ReactNode } from "react";
import { gsap, ScrollTrigger, useGSAP, MQ, dur, stagger, dist } from "../lib/motion/gsap";

type Props = {
  children: ReactNode;
  className?: string;
};

export default function ListingsGrid({ children, className = "" }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const grid = ref.current;
      if (!grid) return;
      const cards = Array.from(grid.children) as HTMLElement[];
      if (cards.length === 0) return;

      const mm = gsap.matchMedia();
      mm.add(MQ.motionOk, () => {
        // Stato nascosto solo post-idratazione: markup SSR completo per SEO/no-JS.
        gsap.set(cards, { y: dist.rise / 1.5, opacity: 0 });

        const triggers = ScrollTrigger.batch(cards, {
          start: "top 85%",
          once: true,
          onEnter: (batch) =>
            gsap.fromTo(
              batch,
              { y: dist.rise / 1.5, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: dur.short,
                ease: "domus",
                stagger: stagger.cards,
                clearProps: "all",
              }
            ),
        });

        // Reti di sicurezza (stesso patto di Reveal): il focus da tastiera o un
        // timeout rendono subito visibile l'intera griglia se il batch non è
        // ancora scattato.
        let done = false;
        const revealAll = () => {
          if (done) return;
          done = true;
          triggers.forEach((t) => t.kill());
          gsap.killTweensOf(cards);
          gsap.set(cards, { clearProps: "all" });
        };
        grid.addEventListener("focusin", revealAll, { once: true });
        const safety = window.setTimeout(revealAll, 2500);

        return () => {
          grid.removeEventListener("focusin", revealAll);
          window.clearTimeout(safety);
        };
      });
    },
    { scope: ref }
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
