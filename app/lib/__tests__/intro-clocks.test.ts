// Gli orologi dell'intro: uno solo, e tutti gli altri derivati.
//
// La lezione dei «sette orologi» (docs/mobile-parity.md §5.2, mobile-parity-2
// §3.3): failsafe di boot, riarmo negli abort, autohide CSS, rete dell'hero,
// warmup del telefono, budget e2e, reti a valle — ognuno col suo numero,
// ognuno «allineato» agli altri a parole. Da qui in poi nascono tutti da
// app/lib/motion/intro-constants.ts. Ma dal 2026-08-17 (opzione D) il FILM
// INTERO vive in CSS — le keyframe dei quattro atti, l'autohide, la rete
// dell'hero — e il failsafe in una template string (il boot script del
// layout): questo test li rilegge dal sorgente con una regex e pretende che
// delay, durate e bezier combacino con le costanti e con le ease di gsap.ts.
// Un orologio cambiato da solo fa fallire `npm test` — che è esattamente il
// punto.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  INTRO_MS,
  INTRO_T,
  PRE_FAILSAFE_MS,
  PRE_AUTOHIDE_MS,
  HERO_REST_MS,
  HERO_REST_WARM_MS,
  WARM_FIRST_FOLD_MS,
} from "../motion/intro-constants";

const root = join(__dirname, "..", "..", "..");
const read = (rel: string) => readFileSync(join(root, rel), "utf8");
const css = read("app/globals.css");
const layout = read("app/layout.tsx");
const gsapTs = read("app/lib/motion/gsap.ts");
const preloader = read("app/components/motion/Preloader.tsx");
const e2e = read("e2e/mobile-motion.spec.ts");

/** Secondi da una stringa CSS «1.3s» / «0.5s». */
const sec = (s: string) => Number.parseFloat(s);

/**
 * Estrae `animation: NAME DUR EASE DELAY both` di una regola il cui selettore
 * contiene `sel`. Tollera spazi e a capo; il DELAY è o un tempo secco o
 * `calc(BASEs + var(--i, 0) * STAGGERs)`.
 */
function animationOf(sel: string, scope = String.raw`html\[data-preloader\]`) {
  const re = new RegExp(
    String.raw`${scope} \.dt-preloader ${sel.replace(/[[\]]/g, "\\$&")}\s*\{[^}]*?animation:\s*([\w-]+)\s+([\d.]+)s\s+([^\s]+(?:\([^)]*\))?)\s+(?:calc\(([\d.]+)s \+ var\(--i, 0\) \* ([\d.]+)s\)|([\d.]+)s)\s+(?:both|forwards)`
  );
  const m = css.match(re);
  assert.ok(m, `nessuna animation trovata per ${sel} in globals.css`);
  return {
    name: m[1],
    dur: sec(m[2]),
    ease: m[3],
    base: m[4] !== undefined ? sec(m[4]) : sec(m[6]),
    stagger: m[5] !== undefined ? sec(m[5]) : 0,
  };
}

/** Lo scope delle keyframe degli atti II-IV: la CSS guida, salvo ripiego GSAP. */
const CSS_DRIVES = String.raw`html\[data-preloader\]:not\(\[data-pre-gsap\]\)`;

/** I numeri di una `cubic-bezier(a, b, c, d)`. */
const bezier = (s: string) => {
  const m = s.match(/^cubic-bezier\(([^)]*)\)$/);
  assert.ok(m, `${s}: non è una cubic-bezier`);
  return m![1].split(",").map((n) => Number.parseFloat(n));
};
/** La bezier di una CustomEase di gsap.ts (`"a,b,c,d"` o path `M0,0 Ca,b c,d 1,1`). */
const gsapEase = (name: string) => {
  const m = gsapTs.match(new RegExp(String.raw`CustomEase\.create\("${name.replace(".", "\\.")}", "([^"]+)"\)`));
  assert.ok(m, `${name} non trovata in gsap.ts`);
  const nums = m![1].replace(/^M0,0\s*C/, "").split(/[\s,]+/).map((n) => Number.parseFloat(n));
  return nums.slice(0, 4);
};

describe("intro-constants: la sorgente", () => {
  test("INTRO_MS è la fine del tuffo (dive + diveDur), 4 630 ms", () => {
    assert.equal(INTRO_MS, Math.round((INTRO_T.dive + INTRO_T.diveDur) * 1000));
    assert.equal(INTRO_MS, 4630);
  });

  test("la rete dell'hero scatta al tuffo più un margine, DENTRO l'intro (opzione D)", () => {
    // Le lettere dell'hero devono accendersi quando la porta si apre anche
    // senza JS: la rete CSS sta dopo il tuffo (con margine) e prima della
    // fine dell'intro — non un secondo dopo, come quando era solo un failsafe.
    assert.ok(HERO_REST_MS >= INTRO_T.dive * 1000 + 100, `HERO_REST_MS ${HERO_REST_MS} troppo presto`);
    assert.ok(HERO_REST_MS <= INTRO_MS, `HERO_REST_MS ${HERO_REST_MS} > INTRO_MS`);
    assert.equal(HERO_REST_MS, Math.round((INTRO_T.dive + 0.2) * 1000));
  });

  test("autohide e failsafe stanno DOPO la fine del film, in quest'ordine", () => {
    // Il film è tutto CSS: né l'autohide né il failsafe possono tagliarlo.
    // Prima sfuma l'overlay (autohide), poi cade l'attributo (failsafe).
    assert.equal(PRE_AUTOHIDE_MS, INTRO_MS + 100);
    assert.equal(PRE_FAILSAFE_MS, INTRO_MS + 600);
    assert.ok(PRE_AUTOHIDE_MS > INTRO_MS);
    assert.ok(PRE_FAILSAFE_MS > PRE_AUTOHIDE_MS);
  });

  test("il warmup del telefono scade prima del tuffo (≤ intro − tuffo)", () => {
    assert.ok(WARM_FIRST_FOLD_MS <= INTRO_MS - INTRO_T.diveDur * 1000);
  });

  test("act1End copre davvero l'ultima lettera in moto (la firma, 13 chars)", () => {
    const lastScript = INTRO_T.script + INTRO_T.scriptDur + 12 * INTRO_T.scriptStagger;
    const lastTitle = INTRO_T.chars + INTRO_T.charsDur + 7 * INTRO_T.charsStagger;
    assert.ok(INTRO_T.act1End >= lastScript - 1e-9, `act1End ${INTRO_T.act1End} < ${lastScript}`);
    assert.ok(INTRO_T.act1End >= lastTitle);
    // e la porta parte dopo che le lettere sono ferme? No: parte a 2,25 con
    // la firma ancora in coda (per 0,4 s) — è il film del desktop, voluto.
    // Ma il congedo del lockup deve arrivare quando l'atto I è finito, o si
    // congederebbe una riga ancora in salita.
    assert.ok(INTRO_T.exit + INTRO_T.exitDur >= INTRO_T.act1End);
  });
});

describe("layout.tsx: il boot script interpola le costanti", () => {
  const m = layout.match(/const preloaderBootScript = `([^`]*)`/);
  assert.ok(m, "preloaderBootScript non trovato in layout.tsx");
  const script = m![1];

  test("il failsafe è ${PRE_FAILSAFE_MS}, non un numero", () => {
    assert.match(script, /h\.removeAttribute\("data-preloader"\)\},\$\{PRE_FAILSAFE_MS\}\)/);
    assert.doesNotMatch(script, /\b(1800|2500|4500|5230)\b/);
    // Un solo numero, nessuna soglia di larghezza per il failsafe: l'unico
    // 767.98 ammesso è il `media` del preload della sagoma (stesso confine
    // del <source> della shell), che non è un orologio.
    assert.doesNotMatch(script.replace(/lk\("[^"]+","\([^)]+\)"\)/g, ""), /max-width: 767\.98px/);
    assert.match(script, /rel="preload"[\s\S]*raffaela-sagoma-m\.webp[\s\S]*\(max-width: 767\.98px\)/);
  });

  test("la chiave di sessione è ${INTRO_KEY}", () => {
    assert.match(script, /sessionStorage\.getItem\("\$\{INTRO_KEY\}"\)/);
    assert.doesNotMatch(script, /dt-intro-seen/);
  });

  test("stampa __dtPreT0 e data-locale (contratto con Preloader.tsx e la CSS del payoff)", () => {
    assert.match(script, /window\.__dtPreT0=performance\.now\(\)/);
    assert.match(script, /h\.setAttribute\("data-locale",lc\?lc\[2\]:"it"\)/);
    assert.match(script, /dt_locale=\(it\|en\|fr\|de\|es\)/);
  });
});

describe("globals.css: i numeri rimasti in CSS combaciano", () => {
  test("autohide = PRE_AUTOHIDE_MS in entrambe le liste (ripiego e CSS che guida), nessun override mobile", () => {
    const m = css.match(/dt-pre-autohide 0\.5s ease ([\d.]+)s forwards/g);
    assert.ok(m && m.length === 2, "attese DUE occorrenze di dt-pre-autohide (lista base + lista con porta e tuffo)");
    for (const r of m!) assert.equal(sec(r.match(/ease ([\d.]+)s/)![1]) * 1000, PRE_AUTOHIDE_MS);
    assert.doesNotMatch(css, /dt-preloader-boot/); // il primo fotogramma è la shell stessa
    assert.doesNotMatch(css, /animation-delay: 2\.3s/);
  });

  test("le @property della maschera sono registrate (senza, le keyframe scatterebbero al 50 %)", () => {
    for (const p of ["--arch-w", "--arch-y"]) {
      assert.match(css, new RegExp(String.raw`@property ${p} \{\s*syntax: "<length>";\s*inherits: true;\s*initial-value: 0px;`));
    }
    assert.match(css, /@property --arch-s \{\s*syntax: "<number>";\s*inherits: true;\s*initial-value: 1;/);
    // e il valore vero (vw/vh) sta in una regola normale, non nell'initial-value
    assert.doesNotMatch(css, /initial-value: [\d.]+v[wh]/);
  });

  test("atto III/IV: porta e tuffo = INTRO_T.arch/archDur e dive/diveDur, due animazioni sovrapposte", () => {
    const m = css.match(
      new RegExp(
        String.raw`${CSS_DRIVES} \.dt-preloader \{\s*animation:\s*dt-pre-door ([\d.]+)s (cubic-bezier\([^)]*\)) ([\d.]+)s both,\s*dt-pre-dive ([\d.]+)s (cubic-bezier\([^)]*\)) ([\d.]+)s forwards,\s*dt-pre-autohide`
      )
    );
    assert.ok(m, "lista animation porta+tuffo non trovata");
    assert.equal(sec(m![1]), INTRO_T.archDur);
    assert.equal(sec(m![3]), INTRO_T.arch);
    assert.equal(sec(m![4]), INTRO_T.diveDur);
    assert.equal(sec(m![6]), INTRO_T.dive);
    // Le bezier SONO le ease di gsap.ts: porta = domus.inOut, tuffo = dtDiveIn.
    assert.deepEqual(bezier(m![2]), gsapEase("domus.inOut"));
    assert.deepEqual(bezier(m![5]), gsapEase("dtDiveIn"));
    // Il tuffo parte dal valore della porta al suo istante: --arch-k = ease(0,8).
    assert.match(css, /--arch-k: 0\.972;/);
    assert.match(css, /@keyframes dt-pre-dive \{\s*from \{\s*--arch-w: calc\(var\(--arch-w0\) \+ \(var\(--arch-w1\) - var\(--arch-w0\)\) \* var\(--arch-k\)\)/);
    // La porta va a --arch-y1 (15/16 vh) e a --arch-w1; il tuffo a −100vh e --arch-w2.
    assert.match(css, /@keyframes dt-pre-door \{[^}]*from \{[^}]*--arch-y: 104vh/);
    assert.match(css, /@keyframes dt-pre-dive \{[\s\S]*?to \{\s*--arch-w: var\(--arch-w2\);\s*--arch-y: -100vh;\s*--arch-s: var\(--arch-s2\)/);
  });

  test("atto II: linea di carica (progress 0,55/0,25 · track 0,60/1,55) con linear() campionata da dtLoader", () => {
    const p = animationOf("[data-pre-progress]", CSS_DRIVES);
    assert.equal(p.base, INTRO_T.progress);
    assert.equal(p.dur, 0.25);
    const t = animationOf("[data-pre-track]", CSS_DRIVES);
    assert.equal(t.name, "dt-pre-track");
    assert.equal(t.base, INTRO_T.track);
    assert.equal(t.dur, INTRO_T.trackDur);
    // la bezier è il ripiego; la linear() sta nella longhand subito dopo
    const lin = css.match(/\[data-pre-track\] \{[^}]*animation-timing-function: linear\(\s*0 0%,([\s\S]*?)1 100%\s*\)/);
    assert.ok(lin, "linear() della linea di carica non trovata");
    const pts = lin![1].split(",").filter((s) => s.trim()).length + 2;
    assert.ok(pts >= 12 && pts <= 20, `linear() con ${pts} punti: attesi 12-20`);
    // e la CustomEase dtLoader esiste ancora in gsap.ts (il ripiego GSAP la usa)
    assert.match(gsapTs, /CustomEase\.create\(\s*"dtLoader"/);
  });

  test("congedo del lockup = INTRO_T.exit/exitDur, domus.inOut; sipario di ripiego = curtain/curtainDur", () => {
    const e = animationOf("[data-pre-content]", CSS_DRIVES);
    assert.equal(e.name, "dt-pre-exit");
    assert.equal(e.base, INTRO_T.exit);
    assert.equal(e.dur, INTRO_T.exitDur);
    assert.deepEqual(bezier(e.ease), gsapEase("domus.inOut"));
    const c = animationOf("[data-pre-panel]", CSS_DRIVES);
    assert.equal(c.name, "dt-pre-curtain");
    assert.equal(c.base, INTRO_T.curtain);
    assert.equal(c.dur, INTRO_T.curtainDur);
    assert.deepEqual(bezier(c.ease), gsapEase("domus.inOut"));
    // il sipario vive SOLO dove la maschera non può esistere
    assert.match(css, /@supports not \(mask-composite: add\) \{\s*html\[data-preloader\]:not\(\[data-pre-gsap\]\) \.dt-preloader \[data-pre-panel\]/);
  });

  test("lo skip in CSS: html[data-pre-skip] manda al tuffo (delay negativi = durate; il tuffo da --pre-skip)", () => {
    assert.match(css, /html\[data-preloader\]\[data-pre-skip\]:not\(\[data-pre-gsap\]\) \.dt-preloader \{\s*animation-delay: -1\.1s, var\(--pre-skip, 0s\), calc\(var\(--pre-skip, 0s\) \+ 1\.6s\)/);
    assert.match(css, /\[data-pre-skip\][^{]*\[data-pre-track\] \{\s*animation-delay: -1\.55s/);
    assert.match(css, /\[data-pre-skip\][^{]*\[data-pre-content\] \{\s*animation-delay: -0\.55s/);
  });

  test("le geometrie dell'arco sono custom property (desktop 24→36→125 / 15vh; telefono 40→58→165 / 16vh)", () => {
    assert.match(css, /--arch-w0: 24vw;\s*--arch-w1: 36vw;\s*--arch-w2: 125vw;\s*--arch-y1: 15vh;\s*--arch-s1: 1\.5;\s*--arch-s2: 5\.2083;/);
    assert.match(css, /--arch-w0: 40vw;\s*--arch-w1: 58vw;\s*--arch-w2: 165vw;\s*--arch-y1: 16vh;\s*--arch-s1: 1\.45;\s*--arch-s2: 4\.125;/);
    // la maschera si applica da sola sotto @supports, senza aspettare la classe del JS
    assert.match(css, /@supports \(mask-composite: add\) \{\s*\.dt-preloader,\s*\.dt-arch-mask \{/);
  });

  test("hero-rest / hero-intro: HERO_REST_MS con l'intro, HERO_REST_WARM_MS senza, a ogni larghezza", () => {
    const m = css.match(/animation: dt-rest-failsafe 0\.5s ease ([\d.]+)s forwards/g);
    assert.ok(m && m.length === 4, "attese quattro reti dt-rest-failsafe (rest/intro × caldo/intro)");
    const delays = m!.map((r) => sec(r.match(/ease ([\d.]+)s/)![1]) * 1000).sort((a, b) => a - b);
    assert.deepEqual(delays, [HERO_REST_MS, HERO_REST_MS, HERO_REST_WARM_MS, HERO_REST_WARM_MS]);
    // la rete corta è SOLO per l'intro: selettore col valore "intro"
    assert.match(css, /html\[data-hero-rest="intro"\] \.dt-hero-rest \{\s*animation: dt-rest-failsafe 0\.5s ease 3\.33s/);
    assert.match(css, /html\[data-hero-intro="intro"\][^{]*\{\s*animation: dt-rest-failsafe 0\.5s ease 3\.33s/);
    // e il boot script marca "intro" solo quando l'intro suona
    assert.match(layout, /h\.setAttribute\("data-hero-rest",pre\?"intro":""\)/);
    assert.doesNotMatch(css, /animation-delay: 4s/);
  });

  test("atto I: chars del titolo (1,3 s, dtOut, 0,12 + i×0,075)", () => {
    const a = animationOf("[data-pre-char]");
    assert.equal(a.dur, INTRO_T.charsDur);
    assert.equal(a.base, INTRO_T.chars);
    assert.equal(a.stagger, INTRO_T.charsStagger);
    assert.match(a.ease, /^cubic-bezier\(/);
  });

  test("atto I: firma (1,3 s, 0,60 + i×0,065), caps (0,85 s, 0,40 + i×0,11), payoff (1,25 s, 0,65 + i×0,14)", () => {
    const s = animationOf("[data-pre-schar]");
    assert.equal(s.dur, INTRO_T.scriptDur);
    assert.equal(s.base, INTRO_T.script);
    assert.equal(s.stagger, INTRO_T.scriptStagger);
    const c = animationOf("[data-pre-cap]");
    assert.equal(c.dur, INTRO_T.capsDur);
    assert.equal(c.base, INTRO_T.caps);
    assert.equal(c.stagger, INTRO_T.capsStagger);
    const w = animationOf("[data-pre-word]");
    assert.equal(w.dur, INTRO_T.payoffDur);
    assert.equal(w.base, INTRO_T.payoff);
    assert.equal(w.stagger, INTRO_T.payoffStagger);
    const f = animationOf("[data-pre-figure]");
    assert.equal(f.dur, INTRO_T.figureDur);
    assert.equal(f.base, INTRO_T.figure);
  });

  test("l'ease dell'atto I in CSS è la stessa bezier di `dtOut` in gsap.ts", () => {
    const dtOut = gsapTs.match(/CustomEase\.create\("dtOut", "([^"]+)"\)/);
    assert.ok(dtOut, "dtOut non trovata in gsap.ts");
    const nums = dtOut![1].split(",").map((n) => Number.parseFloat(n));
    for (const sel of ["[data-pre-char]", "[data-pre-schar]", "[data-pre-cap]", "[data-pre-word]"]) {
      const a = animationOf(sel);
      const b = a.ease.match(/^cubic-bezier\(([^)]*)\)$/);
      assert.ok(b, `${sel}: ease non è una cubic-bezier`);
      assert.deepEqual(
        b![1].split(",").map((n) => Number.parseFloat(n)),
        nums,
        `${sel}: cubic-bezier ≠ dtOut`
      );
    }
  });

  test("le keyframe dei chars fanno la trasformazione del desktop (rotateY/rotateX, non un fade)", () => {
    assert.match(css, /@keyframes dt-pre-char \{[^}]*from \{[^}]*perspective\(800px\) translateY\(50%\) rotateY\(90deg\)/);
    assert.match(css, /@keyframes dt-pre-schar \{[^}]*from \{[^}]*perspective\(800px\) translateX\(6vw\) rotateX\(90deg\)/);
    assert.match(css, /@keyframes dt-pre-word \{[^}]*translateY\(110%\)/);
    // Le animazioni PER RIGA del vecchio montaggio mobile non esistono più.
    assert.doesNotMatch(css, /dt-pre-in-line|dt-pre-in-side/);
  });

  test("gli anelli eco seguono l'arco via transform (--arch-s), non via width/height/top", () => {
    const echo = css.match(/\.dt-preloader \[data-pre-arch-echo="1"\] \{[^}]*\}/);
    assert.ok(echo);
    assert.match(echo![0], /scale\(var\(--arch-s\)\)/);
    assert.doesNotMatch(echo![0], /\btop:\s*calc|width:\s*calc\(var\(--arch-w\)/);
    // e sotto i 768 non sono più display:none: l'unico display:none degli
    // anelli è dove la maschera non esiste (@supports not mask-composite),
    // non più la classe `is-arch` del JS né il blocco mobile
    const hidden = css.match(/\[data-pre-arch-echo\] \{\s*display: none;/g) ?? [];
    assert.equal(hidden.length, 1);
    assert.match(css, /@supports not \(mask-composite: add\) \{\s*\.dt-preloader \[data-pre-arch-echo\] \{\s*display: none;/);
    assert.doesNotMatch(css, /:not\(\.is-arch\) \[data-pre-arch-echo\]/);
    const mobileBlock = css.slice(css.indexOf("@media (max-width: 767.98px) {\n  /* Una porta"));
    assert.doesNotMatch(mobileBlock.slice(0, mobileBlock.indexOf("\n}\n")), /data-pre-arch-echo/);
  });
});

describe("Preloader.tsx ed e2e: nessun numero sparso", () => {
  test("Preloader.tsx usa PRE_FAILSAFE_MS/WARM_FIRST_FOLD_MS/INTRO_T, non 1800/2500/1400", () => {
    assert.match(preloader, /PRE_FAILSAFE_MS\s*\)/);
    // le scadenze del precarico sono sull'orologio del film (meno l'elapsed), non dal mount
    assert.match(preloader, /warmFirstFold\(Math\.max\(0, WARM_FIRST_FOLD_MS - filmMs\)\)/);
    assert.match(preloader, /runWarmup\(Math\.max\(0, 4500 - filmMs\)\)/);
    assert.doesNotMatch(preloader, /\b(1800|1400)\b/);
    assert.doesNotMatch(preloader, /mobile \? 1800/);
    // un solo montaggio: nessun oggetto T con `arco: 0.25`
    assert.doesNotMatch(preloader, /arco: 0\.25/);
  });

  test("Preloader.tsx: la CSS guida, GSAP solo in ripiego (registerProperty + keyframe vive → data-pre-gsap)", () => {
    assert.match(preloader, /"registerProperty" in CSS/);
    assert.match(preloader, /cssFilmAlive\(\[root, panel\]\)/);
    assert.match(preloader, /html\.setAttribute\("data-pre-gsap", ""\)/);
    assert.match(preloader, /html\.setAttribute\("data-pre-skip", ""\)/);
    assert.match(preloader, /"--pre-skip"/);
    // i timer del ramo CSS: handoff a diveAt, chiusura a INTRO_MS/curtain
    assert.match(preloader, /at\(diveAt, /);
    assert.match(preloader, /INTRO_MS \/ 1000/);
  });

  test("il budget e2e è uno solo (4 800) a ogni larghezza", () => {
    assert.match(e2e, /const budget = 4800;/);
    assert.doesNotMatch(e2e, /width < 768 \? 1900/);
    assert.ok(4800 >= INTRO_MS + 100);
  });
});
