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
// solo via JS (mai SSR/CSS); mai transform su antenati sticky/fixed; uno stato
// nascosto che contiene un link o un bottone usa opacity, mai autoAlpha —
// autoAlpha scrive visibility:hidden, che sfila il link dalla tab order e
// impedisce persino alla rete di sicurezza focusin di scattare (il focus in un
// sottoalbero invisibile non ci arriva, quindi l'evento non nasce mai).
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

// Su touch la barra URL che si ritrae/riespande è un resize di sola altezza:
// senza questa opzione ogni ciclo rifà `ScrollTrigger.refresh()` su tutti i
// trigger della pagina (pin ricalcolati, reveal che scattano a metà scroll).
// GSAP applica il flag SOLO quando `isTouch === 1` (dito puro, non mouse+touch)
// e continua comunque a fare refresh se cambia la larghezza o l'altezza salta
// oltre il 25%: la rotazione resta gestita, voluto (onda «parità mobile 2»,
// prompt §7.2, misura 4.8 dell'audit). Deve stare qui, a livello di modulo,
// prima che qualunque trigger nasca.
ScrollTrigger.config({ ignoreMobileResize: true });

// Hook di prova per sonde ed e2e, mai per il prodotto. In produzione GSAP non è
// sul `window`, quindi `scripts/mobile-cdp-probe.ts` conta [data-on]/.pin-spacer
// come proxy dei trigger e non può misurare i refresh (audit §5.3, 4.8): con
// `__dtST()` legge il numero vero, con `__dtSTRefresh` conta i refresh in un
// ciclo 844→744→844 (barra URL, atteso 0) o in una rotazione (atteso > 0) —
// e2e di prompt §9.3. Costo per l'utente: una closure e un intero.
type STProbe = { __dtST?: () => number; __dtSTRefresh?: number };
if (typeof window !== "undefined") {
  const w = window as unknown as STProbe;
  w.__dtST = () => ScrollTrigger.getAll().length;
  w.__dtSTRefresh = 0;
  ScrollTrigger.addEventListener("refresh", () => {
    w.__dtSTRefresh = (w.__dtSTRefresh ?? 0) + 1;
  });
}

// Ease firma "domus": out morbido con coda lunga — il "gesto" del sito.
// Creata una sola volta a livello modulo (idempotente tra HMR/remount).
CustomEase.create("domus", "M0,0 C0.22,0.9 0.36,1 1,1");
CustomEase.create("domus.inOut", "M0,0 C0.66,0 0.22,1 1,1");
// Ease dell'Arco Domus (preloader + transizioni, rif. era-residence):
// "dtDiveIn" = il tuffo dentro la porta; "dtLoader" = progress a scatti;
// "dtOut" = la curva dei reveal di testo del riferimento (out deciso).
CustomEase.create("dtDiveIn", "0.6,0,0,1");
CustomEase.create("dtOut", "0.25,1,0.5,1");
// "dtHorScroll" = la curva del track orizzontale del riferimento (§11 del
// dossier): parte lenta, accelera al centro, frena in coda. Consapevolmente
// NON lineare anche se usata come containerAnimation: i reveal once:true
// tollerano lo scarto e il gesto guadagna testa/coda.
CustomEase.create("dtHorScroll", "0.25,0,0.75,1");
CustomEase.create(
  "dtLoader",
  "M0,0,C0,0,0.13,0.34,0.238,0.442,0.305,0.506,0.322,0.514,0.396,0.54,0.478,0.568,0.468,0.56,0.522,0.584,0.572,0.606,0.61,0.719,0.714,0.826,0.798,0.912,1,1,1,1"
);

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
//
// ─── DUE SOGLIE, E VANNO SAPUTE ENTRAMBE ───────────────────────────────
// `desktop` è 768 ed è la soglia degli effetti di sezione (camera, derive,
// parallasse). `lg` è 1024 ed è la soglia dei SET PIECE: rotaia orizzontale,
// corridoio, muro, filo. Non sono la stessa cosa e non vanno confuse — a 768
// un set piece toccherebbe il contenuto.
//
// Prima della wave "parità mobile" `lg` non esisteva e TREDICI componenti se
// lo riscrivevano a mano: nove in linea (FeaturedTestimonial, Footer, Paths,
// Social, StarReviews, TeamTrail, HorizontalRail, HoverDistort, LiquidReveal)
// e quattro dietro costanti private con commenti quasi identici (RAIL_MQ,
// HORIZON_MQ, WALL_MQ, PIN_MQ). Adesso c'è un posto solo.
//
// Le forme "below" esistono per scrivere il RAMO MOBILE come cittadino di
// prima classe invece che come negazione. Il confine è 1023.98 / 767.98, non
// 1023 / 767: alle larghezze frazionarie (zoom del browser, dpr non interi)
// un buco di un pixel lascia entrambi i rami spenti. È l'idioma che
// LiquidReveal e Footer usavano già, promosso qui.
//
// `belowDesktop` ha tre chiamanti (HeroCinematic per la deriva d'uscita
// dell'hero, CameraIn per la salita piana, Preloader per il ramo mobile
// dell'intro): il decimale vive qui e in nessuno dei tre. `coarse` invece non
// ha ancora nessun chiamante — i quattro effetti del puntatore si spengono con
// `finePointer` e la regola touch del CSS usa la sua `@media (pointer: coarse)`.
// Resta perché è il nome giusto per ciò che riguarda SOLO il dito (skip al
// tocco, chunk del cursore da non scaricare — onda «parità mobile 2», legge 5),
// e quando quel lavoro arriva deve trovarlo qui, non reinventarlo in linea.
export const MQ = {
  motionOk: "(prefers-reduced-motion: no-preference)",
  /** Effetti di sezione: da tablet in su. */
  desktop: "(min-width: 768px)",
  /** Il gemello di `desktop`: telefono. */
  belowDesktop: "(max-width: 767.98px)",
  /** Set piece: solo desktop vero. */
  lg: "(min-width: 1024px)",
  /** Il gemello di `lg`: telefono e tablet. */
  belowLg: "(max-width: 1023.98px)",
  finePointer: "(pointer: fine)",
  /** Puntatore grosso: il dito. Mai usare `belowLg` per dire "touch". */
  coarse: "(pointer: coarse)",
} as const;

export { gsap, ScrollTrigger, CustomEase, useGSAP };
