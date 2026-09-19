// Misura della porta corta con motion attivo (spec §6.2). Alberto il 13
// settembre 2026 (A18, A20): porta corta a ogni caricamento completo che non è
// la prima entrata nella home. D31: avorio profondo, anelli eco compresi (D05),
// niente contenuto del lockup, sagoma solo su «/», niente skip. Si misura in
// rAF dentro la pagina: valore dell'attributo, keyframe coi tempi letti dalle
// animazioni del motore CSS, handoff, caduta, quota --arch-y della porta,
// stili dipinti.
//
//   node --import tsx docs/superpowers/specs/2026-09-13-coreografia-era-residence/misure/19-preloader-corta.mjs
//
// Server, browser e contesto da lib.mjs (commit 2, chiave del sipario del
// commit 19): build esistente in .next, `next start` sulla 3178, Chromium
// headless con motion ok, consenso accettato, sipario NON saltato; per la home
// dopo il film la chiave parte da INTRO_FILM (seedKey, scritta solo se assente).
import {
  INTRO_EVENT,
  INTRO_FILM,
  PRE_SHORT_AUTOHIDE_MS,
  SHORT_MS,
  SHORT_T,
} from "../../../../../app/lib/motion/intro-constants.ts";
import { appendResults, gitCommit, launch, mdTable, motionContext, startServer, today } from "./lib.mjs";

const GIRI = 3;
const TUFFO = Math.round(SHORT_T.dive * 1000);
const LARGHEZZE = [
  // L'handoff parte a SHORT_T.dive dall'armamento; il tetto a 390 è più largo
  // perché il driver pilota un telefono emulato sullo stesso processore.
  { nome: "1440×900", descriptor: { viewport: { width: 1440, height: 900 } }, handoff: [TUFFO - 50, 1180] },
  {
    nome: "390×664",
    descriptor: { viewport: { width: 390, height: 664 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
    handoff: [TUFFO - 50, 1500],
  },
];
const CASI = [
  { nome: "interna /acquista", rotta: "/acquista", seedKey: null, valore: "short-page", sagoma: "none" },
  { nome: "home / dopo il film", rotta: "/", seedKey: INTRO_FILM, valore: "short", sagoma: "block" },
];
const AVORIO_PROFONDO = "rgb(244, 236, 226)"; // --color-cream-deep, globals.css:60
const ESPRESSO = "rgb(28, 21, 18)"; // --color-espresso, globals.css:64
// Le keyframe del film coi tempi della corta (spec §6.2): [delay ms, durata ms,
// easing del primo keyframe]. Nelle animazioni CSS la timing function sta sui
// keyframe (effect.getKeyframes()), non su effect.getTiming(), che dà "linear".
const KEYFRAME = {
  "dt-pre-door": [0, Math.round(SHORT_T.archDur * 1000), "cubic-bezier(0.66, 0, 0.22, 1)"],
  "dt-pre-dive": [TUFFO, Math.round(SHORT_T.diveDur * 1000), "cubic-bezier(0.6, 0, 0, 1)"],
  "dt-pre-autohide": [PRE_SHORT_AUTOHIDE_MS, 500, "ease"],
};

async function giro(browser, base, larghezza, caso) {
  const ctx = await motionContext(browser, larghezza.descriptor, {
    consent: "accepted",
    skipCurtain: false,
    seedKey: caso.seedKey,
  });
  try {
    return await misuraIn(ctx, base, caso);
  } finally {
    await ctx.close();
  }
}

async function misuraIn(ctx, base, caso) {
  await ctx.addInitScript((evento) => {
    const r = {
      t0: null,
      valore: null,
      handoff: null,
      caduta: null,
      quote: [],
      contenuto: null,
      sagoma: null,
      sagomaAnim: null,
      pannello: null,
      anello: null,
      animazioni: null,
      vh: null,
    };
    window.__c = r;
    const guarda = () => {
      const h = document.documentElement;
      if (!h) return;
      const v = h.getAttribute("data-preloader");
      if (v !== null && r.t0 === null) {
        r.t0 = window.__dtPreT0 ?? performance.now();
        r.valore = v;
      }
      if (r.t0 !== null && v === null && r.caduta === null) r.caduta = performance.now();
    };
    guarda();
    new MutationObserver(guarda).observe(document, { subtree: true, attributes: true, attributeFilter: ["data-preloader"] });
    window.addEventListener(evento, () => {
      if (r.handoff === null) r.handoff = performance.now();
    });
    const campiona = () => {
      const h = document.documentElement;
      const root = document.getElementById("dt-preloader");
      if (root && h && h.hasAttribute("data-preloader")) {
        if (r.pannello === null) {
          // L'altezza del viewport si legge qui e non all'init script: col
          // telefono emulato, prima del meta viewport innerHeight è quello del
          // layout largo 980 px (1668 px a 390×664).
          r.vh = innerHeight;
          const fig = root.querySelector("[data-pre-figure]");
          const eco = root.querySelector('[data-pre-arch-echo="1"]');
          const guscio = document.querySelector(".dt-preloader") ?? root;
          r.contenuto = getComputedStyle(root.querySelector("[data-pre-content]")).display;
          r.sagoma = getComputedStyle(fig).display;
          r.sagomaAnim = getComputedStyle(fig).animationDuration;
          r.pannello = getComputedStyle(root.querySelector("[data-pre-panel]")).backgroundColor;
          r.anello = eco ? getComputedStyle(eco).backgroundColor : null;
          r.animazioni = guscio.getAnimations().map((a) => {
            const t = a.effect.getTiming();
            return {
              nome: a.animationName,
              delay: Math.round(Number(t.delay)),
              durata: Math.round(Number(t.duration)),
              easing: a.effect.getKeyframes()[0]?.easing ?? null,
            };
          });
        }
        r.quote.push([performance.now(), parseFloat(getComputedStyle(root).getPropertyValue("--arch-y"))]);
      }
      if (r.caduta === null && performance.now() < 15_000) requestAnimationFrame(campiona);
    };
    requestAnimationFrame(campiona);
  }, INTRO_EVENT);
  const page = await ctx.newPage();
  await page.goto(base + caso.rotta, { waitUntil: "commit" });
  await page.waitForFunction(() => window.__c && (window.__c.caduta !== null || performance.now() > 14_000), undefined, { timeout: 20_000 });
  const r = await page.evaluate(() => window.__c);
  const quote = r.quote.filter(([, y]) => Number.isFinite(y));
  return {
    valore: r.valore,
    handoff: r.handoff === null || r.t0 === null ? NaN : Math.round(r.handoff - r.t0),
    caduta: r.caduta === null || r.t0 === null ? NaN : Math.round(r.caduta - r.t0),
    contenuto: r.contenuto,
    sagoma: r.sagoma,
    sagomaAnim: r.sagomaAnim,
    pannello: r.pannello,
    anello: r.anello,
    animazioni: r.animazioni ?? [],
    partenzaVh: quote.length ? Math.round((quote[0][1] / r.vh) * 100) : NaN,
    risalite: quote.filter(([, y], i) => i > 0 && y > quote[i - 1][1] + 4).length,
    fotogrammi: quote.length,
  };
}

// Regole (spec §6.2): valore atteso; contenuto non dipinto; sagoma solo su «/»
// e in SHORT_T.figureDur; pannello e anelli eco avorio profondo, mai espresso;
// porta, tuffo e autohide coi delay, le durate e le curve della corta (±1 ms);
// handoff dentro la finestra della larghezza; caduta ≤ SHORT_MS + 600 ms; la
// porta parte da sotto il bordo (≥ 100vh) e non risale mai di più di 4 px.
const righe = [];
const errori = [];
const server = await startServer();
const browser = await launch();
try {
  for (const l of LARGHEZZE) {
    for (const c of CASI) {
      for (let i = 0; i < GIRI; i++) {
        const m = await giro(browser, server.base, l, c);
        righe.push([
          l.nome,
          c.nome,
          i + 1,
          m.valore,
          m.animazioni.map((a) => `${a.nome} ${a.delay}/${a.durata}`).join(", "),
          m.handoff,
          m.caduta,
          m.contenuto,
          `${m.sagoma} ${m.sagomaAnim ?? ""}`,
          m.pannello,
          m.anello,
          m.partenzaVh,
          m.risalite,
          m.fotogrammi,
        ]);
        const dove = `${l.nome} ${c.nome} giro ${i + 1}`;
        if (m.valore !== c.valore) errori.push(`${dove}: data-preloader «${m.valore}» invece di «${c.valore}»`);
        if (m.contenuto !== "none") errori.push(`${dove}: [data-pre-content] dipinto (${m.contenuto})`);
        if (m.sagoma !== c.sagoma) errori.push(`${dove}: sagoma ${m.sagoma} invece di ${c.sagoma}`);
        if (c.sagoma !== "none" && m.sagomaAnim !== `${SHORT_T.figureDur}s`) errori.push(`${dove}: sagoma in ${m.sagomaAnim}`);
        if (m.pannello !== AVORIO_PROFONDO) errori.push(`${dove}: pannello ${m.pannello}`);
        if (m.anello === ESPRESSO || m.anello !== AVORIO_PROFONDO) errori.push(`${dove}: anelli eco ${m.anello}`);
        for (const [nome, [delay, durata, easing]] of Object.entries(KEYFRAME)) {
          const a = m.animazioni.find((x) => x.nome === nome);
          if (!a) {
            errori.push(`${dove}: keyframe ${nome} non corre`);
            continue;
          }
          if (Math.abs(a.delay - delay) > 1 || Math.abs(a.durata - durata) > 1) {
            errori.push(`${dove}: ${nome} delay ${a.delay} ms e durata ${a.durata} ms, attesi ${delay} e ${durata}`);
          }
          if (a.easing !== easing) errori.push(`${dove}: ${nome} easing ${a.easing}, atteso ${easing}`);
        }
        if (!(m.handoff >= l.handoff[0] && m.handoff <= l.handoff[1])) {
          errori.push(`${dove}: handoff a ${m.handoff} ms, fuori da [${l.handoff[0]}, ${l.handoff[1]}]`);
        }
        if (!(m.caduta <= SHORT_MS + 600)) errori.push(`${dove}: caduta a ${m.caduta} ms`);
        if (!(m.partenzaVh >= 100)) errori.push(`${dove}: la porta parte a ${m.partenzaVh}vh`);
        if (m.risalite > 0) errori.push(`${dove}: la porta risale in ${m.risalite} fotogrammi`);
      }
    }
  }
} finally {
  await browser.close();
  await server.stop();
}

let md = `## 19 · porta corta con motion attivo\n\n${today()} · commit ${gitCommit()} · misure/19-preloader-corta.mjs, ${GIRI} giri per caso, consenso accettato. `;
md += `Attesi: dt-pre-door 0/${KEYFRAME["dt-pre-door"][1]} ms, dt-pre-dive ${TUFFO}/${KEYFRAME["dt-pre-dive"][1]} ms, dt-pre-autohide ${PRE_SHORT_AUTOHIDE_MS}/500 ms; `;
md += `handoff in [${LARGHEZZE[0].handoff.join(", ")}] ms a 1440 e [${LARGHEZZE[1].handoff.join(", ")}] ms a 390; caduta ≤ ${SHORT_MS + 600} ms; pannello e anelli eco ${AVORIO_PROFONDO}.\n\n`;
md += mdTable(
  ["viewport", "caso", "giro", "data-preloader", "keyframe delay/durata ms", "handoff ms", "caduta ms", "contenuto", "sagoma", "pannello", "anelli eco", "partenza vh", "risalite", "fotogrammi"],
  righe,
);
md += errori.length ? `\n\nRegole NON rispettate:\n${errori.map((e) => `- ${e}`).join("\n")}` : "\n\nRegole rispettate.";
appendResults(md);
console.log(md);
if (errori.length) process.exit(1);
