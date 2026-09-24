/**
 * Screenshot di riferimento a 390px — una per rotta, pagina intera.
 *
 * Serve alla wave "parità mobile": il prima e il dopo si guardano affiancati,
 * non si raccontano. Non fa parte della suite e non blocca nulla.
 *
 *   npx tsx scripts/mobile-shots.ts <cartella> [--url http://127.0.0.1:3181]
 *
 * Il server di produzione lo si avvia a parte (`npx next start --port 3181`):
 * lo script non ne possiede il ciclo di vita, così si possono fare più
 * passate contro lo stesso server senza pagare un build ogni volta.
 */
import { chromium, devices } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const ROUTES = [
  ["home", "/"],
  ["acquista", "/acquista"],
  ["vendi", "/vendi"],
  // `/case` non è più una pagina (app/case ha solo [slug]; next.config.ts la redirige a
  // /acquista): al suo posto le due rotte del sitemap che mancavano.
  ["case-vendute", "/case-vendute"],
  ["valutazione-immobile-tradate", "/valutazione-immobile-tradate"],
  ["metodo", "/metodo"],
  ["open-domus", "/open-domus"],
  ["servizi", "/servizi"],
  ["chi-siamo", "/chi-siamo"],
  ["recensioni", "/recensioni"],
  ["contatti", "/contatti"],
  ["domande-frequenti", "/domande-frequenti"],
  ["lavora-con-noi", "/lavora-con-noi"],
  ["privacy", "/privacy"],
  ["cookie", "/cookie"],
] as const;

const outDir = process.argv[2];
if (!outDir) {
  console.error("uso: npx tsx scripts/mobile-shots.ts <cartella> [--url …]");
  process.exit(1);
}
const urlFlag = process.argv.indexOf("--url");
const base = urlFlag > -1 ? process.argv[urlFlag + 1] : "http://127.0.0.1:3181";

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({
    ...devices["iPhone 13"],
    // Il consenso già dato: altrimenti ogni scatto è coperto dal banner.
    storageState: { cookies: [], origins: [] },
  });
  await context.addCookies([
    { name: "dt_consent", value: "accepted", url: base },
  ]);
  const page = await context.newPage();

  for (const [name, route] of ROUTES) {
    // L'intro parte una volta per sessione: la si salta come farebbe chi torna,
    // così lo scatto mostra la pagina e non il sipario.
    await page.addInitScript(() => {
      try {
        sessionStorage.setItem("dt-intro-seen", "1");
      } catch {}
    });
    await page.goto(`${base}${route}`, { waitUntil: "networkidle", timeout: 60_000 });
    // Una passata di scroll: i reveal legati all'IntersectionObserver devono
    // essere già scattati, altrimenti lo scatto fotografa stati nascosti.
    await page.evaluate(async () => {
      const step = window.innerHeight;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
      }
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 400));
    });
    const file = path.join(outDir, `${name}.png`);
    await page.screenshot({ path: file, fullPage: true });
    console.log(`✓ ${route} → ${file}`);
  }

  // La prima schermata di una scheda immobile: la rotta dinamica esiste solo
  // attraverso la griglia, quindi si parte da lì invece di indovinare uno slug.
  // La griglia vive su /acquista (`/case` è solo un 301 verso di essa).
  await page.goto(`${base}/acquista`, { waitUntil: "networkidle", timeout: 60_000 });
  const first = page.locator('a[href^="/case/"]').first();
  if (await first.count()) {
    const href = await first.getAttribute("href");
    if (href) {
      await page.goto(`${base}${href}`, { waitUntil: "networkidle", timeout: 60_000 });
      const file = path.join(outDir, "scheda-immobile.png");
      await page.screenshot({ path: file, fullPage: true });
      console.log(`✓ ${href} → ${file}`);
    }
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
