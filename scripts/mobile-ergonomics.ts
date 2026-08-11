/**
 * Sonda di ergonomia touch — i difetti che si misurano, non si discutono.
 *
 * Per ogni rotta e per ogni larghezza chiede alla pagina quattro cose:
 *   1. traboccamento orizzontale del documento (il difetto che si nota subito);
 *   2. bersagli sotto i 44px (Fitts con un dito da 10mm);
 *   3. testo tagliato dal proprio contenitore (overflow:hidden su contenuto vero);
 *   4. contenuto coperto dalla barra azioni fissa in fondo.
 *
 *   npx tsx scripts/mobile-ergonomics.ts [--url http://…] [--w 360,390,768] [--json file]
 *
 * Esce con codice 1 se trova un traboccamento orizzontale: è l'unico dei
 * quattro che non ammette sfumature.
 */
import { chromium, devices } from "@playwright/test";
import { writeFile } from "node:fs/promises";

const ROUTES = [
  "/",
  "/acquista",
  "/vendi",
  "/case",
  "/metodo",
  "/open-domus",
  "/servizi",
  "/chi-siamo",
  "/recensioni",
  "/contatti",
  "/domande-frequenti",
  "/lavora-con-noi",
  "/privacy",
  "/cookie",
];

const arg = (flag: string, fallback: string) => {
  const i = process.argv.indexOf(flag);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const base = arg("--url", "http://127.0.0.1:3181");
const widths = arg("--w", "360,390,768").split(",").map(Number);
const jsonOut = process.argv.indexOf("--json") > -1 ? arg("--json", "") : "";

type Finding = {
  route: string;
  width: number;
  overflowBy: number;
  offenders: string[];
  smallTargets: { label: string; w: number; h: number }[];
  clipped: { label: string; by: number }[];
  underBar: string[];
};

async function main() {
  const browser = await chromium.launch();
  const findings: Finding[] = [];

  for (const width of widths) {
    const context = await browser.newContext({
      ...devices["iPhone 13"],
      viewport: { width, height: width >= 768 ? 1024 : 780 },
      isMobile: width < 768,
      hasTouch: true,
    });
    await context.addCookies([{ name: "dt_consent", value: "accepted", url: base }]);
    const page = await context.newPage();
    await page.addInitScript(() => {
      try {
        sessionStorage.setItem("dt-intro-seen", "1");
      } catch {}
    });

    for (const route of ROUTES) {
      await page.goto(`${base}${route}`, { waitUntil: "networkidle", timeout: 60_000 });
      // Una passata di scroll schermata per schermata: i reveal e le barre che
      // compaiono a scroll devono essere nello stato in cui li trova una
      // persona — e la collisione con la barra fissa si vede SOLO mentre si
      // scorre, non a fondo pagina.
      const underBarAll = await page.evaluate(async () => {
        const hits = new Set<string>();
        const step = window.innerHeight;
        for (let y = 0; y < document.body.scrollHeight; y += step) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 80));
          let barTop = Infinity;
          for (const el of Array.from(document.querySelectorAll<HTMLElement>("body *"))) {
            if (getComputedStyle(el).position !== "fixed") continue;
            const r = el.getBoundingClientRect();
            if (r.height === 0 || r.height > 160) continue;
            if (r.width < window.innerWidth * 0.6) continue;
            if (r.bottom < window.innerHeight * 0.75 || r.top > window.innerHeight) continue;
            barTop = Math.min(barTop, r.top);
          }
          if (!Number.isFinite(barTop)) continue;
          for (const el of Array.from(
            document.querySelectorAll<HTMLElement>("h1,h2,h3,p,a[href],button,span")
          )) {
            const r = el.getBoundingClientRect();
            if (r.height === 0 || r.width === 0) continue;
            if (getComputedStyle(el).position === "fixed") continue;
            // Solo il testo proprio dell'elemento: senza, ogni antenato di un
            // titolo coperto risulterebbe coperto a sua volta.
            const own = Array.from(el.childNodes)
              .filter((n) => n.nodeType === 3)
              .map((n) => (n.textContent || "").trim())
              .join(" ")
              .trim();
            if (!own) continue;
            if (r.bottom > barTop + 4 && r.top < barTop) {
              hits.add(`${el.tagName.toLowerCase()}:${own.slice(0, 28)}`);
            }
          }
        }
        return Array.from(hits).slice(0, 12);
      });
      await page.waitForTimeout(600);

      // Nessuna funzione annidata: tsx inietta l'helper `__name` di esbuild,
      // che nel contesto della pagina non esiste.
      const res = await page.evaluate(() => {
        const doc = document.documentElement;
        const overflowBy = Math.round(doc.scrollWidth - doc.clientWidth);

        const offenders: string[] = [];
        if (overflowBy > 0) {
          for (const el of Array.from(document.querySelectorAll<HTMLElement>("body *"))) {
            const r = el.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) continue;
            if (r.right <= doc.clientWidth + 1 && r.left >= -1) continue;
            if (getComputedStyle(el).position === "fixed") continue;
            offenders.push(
              `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}.${
                typeof el.className === "string" ? el.className.split(" ").slice(0, 2).join(".") : ""
              } → ${Math.round(r.left)}…${Math.round(r.right)}`
            );
            if (offenders.length >= 8) break;
          }
        }

        // 2) bersagli interattivi troppo piccoli, area di tocco compresa
        //    (globals.css allarga con ::before su .tap-target: si misura
        //    l'unione del box e dello pseudo-elemento, non il solo box).
        const smallTargets: { label: string; w: number; h: number }[] = [];
        const seen = new Set<string>();
        for (const el of Array.from(
          document.querySelectorAll<HTMLElement>("a[href], button, [role='button'], input, select, summary")
        )) {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          if (getComputedStyle(el).visibility === "hidden") continue;
          // L'area di tocco vera, non il riquadro visibile: globals.css:797-803
          // allarga `.tap-target` con un ::before assoluto alto 44px, centrato
          // (`top: 50%; height: 44px; transform: translateY(-50%)`) e steso da
          // bordo a bordo (`inset-inline: 0`). Si legge quindi la SUA altezza e
          // la SUA larghezza — sommare `top`/`bottom` misurerebbe la distanza
          // dal genitore, che non è il bersaglio.
          const before = getComputedStyle(el, "::before");
          let w = r.width;
          let h = r.height;
          if (before.content !== "none" && before.position === "absolute") {
            const bw = parseFloat(before.width);
            const bh = parseFloat(before.height);
            if (Number.isFinite(bw)) w = Math.max(w, bw);
            if (Number.isFinite(bh)) h = Math.max(h, bh);
          }
          if (w >= 44 && h >= 44) continue;
          const label = `${el.tagName.toLowerCase()}:${(el.textContent || el.getAttribute("aria-label") || "")
            .trim()
            .slice(0, 26)}`;
          if (seen.has(label)) continue;
          seen.add(label);
          smallTargets.push({ label, w: Math.round(w), h: Math.round(h) });
        }

        // 3) testo tagliato dal proprio contenitore
        const clipped: { label: string; by: number }[] = [];
        for (const el of Array.from(document.querySelectorAll<HTMLElement>("body *"))) {
          const cs = getComputedStyle(el);
          if (cs.overflow !== "hidden" && cs.overflowY !== "hidden") continue;
          const by = el.scrollHeight - el.clientHeight;
          if (by <= 8 || el.clientHeight < 80) continue;
          if (!(el.textContent || "").trim()) continue;
          clipped.push({
            label: `${el.tagName.toLowerCase()}.${
              typeof el.className === "string" ? el.className.split(" ").slice(0, 3).join(".") : ""
            }`.slice(0, 80),
            by,
          });
          if (clipped.length >= 10) break;
        }

        return { overflowBy, offenders, smallTargets, clipped };
      });

      const row: Finding = { route, width, ...res, underBar: underBarAll };
      findings.push(row);
      const flag = row.overflowBy > 0 ? "✗" : row.smallTargets.length || row.underBar.length ? "!" : "✓";
      console.log(
        `${flag} ${String(width).padStart(4)} ${route.padEnd(20)} overflow=${row.overflowBy}px  bersagli<44=${
          row.smallTargets.length
        }  tagliati=${row.clipped.length}  sotto-barra=${row.underBar.length}`
      );
      for (const o of row.offenders) console.log(`       ⤷ ${o}`);
      for (const t of row.smallTargets.slice(0, 4)) console.log(`       · ${t.label} ${t.w}×${t.h}`);
      for (const c of row.clipped.slice(0, 4)) console.log(`       ✂ ${c.label} (+${c.by}px)`);
      for (const u of row.underBar.slice(0, 6)) console.log(`       ▤ ${u}`);
    }
    await context.close();
  }

  await browser.close();
  if (jsonOut) await writeFile(jsonOut, JSON.stringify(findings, null, 2), "utf8");

  const broken = findings.filter((f) => f.overflowBy > 0);
  console.log(
    broken.length
      ? `\n${broken.length} combinazioni rotta/larghezza traboccano in orizzontale.`
      : "\nNessun traboccamento orizzontale."
  );
  process.exit(broken.length ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
