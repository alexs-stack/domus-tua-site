"use client";

// VelocityMarquee — nastro infinito che reagisce allo scroll: accelera con la
// velocità e ne segue la direzione, poi decade dolcemente al ritmo di crociera.
// Il contenuto è duplicato internamente (copia aria-hidden) per il loop senza
// stacchi. Con reduced-motion resta una riga statica (nessun movimento).
import { useRef, type ReactNode } from "react";
import { gsap, ScrollTrigger, useGSAP, MQ } from "../../lib/motion/gsap";

type Props = {
  children: ReactNode;
  className?: string;
  /** classi del nastro interno (layout degli item: flex, gap…) */
  trackClassName?: string;
  /** secondi per un giro completo al ritmo di crociera */
  duration?: number;
};

export default function VelocityMarquee({
  children,
  className = "",
  trackClassName = "",
  duration = 38,
}: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const track = trackRef.current;
      if (!track) return;

      const mm = gsap.matchMedia();
      mm.add(MQ.motionOk, () => {
        const loop = gsap.to(track, {
          xPercent: -50,
          duration,
          ease: "none",
          repeat: -1,
        });
        // Semina il loop lontano da 0: con timeScale negativo (scroll verso l'alto)
        // un tween a totalTime 0 si bloccherebbe sul clamp iniziale. Il rendering è
        // identico (totalTime è modulo della durata del ciclo).
        loop.totalTime(duration * 100, true);

        // Proxy per animare fluidamente il timeScale (boost → decadimento a 1).
        const proxy = { ts: 1 };
        const apply = () => loop.timeScale(proxy.ts);
        const st = ScrollTrigger.create({
          onUpdate(self) {
            const v = self.getVelocity();
            const boost = gsap.utils.clamp(1, 3.2, 1 + Math.abs(v) / 900);
            const target = v < -60 ? -boost : boost;
            gsap.to(proxy, {
              ts: target,
              duration: 0.18,
              ease: "power2.out",
              overwrite: true,
              onUpdate: apply,
              onComplete() {
                gsap.to(proxy, { ts: 1, duration: 1.4, ease: "power2.out", onUpdate: apply });
              },
            });
          },
        });

        return () => {
          st.kill();
          loop.kill();
        };
      });
    },
    { scope: rootRef, dependencies: [duration] }
  );

  return (
    <div ref={rootRef} className={`overflow-hidden ${className}`}>
      {/* Il loop è senza stacchi perché il nastro è esattamente 2 copie identiche:
          la spaziatura (gap + padding di coda) vive SOLO dentro le copie. */}
      <div ref={trackRef} className="flex w-max">
        <div className={`flex shrink-0 ${trackClassName}`}>{children}</div>
        <div className={`flex shrink-0 ${trackClassName}`} aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}
