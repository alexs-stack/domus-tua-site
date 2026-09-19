// Misura dell'aggancio della ricerca e del carosello di Voci (commit 9).
// Chiesti da Alberto il 13 settembre 2026 (A18-A20); spec coreografia §3.4 e §3.7.
// Build di produzione servito da lib.mjs (next start sulla 3178), motion ok, sipario saltato,
// consenso accettato. Esce con codice 1 se un invariante cade.
import { devices } from "@playwright/test";
import { startServer, launch, motionContext, scrollInstant, mdTable, appendResults, gitCommit, today } from "./lib.mjs";

const VIEWPORTS = [
  { nome: "1440×900", descriptor: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }, tessere: 3 },
  { nome: "390×664", descriptor: devices["iPhone 13"], tessere: 1 },
];
const QUOTE = [0.95, 0.85, 0.75, 0.65, 0.55, 0.4];
/** Spec §3.7: dopo 1,6 s niente clip-path inline (1,0 s + due stagger da 0,15, callback dell'IO e clearProps). */
const LIMITE_STILI_MS = 1600;
const cadute = [];
const attesa = (ms) => new Promise((r) => setTimeout(r, ms));

/** Una tabella in risultati.md; le colonne sono l'unione delle chiavi delle righe. */
function tabella(titolo, nome, righe) {
  const colonne = [...new Set(righe.flatMap((r) => Object.keys(r)))];
  appendResults(
    `### ${titolo} (${today()}, commit ${gitCommit()}, ${nome})\n\n` +
      mdTable(colonne, righe.map((r) => colonne.map((c) => r[c] ?? ""))),
  );
}

const { base, stop } = await startServer();
const browser = await launch();
try {
  for (const { nome, descriptor, tessere } of VIEWPORTS) {
    const ctx = await motionContext(browser, descriptor, { consent: "accepted" });
    const page = await ctx.newPage();
    await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load");

    // Aggancio: bordo alto dell'innesco [data-dock], che non scala, alle quote di QUOTE scendendo;
    // opacità e scala si leggono sul pannello [data-dock-panel].
    await page.waitForSelector("[data-dock-panel][style]", { state: "attached", timeout: 30_000 });
    const aggancio = [];
    for (const f of QUOTE) {
      const y = await page.evaluate(
        (fr) => document.querySelector("[data-dock]").getBoundingClientRect().top + window.scrollY - fr * window.innerHeight,
        f,
      );
      await scrollInstant(page, Math.round(y));
      await attesa(900);
      const r = await page.evaluate(() => {
        const s = getComputedStyle(document.querySelector("[data-dock-panel]"));
        const t = s.transform === "none" ? undefined : s.transform;
        return {
          opacita: +Number(s.opacity).toFixed(3),
          scala: +new DOMMatrixReadOnly(t).a.toFixed(3),
          innescoFermo: getComputedStyle(document.querySelector("[data-dock]")).transform === "none" ? 1 : 0,
        };
      });
      if (!r.innescoFermo) cadute.push(`${nome}: a ${Math.round(f * 100)} % l'innesco [data-dock] ha un transform`);
      aggancio.push({ gesto: "ricerca", bordoAlto: `${Math.round(f * 100)} %`, ...r });
    }
    for (let i = 1; i < aggancio.length; i += 1) {
      if (aggancio[i].opacita + 0.005 < aggancio[i - 1].opacita) cadute.push(`${nome}: opacità del pannello non monotona a ${aggancio[i].bordoAlto}`);
    }
    if (aggancio[0].opacita > 0.05) cadute.push(`${nome}: al 95 % il pannello è a ${aggancio[0].opacita}`);
    for (const r of aggancio.slice(-2)) {
      if (r.opacita < 0.99 || r.scala < 0.99) cadute.push(`${nome}: a ${r.bordoAlto} il pannello non è pieno (${r.opacita}, ${r.scala})`);
    }

    // Voci: stato chiuso al montaggio, poi campionamento a ogni fotogramma per 1,8 s dall'ingresso.
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.waitForSelector("#voci [data-voci-slide][style]", { timeout: 30_000 });
    const v = await page.evaluate(async () => {
      const ul = document.querySelector("#voci ul");
      const slides = [...document.querySelectorAll("#voci [data-voci-slide]")];
      const chiuse = slides.filter((s) => s.style.clipPath !== "").length;
      const out = [];
      window.scrollTo({ top: ul.getBoundingClientRect().top + window.scrollY - 0.5 * window.innerHeight, behavior: "instant" });
      const t0 = performance.now();
      await new Promise((res) => {
        const giro = () => {
          const t = performance.now() - t0;
          out.push({
            t: Math.round(t),
            clip: slides[0].style.clipPath || "vuoto",
            rotaia: ul.style.transform || "vuoto",
            trabocco: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          });
          if (t < 1800) requestAnimationFrame(giro);
          else res();
        };
        requestAnimationFrame(giro);
      });
      return { chiuse, out };
    });
    if (v.chiuse !== tessere) cadute.push(`${nome}: tessere chiuse al montaggio ${v.chiuse}, attese ${tessere}`);
    if (Math.max(...v.out.map((c) => c.trabocco)) > 0) cadute.push(`${nome}: traboccamento durante l'ingresso`);
    if (!v.out.some((c) => c.t >= 100 && c.t <= 900 && c.clip !== "vuoto")) cadute.push(`${nome}: nessun fotogramma d'apertura fra 0,1 e 0,9 s`);
    if (v.out.some((c) => c.t >= LIMITE_STILI_MS && (c.clip !== "vuoto" || c.rotaia !== "vuoto"))) {
      cadute.push(`${nome}: stili rimasti dopo ${LIMITE_STILI_MS / 1000} s`);
    }
    const scelti = [0, 250, 500, 750, 1000, 1350, 1600].map((t) => v.out.find((c) => c.t >= t) ?? v.out.at(-1));

    tabella("09 · aggancio della ricerca e carosello di Voci", nome, [
      ...aggancio,
      { gesto: "voci", chiuseAlMontaggio: v.chiuse },
      ...scelti.map((c) => ({ gesto: "voci", ...c })),
    ]);
    await ctx.close();
  }
} finally {
  await browser.close();
  await stop();
}

if (cadute.length) {
  console.error(cadute.join("\n"));
  process.exitCode = 1;
}
