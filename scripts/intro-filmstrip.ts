/**
 * Filmstrip dell'intro — un fotogramma ogni 250 ms, a freddo, sul telefono lento.
 *
 * Il piano dell'onda «parità mobile 2» chiede che l'intro a 390 sia «lo stesso film» del
 * desktop (docs/mobile-parity-2-prompt.md §6, §9.5). Un film si confronta con la sequenza,
 * non con un aggettivo: questo script la produce, per ogni larghezza e per ogni rotta, con
 * la stessa strozzatura CDP della sonda (`scripts/mobile-cdp-probe.ts`: CPU ×4, 1,6 Mbps,
 * 150 ms RTT), in sessione FREDDA (nessuna chiave `dt-intro-seen`: l'intro suona).
 *
 *   npx tsx scripts/intro-filmstrip.ts [--url http://127.0.0.1:3181]
 *       [--widths "390x844,1440x900"] [--routes "/,/acquista"] [--tag fase0] [--out <cartella>]
 *   npm run filmstrip:intro -- --tag fase0
 *   npx tsx scripts/intro-filmstrip.ts --cpu 1 …   # senza strozzatura CPU: per guardare il film
 *
 * Per ogni (larghezza, rotta):
 *   · naviga (`waitUntil: "commit"`), poi aspetta `html[data-preloader]` — il sipario armato
 *     dallo script di boot prima del primo paint: dalla Fase 1 l'atto I è CSS reso dal server
 *     e suona da lì. Se non compare entro 3 s parte comunque e lo annota. `data-pre-live`
 *     (Preloader.tsx al timone) è solo un marcatore (★);
 *   · da quel t=0 uno screenshot ogni 250 ms fino a 5 s → 21 fotogrammi `<rotta>/NNNN-<ms>.jpg`
 *     (il `<ms>` è quello reale di scatto: se lo scatto è lento, la deriva si legge nel nome);
 *   · compone con sharp un contact-sheet `<rotta>.jpg` (max 7 per riga, timestamp sotto,
 *     con i marcatori ★ pre-live, ▼ data-preloader caduto, ✓ dt:intro:done);
 *   · stampa gli istanti (dal navigationStart della pagina e da t=0) di pre-live, della
 *     caduta di `data-preloader` e di `dt:intro:done` (listener via addInitScript che salva
 *     `performance.now()` in `window.__dtIntroDone`).
 *
 * Cartella di uscita: `--out` se dato (dentro, una sottocartella per larghezza), altrimenti
 * `docs/shots/intro-<larghezza>-<tag>/` — `docs/shots/` è gitignored, ed è voluto: la
 * pellicola si guarda, non si versiona.
 *
 * Non avvia il server: serve una build di produzione già in ascolto (`npx next start --port 3181`).
 * Da Git Bash su Windows gli argomenti che cominciano per `/` vengono riscritti in path
 * (`--routes "/"` → `C:/Program Files/Git/`): lanciare da PowerShell o con `MSYS_NO_PATHCONV=1`.
 */
import { chromium, devices, type Browser } from "@playwright/test";
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

// ── Argomenti ─────────────────────────────────────────────────────────────
const arg = (flag: string, fallback: string) => {
  const i = process.argv.indexOf(flag);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};
const base = arg("--url", "http://127.0.0.1:3181").replace(/\/$/, "");
const tag = arg("--tag", "fase0");
const outRoot = arg("--out", "");
const routes = arg("--routes", "/,/acquista")
  .split(",")
  .map((r) => r.trim())
  .filter(Boolean);
const sizes = arg("--widths", "390x844,1440x900")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean)
  .map((s) => {
    const [w, h] = s.split("x").map((n) => Number(n));
    if (!w || !h) throw new Error(`larghezza non valida: "${s}" (atteso es. 390x844)`);
    return { w, h };
  });

// ── Costanti ──────────────────────────────────────────────────────────────
// Le stesse della sonda CDP: una misura e una pellicola sullo stesso telefono.
// `--cpu 1` per VEDERE la coreografia: sotto ×4 lo screenshot stesso costa 1-4 s a fotogramma
// (mask e keyframe in paint) e la pellicola perde i primi secondi — i tempi (▼ ✓) restano
// validi anche a ×4, i fotogrammi no.
const CPU_RATE = Number(arg("--cpu", "4")) || 4;
const NET = {
  offline: false,
  latency: 150,
  downloadThroughput: (1638.4 * 1024) / 8,
  uploadThroughput: (750 * 1024) / 8,
};
const STEP_MS = 250;
const LAST_MS = 5000;
const FRAMES = LAST_MS / STEP_MS + 1; // 21
const PRELIVE_WAIT_MS = 3000;
/** Il nome dell'evento di handoff dell'intro (Preloader.tsx:51, `INTRO_EVENT`). */
const INTRO_EVENT = "dt:intro:done";
/** Sotto questa larghezza si emula l'iPhone 13 (UA, touch, dpr 3): la soglia `MQ.desktop` di gsap.ts. */
const PHONE_BELOW = 768;

type Marks = { __dtPreLive: number | null; __dtPreFall: number | null; __dtIntroDone: number | null; __dtPreArmed?: number };

const routeName = (route: string) => (route === "/" ? "home" : route.replace(/^\//, "").replace(/\//g, "-"));
const ms = (n: number | null) => (n === null ? "—" : `${Math.round(n)} ms`);

// ── Una pellicola ─────────────────────────────────────────────────────────
async function film(browser: Browser, w: number, h: number, route: string, dir: string) {
  // I fotogrammi di ogni rotta in una sottocartella propria (`NNNN-<ms>.jpg`), il
  // contact-sheet `<rotta>.jpg` accanto: due rotte nella stessa cartella non si pestano.
  const frameDir = path.join(dir, routeName(route));
  await mkdir(frameDir, { recursive: true });
  const phone = w < PHONE_BELOW;
  // Context nuovo = sessione fredda: niente cache, niente `dt-intro-seen`.
  const context = await browser.newContext({
    ...(phone ? devices["iPhone 13"] : {}),
    viewport: { width: w, height: h },
  });
  try {
    await context.addCookies([{ name: "dt_consent", value: "accepted", url: base }]);
    const page = await context.newPage();

    // Shim per l'helper `__name` che tsx (keepNames) inietta nelle closure serializzate;
    // vedi mobile-filmstrip.ts e mobile-cdp-probe.ts.
    await page.addInitScript(() => {
      (window as unknown as { __name?: unknown }).__name = (f: unknown) => f;
    });
    // I tre orologi dell'intro, presi dalla pagina stessa: pre-live, caduta del sipario,
    // handoff. Si osserva `document` perché <html> non esiste ancora quando l'init script gira.
    await page.addInitScript((introEvent: string) => {
      const m = window as unknown as Marks;
      m.__dtPreLive = null;
      m.__dtPreFall = null;
      m.__dtIntroDone = null;
      const rec = {
        leggi() {
          const html = document.documentElement;
          if (!html) return;
          if (m.__dtPreLive === null && html.hasAttribute("data-pre-live")) m.__dtPreLive = performance.now();
          if (m.__dtPreFall === null && m.__dtPreArmed && !html.hasAttribute("data-preloader")) {
            m.__dtPreFall = performance.now();
          }
        },
      };
      rec.leggi();
      new MutationObserver(() => rec.leggi()).observe(document, {
        subtree: true,
        attributes: true,
        attributeFilter: ["data-preloader", "data-pre-live"],
      });
      window.addEventListener(
        introEvent,
        () => {
          if (m.__dtIntroDone === null) m.__dtIntroDone = performance.now();
        },
        { once: true },
      );
    }, INTRO_EVENT);

    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", NET);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU_RATE });

    // `commit`: appena il documento c'è, si comincia ad aspettare pre-live — non `load`,
    // che con la rete strozzata arriverebbe a intro quasi finita.
    const tNav = Date.now();
    await page.goto(`${base}${route}`, { waitUntil: "commit", timeout: 60_000 });
    // t=0 della striscia = il sipario ARMATO (`html[data-preloader]`, messo dallo script di
    // boot prima del primo paint): dalla Fase 1 l'atto I è CSS reso dal server e suona da
    // qui, prima di qualunque chunk — `data-pre-live` (il JS al timone dei timer) è solo un marcatore.
    let armedSeen = true;
    try {
      await page.waitForFunction(
        () => (window as unknown as Marks).__dtPreArmed === 1,
        null,
        { timeout: PRELIVE_WAIT_MS, polling: 20 },
      );
    } catch {
      armedSeen = false;
    }
    const t0 = Date.now();
    const t0FromCommit = t0 - tNav;

    // ── I 21 fotogrammi ────────────────────────────────────────────────
    const shots: { file: string; ms: number; buf: Buffer }[] = [];
    for (let i = 0; i < FRAMES; i++) {
      const target = t0 + i * STEP_MS;
      const wait = target - Date.now();
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      const at = Date.now() - t0;
      const file = path.join(frameDir, `${String(i).padStart(4, "0")}-${at}.jpg`);
      try {
        // `scale: "css"`: 1 px CSS = 1 px immagine anche con dpr 3 — la pellicola serve a
        // leggere il film, non a stampare; e uno scatto leggero deriva meno dai 250 ms.
        const buf = await page.screenshot({ type: "jpeg", quality: 82, scale: "css", timeout: 4000, animations: "allow" });
        await writeFile(file, buf);
        shots.push({ file, ms: at, buf });
      } catch (err) {
        console.log(`    fotogramma ${i} saltato: ${err instanceof Error ? err.message.split("\n")[0] : err}`);
      }
    }

    // ── Gli orologi ────────────────────────────────────────────────────
    // Dopo i 5 s si aspetta ancora un poco l'handoff (l'intro desktop dura 4,63 s, il
    // failsafe del boot 2,5 s; se a 11 s dal t=0 non è arrivato niente, è un fatto da scrivere).
    try {
      await page.waitForFunction(() => (window as unknown as Marks).__dtIntroDone !== null, null, {
        timeout: Math.max(0, t0 + 11_000 - Date.now()),
        polling: 250,
      });
    } catch {
      /* nessun handoff entro 11 s: resta null e si stampa */
    }
    const marks = await page.evaluate(() => {
      const m = window as unknown as Marks;
      return {
        preLive: m.__dtPreLive,
        preFall: m.__dtPreFall,
        introDone: m.__dtIntroDone,
        armed: !!m.__dtPreArmed,
        now: performance.now(),
        // performance.now() della pagina all'istante di lettura, per tradurre gli orologi
        // di pagina nel t=0 della striscia (che è tempo di Node).
        wall: Date.now(),
      };
    });
    // Orologio di pagina → tempo dalla t0 della striscia: (x − now) + (wall − t0).
    const toStrip = (x: number | null) => (x === null ? null : x - marks.now + (marks.wall - t0));

    console.log(
      `  ${w}×${h} ${route}: sipario armato ${armedSeen ? `(t=0 della striscia, ${t0FromCommit} ms dopo il commit)` : `NON armato entro ${PRELIVE_WAIT_MS} ms → t=0 = commit + ${t0FromCommit} ms (annotato)`}` +
        ` · pre-live (JS al timone): ${ms(marks.preLive)} (pagina) = ${ms(toStrip(marks.preLive))} nella striscia`,
    );
    console.log(
      `    data-preloader caduto: ${ms(marks.preFall)} (pagina) = ${ms(toStrip(marks.preFall))} nella striscia · ` +
        `dt:intro:done: ${ms(marks.introDone)} (pagina) = ${ms(toStrip(marks.introDone))} nella striscia · ` +
        `${shots.length}/${FRAMES} fotogrammi`,
    );

    // ── Contact-sheet ──────────────────────────────────────────────────
    if (shots.length) {
      const W = phone ? 180 : 300;
      const perRow = 7;
      const gap = 6;
      const label = 22;
      const thumbs = await Promise.all(shots.map((s) => sharp(s.buf).resize({ width: W }).toBuffer()));
      const H = (await sharp(thumbs[0]).metadata()).height ?? Math.round((W * h) / w);
      const cols = Math.min(perRow, shots.length);
      const rows = Math.ceil(shots.length / perRow);
      const sheetW = cols * (W + gap) + gap;
      const sheetH = rows * (H + label + gap) + gap;
      const fall = toStrip(marks.preFall);
      const done = toStrip(marks.introDone);
      const live = toStrip(marks.preLive);
      const composites = thumbs.flatMap((input, i) => {
        const col = i % perRow;
        const row = Math.floor(i / perRow);
        const left = gap + col * (W + gap);
        const top = gap + row * (H + label + gap);
        const at = shots[i].ms;
        const next = i + 1 < shots.length ? shots[i + 1].ms : Number.POSITIVE_INFINITY;
        // Marcatore sul fotogramma nel cui intervallo cade l'evento.
        const inWindow = (x: number | null) => x !== null && x >= at && x < next;
        const marks_ = [inWindow(live) ? "★" : "", inWindow(fall) ? "▼" : "", inWindow(done) ? "✓" : ""].join("");
        const text = `${String(i).padStart(2, "0")} · ${at} ms ${marks_}`.trim();
        const svg = Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${label}">` +
            `<text x="2" y="15" font-family="sans-serif" font-size="12" fill="#f2efe8">${text}</text></svg>`,
        );
        return [
          { input, left, top },
          { input: svg, left, top: top + H },
        ];
      });
      const sheet = path.join(dir, `${routeName(route)}.jpg`);
      try {
        await sharp({ create: { width: sheetW, height: sheetH, channels: 3, background: "#1c1a17" } })
          .composite(composites)
          .jpeg({ quality: 78 })
          .toFile(sheet);
      } catch {
        // Se il testo SVG non si rende (libvips senza fontconfig), la striscia va bene lo stesso.
        await sharp({ create: { width: sheetW, height: sheetH, channels: 3, background: "#1c1a17" } })
          .composite(composites.filter((_, i) => i % 2 === 0))
          .jpeg({ quality: 78 })
          .toFile(sheet);
        console.log("    (etichette non rese: contact-sheet senza timestamp)");
      }
      console.log(`    → ${sheet}  (★ pre-live · ▼ data-preloader caduto · ✓ dt:intro:done)`);
    }
  } finally {
    await context.close().catch(() => {});
  }
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log(
    `filmstrip intro · ${base} · ${sizes.map((s) => `${s.w}×${s.h}`).join(", ")} · rotte ${routes.join(", ")} · ` +
      `CPU ×${CPU_RATE} · ${Math.round((NET.downloadThroughput * 8) / 1024)} kbps / ${NET.latency} ms RTT · sessione fredda`,
  );
  const browser = await chromium.launch();
  for (const { w, h } of sizes) {
    const dir = outRoot ? path.join(outRoot, String(w)) : path.join("docs", "shots", `intro-${w}-${tag}`);
    for (const route of routes) {
      try {
        await film(browser, w, h, route, dir);
      } catch (err) {
        console.log(`  ${w}×${h} ${route}: ERRORE ${err instanceof Error ? err.message.split("\n")[0] : err}`);
      }
    }
  }
  await browser.close();
}

main().catch((err) => {
  console.error(err);
});
