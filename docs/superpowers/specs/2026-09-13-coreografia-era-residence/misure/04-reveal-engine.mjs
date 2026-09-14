// 04 · il motore dei reveal (commit 4 del piano 2026-09-13; spec §2.4, §5.4 e §9.3).
//
// Alberto ha scelto il 13 settembre entrate e uscite speculari (A18) con la
// fedeltà letterale ai tempi di era-residence (A20); D21 fissa inneschi e
// declassamento dei blocchi con link; A26 e D32 tengono ferma /case/[slug].
// Sul build di produzione (lib.mjs: server sulla 3178, chromium headless,
// motion attivo, sipario saltato) tre prove.
//   blocchi  per viewport e per tipo (ctn su /vendi e su /; ctn con lo scarto
//            delay 120 di VendiContent.tsx:845; still di VendiContent.tsx:951,
//            titolo e CTA verso /open-domus) un gruppo nascosto sotto la piega:
//     ingresso   ms fra il salto che lo porta 40 px dentro il bordo e opacità ≥ 0,99
//     salita     ms fra lo stesso salto e il primo fotogramma con opacità > 0,01:
//                il ritardo del gruppo (0,3 s) più lo scarto, più la notifica dell'IO
//     uscita     ms fra il salto che, risalendo, ne mette il bordo alto al 92 %
//                del viewport e opacità ≤ 0,1, e se in quel momento è in vista
//     dall'alto  opacità minima nei 700 ms dopo un rientro dall'alto (era pieno)
//     identità   transform identità a ogni fotogramma dell'ingresso (per still)
//     puntatore  pointer-events da nascosto
//     CLS        somma dei layout-shift della prova
//   /case    su /case/<primo immobile di /acquista>, dopo una passata intera:
//            gruppi e membri armati, durata della transizione del tooltip dei
//            social, numero e durata dei .reveal congelati
//   costo    a 390 con CPU ×4 (CDP Emulation.setCPUThrottlingRate) su /vendi e /:
//            letture e scritture della passata d'armamento più lunga (User
//            Timing dt-reveal-arm-read, dt-reveal-arm-write), dt-reveal-sweep
//            dopo un salto, long task fino a 3 s dall'armamento
// Attesi dalle curve: dtOut porta l'opacità a 0,99 a t = 0,709 della durata,
// quindi 0,3 s di ritardo + 0,851 s ≈ 1.150 ms (con lo scarto di 120 ms
// ≈ 1.270); dtIn la porta a 0,1 a t = 0,974, quindi ≈ 390 ms.
// Uso: `npm run build` su questo albero, poi
//   node docs/superpowers/specs/2026-09-13-coreografia-era-residence/misure/04-reveal-engine.mjs
import { devices } from "@playwright/test";
import { appendResults, gitCommit, launch, mdTable, motionContext, startServer, today } from "./lib.mjs";

const VIEWPORTS = [
  { name: "1440×900", descriptor: { viewport: { width: 1440, height: 900 } } },
  { name: "390×664", descriptor: devices["iPhone 13"] },
];
const HIDDEN = '#main [data-reveal-group][data-reveal-state="hidden"]';
const BLOCKS = [
  { route: "/vendi", kind: "ctn", sel: `${HIDDEN}[data-reveal="ctn"]:not([data-reveal-extra])`, ingresso: [1050, 1450], salita: [280, 420] },
  { route: "/", kind: "ctn", sel: `${HIDDEN}[data-reveal="ctn"]:not([data-reveal-extra])`, ingresso: [1050, 1450], salita: [280, 420] },
  { route: "/vendi", kind: "ctn delay 120", sel: `${HIDDEN}[data-reveal="ctn"][data-reveal-extra="120"]`, ingresso: [1170, 1570], salita: [400, 540] },
  {
    route: "/vendi",
    kind: "still",
    sel: `${HIDDEN}[data-reveal="still"]:not([data-reveal-extra]):has(a[href="/open-domus"])`,
    ingresso: [1050, 1450],
    salita: [280, 420],
  },
];
const LIMITI = { uscita: 600, dallAlto: 0.99, cls: 0.001, armamentoMs: 50, sweepMs: 16 };
const ARMED = () => document.querySelectorAll("#main [data-reveal-state]").length > 0;

const tabelle = { blocchi: [], caso: [], costo: [] };
const falliti = [];
const server = await startServer();
const browser = await launch();

async function blockRow(page, selector) {
  return page.evaluate(async (sel) => {
    const frame = () => new Promise((res) => requestAnimationFrame(() => res(performance.now())));
    const wait = (ms) => new Promise((res) => setTimeout(res, ms));
    const op = (e) => Number(getComputedStyle(e).opacity);
    const identity = (e) => {
      const t = getComputedStyle(e).transform;
      return new DOMMatrixReadOnly(t === "none" ? undefined : t).isIdentity;
    };
    const until = async (e, ok, limit, onFrame) => {
      const t0 = await frame();
      let salita = -1;
      for (;;) {
        const t = await frame();
        onFrame?.(e);
        const o = op(e);
        if (salita < 0 && o > 0.01) salita = Math.round(t - t0);
        if (ok(o) || t - t0 > limit) return { ms: Math.round(t - t0), salita, top: e.getBoundingClientRect().top };
      }
    };
    const el = Array.from(document.querySelectorAll(sel)).find((e) => {
      const b = e.getBoundingClientRect();
      return b.top > innerHeight + 300 && b.height > 20 && b.height < innerHeight * 0.8;
    });
    if (!el) return null;
    const vh = innerHeight;
    const abs = () => el.getBoundingClientRect().top + scrollY;
    const go = (top) => scrollTo({ top, behavior: "instant" });
    const puntatore = getComputedStyle(el).pointerEvents;

    let identita = true;
    go(abs() - vh + 40);
    const ingresso = await until(el, (o) => o >= 0.99, 4000, (e) => {
      if (!identity(e)) identita = false;
    });
    const salita = ingresso.salita;

    go(abs() - vh * 0.4);
    await until(el, (o) => o >= 0.99, 3000);
    await wait(300);
    go(abs() - vh * 0.92);
    const uscita = await until(el, (o) => o <= 0.1, 3000);

    go(abs() - vh * 0.4);
    await until(el, (o) => o >= 0.99, 3000);
    await wait(300);
    go(abs() + el.getBoundingClientRect().height + 300);
    await wait(400);
    go(abs() - vh * 0.3);
    let min = 1;
    const t0 = performance.now();
    while (performance.now() - t0 < 700) {
      await frame();
      min = Math.min(min, op(el));
    }
    return {
      ingressoMs: ingresso.ms,
      salita,
      uscitaMs: uscita.ms,
      uscitaInVista: uscita.top > vh * 0.85 && uscita.top < vh,
      dallAlto: Number(min.toFixed(3)),
      identita,
      puntatore,
      cls: Number(window.__cls.toFixed(4)),
    };
  }, selector);
}

async function caseRow(vp) {
  const ctx = await motionContext(browser, vp.descriptor, { consent: "accepted" });
  const page = await ctx.newPage();
  await page.goto(server.base + "/acquista", { waitUntil: "domcontentloaded" });
  const href = await page.locator('a[href^="/case/"]').first().getAttribute("href");
  await page.goto(server.base + href, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("[data-motion-freeze]", { state: "attached", timeout: 15000 });
  const r = await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight * 0.5) {
      scrollTo({ top: y, behavior: "instant" });
      await new Promise((res) => setTimeout(res, 60));
    }
    await new Promise((res) => setTimeout(res, 1000));
    const tip = document.querySelector("[data-motion-freeze] .dt-social__tip");
    const reveals = Array.from(document.querySelectorAll("[data-motion-freeze] .reveal"));
    return {
      gruppi: document.querySelectorAll("[data-reveal-group]").length,
      armati: document.querySelectorAll("[data-reveal-armed]").length,
      tip: tip ? getComputedStyle(tip).transitionDuration : "assente",
      reveal: reveals.length,
      durata: reveals.length ? getComputedStyle(reveals[0]).transitionDuration : "assente",
    };
  });
  await ctx.close();
  return { href, ...r };
}

async function costRow(route) {
  const ctx = await motionContext(browser, devices["iPhone 13"], { consent: "accepted" });
  await ctx.addInitScript(() => {
    window.__lunghi = [];
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) window.__lunghi.push({ start: e.startTime, dur: e.duration });
    }).observe({ type: "longtask", buffered: true });
  });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await page.goto(server.base + route, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(ARMED, null, { timeout: 30000 });
  await page.waitForTimeout(3000);
  const r = await page.evaluate(async () => {
    const entries = (name) => performance.getEntriesByName(name).map((e) => ({ start: e.startTime, dur: e.duration }));
    const read = entries("dt-reveal-arm-read");
    const write = entries("dt-reveal-arm-write");
    const passate = read.map((p, k) => ({ start: p.start, read: p.dur, write: write[k]?.dur ?? 0 }));
    const peggiore = passate.reduce((a, b) => (b.read + b.write > a.read + a.write ? b : a), { start: 0, read: 0, write: 0 });
    scrollTo({ top: document.documentElement.scrollHeight * 0.6, behavior: "instant" });
    await new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(res, 100))));
    const sweeps = entries("dt-reveal-sweep");
    const lunghi = window.__lunghi;
    const attorno = lunghi.find((l) => l.start <= peggiore.start && l.start + l.dur >= peggiore.start + peggiore.read + peggiore.write);
    return {
      gruppi: document.querySelectorAll("[data-reveal-group]").length,
      passate: passate.length,
      readMs: Number(peggiore.read.toFixed(1)),
      writeMs: Number(peggiore.write.toFixed(1)),
      sweepMs: sweeps.length ? Number(Math.max(...sweeps.map((s) => s.dur)).toFixed(1)) : -1,
      lunghi: lunghi.length,
      lungoMaxMs: lunghi.length ? Math.round(Math.max(...lunghi.map((l) => l.dur))) : 0,
      lungoAttornoMs: attorno ? Math.round(attorno.dur) : 0,
    };
  });
  await ctx.close();
  return r;
}

try {
  for (const vp of VIEWPORTS) {
    for (const b of BLOCKS) {
      const ctx = await motionContext(browser, vp.descriptor, { consent: "accepted" });
      await ctx.addInitScript(() => {
        window.__cls = 0;
        new PerformanceObserver((list) => {
          for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
        }).observe({ type: "layout-shift", buffered: true });
      });
      const page = await ctx.newPage();
      await page.goto(server.base + b.route, { waitUntil: "domcontentloaded" });
      await page.waitForFunction(ARMED, null, { timeout: 15000 });
      await page.waitForTimeout(800);
      const r = await blockRow(page, b.sel);
      await ctx.close();
      const tag = `${b.route} ${vp.name} ${b.kind}`;
      if (!r) {
        falliti.push(`${tag}: nessun blocco nascosto sotto la piega`);
        continue;
      }
      tabelle.blocchi.push([
        b.route,
        vp.name,
        b.kind,
        r.ingressoMs,
        r.salita,
        r.uscitaMs,
        r.uscitaInVista ? "sì" : "no",
        r.dallAlto,
        r.identita ? "sì" : "no",
        r.puntatore,
        r.cls,
      ]);
      if (r.ingressoMs < b.ingresso[0] || r.ingressoMs > b.ingresso[1]) falliti.push(`${tag}: ingresso ${r.ingressoMs} ms`);
      if (r.salita < b.salita[0] || r.salita > b.salita[1]) falliti.push(`${tag}: salita a ${r.salita} ms`);
      if (r.uscitaMs > LIMITI.uscita || !r.uscitaInVista) falliti.push(`${tag}: uscita ${r.uscitaMs} ms, in vista ${r.uscitaInVista}`);
      if (r.dallAlto < LIMITI.dallAlto) falliti.push(`${tag}: rientro dall'alto a ${r.dallAlto}`);
      if (b.kind === "still" && !r.identita) falliti.push(`${tag}: transform diverso da identità durante l'ingresso`);
      if (r.puntatore !== "none") falliti.push(`${tag}: pointer-events ${r.puntatore} da nascosto`);
      if (r.cls > LIMITI.cls) falliti.push(`${tag}: CLS ${r.cls}`);
    }

    const c = await caseRow(vp);
    tabelle.caso.push([c.href, vp.name, c.gruppi, c.armati, c.tip, c.reveal, c.durata]);
    const tag = `${c.href} ${vp.name}`;
    if (c.gruppi !== 0 || c.armati !== 0) falliti.push(`${tag}: ${c.gruppi} gruppi e ${c.armati} membri armati`);
    if (c.tip === "assente" || !c.tip.split(",").every((d) => Number.parseFloat(d) === 0)) falliti.push(`${tag}: tooltip ${c.tip}`);
    if (c.reveal === 0 || c.durata !== "0.9s, 0.9s") falliti.push(`${tag}: ${c.reveal} .reveal congelati, durata ${c.durata}`);
  }

  for (const route of ["/vendi", "/"]) {
    const k = await costRow(route);
    tabelle.costo.push([route, k.gruppi, k.passate, k.readMs, k.writeMs, k.sweepMs, k.lunghi, k.lungoMaxMs, k.lungoAttornoMs]);
    if (k.readMs + k.writeMs > LIMITI.armamentoMs) falliti.push(`${route} 390 CPU×4: armamento ${k.readMs} + ${k.writeMs} ms`);
    if (k.sweepMs < 0 || k.sweepMs > LIMITI.sweepMs) falliti.push(`${route} 390 CPU×4: sweep ${k.sweepMs} ms`);
  }
} finally {
  await browser.close();
  await server.stop();
}

appendResults(
  [
    "## 04 · Motore dei reveal (commit 4)",
    "",
    `${today()} · base ${gitCommit()} più le modifiche del commit 4 · build di produzione sulla 3178, chromium headless, motion attivo, consenso accettato, sipario saltato, scroll istantaneo`,
    "",
    mdTable(
      [
        "rotta",
        "viewport",
        "blocco",
        "ingresso ms (ctn e still 1.050-1.450; delay 120: 1.170-1.570)",
        "salita ms (280-420; delay 120: 400-540)",
        "uscita ms (≤ 600)",
        "uscita in vista",
        "min rientrando dall'alto (≥ 0,99)",
        "identità nell'ingresso (still: sì)",
        "pointer-events da nascosto (none)",
        "CLS (≤ 0,001)",
      ],
      tabelle.blocchi,
    ),
    "",
    mdTable(
      ["scheda", "viewport", "gruppi (0)", "membri armati (0)", "tooltip social (0s)", ".reveal congelati (> 0)", "durata .reveal (0.9s, 0.9s)"],
      tabelle.caso,
    ),
    "",
    mdTable(
      [
        "rotta a 390 CPU×4",
        "gruppi",
        "passate d'armamento",
        "letture ms",
        "scritture ms",
        "sweep ms (≤ 16)",
        "long task fino a 3 s",
        "long task più lungo ms",
        "long task attorno all'armamento ms",
      ],
      tabelle.costo,
    ),
    "",
    `Criteri: letture + scritture della passata più lunga ≤ ${LIMITI.armamentoMs} ms, cioè il motore da solo non fa un long task.`,
    falliti.length ? `Fuori campo: ${falliti.join("; ")}` : "Tutti i numeri nel campo atteso.",
  ].join("\n"),
);
console.log(tabelle);
if (falliti.length) {
  console.error(falliti.join("\n"));
  process.exitCode = 1;
}
