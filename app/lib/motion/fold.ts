"use client";

// La piega (spec §2.5; A20 di Alberto: titoli per lettera anche sopra la piega, con il rischio
// LCP accettato e ingegnerizzato; D21). Un gruppo che all'armamento interseca il viewport prende
// lo stato nascosto nello stesso task in cui arma i membri, e parte all'handoff del sipario
// (INTRO_EVENT) o 150 ms dopo. Sulle tre teste senza foto (/contatti, /case-vendute,
// /valutazione-immobile-tradate: section con `data-fold-lcp`) aspetta prima la prima voce LCP e
// i suoi lead spezzati, perché lì l'H1 e il paragrafo dipinti a 0,02 restano candidati LCP.
// Dall'inizio dell'attesa alla partenza il gruppo porta `data-fold-pending` e il motore non lo
// tocca. Con la rete CSS `dt-reveal-failsafe` già scattata il gruppo nasce pieno (foldNetFired legge
// l'orologio della CSSAnimation, dal commit 8 anche per le lettere dell'hero); nasce pieno anche un gruppo già partito una volta
// nella pagina (cambio lingua, reduced-motion che torna) e ogni gruppo quando la radice non porta
// `data-hero-intro`, perché lì il testo è pieno dal primo paint (D46).
import { INTRO_EVENT, heroRestMs } from "./intro-constants";
import { hasIntroFired } from "../../components/motion/Preloader";

/** Sulla section delle tre teste senza foto (spec §2.5, §5.2). */
export const FOLD_LCP = "data-fold-lcp";
/** Sul gruppo mentre la piega aspetta o non è ancora partita: IO, reti, sweep e resync lo saltano. */
export const FOLD_PENDING = "data-fold-pending";

/** Il sipario è armato e l'handoff non è ancora partito. */
export function curtainPending(): boolean {
  return document.documentElement.hasAttribute("data-preloader") && !hasIntroFired();
}

/**
 * `cb` all'handoff del sipario, con la rete al ritardo di heroRestMs: film, porta corta
 * (Alberto, 13 set. 2026, A18 e A20; spec §6.2) o a caldo. Restituisce l'annullamento.
 */
export function afterCurtain(cb: () => void): () => void {
  if (hasIntroFired()) {
    cb();
    return () => {};
  }
  let fatto = false;
  const run = () => {
    if (fatto) return;
    fatto = true;
    cb();
  };
  window.addEventListener(INTRO_EVENT, run, { once: true });
  const t = window.setTimeout(run, heroRestMs(document.documentElement.getAttribute("data-hero-intro")));
  return () => {
    fatto = true;
    window.removeEventListener(INTRO_EVENT, run);
    window.clearTimeout(t);
  };
}

/**
 * La rete CSS di questo elemento è già scattata? Orologio della sua CSSAnimation, poi boot script.
 * `keyframe`: `dt-reveal-failsafe` per i gruppi (spec §2.5); `dt-rest-failsafe` per le lettere
 * dell'hero (globals.css, `data-hero-char/tchar/schar`), che la leggono da qui dal commit 8.
 * La soglia viene da `data-hero-intro`, lo stesso attributo che dà il ritardo alle due regole.
 */
export function foldNetFired(el: Element, keyframe: "dt-reveal-failsafe" | "dt-rest-failsafe" = "dt-reveal-failsafe"): boolean {
  const restMs = heroRestMs(document.documentElement.getAttribute("data-hero-intro"));
  if (typeof el.getAnimations === "function") {
    try {
      const anim = el.getAnimations().find((a) => (a as CSSAnimation).animationName === keyframe);
      // Senza la sua CSSAnimation l'elemento non è sotto la regola dello 0,02 (già armato, o
      // con `animation: none` inline): non c'è una rete da dichiarare scattata.
      if (!anim) return false;
      return typeof anim.currentTime === "number" && anim.currentTime >= restMs;
    } catch {
      /* getAnimations che lancia: la riserva qui sotto */
    }
  }
  const t0 = (window as unknown as { __dtPreT0?: number }).__dtPreT0;
  return typeof t0 === "number" && performance.now() - t0 >= restMs;
}

let primoLcp: Promise<void> | null = null;

/** La prima voce `largest-contentful-paint` della pagina (tetto 3 s; senza API, due frame). */
export function afterFirstLcp(): Promise<void> {
  if (primoLcp) return primoLcp;
  primoLcp = new Promise<void>((resolve) => {
    const supportato =
      typeof PerformanceObserver !== "undefined" && PerformanceObserver.supportedEntryTypes?.includes("largest-contentful-paint");
    if (!supportato) {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      return;
    }
    const po = new PerformanceObserver((list) => {
      if (list.getEntries().length === 0) return;
      po.disconnect();
      resolve();
    });
    po.observe({ type: "largest-contentful-paint", buffered: true });
    window.setTimeout(() => {
      po.disconnect();
      resolve();
    }, 3000);
  });
  return primoLcp;
}

/** `document.fonts.ready` o `ms`, quello che arriva prima (spec §2.3). */
export function fontsOrTimeout(ms: number): Promise<void> {
  return Promise.race([document.fonts.ready.then(() => undefined), new Promise<void>((r) => window.setTimeout(r, ms))]);
}

/** Si risolve quando nessun Lead del gruppo è ancora da spezzare (tetto `capMs`). */
export function leadsReady(group: HTMLElement, capMs = 3500): Promise<void> {
  if (!group.querySelector('[data-lead="pending"]')) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const fine = () => {
      group.removeEventListener("dt:lead", controlla);
      window.clearTimeout(t);
      resolve();
    };
    const controlla = () => {
      if (!group.querySelector('[data-lead="pending"]')) fine();
    };
    group.addEventListener("dt:lead", controlla);
    const t = window.setTimeout(fine, capMs);
  });
}

export type FoldHooks = { arm: () => void; shown: () => void; start: () => void };

// Ruoli il cui stato nascosto vive sui figli: il contenitore va a 1 inline.
const STATO_SUI_FIGLI = '[data-reveal="title"], [data-reveal="accent"], [data-reveal="lead"]';
const LEAD_DA_SPEZZARE = '[data-reveal="lead"][data-lead="pending"]';

// Gruppi già partiti in questa pagina: al riarmo (cambio lingua, reduced-motion che torna) nascono pieni.
const partiti = new WeakSet<Element>();

/** I membri del gruppo: i [data-reveal] che non stanno in un gruppo annidato, compreso il gruppo. */
function membri(group: HTMLElement): HTMLElement[] {
  return [
    ...(group.matches("[data-reveal]") ? [group] : []),
    ...Array.from(group.querySelectorAll<HTMLElement>("[data-reveal]")).filter((m) => m.closest("[data-reveal-group]") === group),
  ];
}

/** I tre gesti della piega sopra `play` del motore, senza importarlo (niente cicli). */
export function foldHooks(
  group: HTMLElement,
  play: (el: Element, dir: "in" | "out", o?: { instant?: boolean }) => void,
): FoldHooks {
  // Nello stesso task (spec §2.5): rete CSS spenta, contenitori dei ruoli a caratteri e righe a 1
  // inline, `data-reveal-armed`; subito dopo lo stato del motore, scritto senza transizione
  // (`play` con `instant` scrive la posa con gsap.set, istantaneo per costruzione: nessuna
  // transizione, nessun reflow). Con `nascosto` un Lead non ancora spezzato resta dipinto a 0,02:
  // le sue righe arrivano con lo split.
  const assesta = (nascosto: boolean) => {
    for (const el of membri(group)) {
      el.style.animation = "none";
      if (nascosto && el.matches(LEAD_DA_SPEZZARE)) el.style.opacity = "var(--dt-painted)";
      else if (el.matches(STATO_SUI_FIGLI)) el.style.opacity = "1";
      el.setAttribute("data-reveal-armed", "");
    }
  };
  return {
    arm: () => {
      assesta(true);
      play(group, "out", { instant: true });
    },
    shown: () => {
      group.removeAttribute(FOLD_PENDING);
      assesta(false);
      play(group, "in", { instant: true });
      partiti.add(group);
    },
    start: () => {
      group.removeAttribute(FOLD_PENDING);
      // Un Lead spezzato dopo `arm` ha le righe nuove: il `fromTo` di `play` le prende dalla posa
      // d'ingresso nello stesso task, e il paragrafo torna a 1.
      for (const el of membri(group)) {
        if (el.matches('[data-reveal="lead"][data-lead="split"]')) el.style.opacity = "1";
      }
      play(group, "in");
      partiti.add(group);
    },
  };
}

/** Arma un gruppo che interseca il viewport; restituisce l'annullamento. */
export function foldArm(group: HTMLElement, h: FoldHooks): () => void {
  const primo = group.matches("[data-reveal]") ? group : (group.querySelector("[data-reveal]") ?? group);
  // Nasce pieno senza passare dallo stato nascosto (D21: il testo già dipinto non sparisce sotto
  // gli occhi) un gruppo già partito, uno con la rete CSS già scattata e, per D46, ogni gruppo
  // quando la radice non porta `data-hero-intro`. Senza l'attributo la regola dello 0,02 non vale:
  // il testo è a 1 dal primo paint e non ha la CSSAnimation `dt-reveal-failsafe`, e foldNetFired
  // dà falso. Succede con reduced-motion che torna a pagina aperta (onMotionChange di
  // reveal-engine.ts toglie l'attributo e non lo rimette) e col boot script di layout.tsx
  // interrotto prima dell'attributo (sessionStorage che lancia); HeroCinematic.tsx legge la stessa
  // assenza come «non animare».
  if (partiti.has(group) || !document.documentElement.hasAttribute("data-hero-intro") || foldNetFired(primo)) {
    h.shown();
    return () => {};
  }
  let annullato = false;
  let ferma: () => void = () => {};
  group.setAttribute(FOLD_PENDING, "");
  const parti = () => {
    h.arm();
    if (curtainPending()) {
      ferma = afterCurtain(h.start);
    } else {
      const t = window.setTimeout(h.start, 150);
      ferma = () => window.clearTimeout(t);
    }
  };
  if (group.closest(`[${FOLD_LCP}]`) === null) {
    // Teste con la foto (PageHero): nessuna attesa, lo stato nascosto nello stesso task.
    parti();
  } else {
    void Promise.all([afterFirstLcp(), leadsReady(group)]).then(() => {
      if (annullato) return;
      if (foldNetFired(primo)) {
        h.shown();
        return;
      }
      parti();
    });
  }
  return () => {
    annullato = true;
    ferma();
    group.removeAttribute(FOLD_PENDING);
  };
}
