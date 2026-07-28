"use client";

// Punto unico di registrazione GSAP. Ogni componente motion importa da qui:
// plugin registrati una sola volta, ease brand condivise coi token CSS
// (--ease-out-expo ≈ "expo.out", --ease-soft ≈ CustomEase equivalente).
//
// ─── FIRMA MOTION DEL SITO ─────────────────────────────────────────────
// Tutta la coreografia usa SOLO questo vocabolario (niente valori sparsi):
//
//   Durate    dur.micro 0.3s (hover/UI) · dur.short 0.6s · dur.reveal 0.9s
//             dur.hero 1.4s · dur.transition 1.1s (page transition)
//   Ease      "domus"       → out morbido con coda lunga (coreografia principale)
//             "domus.inOut" → transizioni pagina/overlay
//             "expo.out"    ≈ --ease-out-expo (reveal secchi, hover)
//   Stagger   stagger.chars 0.06 · stagger.words 0.10 · stagger.lines 0.11
//             stagger.cards 0.12
//   Distanze  dist.rise 48px (reveal verticali, mai 100+) · dist.parallax 13%
//             dist.skew 5° (velocity skew massimo)
//
// Regole: animazioni solo dentro gsap.matchMedia(MQ.motionOk); stati nascosti
// solo via JS (mai SSR/CSS); mai transform su antenati sticky/fixed.
// ───────────────────────────────────────────────────────────────────────
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";
import { useGSAP } from "@gsap/react";

// SplitText NON è registrato qui: lo importa e registra solo TextLines,
// così non entra nel chunk del layout (SmoothScroll importa questo modulo).
// Stessa regola per Flip/Draggable/Inertia/DrawSVG: registrazione locale
// nel componente che li usa. CustomEase è ~2kb e definisce la firma: sta qui.
gsap.registerPlugin(ScrollTrigger, CustomEase, useGSAP);

// Ease firma "domus": out morbido con coda lunga — il "gesto" del sito.
// Creata una sola volta a livello modulo (idempotente tra HMR/remount).
CustomEase.create("domus", "M0,0 C0.22,0.9 0.36,1 1,1");
CustomEase.create("domus.inOut", "M0,0 C0.66,0 0.22,1 1,1");

/** Durate condivise (secondi). */
export const dur = {
  micro: 0.3,
  short: 0.6,
  reveal: 0.9,
  hero: 1.4,
  transition: 1.1,
} as const;

/** Stagger condivisi (secondi per elemento). */
export const stagger = {
  chars: 0.06,
  words: 0.1,
  lines: 0.11,
  cards: 0.12,
} as const;

/** Distanze/intensità condivise. */
export const dist = {
  /** Reveal verticali in px (40–60, mai oltre). */
  rise: 48,
  /** Parallax immagini: frazione massima (12–15%). */
  parallax: 0.13,
  /** Velocity skew massimo in gradi. */
  skew: 5,
} as const;

// Le media query usate da gsap.matchMedia in tutto il sito.
// `motionOk` è la condizione base: nessuna animazione GSAP parte senza.
export const MQ = {
  motionOk: "(prefers-reduced-motion: no-preference)",
  desktop: "(min-width: 768px)",
  finePointer: "(pointer: fine)",
} as const;

export { gsap, ScrollTrigger, CustomEase, useGSAP };
