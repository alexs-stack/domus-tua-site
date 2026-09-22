// Base dell'LCP e del CLS per il test 6 di e2e/text-motion.spec.ts (spec 2026-09-13 §2.5 e §9.2).
//
// Alberto ha scelto il 13 settembre la fedeltà letterale (A20) accettando il
// rischio su LCP e H1; la spec lo misura contro la base di oggi, con TextLines e
// Reveal: rotte /, /vendi, /contatti, /case-vendute, /valutazione-immobile-tradate;
// senza consenso, sipario saltato, rete e CPU non frenate, un contesto alla volta
// (nessun altro worker), `load` più 4 s, ultima voce largest-contentful-paint,
// mediana di tre giri. Scrive e2e/baseline/lcp-base.json in due forme:
// - `projects`, coi descrittori dei progetti desktop-1440 e mobile-390 di playwright.site.config.ts,
//   { lcpMs, tag, url, cls, runs, spreadMs } per rotta: le legge il test 6 con
//   readLcpBase().projects[info.project.name][rotta].lcpMs;
// - le chiavi «1440 /», «390 /»… di docs/superpowers/specs/2026-09-13-coreografia-era-residence/measure-lcp.mjs,
//   { median: { t, tag, url }, cls: [tre giri], runs: [tre giri] }, in contesti nudi 1440×900 e
//   390×664 a DPR 1 come la tabella di §2.5: il confronto con la spec, nessun test le legge.
// In coda a risultati.md scrive la tabella accanto ai numeri di §2.5.
//
// Uso: build con le variabili del webServer di playwright.site.config.ts, poi
//      node scripts/probe-lcp-base.mjs
// Uscita: 0; 3 se su una delle tre pagine senza foto l'elemento LCP non è l'H1.

import { mkdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import { dirname, join } from "node:path";
import { devices } from "@playwright/test";
import {
  ROOT,
  appendResults,
  gitCommit,
  launch,
  mdTable,
  motionContext,
  startServer,
  today,
} from "../docs/superpowers/specs/2026-09-13-coreografia-era-residence/misure/lib.mjs";

const ROUTES = ["/", "/vendi", "/contatti", "/case-vendute", "/valutazione-immobile-tradate"];
const TEXT_ONLY = ["/contatti", "/case-vendute", "/valutazione-immobile-tradate"];
const PROJECTS = {
  "desktop-1440": { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
  "mobile-390": { ...devices["iPhone 13"] },
};
// Contesti nudi di measure-lcp.mjs e della tabella di §2.5 (390×664 senza emulazione del dispositivo).
const FLAT = {
  "1440": { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  "390": { viewport: { width: 390, height: 664 }, deviceScaleFactor: 1 },
};
const RUNS = 3;
const SETTLE_MS = 4000;
const WAIT_UNTIL = "load";
const SPREAD_WARN_MS = 100;
const DRIFT_MS = 60;
// Tabella di spec §2.5: build del 13 settembre, contesti nudi.
const SPEC = {
  "/": { "1440": ["IMG", 104], "390": ["IMG", 124] },
  "/vendi": { "1440": ["IMG", 76], "390": ["IMG", 72] },
  "/contatti": { "1440": ["H1", 80], "390": ["H1", 104] },
  "/case-vendute": { "1440": ["H1", 112], "390": ["H1", 116] },
  "/valutazione-immobile-tradate": { "1440": ["H1", 116], "390": ["H1", 116] },
};

async function measureOnce(browser, base, descriptor, route) {
  const ctx = await motionContext(browser, descriptor);
  try {
    await ctx.addInitScript(() => {
      window.__lcp = [];
      window.__cls = 0;
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          window.__lcp.push({ t: Math.round(e.startTime), tag: e.element ? e.element.tagName : null, url: e.url || null });
        }
      }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
      }).observe({ type: "layout-shift", buffered: true });
    });
    const page = await ctx.newPage();
    await page.goto(base + route, { waitUntil: WAIT_UNTIL, timeout: 60_000 });
    await page.waitForTimeout(SETTLE_MS);
    const v = await page.evaluate(() => ({ last: window.__lcp.at(-1) ?? null, cls: window.__cls }));
    if (!v.last) throw new Error(`nessuna voce largest-contentful-paint su ${route}`);
    const url = v.last.url ? new URL(v.last.url) : null;
    return {
      lcpMs: v.last.t,
      tag: v.last.tag,
      url: url ? url.pathname + url.search : null,
      cls: Number(v.cls.toFixed(4)),
    };
  } finally {
    await ctx.close();
  }
}

async function measureRoute(browser, base, descriptor, route) {
  const runs = [];
  for (let i = 0; i < RUNS; i++) runs.push(await measureOnce(browser, base, descriptor, route));
  const sorted = [...runs].sort((a, b) => a.lcpMs - b.lcpMs);
  return { runs, mid: sorted[Math.floor(RUNS / 2)], spreadMs: sorted[RUNS - 1].lcpMs - sorted[0].lcpMs };
}

const server = await startServer();
const browser = await launch();
const projects = {};
const flat = {};
const warnings = [];
try {
  for (const [name, descriptor] of Object.entries(PROJECTS)) {
    projects[name] = {};
    for (const route of ROUTES) {
      const { runs, mid, spreadMs } = await measureRoute(browser, server.base, descriptor, route);
      const entry = { lcpMs: mid.lcpMs, tag: mid.tag, url: mid.url, cls: Math.max(...runs.map((r) => r.cls)), runs, spreadMs };
      projects[name][route] = entry;
      console.log(`${name} ${route}: ${entry.tag} ${entry.lcpMs} ms (giri ${runs.map((r) => r.lcpMs).join("/")}), CLS ${entry.cls}`);
      if (spreadMs > SPREAD_WARN_MS) warnings.push(`${name} ${route}: scarto fra i giri ${spreadMs} ms`);
    }
  }
  for (const [width, descriptor] of Object.entries(FLAT)) {
    for (const route of ROUTES) {
      const key = `${width} ${route}`;
      const { runs, mid, spreadMs } = await measureRoute(browser, server.base, descriptor, route);
      flat[key] = {
        median: { t: mid.lcpMs, tag: mid.tag, url: mid.url },
        cls: runs.map((r) => r.cls),
        runs: runs.map((r) => r.lcpMs),
      };
      console.log(`${key}: ${mid.tag} ${mid.lcpMs} ms (giri ${flat[key].runs.join("/")}), CLS ${flat[key].cls.join("/")}`);
      if (spreadMs > SPREAD_WARN_MS) warnings.push(`${key}: scarto fra i giri ${spreadMs} ms`);
    }
  }
} finally {
  await browser.close();
  await server.stop();
}

const file = join(ROOT, "e2e", "baseline", "lcp-base.json");
mkdirSync(dirname(file), { recursive: true });
writeFileSync(
  file,
  `${JSON.stringify(
    {
      schema: 1,
      measuredAt: new Date().toISOString(),
      commit: gitCommit(),
      machine: { platform: process.platform, cpu: os.cpus()[0]?.model ?? "sconosciuta", cores: os.cpus().length, node: process.version },
      conditions: {
        consent: "none",
        curtain: "skipped",
        network: "unthrottled",
        cpu: "unthrottled",
        reducedMotion: "no-preference",
        runs: RUNS,
        settleMs: SETTLE_MS,
        waitUntil: WAIT_UNTIL,
        workers: 1,
        server: "next start",
        flatViewports: Object.fromEntries(
          Object.entries(FLAT).map(([w, d]) => [w, { ...d.viewport, deviceScaleFactor: d.deviceScaleFactor }]),
        ),
      },
      routes: ROUTES,
      projects,
      ...flat,
    },
    null,
    2,
  )}\n`,
  "utf8",
);

// Ordine esplicito delle colonne: Object.keys(FLAT) darebbe le chiavi intere in ordine numerico (390, 1440) e le
// intestazioni, che seguono `widths`, direbbero il contrario (giro di correzione 1 del commit 2).
const widths = ["1440", "390"];
const names = Object.keys(PROJECTS);
const at = (w, route) => flat[`${w} ${route}`];
const rows = ROUTES.map((route) => {
  const drift = widths
    .filter((w) => {
      const [tag, ms] = SPEC[route][w];
      return at(w, route).median.tag !== tag || Math.abs(at(w, route).median.t - ms) > DRIFT_MS;
    })
    .map((w) => `${w}: ${SPEC[route][w][0]} ${SPEC[route][w][1]} → ${at(w, route).median.tag} ${at(w, route).median.t}`);
  return [
    route,
    ...widths.map((w) => `${at(w, route).median.tag} ${at(w, route).median.t} ms`),
    ...names.map((p) => `${projects[p][route].tag} ${projects[p][route].lcpMs} ms`),
    widths.map((w) => Math.max(...at(w, route).cls)).join(" / "),
    widths.map((w) => `${SPEC[route][w][0]} ${SPEC[route][w][1]}`).join(" · "),
    drift.join("; ") || "—",
  ];
});
const missingH1 = TEXT_ONLY.flatMap((route) => [
  ...widths.filter((w) => at(w, route).median.tag !== "H1").map((w) => `${w} ${route}: ${at(w, route).median.tag}`),
  ...names.filter((p) => projects[p][route].tag !== "H1").map((p) => `${p} ${route}: ${projects[p][route].tag}`),
]);
const decision = missingH1.length
  ? `ATTENZIONE: sulle pagine senza foto l'elemento LCP non è l'H1 (${missingH1.join("; ")}). La regola di spec §2.5 sul lead intero parte da quell'H1: il blocco si ferma e il caso va al coordinatore prima del commit 6.`
  : "Sulle tre pagine senza foto l'elemento LCP è l'H1 nelle due forme, come in spec §2.5: la regola del lead intero vale. Questa è la base del test 6 su questa macchina; la tabella di §2.5 resta la misura della spec.";

appendResults(
  [
    "## 02 · Base dell'LCP e del CLS (scripts/probe-lcp-base.mjs)",
    "",
    `${today()} · commit ${gitCommit()} · contesti nudi 1440×900 e 390×664 a DPR 1 (chiavi di measure-lcp.mjs, confronto con §2.5) e progetti desktop-1440 (Desktop Chrome, 1440×900) e mobile-390 (iPhone 13 su chromium, 390×664, DPR 3), che legge il test 6 · next start sulla 3178 col build della suite, un contesto alla volta, senza consenso, sipario saltato, rete e CPU non frenate, ${WAIT_UNTIL} più ${SETTLE_MS} ms, ultima voce LCP, mediana di ${RUNS} giri · ${os.cpus()[0]?.model ?? "CPU sconosciuta"}`,
    "",
    mdTable(
      [
        "rotta",
        ...widths.map((w) => `${w}×${FLAT[w].viewport.height} (§2.5)`),
        ...names.map((p) => `${p} (test 6)`),
        `CLS ${widths.join(" / ")} (massimo)`,
        `§2.5 ${widths.join(" · ")}`,
        `scarti > ${DRIFT_MS} ms o tag diverso`,
      ],
      rows,
    ),
    "",
    `Decisione: ${decision}`,
    warnings.length ? `\nScarti fra i giri oltre ${SPREAD_WARN_MS} ms: ${warnings.join("; ")}.` : "",
  ].join("\n"),
);
console.log(decision);
if (warnings.length) console.log(`scarti fra i giri: ${warnings.join("; ")}`);
process.exit(missingH1.length ? 3 : 0);
