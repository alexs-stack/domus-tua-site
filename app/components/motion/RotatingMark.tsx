"use client";

// RotatingMark — badge di marca in alto a sinistra, rif. era-residence.com
// (reverse-engineering/era-residence/README.md §5): il MONOGRAMMA ufficiale
// resta fermo (brand book: mai animare il logo), a ruotare è l'anello
// ornamentale dietro — sempre a 30°/s, accelera con la velocità dello scroll
// Lenis (30 + 10·|v|) e ne segue la direzione; a scroll fermo torna a 30°/s.
// Con reduced-motion l'anello è statico (il badge resta bello anche fermo).
import { useRef } from "react";
import { gsap, useGSAP, MQ, dur } from "../../lib/motion/gsap";
import { getLenis } from "./SmoothScroll";

// 60 tacche radiali sottili + 4 cardinali più lunghe: rosone tecnico-ornamentale
// che riprende i tagli netti del monogramma, senza ridisegnarlo.
// Coordinate precalcolate e ARROTONDATE a 2 decimali: i float di Math.cos/sin
// divergono nelle ultime cifre tra Node (SSR) e browser → hydration mismatch.
const TICKS = Array.from({ length: 60 }, (_, i) => {
  const deg = i * 6;
  const cardinal = deg % 90 === 0;
  const rad = (deg * Math.PI) / 180;
  const r1 = cardinal ? 40.5 : 43;
  const r2 = 46.5;
  const pt = (v: number) => v.toFixed(2);
  return {
    key: deg,
    cardinal,
    x1: pt(48 + r1 * Math.cos(rad)),
    y1: pt(48 + r1 * Math.sin(rad)),
    x2: pt(48 + r2 * Math.cos(rad)),
    y2: pt(48 + r2 * Math.sin(rad)),
  };
});

// Badge statico (anello + monogramma): markup condiviso tra l'header (dove
// RotatingMark lo mette in rotazione) e il sipario di PageTransition (che
// ruota l'anello con un tween proprio mentre copre).
export function MarkBadge({
  className = "h-12 w-12",
  dark = false,
}: {
  className?: string;
  /** true = variante negativa del monogramma (crema + rosso) per fondi scuri */
  dark?: boolean;
}) {
  return (
    <span className={`relative inline-block ${className}`}>
      {/* Gruppo rotante UNICO (anello + monogramma): come il rosone del sito
          di riferimento, gira tutto il cuore del badge. */}
      <span data-rot-core className="absolute inset-0 block">
      <svg
        data-rot-ring
        viewBox="0 0 96 96"
        fill="none"
        aria-hidden
        className="absolute inset-0 h-full w-full"
      >
        {TICKS.map((t) => (
          <line
            key={t.key}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke="currentColor"
            strokeWidth={t.cardinal ? 1.4 : 1}
            opacity={t.cardinal ? 0.9 : 0.5}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      {/* Monogramma ufficiale (crop del PNG depositato), fermo al centro:
          il rosso del logo resta rosso anche nella variante per fondi scuri. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={dark ? "/logo-domustua-mark-dark.png" : "/logo-domustua-mark.png"}
        alt=""
        width={99}
        height={92}
        className="absolute left-1/2 top-1/2 h-[52%] w-auto -translate-x-1/2 -translate-y-1/2"
      />
      </span>
    </span>
  );
}

export default function RotatingMark({
  className = "h-12 w-12",
  dark = false,
}: {
  className?: string;
  dark?: boolean;
}) {
  const rootRef = useRef<HTMLSpanElement | null>(null);

  useGSAP(
    () => {
      const ring = rootRef.current?.querySelector<HTMLElement>("[data-rot-core]");
      if (!ring) return;

      const mm = gsap.matchMedia();
      mm.add(MQ.motionOk, () => {
        const state = { speed: 30 }; // gradi/secondo a riposo
        let dir = 1;
        let rotation = 0;
        let armed = false;
        let idleTimer = 0;

        // La modulazione da scroll si attiva alla prima interazione reale
        // (la rotazione base parte subito).
        const arm = () => {
          armed = true;
        };
        window.addEventListener("wheel", arm, { once: true, passive: true });
        window.addEventListener("touchmove", arm, { once: true, passive: true });

        // Rotazione continua, frame-rate independent (delta clampato: i tab
        // in background non devono produrre salti di mezzo giro).
        const tick = (_t: number, deltaMS: number) => {
          const dt = Math.min(deltaMS, 100);
          rotation += state.speed * (dt / 1000);
          gsap.set(ring, { rotation, transformOrigin: "center center" });
        };
        gsap.ticker.add(tick);

        const onScroll = ({ velocity }: { velocity: number }) => {
          if (!armed) return;
          if (velocity !== 0) dir = velocity > 0 ? 1 : -1;
          gsap.to(state, {
            speed: dir * (30 + 10 * Math.abs(velocity)),
            duration: 0.3,
            ease: "domus",
            overwrite: true,
          });
          window.clearTimeout(idleTimer);
          idleTimer = window.setTimeout(() => {
            gsap.to(state, { speed: 30 * dir, duration: dur.transition, ease: "domus" });
          }, 100);
        };
        // Lenis può montare dopo di noi: aggancio pigro al primo tick utile.
        let lenis = getLenis();
        lenis?.on("scroll", onScroll);
        const lateAttach = !lenis
          ? window.setInterval(() => {
              lenis = getLenis();
              if (lenis) {
                lenis.on("scroll", onScroll);
                window.clearInterval(lateAttach);
              }
            }, 250)
          : 0;

        return () => {
          gsap.ticker.remove(tick);
          window.removeEventListener("wheel", arm);
          window.removeEventListener("touchmove", arm);
          window.clearTimeout(idleTimer);
          if (lateAttach) window.clearInterval(lateAttach);
          lenis?.off("scroll", onScroll);
        };
      });
    },
    { scope: rootRef }
  );

  return (
    <span ref={rootRef} className="contents">
      <MarkBadge className={className} dark={dark} />
    </span>
  );
}
