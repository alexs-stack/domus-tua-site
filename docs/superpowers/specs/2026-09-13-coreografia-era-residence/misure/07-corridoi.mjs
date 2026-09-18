// Misura del commit 7: corridoi accesi e ripristino al capitolo. A19 di
// Alberto («Sticky dove serve»); soglia, layout e ripristino di D22 (spec §4
// e §2.7). Sul build di produzione, con next start sulla 3178 (lib.mjs),
// motion ok e sipario saltato. Misura:
// - per ogni viewport della home: corridoi accesi, elementi sticky in #main,
//   altezza del documento, traboccamento orizzontale;
// - su /vendi a 1440×900: corridoi accesi (il commit 18 allunga EXPECTED_VENDI_ON);
// - lo scarto del ripristino al capitolo, ricaricando a metà di #servizi a
//   1440×900 col ripristino nativo spento e lo scarto salvato falsato di
//   120 px: torna al punto giusto solo il codice di Preloader.tsx.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { devices } from "@playwright/test";
import { ROOT, appendResults, gitCommit, launch, mdTable, motionContext, scrollInstant, startServer, today } from "./lib.mjs";

/** Gli host accesi sulla home con MQ.corridor vero: lo stesso elenco di EXPECTED_HOME in e2e/corridors.spec.ts. */
const EXPECTED_ON = ["cartolina", "finestra", "hero", "recensioni", "storia", "team"];
/** Gli host accesi su /vendi a 1440×900: lo stesso elenco di EXPECTED_VENDI. */
const EXPECTED_VENDI_ON = [];
const VIEWPORTS = [
  [1440, 900],
  [1024, 768],
  [1920, 1080],
  [1280, 600],
  [1440, 600],
  [390, 664],
];
/** Lo scarto aggiunto a `dy` prima della ricarica (D22): prova il codice, non il ripristino del browser. */
const SHIFT = 120;

function lastYKey() {
  const m = /export const LAST_Y_KEY = "([^"]+)"/.exec(readFileSync(join(ROOT, "app/lib/motion/intro-constants.ts"), "utf8"));
  if (!m) throw new Error("LAST_Y_KEY non trovato in app/lib/motion/intro-constants.ts");
  return m[1];
}

function descriptorFor(width, height) {
  return { ...(width < 768 ? devices["iPhone 13"] : devices["Desktop Chrome"]), viewport: { width, height } };
}

async function open(browser, base, path, width, height) {
  const ctx = await motionContext(browser, descriptorFor(width, height), { consent: "accepted" });
  const page = await ctx.newPage();
  await page.goto(`${base}${path}`, { waitUntil: "load" });
  if (path === "/") {
    // Il ramo di GSAP è scelto quando le stelle portano data-on o data-sr-mob (D22).
    await page.waitForSelector(".dt-starrev[data-on], .dt-starrev[data-sr-mob]", { state: "attached", timeout: 20000 });
  }
  await page.waitForTimeout(1500);
  return { ctx, page };
}

function measure(page) {
  return page.evaluate(() => ({
    on: [...document.querySelectorAll("[data-corridor][data-on]")].map((el) => el.getAttribute("data-corridor")).sort(),
    sticky: [...document.querySelectorAll("#main *")].filter((el) => getComputedStyle(el).position === "sticky").length,
    doc: document.documentElement.scrollHeight,
    overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }));
}

const HEADER = ["viewport", "rotta", "accesi", "attesi", "sticky", "altezza", "overflowX", "scarto ricarica (px)", "esito"];
const rows = [];
let failures = 0;
function push(cells, ok) {
  if (!ok) failures++;
  rows.push([...cells, ok ? "ok" : "NO"]);
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const { base, stop } = await startServer();
const browser = await launch();
try {
  for (const [width, height] of VIEWPORTS) {
    const { ctx, page } = await open(browser, base, "/", width, height);
    const r = await measure(page);
    const want = width >= 1024 && height >= 640 ? EXPECTED_ON : [];
    push(
      [`${width}×${height}`, "/", r.on.join(" ") || "nessuno", want.join(" ") || "nessuno", r.sticky, r.doc, r.overflowX, ""],
      same(r.on, want) && r.overflowX <= 1,
    );
    await ctx.close();
  }

  {
    const { ctx, page } = await open(browser, base, "/vendi", 1440, 900);
    const r = await measure(page);
    push(
      ["1440×900", "/vendi", r.on.join(" ") || "nessuno", EXPECTED_VENDI_ON.join(" ") || "nessuno", r.sticky, r.doc, r.overflowX, ""],
      same(r.on, EXPECTED_VENDI_ON) && r.overflowX <= 1,
    );
    await ctx.close();
  }

  {
    const ctx = await motionContext(browser, descriptorFor(1440, 900), { consent: "accepted" });
    await ctx.addInitScript(
      ([key, shift]) => {
        history.scrollRestoration = "manual";
        try {
          const s = JSON.parse(sessionStorage.getItem(key) ?? "null");
          if (s && typeof s.dy === "number") {
            s.dy += shift;
            sessionStorage.setItem(key, JSON.stringify(s));
          }
        } catch {
          // storage negato (D22): la riga esce NO
        }
      },
      [lastYKey(), SHIFT],
    );
    const page = await ctx.newPage();
    await page.goto(`${base}/`, { waitUntil: "load" });
    await page.waitForSelector(".dt-starrev[data-on]", { state: "attached", timeout: 20000 });
    const mid = await page
      .locator("#servizi")
      .evaluate((el) => Math.round(el.getBoundingClientRect().top + window.scrollY + el.offsetHeight / 2));
    // A passi di un viewport (D22): nastro e rotaia misurano le loro altezze lungo la strada.
    for (let y = 0; y < mid; y += 900) await scrollInstant(page, y);
    await scrollInstant(page, mid);
    await page.waitForTimeout(800);
    const title = page.locator("#servizi h2").first();
    const before = await title.evaluate((el) => el.getBoundingClientRect().top);
    await page.reload({ waitUntil: "load" });
    await page.waitForTimeout(3000);
    const after = await title.evaluate((el) => el.getBoundingClientRect().top);
    const scrollY = await page.evaluate(() => window.scrollY);
    const delta = Math.round(Math.abs(after - (before - SHIFT)) * 10) / 10;
    push(["1440×900", "/ ricarica a metà di #servizi", "", "", "", "", "", `${delta} (scrollY ${Math.round(scrollY)})`], delta <= 2 && scrollY > 0);
    await ctx.close();
  }
} finally {
  await browser.close();
  await stop();
}

const table = mdTable(HEADER, rows);
appendResults(`### Commit 7: corridoi accesi e ripristino al capitolo (${today()}, ${gitCommit()})\n\n${table}`);
console.log(table);
if (failures > 0) process.exitCode = 1;
