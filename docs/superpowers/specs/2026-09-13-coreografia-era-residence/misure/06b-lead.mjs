// Misura del gesto `lead` del commit 6 (spec §2.2, riga lead: yPercent 110 → 0 in 1,2 s, stagger
// 0,1, dtOut; uscita −110 in 0,4 s, stagger 0,05, dtIn; A20 di Alberto): il lead di Posizionamento,
// il primo [data-reveal="lead"] della home, nei due progetti Playwright. Posa armata delle righe,
// tempo d'ingresso col bordo alto a metà viewport, tempo d'uscita col bordo alto al 92 %.
// lib.mjs del commit 2 (server, contesto con motion ok, sipario saltato, terze parti bloccate).
import { devices } from "@playwright/test";
import { appendResults, gitCommit, launch, mdTable, motionContext, startServer, today } from "./lib.mjs";

const PROGETTI = {
  "desktop-1440": { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
  "mobile-390": { ...devices["iPhone 13"] },
};
const SEL = '#main [data-reveal="lead"]';

const server = await startServer();
const browser = await launch();
const righe = [];
try {
  for (const [progetto, descriptor] of Object.entries(PROGETTI)) {
    const ctx = await motionContext(browser, descriptor, { consent: "accepted", skipCurtain: true });
    const page = await ctx.newPage();
    await page.goto(`${server.base}/`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => !!document.querySelector("[data-reveal-armed]"), null, { timeout: 15000 });
    await page.evaluate((s) => {
      const el = document.querySelector(s);
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - innerHeight * 1.5, behavior: "instant" });
    }, SEL);
    await page.waitForFunction((s) => document.querySelector(s)?.getAttribute("data-lead") === "split", SEL, { timeout: 8000 });
    await page.waitForTimeout(300);
    const posa = await page.evaluate(
      (s) =>
        Array.from(document.querySelector(s).querySelectorAll(".dt-line"), (l) => {
          const t = getComputedStyle(l).transform;
          return { m42: new DOMMatrixReadOnly(t === "none" ? undefined : t).m42, h: l.offsetHeight };
        }),
      SEL,
    );
    const n = posa.length;
    const tetto = Math.round((0.3 + Math.min(0.1, 1.2 / Math.max(1, n - 1)) * (n - 1) + 1.2) * 1000) + 250;
    const tempo = (f, modo) =>
      page.evaluate(
        async ({ s, f, modo }) => {
          const el = document.querySelector(s);
          const linee = Array.from(el.querySelectorAll(".dt-line"));
          const y = (l) => {
            const t = getComputedStyle(l).transform;
            return new DOMMatrixReadOnly(t === "none" ? undefined : t).m42;
          };
          window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - innerHeight * f, behavior: "instant" });
          const t0 = performance.now();
          while (performance.now() - t0 < 5000) {
            await new Promise((r) => requestAnimationFrame(r));
            const ok = modo === "dentro" ? linee.every((l) => Math.abs(y(l)) < 0.5) : linee.every((l) => y(l) <= -l.offsetHeight);
            if (ok) return Math.round(performance.now() - t0);
          }
          return -1;
        },
        { s: SEL, f, modo },
      );
    const ingresso = await tempo(0.5, "dentro");
    const uscita = await tempo(0.92, "fuori");
    const scarto = n ? Math.max(...posa.map((p) => Math.abs(p.m42 - 1.1 * p.h))) : Infinity;
    righe.push({ progetto, n, scarto: +scarto.toFixed(1), ingresso, tetto, uscita });
    await ctx.close();
  }
} finally {
  await browser.close();
  await server.stop();
}

const md = [
  `## 06b-lead · ${today()} · ${gitCommit()}`,
  "",
  mdTable(
    ["progetto", "righe", "scarto dalla posa 110 % px (≤ 2)", "ingresso ms", "tetto ms", "uscita ms (≤ 1300)"],
    righe.map((r) => [r.progetto, r.n, r.scarto, r.ingresso, r.tetto, r.uscita]),
  ),
].join("\n");
appendResults(md);
console.log(md);
const fuori = righe.filter((r) => r.n === 0 || !(r.scarto <= 2) || r.ingresso < 0 || r.ingresso > r.tetto || r.uscita < 0 || r.uscita > 1300);
if (fuori.length) {
  console.error("FUORI CRITERIO", fuori);
  process.exitCode = 1;
}
