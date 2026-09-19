// Sonda della ricarica: LCP, CLS e caduta del sipario alla ricarica vicino
// alla cima e alla navigazione nuova, prima e dopo la porta corta. Alberto il
// 13 settembre 2026 ha chiesto la porta corta alle ricariche (A18, A20); la
// spec §6.2 e §9.3 chiede LCP mediano ≤ base + 100 ms (≤ 2,5 s a 390 lento) e
// CLS 0, lane-globali §4.9 la caduta entro SHORT_MS + 600 ms. Il confronto HEAD
// contro ramo si fa sulla stessa macchina: «prima» sul build del commit 18,
// «dopo» sul build di questo commit.
//
//   node --import tsx scripts/probe-intro-reload.mjs --label prima
//   node --import tsx scripts/probe-intro-reload.mjs --label dopo
//
// Server, contesto e tabelle da misure/lib.mjs (commit 2): build esistente in
// .next, `next start` sulla 3178 (mai `next dev`: Turbopack serve la CSS con
// un'edizione di ritardo), Chromium headless con motion ok, senza cookie di
// consenso come la base di spec §2.5, sipario NON saltato. SHORT_MS si importa
// solo nel ramo «dopo»: nel «prima» la costante non esiste ancora e un import
// statico non collegherebbe il modulo.
//
// Uscita: 0 soglie rispettate; 1 soglia violata; 2 caduta a 390 lento fra
// SHORT_MS + 600 e SHORT_MS + 1500 ms, deroga da portare ad Alberto.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  HERE,
  appendResults,
  gitCommit,
  launch,
  mdTable,
  motionContext,
  startServer,
  today,
} from "../docs/superpowers/specs/2026-09-13-coreografia-era-residence/misure/lib.mjs";

const label = process.argv[process.argv.indexOf("--label") + 1];
if (label !== "prima" && label !== "dopo") throw new Error("uso: --label prima|dopo");
let SHORT_MS = NaN;
if (label === "dopo") ({ SHORT_MS } = await import("../app/lib/motion/intro-constants.ts"));

const ROTTE = ["/", "/vendi", "/contatti"];
const GIRI = 5;
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
const mediana = (xs) => {
  const v = xs.filter(Number.isFinite).sort((a, b) => a - b);
  return v.length ? v[Math.floor(v.length / 2)] : NaN;
};

async function giro(browser, base, caso, rotta) {
  const ctx = await motionContext(browser, caso.descriptor, { skipCurtain: false });
  await ctx.addInitScript(() => {
    const m = { lcp: null, lcpTag: null, cls: 0, t0: null, tCaduto: null, sipario: null };
    window.__m = m;
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) {
        m.lcp = Math.round(e.startTime);
        m.lcpTag = e.element ? e.element.tagName : null;
      }
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) if (!e.hadRecentInput) m.cls += e.value;
    }).observe({ type: "layout-shift", buffered: true });
    const guarda = () => {
      const h = document.documentElement;
      if (!h) return;
      const v = h.getAttribute("data-preloader");
      if (v !== null && m.t0 === null) {
        m.t0 = window.__dtPreT0 ?? performance.now();
        m.sipario = v;
      }
      if (m.t0 !== null && v === null && m.tCaduto === null) m.tCaduto = performance.now();
    };
    guarda();
    new MutationObserver(guarda).observe(document, { subtree: true, attributes: true, attributeFilter: ["data-preloader"] });
  });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  if (caso.rete) {
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", caso.rete);
  }
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: caso.cpu });
  const leggi = () => page.evaluate(() => ({ ...window.__m, cls: Number(window.__m.cls.toFixed(4)) }));
  const libera = () =>
    page.waitForFunction(() => !document.documentElement.hasAttribute("data-preloader"), undefined, { timeout: 30_000 });

  // 1. prima entrata: su «/» il film, sulle interne la corta (o, prima, il film)
  await page.goto(base + rotta, { waitUntil: "load", timeout: 120_000 });
  await libera();
  await attendi(1500);
  // 2. ricarica vicino alla cima
  await page.evaluate(() => window.scrollTo(0, 0));
  await attendi(300);
  await page.reload({ waitUntil: "load", timeout: 120_000 });
  await libera();
  await attendi(3000);
  const ricarica = await leggi();
  // 3. navigazione nuova sulla stessa rotta
  await page.goto(base + rotta, { waitUntil: "load", timeout: 120_000 });
  await libera();
  await attendi(3000);
  const nuova = await leggi();
  await ctx.close();
  return { ricarica, nuova };
}

const risultati = {};
const server = await startServer();
const browser = await launch();
try {
  for (const caso of CASI) {
    for (const rotta of ROTTE) {
      const giri = [];
      for (let i = 0; i < GIRI; i++) giri.push(await giro(browser, server.base, caso, rotta));
      for (const fase of ["ricarica", "nuova"]) {
        const v = giri.map((g) => g[fase]);
        risultati[`${caso.nome} ${rotta} ${fase}`] = {
          lcp: mediana(v.map((x) => x.lcp ?? NaN)),
          lcpTag: v[Math.floor(GIRI / 2)].lcpTag,
          clsMax: Math.max(...v.map((x) => x.cls)),
          sipario: v.map((x) => x.sipario),
          caduta: mediana(v.filter((x) => x.t0 !== null && x.tCaduto !== null).map((x) => Math.round(x.tCaduto - x.t0))),
        };
      }
    }
  }
} finally {
  await browser.close();
  await server.stop();
}
writeFileSync(join(HERE, `19-intro-reload-${label}.json`), JSON.stringify(risultati, null, 1));

// Le soglie, solo sul «dopo». Spec §9.3: LCP mediano ≤ base + 100 ms (≤ 2,5 s
// a 390 lento) e CLS 0; a 390 la base di spec §2.5 ha già 0,0002, quindi lì il
// CLS non sale sopra il «prima». Spec §6.2 e lane-globali §4.9: sipario "short"
// su «/», "short-page" sulle interne, attributo caduto entro SHORT_MS + 600 ms
// ovunque. A 390 lento il failsafe è un setTimeout su un thread occupato: una
// caduta fra SHORT_MS + 600 e SHORT_MS + 1500 non passa in silenzio, è una
// deroga da portare ad Alberto (uscita 2, il commit si ferma).
const errori = [];
const deroghe = [];
if (label === "dopo") {
  const prima = JSON.parse(readFileSync(join(HERE, "19-intro-reload-prima.json"), "utf8"));
  for (const [chiave, d] of Object.entries(risultati)) {
    const p = prima[chiave];
    const [caso, rotta] = chiave.split(" ");
    if (!p) {
      errori.push(`${chiave}: manca in 19-intro-reload-prima.json`);
      continue;
    }
    if (Number.isFinite(p.lcp) && !(d.lcp <= p.lcp + 100)) errori.push(`${chiave}: LCP ${d.lcp} > prima ${p.lcp} + 100`);
    // D64 (Alberto): l'LCP su telefono delle pagine con la banda della villa sta
    // già sopra il tetto di D33 e non è un cancello; lì vale solo prima + 100.
    if (caso === "390-lento" && !(d.lcp <= 2500) && !(p.lcp > 2500)) errori.push(`${chiave}: LCP ${d.lcp} > 2500`);
    if (caso === "1440" && d.clsMax !== 0) errori.push(`${chiave}: CLS ${d.clsMax}, atteso 0`);
    if (caso === "390-lento" && !(d.clsMax <= p.clsMax)) errori.push(`${chiave}: CLS ${d.clsMax} sopra il prima ${p.clsMax}`);
    const atteso = rotta === "/" ? "short" : "short-page";
    if (d.sipario.some((s) => s !== atteso)) errori.push(`${chiave}: sipario ${d.sipario.join(",")} invece di ${atteso}`);
    if (!(d.caduta <= SHORT_MS + 600)) {
      if (caso === "390-lento" && d.caduta <= SHORT_MS + 1500) {
        deroghe.push(`${chiave}: caduta ${d.caduta} ms, fra ${SHORT_MS + 600} e ${SHORT_MS + 1500}`);
      } else {
        errori.push(`${chiave}: caduta ${d.caduta} ms oltre ${SHORT_MS + 600}`);
      }
    }
  }
}

const sip = (xs) => xs.map((s) => (s === null ? "nessuno" : s === "" ? "film" : s)).join(" ");
const righe = Object.entries(risultati).map(([k, d]) => {
  const [caso, rotta, fase] = k.split(" ");
  return [
    caso,
    rotta,
    fase,
    Number.isFinite(d.lcp) ? d.lcp : "—",
    d.lcpTag ?? "—",
    d.clsMax,
    sip(d.sipario),
    Number.isFinite(d.caduta) ? d.caduta : "—",
  ];
});
let md = `## 19 · ricarica e navigazione nuova («${label}»)\n\n${today()} · commit ${gitCommit()} · scripts/probe-intro-reload.mjs, mediana di ${GIRI} giri, senza consenso. 1440×900 senza freno; 390×664 DPR 3, CPU ×4, 1,6 Mbps / 150 ms.\n\n`;
md += mdTable(["caso", "rotta", "fase", "LCP ms", "elemento", "CLS max", "sipario", "caduta ms"], righe);
if (label === "dopo") {
  if (errori.length) md += `\n\nSoglie NON rispettate:\n${errori.map((e) => `- ${e}`).join("\n")}`;
  if (deroghe.length) {
    md += `\n\nDeroga da portare ad Alberto (caduta a 390 lento oltre SHORT_MS + 600 ms, lane-globali §4.9):\n${deroghe.map((e) => `- ${e}`).join("\n")}`;
  }
  if (!errori.length && !deroghe.length) {
    md += "\n\nSoglie rispettate: LCP ≤ prima + 100 ms e ≤ 2500 ms a 390 lento (dove il prima era già sopra, D64: solo prima + 100); CLS 0 a 1440 e non sopra il prima a 390 lento; sipario corto su tutte le ricariche vicino alla cima e le navigazioni nuove; caduta ≤ SHORT_MS + 600 ms ovunque.";
  }
}
appendResults(md);
console.log(md);
if (errori.length) process.exit(1);
if (deroghe.length) process.exit(2);
