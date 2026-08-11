/**
 * Pellicola di una rotta a 390px: una schermata alla volta, come la vede il pollice.
 *
 * Perché non basta `fullPage: true`. Uno screenshot a pagina intera rende gli
 * elementi `sticky` UNA sola volta, alla loro posizione naturale: tutti i
 * corridoi del sito (`dt-horizon`, `dt-wall`, `dt-paths`, `dt-tt`, `dt-railway`)
 * riservano altezza e mostrerebbero quell'altezza VUOTA. Fotografare a passi di
 * un viewport è l'unico modo di vedere quello che vede una persona — ed è anche
 * l'unico modo di accorgersi se una schermata è davvero vuota.
 *
 *   npx tsx scripts/mobile-filmstrip.ts <cartella> [rotta] [--url http://…]
 *
 * Produce `<rotta>.jpg` (le schermate affiancate) e stampa l'inventario delle
 * sezioni con la loro altezza: dove c'è altezza senza contenuto, si vede qui.
 */
import { chromium, devices } from "@playwright/test";
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const outDir = process.argv[2];
if (!outDir) {
  console.error("uso: npx tsx scripts/mobile-filmstrip.ts <cartella> [rotta] [--url …]");
  process.exit(1);
}
const rest = process.argv.slice(3).filter((a) => !a.startsWith("--"));
const route = rest[0] ?? "/";
const urlFlag = process.argv.indexOf("--url");
const base = urlFlag > -1 ? process.argv[urlFlag + 1] : "http://127.0.0.1:3181";

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({ ...devices["iPhone 13"] });
  await context.addCookies([{ name: "dt_consent", value: "accepted", url: base }]);
  const page = await context.newPage();
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem("dt-intro-seen", "1");
    } catch {}
  });
  await page.goto(`${base}${route}`, { waitUntil: "networkidle", timeout: 60_000 });
  await page.waitForTimeout(800);

  const vh = page.viewportSize()!.height;
  const docH = await page.evaluate(() => document.documentElement.scrollHeight);
  console.log(`${route} — documento ${docH}px = ${(docH / vh).toFixed(1)} schermate da ${vh}px`);

  // Niente funzioni annidate qui dentro: tsx inietta l'helper `__name` di
  // esbuild, che nel contesto della pagina non esiste. Pila esplicita.
  const sections = await page.evaluate(() => {
    const rows: { tag: string; id: string; cls: string; top: number; h: number; depth: number }[] = [];
    const stack: { el: Element; depth: number }[] = [{ el: document.body, depth: 0 }];
    while (stack.length) {
      const { el, depth } = stack.pop()!;
      for (const child of Array.from(el.children)) {
        const r = child.getBoundingClientRect();
        if (r.height <= 200 || depth >= 3) continue;
        rows.push({
          tag: child.tagName.toLowerCase(),
          id: child.id || "",
          cls: typeof child.className === "string" ? child.className.slice(0, 60) : "",
          top: Math.round(r.top + window.scrollY),
          h: Math.round(r.height),
          depth,
        });
        if (depth < 2) stack.push({ el: child, depth: depth + 1 });
      }
    }
    return rows.sort((a, b) => a.top - b.top || a.depth - b.depth);
  });
  for (const s of sections) {
    console.log(`  ${"  ".repeat(s.depth)}${s.tag}${s.id ? `#${s.id}` : ""} top=${s.top} h=${s.h} · ${s.cls}`);
  }

  const shots: Buffer[] = [];
  for (let y = 0; y < docH; y += vh) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(450);
    shots.push(await page.screenshot());
  }

  const W = 190;
  const thumbs = await Promise.all(shots.map((s) => sharp(s).resize({ width: W }).toBuffer()));
  const H = (await sharp(thumbs[0]).metadata()).height!;
  const name = route === "/" ? "home" : route.replace(/^\//, "").replace(/\//g, "-");
  const file = path.join(outDir, `${name}.jpg`);
  await sharp({ create: { width: shots.length * (W + 6), height: H, channels: 3, background: "#222" } })
    .composite(thumbs.map((input, i) => ({ input, left: i * (W + 6), top: 0 })))
    .jpeg({ quality: 74 })
    .toFile(file);
  console.log(`${shots.length} schermate → ${file}`);

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
