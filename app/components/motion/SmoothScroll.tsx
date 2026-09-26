"use client";

// SmoothScroll — monta Lenis sul window e lo sincronizza con ScrollTrigger.
// Non wrappa i children (zero impatto su SSR/hydration): è un mount, come Grain.
// - Attivo solo con prefers-reduced-motion: no-preference (live: reagisce al cambio).
// - Il touch resta nativo (smoothWheel only) → mobile senza scroll-hijacking.
// - anchors: true → i link #ancora scorrono con Lenis rispettando scroll-margin-top.
import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger, MQ } from "../../lib/motion/gsap";

let activeLenis: Lenis | null = null;

/** Lenis attivo (null con reduced-motion o prima del mount). */
export function getLenis(): Lenis | null {
  return activeLenis;
}

export default function SmoothScroll() {
  useEffect(() => {
    const media = window.matchMedia(MQ.motionOk);
    let lenis: Lenis | null = null;
    let onTick: ((time: number) => void) | null = null;

    const start = () => {
      if (lenis) return;
      lenis = new Lenis({
        lerp: 0.1,
        wheelMultiplier: 1,
        smoothWheel: true,
        anchors: true,
        autoRaf: false,
      });
      activeLenis = lenis;
      lenis.on("scroll", ScrollTrigger.update);
      onTick = (time: number) => lenis?.raf(time * 1000);
      gsap.ticker.add(onTick);
      // Contratto col preloader (che gira in layout effect, PRIMA di questo
      // useEffect): se l'intro sta coprendo, Lenis nasce fermo e il
      // lagSmoothing anti-jank dell'intro non va azzerato — sarà finish()
      // del Preloader a fare start() e lagSmoothing(0).
      if (document.documentElement.hasAttribute("data-preloader")) {
        lenis.stop();
      } else {
        gsap.ticker.lagSmoothing(0);
      }
    };

    const stop = () => {
      if (!lenis) return;
      if (onTick) gsap.ticker.remove(onTick);
      lenis.destroy();
      lenis = null;
      activeLenis = null;
      onTick = null;
    };

    const sync = () => (media.matches ? start() : stop());
    sync();
    media.addEventListener("change", sync);

    return () => {
      media.removeEventListener("change", sync);
      stop();
    };
  }, []);

  return null;
}
