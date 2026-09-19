// Misure del commit 12 (spec 2026-09-13 §7): pesi dei file nuovi e variante servita del
// pannello del territorio di HorizonStory, sul build di produzione. A24 di Alberto chiede lì
// un fermo del drone sul quartiere: oggi nessun fotogramma passa R1 e il pannello tiene
// `/media/hero-aerial.jpg`, quindi la foto si cerca per `data-horizon-slide-img` (ce n'è una
// sola nel capitolo) e non per nome di file; la sezione scrive quale file ha trovato.
// Due passate per il pannello:
// - reduced-motion a 1440×900 e 390×664: la foto sta in colonna, a scala 1;
// - motion ok a 1440×900: la foto sta nel nastro orizzontale, dove il sipario la porta a
//   1,15 per 1,6 s (spec §3.1, riga 4), quindi la resa si confronta con layout × 1,15.
// Si lancia dopo `npm run build`, dalla radice del repo:
//   node docs/superpowers/specs/2026-09-13-coreografia-era-residence/misure/12-media.mjs
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { ROOT, startServer, launch, motionContext, scrollInstant, mdTable, appendResults, gitCommit, today } from "./lib.mjs";

const FILE = [
  "images/reali/villa-portico-tenda.jpg",
  "images/reali/villa-piscina-facciata.jpg",
  "images/reali/villa-fronte-acqua.jpg",
  "images/reali/villa-angolo-piscina.jpg",
  "images/reali/villa-lettini.jpg",
  "images/reali/villa-salotto-ombrellone.jpg",
  "images/reali/villa-facciata-lettini.jpg",
  "images/reali/villa-vetrata-lanterne.jpg",
  "images/reali/villa-sala-tour.jpg",
  "images/reali/villa-uliveto.jpg",
  "images/reali/territorio-quartiere.jpg",
  "media/congedo-drone-poster.jpg",
  "media/acqua-poster.jpg",
  "media/congedo-drone-1080.mp4",
  "media/congedo-drone-1080.webm",
  "media/congedo-drone-720.mp4",
  "media/congedo-drone-720.webm",
  "media/acqua-1080.mp4",
  "media/acqua-1080.webm",
];
const pesi = FILE.filter((f) => existsSync(join(ROOT, "public", f))).map((f) => [f, statSync(join(ROOT, "public", f)).size]);

const IMG = "#perche-domus-tua img[data-horizon-slide-img]";
const pannello = [];
/** Il file che il pannello mostra, letto dal parametro `url` della variante servita. */
let foto = "";

/** Aspetta la foto caricata e scrive variante chiesta, layout, DPR e rapporto di resa con la scala massima. */
async function leggi(page, base, passata, scala) {
  await page.waitForFunction(
    (sel) => {
      const el = document.querySelector(sel);
      return !!el && el.complete && el.naturalWidth > 0;
    },
    IMG,
    { timeout: 15000 },
  );
  const m = await page.locator(IMG).evaluate((el) => ({
    layout: el.offsetWidth,
    dpr: window.devicePixelRatio,
    src: el.currentSrc,
    nat: el.naturalWidth,
  }));
  const servita = new URL(m.src, base).searchParams;
  const w = Number(servita.get("w"));
  foto = servita.get("url") ?? m.src;
  pannello.push([passata, Math.round(m.layout), scala, m.dpr, w, m.nat, (w / (m.layout * scala * m.dpr)).toFixed(2)]);
}

const { base, stop } = await startServer();
const browser = await launch();
try {
  for (const vp of [
    { width: 1440, height: 900 },
    { width: 390, height: 664 },
  ]) {
    const ctx = await motionContext(browser, { viewport: vp }, { consent: "accepted" });
    const page = await ctx.newPage();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
    await page.locator("header").first().waitFor();
    await page.locator(IMG).scrollIntoViewIfNeeded();
    await leggi(page, base, `${vp.width}x${vp.height} reduce`, 1);
    await ctx.close();
  }

  // Motion ok a 1440×900: si scorre #storia a passi di 0,02 finché lo slide del territorio sta
  // tutto nel viewport, poi si aspettano i 1,6 s del sipario.
  const ctx = await motionContext(browser, { viewport: { width: 1440, height: 900 } }, { consent: "accepted" });
  const page = await ctx.newPage();
  await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
  await page.locator("header").first().waitFor();
  await page.waitForSelector("#storia[data-on]", { timeout: 15000 });
  const geo = await page.evaluate(() => {
    const s = document.querySelector("#storia");
    return { top: s.getBoundingClientRect().top + window.scrollY, h: s.offsetHeight, ih: window.innerHeight };
  });
  let dentro = false;
  for (let i = 0; i <= 50 && !dentro; i++) {
    await scrollInstant(page, Math.round(geo.top + (i / 50) * (geo.h - geo.ih)));
    await page.waitForTimeout(400);
    dentro = await page.locator(IMG).evaluate((el) => {
      const r = el.parentElement.getBoundingClientRect();
      return r.left >= -1 && r.right <= window.innerWidth + 1 && r.top < window.innerHeight && r.bottom > 0;
    });
  }
  if (!dentro) throw new Error("lo slide del territorio non entra mai per intero nel viewport a 1440×900");
  await page.waitForTimeout(2000);
  await leggi(page, base, "1440x900 motion, sipario", 1.15);
  await ctx.close();
} finally {
  await browser.close();
  await stop();
}

appendResults(`### 12 · media della villa · ${today()} · ${gitCommit()}

${mdTable(["file", "byte"], pesi)}

Pannello del territorio (\`${foto}\`), variante servita:

${mdTable(["passata", "layout px", "scala massima", "DPR", "w chiesta", "naturalWidth", "w / (layout × scala × DPR)"], pannello)}

A24: nessun fermo valido. Il tratto 75-81 s è un'orbita sulla villa, non una ripresa larga, e in tutti i nove candidati 1880-2020 c'è una persona in piedi sotto la gronda del portico (R1): il pannello tiene \`/media/hero-aerial.jpg\`.`);
console.log(JSON.stringify({ pesi, foto, pannello }, null, 1));
