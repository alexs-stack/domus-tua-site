// Commit 10a del piano 2026-09-13: il nastro di HorizonStory dopo la pulizia
// dei fiori (C12 della cliente; spec §3.5 punto 1, valori invariati per A12 e
// A20 di Alberto). Misura data-on della radice, m41 del track, m41 della prima
// riga a gradini e clip-path del primo sipario a cinque quote della corsa di
// #storia, a 1440x900 e 1024x768 (MQ.corridor, D22) e a 390x664 (colonna).
// Argomento: l'etichetta della corsa ("prima", "dopo", "dopo 10b"). Le tabelle
// di due corse devono coincidere entro 1 px.
import { startServer, launch, motionContext, scrollInstant, mdTable, appendResults, gitCommit, today } from "./lib.mjs";

const label = process.argv[2] ?? "dopo";
const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
  { width: 390, height: 664 },
];
const QUOTE = [0, 0.25, 0.5, 0.75, 1];

const srv = await startServer();
const browser = await launch();
try {
  for (const vp of VIEWPORTS) {
    const mobile = vp.width < 768;
    const ctx = await motionContext(
      browser,
      { viewport: vp, deviceScaleFactor: mobile ? 3 : 1, isMobile: mobile, hasTouch: mobile },
      { consent: "accepted" },
    );
    const page = await ctx.newPage();
    await page.goto(`${srv.base}/`, { waitUntil: "load" });
    await page.waitForTimeout(1500);
    const rows = [];
    for (const q of QUOTE) {
      const y = await page.evaluate((quota) => {
        const root = document.querySelector("#storia");
        const top = root.getBoundingClientRect().top + window.scrollY;
        return top + quota * Math.max(0, root.offsetHeight - window.innerHeight);
      }, q);
      await scrollInstant(page, y);
      // scrub 0,25 del track e sipario da 1,6 s: a 2,2 s tutto è fermo.
      await page.waitForTimeout(2200);
      const r = await page.evaluate(() => {
        const m = (el) => {
          if (!el) return null;
          const t = getComputedStyle(el).transform;
          return new DOMMatrixReadOnly(t === "none" ? undefined : t);
        };
        const track = m(document.querySelector("#storia .dt-horizon_track"));
        const stair = m(document.querySelector("#storia [data-horizon-stair]"));
        const slide = document.querySelector("#storia [data-horizon-slide]");
        return {
          on: document.querySelector("#storia").hasAttribute("data-on") ? 1 : 0,
          trackX: track ? Math.round(track.m41) : 0,
          stairX: stair ? Math.round(stair.m41) : 0,
          clip: slide ? getComputedStyle(slide).clipPath : "none",
        };
      });
      rows.push([q, r.on, r.trackX, r.stairX, r.clip]);
    }
    appendResults(
      `### 10a nastro invariato (${label}), ${today()}, ${gitCommit()}, ${vp.width}x${vp.height}\n\n` +
        mdTable(["quota", "data-on", "track m41", "gradino m41", "clip sipario"], rows),
    );
    await ctx.close();
  }
} finally {
  await browser.close();
  await srv.stop();
}
