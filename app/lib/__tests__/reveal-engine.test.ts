// IL MOTORE DEI REVEAL (A18 «Coreografia piena», A20 «Fedeltà letterale»; D21;
// spec §2.4). Entrate e uscite speculari, come ha scelto Alberto: si entra a
// filo del bordo, risalendo si esce alla linea dell'85 % e l'uscita si vede,
// dall'alto non succede niente. Replay a ogni passaggio nei due versi (C22,
// cliente 2026-08-04). Qui la logica pura del motore e le guardie sul codice e
// sulla CSS (nessuno stato nascosto in CSS: le pose le scrive GSAP inline); il
// comportamento nel browser sta in e2e/reveal-engine.spec.ts.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  decide,
  armState,
  netAction,
  sweepAction,
  effectiveTrigger,
  manualNetDue,
  exitRoot,
  intersects,
  rootFor,
  entersFromTop,
  noticeAction,
  indexByRole,
  extraSeconds,
  NET_MS,
  EXIT_LINE,
  CUE_ANCESTOR,
  FREEZE,
  type Box,
  type Dir,
  type GroupState,
} from "../motion/reveal-engine";
import { HERO_REST_MS, HERO_REST_SHORT_MS, HERO_REST_WARM_MS } from "../motion/intro-constants";

const ROOT_DIR = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT_DIR, rel), "utf8");
function soloCodice(testo: string): string {
  return testo.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}
const css = soloCodice(read("app/globals.css"));
const engine = read("app/lib/motion/reveal-engine.ts");

const VIEW: Box = { top: 0, left: 0, bottom: 1000, right: 1000 };
const STATI: GroupState[] = ["hidden", "revealing", "shown", "hiding"];

type Caso = { nome: string; r: Box; e: boolean; x: boolean; atteso: Record<GroupState, Dir | null> };
const CASI: Caso[] = [
  {
    nome: "nella fascia fra 85 % e 100 % (entra dal basso, o risalendo ci scende)",
    r: { top: 900, bottom: 1300, left: 0, right: 1000 },
    e: true,
    x: false,
    atteso: { hidden: "in", hiding: "in", shown: "out", revealing: "out" },
  },
  {
    nome: "tutto sotto il viewport",
    r: { top: 1100, bottom: 1500, left: 0, right: 1000 },
    e: false,
    x: false,
    atteso: { hidden: null, hiding: null, shown: "out", revealing: "out" },
  },
  {
    nome: "in vista sopra la linea",
    r: { top: 400, bottom: 800, left: 0, right: 1000 },
    e: true,
    x: true,
    atteso: { hidden: "in", hiding: "in", shown: null, revealing: null },
  },
  {
    nome: "uscito dall'alto",
    r: { top: -600, bottom: -10, left: 0, right: 1000 },
    e: false,
    x: false,
    atteso: { hidden: null, hiding: null, shown: null, revealing: null },
  },
  {
    nome: "rientra dall'alto",
    r: { top: -300, bottom: 200, left: 0, right: 1000 },
    e: true,
    x: true,
    atteso: { hidden: "in", hiding: "in", shown: null, revealing: null },
  },
  {
    nome: "nel nastro, a destra della linea",
    r: { top: 100, bottom: 900, left: 900, right: 1300 },
    e: true,
    x: false,
    atteso: { hidden: "in", hiding: "in", shown: "out", revealing: "out" },
  },
  {
    nome: "nel nastro, fuori a destra",
    r: { top: 100, bottom: 900, left: 1100, right: 1500 },
    e: false,
    x: false,
    atteso: { hidden: null, hiding: null, shown: "out", revealing: "out" },
  },
  {
    nome: "nel nastro, uscito a sinistra",
    r: { top: 100, bottom: 900, left: -500, right: -10 },
    e: false,
    x: false,
    atteso: { hidden: null, hiding: null, shown: null, revealing: null },
  },
];

describe("decide(): la matrice di spec §2.4", () => {
  for (const c of CASI) {
    for (const s of STATI) {
      test(`${c.nome} · ${s} → ${c.atteso[s]}`, () => {
        assert.equal(decide({ ...c.r, hit: c.e }, { ...c.r, hit: c.x }, VIEW, s), c.atteso[s]);
      });
    }
  }

  test("la linea d'uscita è all'85 %, in basso o a destra", () => {
    assert.equal(EXIT_LINE, 0.85);
    assert.deepEqual(exitRoot(VIEW, "y"), { top: 0, left: 0, bottom: 850, right: 1000 });
    assert.deepEqual(exitRoot(VIEW, "x"), { top: 0, left: 0, bottom: 1000, right: 850 });
    assert.equal(intersects({ top: 849, bottom: 900, left: 0, right: 10 }, exitRoot(VIEW, "y")), true);
    assert.equal(intersects({ top: 850, bottom: 900, left: 0, right: 10 }, exitRoot(VIEW, "y")), false);
  });
});

describe("armamento e reti", () => {
  test("armState: passato, in vista, sotto o a destra", () => {
    assert.equal(armState({ top: -400, bottom: 0, left: 0, right: 1000 }, VIEW), "passed");
    assert.equal(armState({ top: 0, bottom: 500, left: -800, right: 0 }, VIEW), "passed");
    assert.equal(armState({ top: 700, bottom: 1200, left: 0, right: 1000 }, VIEW), "fold");
    assert.equal(armState({ top: 1000, bottom: 1400, left: 0, right: 1000 }, VIEW), "below");
    assert.equal(armState({ top: 0, bottom: 800, left: 1000, right: 1400 }, VIEW), "below");
  });

  test("netAction (2.500 ms dall'armamento): hidden in vista entra, hidden passato si mostra", () => {
    assert.equal(NET_MS, 2500);
    assert.equal(netAction("hidden", { top: 900, bottom: 1300, left: 0, right: 1000 }, VIEW), "in");
    assert.equal(netAction("hidden", { top: -500, bottom: -1, left: 0, right: 1000 }, VIEW), "shown");
    assert.equal(netAction("hidden", { top: 1200, bottom: 1500, left: 0, right: 1000 }, VIEW), null);
    assert.equal(netAction("shown", { top: 100, bottom: 300, left: 0, right: 1000 }, VIEW), null);
    assert.equal(netAction("revealing", { top: 100, bottom: 300, left: 0, right: 1000 }, VIEW), null);
  });

  test("sweepAction: entra solo sopra la linea, mostra i passati; un gruppo shown finito interamente sotto esce (salto verso l'alto, C22, D40), la fascia 85-100 % resta", () => {
    assert.equal(sweepAction("hidden", { top: 400, bottom: 700, left: 0, right: 1000 }, VIEW, "y"), "in");
    assert.equal(sweepAction("hidden", { top: 900, bottom: 1200, left: 0, right: 1000 }, VIEW, "y"), null);
    assert.equal(sweepAction("hiding", { top: -900, bottom: -100, left: 0, right: 1000 }, VIEW, "y"), "shown");
    assert.equal(sweepAction("hidden", { top: 100, bottom: 900, left: 400, right: 800 }, VIEW, "x"), "in");
    assert.equal(sweepAction("hidden", { top: 100, bottom: 900, left: 900, right: 1300 }, VIEW, "x"), null);
    for (const s of ["shown", "revealing"] as const) {
      // Interamente sotto il viewport (Home, barra di scorrimento, ancora verso l'alto): l'IO non
      // vede nessun cambio d'intersezione, esce qui, istantaneo e fuori schermo (spec §2.4, «fuori sotto · shown → out»).
      assert.equal(sweepAction(s, { top: 1100, bottom: 1400, left: 0, right: 1000 }, VIEW, "y"), "out");
      assert.equal(sweepAction(s, { top: 1000, bottom: 1300, left: 0, right: 1000 }, VIEW, "y"), "out");
      // Nella fascia 85-100 %, in vista o passato sopra: resta com'è (un refresh non fa uscire un gruppo in vista).
      assert.equal(sweepAction(s, { top: 900, bottom: 1300, left: 0, right: 1000 }, VIEW, "y"), null);
      assert.equal(sweepAction(s, { top: 100, bottom: 400, left: 0, right: 1000 }, VIEW, "y"), null);
      assert.equal(sweepAction(s, { top: -400, bottom: -100, left: 0, right: 1000 }, VIEW, "y"), null);
      // Nel nastro conta la destra; in verticale un gruppo a destra non è «sotto».
      assert.equal(sweepAction(s, { top: 100, bottom: 900, left: 1000, right: 1300 }, VIEW, "x"), "out");
      assert.equal(sweepAction(s, { top: 100, bottom: 900, left: 1000, right: 1300 }, VIEW, "y"), null);
      assert.equal(sweepAction(s, { top: 1100, bottom: 1400, left: 0, right: 1000 }, VIEW, "x"), "out");
    }
    // Un gruppo che sta già uscendo non si tocca: finisce la sua uscita.
    assert.equal(sweepAction("hiding", { top: 1100, bottom: 1400, left: 0, right: 1000 }, VIEW, "y"), null);
    // Nel motore l'uscita di sweep è istantanea: applySweep porta "out" a apply(g, "out", true).
    assert.match(engine, /if \(a === "out"\) apply\(g, "out", true\);/);
  });
});

describe("gruppi manuali (spec §2.4, bloccante 2 del verdetto sistema)", () => {
  test("manuale solo sotto un corridoio acceso o il film delle stelle; altrove IO", () => {
    assert.equal(CUE_ANCESTOR, "[data-corridor][data-on], [data-set-on]");
    assert.equal(effectiveTrigger("manual", true), "manual");
    assert.equal(effectiveTrigger("manual", false), "io");
    assert.equal(effectiveTrigger("io", true), "io");
  });

  test("rete dei manuali: hidden e intersecante per 2.500 ms di fila", () => {
    assert.equal(manualNetDue("hidden", 1000, 3499), false);
    assert.equal(manualNetDue("hidden", 1000, 3500), true);
    assert.equal(manualNetDue("hidden", null, 9999), false);
    assert.equal(manualNetDue("shown", 0, 9999), false);
  });
});

describe("notifiche dell'IO: noticeAction() intorno a decide()", () => {
  const hit = (r: Box, h: boolean) => ({ ...r, hit: h });

  test("rootFor: in verticale nessuna linea a destra, nel nastro nessuna in basso", () => {
    assert.deepEqual(rootFor("y", VIEW), { top: 0, left: 0, bottom: 1000, right: Number.POSITIVE_INFINITY });
    assert.deepEqual(rootFor("x", VIEW), { top: 0, left: 0, bottom: Number.POSITIVE_INFINITY, right: 1000 });
  });

  test("un gruppo in verticale a destra dell'85 % uscito dall'alto resta shown; nel nastro, in basso e uscito a sinistra, lo stesso", () => {
    const destra: Box = { top: -600, bottom: -10, left: 900, right: 1000 };
    assert.equal(decide(hit(destra, false), hit(destra, false), VIEW, "shown"), "out", "con la radice intera la below di spec sbaglia");
    assert.equal(decide(hit(destra, false), hit(destra, false), rootFor("y", VIEW), "shown"), null);
    assert.equal(noticeAction(false, "shown", hit(destra, false), hit(destra, false), VIEW, "y"), null);
    const basso: Box = { top: 900, bottom: 1300, left: -500, right: -10 };
    assert.equal(decide(hit(basso, false), hit(basso, false), rootFor("x", VIEW), "shown"), null);
    assert.equal(noticeAction(false, "shown", hit(basso, false), hit(basso, false), VIEW, "x"), null);
  });

  test("la prima notifica non fa uscire, ma fa entrare", () => {
    const fascia: Box = { top: 900, bottom: 1300, left: 0, right: 1000 };
    assert.equal(noticeAction(true, "shown", hit(fascia, true), hit(fascia, false), VIEW, "y"), null);
    assert.deepEqual(noticeAction(false, "shown", hit(fascia, true), hit(fascia, false), VIEW, "y"), { dir: "out", instant: false });
    const vista: Box = { top: 400, bottom: 700, left: 0, right: 1000 };
    assert.deepEqual(noticeAction(true, "hidden", hit(vista, true), hit(vista, true), VIEW, "y"), { dir: "in", instant: false });
    assert.deepEqual(noticeAction(true, "hidden", hit(fascia, true), hit(fascia, false), VIEW, "y"), { dir: "in", instant: false });
  });

  test("un nascosto già passato, o che rientra dal bordo alto, diventa shown senza animare", () => {
    const passato: Box = { top: -700, bottom: -100, left: 0, right: 1000 };
    assert.deepEqual(noticeAction(true, "hidden", hit(passato, false), hit(passato, false), VIEW, "y"), { dir: "in", instant: true });
    const rientra: Box = { top: -300, bottom: 200, left: 0, right: 1000 };
    assert.deepEqual(noticeAction(false, "hidden", hit(rientra, true), hit(rientra, true), VIEW, "y"), { dir: "in", instant: true });
    assert.deepEqual(noticeAction(false, "hiding", hit(rientra, true), hit(rientra, true), VIEW, "y"), { dir: "in", instant: true });
    const sinistra: Box = { top: 100, bottom: 900, left: -300, right: 200 };
    assert.deepEqual(noticeAction(false, "hidden", hit(sinistra, true), hit(sinistra, true), VIEW, "x"), { dir: "in", instant: true });
    assert.equal(entersFromTop({ top: 900, bottom: 1300, left: 0, right: 1000 }, VIEW), false);
    assert.equal(entersFromTop(rientra, VIEW), true);
    assert.equal(entersFromTop(sinistra, VIEW, "y"), false);
    assert.equal(entersFromTop(sinistra, VIEW, "x"), true);
    assert.equal(entersFromTop({ top: -900, bottom: -100, left: 0, right: 1000 }, VIEW), false, "fuori dal viewport non entra");
  });
});

describe("indice nel gruppo e scarto di Reveal (spec §2.2, D19)", () => {
  test("indexByRole conta fra i membri dello stesso ruolo, nell'ordine del DOM", () => {
    assert.deepEqual(indexByRole(["ctn", "title", "ctn", "lead", "ctn"]), [0, 0, 1, 0, 2]);
    assert.deepEqual(indexByRole([]), []);
  });

  test("l'indice non ha tetto in indexByRole: il tetto i ≤ 5 lo mette groupDelay (text-roles.ts)", () => {
    const i = indexByRole(["ctn", "ctn", "ctn", "ctn", "ctn", "ctn", "ctn", "ctn"]);
    assert.equal(i[7], 7);
    assert.match(engine, /tweenVars\(m\.role, dir, targets\.length, m\.i\)/);
  });

  test("extraSeconds legge data-reveal-extra in ms", () => {
    assert.equal(extraSeconds("120"), 0.12);
    assert.equal(extraSeconds(null), 0);
    assert.equal(extraSeconds("abc"), 0);
    assert.equal(extraSeconds("0"), 0);
  });

  test("collect() e apply() li usano: indice per ruolo, scarto sommato al delay del tween d'ingresso", () => {
    assert.match(engine, /const index = indexByRole\(found\.map\(\(f\) => f\.role\)\);/);
    assert.match(engine, /if \(dir === "in" && m\.extra\) plan\.to\.delay \+= m\.extra;/);
    assert.match(engine, /plan\.to\.delay \+ plan\.to\.duration \+ plan\.to\.stagger \* \(targets\.length - 1\)/);
  });
});

describe("tutti i ruoli in GSAP, nessuno stato in CSS (spec §2.2)", () => {
  test("i bersagli sono i [data-c], le .dt-line o il membro stesso; fromTo in ingresso, to in uscita, set per l'istantaneo", () => {
    assert.match(engine, /return sel === null \? \[m\.el\] : Array\.from\(m\.el\.querySelectorAll<HTMLElement>\(sel\)\);/);
    assert.match(engine, /if \(plan\.from\) gsap\.fromTo\(targets, plan\.from, plan\.to\);\s*else gsap\.to\(targets, plan\.to\);/);
    assert.match(engine, /gsap\.set\(targets, restVars\(role, dir\)\);/);
    assert.doesNotMatch(engine, /data-reveal-in|data-reveal-instant|classList|setProperty\("--/);
  });

  test("il puntatore lo scrive il motore inline: via da nascosto, di nuovo attivo all'inizio dell'ingresso", () => {
    assert.match(engine, /m\.el\.style\.pointerEvents = dir === "in" \? "" : "none";/);
    const apply = engine.slice(engine.indexOf("function apply("), engine.indexOf("function observe("));
    assert.ok(apply.indexOf("pointer(m, dir)") < apply.indexOf("gsap.fromTo("), "il puntatore torna prima del tween");
    assert.match(engine, /m\.el\.style\.removeProperty\("pointer-events"\);/);
  });
});

describe("letture prima delle scritture (spec §9.3)", () => {
  test("armamento in un microtask, letture di flush() prima di arm(), salto che chiama sweep(), tempi in User Timing", () => {
    assert.match(engine, /queueMicrotask\(flush\)/);
    assert.ok(
      engine.indexOf("g.rect = boxOf(g.el.getBoundingClientRect());") < engine.indexOf("for (const g of ready) arm(g, vp);"),
      "flush() legge i rettangoli di tutti i gruppi prima di armare il primo",
    );
    assert.match(engine, /window\.addEventListener\("scroll", onScroll, \{ passive: true \}\)/);
    assert.match(engine, /performance\.measure\("dt-reveal-arm-read"/);
    assert.match(engine, /performance\.measure\("dt-reveal-arm-write"/);
    assert.match(engine, /performance\.measure\("dt-reveal-sweep"/);
  });
});

describe("D39: il refresh del motore parte a scroll fermo", () => {
  test("flush() e il ResizeObserver del body passano da refreshWhenStill(), che aspetta scrollEnd di ScrollTrigger con un tetto", () => {
    // Un ScrollTrigger.refresh() forzato scrolla a 0 e torna alla posizione registrata: dentro
    // lo scroll nativo al frammento (html { scroll-behavior: smooth }) l'arrivo si fermerebbe.
    const flush = engine.slice(engine.indexOf("function flush("), engine.indexOf("function arm("));
    assert.match(flush, /refreshWhenStill\(\);/);
    assert.doesNotMatch(flush, /requestRefresh\(\)/);
    assert.match(engine, /new ResizeObserver\(refreshWhenStill\)\.observe\(document\.body\)/);
    assert.doesNotMatch(engine, /new ResizeObserver\(requestRefresh\)/);
    const still = engine.slice(engine.indexOf("function refreshWhenStill("), engine.indexOf("function armCap("));
    assert.match(still, /if \(!arriving && !ScrollTrigger\.isScrolling\(\)\) \{\s*requestRefresh\(\);\s*return;/);
    assert.match(engine, /ScrollTrigger\.addEventListener\("scrollEnd", onStill\)/);
    assert.match(engine, /const STILL_CAP_MS = 4000;/);
    // Il tetto chiude l'arrivo, non forza il refresh dentro uno scroll (un fling su touch si fermerebbe).
    const onStill = engine.slice(engine.indexOf("function onStill("), engine.indexOf("function fragmentPending("));
    assert.match(onStill, /if \(!refreshDue \|\| ScrollTrigger\.isScrolling\(\)\) return;/);
    assert.doesNotMatch(still, /armCap\(\)/);
    // Durante l'arrivo al frammento le notifiche sono istantanee (spec §2.4: già passati → shown).
    assert.match(engine, /apply\(g, n\.dir, n\.instant \|\| arriving\)/);
  });
});

describe("cambio lingua senza disarmo (spec §2.3)", () => {
  test("RevealGroup registra per trigger e hold, riallinea per lingua con resync fuori dal contesto", () => {
    const rg = soloCodice(read("app/components/motion/RevealGroup.tsx"));
    assert.match(rg, /\{ dependencies: \[o\.trigger, o\.hold\], revertOnUpdate: true \}/);
    assert.match(rg, /queueMicrotask\(\(\) => resync\(el\)\)/);
    assert.match(rg, /\{ dependencies: \[locale\], revertOnUpdate: true \}/);
    assert.doesNotMatch(rg, /dependencies: \[locale, /);
  });

  test("resync tocca solo i bersagli GSAP senza tween, compresi quelli in attesa del delay", () => {
    assert.match(engine, /gsap\.getTweensOf\(t\)\.length === 0/);
    assert.doesNotMatch(engine, /gsap\.isTweening\(/);
  });

  test("clearProps solo in disarm()", () => {
    assert.equal((engine.match(/clearProps/g) ?? []).length, 1);
    const disarm = engine.slice(engine.indexOf("function disarm("), engine.indexOf("function onFocusIn("));
    assert.match(disarm, /clearProps/);
  });
});

describe("globals.css: nessuno stato nascosto per i membri del motore (stati solo via JS)", () => {
  test("nessuna regola su [data-reveal] porta opacità 0, transform o transizione: le pose le scrive GSAP inline", () => {
    for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (!/\[data-reveal\b/.test(m[1])) continue;
      // Lo stato dipinto a 0,02 (commit 6) scrive `opacity: var(--dt-painted)` con la sua rete: passa.
      assert.doesNotMatch(m[2], /opacity\s*:\s*0\b|transform\s*:|transition\s*:/, `stato in CSS su ${m[1].trim()}`);
    }
    assert.doesNotMatch(css, /data-reveal-in\b|data-reveal-instant|--reveal-extra/);
  });

  test("nessuno stato nascosto in CSS fuori da /case/[slug]: .reveal nudo non ha opacità 0", () => {
    assert.doesNotMatch(css, /(?<!\]\s)\.reveal\s*\{[^}]*opacity:\s*0\s*;/);
    assert.match(css, /\[data-motion-freeze\] \.reveal \{\s*opacity: 0;/);
  });

  test("nessun will-change su .reveal o sui membri", () => {
    for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (/\.reveal|\[data-reveal/.test(m[1])) assert.doesNotMatch(m[2], /will-change/, `will-change su ${m[1].trim()}`);
    }
  });

  test("reduced-motion neutralizza .reveal e il blocco congelato di /case/[slug] con la stessa specificità", () => {
    const i = css.indexOf("@media (prefers-reduced-motion: reduce)");
    assert.ok(i > -1, "manca il blocco reduced-motion");
    assert.match(
      css.slice(i, i + 600),
      /\.reveal,\s*\[data-motion-freeze\] \.reveal \{\s*opacity: 1;\s*transform: none;\s*filter: none;\s*transition: none;\s*\}/,
    );
  });

  test("lo stato dipinto non usa html[data-hero-intro] sui gruppi (intro-clocks.test.ts:264 legge quel prefisso)", () => {
    assert.doesNotMatch(css, /html\[data-hero-intro(?:="intro")?\] \[data-reveal\]/);
  });

  // Spec §9.1: le reti dello stato dipinto (spec §2.5; A20 di Alberto; D31 per la porta corta).
  // Gli orologi sono quelli dell'intro: 6 s senza film, 3,33 s col film, 1,08 s con la porta corta.
  test("dt-reveal-failsafe a 6 s, 3,33 s col film e 1,08 s con la porta corta", () => {
    const NON_ARMATO = "[data-reveal]:not([data-reveal-armed]):not([data-motion-freeze] *)";
    const regola = (sel: string) => {
      const i = css.indexOf(`${sel} {`);
      assert.ok(i > -1, `manca la regola ${sel}`);
      return css.slice(i, css.indexOf("}", i) + 1);
    };
    assert.equal(HERO_REST_WARM_MS / 1000, 6);
    assert.equal(HERO_REST_MS / 1000, 3.33);
    assert.equal(HERO_REST_SHORT_MS / 1000, 1.08);
    assert.match(regola(`:root[data-hero-intro] ${NON_ARMATO}`), /animation: dt-reveal-failsafe 0\.5s ease 6s forwards;/);
    assert.match(regola(`:root[data-hero-intro="intro"] ${NON_ARMATO}`), /animation-delay: 3\.33s;/);
    assert.match(regola(`:root[data-hero-intro="short"] ${NON_ARMATO}`), /animation-delay: 1\.08s;/);
    // A specificità pari vince l'ultima regola (spec §2.5): 3,33 s e 1,08 s valgono sullo
    // shorthand dei 6 s solo se le due varianti seguono la base nel foglio.
    const iBase = css.indexOf(`:root[data-hero-intro] ${NON_ARMATO} {`);
    const iIntro = css.indexOf(`:root[data-hero-intro="intro"] ${NON_ARMATO} {`);
    const iShort = css.indexOf(`:root[data-hero-intro="short"] ${NON_ARMATO} {`);
    assert.ok(iBase > -1 && iBase < iIntro && iBase < iShort, "le varianti del ritardo devono seguire la base");
    assert.match(css, /@keyframes dt-reveal-failsafe \{\s*to \{\s*opacity: 1;\s*\}\s*\}/);
  });
});

describe("/case/[slug]: il motore non arma sotto la guardia (A26, D32)", () => {
  test("FREEZE è [data-motion-freeze] e l'armamento lo controlla", () => {
    assert.equal(FREEZE, "[data-motion-freeze]");
    assert.match(engine, /g\.el\.closest\(FREEZE\)/);
  });
});
