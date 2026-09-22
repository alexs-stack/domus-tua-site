// Misura del commit 8: il tuffo dell'hero, il ramo sotto il gate e le parole di Posizionamento.
// Chiesti da Alberto il 13 settembre 2026 (A18-A20, A23); spec coreografia §3.2-§3.3 e §4.
// Build di produzione servito da lib.mjs (next start sulla 3178), motion ok, sipario saltato,
// consenso accettato. Esce con codice 1 se un invariante cade.
import { devices } from "@playwright/test";
import { startServer, launch, motionContext, scrollInstant, mdTable, appendResults, gitCommit, today } from "./lib.mjs";

const TUFFO = [
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
  { width: 1920, height: 1080 },
  { width: 1280, height: 720 },
];
const SOTTO = [
  { nome: "1023×768", ramo: "768-1023", descriptor: { viewport: { width: 1023, height: 768 }, deviceScaleFactor: 1 } },
  { nome: "390×664", ramo: "sotto 768", descriptor: devices["iPhone 13"] },
];
const PAROLE = [
  { nome: "1440×900", descriptor: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 } },
  { nome: "390×664", descriptor: devices["iPhone 13"] },
];
const PS = [0, 0.3, 0.5, 0.6, 0.75, 1];
const cadute = [];
const attesa = (ms) => new Promise((r) => setTimeout(r, ms));

/** Una tabella in risultati.md; le colonne sono l'unione delle chiavi delle righe. */
function tabella(titolo, nome, righe) {
  const colonne = [...new Set(righe.flatMap((r) => Object.keys(r)))];
  appendResults(
    `### ${titolo} (${today()}, commit ${gitCommit()}, ${nome})\n\n` +
      mdTable(colonne, righe.map((r) => colonne.map((c) => r[c] ?? ""))),
  );
}

async function apri(browser, base, descriptor, locale = null) {
  const ctx = await motionContext(browser, descriptor, { consent: "accepted", locale });
  const page = await ctx.newPage();
  await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("load");
  return { ctx, page };
}

const { base, stop } = await startServer();
const browser = await launch();
try {
  // 1. Il tuffo sticky, da 1024 × 640 (spec §3.2).
  for (const viewport of TUFFO) {
    const nome = `${viewport.width}×${viewport.height}`;
    const { ctx, page } = await apri(browser, base, { viewport, deviceScaleFactor: 1 });
    await page.waitForSelector("#top[data-on]", { state: "attached", timeout: 30_000 });
    await attesa(800);
    const g = await page.evaluate(() => {
      const top = document.querySelector("#top");
      const screen = top.querySelector("[data-corridor-screen]");
      const media = top.querySelector("[data-hero-media]");
      const zoom = top.querySelector("[data-hero-zoom]");
      const block = top.querySelector("[data-hero-block]");
      const docTop = top.getBoundingClientRect().top + window.scrollY;
      const H = screen.offsetHeight;
      const stickTop = Math.min(0, window.innerHeight - H);
      const bandH = media.offsetHeight;
      const tImg = Math.max(bandH, zoom.offsetHeight);
      const cover = document.querySelector("[data-hero-cover]");
      return {
        H,
        stickTop,
        start: Math.round(docTop - stickTop),
        end: Math.round(docTop + top.offsetHeight - window.innerHeight),
        bandH,
        tImg,
        tPrime: Math.round(0.8 * tImg),
        corsa: top.offsetHeight - (media.offsetHeight + block.offsetHeight),
        margineFoglio: parseFloat(getComputedStyle(cover).marginTop),
      };
    });
    const righe = [{ p: "geometria", ...g }];
    for (const p of PS) {
      await scrollInstant(page, Math.round(g.start + p * (g.end - g.start)));
      await attesa(250);
      const r = await page.evaluate(() => {
        const m = (sel) => {
          const t = getComputedStyle(document.querySelector(sel)).transform;
          return new DOMMatrixReadOnly(t === "none" ? undefined : t);
        };
        const media = document.querySelector("[data-hero-media]").getBoundingClientRect();
        const z = document.querySelector("[data-hero-zoom]").getBoundingClientRect();
        const cover = document.querySelector("[data-hero-cover]");
        const al = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
        return {
          scala: +m("[data-hero-zoom]").a.toFixed(3),
          yFoto: Math.round(m("[data-hero-zoom]").m42),
          yTesto: Math.round(m("[data-hero-block-lift]").m42),
          fondoFotoMenoBanda: Math.round(z.bottom - media.bottom),
          segnoMenoBanda: Math.round(z.top + 0.86 * z.height - media.bottom),
          foglioTop: Math.round(cover.getBoundingClientRect().top),
          foglioAlCentro: al && cover.contains(al) ? 1 : 0,
        };
      });
      righe.push({ p, ...r });
      if (r.fondoFotoMenoBanda < -1) cadute.push(`${nome} p ${p}: la foto scopre il fondo della banda (${r.fondoFotoMenoBanda})`);
      if (r.segnoMenoBanda <= 0) cadute.push(`${nome} p ${p}: il segno entra in campo (A23)`);
      if (p === 0 && (r.scala !== 1 || r.yFoto !== 0 || r.yTesto !== 0)) cadute.push(`${nome}: a p 0 lo zoom non è identità`);
      if (p === 0.5 && r.yTesto >= -100) cadute.push(`${nome}: a p 0,5 il blocco non è salito (${r.yTesto})`);
      if (p === 0.75 && r.scala <= 1.05) cadute.push(`${nome}: a p 0,75 scala ${r.scala}`);
      if (p === 1 && (Math.abs(r.foglioTop) > 1 || r.foglioAlCentro !== 1)) cadute.push(`${nome}: a fine corsa il foglio non copre (${r.foglioTop})`);
    }
    if (Math.abs(g.corsa - 2 * viewport.height) > 2) cadute.push(`${nome}: corsa ${g.corsa}, attesa 200svh`);
    if (Math.abs(g.margineFoglio + viewport.height) > 1) cadute.push(`${nome}: margine del foglio ${g.margineFoglio}`);
    if (viewport.width === 1440) {
      for (const [k, v, tol] of [["H", 984, 2], ["stickTop", -84, 2], ["start", 174, 2], ["end", 1974, 2], ["tImg", 1019, 1], ["tPrime", 815, 1]]) {
        if (Math.abs(g[k] - v) > tol) righe.push({ p: "scarto dalla spec §3.2", voce: k, misurato: g[k], spec: v });
      }
    }
    tabella("08 · tuffo dell'hero e foglio di Posizionamento", nome, righe);
    await ctx.close();
  }

  // 2. Sotto il gate (spec §3.2): 768-1023 scala 1 → 1,12, y −0,5·max(0, t′ − bandH), lift −12svh;
  //    sotto 768 solo il lift di −8svh, foto ferma. Mai data-on.
  for (const { nome, ramo, descriptor } of SOTTO) {
    const { ctx, page } = await apri(browser, base, descriptor);
    await attesa(1500);
    const geo = await page.evaluate(() => {
      const band = document.querySelector("[data-hero-media]");
      const zoom = document.querySelector("[data-hero-zoom]");
      const head = document.querySelector("header");
      const bandH = band.offsetHeight;
      const tImg = Math.max(bandH, zoom.offsetHeight);
      return {
        on: document.querySelector("#top").hasAttribute("data-on") ? 1 : 0,
        bandH,
        tImg,
        salita: +Math.max(0, 0.8 * tImg - bandH).toFixed(1),
        fine: Math.round(band.getBoundingClientRect().bottom + window.scrollY - head.offsetHeight),
      };
    });
    const righe = [{ p: "geometria", ...geo }];
    if (geo.on) cadute.push(`${nome}: #top ha data-on sotto il gate`);
    const svh = geo.bandH / 60;
    for (const p of [0, 0.3, 0.6, 1]) {
      await scrollInstant(page, p === 1 ? geo.fine + 50 : Math.round(p * geo.fine));
      await attesa(300);
      const r = await page.evaluate(() => {
        const m = (el) => {
          const t = getComputedStyle(el).transform;
          return new DOMMatrixReadOnly(t === "none" ? undefined : t);
        };
        const zoomEl = document.querySelector("[data-hero-zoom]");
        const zoom = m(zoomEl);
        const lifts = [...document.querySelectorAll("[data-hero-lift]")].map((el) => m(el).m42);
        const blocco = m(document.querySelector("[data-hero-block-lift]"));
        const media = document.querySelector("[data-hero-media]").getBoundingClientRect();
        const z = zoomEl.getBoundingClientRect();
        return {
          scala: +zoom.a.toFixed(3),
          yFoto: +zoom.m42.toFixed(1),
          liftMin: +Math.min(...lifts).toFixed(1),
          liftMax: +Math.max(...lifts).toFixed(1),
          yBlocco: +blocco.m42.toFixed(1),
          fondoFotoMenoBanda: Math.round(z.bottom - media.bottom),
          segnoMenoBanda: Math.round(z.top + 0.86 * z.height - media.bottom),
        };
      });
      righe.push({ p, ...r });
      if (Math.abs(r.yBlocco) > 0.5) cadute.push(`${nome}: a p ${p} il blocco sotto la foto si muove (${r.yBlocco})`);
      if (r.liftMax - r.liftMin > 0.5) cadute.push(`${nome}: a p ${p} lockup e firma salgono di quantità diverse`);
      if (ramo === "768-1023") {
        if (p === 0 && (r.scala !== 1 || Math.abs(r.yFoto) > 0.5 || Math.abs(r.liftMin) > 0.5)) {
          cadute.push(`${nome}: a scroll 0 zoom o lift non sono a riposo`);
        }
        if (r.fondoFotoMenoBanda < -1) cadute.push(`${nome} p ${p}: la foto scopre il fondo della banda (${r.fondoFotoMenoBanda})`);
        if (r.segnoMenoBanda <= 0) cadute.push(`${nome} p ${p}: il segno entra in campo (A23)`);
        if (p === 1) {
          if (r.scala < 1.119 || r.scala > 1.121) cadute.push(`${nome}: a fine tratto scala ${r.scala}, attesa 1,12`);
          if (Math.abs(r.yFoto + 0.5 * geo.salita) > 1) cadute.push(`${nome}: y della foto ${r.yFoto}, attesa ${-0.5 * geo.salita}`);
          if (Math.abs(r.liftMin + 12 * svh) > 1) cadute.push(`${nome}: lift ${r.liftMin}, atteso ${(-12 * svh).toFixed(1)} (−12svh)`);
        }
      } else {
        if (r.scala !== 1 || Math.abs(r.yFoto) > 0.5) cadute.push(`${nome}: a p ${p} la foto si muove (${r.scala}, ${r.yFoto})`);
        if (p === 0 && Math.abs(r.liftMin) > 0.5) cadute.push(`${nome}: a scroll 0 il lift non è a riposo`);
        if (p === 1 && Math.abs(r.liftMin + 8 * svh) > 1) cadute.push(`${nome}: lift ${r.liftMin}, atteso ${(-8 * svh).toFixed(1)} (−8svh)`);
      }
    }
    tabella(`08 · hero sotto il gate, ramo ${ramo}`, nome, righe);
    await ctx.close();
  }

  // 3. Le parole di Posizionamento (spec §3.3), a 1440×900 e 390×664, in it e de:
  //    h2 `top bottom` → `center top`, ease none, scrub 0,8.
  for (const { nome, descriptor } of PAROLE) {
    for (const locale of ["it", "de"]) {
      const { ctx, page } = await apri(browser, base, descriptor, locale);
      const h2 = "[data-hero-cover] h2";
      if (locale === "de") {
        await page.waitForFunction(
          (sel) => /Immobilie/.test(document.querySelector(sel)?.getAttribute("aria-label") ?? ""),
          h2,
          { timeout: 15_000 },
        );
      }
      await attesa(1500);
      const tratto = await page.evaluate((sel) => {
        const r = document.querySelector(sel).getBoundingClientRect();
        const top = r.top + window.scrollY;
        return { start: Math.round(top - window.innerHeight), end: Math.round(top + r.height / 2) };
      }, h2);
      const righeParole = () =>
        page.evaluate((sel) => {
          const titolo = document.querySelector(sel);
          const destra = titolo.getBoundingClientRect().right;
          const gruppi = [];
          for (const w of titolo.querySelectorAll(".dt-w")) {
            const g = gruppi.find((x) => Math.abs(x.top - w.offsetTop) < 2);
            if (g) g.parole.push(w);
            else gruppi.push({ top: w.offsetTop, parole: [w] });
          }
          return gruppi.map(({ parole }) => {
            const ultima = parole[parole.length - 1];
            const t = getComputedStyle(ultima).transform;
            return {
              n: parole.length,
              slack: destra - ultima.getBoundingClientRect().right,
              x: new DOMMatrixReadOnly(t === "none" ? undefined : t).m41,
              fuori: Math.max(...parole.map((w) => w.getBoundingClientRect().right - destra)),
            };
          });
        }, h2);
      await scrollInstant(page, Math.max(0, tratto.start - 20));
      await attesa(1500);
      const riposo = await righeParole();
      const W = descriptor.viewport.width;
      const righe = riposo.map((r, i) => ({
        p: 0,
        riga: i + 1,
        parole: r.n,
        slack: Math.round(r.slack),
        xUltima: +r.x.toFixed(1),
        atteso: 0,
        fuori: +r.fuori.toFixed(1),
      }));
      riposo.forEach((r, i) => {
        if (Math.abs(r.x) > 0.5) cadute.push(`${nome} ${locale}: a p 0 la riga ${i + 1} è già spostata (${r.x})`);
      });
      if (!riposo.some((r) => r.n > 1)) cadute.push(`${nome} ${locale}: nessuna riga di più parole da misurare`);
      for (const p of [0.5, 1]) {
        await scrollInstant(page, Math.round(tratto.start + p * (tratto.end - tratto.start)));
        await attesa(1500);
        const ora = await righeParole();
        ora.forEach((r, i) => {
          const r0 = riposo[i];
          const atteso = r0 && r.n > 1 ? p * Math.min((r.n - 1) * 0.1 * W, Math.max(0, r0.slack)) : 0;
          righe.push({
            p,
            riga: i + 1,
            parole: r.n,
            slack: Math.round(r0?.slack ?? 0),
            xUltima: +r.x.toFixed(1),
            atteso: +atteso.toFixed(1),
            fuori: +r.fuori.toFixed(1),
          });
          if (Math.abs(r.x - atteso) > 1.5) {
            cadute.push(`${nome} ${locale} p ${p}: riga ${i + 1}, ultima parola a ${r.x.toFixed(1)} px, attesa ${atteso.toFixed(1)}`);
          }
          if (r.fuori > 1) cadute.push(`${nome} ${locale} p ${p}: riga ${i + 1}, una parola esce dall'h2 di ${r.fuori.toFixed(1)} px`);
        });
      }
      tabella(`08 · parole di Posizionamento (${locale})`, nome, righe);
      await ctx.close();
    }
  }
} finally {
  await browser.close();
  await stop();
}

if (cadute.length) {
  console.error(cadute.join("\n"));
  process.exitCode = 1;
}
