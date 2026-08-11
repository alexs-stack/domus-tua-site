/**
 * Sonda di stato mobile — le cose che si possono solo misurare.
 *
 * Nasce dalla Fase 0 della wave "parità mobile": metà delle affermazioni su cosa
 * fa un telefono si erano rivelate deduzioni da lettura del codice. Questo file
 * chiede al browser, e stampa numeri.
 *
 *   npx tsx scripts/mobile-probe.ts [--url http://…] [--w 390]
 *
 * Misura, nell'ordine:
 *   1. quanti ScrollTrigger vivono sulla home dopo una passata completa;
 *   2. se `getLenis()?.stop()` blocca davvero il viewport su touch;
 *   3. quanto dura il fermo-immagine al primo gesto sull'hero;
 *   4. se `env(safe-area-inset-*)` è diverso da zero (serve `viewport-fit=cover`);
 *   5. il peso morto: chunk e immagini scaricati e mai dipinti.
 */
import { chromium, devices } from "@playwright/test";

const arg = (flag: string, fallback: string) => {
  const i = process.argv.indexOf(flag);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const base = arg("--url", "http://127.0.0.1:3181");
const width = Number(arg("--w", "390"));

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    ...devices["iPhone 13"],
    viewport: { width, height: 664 },
  });
  await context.addCookies([{ name: "dt_consent", value: "accepted", url: base }]);
  const page = await context.newPage();

  const network: { url: string; bytes: number }[] = [];
  page.on("response", async (r) => {
    const u = r.url();
    if (!/\.(js|webp|png|jpg|avif)(\?|$)/.test(u)) return;
    let bytes = 0;
    try {
      bytes = Number((await r.headerValue("content-length")) ?? 0);
    } catch {}
    network.push({ url: u.split("/").pop()!.slice(0, 48), bytes });
  });

  await page.addInitScript(() => {
    try {
      sessionStorage.setItem("dt-intro-seen", "1");
    } catch {}
  });
  await page.goto(`${base}/`, { waitUntil: "networkidle", timeout: 60_000 });
  await page.waitForTimeout(1200);

  // ── 2 + 3. Il fermo-immagine del primo gesto ────────────────────────────
  // HeroCinematic registra `touchmove` → getLenis()?.stop() → reveal() →
  // setTimeout(release, 950). E `lenis.stop()` mette `lenis-stopped` su <html>,
  // che in globals.css è `overflow: hidden`: sul telefono è un blocco vero.
  // ATTENZIONE al modo di misurare: `window.scrollBy()` è programmatico e in
  // Chromium scorre ANCHE con `overflow: hidden` sul viewport (è `clip` a
  // impedirlo, non `hidden`). Misurato così, il blocco sembra non esistere.
  // Serve un gesto vero — qui la rotella, che è la stessa porta d'ingresso del
  // `touchmove` in HeroCinematic.tsx:377-387.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  const samples: { t: number; y: number; stopped: boolean }[] = [];
  const t0 = Date.now();
  for (let i = 0; i < 16; i++) {
    await page.mouse.wheel(0, 140);
    await page.waitForTimeout(90);
    samples.push(
      await page.evaluate((start) => ({
        t: Date.now() - start,
        y: Math.round(window.scrollY),
        stopped: document.documentElement.classList.contains("lenis-stopped"),
      }), t0)
    );
  }
  const held = samples.filter((s) => s.stopped);
  const firstFree = samples.find((s) => !s.stopped);
  console.log("— primo gesto sull'hero (fermo-immagine volontario, HeroCinematic.tsx:377-387) —");
  console.log(
    `  html.lenis-stopped presente fino a ~${held.length ? held[held.length - 1].t : 0} ms` +
      ` (${held.length}/${samples.length} campioni)`
  );
  console.log(
    `  scroll accumulato mentre era bloccato: ${
      held.length ? held[held.length - 1].y : 0
    }px · primo campione libero: y=${firstFree?.y ?? "—"} a ${firstFree?.t ?? "—"}ms`
  );
  console.log(`  campioni: ${samples.map((s) => `${s.t}:${s.y}${s.stopped ? "*" : ""}`).join(" ")}`);

  // ── 1. Popolazione ScrollTrigger dopo una passata intera ────────────────
  await page.evaluate(async () => {
    const step = window.innerHeight;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 70));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 400));
  });
  const triggers = await page.evaluate(() => {
    const g = (window as unknown as { ScrollTrigger?: { getAll(): unknown[] } }).ScrollTrigger;
    if (g?.getAll) return g.getAll().length;
    // GSAP non è esposto sul window: si contano i marcatori che ScrollTrigger
    // lascia comunque nel DOM quando pinna, più i pin-spacer.
    return -1;
  });
  console.log("— ScrollTrigger —");
  console.log(
    triggers >= 0
      ? `  vivi sulla home dopo una passata: ${triggers}`
      : "  GSAP non è esposto su window (atteso in build di produzione): conteggio non disponibile"
  );
  console.log(
    `  pin-spacer nel DOM: ${await page.locator(".pin-spacer").count()}` +
      ` · elementi con will-change: ${await page.evaluate(
        () =>
          Array.from(document.querySelectorAll<HTMLElement>("body *")).filter(
            (e) => getComputedStyle(e).willChange !== "auto"
          ).length
      )}`
  );

  // ── 4. Safe area ────────────────────────────────────────────────────────
  const safe = await page.evaluate(() => {
    const probe = document.createElement("div");
    probe.style.cssText =
      "position:fixed;bottom:0;padding-bottom:env(safe-area-inset-bottom);padding-top:env(safe-area-inset-top)";
    document.body.appendChild(probe);
    const cs = getComputedStyle(probe);
    const out = { bottom: cs.paddingBottom, top: cs.paddingTop };
    probe.remove();
    return out;
  });
  const meta = await page.locator('meta[name="viewport"]').getAttribute("content");
  console.log("— safe area —");
  console.log(`  meta viewport: ${meta}`);
  console.log(`  env(safe-area-inset-bottom) = ${safe.bottom} · top = ${safe.top}`);
  console.log(
    `  ${meta?.includes("viewport-fit=cover") ? "viewport-fit=cover dichiarato" : "NESSUN viewport-fit=cover → env() vale 0 ovunque"}`
  );

  // ── 5. Peso morto ───────────────────────────────────────────────────────
  const dead = await page.evaluate(() => {
    const pre = document.querySelector<HTMLElement>(".dt-preloader");
    const cur = document.querySelector<HTMLElement>("[data-cursor-root], .dt-cursor");
    return {
      preloaderNodi: pre ? pre.querySelectorAll("*").length : 0,
      preloaderDisplay: pre ? getComputedStyle(pre).display : "assente",
      cursore: cur ? getComputedStyle(cur).display : "assente",
    };
  });
  const sagoma = network.find((n) => /sagoma/.test(n.url));
  console.log("— peso morto sul telefono —");
  console.log(
    `  .dt-preloader: ${dead.preloaderNodi} nodi, display=${dead.preloaderDisplay}` +
      ` · sagoma scaricata: ${sagoma ? `${sagoma.bytes} B` : "no"}`
  );
  console.log(`  chunk JS: ${network.filter((n) => n.url.endsWith(".js")).length}`);

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
