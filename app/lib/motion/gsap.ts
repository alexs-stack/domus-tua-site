"use client";

// Punto unico di registrazione GSAP e lessico dei tempi del sito. Ogni
// componente motion importa da qui: plugin registrati una sola volta, ease e
// durate uguali ai token CSS di globals.css.
//
// ─── IL LESSICO (D17; A20 «Fedeltà letterale» di Alberto, spec §2.6) ────
// I valori di era-residence, con un nome per parte uguale in CSS e qui:
//   Durate    durDt.s/m/l 0.4 / 0.8 / 1.2 s        ↔ --dur-dt-s/m/l
//   Stagger   staggerDt 0.1 s                       ↔ --stagger-dt
//   Ritardo   delayDt.reveal 0.3 s                  ↔ --delay-dt-reveal
//   Dipinto   painted 0.02                          ↔ --dt-painted
//   Corsa     ctnY() 3.333vw da 1024, 11.54vw sotto ↔ --dt-ctn-y
//   Ease      "dtOut" 0.25,1,0.5,1                  ↔ --ease-dt-out
// app/lib/__tests__/motion-tokens.test.ts pretende gli stessi numeri in CSS e
// qui. Ogni CustomEase entra con il suo primo consumatore, una per riga: è la
// forma che leggono intro-clocks.test.ts e motion-tokens.test.ts.
//
// Il vocabolario di prima resta a chi lo legge: `dur` (micro, short, reveal,
// hero, transition), `stagger.chars` (anche PropertyDetail.tsx, che su
// /case/[slug] resta ferma per D32) e `stagger.cards`; le ease "domus" e
// "domus.inOut" alle sezioni e alla UI che le usano.
//
// Regole: animazioni solo dentro gsap.matchMedia(MQ.motionOk); stati nascosti
// solo via JS (mai SSR/CSS, salvo lo stato dipinto a 0.02 di spec §2.5); mai
// transform su antenati sticky/fixed; uno stato nascosto che contiene un link o
// un bottone usa opacity, mai autoAlpha — autoAlpha scrive visibility:hidden,
// che sfila il link dalla tab order e impedisce persino alla rete di sicurezza
// focusin di scattare (il focus in un sottoalbero invisibile non ci arriva,
// quindi l'evento non nasce mai).
// ───────────────────────────────────────────────────────────────────────
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";
import { useGSAP } from "@gsap/react";
import { MQ } from "./mq";

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
// Ease dell'Arco Domus (preloader e reveal di testo, rif. era-residence §4 e §7;
// le transizioni di pagina non esistono più):
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

/** Durate condivise (secondi) del vocabolario di prima: le leggono sezioni, UI e /case/[slug]. */
export const dur = {
  micro: 0.3,
  short: 0.6,
  reveal: 0.9,
  hero: 1.4,
  transition: 1.1,
} as const;

/** Stagger condivisi (secondi per elemento): `chars` per il manifesto e /case/[slug], `cards` per le griglie. */
export const stagger = {
  chars: 0.06,
  cards: 0.12,
} as const;

/** Lessico di era-residence (A20, D17): durate in secondi, ↔ --dur-dt-s/m/l. */
export const durDt = { s: 0.4, m: 0.8, l: 1.2 } as const;
/** Stagger fra due membri dello stesso ruolo in un gruppo (secondi), ↔ --stagger-dt. */
export const staggerDt = 0.1;
/** Ritardo del primo membro di un gruppo (secondi), ↔ --delay-dt-reveal. */
export const delayDt = { reveal: 0.3 } as const;
/** Stato dipinto (A20 di Alberto, D17): a opacity 0 Chromium toglie il testo dai candidati LCP (spec §2.5), ↔ --dt-painted. */
export const painted = 0.02;
/**
 * Corsa del ruolo ctn (A20 di Alberto, D17): Era scrive 3.333rem da 992 e 11.54rem sotto con html a 1vw; qui la
 * soglia è MQ.lg. La legge text-roles.ts per il `y` del tween (GSAP non risolve `var(--dt-ctn-y)`); senza `window`
 * (test di node) vale il ramo sotto soglia.
 */
export const ctnY = (): string =>
  typeof window !== "undefined" && window.matchMedia(MQ.lg).matches ? "3.333vw" : "11.54vw";

/**
 * Un `ScrollTrigger.refresh()` al fotogramma dopo; più richieste nello stesso
 * fotogramma diventano una. Lo chiede chi cambia le altezze sopra i trigger:
 * il cambio lingua in LocaleProvider, perché i titoli spezzati per lettera
 * (A20 di Alberto) e i corridoi (A19, D22) cambiano altezza con la lingua
 * (spec §2.3).
 */
export const requestRefresh = (() => {
  let raf = 0;
  return () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => ScrollTrigger.refresh());
  };
})();

export { gsap, ScrollTrigger, CustomEase, useGSAP, MQ };
