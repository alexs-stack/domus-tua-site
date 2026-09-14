// Lo stato dipinto e la piega (spec §2.5; A20 di Alberto: H1 per lettera anche sopra la
// piega, D21, D32). Prima del JS ogni ruolo del testo non armato sta a 0,02 con una rete a
// tempo; è l'unico stato nascosto scritto in CSS. Le reti usano gli orologi dell'intro
// (intro-constants.ts, che intro-clocks.test.ts presidia): qui si pretende che la regola nuova
// non li tocchi, che il motore passi dalla piega senza armare prima di fold.ts e che le reti del
// motore non facciano partire un gruppo mentre la piega aspetta.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { HERO_REST_MS, HERO_REST_SHORT_MS, HERO_REST_WARM_MS } from "../motion/intro-constants";

const ROOT = process.cwd();
const leggi = (p: string) => readFileSync(join(ROOT, p), "utf8");
/* I commenti vanno via prima di cercare (schema di logo-colore.test.ts). */
const soloCodice = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
const css = leggi("app/globals.css");
const gsapTs = leggi("app/lib/motion/gsap.ts");
const fold = soloCodice(leggi("app/lib/motion/fold.ts"));
const engine = soloCodice(leggi("app/lib/motion/reveal-engine.ts"));
const lead = soloCodice(leggi("app/components/motion/Lead.tsx"));

const NON_ARMATO = "[data-reveal]:not([data-reveal-armed]):not([data-motion-freeze] *)";
const blocco = (sel: string) => {
  const i = css.indexOf(`${sel} {`);
  assert.ok(i > -1, `selettore assente: ${sel}`);
  return css.slice(i, css.indexOf("}", i) + 1);
};
/** Il corpo di una funzione di primo livello di `src` (il motore, se non si dice), fino alla funzione dopo. */
const corpo = (nome: string, src = engine) => {
  const i = src.search(new RegExp(`(^|\\n)(export )?function ${nome}\\(`));
  assert.ok(i > -1, `manca function ${nome}`);
  const j = src.slice(i + 1).search(/\n(export )?function /);
  return src.slice(i, j < 0 ? undefined : i + 1 + j);
};

describe("stato dipinto a 0,02", () => {
  test("la base: 0,02 e rete a HERO_REST_WARM_MS", () => {
    const b = blocco(`:root[data-hero-intro] ${NON_ARMATO}`);
    assert.ok(b.includes("opacity: var(--dt-painted);"), b);
    assert.ok(b.includes(`animation: dt-reveal-failsafe 0.5s ease ${HERO_REST_WARM_MS / 1000}s forwards;`), b);
  });

  test("col film HERO_REST_MS, con la porta corta HERO_REST_SHORT_MS, e la stessa specificità della base", () => {
    assert.ok(blocco(`:root[data-hero-intro="intro"] ${NON_ARMATO}`).includes(`animation-delay: ${HERO_REST_MS / 1000}s;`));
    assert.ok(blocco(`:root[data-hero-intro="short"] ${NON_ARMATO}`).includes(`animation-delay: ${HERO_REST_SHORT_MS / 1000}s;`));
    assert.equal(HERO_REST_SHORT_MS, 1080);
    // A specificità pari vince l'ultima regola (spec §2.5): il ritardo di "intro" e "short"
    // batte lo shorthand della base solo se le due varianti la seguono nel foglio.
    const iBase = css.indexOf(`:root[data-hero-intro] ${NON_ARMATO} {`);
    const iIntro = css.indexOf(`:root[data-hero-intro="intro"] ${NON_ARMATO} {`);
    const iShort = css.indexOf(`:root[data-hero-intro="short"] ${NON_ARMATO} {`);
    assert.ok(iBase > -1 && iBase < iIntro && iBase < iShort, "le varianti del ritardo devono seguire la base");
  });

  test("keyframe nuova; le quattro reti dell'hero e il selettore html[…] di intro-clocks restano soli", () => {
    assert.match(css, /@keyframes dt-reveal-failsafe \{\s*to \{\s*opacity: 1;\s*\}\s*\}/);
    assert.doesNotMatch(css, /html\[data-hero-intro="intro"\] \[data-reveal\]/);
    assert.equal((css.match(/animation: dt-rest-failsafe 0\.5s ease [\d.]+s forwards/g) ?? []).length, 4);
  });

  test("--dt-painted vale `painted` di gsap.ts, cioè 0,02", () => {
    const c = css.match(/--dt-painted:\s*([\d.]+)/);
    const g = gsapTs.match(/export const painted = ([\d.]+)/);
    assert.ok(c && g, "manca --dt-painted o painted");
    assert.equal(Number(c![1]), Number(g![1]));
    assert.equal(Number(g![1]), 0.02);
  });
});

describe("la piega", () => {
  test("fold.ts esporta le tre funzioni di spec §2.7, quelle della piega e i due attributi", () => {
    for (const n of ["curtainPending", "afterCurtain", "foldNetFired", "afterFirstLcp", "fontsOrTimeout", "leadsReady", "foldHooks", "foldArm"]) {
      assert.match(fold, new RegExp(`export function ${n}\\b`), n);
    }
    assert.match(fold, /export const FOLD_LCP = "data-fold-lcp";/);
    assert.match(fold, /export const FOLD_PENDING = "data-fold-pending";/);
  });

  test("la rete si legge sull'orologio di dt-reveal-failsafe con le costanti dell'intro", () => {
    assert.match(fold, /animationName === "dt-reveal-failsafe"/);
    for (const n of ["HERO_REST_MS", "HERO_REST_SHORT_MS", "HERO_REST_WARM_MS"]) assert.match(fold, new RegExp(`\\b${n}\\b`), n);
    assert.doesNotMatch(fold, /\b1080\b/, "la porta corta si legge da HERO_REST_SHORT_MS");
  });

  test("senza la CSSAnimation della rete foldNetFired non la dichiara scattata", () => {
    assert.match(fold, /if \(!anim\) return false;/);
    assert.match(fold, /typeof t0 === "number" && performance\.now\(\) - t0 >= restMs/);
  });

  test("senza data-hero-intro sulla radice il gruppo nasce pieno, prima di ogni stato nascosto (D21, D46)", () => {
    // Senza l'attributo la regola dello 0,02 non vale e il testo è a 1 dal primo paint
    // (reduced-motion che torna a pagina aperta, boot script interrotto): foldNetFired lì dà
    // falso, quindi la condizione sta nel ramo di h.shown() in testa a foldArm, prima di
    // FOLD_PENDING e di h.arm().
    const f = corpo("foldArm", fold);
    const iAttr = f.search(/!document\.documentElement\.hasAttribute\("data-hero-intro"\)/);
    const iShown = f.indexOf("h.shown()");
    const iPending = f.indexOf("setAttribute(FOLD_PENDING");
    const iArm = f.indexOf("h.arm()");
    assert.ok(iAttr > -1, "foldArm non guarda data-hero-intro sulla radice");
    assert.ok(iAttr < iShown && iShown < iPending && iPending < iArm, "il controllo di data-hero-intro deve stare nel ramo pieno in testa a foldArm");
  });

  test("l'attesa della prima voce LCP vale solo sotto data-fold-lcp; data-fold-pending copre l'attesa", () => {
    assert.match(fold, /group\.closest\(`\[\$\{FOLD_LCP\}\]`\)/);
    assert.match(fold, /setAttribute\(FOLD_PENDING, ""\)/);
    assert.match(fold, /removeAttribute\(FOLD_PENDING\)/);
  });

  test("il motore passa dalla piega e scrive data-reveal-armed solo fuori dal ramo della piega", () => {
    assert.match(engine, /from "\.\/fold"/);
    const arm = corpo("arm");
    assert.match(arm, /g\.stopFold = foldArm\(\s*group\s*,\s*foldHooks\(\s*group\s*,\s*play\s*\)\s*\)/);
    const iFold = arm.indexOf('if (where === "fold")');
    const iArmed = arm.indexOf('setAttribute("data-reveal-armed"');
    assert.ok(iFold > -1 && iArmed > iFold, "data-reveal-armed scritto prima del ramo della piega: la regola dello 0,02 smetterebbe di valere");
  });

  test("durante l'arrivo al frammento la testa in vista nasce piena senza passare dalla piega (D39, spec §2.4)", () => {
    // Su /vendi#contatti le teste in vista alla prima passata le scavalca lo scroll nativo:
    // l'attesa della piega le farebbe entrare sopra il viewport (reveal-engine.spec.ts, «con l'ancora…»).
    const arm = corpo("arm");
    const iArriving = arm.search(/\barriving\b/);
    const iFoldArm = arm.indexOf("foldArm(");
    assert.ok(iArriving > -1 && iFoldArm > iArriving, "arm deve guardare arriving prima di foldArm");
    assert.match(arm.slice(iArriving, iFoldArm), /foldHooks\(\s*group\s*,\s*play\s*\)\.shown\(\)/);
  });

  test("declassamento per membro, reti e resync ferme durante l'attesa, disarm pulisce gli stili", () => {
    assert.match(corpo("collect"), /demote\(declared, m\)/);
    for (const n of ["onHits", "netPass", "sweep", "resync", "onFocusIn"]) assert.match(corpo(n), /folding\(g\)/, n);
    const d = corpo("disarm");
    assert.match(d, /removeProperty\("opacity"\)/);
    assert.match(d, /removeProperty\("animation"\)/);
  });

  test("Lead aspetta l'LCP solo sotto data-fold-lcp, non riallinea un gruppo in attesa e rispetta MotionFreeze", () => {
    assert.match(lead, /closest\(`\[\$\{FOLD_LCP\}\]`\)/);
    assert.match(lead, /hasAttribute\(FOLD_PENDING\)/);
    assert.match(lead, /useMotionFrozen\(\)/);
  });
});
