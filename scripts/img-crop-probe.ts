/**
 * Sonda del RITAGLIO delle foto — quanta parte della sorgente sopravvive.
 *
 * Il difetto segnalato dal cliente («su mobile la foto è tagliata») non è un
 * aggettivo: è una frazione. Una foto orizzontale (2000×1415) dentro una
 * scatola verticale (390×844) a `object-cover` mostra una striscia centrale
 * larga il 33% della sorgente. Questa sonda la misura, per ogni <img> di ogni
 * rotta, a ogni larghezza — così il prima/dopo si confronta con un numero.
 *
 *   npx tsx scripts/img-crop-probe.ts [--url http://127.0.0.1:3181]
 *       [--widths 390x844,1440x900] [--out docs/shots/crop.json] [--min 0.65]
 *
 * Per ogni immagine stampa la quota di LARGHEZZA e di ALTEZZA della sorgente
 * che resta visibile dopo object-fit/object-position. `--min` è la soglia
 * sotto la quale la riga viene marcata ⚠ (default 0,65).
 *
 * Non avvia il server: serve una build in ascolto (`npx next start --port 3181`).
 */
import { chromium, devices } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const arg = (f: string, d: string) => {
  const i = process.argv.indexOf(f);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : d;
};
const base = arg("--url", "http://127.0.0.1:3181").replace(/\/$/, "");
const outFile = arg("--out", "docs/shots/crop.json");
const MIN = Number(arg("--min", "0.65"));
const sizes = arg("--widths", "390x844,1440x900")
  .split(",")
  .map((s) => {
    const [w, h] = s.trim().split("x").map(Number);
    return { w, h };
  });
const routes = arg(
  "--routes",
  "/,/acquista,/vendi,/case-vendute,/metodo,/open-domus,/servizi,/chi-siamo,/recensioni,/contatti,/lavora-con-noi"
)
  .split(",")
  .map((r) => r.trim())
  .filter(Boolean);

type Row = {
  route: string;
  vw: number;
  src: string;
  natural: string;
  box: string;
  fit: string;
  pos: string;
  keepW: number;
  keepH: number;
  hidden: boolean;
};

const collect = () => {
  const out: Row[] = [];
  const imgs = Array.from(document.querySelectorAll("img"));
  for (const img of imgs) {
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    const r = img.getBoundingClientRect();
    if (!nw || !nh || !r.width || !r.height) continue;
    const cs = getComputedStyle(img);
    const fit = cs.objectFit || "fill";
    const pos = cs.objectPosition || "50% 50%";
    let keepW = 1;
    let keepH = 1;
    if (fit === "cover") {
      const srcAR = nw / nh;
      const boxAR = r.width / r.height;
      if (srcAR > boxAR) keepW = boxAR / srcAR; // taglia ai lati
      else keepH = srcAR / boxAR; // taglia sopra/sotto
    } else if (fit === "contain" || fit === "scale-down") {
      keepW = 1;
      keepH = 1;
    }
    const hidden = cs.visibility === "hidden" || cs.display === "none" || Number(cs.opacity) === 0;
    out.push({
      route: location.pathname,
      vw: window.innerWidth,
      src: (img.currentSrc || img.src).replace(location.origin, "").slice(0, 120),
      natural: `${nw}x${nh}`,
      box: `${Math.round(r.width)}x${Math.round(r.height)}`,
      fit,
      pos,
      keepW: Number(keepW.toFixed(3)),
      keepH: Number(keepH.toFixed(3)),
      hidden,
    });
  }
  return out;
};

async function main() {
  const browser = await chromium.launch();
  const rows: Row[] = [];
  for (const { w, h } of sizes) {
    const ctx = await browser.newContext({
      ...(w < 768 ? devices["iPhone 13"] : {}),
      viewport: { width: w, height: h },
      isMobile: w < 768,
      hasTouch: w < 768,
    });
    await ctx.addCookies([{ name: "dt_consent", value: "accepted", url: base }]);
    await ctx.addInitScript(() => {
      try {
        sessionStorage.setItem("dt-intro-seen", "1");
      } catch {}
    });
    const page = await ctx.newPage();
    for (const route of routes) {
      await page.goto(`${base}${route}`, { waitUntil: "networkidle", timeout: 60_000 });
      await page.evaluate(async () => {
        const step = window.innerHeight;
        for (let y = 0; y < document.body.scrollHeight; y += step) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 140));
        }
        window.scrollTo(0, 0);
        await new Promise((r) => setTimeout(r, 500));
      });
      const got = (await page.evaluate(collect)) as Row[];
      got.forEach((g) => rows.push({ ...g, route }));
    }
    await ctx.close();
  }
  await browser.close();

  await mkdir(path.dirname(outFile), { recursive: true });
  await writeFile(outFile, JSON.stringify(rows, null, 2), "utf8");

  // Report: solo le righe sotto soglia, ordinate per perdita.
  const bad = rows
    .filter((r) => !r.hidden && (r.keepW < MIN || r.keepH < MIN))
    .sort((a, b) => Math.min(a.keepW, a.keepH) - Math.min(b.keepW, b.keepH));
  console.log(`\n${rows.length} immagini misurate, ${bad.length} sotto ${MIN}\n`);
  for (const r of bad) {
    const worst = Math.min(r.keepW, r.keepH);
    const axis = r.keepW < r.keepH ? "larghezza" : "altezza";
    console.log(
      `${String(r.vw).padStart(4)}px ${r.route.padEnd(16)} ${(worst * 100).toFixed(0).padStart(3)}% ${axis.padEnd(9)} ` +
        `box ${r.box.padEnd(10)} src ${r.natural.padEnd(10)} pos ${r.pos.padEnd(12)} ${r.src}`
    );
  }
  console.log(`\n→ ${outFile}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
