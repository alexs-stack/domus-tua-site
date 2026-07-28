"use client";

// VelocityMarquee — nastro infinito che reagisce allo scroll: accelera con la
// velocità, ne segue la direzione e si inclina (skewX ∝ velocity, max dist.skew),
// poi decade dolcemente al ritmo di crociera e a skew 0. Il contenuto è
// duplicato internamente (copia aria-hidden) per il loop senza stacchi.
// Con reduced-motion resta una riga statica (nessun movimento).
import { useRef, type ReactNode } from "react";
import { gsap, ScrollTrigger, useGSAP, MQ, dist } from "../../lib/motion/gsap";

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
      const root = rootRef.current;
      const track = trackRef.current;
      if (!root || !track) return;

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

        // Proxy per animare fluidamente timeScale e skew di velocità
        // (boost → decadimento a crociera / 0). skew e ts viaggiano nello
        // STESSO tween: overwrite:true ucciderebbe un tween parallelo sul proxy.
        const proxy = { ts: 1, skew: 0 };
        // quickSetter: scrive solo il transform (GPU), nessuna lettura di layout.
        const setSkew = gsap.quickSetter(track, "skewX", "deg");
        const apply = () => {
          loop.timeScale(proxy.ts);
          setSkew(proxy.skew);
        };
        // Il nastro gira solo quando è in viewport: fuori schermo il loop
        // infinito sarebbe ticker sprecato (stessa regola di Atmosphere).
        const gate = ScrollTrigger.create({
          trigger: root,
          start: "top bottom",
          end: "bottom top",
          onToggle(self) {
            if (self.isActive) loop.play();
            else loop.pause();
          },
        });
        // onToggle scatta solo ai CAMBI di stato: se il nastro monta fuori
        // viewport parte in pausa da subito, non al primo attraversamento.
        if (!gate.isActive) loop.pause();

        const st = ScrollTrigger.create({
          onUpdate(self) {
            const v = self.getVelocity();
            const boost = gsap.utils.clamp(1, 3.2, 1 + Math.abs(v) / 900);
            const target = v < -60 ? -boost : boost;
            // Skew proporzionale (segue la direzione), mai oltre dist.skew gradi.
            const skewTarget = gsap.utils.clamp(-dist.skew, dist.skew, v / 400);
            gsap.to(proxy, {
              ts: target,
              skew: skewTarget,
              duration: 0.18,
              ease: "power2.out",
              overwrite: true,
              onUpdate: apply,
              onComplete() {
                gsap.to(proxy, {
                  ts: 1,
                  skew: 0,
                  duration: 1.4,
                  ease: "power2.out",
                  onUpdate: apply,
                });
              },
            });
          },
        });

        return () => {
          gsap.killTweensOf(proxy);
          gate.kill();
          st.kill();
          loop.kill();
          gsap.set(track, { skewX: 0 });
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
