import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Locator, Page } from "@playwright/test";
import { expect } from "./helpers";

// Attrezzi e2e della coreografia di era-residence (spec 2026-09-13 §9.2).
//
// Alberto ha scelto il 13 settembre coreografia piena, corridoi sticky e
// fedeltà letterale (A18-A20). Questi attrezzi misurano quel movimento sul build
// di produzione, a motion attivo, e valgono per il markup di oggi e per quello
// del piano 2026-09-13:
// - titoli: oggi TextLines li spezza in righe `.tl-line`, ognuna dentro una
//   maschera `.tl-line-mask` con `overflow: clip` (SplitText, TextLines.tsx:78-89);
//   col piano sono `[data-reveal="title"]` coi caratteri `[data-c]` (spec §2.3);
// - blocchi: oggi `.reveal` (app/components/Reveal.tsx, globals.css:508-521);
//   col piano `[data-reveal="ctn"]` e `[data-reveal="still"]` (spec §2.2);
// - inchiostro di una foglia di testo: prodotto delle opacità fino a #main per
//   la frazione della sua scatola che nessun antenato con overflow diverso da
//   visible ritaglia. Senza maschere è il prodotto delle opacità di spec §9.2;
//   con la maschera di oggi misura la riga che scende sotto il proprio bordo.
// Ogni funzione basta a se stessa: productOpacity, matrixOf e clipOf leggono lo
// stile dentro il proprio evaluate, quelle che campionano l'inchiostro
// definiscono window.__dtProbe se manca (ensureProbe); installProbe resta per
// chi vuole la sonda dal primo script del documento.
// Lo scroll passa dalla rotella, quindi da Lenis (SmoothScroll.tsx), come per un
// utente; `scrollToProgress` scrive `window.scrollTo` per le misure puntuali.
// Prima del primo scroll di ogni documento `ready` aspetta l'idratazione e tara
// la rotella (window.__dtReady); `entryTimes` aspetta anche i titoli definitivi.
// Il refresh dei ScrollTrigger non è mai automatico: lo chiede il test con
// `refreshTriggers` (decisione di lavoro D38, vedi la funzione).

export const TITLE_SEL = '[data-reveal="title"], :is(h1, h2, h3, h4, p, div, blockquote):has(> .tl-line-mask)';
export const INK_LEAF_SEL = "[data-c], .tl-line";
export const BLOCK_SEL = '.reveal, [data-reveal="ctn"], [data-reveal="still"]';

export type InkSample = { n: number; min: number; max: number; mean: number };
export type Matrix2D = { a: number; b: number; c: number; d: number; m41: number; m42: number };
export type EntryItem = { kind: "titolo" | "blocco"; label: string; t0: number | null; t1: number | null; ms: number | null };
export type EntryTiming = { titles: number; blocks: number; worstMs: number | null; items: EntryItem[]; failures: string[] };
export type ExitTiming = { t0: number | null; t1: number | null; ms: number | null; leaves: number; reason: string };
export type DtProbe = {
  opacity: (el: Element) => number;
  ink: (root: Element, leafSel: string) => InkSample;
  identity: (el: Element) => boolean;
};

export type LcpRoutePath = "/" | "/vendi" | "/contatti" | "/case-vendute" | "/valutazione-immobile-tradate";
export type LcpFlatKey = `${"1440" | "390"} ${LcpRoutePath}`;
export type LcpFlat = { median: { t: number; tag: string | null; url: string | null }; cls: number[]; runs: number[] };
export type LcpRun = { lcpMs: number; tag: string | null; url: string | null; cls: number };
export type LcpRoute = LcpRun & { runs: LcpRun[]; spreadMs: number };
export type LcpBase = {
  schema: 1;
  measuredAt: string;
  commit: string;
  machine: { platform: string; cpu: string; cores: number; node: string };
  conditions: {
    consent: "none";
    curtain: "skipped";
    network: "unthrottled";
    cpu: "unthrottled";
    reducedMotion: "no-preference";
    runs: 3;
    settleMs: number;
    waitUntil: "load";
    workers: 1;
    server: "next start";
    flatViewports: Record<"1440" | "390", { width: number; height: number; deviceScaleFactor: 1 }>;
  };
  routes: LcpRoutePath[];
  projects: Record<string, Record<LcpRoutePath, LcpRoute>>;
} & Record<LcpFlatKey, LcpFlat>;

type WatchState = "armed" | "stop" | "done";

declare global {
  interface Window {
    __dtProbe?: DtProbe;
    __dtWatch?: Record<string, WatchState>;
    __dtReady?: boolean;
    /** Colpo di rotella da mandare per muovere 1 px: sotto l'emulazione a DPR > 1 la pagina riceve deltaY / DPR. */
    __dtWheelScale?: number;
    /** Numero dei ScrollTrigger vivi, hook di prova di app/lib/motion/gsap.ts: c'è appena il chunk del layout è eseguito. */
    __dtST?: () => number;
    /** Conteggio dei refresh di ScrollTrigger, hook di prova di app/lib/motion/gsap.ts. */
    __dtSTRefresh?: number;
  }
}

let watchSeq = 0;

/** Tetto di tempo di un test, moltiplicato per TM_BUDGET_SCALE (default 1): serve alla prova di sensibilità. */
export function budget(ms: number): number {
  const scale = Number(process.env.TM_BUDGET_SCALE ?? "1");
  return Math.round(ms * (Number.isFinite(scale) && scale > 0 ? scale : 1));
}

/**
 * Definisce `window.__dtProbe` nel documento se manca. Non usa nulla fuori da sé, perché Playwright la serializza
 * nella pagina: inchiostro di una foglia = prodotto delle opacità fino a #main × frazione della sua scatola che
 * nessun antenato con overflow diverso da visible ritaglia.
 */
function defineProbe(): void {
  if (window.__dtProbe) return;
  const stopAt = () => document.getElementById("main");
  const opacity = (el: Element) => {
    const stop = stopAt();
    let p = 1;
    for (let n: Element | null = el; n; n = n.parentElement) {
      p *= Number(getComputedStyle(n).opacity);
      if (n === stop) break;
    }
    return p;
  };
  const visible = (leaf: Element) => {
    const r = leaf.getBoundingClientRect();
    const area = r.width * r.height;
    if (area <= 0) return 0;
    let left = r.left;
    let right = r.right;
    let top = r.top;
    let bottom = r.bottom;
    const stop = stopAt();
    for (let a = leaf.parentElement; a && a !== document.documentElement; a = a.parentElement) {
      const cs = getComputedStyle(a);
      if (cs.overflowX !== "visible" || cs.overflowY !== "visible") {
        const b = a.getBoundingClientRect();
        if (cs.overflowX !== "visible") {
          left = Math.max(left, b.left);
          right = Math.min(right, b.right);
        }
        if (cs.overflowY !== "visible") {
          top = Math.max(top, b.top);
          bottom = Math.min(bottom, b.bottom);
        }
      }
      if (a === stop) break;
    }
    return (Math.max(0, right - left) * Math.max(0, bottom - top)) / area;
  };
  const ink = (root: Element, leafSel: string) => {
    let leaves = Array.from(root.querySelectorAll(leafSel)).filter((l) => (l.textContent ?? "").trim() !== "");
    if (leaves.length === 0) leaves = [root];
    const v = leaves.map((l) => opacity(l) * visible(l));
    return { n: v.length, min: Math.min(...v), max: Math.max(...v), mean: v.reduce((s, x) => s + x, 0) / v.length };
  };
  const identity = (el: Element) => {
    const t = getComputedStyle(el).transform;
    const m = new DOMMatrixReadOnly(t === "none" ? undefined : t);
    return (
      Math.abs(m.a - 1) < 1e-3 &&
      Math.abs(m.d - 1) < 1e-3 &&
      Math.abs(m.b) < 1e-3 &&
      Math.abs(m.c) < 1e-3 &&
      Math.abs(m.m41) < 0.5 &&
      Math.abs(m.m42) < 0.5
    );
  };
  window.__dtProbe = { opacity, ink, identity };
}

/** La sonda nel documento di adesso, se manca: la chiamano all'inizio le funzioni che campionano l'inchiostro. */
async function ensureProbe(page: Page): Promise<void> {
  await page.evaluate(defineProbe);
}

/** Facoltativa: la sonda dal primo script di ogni documento della pagina. Nessuna funzione di questo file la richiede. */
export async function installProbe(page: Page): Promise<void> {
  await page.addInitScript(defineProbe);
}

/** Aspetta che l'osservatore `id` sia nato nella pagina (armato, già fermato o già chiuso). */
async function armedWatch(page: Page, id: string): Promise<void> {
  await page.waitForFunction((wid) => window.__dtWatch?.[wid] !== undefined, id);
}

/** Chiede all'osservatore `id` di chiudere al prossimo fotogramma. */
async function stopWatch(page: Page, id: string): Promise<void> {
  await page.evaluate((wid) => {
    const watch = window.__dtWatch;
    if (watch && watch[wid] === "armed") watch[wid] = "stop";
  }, id);
}

/** Aspetta `pred` nella pagina entro `timeoutMs`; allo scadere lancia un errore che dice cosa mancava, mai un timeout muto. */
async function waitFor(page: Page, pred: () => boolean, why: string, timeoutMs: number): Promise<void> {
  await page.waitForFunction(pred, undefined, { timeout: timeoutMs }).catch(() => {
    throw new Error(`${why} dopo ${timeoutMs} ms`);
  });
}

/**
 * Prepara il documento una volta sola (window.__dtReady) prima del primo scroll.
 * - Aspetta l'idratazione con due segnali economici, presenti su ogni rotta del layout e non legati ai titoli:
 *   `window.__dtST` di gsap.ts:57 (il chunk del layout è stato eseguito) e, a motion attivo, la classe `lenis` che
 *   Lenis scrive su <html> quando SmoothScroll lo monta nel suo useEffect (SmoothScroll.tsx:108-115, dopo il commit
 *   dell'idratazione); con reduced-motion Lenis non nasce e basta il primo. Al massimo 15 s, poi un errore che dice
 *   cosa manca: un documento senza titoli (per esempio /case/[slug]) non paga nessuna attesa muta.
 * - Tara la rotella (window.__dtWheelScale): sotto l'emulazione di un dispositivo a DPR > 1 la pagina riceve
 *   deltaY / DPR (iPhone 13: 120 → 40), e senza la taratura la risalita andrebbe a gradini di un terzo, con pause
 *   fra un colpo e l'altro che entrano nei tempi misurati. La misura è un colpo di 120 px intercettato in cattura
 *   con preventDefault, quindi senza scroll.
 * Non aspetta i titoli e non rinfresca i ScrollTrigger: i titoli li aspetta `settledTitles` per chi li censisce
 * (`entryTimes`), il refresh lo chiede il test con `refreshTriggers` (D38).
 */
async function ready(page: Page): Promise<void> {
  if (await page.evaluate(() => window.__dtReady === true)) return;
  await waitFor(page, () => typeof window.__dtST === "function", "ready: gsap.ts non è arrivato, il chunk del layout non è stato eseguito", 15_000);
  await waitFor(
    page,
    () => !matchMedia("(prefers-reduced-motion: no-preference)").matches || document.documentElement.classList.contains("lenis"),
    "ready: Lenis non è montato su <html>, l'idratazione non è finita (SmoothScroll.tsx)",
    15_000,
  );
  const vp = page.viewportSize();
  if (vp) {
    await page.mouse.move(12, Math.round(vp.height / 2));
    const received = page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          const on = (e: WheelEvent) => {
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
    await page.evaluate((s) => {
      window.__dtWheelScale = s;
    }, dy > 0 ? 120 / dy : 1);
  }
  await page.evaluate(() => {
    window.__dtReady = true;
  });
}

/**
 * Aspetta i titoli definitivi del documento senza cercarne uno: oggi TextLines spezza le righe dentro
 * `document.fonts.ready.then` registrato al commit dell'idratazione (TextLines.tsx:76-78), col piano i titoli
 * `[data-reveal="title"]` arrivano dal server. Quindi, dopo `ready` e a font caricati (`document.fonts.status`), il
 * numero degli elementi TITLE_SEL deve restare fermo per 12 fotogrammi: un documento senza titoli passa in 0,2 s, uno
 * coi titoli aspetta lo split e il suo eventuale ri-split; se il numero non si ferma entro 5 s l'errore lo dice.
 */
async function settledTitles(page: Page): Promise<void> {
  await ready(page);
  await waitFor(page, () => document.fonts.status === "loaded", "settledTitles: i font non sono arrivati", 15_000);
  const stable = await page.evaluate(
    ([sel, frames, tmo]) =>
      new Promise<number | null>((resolve) => {
        const t0 = performance.now();
        let last = document.querySelectorAll(sel).length;
        let still = 0;
        const tick = (now: number) => {
          const n = document.querySelectorAll(sel).length;
          still = n === last ? still + 1 : 0;
          last = n;
          if (still >= frames) resolve(n);
          else if (now - t0 > tmo) resolve(null);
          else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }),
    [TITLE_SEL, 12, 5000] as const,
  );
  if (stable === null) throw new Error("settledTitles: il numero dei titoli non si è fermato in 5 s (ri-split continuo?)");
}

/**
 * Rinfresca le posizioni dei ScrollTrigger con un cambio di larghezza del viewport di 1 px e ritorno, aspettando il
 * contatore window.__dtSTRefresh di gsap.ts; prima aspetta i titoli definitivi (`settledTitles`), perché i trigger
 * di TextLines nascono con lo split. La chiama il test che vuole misurare a trigger rinfrescati, mai gli attrezzi
 * di scroll (D38, giro di correzione 1 del commit 2).
 * Perché serve: oggi TextLines crea i trigger dentro il passo di idratazione, prima che il layout finisca di
 * crescere (misurato sul build: +375 px a 1440×900 e +306 px a 390×664 fra la creazione e il fotogramma dopo), e
 * nessuno chiama ScrollTrigger.refresh() dopo: in headless 19 caricamenti su 20 hanno `start` stantio e il
 * leaveBack di «top 86%» scatta col titolo ancora sotto il viewport, così l'uscita del test 2 non arriva mai. Il
 * commit 2 non tocca il sito (il difetto è riferito al coordinatore): la scossa resta nell'attrezzatura, ma
 * esplicita e dichiarata nelle condizioni della misura, così un motore che non rinfresca da sé non passa per sbaglio.
 * Il cambio di larghezza è l'unico evento che rinfresca anche su touch (ScrollTrigger.config ignoreMobileResize,
 * gsap.ts:46), dove conta solo il resize visto a larghezza diversa da quella di partenza; il ritorno rinfresca solo
 * col mouse.
 */
export async function refreshTriggers(page: Page): Promise<void> {
  await settledTitles(page);
  const vp = page.viewportSize();
  if (!vp) throw new Error("refreshTriggers: viewport non fisso, il cambio di larghezza non si può fare");
  const counted = await page.evaluate(() => typeof window.__dtSTRefresh === "number");
  const refreshed = (n: number) =>
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

/** Aspetta che scrollY resti fermo (meno di 0,5 px) per `quiet` fotogrammi di fila; restituisce scrollY. */
export async function settle(page: Page, quiet = 6): Promise<number> {
  return page.evaluate(
    (q) =>
      new Promise<number>((resolve) => {
        let last = window.scrollY;
        let still = 0;
        let frames = 0;
        const tick = () => {
          const y = window.scrollY;
          still = Math.abs(y - last) < 0.5 ? still + 1 : 0;
          last = y;
          frames += 1;
          if (still >= q || frames > 300) resolve(y);
          else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }),
    quiet,
  );
}

/**
 * Porta scrollY a `y` con la rotella: colpi da 1200 px ogni 40 ms finché mancano più di 6000 px
 * (il ritardo di Lenis a lerp 0.1 resta sotto i 3500 px), poi colpi fino a 800 px con attesa del fermo.
 * I colpi sono in px di pagina: `ready` li tara su window.__dtWheelScale (DPR dell'emulazione).
 */
export async function wheelTo(page: Page, y: number): Promise<number> {
  await ready(page);
  const vp = page.viewportSize() ?? { width: 390, height: 664 };
  // Il puntatore sta nel margine sinistro a metà altezza: fuori da iframe, caroselli e bottone WhatsApp.
  await page.mouse.move(12, Math.round(vp.height / 2));
  const { max, scale } = await page.evaluate(() => ({
    max: document.documentElement.scrollHeight - window.innerHeight,
    scale: window.__dtWheelScale ?? 1,
  }));
  const target = Math.max(0, Math.min(Math.round(y), max));
  let now = await settle(page);
  for (let i = 0; i < 400 && Math.abs(target - now) > 2; i++) {
    const d = target - now;
    if (Math.abs(d) > 6000) {
      await page.mouse.wheel(0, Math.sign(d) * 1200 * scale);
      await page.waitForTimeout(40);
      now = await page.evaluate(() => window.scrollY);
    } else {
      await page.mouse.wheel(0, Math.sign(d) * Math.min(Math.abs(d), 800) * scale);
      now = await settle(page);
    }
  }
  return settle(page);
}

/** Porta il bordo alto di `target` a `ratio` × innerHeight (negativo: sopra il bordo) con la rotella. */
export async function wheelToTop(page: Page, target: Locator, ratio: number, tol = 0.02): Promise<void> {
  await ready(page);
  for (let i = 0; ; i++) {
    const m = await target.evaluate((el) => ({
      top: el.getBoundingClientRect().top,
      ih: window.innerHeight,
      sy: window.scrollY,
    }));
    const at = m.top / m.ih;
    if (Math.abs(at - ratio) <= tol) return;
    if (i === 6) throw new Error(`wheelToTop: bordo alto a ${at.toFixed(3)} × innerHeight invece di ${ratio}`);
    await wheelTo(page, m.sy + m.top - ratio * m.ih);
  }
}

/** Scroll istantaneo al progresso `p` di un elemento (vedi Interfaces del commit 2 del piano); restituisce scrollY. */
export async function scrollToProgress(page: Page, selector: string, p: number): Promise<number> {
  await ready(page);
  return page.evaluate(
    async ([sel, prog]) => {
      const el = document.querySelector<HTMLElement>(sel);
      if (!el) throw new Error(`scrollToProgress: ${sel} assente`);
      const top = el.getBoundingClientRect().top + window.scrollY;
      const h = el.offsetHeight;
      const ih = window.innerHeight;
      const [a, b] = h > ih ? [top, top + h - ih] : [top - ih, top + h];
      window.scrollTo({ top: a + (b - a) * prog, behavior: "instant" });
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      return window.scrollY;
    },
    [selector, p] as const,
  );
}

/** Prodotto delle opacità calcolate dall'elemento fino a #main compreso; basta a se stessa. */
export async function productOpacity(target: Locator): Promise<number> {
  return target.evaluate((el) => {
    const stop = document.getElementById("main");
    let p = 1;
    for (let n: Element | null = el; n; n = n.parentElement) {
      p *= Number(getComputedStyle(n).opacity);
      if (n === stop) break;
    }
    return p;
  });
}

/** Inchiostro delle foglie di `target` (vedi defineProbe); installa la sonda se manca. */
export async function inkOf(target: Locator, leafSel: string = INK_LEAF_SEL): Promise<InkSample> {
  await ensureProbe(target.page());
  return target.evaluate((el, sel) => {
    const probe = window.__dtProbe;
    if (!probe) throw new Error("inkOf: sonda assente, il documento è cambiato fra l'installazione e la misura");
    return probe.ink(el, sel);
  }, leafSel);
}

export async function matrixOf(target: Locator): Promise<Matrix2D> {
  return target.evaluate((el) => {
    const t = getComputedStyle(el).transform;
    const m = new DOMMatrixReadOnly(t === "none" ? undefined : t);
    return { a: m.a, b: m.b, c: m.c, d: m.d, m41: m.m41, m42: m.m42 };
  });
}

export async function clipOf(target: Locator): Promise<string> {
  return target.evaluate((el) => getComputedStyle(el).clipPath);
}

export async function noOverflowX(page: Page): Promise<void> {
  const excess = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(excess, `la pagina trabocca di ${excess}px in orizzontale`).toBeLessThanOrEqual(0);
}

/**
 * Tempi d'ingresso dal bordo dei titoli (TITLE_SEL) e dei blocchi (BLOCK_SEL) sotto `scope`. Si arma prima dello scroll:
 * per ogni elemento t0 è il primo fotogramma col bordo alto sotto innerHeight (entra dal basso) e t1 l'inizio
 * dell'ultimo tratto pieno (titolo: inchiostro minimo ≥ 0,99 e foglie a transform identità; blocco: opacità ≥ 0,99
 * e identità). `stop()` sceglie gli elementi in vista in quel fotogramma (titoli col bordo alto in
 * [0, titleBand × innerHeight]; blocchi "today" dentro [0, 0,8] o a coprire [0,1, 0,8], "engine" qualunque blocco che
 * interseca il viewport) e aspetta che siano pieni da 100 ms, o timeoutMs. Installa la sonda se manca; prima chiama
 * `settledTitles`, perché censisce titoli e blocchi all'armamento e i titoli di oggi nascono con lo split dopo
 * l'idratazione (un documento senza titoli non aspetta).
 */
export async function entryTimes(
  page: Page,
  scope: string,
  o: { titleBand?: number; blockRule?: "today" | "engine"; timeoutMs?: number } = {},
): Promise<{ stop: () => Promise<EntryTiming> }> {
  await settledTitles(page);
  await ensureProbe(page);
  const id = `entry-${++watchSeq}`;
  const args = [id, scope, TITLE_SEL, INK_LEAF_SEL, BLOCK_SEL, o.titleBand ?? 0.8, o.blockRule ?? "today", o.timeoutMs ?? 6000] as const;
  const result = page.evaluate(
    ([wid, scopeSel, titleSel, leafSel, blockSel, band, rule, tmo]) =>
      new Promise<EntryTiming>((resolve) => {
        const watch = (window.__dtWatch ??= {});
        watch[wid] = "armed";
        const root = document.querySelector(scopeSel);
        const probe = window.__dtProbe;
        if (!root || !probe) {
          watch[wid] = "done";
          resolve({ titles: 0, blocks: 0, worstMs: null, items: [], failures: [root ? "sonda assente" : `${scopeSel} assente`] });
          return;
        }
        type Track = { el: Element; kind: "titolo" | "blocco"; t0: number | null; okSince: number | null };
        const titleEls = Array.from(root.querySelectorAll(titleSel));
        const tracks: Track[] = [
          ...titleEls.map((el): Track => ({ el, kind: "titolo", t0: null, okSince: null })),
          ...Array.from(root.querySelectorAll(blockSel))
            .filter((el) => !titleEls.includes(el))
            .map((el): Track => ({ el, kind: "blocco", t0: null, okSince: null })),
        ];
        const label = (el: Element) =>
          `${el.tagName.toLowerCase()} «${(el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 40)}»`;
        const full = (t: Track) => {
          if (t.kind === "blocco") return probe.opacity(t.el) >= 0.99 && probe.identity(t.el);
          if (probe.ink(t.el, leafSel).min < 0.99) return false;
          return Array.from(t.el.querySelectorAll(leafSel)).every((leaf) => probe.identity(leaf));
        };
        const inView = (t: Track, ih: number) => {
          const r = t.el.getBoundingClientRect();
          if (r.height <= 0) return false;
          if (t.kind === "titolo") return r.top >= 0 && r.top <= band * ih;
          if (rule === "engine") return r.top < ih && r.bottom > 0;
          return (r.top >= 0 && r.bottom <= 0.8 * ih) || (r.top <= 0.1 * ih && r.bottom >= 0.8 * ih);
        };
        const why = (t: Track) =>
          t.kind === "blocco"
            ? `opacità ${probe.opacity(t.el).toFixed(2)}${probe.identity(t.el) ? "" : ", transform fuori dall'identità"}`
            : `inchiostro ${probe.ink(t.el, leafSel).min.toFixed(2)}`;
        let stopAt: number | null = null;
        let judged: Track[] = [];
        const tick = (now: number) => {
          const ih = window.innerHeight;
          for (const t of tracks) {
            if (t.t0 === null && t.el.getBoundingClientRect().top < ih) t.t0 = now;
            if (t.t0 === null) continue;
            if (full(t)) t.okSince ??= now;
            else t.okSince = null;
          }
          if (stopAt === null && watch[wid] === "stop") {
            stopAt = now;
            judged = tracks.filter((t) => inView(t, ih));
          }
          if (stopAt !== null) {
            const waited = Math.round(now - stopAt);
            const settled = judged.every((t) => t.okSince !== null && now - t.okSince >= 100);
            if (settled || waited > tmo) {
              watch[wid] = "done";
              const items = judged.map((t) => ({
                kind: t.kind,
                label: label(t.el),
                t0: t.t0 === null ? null : Math.round(t.t0),
                t1: t.okSince === null ? null : Math.round(t.okSince),
                ms: t.t0 !== null && t.okSince !== null ? Math.round(t.okSince - t.t0) : null,
              }));
              const times = items.flatMap((i) => (i.ms === null ? [] : [i.ms]));
              resolve({
                titles: judged.filter((t) => t.kind === "titolo").length,
                blocks: judged.filter((t) => t.kind === "blocco").length,
                worstMs: times.length > 0 ? Math.max(...times) : null,
                items,
                failures: judged
                  .filter((t) => t.okSince === null)
                  .map((t) => `${t.kind} ${label(t.el)}: ancora nascosto ${waited} ms dopo lo stop (${why(t)})`),
              });
              return;
            }
          }
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }),
    args,
  );
  result.catch(() => undefined);
  await armedWatch(page, id);
  return {
    stop: async () => {
      await stopWatch(page, id);
      return result;
    },
  };
}

/**
 * Arma un osservatore a ogni fotogramma su `selector`: t0 è il primo fotogramma col bordo alto ≥ line × innerHeight,
 * t1 il primo dopo t0 con inchiostro massimo < below. Si risolve con reason "ok", o dopo timeoutMs senza t1.
 * Il chiamante scrolla dopo che la funzione è tornata (l'osservatore è già armato) e poi attende `result`.
 * Installa la sonda se manca.
 */
export async function timeToHidden(
  page: Page,
  selector: string,
  o: { line?: number; below?: number; timeoutMs?: number; leafSel?: string } = {},
): Promise<{ result: Promise<ExitTiming> }> {
  await ensureProbe(page);
  const id = `hidden-${++watchSeq}`;
  const args = [id, selector, o.leafSel ?? INK_LEAF_SEL, o.line ?? 0.85, o.below ?? 0.1, o.timeoutMs ?? 5000] as const;
  const result = page.evaluate(
    ([wid, sel, leaf, line, below, tmo]) =>
      new Promise<ExitTiming>((resolve) => {
        const watch = (window.__dtWatch ??= {});
        watch[wid] = "armed";
        const el = document.querySelector(sel);
        const probe = window.__dtProbe;
        if (!el || !probe) {
          watch[wid] = "done";
          resolve({ t0: null, t1: null, ms: null, leaves: 0, reason: el ? "sonda assente" : `${sel} assente` });
          return;
        }
        const start = performance.now();
        let t0: number | null = null;
        const tick = (now: number) => {
          const top = el.getBoundingClientRect().top / window.innerHeight;
          const s = probe.ink(el, leaf);
          if (t0 === null && top >= line) t0 = now;
          if (t0 !== null && s.max < below) {
            watch[wid] = "done";
            resolve({ t0, t1: now, ms: Math.round(now - t0), leaves: s.n, reason: "ok" });
            return;
          }
          if (now - (t0 ?? start) > tmo) {
            watch[wid] = "done";
            resolve({ t0, t1: null, ms: null, leaves: s.n, reason: t0 === null ? "linea mai passata" : "ancora visibile" });
            return;
          }
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }),
    args,
  );
  result.catch(() => undefined);
  await armedWatch(page, id);
  return { result };
}

/**
 * Arma un osservatore a ogni fotogramma sull'inchiostro minimo di `selector` e lo tiene finché il chiamante non
 * chiama `stop()`, che restituisce il minimo visto fra armamento e stop. Installa la sonda se manca.
 */
export async function watchMinInk(
  page: Page,
  selector: string,
  leafSel: string = INK_LEAF_SEL,
): Promise<{ stop: () => Promise<number> }> {
  await ensureProbe(page);
  const id = `ink-${++watchSeq}`;
  const result = page.evaluate(
    ([wid, sel, leaf]) =>
      new Promise<number>((resolve, reject) => {
        const watch = (window.__dtWatch ??= {});
        watch[wid] = "armed";
        const el = document.querySelector(sel);
        const probe = window.__dtProbe;
        if (!el || !probe) {
          watch[wid] = "done";
          reject(new Error(el ? "sonda assente" : `${sel} assente`));
          return;
        }
        let worst = 1;
        const tick = () => {
          worst = Math.min(worst, probe.ink(el, leaf).min);
          if (watch[wid] === "stop") {
            watch[wid] = "done";
            resolve(worst);
          } else {
            requestAnimationFrame(tick);
          }
        };
        requestAnimationFrame(tick);
      }),
    [id, selector, leafSel] as const,
  );
  result.catch(() => undefined);
  await armedWatch(page, id);
  return {
    stop: async () => {
      await stopWatch(page, id);
      return result;
    },
  };
}

/** Il minimo dell'inchiostro minimo di `selector` su tutti i fotogrammi di `ms` millisecondi. Installa la sonda se manca. */
export async function minInkOver(page: Page, selector: string, ms: number, leafSel: string = INK_LEAF_SEL): Promise<number> {
  await ensureProbe(page);
  return page.evaluate(
    ([sel, leaf, dur]) =>
      new Promise<number>((resolve, reject) => {
        const el = document.querySelector(sel);
        const probe = window.__dtProbe;
        if (!el || !probe) {
          reject(new Error(el ? "sonda assente" : `${sel} assente`));
          return;
        }
        let worst = 1;
        const t0 = performance.now();
        const tick = (now: number) => {
          worst = Math.min(worst, probe.ink(el, leaf).min);
          if (now - t0 >= dur) resolve(worst);
          else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }),
    [selector, leafSel, ms] as const,
  );
}

/** La base di spec §2.5 scritta da scripts/probe-lcp-base.mjs. */
export function readLcpBase(): LcpBase {
  return JSON.parse(readFileSync(join(__dirname, "baseline", "lcp-base.json"), "utf8")) as LcpBase;
}
