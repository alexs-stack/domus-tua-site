// Base LCP e CLS del branch attuale (TextLines), motion ok, sipario saltato, SENZA consenso.
import { chromium } from "file:///C:/Users/alber/domus-tua-site/node_modules/playwright/index.mjs";

const BASE = "http://127.0.0.1:3199";
const routes = ["/", "/vendi", "/contatti", "/case-vendute", "/valutazione-immobile-tradate"];
const vps = { "1440": { width: 1440, height: 900 }, "390": { width: 390, height: 664 } };
const res = {};
const browser = await chromium.launch();
for (const [vn, vp] of Object.entries(vps)) {
  for (const r of routes) {
    const runs = [];
    for (let i = 0; i < 3; i++) {
      const ctx = await browser.newContext({ viewport: vp, reducedMotion: "no-preference" });
      await ctx.addInitScript(() => {
        try { sessionStorage.setItem("dt-intro-seen", "1"); } catch {}
        window.__lcp = []; window.__cls = 0;
        new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp.push({ t: Math.round(e.startTime), tag: e.element?.tagName, cls: (e.element?.className || "").toString().slice(0, 30), url: (e.url || "").slice(-40) }); }).observe({ type: "largest-contentful-paint", buffered: true });
        new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true });
      });
      const page = await ctx.newPage();
      await page.goto(BASE + r, { waitUntil: "load", timeout: 60000 });
      await page.waitForTimeout(4000);
      const v = await page.evaluate(() => ({ last: window.__lcp.at(-1), cls: +window.__cls.toFixed(4) }));
      runs.push(v);
      await ctx.close();
    }
    runs.sort((a, b) => (a.last?.t ?? 0) - (b.last?.t ?? 0));
    res[`${vn} ${r}`] = { median: runs[1].last, cls: runs.map((x) => x.cls) };
  }
}
await browser.close();
console.log(JSON.stringify(res, null, 1));
