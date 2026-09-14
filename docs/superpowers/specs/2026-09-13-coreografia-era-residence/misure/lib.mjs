// Attrezzi delle misure della coreografia di era-residence (spec 2026-09-13 §2.5, §9.3).
//
// Alberto ha scelto il 13 settembre la coreografia piena (A18-A20) e la spec ne
// misura il costo. Ogni script NN-nome.mjs di questa cartella usa queste
// funzioni: server di produzione sulla 3178 (mai next dev: Turbopack serve
// globals.css con un'edizione di ritardo), chromium headless con motion attivo,
// sipario saltato scrivendo INTRO_KEY in sessionStorage come la fixture goto di
// e2e/helpers.ts, terze parti bloccate con la lista EXTERNAL_HOSTS di
// e2e/helpers.ts, risultati in coda a risultati.md. Il server parte col binario
// di next lanciato da node e non con npx: su Windows npx passa da una shell .cmd
// e kill() lascerebbe vivo il processo che tiene la porta.
//
// export const HERE: string, ROOT: string, PORT: 3178
// export function introKey(): string
// export function consentCookie(): string
// export function externalHosts(): string[]
// export async function startServer({ port }?): Promise<{ base: string, stop(): Promise<void> }>
// export async function launch(): Promise<Browser>
// export async function motionContext(browser, descriptor, { consent, locale, skipCurtain }?): Promise<BrowserContext>
// export async function freshTriggers(page): Promise<void>
// export async function wheelScale(page): Promise<number>
// export async function scrollInstant(page, y): Promise<number>
// export async function sampleFrames(page, ms, sampler, arg?): Promise<{ t: number, v: unknown }[]>
// export function median(values: number[]): number
// export function gitCommit(): string
// export function today(): string
// export function mdTable(header: string[], rows: (string | number)[][]): string
// export function appendResults(markdown: string): void

import { execSync, spawn, spawnSync } from "node:child_process";
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

export const HERE = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(HERE, "../../../../..");
export const PORT = 3178;

const read = (rel) => readFileSync(join(ROOT, rel), "utf8");
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export function introKey() {
  const m = /export const INTRO_KEY = "([^"]+)"/.exec(read("app/lib/motion/intro-constants.ts"));
  if (!m) throw new Error("INTRO_KEY non trovato in app/lib/motion/intro-constants.ts");
  return m[1];
}

export function consentCookie() {
  const m = /export const CONSENT_COOKIE = "([^"]+)"/.exec(read("app/lib/consent.ts"));
  if (!m) throw new Error("CONSENT_COOKIE non trovato in app/lib/consent.ts");
  return m[1];
}

export function externalHosts() {
  const block = /const EXTERNAL_HOSTS = \[([\s\S]*?)\];/.exec(read("e2e/helpers.ts"));
  if (!block) throw new Error("EXTERNAL_HOSTS non trovato in e2e/helpers.ts");
  return [...block[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

async function answers(url) {
  try {
    const r = await fetch(url);
    return r.ok;
  } catch {
    return false;
  }
}

export async function startServer({ port = PORT } = {}) {
  if (!existsSync(join(ROOT, ".next", "BUILD_ID"))) {
    throw new Error("manca il build di produzione: prima npm run build");
  }
  const base = `http://127.0.0.1:${port}`;
  if (await answers(`${base}/`)) throw new Error(`la porta ${port} risponde già: fermare il server che la occupa`);
  const bin = join(ROOT, "node_modules", "next", "dist", "bin", "next");
  const child = spawn(process.execPath, [bin, "start", "-p", String(port)], {
    cwd: ROOT,
    env: { ...process.env, REALSMART_ALLOW_MOCK: "true" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let log = "";
  child.stdout.on("data", (d) => {
    log += d;
  });
  child.stderr.on("data", (d) => {
    log += d;
  });
  const alive = () => child.exitCode === null && child.signalCode === null;
  const stop = async () => {
    if (!alive()) return;
    if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"]);
    else child.kill("SIGTERM");
    for (let i = 0; i < 50 && alive(); i++) await wait(100);
  };
  const t0 = Date.now();
  while (!(await answers(`${base}/`))) {
    if (!alive()) throw new Error(`next start è uscito (${child.exitCode ?? child.signalCode}):\n${log}`);
    if (Date.now() - t0 > 60_000) {
      await stop();
      throw new Error(`next start non risponde dopo 60 s:\n${log}`);
    }
    await wait(500);
  }
  return { base, stop };
}

export async function launch() {
  return chromium.launch({ headless: true });
}

export async function motionContext(browser, descriptor, { consent = null, locale = null, skipCurtain = true } = {}) {
  const options = { ...descriptor, reducedMotion: "no-preference" };
  delete options.defaultBrowserType;
  const ctx = await browser.newContext(options);
  const cookies = [];
  if (consent) cookies.push({ name: consentCookie(), value: consent, domain: "127.0.0.1", path: "/" });
  if (locale) cookies.push({ name: "dt_locale", value: locale, domain: "127.0.0.1", path: "/" });
  if (cookies.length) await ctx.addCookies(cookies);
  if (skipCurtain) {
    await ctx.addInitScript((key) => {
      try {
        sessionStorage.setItem(key, "1");
      } catch {
        // storage negato: il sipario partirà
      }
    }, introKey());
  }
  const hosts = externalHosts();
  await ctx.route(
    (url) => hosts.some((h) => url.hostname.endsWith(h)),
    (route) => {
      const type = route.request().resourceType();
      if (type === "image") {
        return route.fulfill({
          status: 200,
          contentType: "image/gif",
          body: Buffer.from("R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==", "base64"),
        });
      }
      if (type === "script") return route.fulfill({ status: 200, contentType: "application/javascript", body: "" });
      return route.fulfill({ status: 204, body: "" });
    },
  );
  return ctx;
}

/**
 * Rinfresca le posizioni dei ScrollTrigger con un cambio di larghezza del viewport di 1 px e ritorno, aspettando il
 * contatore window.__dtSTRefresh di gsap.ts (la stessa scossa di `refreshTriggers` in e2e/coreografia.ts). La chiama
 * chi misura, a pagina idratata e a titoli spezzati, prima del primo scroll, e la scrive nelle condizioni della
 * sezione di risultati.md (decisione di lavoro D38): oggi TextLines crea i trigger dentro il passo di idratazione,
 * prima che il layout finisca di crescere, e nessuno chiama ScrollTrigger.refresh() dopo; il commit 2 non tocca il
 * sito e il difetto è riferito al coordinatore. Su touch (ScrollTrigger.config ignoreMobileResize, gsap.ts:46)
 * conta solo il resize visto a larghezza diversa da quella di partenza; il ritorno rinfresca solo col mouse.
 */
export async function freshTriggers(page) {
  const vp = page.viewportSize();
  if (!vp) return;
  const counted = await page.evaluate(() => typeof window.__dtSTRefresh === "number");
  const refreshed = (n) =>
    counted
      ? page.waitForFunction((k) => (window.__dtSTRefresh ?? 0) > k, n, { timeout: 3000 }).catch(() => undefined)
      : page.waitForTimeout(500);
  const touch = await page.evaluate(() => matchMedia("(hover: none), (pointer: coarse)").matches);
  const n0 = await page.evaluate(() => window.__dtSTRefresh ?? 0);
  await page.setViewportSize({ width: vp.width + 1, height: vp.height });
  await page.waitForFunction((w) => window.innerWidth === w, vp.width + 1);
  await refreshed(n0);
  const n1 = await page.evaluate(() => window.__dtSTRefresh ?? 0);
  await page.setViewportSize(vp);
  await page.waitForFunction((w) => window.innerWidth === w, vp.width);
  if (!touch) await refreshed(n1);
  // Il re-split di autoSplit arriva 200 ms dopo il cambio di larghezza, col suo trigger nuovo.
  await page.waitForTimeout(300);
}

/**
 * Colpo di rotella da mandare per muovere 1 px di pagina, misurato una volta per documento (window.__dtWheelScale):
 * sotto l'emulazione di un dispositivo a DPR > 1 la pagina riceve deltaY / DPR (iPhone 13: 120 → 40). Il colpo di
 * misura è intercettato in cattura con preventDefault, quindi non scrolla. Come `ready` di e2e/coreografia.ts.
 * Non rinfresca i trigger: quello è `freshTriggers`, e lo chiede chi misura.
 */
export async function wheelScale(page) {
  const known = await page.evaluate(() => window.__dtWheelScale ?? null);
  if (known !== null) return known;
  const vp = page.viewportSize();
  await page.mouse.move(12, Math.round(vp.height / 2));
  const received = page.evaluate(
    () =>
      new Promise((resolve) => {
        const on = (e) => {
          e.preventDefault();
          e.stopImmediatePropagation();
          window.removeEventListener("wheel", on, true);
          resolve(e.deltaY);
        };
        window.addEventListener("wheel", on, { capture: true, passive: false });
        setTimeout(() => {
          window.removeEventListener("wheel", on, true);
          resolve(0);
        }, 2000);
      }),
  );
  await page.mouse.wheel(0, 120);
  const dy = await received;
  const scale = dy > 0 ? 120 / dy : 1;
  await page.evaluate((s) => {
    window.__dtWheelScale = s;
  }, scale);
  return scale;
}

export async function scrollInstant(page, y) {
  return page.evaluate(async (top) => {
    window.scrollTo({ top, behavior: "instant" });
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    return window.scrollY;
  }, y);
}

export async function sampleFrames(page, ms, sampler, arg = null) {
  const expr = `(async () => {
    const f = ${sampler.toString()};
    const a = ${JSON.stringify(arg)};
    const out = [];
    const t0 = performance.now();
    await new Promise((done) => {
      const tick = (now) => {
        out.push({ t: Math.round(now - t0), v: f(a) });
        if (now - t0 >= ${Number(ms)}) done();
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    return out;
  })()`;
  return page.evaluate(expr);
}

export function median(values) {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function gitCommit() {
  const hash = execSync("git rev-parse --short HEAD", { cwd: ROOT, encoding: "utf8" }).trim();
  const dirty = execSync("git status --porcelain --untracked-files=no", { cwd: ROOT, encoding: "utf8" }).trim() !== "";
  return dirty ? `${hash}+` : hash;
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function mdTable(header, rows) {
  const line = (cells) => `| ${cells.map((c) => String(c).replaceAll("|", "\\|")).join(" | ")} |`;
  return [line(header), line(header.map(() => "---")), ...rows.map(line)].join("\n");
}

export function appendResults(markdown) {
  appendFileSync(join(HERE, "risultati.md"), `\n${markdown.trim()}\n`, "utf8");
}
