/**
 * Sonda CDP mobile — il telefono lento, misurato con la stessa build, prima e dopo.
 *
 * Nasce dalla Fase 0 dell'onda «parità mobile 2» (docs/mobile-parity-2-prompt.md §8):
 * Lighthouse locale è rumoroso e la sonda CDP dell'onda precedente (mobile-parity §12.1)
 * non era mai stata committata. Questo file è quella sonda, scritta per fare DIFF: stessa
 * macchina, stessa build, un JSON prima e uno dopo. Non dà un punteggio, dà numeri.
 *
 *   npx tsx scripts/mobile-cdp-probe.ts [--url http://127.0.0.1:3181]
 *       [--routes "/,/acquista"] [--mode cold|warm|both] [--runs 3] [--out docs/perf/probe.json]
 *   npm run probe:mobile -- --out before.json
 *
 * Cosa emula, PRIMA di navigare (CDP, non Lighthouse simulato):
 *   · CPU ×4 (`Emulation.setCPUThrottlingRate`),
 *   · rete 1,6 Mbps giù / 750 kbps su / 150 ms RTT (`Network.emulateNetworkConditions`),
 *   · iPhone 13 (UA, touch, dpr 3) a 390×844, cookie `dt_consent=accepted`.
 * Ogni run è un context nuovo: cache vuota, sessionStorage vuoto.
 *   · a freddo (`cold`): nessuna chiave → l'intro suona (su OGNI rotta, non solo la home:
 *     PreloaderShell/Preloader stanno nel root layout);
 *   · a caldo (`warm`): `sessionStorage['dt-intro-seen']='1'` via addInitScript → niente intro.
 *
 * Cosa misura, per run (poi mediana per metrica su `--runs`):
 *   · FCP e LCP con il NOME dell'elemento LCP (tag#id.classi + src o testo abbreviato):
 *     serve a sapere se il candidato è la foto hero, la sagoma del preloader o il testo;
 *   · TBT proxy = Σ max(0, durata − 50) dei long task nella finestra FCP → FCP + 8 s;
 *   · a fine caricamento (networkidle e comunque ≥ 8 s dal FCP): nodi con
 *     `will-change ≠ auto` (computed, walk del DOM) e con `style*="will-change"` inline;
 *     ScrollTrigger: `ScrollTrigger.getAll()` NON è raggiungibile (GSAP non sta sul window
 *     in produzione e non c'è un hook di test in e2e/ o app/lib/motion) → si contano come
 *     PROXY i `.pin-spacer` e i nodi `[data-on]`; è scritto nel JSON;
 *   · jank di scroll: un viewport ogni 400 ms fino al fondo, campionando i frame con rAF →
 *     p95 del tempo di frame e % di frame > 50 ms; will-change e pin-spacer di nuovo dopo
 *     lo scroll (§9.4-b);
 *   · istante di `dt:intro:done` e della caduta di `data-preloader` (a freddo).
 *
 * Non avvia il server: la build di produzione va servita a parte (`npx next start --port 3181`).
 * Robusto per costruzione: timeout larghi, try/catch per run, exit code 0 sempre — la sonda
 * non è un gate, è uno strumento di misura; il gate lo fa chi legge i numeri.
 *
 * Da Git Bash su Windows gli argomenti che cominciano per `/` vengono riscritti in path
 * (`--routes "/"` → `C:/Program Files/Git/`): lanciare da PowerShell o con `MSYS_NO_PATHCONV=1`.
 */
import { chromium, devices, type Browser } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

// ── Argomenti ─────────────────────────────────────────────────────────────
const arg = (flag: string, fallback: string) => {
  const i = process.argv.indexOf(flag);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};
const base = arg("--url", "http://127.0.0.1:3181").replace(/\/$/, "");
const routes = arg("--routes", "/,/acquista")
  .split(",")
  .map((r) => r.trim())
  .filter(Boolean);
const modeArg = arg("--mode", "both");
const modes: Mode[] = modeArg === "cold" ? ["cold"] : modeArg === "warm" ? ["warm"] : ["cold", "warm"];
const runs = Math.max(1, Number(arg("--runs", "3")) || 3);
const outFile = arg("--out", "");

type Mode = "cold" | "warm";

// ── Costanti di misura (le stesse di lighthouserc.js: Slow-4G, CPU ×4, 390×844) ──
const VIEWPORT = { width: 390, height: 844 };
const CPU_RATE = 4;
const NET = {
  offline: false,
  latency: 150,
  downloadThroughput: (1638.4 * 1024) / 8, // 1,6 Mbps in byte/s
  uploadThroughput: (750 * 1024) / 8, // 750 kbps in byte/s
};
/** Finestra del TBT proxy dopo il FCP (ms). */
const TBT_WINDOW = 8000;
const NAV_TIMEOUT = 60_000;
/** Il nome dell'evento di handoff dell'intro (Preloader.tsx:51, `INTRO_EVENT`). */
const INTRO_EVENT = "dt:intro:done";

// ── Forme dei dati ────────────────────────────────────────────────────────
type Metrics = {
  fcp: number | null;
  lcp: number | null;
  lcpElement: string | null;
  tbt: number | null;
  longTasks: number | null;
  /** Long task più lungo nella finestra (ms): dice se il TBT è un blocco solo o tanti piccoli. */
  longestTask: number | null;
  willChange: number | null;
  willChangeInline: number | null;
  pinSpacer: number | null;
  dataOn: number | null;
  willChangeAfterScroll: number | null;
  pinSpacerAfterScroll: number | null;
  jankP95: number | null;
  jankLongPct: number | null;
  jankFrames: number | null;
  scrollHeight: number | null;
  introDone: number | null;
  preloaderFall: number | null;
};

type Run = Metrics & { run: number; error?: string; durationMs: number };

type NumericKey = Exclude<keyof Metrics, "lcpElement">;
/** Le metriche su cui ha senso una mediana (tutte tranne il nome dell'elemento LCP). */
const NUMERIC_KEYS: NumericKey[] = [
  "fcp",
  "lcp",
  "tbt",
  "longTasks",
  "longestTask",
  "willChange",
  "willChangeInline",
  "pinSpacer",
  "dataOn",
  "willChangeAfterScroll",
  "pinSpacerAfterScroll",
  "jankP95",
  "jankLongPct",
  "jankFrames",
  "scrollHeight",
  "introDone",
  "preloaderFall",
];

/** Quello che l'init script lascia sul window della pagina. */
type ProbeState = {
  fcp: number | null;
  lcp: number | null;
  lcpEl: string | null;
  longTasks: { start: number; dur: number }[];
  introDone: number | null;
  preFall: number | null;
};

// ── Statistiche ───────────────────────────────────────────────────────────
const median = (xs: number[]): number | null => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

/** Il valore più frequente (per il nome dell'elemento LCP, che non ha una mediana). */
const mode = (xs: string[]): string | null => {
  if (!xs.length) return null;
  const count = new Map<string, number>();
  for (const x of xs) count.set(x, (count.get(x) ?? 0) + 1);
  return [...count.entries()].sort((a, b) => b[1] - a[1])[0][0];
};

const round1 = (n: number | null) => (n === null ? null : Math.round(n * 10) / 10);

// ── Un run ────────────────────────────────────────────────────────────────
async function measure(browser: Browser, route: string, mode: Mode, run: number): Promise<Run> {
  const started = Date.now();
  const empty: Metrics = {
    fcp: null,
    lcp: null,
    lcpElement: null,
    tbt: null,
    longTasks: null,
    longestTask: null,
    willChange: null,
    willChangeInline: null,
    pinSpacer: null,
    dataOn: null,
    willChangeAfterScroll: null,
    pinSpacerAfterScroll: null,
    jankP95: null,
    jankLongPct: null,
    jankFrames: null,
    scrollHeight: null,
    introDone: null,
    preloaderFall: null,
  };

  // Context nuovo per run: cache HTTP vuota, storage vuoto. È il «primo arrivo» vero.
  const context = await browser.newContext({
    ...devices["iPhone 13"],
    viewport: VIEWPORT,
  });
  try {
    await context.addCookies([{ name: "dt_consent", value: "accepted", url: base }]);
    const page = await context.newPage();

    // tsx compila con `keepNames`: ogni funzione con nome dentro le closure passate a
    // `page.evaluate`/`addInitScript` diventa `__name(fn, "nome")`, e nella pagina `__name`
    // non esiste (vedi mobile-filmstrip.ts). Le closure qui sotto evitano funzioni con
    // nome, e questo shim rende innocua una svista futura.
    await page.addInitScript(() => {
      (window as unknown as { __name?: unknown }).__name = (f: unknown) => f;
    });

    if (mode === "warm") {
      await page.addInitScript(() => {
        try {
          sessionStorage.setItem("dt-intro-seen", "1");
        } catch {}
      });
    }

    // Gli osservatori vanno installati prima di qualunque byte del documento: `buffered:true`
    // recupera comunque le voci già emesse, ma l'elemento LCP e i long task del boot si
    // prendono solo se il registro esiste dal primo istante.
    await page.addInitScript((introEvent: string) => {
      const p: ProbeState = { fcp: null, lcp: null, lcpEl: null, longTasks: [], introDone: null, preFall: null };
      (window as unknown as { __dtProbe: ProbeState }).__dtProbe = p;
      try {
        new PerformanceObserver((list) => {
          for (const e of list.getEntries()) {
            if (e.name === "first-contentful-paint" && p.fcp === null) p.fcp = e.startTime;
          }
        }).observe({ type: "paint", buffered: true });
      } catch {}
      try {
        new PerformanceObserver((list) => {
          for (const raw of list.getEntries()) {
            const e = raw as PerformanceEntry & { element?: Element | null; url?: string; size?: number };
            p.lcp = e.startTime;
            const el = e.element ?? null;
            if (!el) {
              p.lcpEl = e.url ? `(elemento non esposto) url=${e.url.split("/").pop()}` : "(elemento non esposto)";
              continue;
            }
            const tag = el.tagName.toLowerCase();
            const id = el.id ? `#${el.id}` : "";
            const cls =
              typeof el.className === "string" && el.className.trim()
                ? `.${el.className.trim().split(/\s+/).slice(0, 3).join(".")}`
                : "";
            const src =
              (el as HTMLImageElement).currentSrc || el.getAttribute("src") || e.url || "";
            const txt = (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40);
            p.lcpEl =
              `${tag}${id}${cls}` +
              (src ? ` src=${(src.split("/").pop() || src).split("?")[0].slice(0, 48)}` : txt ? ` «${txt}»` : "") +
              (e.size ? ` size=${e.size}` : "");
          }
        }).observe({ type: "largest-contentful-paint", buffered: true });
      } catch {}
      try {
        new PerformanceObserver((list) => {
          for (const e of list.getEntries()) p.longTasks.push({ start: e.startTime, dur: e.duration });
        }).observe({ type: "longtask", buffered: true });
      } catch {}
      window.addEventListener(
        introEvent,
        () => {
          if (p.introDone === null) p.introDone = performance.now();
        },
        { once: true },
      );
      // La caduta del sipario: `data-preloader` tolto da <html> (da Preloader.tsx o dal
      // failsafe del boot). Si osserva `document` perché <html> qui non esiste ancora.
      try {
        new MutationObserver(() => {
          const h = document.documentElement;
          if (!h) return;
          if (p.preFall === null && (window as unknown as { __dtPreArmed?: number }).__dtPreArmed && !h.hasAttribute("data-preloader")) {
            p.preFall = performance.now();
          }
        }).observe(document, { subtree: true, attributes: true, attributeFilter: ["data-preloader"] });
      } catch {}
    }, INTRO_EVENT);

    // Il throttling PRIMA della navigazione, sulla sessione CDP di questa pagina.
    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", NET);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU_RATE });

    // `load` e poi networkidle a parte: con la rete strozzata `networkidle` può non arrivare
    // mai (prefetch delle rotte, analytics) e non deve far saltare il run.
    await page.goto(`${base}${route}`, { waitUntil: "load", timeout: NAV_TIMEOUT });
    try {
      await page.waitForLoadState("networkidle", { timeout: 30_000 });
    } catch {
      /* rete mai quieta: si misura lo stesso */
    }
    // FCP entro 20 s (con l'intro a freddo il primo paint è il fondo del sipario).
    try {
      await page.waitForFunction(
        () => (window as unknown as { __dtProbe?: ProbeState }).__dtProbe?.fcp != null,
        null,
        { timeout: 20_000, polling: 250 },
      );
    } catch {
      /* niente FCP: si prosegue, i campi restano null */
    }
    // La finestra del TBT proxy: FCP + 8 s, tutta.
    const remaining = await page.evaluate((win) => {
      const p = (window as unknown as { __dtProbe?: ProbeState }).__dtProbe;
      return p && p.fcp !== null ? Math.max(0, p.fcp + win - performance.now()) : 0;
    }, TBT_WINDOW);
    if (remaining > 0) await page.waitForTimeout(remaining + 100);

    // ── Fotografia a fine caricamento ─────────────────────────────────────
    const snap = await page.evaluate((win) => {
      const p = (window as unknown as { __dtProbe?: ProbeState }).__dtProbe;
      const fcp = p?.fcp ?? null;
      let tbt: number | null = null;
      let longTasks: number | null = null;
      let longest: number | null = null;
      if (p && fcp !== null) {
        tbt = 0;
        longTasks = 0;
        longest = 0;
        for (const t of p.longTasks) {
          if (t.start < fcp || t.start >= fcp + win) continue;
          longTasks += 1;
          tbt += Math.max(0, t.dur - 50);
          if (t.dur > longest) longest = t.dur;
        }
      }
      let willChange = 0;
      const all = document.querySelectorAll<HTMLElement>("body *");
      for (const el of all) {
        if (getComputedStyle(el).willChange !== "auto") willChange += 1;
      }
      return {
        fcp,
        lcp: p?.lcp ?? null,
        lcpElement: p?.lcpEl ?? null,
        tbt,
        longTasks,
        longestTask: longest,
        willChange,
        willChangeInline: document.querySelectorAll('[style*="will-change"]').length,
        pinSpacer: document.querySelectorAll(".pin-spacer").length,
        dataOn: document.querySelectorAll("[data-on]").length,
        scrollHeight: document.documentElement.scrollHeight,
        introDone: p?.introDone ?? null,
        preloaderFall: p?.preFall ?? null,
      };
    }, TBT_WINDOW);

    // ── Jank di scroll ────────────────────────────────────────────────────
    // Un viewport ogni 400 ms, `behavior: "smooth"`: uno scroll che si muove per qualche
    // frame produce gli eventi continui di un dito, e il campionatore rAF vede il lavoro
    // per frame di ScrollTrigger e dei tween in scrub — un salto secco lo vedrebbe una
    // volta sola. Niente funzioni con nome qui dentro (vedi shim `__name`): il
    // campionatore è un metodo di oggetto, che tsx lascia com'è.
    const jank = await page.evaluate(async () => {
      const frames: number[] = [];
      const state = { last: performance.now(), on: true };
      const sampler = {
        tick(t: number) {
          frames.push(t - state.last);
          state.last = t;
          if (state.on) requestAnimationFrame((tt) => sampler.tick(tt));
        },
      };
      requestAnimationFrame((t) => {
        state.last = t;
        requestAnimationFrame((tt) => sampler.tick(tt));
      });
      const vh = window.innerHeight;
      let stalled = 0;
      for (let i = 0; i < 80; i++) {
        const before = window.scrollY;
        window.scrollBy({ top: vh, behavior: "smooth" });
        await new Promise((r) => setTimeout(r, 400));
        const bottom = window.scrollY + vh >= document.documentElement.scrollHeight - 2;
        stalled = window.scrollY === before ? stalled + 1 : 0;
        if (bottom || stalled >= 3) break;
      }
      await new Promise((r) => setTimeout(r, 400));
      state.on = false;
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      const s = [...frames].sort((a, b) => a - b);
      const n = s.length;
      const p95 = n ? s[Math.min(n - 1, Math.floor(0.95 * (n - 1)))] : null;
      const long = frames.filter((d) => d > 50).length;
      let willChange = 0;
      for (const el of document.querySelectorAll<HTMLElement>("body *")) {
        if (getComputedStyle(el).willChange !== "auto") willChange += 1;
      }
      return {
        jankP95: p95,
        jankLongPct: n ? (long / n) * 100 : null,
        jankFrames: n,
        willChangeAfterScroll: willChange,
        pinSpacerAfterScroll: document.querySelectorAll(".pin-spacer").length,
        finalY: Math.round(window.scrollY),
      };
    });

    return {
      run,
      ...empty,
      ...snap,
      jankP95: jank.jankP95,
      jankLongPct: jank.jankLongPct,
      jankFrames: jank.jankFrames,
      willChangeAfterScroll: jank.willChangeAfterScroll,
      pinSpacerAfterScroll: jank.pinSpacerAfterScroll,
      durationMs: Date.now() - started,
    };
  } catch (err) {
    return { run, ...empty, error: String(err instanceof Error ? err.message : err).slice(0, 300), durationMs: Date.now() - started };
  } finally {
    await context.close().catch(() => {});
  }
}

// ── Aggregazione ──────────────────────────────────────────────────────────
type Aggregate = {
  runs: Run[];
  median: Metrics;
  /** max − min per metrica sui run validi: la stima di rumore che il piano chiede (§7.1). */
  spread: Partial<Record<NumericKey, number | null>>;
  validRuns: number;
};

function aggregate(rs: Run[]): Aggregate {
  const ok = rs.filter((r) => !r.error);
  const med: Partial<Metrics> = {};
  const spread: Aggregate["spread"] = {};
  for (const k of NUMERIC_KEYS) {
    const xs = ok.map((r) => r[k]).filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    med[k] = round1(median(xs));
    spread[k] = xs.length ? round1(Math.max(...xs) - Math.min(...xs)) : null;
  }
  med.lcpElement = mode(ok.map((r) => r.lcpElement).filter((v): v is string => !!v));
  return { runs: rs, median: med as Metrics, spread, validRuns: ok.length };
}

const fmt = (n: number | null, unit = "") => (n === null ? "—" : `${Math.round(n)}${unit}`);
const fmt1 = (n: number | null, unit = "") => (n === null ? "—" : `${n.toFixed(1)}${unit}`);

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log(
    `sonda CDP mobile · ${base} · rotte ${routes.join(", ")} · modi ${modes.join("/")} · ${runs} run · ` +
      `CPU ×${CPU_RATE} · ${Math.round((NET.downloadThroughput * 8) / 1024)} kbps / ${NET.latency} ms RTT · ${VIEWPORT.width}×${VIEWPORT.height}`,
  );
  const browser = await chromium.launch();
  const results: Record<string, Partial<Record<Mode, Aggregate>>> = {};

  for (const route of routes) {
    results[route] = {};
    for (const m of modes) {
      const rs: Run[] = [];
      for (let i = 1; i <= runs; i++) {
        process.stdout.write(`  ${route} ${m} run ${i}/${runs} … `);
        const r = await measure(browser, route, m, i);
        rs.push(r);
        console.log(
          r.error
            ? `ERRORE: ${r.error}`
            : `FCP ${fmt(r.fcp)} · LCP ${fmt(r.lcp)} · TBT ${fmt(r.tbt)} · jank p95 ${fmt1(r.jankP95)} · h ${fmt(r.scrollHeight)} (${Math.round(r.durationMs / 1000)} s)`,
        );
      }
      results[route][m] = aggregate(rs);
    }
  }
  await browser.close();

  // ── Tabella leggibile ─────────────────────────────────────────────────
  // `altezza` (scrollHeight a fine caricamento) sta in tabella e non solo nel JSON: è la
  // sentinella del confronto A/B fra due build. Il 2026-08-18 la HEAD di laboratorio serviva
  // /acquista PRERENDERIZZATA A VUOTO («0 immobili trovati», 16 710 px, ○ nel build log —
  // memo fail-closed dentro il worker di prerender) e la build in prova la serviva dinamica
  // con 24 schede (28 798 px): +8 s di scansione, +600 ms di TBT e +20 punti di jank
  // attribuiti agli effetti erano 12 000 px e 1 100 nodi di catalogo. Due altezze diverse
  // sulla stessa rotta = due pagine diverse, e il delta non è un delta.
  const head = ["rotta", "modo", "FCP", "LCP", "TBT", "long", "will-ch", "wc post-scroll", "pin-sp", "data-on", "jank p95", ">50ms", "altezza", "intro", "run ok"];
  const rows: string[][] = [head];
  for (const route of routes) {
    for (const m of modes) {
      const a = results[route][m];
      if (!a) continue;
      const d = a.median;
      rows.push([
        route,
        m,
        fmt(d.fcp, "ms"),
        fmt(d.lcp, "ms"),
        fmt(d.tbt, "ms"),
        fmt(d.longTasks),
        fmt(d.willChange),
        fmt(d.willChangeAfterScroll),
        fmt(d.pinSpacer),
        fmt(d.dataOn),
        fmt1(d.jankP95, "ms"),
        fmt1(d.jankLongPct, "%"),
        fmt(d.scrollHeight, "px"),
        fmt(d.introDone, "ms"),
        `${a.validRuns}/${a.runs.length}`,
      ]);
    }
  }
  const widths = head.map((_, c) => Math.max(...rows.map((r) => r[c].length)));
  console.log("\nMediane per metrica:");
  for (const [i, r] of rows.entries()) {
    console.log("  " + r.map((cell, c) => cell.padEnd(widths[c])).join("  "));
    if (i === 0) console.log("  " + widths.map((w) => "-".repeat(w)).join("  "));
  }
  console.log("\nElemento LCP (il più frequente sui run):");
  for (const route of routes) {
    for (const m of modes) {
      const a = results[route][m];
      if (a) console.log(`  ${route} ${m}: ${a.median.lcpElement ?? "—"}`);
    }
  }
  console.log(
    "\nNota: `pin-sp`/`data-on` sono PROXY di ScrollTrigger.getAll() (GSAP non è esposto sul window in produzione); " +
      "`intro` è dt:intro:done dal navigationStart, solo a freddo.",
  );

  // ── JSON per il diff ──────────────────────────────────────────────────
  const out = {
    meta: {
      base,
      at: new Date().toISOString(),
      viewport: VIEWPORT,
      device: "iPhone 13 (Playwright devices)",
      cpuThrottlingRate: CPU_RATE,
      network: NET,
      tbtWindowMs: TBT_WINDOW,
      runs,
      modes,
      routes,
      scrollTriggerCount: "non disponibile: GSAP non è sul window; `pinSpacer`/`dataOn` sono proxy",
      jank: "scrollBy(innerHeight, smooth) ogni 400 ms fino al fondo; frame campionati con rAF; p95 e % > 50 ms",
    },
    results,
  };
  if (outFile) {
    await mkdir(path.dirname(path.resolve(outFile)), { recursive: true });
    await writeFile(outFile, JSON.stringify(out, null, 2));
    console.log(`\nJSON → ${outFile}`);
  } else {
    console.log("\n(nessun --out: il JSON non è stato scritto; per il diff prima/dopo passa --out <file.json>)");
  }
}

main().catch((err) => {
  // Mai un exit code diverso da 0: la sonda misura, non giudica.
  console.error(err);
});
