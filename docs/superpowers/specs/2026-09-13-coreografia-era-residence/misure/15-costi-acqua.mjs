// Misura del commit 15 (spec 2026-09-13 §2.7 useAmbientVideo, §3.13 Costi chiari;
// A18-A20 di Alberto, D25, D28). Build di produzione esistente; server, contesti e
// campionamento di lib.mjs (commit 2): motion attivo salvo il caso reduce, sipario
// saltato, consenso accettato, DPR 1, un campione a ogni requestAnimationFrame.
// Appende una tabella a risultati.md ed esce con 1 se un criterio non regge. Uso,
// dalla radice:
// npm run build && node docs/superpowers/specs/2026-09-13-coreografia-era-residence/misure/15-costi-acqua.mjs
import { statSync } from "node:fs";
import { join } from "node:path";
import { ROOT, appendResults, gitCommit, launch, mdTable, motionContext, sampleFrames, startServer, today } from "./lib.mjs";

const BANDA = "#costi [data-acqua-band]";
const CONGEDO = 'section[aria-labelledby="congedo-title"]';
const VIDEO = /\.(mp4|webm)(\?|$)/;

// Valori attesi del bordo alto del clip (%), letti con gsap.parseEase il 13 settembre 2026.
// Salita expo.out in 1,8 s: a 150 ms resta il 56,4 %, a 300 ms il 31,8 %
//   (power4.out 64,7 e 40,2; circ.out 60 e 44,7; lineare 91,7 e 83,3).
// Discesa sine.in in 0,7 s: a 350 ms il 29,3 %, a 560 ms il 69,1 %
//   (power2.in 12,5 e 51,2; lineare 50 e 80).
const SALE_150 = 56.4;
const SALE_300 = 31.8;
const SCENDE_350 = 29.3;
const SCENDE_560 = 69.1;

// Pesi dell'acqua (spec §7.2). Il WebM tiene l'obiettivo di 2,5 MB ed è la sorgente
// che il gate sceglie dove il VP9 è certo. L'MP4 è uscito a 2.989.769 byte anche a
// CRF 25 e il commit 12 l'ha tenuto scrivendo il numero (risultati.md del 17
// settembre): qui la soglia è quel numero con un filo di margine, così la misura
// registra il peso e vede una regressione senza fermare il commit per una scelta
// già presa (D62).
const TETTO_MB = { "acqua-1080.webm": 2.5, "acqua-1080.mp4": 3 };

const failures = [];
const rows = [];
const check = (ok, msg) => {
  if (!ok) failures.push(msg);
};
const entro = (v, atteso, tol) => typeof v === "number" && Number.isFinite(v) && Math.abs(v - atteso) <= tol;
const fmt = (v, d = 1) => (typeof v === "number" && Number.isFinite(v) ? v.toFixed(d) : "—");
const percorso = (src) => (src ? new URL(src).pathname : "—");

/**
 * Campionatore di sampleFrames (passa da toString: usa solo globali e `a`). Nel primo
 * fotogramma porta il bordo alto della banda a `a.frac × innerHeight`; a ogni fotogramma
 * restituisce [bordo alto del clip in %, 0 con `none`; quota del bordo alto della banda].
 */
function bordo(a) {
  const el = document.querySelector(a.banda);
  if (!a.fatto) {
    a.fatto = true;
    const r = el.getBoundingClientRect();
    window.scrollTo({ top: window.scrollY + r.top - a.frac * window.innerHeight, behavior: "instant" });
  }
  const c = getComputedStyle(el).clipPath;
  const m = /^inset\(([^)]*)\)$/.exec(c);
  const alto = c === "none" ? 0 : m ? parseFloat(m[1].trim().split(/\s+/)[0]) : null;
  return [alto, el.getBoundingClientRect().top / window.innerHeight];
}

/**
 * Inizio, fine e valori a `puntiMs` di una corsa del bordo alto. «apre»: da 100 a 0;
 * «chiude»: da 0 a 100. L'inizio vero cade fra l'ultimo campione fermo e il primo
 * mosso: si prende il punto medio.
 */
function corsa(campioni, verso, puntiMs) {
  const serie = campioni.map((c) => ({ t: c.t, v: c.v[0] }));
  const mosso = verso === "apre" ? (v) => v < 99.999 : (v) => v > 0.001;
  const arrivato = verso === "apre" ? (v) => v <= 0.001 : (v) => v >= 99.999;
  const i = serie.findIndex((x) => typeof x.v === "number" && mosso(x.v));
  if (i < 0) return { start: null, dur: null, punti: puntiMs.map(() => null) };
  const start = i > 0 ? (serie[i - 1].t + serie[i].t) / 2 : serie[i].t;
  const fine = serie.slice(i).find((x) => typeof x.v === "number" && arrivato(x.v));
  const vicino = (t) => serie.reduce((best, x) => (Math.abs(x.t - t) < Math.abs(best.t - t) ? x : best));
  return { start, dur: fine ? fine.t - start : null, punti: puntiMs.map((p) => vicino(start + p).v) };
}

/** scrollY fermo per 10 fotogrammi: dopo la rotella Lenis (lerp 0,1) può ancora muovere lo scroll. */
async function fermo(page) {
  await page.evaluate(async () => {
    let last = window.scrollY;
    let still = 0;
    for (let n = 0; still < 10 && n < 300; n++) {
      await new Promise((r) => requestAnimationFrame(() => r()));
      still = Math.abs(window.scrollY - last) < 0.5 ? still + 1 : 0;
      last = window.scrollY;
    }
  });
}

/** Con la rotella, a colpi da 400 px ogni 30 ms, fino a quando il bordo alto di `selector` sta a `frac`: da 1024 px la banda sta sotto i corridoi (spec §3.13). */
async function rotella(page, selector, frac) {
  await page.mouse.move(12, Math.round(page.viewportSize().height / 2));
  const { da, a } = await page.evaluate(
    ({ selector, frac }) => {
      const r = document.querySelector(selector).getBoundingClientRect();
      return { da: window.scrollY, a: window.scrollY + r.top - frac * window.innerHeight };
    },
    { selector, frac },
  );
  for (let y = da; y + 400 < a; y += 400) {
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(30);
  }
  await fermo(page);
}

const server = await startServer();
const browser = await launch();

/** Contesto con sipario saltato e consenso accettato; `prima(page)` gira prima di `goto` (ascoltatori di rete). */
async function apri({ width, height, reduce = false }, prima = null) {
  const ctx = await motionContext(browser, { viewport: { width, height }, deviceScaleFactor: 1 }, { consent: "accepted" });
  const page = await ctx.newPage();
  if (reduce) await page.emulateMedia({ reducedMotion: "reduce" });
  if (prima) prima(page);
  await page.goto(`${server.base}/`, { waitUntil: "domcontentloaded" });
  await page.locator("header").first().waitFor({ state: "visible" });
  return { ctx, page };
}

/** Aspetta l'idratazione: banda chiusa dal basso dal JS, a scroll 0 sotto lo schermo. */
async function bandaChiusa(page, tag) {
  try {
    await page.waitForFunction((sel) => /^inset\(100%/.test(getComputedStyle(document.querySelector(sel)).clipPath), BANDA, { timeout: 15_000 });
  } catch {
    failures.push(`${tag}: dopo 15 s la banda non risulta chiusa dal basso`);
  }
}

/** Altezza della banda, margine della sua riga e altezza di #costi (spec §3.13: +743 px a 1440). */
const altezze = (page) =>
  page.evaluate((sel) => {
    const banda = document.querySelector(sel);
    return {
      banda: banda.getBoundingClientRect().height,
      margine: parseFloat(getComputedStyle(banda.parentElement).marginTop),
      costi: document.querySelector("#costi").getBoundingClientRect().height,
    };
  }, BANDA);

/** L'host del hook è l'elemento con `data-ambient`, sulla sezione o dentro di lei. */
async function suona(page, sel) {
  await page.evaluate((s) => {
    const r = document.querySelector(s).getBoundingClientRect();
    window.scrollTo({ top: window.scrollY + r.top - 0.3 * window.innerHeight, behavior: "instant" });
  }, sel);
  await fermo(page);
  await page
    .waitForFunction((s) => document.querySelector(`${s}[data-ambient], ${s} [data-ambient]`)?.getAttribute("data-ambient") === "playing", sel, { timeout: 15_000 })
    .catch(() => {});
  return page.evaluate(async (s) => {
    const h = document.querySelector(`${s}[data-ambient], ${s} [data-ambient]`);
    const v = h ? (h.querySelector("video") ?? h.closest("section").querySelector("video")) : null;
    if (!h || !v) return { ambient: null, paused: true, avanzato: 0, src: "", vp9: "" };
    const a = v.currentTime;
    await new Promise((r) => setTimeout(r, 300));
    const dur = v.duration || 1;
    return { ambient: h.getAttribute("data-ambient"), paused: v.paused, avanzato: (v.currentTime - a + dur) % dur, src: v.currentSrc, vp9: v.canPlayType('video/webm; codecs="vp9"') };
  }, sel);
}

try {
  // 1. Pesi dei file dell'acqua (spec §7.2, D62).
  for (const f of ["acqua-1080.webm", "acqua-1080.mp4"]) {
    const mb = statSync(join(ROOT, "public", "media", f)).size / 1e6;
    check(mb <= TETTO_MB[f], `${f}: ${mb.toFixed(2)} MB, tetto ${TETTO_MB[f]}`);
    rows.push(["file", f, `${mb.toFixed(2)} MB`]);
  }

  // 2. 1440×900: altezze, clip dell'acqua sulla linea dell'80 %, video dell'acqua e del Congedo (hd).
  {
    const richieste = [];
    const { ctx, page } = await apri({ width: 1440, height: 900 }, (p) =>
      p.on("request", (r) => {
        if (VIDEO.test(r.url())) richieste.push(r.url());
      }),
    );
    try {
      await bandaChiusa(page, "1440");
      await page.waitForTimeout(1_000);
      const h = await altezze(page);
      check(entro(h.banda, 680, 2), `1440: banda alta ${fmt(h.banda)} px, attesi 680 ± 2`);
      check(entro(h.margine, 63, 1), `1440: margine della riga ${fmt(h.margine)} px, attesi 63 ± 1`);
      check(entro(h.banda + h.margine, 743, 3), `1440: #costi cresce di ${fmt(h.banda + h.margine)} px, attesi 743 ± 3`);
      rows.push(["1440×900", "banda / margine / crescita / #costi (px)", `${fmt(h.banda)} / ${fmt(h.margine)} / ${fmt(h.banda + h.margine)} / ${fmt(h.costi)}`]);

      await rotella(page, BANDA, 1.2);
      const sale = await sampleFrames(page, 2_300, bordo, { banda: BANDA, frac: 0.79 });
      const qSale = sale[sale.length - 1].v[1];
      const s = corsa(sale, "apre", [150, 300]);
      check(entro(qSale, 0.79, 0.005), `1440: bordo alto della banda a ${fmt(qSale, 3)} invece di 0,79`);
      check(s.start !== null && s.start <= 100, `1440: l'acqua comincia a salire a ${fmt(s.start, 0)} ms, atteso ≤ 100 (ritardo 0)`);
      check(entro(s.dur, 1_800, 50), `1440: salita in ${fmt(s.dur, 0)} ms, attesi 1800 ± 50`);
      check(entro(s.punti[0], SALE_150, 5), `1440: a 150 ms il bordo è al ${fmt(s.punti[0])} %, atteso ${SALE_150} ± 5 (expo.out)`);
      check(entro(s.punti[1], SALE_300, 6), `1440: a 300 ms il bordo è al ${fmt(s.punti[1])} %, atteso ${SALE_300} ± 6 (expo.out)`);

      await fermo(page);
      const scende = await sampleFrames(page, 1_200, bordo, { banda: BANDA, frac: 0.81 });
      const qScende = scende[scende.length - 1].v[1];
      const d = corsa(scende, "chiude", [350, 560]);
      check(entro(qScende, 0.81, 0.005), `1440: bordo alto della banda a ${fmt(qScende, 3)} invece di 0,81`);
      check(d.start !== null && d.start <= 100, `1440: l'acqua comincia a scendere a ${fmt(d.start, 0)} ms, atteso ≤ 100`);
      check(entro(d.dur, 700, 40), `1440: discesa in ${fmt(d.dur, 0)} ms, attesi 700 ± 40`);
      check(entro(d.punti[0], SCENDE_350, 6), `1440: a 350 ms il bordo è al ${fmt(d.punti[0])} %, atteso ${SCENDE_350} ± 6 (sine.in)`);
      check(entro(d.punti[1], SCENDE_560, 5), `1440: a 560 ms il bordo è al ${fmt(d.punti[1])} %, atteso ${SCENDE_560} ± 5 (sine.in)`);
      rows.push(
        ["1440×900", "salita: inizio / durata (ms), bordo a 150 / 300 ms (%)", `${fmt(s.start, 0)} / ${fmt(s.dur, 0)}, ${fmt(s.punti[0])} / ${fmt(s.punti[1])}`],
        ["1440×900", "discesa: inizio / durata (ms), bordo a 350 / 560 ms (%)", `${fmt(d.start, 0)} / ${fmt(d.dur, 0)}, ${fmt(d.punti[0])} / ${fmt(d.punti[1])}`],
      );

      const acqua = await suona(page, BANDA);
      check(acqua.ambient === "playing" && !acqua.paused, `1440: l'acqua non suona (${acqua.ambient})`);
      check(acqua.avanzato >= 0.2, `1440: l'acqua avanza di ${acqua.avanzato.toFixed(3)} s in 300 ms, attesi ≥ 0,2`);
      check(/\/media\/acqua-1080\.(webm|mp4)$/.test(percorso(acqua.src)), `1440: sorgente dell'acqua ${acqua.src}`);

      const congedo = await suona(page, CONGEDO);
      check(congedo.ambient === "playing" && !congedo.paused, `1440: il Congedo non suona (${congedo.ambient})`);
      check(/congedo-drone-1080\./.test(congedo.src), `1440: il Congedo dovrebbe scegliere la 1080, ha ${congedo.src}`);

      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      await page.waitForTimeout(600);
      const fermi = await page.evaluate(
        (sels) =>
          sels.map((s) => {
            const h = document.querySelector(`${s}[data-ambient], ${s} [data-ambient]`);
            const v = h ? (h.querySelector("video") ?? h.closest("section").querySelector("video")) : null;
            return !!v && v.paused;
          }),
        [BANDA, CONGEDO],
      );
      check(fermi.every(Boolean), `1440: in cima un video non si è fermato (${fermi.join(" / ")})`);

      rows.push(
        ["1440×900", "acqua: sorgente, avanzamento in 300 ms, vp9", `${percorso(acqua.src)}, ${acqua.avanzato.toFixed(3)} s, ${acqua.vp9}`],
        ["1440×900", "Congedo: sorgente", percorso(congedo.src)],
        ["1440×900", "richieste video", richieste.length],
      );
      if (acqua.vp9 !== "probably") failures.push(`1440: canPlayType vp9 = «${acqua.vp9}»: gli e2e con /\\.webm/ non valgono su questa macchina`);
    } finally {
      await ctx.close();
    }
  }

  // 3. 1366×768: il Congedo sceglie la sd (resa 1.366 px ≤ 1.408).
  {
    const { ctx, page } = await apri({ width: 1366, height: 768 });
    try {
      await page.waitForTimeout(1_500);
      const congedo = await suona(page, CONGEDO);
      check(/congedo-drone-720\./.test(congedo.src), `1366: il Congedo dovrebbe scegliere la 720, ha ${congedo.src}`);
      rows.push(["1366×768", "Congedo: sorgente", percorso(congedo.src)]);
    } finally {
      await ctx.close();
    }
  }

  // 4. 390×664 (con le altezze) e 1440×900 con reduce: nessun byte di video.
  for (const caso of [
    { width: 390, height: 664, reduce: false },
    { width: 1440, height: 900, reduce: true },
  ]) {
    const tag = `${caso.width}×${caso.height} ${caso.reduce ? "reduce" : "no-preference"}`;
    const richieste = [];
    const { ctx, page } = await apri(caso, (p) =>
      p.on("request", (r) => {
        if (VIDEO.test(r.url())) richieste.push(r.url());
      }),
    );
    try {
      await page.waitForTimeout(1_500);
      if (!caso.reduce) {
        const h = await altezze(page);
        check(entro(h.banda, 197, 2), `${tag}: banda alta ${fmt(h.banda)} px, attesi 197 ± 2`);
        check(entro(h.margine, 46.5, 1), `${tag}: margine della riga ${fmt(h.margine)} px, attesi 46,5 ± 1 (7vh)`);
        check(entro(h.banda + h.margine, 243.5, 3), `${tag}: #costi cresce di ${fmt(h.banda + h.margine)} px, attesi 243,5 ± 3`);
        rows.push([tag, "banda / margine / crescita / #costi (px)", `${fmt(h.banda)} / ${fmt(h.margine)} / ${fmt(h.banda + h.margine)} / ${fmt(h.costi)}`]);
      }
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 80));
        }
      });
      await page.waitForTimeout(800);
      const stati = await page.evaluate(
        (sels) => sels.map((s) => document.querySelector(`${s}[data-ambient], ${s} [data-ambient]`)?.getAttribute("data-ambient") ?? null),
        [BANDA, CONGEDO],
      );
      check(richieste.length === 0, `${tag}: ${richieste.length} richieste video (${richieste.join(", ")})`);
      check(stati.every((s) => s === "off"), `${tag}: data-ambient ${stati.join(" / ")}`);
      rows.push([tag, "richieste video / data-ambient", `${richieste.length} / ${stati.join(", ")}`]);
    } finally {
      await ctx.close();
    }
  }
} finally {
  await browser.close();
  await server.stop();
}

appendResults(`## Commit 15 · acqua di Costi chiari e video d'ambiente (${today()}, ${gitCommit()})\n\n${mdTable(["viewport", "misura", "valore"], rows)}`);

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log("commit 15: tutti i criteri reggono");
}
