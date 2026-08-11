"use client";

// LiquidReveal — reveal "liquido" (tecnica Codrops OnScrollFilter) adattato
// alle regole del sito: l'immagine resta un next/image normale (SEO, LCP e
// ottimizzazione intatti); sopra c'è un velo SVG del colore della sezione con
// un foro circolare il cui bordo è deformato da feTurbulence+feDisplacementMap.
// Il filtro è STATICO: anima solo il raggio del foro, in scrub — il bordo
// organico "cola" sull'immagine mentre si apre.
// - Senza JS / reduced-motion: velo invisibile, immagine sempre visibile.
// - Il repaint del filtro a ogni tick costa: SOLO desktop; su mobile degrada
//   a un sipario clip-path. Max 1–2 istanze per pagina.
import { useId, useRef, type ReactNode } from "react";
import { gsap, useGSAP, MQ } from "../../lib/motion/gsap";

const TONES = {
  paper: "var(--color-paper)",
  cream: "var(--color-cream)",
  "cream-deep": "var(--color-cream-deep)",
} as const;

type Props = {
  children: ReactNode;
  /** Colore del velo: deve combaciare con lo sfondo della sezione. */
  tone?: keyof typeof TONES;
  className?: string;
};

// viewBox "largo": baseFrequency e scale del filtro sono in user space — con
// 1000 unità i valori restano identici a prescindere dalla misura reale.
const VB_W = 1000;
const VB_H = 1250;
const R_FINAL = Math.round(Math.hypot(VB_W / 2, VB_H / 2)) + 80;

export default function LiquidReveal({ children, tone = "paper", className = "" }: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const veilRef = useRef<SVGSVGElement | null>(null);
  const circleRef = useRef<SVGCircleElement | null>(null);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");

  useGSAP(
    () => {
      const root = rootRef.current;
      const veil = veilRef.current;
      const circle = circleRef.current;
      if (!root || !veil || !circle) return;
      const mm = gsap.matchMedia();

      // Desktop: foro liquido che si apre in scrub mentre la sezione entra.
      mm.add(`${MQ.motionOk} and ${MQ.lg}`, () => {
        gsap.set(veil, { autoAlpha: 1 });
        gsap.set(circle, { attr: { r: 0 } });
        const tween = gsap.to(circle, {
          attr: { r: R_FINAL },
          ease: "none",
          scrollTrigger: { trigger: root, start: "top 85%", end: "top 25%", scrub: true },
        });
        return () => {
          tween.scrollTrigger?.kill();
          tween.kill();
          gsap.set(veil, { autoAlpha: 0 });
        };
      });

      // Mobile/tablet: sipario clip-path (il filtro ripitturato a ogni tick
      // sarebbe troppo per CPU/GPU mobile).
      mm.add(`${MQ.motionOk} and ${MQ.belowLg}`, () => {
        const inner = root.querySelector<HTMLElement>("[data-liquid-content]");
        if (!inner) return;
        // Replay a ogni passaggio: niente clearProps (romperebbe restart/reverse).
        gsap.fromTo(
          inner,
          { clipPath: "inset(100% 0% 0% 0%)" },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            duration: 1.15,
            ease: "expo.out",
            scrollTrigger: { trigger: root, start: "top 82%", toggleActions: "restart none none reverse" },
          }
        );
      });
    },
    { scope: rootRef }
  );

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <div data-liquid-content className="absolute inset-0">
        {children}
      </div>
      {/* Velo decorativo: invisibile finché GSAP non prende il controllo
          (senza JS non esiste visivamente). */}
      <svg
        ref={veilRef}
        aria-hidden
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{ visibility: "hidden" }}
      >
        <defs>
          <filter id={`lqf-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
            {/* baseFrequency bassa + scale contenuta = bordo organico elegante,
                niente effetto horror del demo originale. */}
            <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="7" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="70" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <mask id={`lqm-${uid}`}>
            <rect width="100%" height="100%" fill="white" />
            <circle
              ref={circleRef}
              cx={VB_W / 2}
              cy={VB_H / 2}
              r="0"
              fill="black"
              style={{ filter: `url(#lqf-${uid})` }}
            />
          </mask>
        </defs>
        <rect width="100%" height="100%" style={{ fill: TONES[tone] }} mask={`url(#lqm-${uid})`} />
      </svg>
    </div>
  );
}
