// Costo di paint della cartolina nello sticky (commit 17). Spec 2026-09-13
// §3.18 (A19 e A20 di Alberto): a 1440 con CPU ×4 meno di 4 ms di paint per
// fotogramma mentre lo schermo è agganciato e il clip-path scritto da JS
// ridipinge il video. Il tratto sticky va dal bordo alto della section in cima
// al viewport a 80svh più giù. Lo delimitano due performance.mark, che la
// traccia registra nella categoria blink.user_timing sullo stesso orologio
// degli eventi Paint. Il paint si somma in finestre da 16,7 ms sul thread del
// renderer con più eventi Paint e conta solo fra i due mark. Gira sul build
// esistente con lib.mjs del commit 2.
import { appendResults, gitCommit, launch, mdTable, motionContext, startServer, today } from "./lib.mjs";

const vp = { width: 1440, height: 900 };
const { base, stop } = await startServer();
const browser = await launch();
let esito;
try {
  const ctx = await motionContext(browser, { viewport: vp }, { consent: "accepted" });
  const page = await ctx.newPage();
  await page.goto(`${base}/`, { waitUntil: "load" });
  await page.waitForTimeout(800);
  const q = await page.evaluate(() => {
    let y = 0;
    for (let n = document.querySelector('[data-corridor="cartolina"]'); n; n = n.offsetParent) y += n.offsetTop;
    return { secTop: y, vh: window.innerHeight };
  });
  const fineSticky = q.secTop + q.vh * 0.8;
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), q.secTop - 10);
  await page
    .waitForFunction(() => document.querySelector("[data-postcard-clip]")?.getAttribute("data-ambient") === "playing", null, { timeout: 10_000 })
    .catch(() => {});
  const video = await page.evaluate(() => ({
    ambient: document.querySelector("[data-postcard-clip]")?.getAttribute("data-ambient") ?? null,
    src: document.querySelector("[data-postcard-clip] video")?.currentSrc ?? "",
  }));

  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  const eventi = [];
  cdp.on("Tracing.dataCollected", (e) => eventi.push(...e.value));
  const completo = new Promise((r) => cdp.on("Tracing.tracingComplete", r));
  await cdp.send("Tracing.start", { categories: "devtools.timeline,blink.user_timing", transferMode: "ReportEvents" });
  await page.mouse.move(vp.width / 2, vp.height / 2);
  await page.evaluate(() => performance.mark("dt-sticky-start"));
  // Passi da 10 px ogni 50 ms: almeno una trentina di fotogrammi dentro gli 80svh.
  // Non 20: Lenis resta indietro sulla rotella e poi recupera, e con passi da 20
  // il tratto finiva 300 px oltre gli 80svh (misurato, «fine nello sticky» a no).
  for (let i = 0; i < 400; i++) {
    const y = await page.evaluate(() => window.scrollY);
    if (y >= fineSticky - 30) break;
    await page.mouse.wheel(0, 10);
    await page.waitForTimeout(50);
  }
  // Lo scrub 0,9 finisce a schermo ancora agganciato.
  await page.waitForTimeout(1000);
  const yFine = await page.evaluate(() => {
    performance.mark("dt-sticky-end");
    return window.scrollY;
  });
  await cdp.send("Tracing.end");
  await completo;
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  await ctx.close();

  const mark = (nome) => eventi.find((e) => e.name === nome && String(e.cat).includes("blink.user_timing"))?.ts;
  const t0 = mark("dt-sticky-start");
  const t1 = mark("dt-sticky-end");
  const paint = eventi.filter((e) => e.name === "Paint" && typeof e.dur === "number" && t0 !== undefined && t1 !== undefined && e.ts >= t0 && e.ts <= t1);
  const perTid = new Map();
  for (const e of paint) perTid.set(e.tid, (perTid.get(e.tid) ?? 0) + 1);
  const tid = [...perTid.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const secchi = new Map();
  for (const e of paint.filter((x) => x.tid === tid)) {
    const k = Math.floor((e.ts - t0) / 16_667);
    secchi.set(k, (secchi.get(k) ?? 0) + e.dur);
  }
  const ms = [...secchi.values()].map((u) => u / 1000).sort((a, b) => a - b);
  esito = {
    ...video,
    marks: t0 !== undefined && t1 !== undefined,
    agganciato: yFine <= fineSticky,
    yFine,
    fotogrammi: ms.length,
    p95: ms[Math.floor(0.95 * (ms.length - 1))] ?? 0,
    max: ms.at(-1) ?? 0,
  };
} finally {
  await browser.close();
  await stop();
}

const ok = esito.marks && esito.agganciato && esito.fotogrammi >= 30 && esito.ambient === "playing" && esito.max < 4;
appendResults(
  [
    `### Commit 17 · paint della cartolina nello sticky, 1440×900, CPU ×4 (${today()}, ${gitCommit()})`,
    "",
    mdTable(
      ["viewport", "video", "sorgente", "mark", "fine nello sticky", "fotogrammi con paint", "p95 ms", "max ms", "atteso", "esito"],
      [
        [
          "1440×900",
          esito.ambient,
          new URL(esito.src || "about:blank").pathname,
          esito.marks ? "sì" : "no",
          `${esito.agganciato ? "sì" : "no"} (scrollY ${Math.round(esito.yFine)})`,
          esito.fotogrammi,
          Number(esito.p95.toFixed(2)),
          Number(esito.max.toFixed(2)),
          "max < 4 ms, ≥ 30 fotogrammi, video playing, fine nello sticky",
          ok ? "ok" : "KO",
        ],
      ],
    ),
    "",
    "Nota: useAmbientVideo sceglie la sorgente al primo play, quindi la ripiega «sd forzata» di spec §3.18 vale per tutta la sessione, non solo durante lo sticky.",
  ].join("\n"),
);
console.log(esito);
process.exitCode = ok ? 0 : 1;
