// Gli orologi dell'intro: uno solo, e tutti gli altri derivati.
//
// La lezione dei «sette orologi» (docs/mobile-parity.md §5.2, mobile-parity-2
// §3.3): failsafe di boot, riarmo negli abort, autohide CSS, rete dell'hero,
// warmup del telefono, budget e2e, reti a valle — ognuno col suo numero,
// ognuno «allineato» agli altri a parole. Da qui in poi nascono tutti da
// app/lib/motion/intro-constants.ts. L'atto I vive in CSS (keyframe,
// autohide, rete dell'hero) e il failsafe in una template string (il boot
// script del layout): questo test li rilegge dal sorgente con una regex e
// pretende che delay, durate e bezier combacino con le costanti e con le ease
// di gsap.ts. Dal 22 settembre 2026 la porta è la GOMMA (DomusTuaPreloader,
// montata da Preloader.tsx): i suoi tempi sono JavaScript e stanno nel
// componente, e qui si pretende che intro-constants li ricopi uguali.
// Un orologio cambiato da solo fa fallire `npm test` — che è esattamente il
// punto.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import {
  GOMMA_LOGO,
  GOMMA_MS,
  GOMMA_REVEAL_MS,
  GOMMA_TEMPI,
  INTRO_MS,
  INTRO_T,
  PRE_FAILSAFE_MS,
  PRE_AUTOHIDE_MS,
  HERO_REST_MS,
  TEMPO,
  HERO_REST_WARM_MS,
  WARM_FIRST_FOLD_MS,
  INTRO_FILM,
  INTRO_SHORT,
  INTRO_QUIET,
  RELOAD_KEEP_Y,
  SHORT_T,
  SHORT_MS,
  PRE_SHORT_AUTOHIDE_MS,
  PRE_SHORT_FAILSAFE_MS,
  HERO_REST_SHORT_MS,
  heroRestMs,
} from "../motion/intro-constants";
import { SPEEDS } from "../../components/motion/DomusTuaPreloader";

const root = join(__dirname, "..", "..", "..");
const read = (rel: string) => readFileSync(join(root, rel), "utf8");
const css = read("app/globals.css");
const layout = read("app/layout.tsx");
const gsapTs = read("app/lib/motion/gsap.ts");
const preloader = read("app/components/motion/Preloader.tsx");
const gomma = read("app/components/motion/DomusTuaPreloader.tsx");
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
  test("INTRO_MS è la rete senza JS: dove finiva il film di prima (senzaJs)", () => {
    assert.equal(INTRO_MS, Math.round(INTRO_T.senzaJs * 1000));
    // Il VALORE è una scelta di prodotto e vive in `TEMPO` (intro-constants).
    assert.ok(INTRO_MS >= 3000 && INTRO_MS <= 12000, `INTRO_MS ${INTRO_MS} fuori campo`);
    assert.equal(INTRO_MS, Math.round(4630 * TEMPO));
  });

  test("la gomma: i tempi sono quelli del componente, e il film a tempo ne deriva", () => {
    // intro-constants non può importare un modulo "use client" (il layout server
    // riceverebbe un riferimento): ricopia SPEEDS, e qui si pretende che combaci.
    for (const v of ["normale", "veloce"] as const) {
      const { delay, draw, hold, exit } = SPEEDS[v];
      assert.deepEqual({ delay, draw, hold, exit }, GOMMA_TEMPI[v], `GOMMA_TEMPI.${v} ≠ SPEEDS.${v}`);
    }
    const n = GOMMA_TEMPI.normale;
    assert.equal(GOMMA_REVEAL_MS, Math.round(INTRO_T.gomma * 1000) + n.delay + n.draw + n.hold);
    assert.equal(GOMMA_MS, GOMMA_REVEAL_MS + n.exit);
    // La gomma entra mentre il lockup si congeda, e comincia a disegnare quando se n'è quasi andato.
    assert.ok(INTRO_T.gomma <= INTRO_T.exit, "la gomma entrerebbe col lockup ancora fermo al centro");
    assert.ok(INTRO_T.gomma + n.delay / 1000 >= INTRO_T.exit, "il tratto partirebbe prima del congedo del lockup");
    // Il JS arrivato tardi suona `veloce`, e lo skip del boot script non allunga mai l'attesa:
    // l'ultima rete di uno skip (skip + skipCoda + 0,1) sta entro l'autohide senza skip.
    assert.ok(INTRO_T.tardi > INTRO_T.gomma);
    assert.ok(INTRO_T.skip + INTRO_T.skipCoda + 0.1 <= PRE_AUTOHIDE_MS / 1000 + 1e-9);
  });

  test("la geometria della gomma è quella di default del componente (centro dello schermo, 26 % del lato minore)", () => {
    assert.match(gomma, new RegExp(String.raw`o\.size\?\.ratio \?\? ${GOMMA_LOGO.ratio}\)`));
    assert.match(gomma, new RegExp(String.raw`o\.size\?\.min \?\? ${GOMMA_LOGO.min},`));
    assert.match(gomma, new RegExp(String.raw`o\.size\?\.max \?\? ${GOMMA_LOGO.max}\)`));
    assert.match(gomma, new RegExp(String.raw`verticalCenter = ${GOMMA_LOGO.centroY},`));
    assert.match(gomma, /geo\.cx = w \/ 2;/, "il logo non sta più al centro dello schermo in orizzontale");
  });

  test("la rete dell'hero scatta dopo l'autohide senza JS", () => {
    assert.equal(HERO_REST_MS, PRE_AUTOHIDE_MS + 200);
    assert.ok(HERO_REST_MS > PRE_AUTOHIDE_MS);
  });

  test("autohide e failsafe stanno DOPO la fine della rete senza JS, in quest'ordine", () => {
    // Prima sfuma l'overlay (autohide), poi cade l'attributo (failsafe).
    assert.equal(PRE_AUTOHIDE_MS, INTRO_MS + 100);
    assert.equal(PRE_FAILSAFE_MS, INTRO_MS + 600);
    assert.ok(PRE_AUTOHIDE_MS > INTRO_MS);
    assert.ok(PRE_FAILSAFE_MS > PRE_AUTOHIDE_MS);
  });

  test("il precarico (telefono e desktop) scade prima che la gomma a tempo si allarghi: è il suo `ready`", () => {
    assert.ok(WARM_FIRST_FOLD_MS < GOMMA_REVEAL_MS);
    const m = preloader.match(/runWarmup\(Math\.max\(0, (\d+) - filmMs\)\)/);
    assert.ok(m, "runWarmup del desktop non trovato in Preloader.tsx");
    assert.ok(Number(m![1]) < GOMMA_REVEAL_MS);
  });

  // LA PORTA CORTA. Alberto il 13 settembre 2026 (A18, A20): il film intero
  // alla prima entrata nella home, la porta corta a ogni altro caricamento
  // completo (spec §6.2). Dal 22 settembre è la gomma `veloce`.
  test("gli stati della chiave sono quattro valori, e la corta ha la sua rete e la sagoma in 0,3 s", () => {
    assert.equal(INTRO_FILM, "1");
    assert.equal(INTRO_SHORT, "c");
    assert.equal(INTRO_QUIET, "q");
    assert.equal(RELOAD_KEEP_Y, 0.5);
    assert.equal(SHORT_T.senzaJs, 2.38 * TEMPO);
    assert.equal(SHORT_T.figureDur, 0.3 * TEMPO);
  });

  test("la corta è circa metà del film, e autohide, failsafe e rete ne derivano", () => {
    assert.equal(SHORT_MS, Math.round(SHORT_T.senzaJs * 1000));
    assert.equal(SHORT_MS, 2380);
    const r = SHORT_MS / INTRO_MS;
    assert.ok(r >= 0.45 && r <= 0.55, `SHORT_MS / INTRO_MS = ${r}: la corta non è il film dimezzato`);
    assert.equal(PRE_SHORT_AUTOHIDE_MS, SHORT_MS + 100);
    assert.equal(PRE_SHORT_FAILSAFE_MS, SHORT_MS + 600);
    assert.equal(HERO_REST_SHORT_MS, PRE_SHORT_AUTOHIDE_MS + 200);
  });

  test("heroRestMs legge i tre casi del boot script", () => {
    assert.equal(heroRestMs("intro"), HERO_REST_MS);
    assert.equal(heroRestMs("short"), HERO_REST_SHORT_MS);
    assert.equal(heroRestMs(""), HERO_REST_WARM_MS);
    assert.equal(heroRestMs(null), HERO_REST_WARM_MS);
  });

  test("act1End copre davvero l'ultima lettera in moto (la firma, 13 chars)", () => {
    const lastScript = INTRO_T.script + INTRO_T.scriptDur + 12 * INTRO_T.scriptStagger;
    const lastTitle = INTRO_T.chars + INTRO_T.charsDur + 7 * INTRO_T.charsStagger;
    assert.ok(INTRO_T.act1End >= lastScript - 1e-9, `act1End ${INTRO_T.act1End} < ${lastScript}`);
    assert.ok(INTRO_T.act1End >= lastTitle);
    // La gomma entra a 2,25 con la firma ancora in coda (per 0,4 s), come la
    // porta di prima. Ma il congedo del lockup deve arrivare quando l'atto I è
    // finito, o si congederebbe una riga ancora in salita.
    assert.ok(INTRO_T.exit + INTRO_T.exitDur >= INTRO_T.act1End);
  });
});

describe("layout.tsx: il boot script interpola le costanti", () => {
  const m = layout.match(/const preloaderBootScript = `([^`]*)`/);
  assert.ok(m, "preloaderBootScript non trovato in layout.tsx");
  const script = m![1];

  test("il failsafe è ${PRE_FAILSAFE_MS} per il film e ${PRE_SHORT_FAILSAFE_MS} per la corta, non un numero", () => {
    // La chiusura del film è una funzione sola (`fine`), armata a
    // ${PRE_FAILSAFE_MS} e RI-armata a ${SKIP_TAIL_MS} quando il boot script
    // serve uno skip. La corta ha la sua (`fineS`), senza skip (D31).
    assert.match(script, /var fine=function\(\)\{[\s\S]*?h\.removeAttribute\("data-preloader"\)\}/);
    assert.match(script, /setTimeout\(fine,\$\{PRE_FAILSAFE_MS\}\)/);
    assert.match(script, /setTimeout\(fine,\$\{SKIP_TAIL_MS\}\)/);
    assert.match(script, /setTimeout\(fineS,\$\{PRE_SHORT_FAILSAFE_MS\}\)/);
    assert.match(script, /if\(t>=\$\{SKIP_S\}\)return;/);
    assert.match(layout, /const SKIP_S = INTRO_T\.skip;/);
    assert.match(layout, /const SKIP_TAIL_MS = Math\.round\(\(INTRO_T\.skipCoda \+ 0\.35\) \* 1000\);/);
    assert.doesNotMatch(script, /\b(1800|2500|4500|5230|2380|2980)\b/);
    // Un solo numero, nessuna soglia di larghezza per il failsafe: l'unico
    // 767.98 ammesso è il `media` del preload della sagoma (stesso confine
    // del <source> della shell), che non è un orologio.
    assert.doesNotMatch(script.replace(/lk\("[^"]+","\([^)]+\)"\)/g, ""), /max-width: 767\.98px/);
    assert.match(script, /rel="preload"[\s\S]*raffaela-sagoma-villa-m\.webp[\s\S]*\(max-width: 767\.98px\)/);
  });

  test("la chiave di sessione è ${INTRO_KEY}, letta una volta, coi quattro stati interpolati", () => {
    assert.equal((script.match(/sessionStorage\.getItem\("\$\{INTRO_KEY\}"\)/g) ?? []).length, 1);
    assert.doesNotMatch(script, /dt-intro-seen/);
    for (const nome of ["INTRO_FILM", "INTRO_SHORT", "INTRO_QUIET", "LAST_Y_KEY", "RELOAD_KEEP_Y"]) {
      assert.ok(script.includes("${" + nome + "}"), `il boot script non interpola ${nome}`);
    }
    // Nessun valore della chiave scritto a mano.
    assert.doesNotMatch(script, /setItem\("\$\{INTRO_KEY\}","[^$]/);
  });

  test("la macchina a stati: gate, film, corta (spec §6.2; A26, D31)", () => {
    const righe = [
      'var p=location.pathname;var home=p==="/";var caso=p.indexOf("/case/")===0;',
      'var nav=ne?ne.type:"navigate";',
      'var vis=document.visibilityState==="visible"&&!document.prerendering;',
      'var cssOk=typeof CSS!=="undefined"&&"registerProperty" in CSS&&CSS.supports("mask-composite","add");',
      // Riga 11 della tabella di spec §6.2 e D31: la ricarica lontana dalla
      // cima non ha né corta né film, quindi la condizione sta in gate.
      'var gate=m&&!deep&&vis&&!caso&&k!=="${INTRO_QUIET}"&&nav!=="back_forward"&&!(ly>innerHeight*${RELOAD_KEEP_Y});',
      'var pre=gate&&home&&k!=="${INTRO_FILM}";',
      'var short=gate&&!pre&&cssOk;',
      'if(nav==="reload"){try{var s=JSON.parse(sessionStorage.getItem("${LAST_Y_KEY}")||"null");if(s&&s.p===p)ly=s.y}catch(e){}}',
    ];
    for (const r of righe) assert.ok(script.includes(r), `manca nel boot script: ${r}`);
    assert.ok(
      script.indexOf('if(nav==="reload"){') < script.indexOf("var gate="),
      "ly si legge dopo gate: la riga 11 guarderebbe sempre 0",
    );
    assert.match(script, /performance\.getEntriesByType\("navigation"\)/);
    // A26: nessun ramo che arma un sipario apposta per /case/*.
    assert.doesNotMatch(script, /\(caso&&/);
    assert.equal((script.match(/h\.setAttribute\("data-preloader"/g) ?? []).length, 2);
  });

  test("?intro toglie la chiave prima di leggerla, e solo senza ancora; l'ancora segna il film solo su «/»", () => {
    const togli = 'if(!deep&&/[?&]intro(&|=|$)/.test(location.search)){try{sessionStorage.removeItem("${INTRO_KEY}")}catch(e){}}';
    const iTogli = script.indexOf(togli);
    const iLeggi = script.indexOf('sessionStorage.getItem("${INTRO_KEY}")');
    assert.ok(iTogli > -1, "manca il ramo ?intro");
    assert.ok(iTogli < iLeggi, "il ramo ?intro deve venire prima della lettura della chiave");
    assert.ok(script.includes('if(deep&&home){try{sessionStorage.setItem("${INTRO_KEY}","${INTRO_FILM}")}catch(e){}}'));
  });

  test("il film scrive la chiave all'armamento; la corta solo a chiave assente, e fineS non la scrive", () => {
    const iPre = script.indexOf("if(pre){");
    const iShort = script.indexOf("}else if(short){");
    const iM = script.indexOf("if(m){", iShort);
    assert.ok(iPre > -1 && iShort > iPre && iM > iShort, "rami if(pre) / else if(short) / if(m) non trovati in quest'ordine");
    // La corta finisce dove comincia il guardiano della ricarica (D65), che
    // ascolta i gesti per ritirarsi e non è uno skip.
    const iTop = script.indexOf('if((pre||short)&&nav==="reload"){', iShort);
    const film = script.slice(iPre, iShort);
    const corta = script.slice(iShort, iTop > iShort && iTop < iM ? iTop : iM);
    assert.ok(film.includes('sessionStorage.setItem("${INTRO_KEY}","${INTRO_FILM}")'), "il film non segna INTRO_FILM all'armamento");
    assert.ok(!corta.includes("${INTRO_FILM}"), "la corta scrive INTRO_FILM: la home non darebbe più il film");
    assert.ok(corta.includes('if(!k){try{sessionStorage.setItem("${INTRO_KEY}","${INTRO_SHORT}")}catch(e){}}'));
    assert.ok(corta.includes('var fineS=function(){h.removeAttribute("data-preloader")};'));
    assert.ok(corta.includes('h.setAttribute("data-preloader",home?"short":"short-page")'));
    assert.ok(!corta.includes("pointerdown") && !corta.includes("keydown"), "la corta non ha skip (D31)");
    assert.match(corta, /if\(home\)\{lk\("\/media\/raffaela-sagoma-villa-m\.webp"/);
  });

  test("il banner cookie aspetta l'handoff anche sotto la corta", () => {
    assert.ok(script.includes("if(!pre&&!short&&!/(^|; )dt_consent=(accepted|rejected)(;|$)/.test(document.cookie))"));
  });

  test("stampa __dtPreT0 e data-locale (contratto con Preloader.tsx e la CSS del payoff)", () => {
    assert.match(script, /window\.__dtPreT0=performance\.now\(\)/);
    assert.match(script, /h\.setAttribute\("data-locale",lc\?lc\[2\]:"it"\)/);
    assert.match(script, /dt_locale=\(it\|en\|fr\|de\|es\)/);
  });

  test("D65: alla ricarica con un sipario il guardiano tiene la pagina in cima e si ritira solo a sipario caduto", () => {
    const i = script.indexOf('if((pre||short)&&nav==="reload"){');
    const iM = script.indexOf("if(m){", i);
    assert.ok(i > script.indexOf("}else if(short){") && iM > i, "il guardiano non sta fra i rami del sipario e if(m)");
    const g = script.slice(i, iM);
    // Il ripristino nativo spento e ogni scroll sotto il guardiano riportato a 0, senza la curva di html.
    assert.ok(g.includes('window.__dtPreTop=1;try{history.scrollRestoration="manual"}catch(e){}'));
    assert.ok(g.includes('tg=function(){try{if(scrollY)scrollTo({top:0,behavior:"instant"})}catch(e){}}'));
    assert.ok(g.includes('addEventListener("scroll",tg,{passive:true})'));
    // Ritiro: attributo caduto e load passato da due fotogrammi, o gesto dell'utente a sipario caduto.
    assert.ok(g.includes('tf=function(){if(tl&&!h.hasAttribute("data-preloader"))tx()}'));
    assert.ok(g.includes('ti=function(){if(!h.hasAttribute("data-preloader"))tx()}'));
    assert.ok(g.includes('addEventListener("load",function(){requestAnimationFrame(function(){requestAnimationFrame(function(){tl=1;tf()})})})'));
    assert.ok(g.includes('to.observe(h,{attributeFilter:["data-preloader"]})'));
    // Al ritiro "auto", anche nella memoria di ScrollTrigger (Preloader.tsx).
    assert.ok(g.includes('tx=function(){if(!window.__dtPreTop)return;window.__dtPreTop=0;'), "il ritiro non è idempotente");
    assert.ok(g.includes('try{history.scrollRestoration="auto"}catch(e){}if(window.__dtPreTopOff)window.__dtPreTopOff()'));
    assert.equal((script.match(/scrollRestoration=/g) ?? []).length, 2, "scrollRestoration si scrive solo nel guardiano");
    assert.match(preloader, /flags\.__dtPreTopOff = auto;/);
    assert.match(preloader, /const auto = \(\) => ScrollTrigger\.clearScrollMemory\("auto"\);/);
    assert.match(preloader, /if \(flags\.__dtPreTop === 0\) auto\(\);/);
  });
});

describe("globals.css: i numeri rimasti in CSS combaciano", () => {
  test("autohide = PRE_AUTOHIDE_MS (la rete senza JS); la corta riscrive il delay; la gomma la spegne", () => {
    const m = css.match(/dt-pre-autohide 0\.5s ease ([\d.]+)s forwards/g);
    assert.ok(m && m.length === 1, "attesa UNA occorrenza di dt-pre-autohide (la rete del film)");
    assert.equal(sec(m![0].match(/ease ([\d.]+)s/)![1]) * 1000, PRE_AUTOHIDE_MS);
    assert.doesNotMatch(css, /dt-preloader-boot/); // il primo fotogramma è la shell stessa
    const base = css.search(/html\[data-preloader\] \.dt-preloader \{\s*animation: dt-pre-autohide/);
    const corta = css.search(
      new RegExp(String.raw`html\[data-preloader\^="short"\] \.dt-preloader \{\s*animation-delay: ${PRE_SHORT_AUTOHIDE_MS / 1000}s;`),
    );
    assert.ok(base > -1 && corta > base, "la rete della corta deve seguire quella del film (stessa specificità)");
    // Col JS la gomma è montata: il suo foglio fa da fondo e la rete tace.
    assert.match(css, /html\[data-preloader\]\[data-gomma\] \.dt-preloader \{\s*animation: none;/);
    assert.match(css, /html\[data-preloader\]\[data-gomma\] \.dt-preloader \[data-pre-panel\] \{\s*background-color: transparent;/);
  });

  test("la porta ad arco non esiste più: niente @property, keyframe, maschera, anelli, ripiego GSAP", () => {
    assert.doesNotMatch(css, /@property --arch-|--arch-w|--arch-y|--arch-k/);
    assert.doesNotMatch(css, /dt-pre-door|dt-pre-dive|dt-pre-curtain|dt-arch-mask|data-pre-arch-echo/);
    assert.doesNotMatch(css, /data-pre-gsap/);
    assert.doesNotMatch(preloader, /data-pre-gsap|cssFilmAlive|dt-pre-door|--arch-/);
    assert.doesNotMatch(read("app/components/motion/PreloaderShell.tsx"), /data-pre-arch-echo/);
  });

  test("la gomma in CSS: lo slot, il foglio per stato, il sito cliccabile all'allargamento, il cerchio su fondo e sagoma", () => {
    assert.match(css, /\.dt-preloader \[data-pre-gomma\] \{\s*display: contents;/);
    assert.match(css, /\.dt-preloader \{\s*--dt-gomma-foglio: var\(--color-espresso\);/);
    assert.match(css, /html\[data-preloader\^="short"\] \.dt-preloader \{\s*--dt-gomma-foglio: var\(--color-cream-deep\);/);
    assert.match(css, /html\[data-preloader\]\[data-gomma="reveal"\] \.dt-preloader \{\s*pointer-events: none;/);
    for (const sel of [String.raw`\.dt-pre-fondo`, String.raw`\[data-pre-figure\]`]) {
      assert.match(
        css,
        new RegExp(String.raw`html\[data-preloader\]\[data-gomma="reveal"\] \.dt-preloader ${sel} \{[^}]*mask-image: radial-gradient\([^;]*var\(--gomma-x[^;]*transparent var\(--gomma-r, 0px\)`),
        `${sel}: niente cerchio che segue la cancellatura`,
      );
    }
    // Lo slot è il PRIMO figlio del pannello: la gomma dipinge sotto fondo e sagoma.
    const shell = read("app/components/motion/PreloaderShell.tsx");
    const iPanel = shell.indexOf("<div data-pre-panel");
    const iSlot = shell.indexOf("<div data-pre-gomma />");
    const iFondo = shell.indexOf('className="dt-pre-fondo');
    assert.ok(iPanel > -1 && iSlot > iPanel && iFondo > iSlot, "lo slot della gomma non è il primo figlio del pannello");
  });

  test("atto II: linea di carica (progress 0,55/0,25 · track 0,60/1,55) con linear() campionata da dtLoader", () => {
    const p = animationOf("[data-pre-progress]");
    assert.equal(p.base, INTRO_T.progress);
    assert.equal(p.dur, 0.25 * TEMPO);
    const t = animationOf("[data-pre-track]");
    assert.equal(t.name, "dt-pre-track");
    assert.equal(t.base, INTRO_T.track);
    assert.equal(t.dur, INTRO_T.trackDur);
    // la bezier è il ripiego; la linear() sta nella longhand subito dopo
    const lin = css.match(/\[data-pre-track\] \{[^}]*animation-timing-function: linear\(\s*0 0%,([\s\S]*?)1 100%\s*\)/);
    assert.ok(lin, "linear() della linea di carica non trovata");
    const pts = lin![1].split(",").filter((s) => s.trim()).length + 2;
    assert.ok(pts >= 12 && pts <= 20, `linear() con ${pts} punti: attesi 12-20`);
    // e la CustomEase dtLoader esiste ancora in gsap.ts (la sorgente della curva)
    assert.match(gsapTs, /CustomEase\.create\(\s*"dtLoader"/);
  });

  test("la linea di carica del film campiona dtLoader su ancoraggi e punti di errore massimo (spec §6.2)", () => {
    // lane-globali.md §4.7: dai 17 punti a passo fisso (errore massimo 0,0087)
    // ai 17 punti sugli ancoraggi del path e sui punti di errore massimo (0,0032).
    const lin = css.match(/\[data-pre-track\] \{[^}]*animation-timing-function: linear\(([\s\S]*?)\);/);
    assert.ok(lin, "linear() della linea di carica non trovata");
    const punti = lin![1].split(",").map((s) => s.trim().replace(/\s+/g, " "));
    assert.deepEqual(punti, [
      "0 0%", "0.154 6.5%", "0.283 12.9%", "0.378 18.6%", "0.414 21.2%", "0.442 23.8%",
      "0.482 28.2%", "0.504 31.3%", "0.54 39.6%", "0.584 52.2%", "0.595 53.9%", "0.615 55.8%",
      "0.75 65%", "0.826 71.4%", "0.866 76%", "0.91 82.6%", "1 100%",
    ]);
    // il ripiego senza linear() resta la bezier di oggi
    assert.match(css, /animation: dt-pre-track 1\.55s cubic-bezier\(0\.2, 0\.45, 0, 0\.25\) 0\.6s both;/);
  });

  test("congedo del lockup = INTRO_T.exit/exitDur, domus.inOut", () => {
    const e = animationOf("[data-pre-content]");
    assert.equal(e.name, "dt-pre-exit");
    assert.equal(e.base, INTRO_T.exit);
    assert.equal(e.dur, INTRO_T.exitDur);
    assert.deepEqual(bezier(e.ease), gsapEase("domus.inOut"));
    assert.match(css, /\.dt-preloader \{\s*--pre-exit-y: -28px;/);
    assert.match(css, /@media \(max-width: 767\.98px\) \{\s*\.dt-preloader \{\s*--pre-exit-y: -20px;/);
  });

  test("lo skip in CSS: html[data-pre-skip] manda l'atto I alla fine e la rete a --pre-skip + skipCoda + 0,1", () => {
    const sec = (n: number) => String(Number(n.toFixed(3)));
    assert.match(
      css,
      new RegExp(
        `html\\[data-preloader\\]\\[data-pre-skip\\] \\.dt-preloader \\{\\s*animation-delay: calc\\(var\\(--pre-skip, 0s\\) \\+ ${sec(INTRO_T.skipCoda + 0.1)}s\\);`,
      ),
    );
    assert.match(css, new RegExp(`\\[data-pre-skip\\][^{]*\\[data-pre-track\\] \\{\\s*animation-delay: -${sec(INTRO_T.trackDur)}s`));
    assert.match(css, new RegExp(`\\[data-pre-skip\\][^{]*\\[data-pre-content\\] \\{\\s*animation-delay: -${sec(INTRO_T.exitDur)}s`));
  });

  test("hero-rest / hero-intro: HERO_REST_MS col film, HERO_REST_SHORT_MS con la corta, HERO_REST_WARM_MS senza", () => {
    const m = css.match(/animation: dt-rest-failsafe 0\.5s ease ([\d.]+)s forwards/g);
    assert.ok(m && m.length === 6, "attese sei reti dt-rest-failsafe (rest/intro × caldo/film/corta)");
    const delays = m!.map((r) => sec(r.match(/ease ([\d.]+)s/)![1]) * 1000).sort((a, b) => a - b);
    assert.deepEqual(
      delays,
      [HERO_REST_SHORT_MS, HERO_REST_SHORT_MS, HERO_REST_MS, HERO_REST_MS, HERO_REST_WARM_MS, HERO_REST_WARM_MS].sort(
        (a, b) => a - b,
      ),
    );
    // Il testo esatto, niente regex coi numeri interpolati (sono già costate
    // un falso verde).
    const casi: Array<[string, number]> = [
      ['html[data-hero-rest="intro"] .dt-hero-rest', HERO_REST_MS],
      ['html[data-hero-intro="intro"]', HERO_REST_MS],
      ['html[data-hero-rest="short"] .dt-hero-rest', HERO_REST_SHORT_MS],
      ['html[data-hero-intro="short"]', HERO_REST_SHORT_MS],
    ];
    for (const [sel, ms] of casi) {
      const attesa = `animation: dt-rest-failsafe 0.5s ease ${ms / 1000}s forwards;`;
      const i = css.indexOf(sel);
      assert.ok(i > -1, `selettore assente: ${sel}`);
      assert.ok(css.slice(i, i + 260).includes(attesa), `${sel} non porta «${attesa}»`);
    }
    // e il boot script marca "intro" col film, "short" con la corta
    assert.match(
      layout,
      /var v=pre\?"intro":short\?"short":"";h\.setAttribute\("data-hero-rest",v\);h\.setAttribute\("data-hero-intro",v\)/,
    );
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

  test("il badge gira in senso ORARIO, anello e monogramma nello stesso verso (cliente, 2026-09-10)", () => {
    // Il difetto che blinda: il monogramma girava `reverse` (antiorario)
    // mentre l'header era già stato messo in senso orario — la direttiva era
    // stata applicata a spinMarkBadge, che il preloader non usa più.
    const spin = (sel: string) => {
      const m = css.match(
        new RegExp(String.raw`html\[data-preloader\] \.dt-preloader \[${sel}\]\s*\{[^}]*?animation:\s*([^;]+);`)
      );
      assert.ok(m, `nessuna animation per [${sel}] in globals.css`);
      return m![1].trim();
    };
    const ring = spin("data-rot-ring");
    const mark = spin("data-rot-mark");
    assert.equal(ring, mark, "anello e monogramma devono girare con la stessa animazione (stesso verso)");
    assert.match(ring, /^dt-pre-spin\b/);
    assert.doesNotMatch(ring, /\b(reverse|alternate)\b/, "il badge gira al contrario");
    // e le keyframe vanno da 0 a +360: orario.
    assert.match(css, /@keyframes dt-pre-spin \{\s*to \{\s*transform: rotate\(360deg\);/);
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
  });

  test("Preloader.tsx monta la gomma nello slot, all'ora del film, e le passa il precarico come `ready`", () => {
    assert.match(preloader, /import DomusTuaPreloader, \{ BOX, type PreloaderSpeed \} from "\.\/DomusTuaPreloader";/);
    assert.match(preloader, /createPortal\(\s*<DomusTuaPreloader/);
    assert.match(preloader, /root\.querySelector<HTMLElement>\("\[data-pre-gomma\]"\)/);
    assert.match(preloader, /sheetColor="var\(--dt-gomma-foglio\)"/);
    assert.match(preloader, /zIndex=\{0\}/);
    assert.match(preloader, /ready=\{pronta\}/);
    // quando: a INTRO_T.gomma, `veloce` se il JS è arrivato dopo INTRO_T.tardi
    assert.match(preloader, /at\(INTRO_T\.gomma, \(\) => monta\(now\(\) >= INTRO_T\.tardi \? "veloce" : "normale"\)\)/);
    // la rete CSS già partita: nessuna gomma, si chiude come avrebbe fatto la rete
    assert.match(preloader, /const reteAt = \(short \? PRE_SHORT_AUTOHIDE_MS : PRE_AUTOHIDE_MS\) \/ 1000;/);
    // l'handoff è l'allargamento, la chiusura la fine della gomma
    assert.match(preloader, /const onReveal = \(\) => \{[\s\S]*?fireIntro\(\);[\s\S]*?orologioEntrata\(DISCESA\.entrata\);/);
    assert.match(preloader, /const onDone = \(\) => \{\s*if \(vivo\) finish\(true\);/);
    // lo skip: l'atto I alla fine e la gomma `veloce`, con l'ora del film in --pre-skip
    assert.match(preloader, /html\.setAttribute\("data-pre-skip", ""\)/);
    assert.match(preloader, /"--pre-skip"/);
    // e lo skip del boot script si ritira, o la sua rete strapperebbe la gomma veloce a metà
    assert.match(preloader, /boot\(\)\.__dtPreSkipOff\?\.\(\);/);
    assert.match(preloader, /window\.clearTimeout\(boot\(\)\.__dtPreFailsafe\);\s*setGomma\(/);
    // il cerchio che segue la cancellatura legge il tratto e il logo del componente
    assert.match(preloader, /slot\.querySelector\("\[data-gomma-swell\]"\)/);
    assert.match(preloader, /slot\.querySelector\("\[data-gomma-logo\]"\)/);
    assert.match(gomma, /ref=\{swellRef\}\s*data-gomma-swell=""/);
    assert.match(gomma, /<g ref=\{logoRef\} data-gomma-logo="">/);
  });

  test("il componente scrive data-gomma, non data-preloader, e ha classe e keyframe sue", () => {
    assert.doesNotMatch(gomma, /dataset\.preloader/);
    assert.equal((gomma.match(/html\.dataset\.gomma = /g) ?? []).length, 4);
    assert.match(gomma, /className="dt-gomma"/);
    assert.match(gomma, /@keyframes dt-gomma-failsafe/);
    assert.doesNotMatch(gomma, /className="dt-preloader"/);
  });

  test("Preloader.tsx: la corta è la gomma veloce, niente skip, niente chiave del film", () => {
    assert.match(preloader, /getAttribute\("data-preloader"\)\?\.startsWith\("short"\) \?\? false/);
    assert.match(preloader, /if \(short\) \{\s*monta\("veloce"\);/);
    assert.match(preloader, /if \(completed && !short\) \{/);
    assert.match(preloader, /sessionStorage\.setItem\(INTRO_KEY, INTRO_FILM\)/);
    assert.doesNotMatch(preloader, /sessionStorage\.setItem\(INTRO_KEY, "1"\)/);
    assert.match(
      preloader,
      /if \(!short\) \{\s*window\.addEventListener\("pointerdown", onPointerSkip\);\s*window\.addEventListener\("keydown", onKeySkip\);/,
    );
    assert.match(preloader, /short \? PRE_SHORT_FAILSAFE_MS : PRE_FAILSAFE_MS/);
    assert.match(preloader, /if \(short\) \{\s*scaldata = Promise\.resolve\(\);/);
  });

  test("le reti a valle scelgono il ritardo con heroRestMs, senza un secondo orologio scritto a mano", () => {
    // Il codice senza commenti: HeroCinematic.tsx cita «1920×1080» in un commento.
    const soloCodice = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
    // CookieConsent.tsx sta in lista dal blocco 23 (audit del 21 settembre 2026,
    // difetto V01): aspettava l'handoff con una rete sua a HERO_REST_MS secco, cioè
    // l'orologio del film anche sulla porta corta (2,25 s di ritardo in più se
    // l'evento va perso); ora passa da afterCurtain di fold.ts, che sceglie il
    // ritardo con heroRestMs come tutte le altre reti a valle.
    const files: Array<[string, string]> = [
      ["app/components/HeroCinematic.tsx", soloCodice(read("app/components/HeroCinematic.tsx"))],
      ["app/lib/motion/fold.ts", soloCodice(read("app/lib/motion/fold.ts"))],
      ["app/components/CookieConsent.tsx", soloCodice(read("app/components/CookieConsent.tsx"))],
    ];
    for (const [nome, src] of files) {
      assert.doesNotMatch(src, /\? HERO_REST_MS : HERO_REST_WARM_MS/, `${nome}: ternario a due casi, la corta cadrebbe a 6 s`);
      assert.doesNotMatch(src, /SHORT_REST_MS|\b(1080|2680|3330|4930|6000)\b/, `${nome}: un ritardo di rete scritto a mano`);
      assert.doesNotMatch(src, /\bHERO_REST_(MS|WARM_MS|SHORT_MS)\b/, `${nome}: sceglie la rete senza heroRestMs`);
    }
    // Dal commit 8 l'hero non ha reti sue: passano da fold.ts, che le sceglie
    // in due punti (la rete di afterCurtain e foldNetFired), entrambi con heroRestMs.
    const fold = files[1][1];
    assert.equal(
      (fold.match(/heroRestMs\(document\.documentElement\.getAttribute\("data-hero-intro"\)\)/g) ?? []).length,
      2,
      "fold.ts: afterCurtain e foldNetFired devono leggere la rete con heroRestMs",
    );
    // Il banner cookie non tiene un orologio suo: la rete è quella di afterCurtain,
    // che si cancella all'handoff (V01: la rete armata dopo l'evento riapriva una
    // scelta già fatta) e non ha né setTimeout né INTRO_EVENT scritti a mano.
    const cookie = files[2][1];
    assert.match(cookie, /afterCurtain\(/, "CookieConsent.tsx: la rete dopo il sipario è afterCurtain di fold.ts");
    assert.doesNotMatch(cookie, /setTimeout\(|INTRO_EVENT/, "CookieConsent.tsx: un secondo orologio o un secondo ascoltatore dell'handoff accanto ad afterCurtain");
  });

  test("nessuno scrive più la chiave del film per togliersi il sipario: fixture, sonde e misure scrivono INTRO_QUIET", () => {
    // Spec §6.2 (A18, A20; D31): "1" vuol dire «film armato» e sotto quella
    // chiave suona la corta. Chi vuole la pagina senza sipario scrive "q".
    const cartelle = ["e2e", "scripts", "docs/superpowers/specs/2026-09-13-coreografia-era-residence/misure"];
    const colpevoli: string[] = [];
    const visita = (dir: string) => {
      for (const nome of readdirSync(join(root, dir))) {
        const rel = `${dir}/${nome}`;
        if (statSync(join(root, rel)).isDirectory()) visita(rel);
        else if (/\.(ts|mjs|js|cjs)$/.test(nome) && /sessionStorage\.setItem\(\s*[^,()]+,\s*["']1["']\s*\)/.test(read(rel))) colpevoli.push(rel);
      }
    };
    for (const c of cartelle) visita(c);
    assert.deepEqual(colpevoli, [], `scrivono ancora "1": ${colpevoli.join(", ")}`);
  });

  test("il budget e2e è uno solo, derivato da GOMMA_MS, a ogni larghezza", () => {
    // Derivato, non scritto: se cambia TEMPO o la velocità della gomma il budget lo segue da sé.
    assert.match(e2e, /const budget = GOMMA_MS \+ \d+;/);
    assert.doesNotMatch(e2e, /width < 768 \? 1900/);
  });
});

/* ─────────────────────────────────────────────────────────────────────────
   LA SAGOMA NELLA SUA SCATOLA. La sagoma di Raffaela nel sipario sta nella
   banda dell'hero (sotto la testata, alta `--dt-band-h`), col ritaglio del
   piede. Dal 22 settembre (A55) la foto sotto è quella vera della piscina e le
   due figure non coincidono più, per scelta di Alberto; dal 22 settembre sera
   la porta non è più l'arco ma la gomma, che disegna il cuore a destra della
   mano tesa di lei. Il patto che resta è la SCATOLA: stessa banda, stessi
   confini, così la sagoma resta dov'era.
   ───────────────────────────────────────────────────────────────────────── */
describe("la sagoma nella sua scatola: la banda dell'hero", () => {
  const shell = read("app/components/motion/PreloaderShell.tsx");
  const hero = read("app/components/HeroCinematic.tsx");

  test("i due numeri della scatola esistono e sono UNO solo", () => {
    assert.match(css, /--dt-head-h:\s*clamp\([^;]+\);/);
    // A44 (20 set. 2026): lo schermo intero meno la testata, non più 60svh.
    assert.match(css, /--dt-band-h:\s*calc\(100svh - var\(--dt-head-h\) - 1px\);/);
  });

  test("la sagoma e' ancorata alla banda (top = testata, altezza = banda)", () => {
    const rule = css.match(/\.dt-preloader \[data-pre-figure\] \{[^}]*\}/);
    assert.ok(rule, "manca la regola di posizione della sagoma");
    assert.match(rule![0], /top:\s*calc\(var\(--dt-head-h\) \+ 1px\)/);
    assert.match(rule![0], /height:\s*var\(--dt-band-h\)/);
    // e non e' tornata a tutto schermo
    assert.doesNotMatch(rule![0], /height:\s*100(svh|vh|%)/);
  });

  // A49 (22 set. 2026, sera): l'hero è la foto ALTA in flusso (HeroCinematic.tsx, la testa di era
  // senza blocco) e la banda è il suo primo schermo: la salita a riposo dello strato legge
  // `--dt-band-h` (globals.css, «L'HERO ALTO DELLA HOME»), non più un'altezza scritta nel markup.
  test("la banda dell'hero legge lo stesso token: la salita a riposo dello strato è misurata sulla banda", () => {
    assert.doesNotMatch(hero, /h-\[var\(--dt-band-h\)\]/, "l'hero non ha più una banda alta --dt-band-h nel markup (A49)");
    // D-A75-1: la salita a riposo porta le suole di Raffaela al fondo della banda, meno il respiro.
    assert.match(css, /\.dt-hero \.dt-testa_strato \{[^}]*calc\(var\(--dt-band-h\) - 100% \* var\(--dt-hero-piedi\) \* var\(--dt-hero-hw\) - var\(--dt-hero-respiro\)\)/);
  });

  test("la sagoma tiene il suo ritaglio; la foto sotto è intera, dalla cima, sugli stessi due confini", () => {
    // A44: il piede della foto (100 % in verticale) per la sagoma. A49: la foto alta non si ritaglia (A27,
    // A45): comincia dalla cima, la scatola ha il suo rapporto, e i due file cambiano a 768 come la sagoma.
    assert.match(shell, /objectPosition:\s*"10% 100%"/, "la sagoma non usa il ritaglio del piede");
    assert.match(hero, /objectPosition:\s*"50% 0%"/, "la foto dell'hero non comincia dalla cima");
    assert.doesNotMatch(hero, /objectPosition:\s*"10% 100%"/, "la foto alta porta il ritaglio della sagoma: A49 la vuole intera");
    assert.doesNotMatch(shell, /objectPosition:\s*"10% 0%"/);
    // e i due canvas coincidono: gli stessi due confini (767.98 / 768).
    assert.match(shell, /raffaela-sagoma-villa-m\.webp[\s\S]*raffaela-sagoma-villa\.webp/);
    assert.match(hero, /<source media="\(min-width: 768px\)" srcSet=\{fotoDesktop\}/);
    assert.doesNotMatch(shell, /objectPosition:\s*"50% 70%"/);
  });

  test("la vecchia «fascia» non torna a spostare la sagoma", () => {
    assert.doesNotMatch(css, /--dt-fascia-w/);
  });
});

/* LA PORTA CORTA IN CSS. Alberto il 13 settembre 2026 (A18, A20; D31): salta
   lockup, didascalie, linea e payoff; la sagoma solo su «/»; il pannello (e il
   foglio della gomma) su avorio profondo, senza il fondo espresso. */
describe("la porta corta in CSS", () => {
  // globals.css ha le fini riga CRLF sui checkout Windows (core.autocrlf):
  // qui solo regex con \s*, mai "\n" letterali.
  test("salta [data-pre-content]; la sagoma solo su «/», in SHORT_T.figureDur", () => {
    assert.match(css, /html\[data-preloader\^="short"\] \.dt-preloader \[data-pre-content\] \{\s*display: none;/);
    assert.match(
      css,
      new RegExp(
        String.raw`html\[data-preloader="short"\] \.dt-preloader \[data-pre-figure\] \{\s*animation: dt-pre-in-fade ${SHORT_T.figureDur}s linear 0s both;`,
      ),
      "la sagoma della corta di «/» non entra in 0,3 s",
    );
    assert.match(css, /html\[data-preloader="short-page"\] \.dt-preloader \[data-pre-figure\] \{\s*display: none;/);
  });

  test("pannello e foglio della gomma su avorio profondo, senza .dt-pre-fondo (D31)", () => {
    assert.match(
      css,
      /html\[data-preloader\^="short"\] \.dt-preloader \[data-pre-panel\] \{\s*background-color: var\(--color-cream-deep\);/,
    );
    assert.match(css, /html\[data-preloader\^="short"\] \.dt-pre-fondo \{\s*display: none;/);
    assert.match(css, /html\[data-preloader\^="short"\] \.dt-preloader \{\s*--dt-gomma-foglio: var\(--color-cream-deep\);/);
  });

  test("nessuna regola dello skip nomina la corta", () => {
    const skip = css.match(/html\[data-preloader[^\]]*\]\[data-pre-skip\][^{]*\{/g) ?? [];
    assert.ok(skip.length >= 4, "regole dello skip del film sparite");
    for (const s of skip) assert.doesNotMatch(s, /short/);
  });
});
