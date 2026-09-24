"use client";

// ListingsGrid — ingresso batch delle card immobili: un solo ScrollTrigger.batch
// sui figli diretti della griglia invece di un trigger per card. Le card
// contengono link (stretched link + Condividi): si anima opacity, MAI autoAlpha,
// per non toglierle dal tab order mentre sono nascoste.
import { useRef, type ReactNode } from "react";
import { gsap, ScrollTrigger, useGSAP, MQ, dur, stagger } from "../lib/motion/gsap";

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
        gsap.set(cards, { opacity: 0 });

        // Replay a ogni passaggio (richiesta cliente) ma SOLO opacity: le card
        // sono link cliccabili e un transform che le sposta mentre l'utente
        // clicca fa mancare il bersaglio (stessa regressione vista in
        // PropertySearch). overwrite: gli scroll rapidi non accavallano i tween.
        let entered = false;
        const triggers = ScrollTrigger.batch(cards, {
          start: "top 85%",
          onEnter: (batch) => {
            entered = true;
            gsap.to(batch, {
              opacity: 1,
              duration: dur.short,
              ease: "domus",
              stagger: stagger.cards,
              overwrite: true,
            });
          },
          onLeaveBack: (batch) =>
            gsap.to(batch, {
              opacity: 0,
              duration: dur.short,
              ease: "domus",
              overwrite: true,
            }),
        });

        // Reti di sicurezza (stesso patto di Reveal): il focus da tastiera
        // rende subito visibile l'intera griglia; il timeout interviene solo
        // se il batch non è mai scattato (con il replay le card possono
        // tornare nascoste di proposito).
        let done = false;
        const revealAll = () => {
          if (done) return;
          done = true;
          triggers.forEach((t) => t.kill());
          gsap.killTweensOf(cards);
          gsap.set(cards, { clearProps: "all" });
        };
        grid.addEventListener("focusin", revealAll, { once: true });
        const safety = window.setTimeout(() => {
          if (!entered) revealAll();
        }, 2500);

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
