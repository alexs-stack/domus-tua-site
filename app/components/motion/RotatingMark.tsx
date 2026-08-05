"use client";

// RotatingMark — badge di marca in alto a sinistra, rif. era-residence.com
// (reverse-engineering/era-residence/README.md §5).
//
// CONTROROTAZIONE (richiesta cliente, 2026-08)
// L'anello ornamentale e il monogramma girano in VERSI OPPOSTI: l'anello a
// 30°/s, il monogramma a −30°/s. È il gesto di un meccanismo — due ingranaggi
// che si tengono — invece di un blocco unico che ruota. Le due velocità sono le
// stesse di prima e restano legate: la modulazione dello scroll Lenis
// (30 + 10·|v|) e il cambio di direzione valgono per entrambi, quindi il verso
// opposto è invariante, non un caso.
//
// Il logo NON viene ridisegnato né deformato (divieto del brand book su morph e
// draw): è lo stesso PNG depositato, ruotato attorno al proprio centro.
//
// Con reduced-motion o senza JS nulla si muove e il badge resta esattamente
// com'è nell'HTML — il monogramma è centrato con flexbox, non con un transform,
// proprio perché GSAP possa scrivere `transform` senza portarsi via il centraggio.
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
// RotatingMark lo mette in controrotazione), il preloader e il sipario di
// PageTransition (che usano lo stesso gesto via `spinMarkBadge`).
//
// Due agganci, non uno: `[data-rot-ring]` e `[data-rot-mark]` girano in verso
// opposto, quindi non possono più stare dentro lo stesso gruppo rotante.
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
      {/* Centraggio con flexbox, NON con `-translate-x-1/2`: GSAP scrive
          `transform` sul monogramma e si porterebbe via il centraggio al primo
          frame — con reduced-motion o senza JS il logo resterebbe fuori posto.
          Il contenitore è `inset-0`, quindi `h-[52%]` continua a misurarsi
          sull'altezza del badge come prima. */}
      <span className="absolute inset-0 flex items-center justify-center">
        {/* Monogramma ufficiale (crop del PNG depositato): ruota su sé stesso nel
            verso opposto all'anello. Il rosso del logo resta rosso anche nella
            variante per fondi scuri. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          data-rot-mark
          src={dark ? "/logo-domustua-mark-dark.png" : "/logo-domustua-mark.png"}
          alt=""
          width={99}
          height={92}
          className="h-[52%] w-auto"
        />
      </span>
    </span>
  );
}

/**
 * Giro continuo del badge: anello in un verso, monogramma nell'altro.
 *
 * Lo usano il preloader e il sipario delle transizioni, che hanno lo stesso gesto
 * dell'header ma a velocità fissa. Restituisce UN oggetto da uccidere (come il
 * singolo tween di prima), così i chiamanti non devono ricordarsi di ucciderne due.
 *
 * @param root      contenitore che ospita il badge
 * @param duration  secondi per un giro completo
 * @param repeat    -1 per il loop infinito (default), come i due chiamanti
 */
export function spinMarkBadge(
  root: Element | null | undefined,
  duration: number,
  repeat = -1
): gsap.core.Timeline | null {
  const ring = root?.querySelector("[data-rot-ring]");
  const mark = root?.querySelector("[data-rot-mark]");
  if (!ring && !mark) return null;

  const tl = gsap.timeline();
  const common = { duration, ease: "none", repeat, transformOrigin: "center center" } as const;
  if (ring) tl.fromTo(ring, { rotation: 0 }, { rotation: 360, ...common }, 0);
  if (mark) tl.fromTo(mark, { rotation: 0 }, { rotation: -360, ...common }, 0);
  return tl;
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
      const ring = rootRef.current?.querySelector<HTMLElement>("[data-rot-ring]");
      const mark = rootRef.current?.querySelector<HTMLElement>("[data-rot-mark]");
      if (!ring || !mark) return;

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
          // Un solo angolo, due segni: qualunque cosa faccia lo scroll — accelerare,
          // rallentare, invertire — i due elementi restano opposti per costruzione.
          gsap.set(ring, { rotation, transformOrigin: "center center" });
          gsap.set(mark, { rotation: -rotation, transformOrigin: "center center" });
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
