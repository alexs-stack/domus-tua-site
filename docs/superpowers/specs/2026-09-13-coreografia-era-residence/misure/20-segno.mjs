// Misure del monogramma sempre visibile (spec §6.1). Alberto il 13 settembre
// 2026, «Si stacca da 1024» (A21, D34).
//   --parte vmax   la velocità di Lenis in px per fotogramma a 1440×900 su un
//                  colpo di rotella, End e Home nativi e un'ancora: sceglie
//                  MARK_VMAX (app/lib/motion/mark.ts). Gira su qualunque build.
//   --parte segno  sul build col segno: il gesto di M1 a 1440, 1280 e 1024
//                  (scroll 0, k·testata con k 0,25, 0,5, 0,75, la testata,
//                  1200 e il ritorno a 0); tema sotto il segno a passi di
//                  450 px su «/»; costo del rilevatore per chiamata, col
//                  layout sporcato a ogni chiamata, a cinque quote della pagina.
//
//   node --import tsx docs/superpowers/specs/2026-09-13-coreografia-era-residence/misure/20-segno.mjs --parte vmax
//   node --import tsx docs/superpowers/specs/2026-09-13-coreografia-era-residence/misure/20-segno.mjs --parte segno
//
// Server, browser, contesto (consenso accettato, sipario saltato con la chiave
// INTRO_QUIET del commit 19, host esterni stubbati) e tabelle da ./lib.mjs
// (commit 2): build esistente in .next, `next start` sulla 3178, Chromium
// headless con motion ok.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, appendResults, gitCommit, launch, mdTable, motionContext, startServer, today } from "./lib.mjs";

const parte = process.argv[process.argv.indexOf("--parte") + 1];
if (parte !== "vmax" && parte !== "segno") throw new Error("uso: --parte vmax|segno");

const attendi = (ms) => new Promise((r) => setTimeout(r, ms));

/** Contesto di lib.mjs (consenso accettato, sipario saltato) e pagina caricata. */
async function pagina(browser, base, viewport, rotta) {
  const ctx = await motionContext(browser, { viewport }, { consent: "accepted", skipCurtain: true });
  const page = await ctx.newPage();
  await page.goto(base + rotta, { waitUntil: "load", timeout: 90_000 });
  await attendi(2000);
  return { ctx, page };
}
/** |Δ scrollY| per fotogramma per `ms`: è la `velocity` di Lenis (px per fotogramma). */
const campiona = (page, ms) =>
  page.evaluate(
    (durata) =>
      new Promise((fatto) => {
        const v = [];
        let prima = window.scrollY;
        const t0 = performance.now();
        const f = () => {
          const y = window.scrollY;
          v.push(Math.abs(y - prima));
          prima = y;
          if (performance.now() - t0 < durata) requestAnimationFrame(f);
          else fatto(v.filter((d) => d > 0));
        };
        requestAnimationFrame(f);
      }),
    ms,
  );
const p95 = (xs) => {
  const v = [...xs].sort((a, b) => a - b);
  return v.length ? v[Math.min(v.length - 1, Math.floor(0.95 * v.length))] : 0;
};
const f1 = (x) => (x === null || x === undefined || Number.isNaN(x) ? "—" : Number(x).toFixed(1));
const f2 = (x) => (x === null || x === undefined || Number.isNaN(x) ? "—" : Number(x).toFixed(2));

async function misuraVmax(browser, base) {
  const giri = [];
  for (let i = 0; i < 3; i++) {
    const { ctx, page } = await pagina(browser, base, { width: 1440, height: 900 }, "/");
    await page.mouse.move(720, 450);
    const pr = campiona(page, 1500);
    for (let k = 0; k < 10; k++) {
      await page.mouse.wheel(0, 120);
      await attendi(16);
    }
    const rotella = await pr;
    await attendi(800);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await attendi(600);
    const pe = campiona(page, 1500);
    await page.keyboard.press("End");
    const end = await pe;
    await attendi(600);
    const ph = campiona(page, 1500);
    await page.keyboard.press("Home");
    const home = await ph;
    await attendi(600);
    const ancora = await page.$('a[href^="#"]:not([href="#main"])');
    let salto = null;
    if (ancora) {
      const pa = campiona(page, 2500);
      await ancora.evaluate((a) => a.click());
      salto = await pa;
    }
    giri.push({
      rotellaP95: p95(rotella),
      rotellaMax: Math.max(0, ...rotella),
      endMax: Math.max(0, ...end),
      homeMax: Math.max(0, ...home),
      ancoraMax: salto ? Math.max(0, ...salto) : null,
    });
    await ctx.close();
  }
  // LA REGOLA: il tetto non deve toccare una rotella veloce ma deve fermare i
  // salti. VMAX = il p95 della rotella più alto dei tre giri, arrotondato per
  // eccesso a 5, fra 20 e 200. Se VMAX ≥ metà del salto di End o Home, i
  // due gesti non si distinguono: VMAX resta quello della regola e il fatto si
  // scrive nella tabella per Alberto.
  const rotella = Math.max(...giri.map((g) => g.rotellaP95));
  const salto = Math.min(...giri.map((g) => Math.max(g.endMax, g.homeMax)));
  const vmax = Math.min(200, Math.max(20, Math.ceil(rotella / 5) * 5));
  const distinti = vmax < salto / 2;
  let md = `## 20 · VMAX del monogramma\n\n${today()} · commit ${gitCommit()} · misure/20-segno.mjs --parte vmax, 1440×900, |Δ scrollY| per fotogramma (px), tre giri.\n\n`;
  md += mdTable(
    ["giro", "rotella p95", "rotella max", "End max", "Home max", "ancora max"],
    giri.map((g, i) => [i + 1, g.rotellaP95, g.rotellaMax, g.endMax, g.homeMax, g.ancoraMax ?? "nessun link # in home"]),
  );
  md += `\n\nVMAX = ${vmax} px per fotogramma (regola: p95 della rotella per eccesso a 5, fra 20 e 200). `;
  md += distinti ? `Salto minimo di End/Home ${salto}: i salti sono tagliati.` : `Salto minimo di End/Home ${salto}: rotella e salti non si distinguono, da dire ad Alberto.`;
  appendResults(md);
  console.log(md);
  console.log(`MARK_VMAX=${vmax}`);
}

/** Il segno e il badge della testata a scroll `y`, letti 400 ms dopo lo scroll (lo scrub di M1 è sincrono col fotogramma). */
async function leggiSegno(page, y) {
  await page.evaluate((v) => window.scrollTo({ top: v, behavior: "instant" }), y);
  await attendi(400);
  return page.evaluate(() => {
    const el = document.querySelector("[data-segno]");
    const badge = document.querySelector("[data-segno-slot] [data-rot-ring]")?.parentElement ?? null;
    const r = el?.getBoundingClientRect();
    const b = badge?.getBoundingClientRect();
    return {
      y: window.scrollY,
      hidden: el ? el.hidden : null,
      opacita: el ? Number(getComputedStyle(el).opacity) : null,
      cx: r ? r.left + r.width / 2 : null,
      lato: r ? r.width : null,
      slotCx: b && b.width > 0 ? b.left + b.width / 2 : null,
      badgeOpacita: badge && b && b.width > 0 ? Number(getComputedStyle(badge).opacity) : null,
      tema: el?.getAttribute("data-tema") ?? null,
    };
  });
}

async function misuraSegno(browser, base) {
  const errori = [];
  // Il gesto di M1 (spec §6.1): da 1280, nei primi --dt-head-h px, in scrub, il
  // centro va dallo slot a 4vw e il lato da 56 al clamp(40px, 3,75vw, 56px);
  // fra 1024 e 1279 compare fra 0,5·testata e testata con opacità q e scala
  // 0,8 + 0,2·q. Risalendo a 0 torna sullo slot (o a opacità 0).
  const righe = [];
  for (const vp of [{ width: 1440, height: 900 }, { width: 1280, height: 800 }, { width: 1024, height: 768 }]) {
    const { ctx, page } = await pagina(browser, base, vp, "/");
    const testata = await page.evaluate(() => document.querySelector("header .dt-row")?.getBoundingClientRect().height ?? 0);
    if (!(testata > 0)) errori.push(`${vp.width}: testata (header .dt-row) non trovata`);
    const clamp = Math.min(56, Math.max(40, 0.0375 * vp.width));
    const xl = vp.width >= 1280;
    const cxFine = 0.04 * vp.width;
    const zero = await leggiSegno(page, 0);
    const slotCx = zero.slotCx;
    if (xl && slotCx === null) errori.push(`${vp.width}: badge della testata ([data-segno-slot] [data-rot-ring]) senza scatola`);
    const passi = [
      { k: 0, y: 0, nome: "0" },
      { k: 0.25, y: Math.round(0.25 * testata), nome: "0,25·testata" },
      { k: 0.5, y: Math.round(0.5 * testata), nome: "0,5·testata" },
      { k: 0.75, y: Math.round(0.75 * testata), nome: "0,75·testata" },
      { k: 1, y: Math.round(testata), nome: "testata" },
      { k: 1, y: 1200, nome: "1200" },
      { k: 0, y: 0, nome: "ritorno a 0" },
    ];
    for (const passo of passi) {
      const m = await leggiSegno(page, passo.y);
      let attesoX;
      let attesoLato;
      let attesoOp;
      if (xl) {
        attesoX = slotCx === null ? null : slotCx + (cxFine - slotCx) * passo.k;
        attesoLato = 56 + (clamp - 56) * passo.k;
        attesoOp = 1;
      } else {
        const q = Math.min(1, Math.max(0, (passo.y - 0.5 * testata) / (0.5 * testata)));
        attesoX = cxFine;
        attesoLato = clamp * (0.8 + 0.2 * q);
        attesoOp = q;
      }
      righe.push([
        `${vp.width}×${vp.height}`,
        passo.nome,
        m.y,
        m.hidden,
        f2(m.opacita),
        f2(attesoOp),
        f1(m.cx),
        f1(attesoX),
        f1(m.lato),
        f1(attesoLato),
        xl ? f2(m.badgeOpacita) : "—",
        m.tema ?? "—",
      ]);
      const dove = `${vp.width} scroll ${passo.nome} (${m.y})`;
      if (m.hidden !== false) {
        errori.push(`${dove}: segno hidden`);
        continue;
      }
      if (attesoX !== null && !(Math.abs(m.cx - attesoX) <= 1)) errori.push(`${dove}: centro ${f1(m.cx)} invece di ${f1(attesoX)}`);
      if (!(Math.abs(m.lato - attesoLato) <= 1)) errori.push(`${dove}: lato ${f1(m.lato)} invece di ${f1(attesoLato)}`);
      if (!(Math.abs(m.opacita - attesoOp) <= 0.03)) errori.push(`${dove}: opacità ${f2(m.opacita)} invece di ${f2(attesoOp)}`);
      if (xl && m.badgeOpacita !== 0) errori.push(`${dove}: badge della testata a opacità ${f2(m.badgeOpacita)}, atteso 0`);
    }
    await ctx.close();
  }
  let md = `## 20 · segno fisso e tema\n\n${today()} · commit ${gitCommit()} · misure/20-segno.mjs --parte segno. `;
  md += "Attesi (spec §6.1, M1): da 1280 centro = slot + (4vw − slot)·k ±1 px e lato = 56 + (clamp − 56)·k ±1 con k = scroll/testata (1 oltre la testata), badge a opacità 0; fra 1024 e 1279 centro a 4vw ±1, opacità q ±0,03 e lato clamp·(0,8 + 0,2·q) ±1 con q = clamp((scroll − 0,5·testata)/(0,5·testata), 0, 1); risalendo a 0 di nuovo sullo slot (o a opacità 0).\n\n";
  md += mdTable(
    ["viewport", "scroll", "y letto", "hidden", "opacità", "attesa", "centro x", "atteso x", "lato", "atteso lato", "badge op.", "tema"],
    righe,
  );

  // Il tema sotto il segno a 1440, e il costo del rilevatore.
  const conCache = /export function aggiornaZone\(/.test(readFileSync(join(ROOT, "app/lib/motion/tema.ts"), "utf8"));
  const N = 200;
  const { ctx, page } = await pagina(browser, base, { width: 1440, height: 900 }, "/");
  const giro = await page.evaluate(async ({ conCache, N }) => {
    const segno = document.querySelector("[data-segno]");
    const righe = [];
    const max = document.documentElement.scrollHeight - innerHeight;
    for (let y = 0; y <= max; y += 450) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 250));
      if (!segno || segno.hidden) continue;
      const r = segno.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const sotto = document.elementFromPoint(cx, cy);
      righe.push({ y, sotto: sotto ? sotto.tagName : null, tema: segno.getAttribute("data-tema") });
    }
    // La replica di temaAt (app/lib/motion/tema.ts): l'elemento in cima al
    // centro del segno, poi le zone [data-bg] che contengono il centro (una
    // zona larga al più 1 px vale per tutta la larghezza), visibili, il cui
    // ambito ([data-bg-scope], la section, il genitore) contiene quell'elemento;
    // fra due candidate vince l'ambito più interno. Con la variante a cache
    // (Step 15) l'elenco delle zone si legge una volta per quota, come fa
    // MarkSegno con aggiornaZone(); altrimenti a ogni chiamata.
    const temaAt = (zone, cx, cy) => {
      const top = document.elementFromPoint(cx, cy);
      if (!top) return "grafite";
      let vincitrice = null;
      for (const zona of zone) {
        if (!zona.isConnected) continue;
        const r = zona.getBoundingClientRect();
        if (r.height === 0) continue;
        const sinistra = r.width <= 1 ? 0 : r.left;
        const destra = r.width <= 1 ? innerWidth : r.right;
        if (cx < sinistra || cx > destra || cy < r.top || cy > r.bottom) continue;
        const cs = getComputedStyle(zona);
        if (cs.display === "none" || cs.visibility === "hidden") continue;
        const ambito = zona.closest("[data-bg-scope]") ?? zona.closest("section") ?? zona.parentElement;
        if (!ambito || !ambito.contains(top)) continue;
        if (!vincitrice || vincitrice.ambito.contains(ambito)) vincitrice = { zona, ambito };
      }
      return vincitrice?.zona.getAttribute("data-bg") === "foto" ? "foto" : "grafite";
    };
    // Il costo per chiamata, a cinque quote. A ogni chiamata il layout si sporca
    // prima, come lo sporcano fra un fotogramma e l'altro le scritture di GSAP e
    // l'inset del marcatore della cartolina: una sonda dentro lo schermo sticky
    // cambia transform e altezza, così getBoundingClientRect ed elementFromPoint
    // pagano davvero il ricalcolo e non leggono una cache.
    const sonda = document.createElement("div");
    sonda.setAttribute("aria-hidden", "true");
    sonda.style.cssText = "position:absolute;left:0;top:0;width:1px;height:1px;pointer-events:none;opacity:0";
    (document.querySelector("[data-corridor-screen]") ?? document.body).appendChild(sonda);
    const quote = [];
    for (const f of [0, 0.25, 0.5, 0.75, 1]) {
      window.scrollTo({ top: Math.round(f * max), behavior: "instant" });
      await new Promise((r) => setTimeout(r, 400));
      if (!segno || segno.hidden) {
        quote.push({ y: window.scrollY, ms: NaN, zone: document.querySelectorAll("[data-bg]").length });
        continue;
      }
      const r = segno.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const zoneFisse = conCache ? Array.from(document.querySelectorAll("[data-bg]")) : null;
      const t0 = performance.now();
      for (let i = 0; i < N; i++) {
        sonda.style.transform = `translateY(${i % 2}px)`;
        sonda.style.height = i % 2 ? "2px" : "1px";
        temaAt(zoneFisse ?? Array.from(document.querySelectorAll("[data-bg]")), cx, cy);
      }
      quote.push({ y: window.scrollY, ms: (performance.now() - t0) / N, zone: document.querySelectorAll("[data-bg]").length });
    }
    sonda.remove();
    return { righe, quote };
  }, { conCache, N });
  await ctx.close();
  const foto = giro.righe.filter((r) => r.sotto === "IMG" || r.sotto === "VIDEO");
  const sbagliati = foto.filter((r) => r.tema !== "foto");
  const costoMax = Math.max(...giro.quote.map((q) => (Number.isNaN(q.ms) ? 0 : q.ms)));
  md += `\n\nTema a 1440 su «/», passi da 450 px: ${giro.righe.length} passi, ${foto.length} con una foto sotto il centro, ${sbagliati.length} col tema sbagliato${sbagliati.length ? ` (scroll ${sbagliati.map((r) => r.y).join(", ")})` : ""}.\n\n`;
  md += `Rilevatore (${conCache ? "elenco delle zone in cache, aggiornaZone()" : "querySelectorAll a ogni chiamata"}), ${N} chiamate per quota col layout sporcato prima di ognuna, soglia 1 ms per chiamata:\n\n`;
  md += mdTable(
    ["quota", "scrollY", "zone [data-bg]", "ms per chiamata"],
    giro.quote.map((q, i) => [["0", "0,25", "0,5", "0,75", "1"][i], q.y, q.zone, Number.isNaN(q.ms) ? "segno hidden" : q.ms.toFixed(3)]),
  );
  if (sbagliati.length) errori.push(`${sbagliati.length} passi con una foto sotto il segno e il tema non foto`);
  if (!(costoMax <= 1)) errori.push(`rilevatore a ${costoMax.toFixed(3)} ms per chiamata nella quota peggiore`);
  md += errori.length ? `\n\nRegole NON rispettate:\n${errori.map((e) => `- ${e}`).join("\n")}` : "\n\nRegole rispettate.";
  appendResults(md);
  console.log(md);
  // exitCode e non exit(): il `finally` qui sotto deve fermare il server sulla 3178.
  if (errori.length) process.exitCode = 1;
}

const server = await startServer();
const browser = await launch();
try {
  if (parte === "vmax") await misuraVmax(browser, server.base);
  else await misuraSegno(browser, server.base);
} finally {
  await browser.close();
  await server.stop();
}
