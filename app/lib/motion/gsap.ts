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
//             "dtIn"  0.5,0,0.75,0                  ↔ --ease-dt-in
//             "dtEase" 0.25,0.1,0.25,1               ↔ --ease-dt-ease
//             "dtInOut" 0.75,0,0.25,1                ↔ --ease-dt-in-out
// app/lib/__tests__/motion-tokens.test.ts pretende gli stessi numeri in CSS e
// qui. Ogni CustomEase entra con il suo primo consumatore, una per riga: è la
// forma che leggono intro-clocks.test.ts e motion-tokens.test.ts.
//
// Il vocabolario di prima resta a chi lo legge: `dur` (micro, short, reveal,
// transition), `stagger.chars` (anche PropertyDetail.tsx, che su
// /case/[slug] resta ferma per D32) e `stagger.cards`; le ease "domus" e
// "domus.inOut" alle sezioni e alla UI che le usano.
//
// Regole: animazioni solo dentro gsap.matchMedia(MQ.motionOk); stati nascosti
// solo via JS (mai SSR/CSS, salvo lo stato dipinto a 0.02 di spec §2.5); mai
// transform su antenati sticky/fixed; i refresh di ScrollTrigger si chiedono
// con requestRefresh e, a scroll in corso, con whenStill (D39, D53, D54, D56:
// mai un refresh forzato dentro l'arrivo nativo a un frammento), e lo
// scrollEnd di ScrollTrigger si ascolta con onScrollEnd, mai diretto; uno stato
// nascosto che contiene un link o
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

// SplitText NON è registrato qui: lo importano e registrano Lead (le righe del
// lead, A20 di Alberto; spec §2.3) e FrozenLines (i titoli di /case/[slug],
// D32), così non entra nel chunk del layout (SmoothScroll importa questo
// modulo).
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

// `load` non è fra gli eventi del refresh automatico (D56): ScrollTrigger lo
// tratta come refresh forzato (l'Event arriva come `force`, ScrollTrigger.js
// 3.15 riga 1170) e sulla home a server freddo `load` cade con l'arrivo nativo
// a /#frammento ancora in volo, quando il corridoio dell'hero ha già il primo
// trigger della pagina: i due scroll dei misuratori (0 e ritorno) cancellano
// l'arrivo. Il refresh dopo load lo chiede whenStill, in fondo al modulo. Solo
// col DOM: senza `window` (test di node) ScrollTrigger non ha la lista degli
// eventi e `config` cadrebbe.
if (typeof window !== "undefined") {
  ScrollTrigger.config({ autoRefreshEvents: "visibilitychange,DOMContentLoaded,resize" });
}

// Hook di prova per sonde ed e2e, mai per il prodotto. In produzione GSAP non è
// sul `window`, quindi `scripts/mobile-cdp-probe.ts` conta [data-on]/.pin-spacer
// come proxy dei trigger e non può misurare i refresh (audit §5.3, 4.8): con
// `__dtST()` legge il numero vero, con `__dtSTRefresh` conta i refresh in un
// ciclo 844→744→844 (barra URL, atteso 0) o in una rotazione (atteso > 0) —
// e2e di prompt §9.3. Costo per l'utente: una closure e un intero.
// `__dtSTList()` (22 set. 2026, A49): i trigger uno per uno — innesco (tag e attributi data- del
// trigger), start, end e progresso — per diagnosticare in un e2e uno scrub che non parte
// (hero-alto.spec.ts, la chiusura in cartolina); stesso costo: una closure.
export type STVoce = { trigger: string; start: number; end: number; progress: number };
type STProbe = { __dtST?: () => number; __dtSTRefresh?: number; __dtSTList?: () => STVoce[] };
if (typeof window !== "undefined") {
  const w = window as unknown as STProbe;
  w.__dtST = () => ScrollTrigger.getAll().length;
  w.__dtSTList = () =>
    ScrollTrigger.getAll().map((t) => ({
      trigger:
        t.trigger instanceof Element
          ? [t.trigger.tagName.toLowerCase(), ...Array.from(t.trigger.attributes).filter((a) => a.name.startsWith("data-")).map((a) => a.name)].join(" ")
          : String(t.trigger),
      start: t.start,
      end: t.end,
      progress: t.progress,
    }));
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
// "dtIn" = l'uscita dei testi del riferimento (In di Era, main.pretty.js:2863):
// la leggono le uscite di reveal-engine.ts (A18, entrate e uscite speculari).
CustomEase.create("dtIn", "0.5,0,0.75,0");
// "dtEase" = la Ease di Era (ERA:2863): la salita di testo e foto nel tuffo
// dell'hero e nel ramo 768-1023, chiesti da Alberto il 13 settembre 2026
// (A18-A20, spec coreografia §3.2).
CustomEase.create("dtEase", "0.25,0.1,0.25,1");
// "dtHorScroll" = la curva del track orizzontale del riferimento (§11 del
// dossier): parte lenta, accelera al centro, frena in coda. Consapevolmente
// NON lineare anche se usata come containerAnimation: i reveal once:true
// tollerano lo scarto e il gesto guadagna testa/coda.
CustomEase.create("dtHorScroll", "0.25,0,0.75,1");
// "dtAffonda" (0.5,0,0.8,0.45): la foto della testimonianza che affonda nella
// cornice ferma, capitolo 13 della home (A20 di Alberto, spec 2026-09-13 §3.14).
CustomEase.create("dtAffonda", "0.5,0,0.8,0.45");
// "dtRail" (0.5,0,0.5,1): la rotaia del team e il pan delle tessere, capitolo 15
// (A20, spec §3.16); vale anche su /chi-siamo.
CustomEase.create("dtRail", "0.5,0,0.5,1");
// "dtCartolina" (0.45,0,0.15,1): la banda del Congedo che si ritira in cartolina e
// il footer che sale, capitolo 17 (A19 e A20 di Alberto, spec 2026-09-13 §3.18).
CustomEase.create("dtCartolina", "0.45,0,0.15,1");
// "dtInOut" = l'InOut di era-residence (0.75,0,0.25,1): firma della finestra di Open Domus,
// scala 1,84 delle tende e .75 → 1 dello stage (A20 di Alberto, spec §3.1 riga 9).
CustomEase.create("dtInOut", "0.75,0,0.25,1");
// "dtTappe": il track del nastro di Costi chiari (A72, 22 set. 2026, notte), con due soste lente — sul
// claim dei costi (0,27-0,35 della corsa) e su Carmine (0,58-0,65) — e l'arrivo morbido su Seguici;
// consumatore CostiChiari.tsx via chapters.costi (D18: la finestra ha dtInOut, storia dtHorScroll).
CustomEase.create("dtTappe", "M0,0 C0.08,0 0.15,0.239 0.22,0.27 C0.28,0.296 0.34,0.324 0.4,0.35 C0.46,0.376 0.52,0.554 0.58,0.58 C0.64,0.606 0.7,0.624 0.76,0.65 C0.83,0.681 0.92,1 1,1");
// "dtSosta" = la firma di Paths, capitolo 7 (A20 di Alberto, spec 2026-09-13
// §3.1 e §3.8): le colonne in controfase si fermano allineate mentre la riga
// passa al centro, tratto quasi piatto fra 0,4 e 0,6 (colonne di Era, CAT §11).
CustomEase.create("dtSosta", "M0,0 C0.25,0.45 0.3,0.5 0.5,0.5 C0.7,0.5 0.75,0.55 1,1");
// "dtTerreno", "dtComporre" e "dtTenda" (le teste R3/R1/R2 del commit R) sono
// morte con A38 e A41 (20 set. 2026): la testa di era è ferma e sticky, senza
// parallasse, cornice né coperchio.
CustomEase.create(
  "dtLoader",
  "M0,0,C0,0,0.13,0.34,0.238,0.442,0.305,0.506,0.322,0.514,0.396,0.54,0.478,0.568,0.468,0.56,0.522,0.584,0.572,0.606,0.61,0.719,0.714,0.826,0.798,0.912,1,1,1,1"
);

/** Durate condivise (secondi) del vocabolario di prima: le leggono sezioni, UI e /case/[slug]. */
export const dur = {
  micro: 0.3,
  short: 0.6,
  reveal: 0.9,
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

/** Tetto dell'attesa dello scroll fermo, lo stesso del motore dei reveal (reveal-engine.ts, D39). */
const STILL_CAP_MS = 4000;

/**
 * Lo scrollEnd di ScrollTrigger, preso solo se regge al fotogramma dopo (D39). ScrollTrigger lo
 * emette da `_updateAll` quando l'ultimo evento di scroll è più vecchio di 200 ms
 * (ScrollTrigger.js 3.15, righe 589-594), ma `_onScroll` chiama `_updateAll` PRIMA di segnare
 * l'ora dell'evento nuovo (righe 374-388): il primo evento di uno scroll che continua dopo un task
 * lungo del thread principale porta con sé uno scrollEnd, e dentro quello scrollEnd
 * `isScrolling()` è falso. È l'idratazione (task di 250-510 ms misurati a 1440×900 e a 390×664)
 * con l'arrivo smooth al frammento in volo: il refresh forzato che partiva da lì cancellava
 * l'arrivo (/vendi#contatti fermo fra 2.000 e 9.300 px con l'ancora a 14.800-15.000; /#cerca
 * fermo col pannello della ricerca a 0,90). Lo stesso evento rimette subito l'ora dell'ultimo
 * scroll, quindi al fotogramma dopo `isScrolling()` è di nuovo vero e quello scrollEnd non vale: si
 * aspetta il prossimo. Quello vero arriva a scroll fermo dal giro di `_sync` (ogni 250 ms, riga
 * 2115), e al fotogramma dopo `isScrolling()` resta falso. Restituisce l'annullamento.
 */
export function onScrollEnd(fn: () => void): () => void {
  let raf = 0;
  const onEnd = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      raf = 0;
      if (!ScrollTrigger.isScrolling()) fn();
    });
  };
  ScrollTrigger.addEventListener("scrollEnd", onEnd);
  return () => {
    ScrollTrigger.removeEventListener("scrollEnd", onEnd);
    cancelAnimationFrame(raf);
  };
}

/**
 * Esegue `fn` a scroll fermo: subito se `ScrollTrigger.isScrolling()` è falso, altrimenti allo
 * scrollEnd di ScrollTrigger (200 ms dopo l'ultimo evento di scroll, confermato da onScrollEnd);
 * al tetto STILL_CAP_MS parte solo se lo scroll è fermo, altrimenti aspetta ancora lo scrollEnd.
 * Restituisce l'annullamento, per i cleanup degli effetti. Serve ai refresh:
 * `ScrollTrigger.refresh()` è forzato, cioè scrollBehavior ad "auto", scroll a 0, misure, ritorno
 * alla posizione registrata, e i due scroll programmatici cancellano uno scroll nativo in corso,
 * l'arrivo smooth al frammento (/#contatti, html { scroll-behavior: smooth }) o un fling su touch.
 * È la regola D39 del motore dei reveal, che tiene la sua versione con lo stato dell'arrivo
 * (reveal-engine.ts); qui la leggono i corridoi dopo `data-on` (useCorridor.ts, D53), il cambio
 * lingua (LocaleProvider.tsx, D54) e il refresh dopo load (D56, sotto).
 */
export function whenStill(fn: () => void): () => void {
  if (!ScrollTrigger.isScrolling()) {
    fn();
    return () => {};
  }
  let cap = 0;
  let stopEnd = () => {};
  const onEnd = () => {
    stopEnd();
    window.clearTimeout(cap);
    fn();
  };
  stopEnd = onScrollEnd(onEnd);
  cap = window.setTimeout(() => {
    if (!ScrollTrigger.isScrolling()) onEnd();
  }, STILL_CAP_MS);
  return () => {
    stopEnd();
    window.clearTimeout(cap);
  };
}

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

// Il refresh dopo load (D56), al posto dell'evento `load` tolto da
// autoRefreshEvents: a scroll fermo, una volta. Senza guardia sul readyState:
// se il modulo arriva dopo load non c'è ancora nessun trigger da rinfrescare,
// e corridoi e motore chiedono il loro refresh al montaggio.
if (typeof window !== "undefined") {
  window.addEventListener("load", () => whenStill(() => requestRefresh()), { once: true });
}

export { gsap, ScrollTrigger, CustomEase, useGSAP, MQ };
