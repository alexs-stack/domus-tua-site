// Misure del commit 13 (spec 2026-09-13 §3.10 e §4): la finestra di Open Domus sul build, motion
// ok. Corridoio a 1440×900, 1024×768, 1920×1080; senza corridoio a 1440×600 e 390×664.
// s = scroll dal bordo alto dell'area, in schermi; p = progresso della timeline (start = area − 1vh).
// Le quote scendono fino a 3,2 e poi risalgono a 2,5, 1,5 e 0,5: il cue all'indietro (C22).
// Più la variante servita della foto (SIZES_FINESTRA) e l'altezza della banda senza corridoio.
// Si lancia dopo `npm run build`:
//   node docs/superpowers/specs/2026-09-13-coreografia-era-residence/misure/13-finestra.mjs
import { startServer, launch, motionContext, scrollInstant, mdTable, appendResults, gitCommit, today } from "./lib.mjs";

const CORRIDOIO = [
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
  { width: 1920, height: 1080 },
];
const SENZA = [
  { width: 1440, height: 600 },
  { width: 390, height: 664 },
];
const QUOTE = [-1, -0.5, -0.25, 0, 0.25, 0.5, 0.8, 1, 1.5, 2.01, 2.5, 3, 3.2, 2.5, 1.5, 0.5];
const GIRO = QUOTE.indexOf(3.2);

const stato = (page) =>
  page.evaluate(() => {
    const s = document.querySelector("#open-domus");
    const q = (sel) => s.querySelector(sel);
    const cs = (el) => getComputedStyle(el);
    const a = (el) => new DOMMatrixReadOnly(cs(el).transform === "none" ? undefined : cs(el).transform).a;
    const area = q(".dt-od_area");
    const areaTop = area.getBoundingClientRect().top + window.scrollY;
    const vh = window.innerHeight;
    const clip = cs(q(".dt-od_shutter--l")).clipPath;
    const ord = clip.startsWith("polygon(") ? Number.parseFloat(clip.slice(8, -1).split(",")[3].trim().split(/\s+/)[1]) : NaN;
    let op = 1;
    for (let el = q(".dt-od_content h2 [data-c]"); el && el.id !== "main"; el = el.parentElement) op *= Number(cs(el).opacity);
    return {
      p: Math.min(1, Math.max(0, (window.scrollY - areaTop + vh) / (3 * vh))),
      ord,
      aSh: a(q(".dt-od_shutters")),
      aSt: a(q(".dt-od_stage")),
      vis: cs(q(".dt-od_screen")).visibility,
      contentTop: q(".dt-od_content").getBoundingClientRect().top / vh,
      op,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });

const geometria = [];
const campioni = [];
const varianti = [];
const senza = [];

/** Variante servita della foto della finestra: w dal currentSrc, scatola, resa cover del 3:2, DPR. */
async function variante(page, base, passata) {
  await page.waitForFunction(
    () => {
      const el = document.querySelector("#open-domus .dt-od_window img");
      return !!el && el.complete && el.naturalWidth > 0;
    },
    null,
    { timeout: 15000 },
  );
  const m = await page.evaluate(() => {
    const img = document.querySelector("#open-domus .dt-od_window img");
    const box = img.parentElement.getBoundingClientRect();
    return { src: img.currentSrc, bw: box.width, bh: box.height, dpr: window.devicePixelRatio };
  });
  const w = Number(new URL(m.src, base).searchParams.get("w"));
  const resa = Math.max(m.bw, m.bh * (2560 / 1707));
  varianti.push([passata, w, Math.round(m.bw), Math.round(m.bh), Math.round(resa), m.dpr, (w / (resa * m.dpr)).toFixed(2)]);
}

const { base, stop } = await startServer();
const browser = await launch();
try {
  for (const vp of CORRIDOIO) {
    const ctx = await motionContext(browser, { viewport: vp }, { consent: "accepted" });
    const page = await ctx.newPage();
    await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#open-domus[data-on]", { timeout: 15000 });
    const g = await page.evaluate(() => {
      const s = document.querySelector("#open-domus");
      const h = (sel) => s.querySelector(sel).offsetHeight;
      return {
        vh: window.innerHeight,
        section: s.offsetHeight,
        run: h(".dt-od_area") - h(".dt-od_stage"),
        win: h(".dt-od_window"),
        pad: Number.parseFloat(getComputedStyle(s.querySelector(".dt-od_content")).paddingTop),
        areaTop: s.querySelector(".dt-od_area").getBoundingClientRect().top + window.scrollY,
      };
    });
    const nome = `${vp.width}x${vp.height}`;
    geometria.push([nome, g.section, g.run, g.win, Math.round(g.pad)]);
    for (const [k, s] of QUOTE.entries()) {
      await scrollInstant(page, Math.round(g.areaTop + s * g.vh));
      await page.waitForTimeout(s === 3.2 ? 3500 : k > GIRO ? 1500 : 450);
      const r = await stato(page);
      campioni.push([nome, k > GIRO ? `${s} ↑` : s, r.p.toFixed(3), Number.isNaN(r.ord) ? "—" : r.ord.toFixed(2), r.aSh.toFixed(3), r.aSt.toFixed(3), r.vis, r.contentTop.toFixed(2), r.op.toFixed(2), r.overflow]);
    }
    await scrollInstant(page, Math.round(g.areaTop + 2.01 * g.vh));
    await page.waitForTimeout(600);
    await variante(page, base, `${nome} corridoio`);
    await ctx.close();
  }

  {
    const ctx = await motionContext(browser, { viewport: { width: 1440, height: 900 } }, { consent: "accepted" });
    const page = await ctx.newPage();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
    await page.locator("#open-domus .dt-od_window img").scrollIntoViewIfNeeded();
    await variante(page, base, "1440x900 reduce");
    await ctx.close();
  }

  for (const vp of SENZA) {
    const ctx = await motionContext(browser, { viewport: vp }, { consent: "accepted" });
    const page = await ctx.newPage();
    await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
    await page.locator("header").first().waitFor();
    await page.waitForTimeout(1500);
    const g = await page.evaluate(() => {
      const s = document.querySelector("#open-domus");
      return {
        on: s.hasAttribute("data-on"),
        section: s.offsetHeight,
        band: s.querySelector(".dt-od_band").offsetHeight,
        win: s.querySelector(".dt-od_window").offsetHeight,
      };
    });
    const quota = (frazione) =>
      page.evaluate((f) => {
        const r = document.querySelector("#open-domus .dt-od_window").getBoundingClientRect();
        window.scrollTo({ top: window.scrollY + r.top - (window.innerHeight - f * r.height), behavior: "instant" });
      }, frazione);
    const clip = () => page.evaluate(() => getComputedStyle(document.querySelector("#open-domus .dt-od_window")).clipPath);
    await quota(0.2);
    await page.waitForTimeout(600);
    const clip20 = await clip();
    await quota(0.5);
    await page.waitForTimeout(1700);
    const clip50 = await clip();
    await page.evaluate(() => document.querySelector("#open-domus .dt-od_content h2").scrollIntoView({ block: "center" }));
    await page.waitForTimeout(3500);
    const r = await stato(page);
    senza.push([`${vp.width}x${vp.height}`, g.on ? "sì" : "no", g.section, g.band, g.win, clip20, clip50, r.op.toFixed(2), r.overflow]);
    await ctx.close();
  }
} finally {
  await browser.close();
  await stop();
}

appendResults(`### 13 · finestra di Open Domus · ${today()} · ${gitCommit()}

Geometria col corridoio (px):

${mdTable(["viewport", "section", "pista", "foto", "padding contenuto"], geometria)}

Campioni di scroll (↑ = in risalita):

${mdTable(["viewport", "s (schermi)", "p", "ordinata tenda sx %", "a tende", "a stage", "schermo", "top contenuto / vh", "opacità h2", "traboccamento"], campioni)}

Variante servita della foto:

${mdTable(["passata", "w", "scatola larga", "scatola alta", "resa cover", "DPR", "w / (resa × DPR)"], varianti)}

Senza corridoio:

${mdTable(["viewport", "data-on", "section", "banda", "foto", "clip al 20 %", "clip al 50 % dopo 1,7 s", "opacità h2", "traboccamento"], senza)}`);
console.log(JSON.stringify({ geometria, campioni, varianti, senza }, null, 1));
