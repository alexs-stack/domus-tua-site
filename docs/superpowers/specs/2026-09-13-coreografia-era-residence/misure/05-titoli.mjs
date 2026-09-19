// Misura del commit 5 (spec §2.2, §9.2 test 1-3, 7a e 8; A20 e A22 di Alberto, D19): ingresso,
// uscita e «nulla dall'alto» del titolo di #servizi sulla home; posa armata, ingresso, uscita e
// traboccamento dell'accento di Method su /metodo; nei due progetti Playwright (desktop-1440 e
// mobile-390). Scrive il numero di [data-c] della home a 1440 dopo una passata intera in
// e2e/baseline/data-c.json (base del test 8). Scrive in risultati.md anche il peso di
// app/lib/motion/kern-table.json (D36, tetto 64 KB) e gli estremi per chiave (D42). Server di
// produzione, contesto con motion attivo, sipario saltato e terze parti bloccate: lib.mjs del commit 2.
import { readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { devices } from "@playwright/test";
import { ROOT, appendResults, gitCommit, launch, mdTable, motionContext, scrollInstant, startServer, today } from "./lib.mjs";

const PROGETTI = {
  "desktop-1440": { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
  "mobile-390": { ...devices["iPhone 13"] },
};
const TITOLO = '#servizi [data-reveal="title"]';
const ACCENTO = '#metodo [data-reveal="accent"]';

async function apri(browser, descriptor, base, path) {
  const ctx = await motionContext(browser, descriptor, { consent: "accepted", skipCurtain: true });
  const page = await ctx.newPage();
  await page.goto(base + path, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => !!document.querySelector("[data-reveal-armed]"), null, { timeout: 15000 });
  await page.waitForTimeout(800);
  return { ctx, page };
}

// Porta il bordo alto di `sel` a `f` × innerHeight (f > 1: sotto il viewport).
const porta = (page, sel, f) =>
  page.evaluate(
    async ({ sel, f }) => {
      const h = document.querySelector(sel);
      window.scrollTo({ top: h.getBoundingClientRect().top + window.scrollY - innerHeight * f, behavior: "instant" });
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    },
    { sel, f },
  );

// Porta `sel` a `f` e cronometra finché tutti i caratteri sono pieni e fermi («pieno») o tutti
// sotto 0,1 («spento»); registra anche il traboccamento orizzontale massimo. Tetto 5 s.
const cronometra = (page, sel, f, modo) =>
  page.evaluate(
    async ({ sel, f, modo }) => {
      const h = document.querySelector(sel);
      const chars = Array.from(h.querySelectorAll("[data-c]"));
      const prod = (el) => {
        let p = 1;
        for (let n = el; n; n = n.parentElement) {
          p *= +getComputedStyle(n).opacity;
          if (n.id === "main") break;
        }
        return p;
      };
      const fermo = (el) => {
        const t = getComputedStyle(el).transform;
        const m = new DOMMatrixReadOnly(t === "none" ? undefined : t);
        return Math.abs(m.m41) < 0.5 && Math.abs(m.m42) < 0.5 && Math.abs(m.a - 1) < 0.01 && Math.abs(m.d - 1) < 0.01;
      };
      window.scrollTo({ top: h.getBoundingClientRect().top + window.scrollY - innerHeight * f, behavior: "instant" });
      const t0 = performance.now();
      let largo = 0;
      while (performance.now() - t0 < 5000) {
        await new Promise((r) => requestAnimationFrame(r));
        largo = Math.max(largo, document.documentElement.scrollWidth - document.documentElement.clientWidth);
        const ok = modo === "pieno" ? chars.every((c) => fermo(c) && prod(c) >= 0.99) : chars.every((c) => prod(c) < 0.1);
        if (ok) return { ms: Math.round(performance.now() - t0), n: chars.length, largo };
      }
      return { ms: -1, n: chars.length, largo };
    },
    { sel, f, modo },
  );

const tetto = (n, stagger) => Math.round((0.3 + Math.min(stagger, 1.2 / Math.max(1, n - 1)) * (n - 1) + 1.2) * 1000) + 250;

const server = await startServer();
const browser = await launch();
const titoli = [];
const accenti = [];
let nodi1440 = 0;
try {
  for (const [nome, descriptor] of Object.entries(PROGETTI)) {
    // Titolo di #servizi sulla home (ruolo title, stagger 0,05).
    let { ctx, page } = await apri(browser, descriptor, server.base, "/");
    await porta(page, TITOLO, 1.2);
    await page.waitForTimeout(900);
    const ingresso = await cronometra(page, TITOLO, 0.5, "pieno");
    const uscita = await cronometra(page, TITOLO, 0.92, "spento");
    await cronometra(page, TITOLO, 0.5, "pieno");
    await page.evaluate((s) => {
      const r = document.querySelector(s).getBoundingClientRect();
      window.scrollTo({ top: r.bottom + window.scrollY + innerHeight * 0.5, behavior: "instant" });
    }, TITOLO);
    await page.waitForTimeout(1000);
    // «Nulla dall'alto» (A18 di Alberto, spec §9.2 test 3) si legge sui soli caratteri del titolo
    // cronometrato, come in `cronometra`: `${TITOLO} [data-c]` prende anche gli h3 dei servizi,
    // che a questo scroll stanno ancora sotto il viewport o stanno entrando.
    const alto = await page.evaluate((s) => {
      const prod = (el) => {
        let p = 1;
        for (let n = el; n; n = n.parentElement) {
          p *= +getComputedStyle(n).opacity;
          if (n.id === "main") break;
        }
        return p;
      };
      return Math.min(...Array.from(document.querySelector(s).querySelectorAll("[data-c]")).map(prod));
    }, TITOLO);
    if (nome === "desktop-1440") {
      await scrollInstant(page, 0);
      const h = await page.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < h; y += 900) {
        await page.mouse.wheel(0, 900);
        await page.waitForTimeout(60);
      }
      nodi1440 = await page.locator("[data-c]").count();
    }
    titoli.push({ nome, n: ingresso.n, ingresso: ingresso.ms, tetto: tetto(ingresso.n, 0.05), uscita: uscita.ms, alto: +alto.toFixed(3) });
    await ctx.close();

    // Accento di Method su /metodo (ruolo accent, stagger 0,1, x 10vw, rotateX 90).
    ({ ctx, page } = await apri(browser, descriptor, server.base, "/metodo"));
    await porta(page, ACCENTO, 1.5);
    await page.waitForTimeout(900);
    const posa = await page.evaluate((s) => {
      const t = getComputedStyle(document.querySelector(`${s} [data-c]`)).transform;
      const m = new DOMMatrixReadOnly(t === "none" ? undefined : t);
      return { m41: m.m41, d: m.d, vw: innerWidth };
    }, ACCENTO);
    const aIn = await cronometra(page, ACCENTO, 0.5, "pieno");
    const aOut = await cronometra(page, ACCENTO, 0.92, "spento");
    accenti.push({
      nome,
      n: aIn.n,
      m41: +posa.m41.toFixed(1),
      atteso: +(0.1 * posa.vw).toFixed(1),
      d: +posa.d.toFixed(3),
      ingresso: aIn.ms,
      tetto: tetto(aIn.n, 0.1),
      uscita: aOut.ms,
      largo: aIn.largo,
    });
    await ctx.close();
  }
} finally {
  await browser.close();
  await server.stop();
}

// D36: kern-table.json entra nel bundle client con SplitTitle e pesa al massimo 64 KB; D42: valori
// entro ±0,2 em, ±0,25 per script-400. Gli stessi tetti li pretende kern-table.test.ts; qui il peso
// e gli estremi si scrivono accanto alle misure del commit.
const KERN = join(ROOT, "app/lib/motion/kern-table.json");
const KERN_TETTO_BYTE = 64 * 1024;
const KERN_TETTO_EM = { "brand-800": 0.2, "display-400": 0.2, "display-500": 0.2, "script-400": 0.25 };
const kernByte = statSync(KERN).size;
const kern = Object.entries(JSON.parse(readFileSync(KERN, "utf8"))).map(([chiave, coppie]) => {
  const v = Object.values(coppie);
  return { chiave, coppie: v.length, min: Math.min(...v), max: Math.max(...v), tetto: KERN_TETTO_EM[chiave] };
});
const migliaia = (n) => n.toLocaleString("it-IT");

writeFileSync(join(ROOT, "e2e/baseline/data-c.json"), `${JSON.stringify({ "/": { "1440": nodi1440 }, date: today(), commit: gitCommit() }, null, 2)}\n`);
const md = [
  `## 05-titoli · ${today()} · ${gitCommit()}`,
  "",
  "Titolo di #servizi sulla home:",
  "",
  mdTable(
    ["progetto", "caratteri", "ingresso ms", "tetto ms", "uscita ms (≤ 1300)", "dall'alto (≥ 0,99)"],
    titoli.map((r) => [r.nome, r.n, r.ingresso, r.tetto, r.uscita, r.alto]),
  ),
  "",
  "Accento di Method su /metodo:",
  "",
  mdTable(
    ["progetto", "caratteri", "m41 armato px", "atteso px (±2)", "d armato (< 0,05)", "ingresso ms", "tetto ms", "uscita ms (≤ 1300)", "traboccamento px (≤ 0)"],
    accenti.map((r) => [r.nome, r.n, r.m41, r.atteso, r.d, r.ingresso, r.tetto, r.uscita, r.largo]),
  ),
  "",
  `[data-c] sulla home a 1440 dopo una passata: ${nodi1440} (base del test 8, e2e/baseline/data-c.json).`,
  "",
  `kern-table.json: ${migliaia(kernByte)} byte (tetto ${migliaia(KERN_TETTO_BYTE)}, D36). Estremi per chiave (D42):`,
  "",
  mdTable(
    ["chiave", "coppie", "min em", "max em", "tetto em"],
    kern.map((r) => [r.chiave, r.coppie, r.min, r.max, `±${r.tetto}`]),
  ),
].join("\n");
appendResults(md);
console.log(md);
const fuori = [
  ...titoli.filter((r) => r.ingresso < 0 || r.ingresso > r.tetto || r.uscita < 0 || r.uscita > 1300 || r.alto < 0.99),
  ...accenti.filter(
    (r) => Math.abs(r.m41 - r.atteso) > 2 || Math.abs(r.d) >= 0.05 || r.ingresso < 0 || r.ingresso > r.tetto || r.uscita < 0 || r.uscita > 1300 || r.largo > 0,
  ),
  ...(kernByte > KERN_TETTO_BYTE ? [{ kernByte }] : []),
  ...kern.filter((r) => r.tetto === undefined || Math.max(-r.min, r.max) > r.tetto),
];
if (fuori.length) {
  console.error("FUORI CRITERIO", fuori);
  process.exitCode = 1;
}
