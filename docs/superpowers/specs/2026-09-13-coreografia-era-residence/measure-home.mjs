// Misura l'altezza della home e delle sezioni a 1440x900 e 390x664, motion ok, sipario saltato.
import { chromium } from "file:///C:/Users/alber/domus-tua-site/node_modules/playwright/index.mjs";

const BASE = "http://127.0.0.1:3199";
const out = {};
const browser = await chromium.launch();
for (const [name, vp] of [["1440x900", { width: 1440, height: 900 }], ["1024x768", { width: 1024, height: 768 }], ["390x664", { width: 390, height: 664 }]]) {
  const ctx = await browser.newContext({ viewport: vp, reducedMotion: "no-preference" });
  await ctx.addCookies([{ name: "dt_consent", value: "accepted", domain: "127.0.0.1", path: "/" }]);
  await ctx.addInitScript(() => { try { sessionStorage.setItem("dt-intro-seen", "1"); } catch {} });
  const page = await ctx.newPage();
  await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(2500);
  // passata intera per far misurare i trigger, poi in cima
  for (let y = 0; y < 60000; y += 800) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(30); }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(800);
  out[name] = await page.evaluate(() => {
    const doc = document.documentElement.scrollHeight;
    const main = document.querySelector("main");
    const secs = [...(main?.children ?? [])].map((el) => ({
      id: el.id || el.className.toString().slice(0, 40),
      h: Math.round(el.getBoundingClientRect().height),
      on: el.querySelector("[data-on]") ? 1 : el.hasAttribute("data-on") ? 1 : 0,
    }));
    const footer = document.querySelector("footer");
    return { doc, footer: Math.round(footer?.getBoundingClientRect().height ?? 0), secs, onCount: document.querySelectorAll("[data-on]").length };
  });
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(out, null, 1));
