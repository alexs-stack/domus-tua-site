"use client";

// Punto unico di registrazione GSAP. Ogni componente motion importa da qui:
// plugin registrati una sola volta, ease brand condivise coi token CSS
// (--ease-out-expo ≈ "expo.out", --ease-soft ≈ CustomEase equivalente).
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

// SplitText NON è registrato qui: lo importa e registra solo TextLines,
// così non entra nel chunk del layout (SmoothScroll importa questo modulo).
gsap.registerPlugin(ScrollTrigger, useGSAP);

// Le media query usate da gsap.matchMedia in tutto il sito.
// `motionOk` è la condizione base: nessuna animazione GSAP parte senza.
export const MQ = {
  motionOk: "(prefers-reduced-motion: no-preference)",
  desktop: "(min-width: 768px)",
  finePointer: "(pointer: fine)",
} as const;

export { gsap, ScrollTrigger, useGSAP };
