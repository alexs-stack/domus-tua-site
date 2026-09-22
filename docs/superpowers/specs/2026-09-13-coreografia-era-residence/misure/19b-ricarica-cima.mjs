// Misura della ricarica vicino alla cima con la porta corta su «/» (D65). La
// corta di spec §6.2 (Alberto, 13 settembre 2026: A18, A20) presuppone la
// pagina in cima: la sagoma coincide con la foto dell'hero. Alla ricarica sotto
// mezzo schermo (D31, riga 11) il browser ripristina lo scroll: il guardiano del
// boot script (layout.tsx) lo riporta a 0 finché il sipario è su e il load non
// è passato, poi rimette `history.scrollRestoration` a "auto" (anche nella
// memoria di ScrollTrigger, Preloader.tsx). Si misura in rAF dentro la pagina:
// scrollY e quota della porta (--arch-y) a ogni fotogramma sotto l'attributo,
// scrollY dopo la caduta, ritiro del guardiano, valore di scrollRestoration
// dopo un refresh di ScrollTrigger.
//
//   node --import tsx docs/superpowers/specs/2026-09-13-coreografia-era-residence/misure/19b-ricarica-cima.mjs
//
// Server, browser e contesto da lib.mjs: build esistente in .next, `next
// start` sulla 3178, Chromium headless con motion ok, consenso accettato,
// sipario NON saltato, chiave INTRO_FILM (la home dà la corta).
import { INTRO_FILM } from "../../../../../app/lib/motion/intro-constants.ts";
import { appendResults, gitCommit, launch, mdTable, motionContext, startServer, today } from "./lib.mjs";

const GIRI = 3;
const QUOTA = 0.3; // frazione di innerHeight a cui si ricarica: sotto RELOAD_KEEP_Y, quindi con la corta
const DOPO_MS = 3000; // quanto si guarda la pagina dopo la caduta (il ripristino del browser arriva al load)
const NET = { offline: false, latency: 150, downloadThroughput: (1638.4 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 };
const CASI = [
  { nome: "1440", descriptor: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }, cpu: 1, rete: null },
  {
    nome: "390-lento",
    descriptor: { viewport: { width: 390, height: 664 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
    cpu: 4,
    rete: NET,
  },
];
const attendi = (ms) => new Promise((r) => setTimeout(r, ms));

async function giro(browser, base, caso) {
  const ctx = await motionContext(browser, caso.descriptor, { consent: "accepted", skipCurtain: false, seedKey: INTRO_FILM });
  await ctx.addInitScript(() => {
    const r = { t0: null, valore: null, caduta: null, ritiro: null, sotto: 0, fuori: [], dopo: [] };
    window.__r = r;
    const tick = () => {
      const h = document.documentElement;
      const root = document.getElementById("dt-preloader");
      if (h && root) {
        const v = h.getAttribute("data-preloader");
        if (v !== null) {
          if (r.t0 === null) {
            r.t0 = performance.now();
            r.valore = v;
          }
          r.sotto += 1;
          if (scrollY > 1) {
            r.fuori.push([Math.round(scrollY), Math.round(parseFloat(getComputedStyle(root).getPropertyValue("--arch-y"))), innerHeight]);
          }
        } else if (r.t0 !== null) {
          if (r.caduta === null) r.caduta = performance.now();
          r.dopo.push(Math.round(scrollY));
        }
        if (r.ritiro === null && window.__dtPreTop === 0) r.ritiro = performance.now();
      }
      if (performance.now() < 20_000) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  if (caso.rete) {
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", caso.rete);
  }
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: caso.cpu });
  try {
    await page.goto(base + "/", { waitUntil: "load", timeout: 120_000 });
    await page.waitForFunction(() => !document.documentElement.hasAttribute("data-preloader"), undefined, { timeout: 30_000 });
    await attendi(1500);
    const y = await page.evaluate(async (q) => {
      window.scrollTo({ top: Math.round(q * innerHeight), behavior: "instant" });
      await new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok)));
      return Math.round(scrollY);
    }, QUOTA);
    await attendi(400);
    await page.reload({ waitUntil: "commit", timeout: 120_000 });
    await page.waitForFunction(() => window.__r && window.__r.caduta !== null, undefined, { timeout: 30_000, polling: 100 });
    await attendi(DOPO_MS);
    const r = await page.evaluate(() => ({ ...window.__r, load: performance.getEntriesByType("navigation")[0].loadEventEnd }));
    const modo = await page.evaluate(() => history.scrollRestoration);
    // Un refresh di ScrollTrigger (1 px di larghezza, poi ritorno): riscrive il
    // valore che si è segnato all'avvio. Col telefono emulato rinfresca solo
    // sul resize a larghezza diversa: si aspetta il refresh prima di tornare.
    const vp = page.viewportSize();
    const n0 = await page.evaluate(() => window.__dtSTRefresh ?? 0);
    await page.setViewportSize({ width: vp.width + 1, height: vp.height });
    await page.waitForFunction((n) => (window.__dtSTRefresh ?? 0) > n, n0, { timeout: 10_000 });
    const modoDopoRefresh = await page.evaluate(() => history.scrollRestoration);
    await page.setViewportSize(vp);
    return {
      y,
      valore: r.valore,
      sotto: r.sotto,
      fuori: r.fuori.length,
      fuoriMax: Math.max(0, ...r.fuori.map((f) => f[0])),
      portaAperta: r.fuori.filter(([, archY, vh]) => archY < vh).length,
      portaMin: r.fuori.length ? Math.min(...r.fuori.map(([, archY, vh]) => Math.round((archY / vh) * 100))) : "—",
      dopoMax: Math.max(0, ...r.dopo),
      caduta: Math.round(r.caduta - r.t0),
      load: Math.round(r.load - r.t0),
      ritiro: r.ritiro === null ? NaN : Math.round(r.ritiro - r.t0),
      modo,
      modoDopoRefresh,
    };
  } finally {
    await ctx.close();
  }
}

// Regole (D65): la corta su «/»; nessun fotogramma con la porta sopra il bordo
// (--arch-y < innerHeight) su una pagina fuori dalla cima; dopo la caduta la
// pagina resta a 0 per DOPO_MS (niente ripristino al load); il guardiano si
// ritira; scrollRestoration "auto" dopo il ritiro e dopo un refresh di
// ScrollTrigger.
const righe = [];
const errori = [];
const server = await startServer();
const browser = await launch();
try {
  for (const caso of CASI) {
    for (let i = 0; i < GIRI; i++) {
      const m = await giro(browser, server.base, caso);
      righe.push([
        caso.nome,
        i + 1,
        m.y,
        m.valore,
        m.sotto,
        `${m.fuori} (max ${m.fuoriMax})`,
        m.portaMin,
        m.portaAperta,
        m.dopoMax,
        m.caduta,
        m.load,
        m.ritiro,
        `${m.modo} / ${m.modoDopoRefresh}`,
      ]);
      const dove = `${caso.nome} giro ${i + 1}`;
      if (m.valore !== "short") errori.push(`${dove}: data-preloader «${m.valore}» invece di «short»`);
      if (m.portaAperta > 0) errori.push(`${dove}: ${m.portaAperta} fotogrammi con la porta aperta su una pagina fuori dalla cima`);
      if (m.dopoMax > 1) errori.push(`${dove}: dopo la caduta la pagina scende a ${m.dopoMax}`);
      if (!Number.isFinite(m.ritiro)) errori.push(`${dove}: il guardiano non si è ritirato`);
      if (m.modo !== "auto" || m.modoDopoRefresh !== "auto") {
        errori.push(`${dove}: scrollRestoration ${m.modo} al ritiro e ${m.modoDopoRefresh} dopo il refresh`);
      }
    }
  }
} finally {
  await browser.close();
  await server.stop();
}

let md = `## 19b · ricarica a ${QUOTA} schermi su «/» con la corta (D65)\n\n${today()} · commit ${gitCommit()} · misure/19b-ricarica-cima.mjs, ${GIRI} giri per caso, consenso accettato, chiave INTRO_FILM. `;
md += `1440×900 senza freno; 390×664 DPR 3, CPU ×4, 1,6 Mbps / 150 ms. «fuori dalla cima» = fotogrammi rAF sotto l'attributo con scrollY > 1; «porta min» = la quota più alta della porta in quei fotogrammi, in % di innerHeight (≥ 100: sotto il bordo, pagina coperta). Tempi in ms dall'armamento.\n\n`;
md += mdTable(
  ["viewport", "giro", "scrollY prima", "data-preloader", "fotogrammi sotto", "fuori dalla cima", "porta min %", "porta aperta fuori cima", `scrollY max dopo (${DOPO_MS} ms)`, "caduta", "load", "ritiro guardiano", "scrollRestoration ritiro / refresh ST"],
  righe,
);
md += errori.length ? `\n\nRegole NON rispettate:\n${errori.map((e) => `- ${e}`).join("\n")}` : "\n\nRegole rispettate.";
appendResults(md);
console.log(md);
if (errori.length) process.exit(1);
