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
// draw): è il monogramma depositato, ruotato attorno al proprio centro.
//
// Con reduced-motion o senza JS nulla si muove e il badge resta esattamente
// com'è nell'HTML — il monogramma è centrato con flexbox, non con un transform,
// proprio perché GSAP possa scrivere `transform` senza portarsi via il centraggio.
import { useRef } from "react";
import { gsap, useGSAP, MQ, dur } from "../../lib/motion/gsap";
import { getLenis } from "./SmoothScroll";
// Il badge statico (anello + monogramma) vive in MarkBadge.tsx, SENZA
// "use client": dal 2026-08-17 lo rende anche la shell del preloader dal server
// (PreloaderShell.tsx), e un client component lì sarebbe un confine di
// idratazione per del puro markup. Ri-esportato da qui perché i chiamanti
// storici — questo file, il sipario di PageTransition — lo importano da questo
// modulo insieme a `spinMarkBadge`.
import { MarkBadge } from "./MarkBadge";
export { MarkBadge };

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
