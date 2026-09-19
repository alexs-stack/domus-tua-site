// Misura del commit 6 (spec §2.5, §9.2 test 5-6, §9.3; A20 di Alberto). Sulle cinque rotte con
// l'H1 sopra la piega, nei due progetti Playwright, tre giri a contesto nuovo senza consenso, con
// motion ok, sipario saltato e terze parti bloccate: le condizioni della base
// (scripts/probe-lcp-base.mjs, lib.mjs del commit 2). Per ogni giro: ogni voce LCP con tempo,
// area, tag e classe dell'elemento, e se l'elemento sta dentro il pannello dei cookie; l'area del
// lead o del paragrafo della testa e del paragrafo del pannello; lampi del primo carattere; primo
// carattere pieno rispetto all'armamento dell'H1; su /vendi lo scarto fra registrazione del gruppo
// di testa e armamento dell'H1; sulle tre teste senza foto se l'armamento arriva dopo la prima
// voce LCP.
// Il pannello si riconosce risalendo a `.dt-consent` dall'elemento LCP e si misura sul paragrafo
// `#cookie-consent-desc` (D48): `.dt-consent` sta sul div esterno, che non ha testo proprio, e
// quando il pannello vince la LCP l'elemento riportato è quel paragrafo (CookieConsent.tsx).
// Uscita: 0 nei criteri; 1 fuori criterio; 3 ultima voce LCP sul pannello dei cookie. L'uscita 3
// guarda solo l'elemento LCP (D48): la voce LCP è già la più grande dipinta, quindi batte il lead
// dipinto, mentre il rettangolo del lead resta intero anche quando il lead non è dipinto e non si
// confronta con l'area dipinta di una voce.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { devices } from "@playwright/test";
import { ROOT, appendResults, gitCommit, launch, mdTable, motionContext, startServer, today } from "./lib.mjs";

const PROGETTI = {
  "desktop-1440": { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
  "mobile-390": { ...devices["iPhone 13"] },
};
const ROTTE = ["/vendi", "/contatti", "/case-vendute", "/valutazione-immobile-tradate", "/"];
const SENZA_FOTO = ["/contatti", "/case-vendute", "/valutazione-immobile-tradate"];
const TETTO_PIENO_MS = 150 + 300 + 1200 + 1200;
const base = JSON.parse(readFileSync(join(ROOT, "e2e/baseline/lcp-base.json"), "utf8"));

async function giro(browser, descriptor, url) {
  const ctx = await motionContext(browser, descriptor, { consent: null, skipCurtain: true });
  try {
    await ctx.addInitScript(() => {
      const g = window;
      g.__lcp = [];
      g.__serie = [];
      g.__modo = null;
      g.__armato = null;
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) {
          const el = e.element;
          g.__lcp.push({
            t: Math.round(e.startTime),
            size: Math.round(e.size),
            tag: el ? el.tagName : "",
            classe: el && typeof el.className === "string" ? el.className : "",
            banner: !!(el && el.closest(".dt-consent")),
          });
        }
      }).observe({ type: "largest-contentful-paint", buffered: true });
      new MutationObserver(() => {
        const testa = document.querySelector("#main section");
        if (g.__modo === null && testa && testa.querySelector("[data-reveal-mode]")) g.__modo = performance.now();
        if (g.__armato === null && document.querySelector("#main h1[data-reveal-armed]")) g.__armato = performance.now();
      }).observe(document, { subtree: true, attributes: true, attributeFilter: ["data-reveal-mode", "data-reveal-armed"] });
      const prod = (el) => {
        let p = 1;
        for (let n = el; n; n = n.parentElement) {
          p *= +getComputedStyle(n).opacity;
          if (n.id === "main") break;
        }
        return p;
      };
      let frame = 0;
      const passo = () => {
        const el = document.querySelector("#main [data-c], #main [data-hero-char]");
        if (el) g.__serie.push([performance.now(), prod(el)]);
        frame += 1;
        if (frame < 900) requestAnimationFrame(passo);
      };
      document.addEventListener("DOMContentLoaded", () => requestAnimationFrame(passo), { once: true });
    });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: "load", timeout: 60000 });
    await page.waitForTimeout(4000);
    return await page.evaluate(() => {
      const g = window;
      let alto = false;
      let lampo = false;
      let pieno = null;
      for (const [t, v] of g.__serie) {
        if (v >= 0.9) {
          alto = true;
          if (pieno === null) pieno = t;
        } else if (alto && v <= 0.1) {
          lampo = true;
        }
      }
      const area = (el) => {
        if (!el) return 0;
        const r = el.getBoundingClientRect();
        return Math.round(r.width * r.height);
      };
      const testa = document.querySelector("#main section");
      return {
        lcp: g.__lcp.at(-1) ?? null,
        primaLcp: g.__lcp.length ? g.__lcp[0].t : null,
        lampo,
        pieno,
        armato: g.__armato,
        modo: g.__modo,
        areaLead: area(testa ? testa.querySelector('[data-reveal="lead"], p') : null),
        areaBanner: area(document.querySelector("#cookie-consent-desc")),
      };
    });
  } finally {
    await ctx.close();
  }
}

const server = await startServer();
const browser = await launch();
const righe = [];
try {
  for (const [progetto, descriptor] of Object.entries(PROGETTI)) {
    for (const rotta of ROTTE) {
      const giri = [];
      for (let i = 0; i < 3; i += 1) giri.push(await giro(browser, descriptor, server.base + rotta));
      const m = [...giri].sort((a, b) => (a.lcp ? a.lcp.t : 0) - (b.lcp ? b.lcp.t : 0))[1];
      const rif = base.projects?.[progetto]?.[rotta]?.lcpMs;
      const peggiore = (f) => Math.max(...giri.map((x) => f(x)));
      righe.push({
        progetto,
        rotta,
        lcp: m.lcp ? m.lcp.t : -1,
        elemento: m.lcp ? `${m.lcp.tag}.${m.lcp.classe.split(/\s+/).slice(0, 3).join(".")}` : "",
        banner: m.lcp ? m.lcp.banner : false,
        size: m.lcp ? m.lcp.size : 0,
        areaLead: m.areaLead,
        areaBanner: m.areaBanner,
        rif: typeof rif === "number" ? rif : null,
        lampi: giri.filter((x) => x.lampo).length,
        leggibile: rotta === "/" ? null : peggiore((x) => (x.pieno === null || x.armato === null ? Infinity : Math.round(x.pieno - x.armato))),
        scartoArmo: rotta === "/vendi" ? peggiore((x) => (x.modo === null || x.armato === null ? Infinity : Math.round(x.armato - x.modo))) : null,
        armoDopoLcp: SENZA_FOTO.includes(rotta) ? giri.every((x) => x.armato !== null && x.primaLcp !== null && x.armato >= x.primaLcp) : null,
      });
    }
  }
} finally {
  await browser.close();
  await server.stop();
}

const md = [
  `## 06-h1-dipinti · ${today()} · ${gitCommit()}`,
  "",
  mdTable(
    [
      "progetto",
      "rotta",
      "LCP ms (mediana)",
      "elemento LCP",
      "area LCP px²",
      "area lead px²",
      "area paragrafo banner px²",
      "base ms",
      "tetto ms",
      "lampi su 3",
      "pieno − armato ms (≤ 2850)",
      "registrazione → armo ms (/vendi, ≤ 17)",
      "armo dopo la prima LCP (senza foto)",
    ],
    righe.map((r) => [
      r.progetto,
      r.rotta,
      r.lcp,
      r.elemento,
      r.size,
      r.areaLead,
      r.areaBanner,
      r.rif ?? "manca",
      r.rif === null ? "—" : r.rif + 100,
      r.lampi,
      r.leggibile ?? "—",
      r.scartoArmo ?? "—",
      r.armoDopoLcp === null ? "—" : r.armoDopoLcp ? "sì" : "no",
    ]),
  ),
].join("\n");
appendResults(md);
console.log(md);
const suBanner = righe.filter((r) => r.banner);
const fuori = righe.filter(
  (r) =>
    r.rif === null ||
    r.lcp < 0 ||
    r.lcp > r.rif + 100 ||
    r.lampi > 0 ||
    (r.leggibile !== null && !(r.leggibile <= TETTO_PIENO_MS)) ||
    (r.scartoArmo !== null && !(r.scartoArmo <= 17)) ||
    r.armoDopoLcp === false,
);
if (suBanner.length) {
  console.error("LCP SUL PANNELLO DEI COOKIE", suBanner);
  process.exitCode = 3;
} else if (fuori.length) {
  console.error("FUORI CRITERIO", fuori);
  process.exitCode = 1;
}
