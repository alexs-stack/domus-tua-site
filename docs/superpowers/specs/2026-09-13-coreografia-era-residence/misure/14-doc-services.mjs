// Misura del commit 14 (spec 2026-09-13 §3.11 D.O.C., §3.12 Services, §5.3; A20
// e A24 di Alberto, D26, D27, D60). Build di produzione esistente; server, contesti
// e campionamento di lib.mjs (commit 2): motion attivo, sipario saltato, consenso
// accettato, DPR 1, un campione a ogni requestAnimationFrame. Misura tempi e curve
// del D.O.C. a 1440, 1024, 768 e 390; lo zoom di Services su / e /servizi; il CLS
// con sorgente nel foglio su /vendi, /metodo e /acquista a 390×664. Salva le quattro
// pellicole del D.O.C. per Alberto (D26), appende tre tabelle a risultati.md ed esce
// con 1 se un criterio non regge. Uso, dalla radice:
// npm run build && node docs/superpowers/specs/2026-09-13-coreografia-era-residence/misure/14-doc-services.mjs
import { existsSync } from "node:fs";
import { join } from "node:path";
import { HERE, appendResults, gitCommit, launch, mdTable, motionContext, sampleFrames, startServer, today } from "./lib.mjs";

const DOC_VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
  { width: 390, height: 664 },
];
const SERVIZI_VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 390, height: 664 },
];
const PELLICOLE_VIEWPORTS = SERVIZI_VIEWPORTS;
const PAGINE_DOC = ["/vendi", "/metodo", "/acquista"];
const LISTA = "#domus-doc [data-doc-sheet] ul";
const LINEE = '#domus-doc [data-hairline="doc"]';
const SCATOLA = "#servizi [data-zoom-box]";

// Rapporto vero della foto della riga 1 (D60: home_staging_01, 1024×683, 3:2).
// Nella scatola quadrata `object-cover` la rende larga lato × rapporto, e lo zoom
// parte da 1,15: è l'aritmetica di zoomSizes (app/lib/motion/zoom.ts).
const RATIO_RIGA_1 = 3 / 2;

// Valori attesi dentro la corsa, letti con gsap.parseEase il 13 settembre 2026.
// Ingresso power1.out: a metà corsa il lato destro della riga lascia il 25 % (lineare 50).
// Uscita circ.in: il lato sinistro ha percorso il 13,4 % a metà corsa (power3.in 6,3,
// sine.in 29,3, lineare 50) e il 40 % all'80 % (sine.in 69,1, expo.in 25,2, lineare 80).
const META_IN = 25;
const META_OUT = 13.4;
const OTTANTA_OUT = 40;

const failures = [];
const check = (ok, msg) => {
  if (!ok) failures.push(msg);
};
const entro = (v, atteso, tol) => typeof v === "number" && Number.isFinite(v) && Math.abs(v - atteso) <= tol;
const ms = (v) => (typeof v === "number" && Number.isFinite(v) ? Math.round(v) : "—");
const pc = (v) => (typeof v === "number" && Number.isFinite(v) ? v.toFixed(1) : "—");

/** I quattro valori di un inset calcolato, espansi come fa il CSS; null per `none`. */
function quattro(clip) {
  const m = /^inset\(([^)]*)\)$/.exec(String(clip).trim());
  if (!m) return null;
  const v = m[1].split(/\s+/).filter(Boolean).map((s) => parseFloat(s));
  const [t, r = t, b = t, l = r] = v;
  return [t, r, b, l];
}

/**
 * Inizio, fine, durata e valori del lato a `puntiMs` dall'inizio di una corsa di clip.
 * «apre»: il lato scende da 100 e la corsa finisce quando i quattro valori sono 0;
 * «chiude»: il lato sale da 0 e finisce a 100. L'inizio vero cade fra l'ultimo
 * campione fermo e il primo mosso: si prende il punto medio.
 */
function corsa(serie, lato, verso, puntiMs) {
  const mosso = verso === "apre" ? (v) => v[lato] < 99.999 : (v) => v[lato] > 0.001;
  const arrivato = verso === "apre" ? (v) => v.every((n) => Math.abs(n) <= 0.001) : (v) => v[lato] >= 99.999;
  const i = serie.findIndex((x) => x.v && mosso(x.v));
  if (i < 0) return { start: null, end: null, dur: null, punti: puntiMs.map(() => null) };
  const start = i > 0 ? (serie[i - 1].t + serie[i].t) / 2 : serie[i].t;
  const fine = serie.slice(i).find((x) => x.v && arrivato(x.v));
  const vicino = (t) => serie.reduce((best, x) => (Math.abs(x.t - t) < Math.abs(best.t - t) ? x : best));
  return {
    start,
    end: fine ? fine.t : null,
    dur: fine ? fine.t - start : null,
    punti: puntiMs.map((p) => vicino(start + p).v?.[lato] ?? null),
  };
}

/** La serie di una linea (indice `k` fra le visibili) da un campionamento di `linee`. */
const serie = (campioni, k) => campioni.map((c) => ({ t: c.t, v: c.v[k] ? quattro(c.v[k][1]) : null }));

/**
 * Campionatore di sampleFrames (passa da toString: usa solo globali e `a`, che resta
 * lo stesso oggetto fra i fotogrammi). Nel primo fotogramma porta il bordo alto della
 * lista a `a.frac × innerHeight`; a ogni fotogramma legge asse e clip delle linee visibili.
 */
function linee(a) {
  if (!a.fatto) {
    a.fatto = true;
    const r = document.querySelector(a.lista).getBoundingClientRect();
    window.scrollTo({ top: window.scrollY + r.top - a.frac * window.innerHeight, behavior: "instant" });
  }
  return [...document.querySelectorAll(a.linee)]
    .filter((e) => getComputedStyle(e).display !== "none")
    .map((e) => [e.getAttribute("data-axis"), getComputedStyle(e).clipPath]);
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

/**
 * Il bordo `edge` di `selector` a `frac × innerHeight` con scroll istantaneo, tolleranza
 * 0,005 (come placeEdge di e2e/coreografia.ts). Restituisce la frazione ottenuta; con
 * `strict` registra un fallimento se non ci arriva.
 */
async function place(page, selector, edge, frac, { strict = true } = {}) {
  const leggi = () =>
    page.evaluate(
      ({ selector, edge }) => {
        const r = document.querySelector(selector).getBoundingClientRect();
        return (edge === "top" ? r.top : r.bottom) / window.innerHeight;
      },
      { selector, edge },
    );
  for (let i = 0; i < 5; i++) {
    await fermo(page);
    const at = await leggi();
    if (Math.abs(at - frac) <= 0.005) return at;
    await page.evaluate((d) => window.scrollTo({ top: window.scrollY + d * window.innerHeight, behavior: "instant" }), at - frac);
  }
  await fermo(page);
  const at = await leggi();
  if (strict && Math.abs(at - frac) > 0.005) failures.push(`${selector}: ${edge} a ${at.toFixed(3)} invece di ${frac}`);
  return at;
}

/** Scende con la rotella a colpi da 400 px ogni 30 ms fin quasi alla quota: da 1024 px lo scrub vive sotto i corridoi (spec §2.4). */
async function rotella(page, selector, edge, frac) {
  await page.mouse.move(12, Math.round(page.viewportSize().height / 2));
  const { da, a } = await page.evaluate(
    ({ selector, edge, frac }) => {
      const r = document.querySelector(selector).getBoundingClientRect();
      return { da: window.scrollY, a: window.scrollY + (edge === "top" ? r.top : r.bottom) - frac * window.innerHeight };
    },
    { selector, edge, frac },
  );
  for (let y = da; y + 400 < a; y += 400) {
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(30);
  }
}

const server = await startServer();
const browser = await launch();

/** Contesto con motion attivo, sipario saltato e consenso accettato; `init` gira prima degli script della pagina. */
async function apri(viewport, path, init = null) {
  const ctx = await motionContext(browser, { viewport, deviceScaleFactor: 1 }, { consent: "accepted" });
  const page = await ctx.newPage();
  if (init) await page.addInitScript(init);
  await page.goto(`${server.base}${path}`, { waitUntil: "domcontentloaded" });
  await page.locator("header").first().waitFor({ state: "visible" });
  return { ctx, page };
}

/** Aspetta l'idratazione del foglio: la prima riga chiusa dal JS, lista sotto lo schermo al montaggio. */
async function righeChiuse(page, tag) {
  try {
    await page.waitForFunction(
      (sel) => {
        const e = document.querySelector(sel);
        return !!e && /^inset\(0%? 100%/.test(getComputedStyle(e).clipPath);
      },
      `${LINEE}[data-axis="x"]`,
      { timeout: 15_000 },
    );
    return true;
  } catch {
    failures.push(`${tag}: dopo 15 s le righe del D.O.C. non risultano chiuse dal JS`);
    return false;
  }
}

/** Scala dell'interno della prima scatola a cinque quote, e i controlli di spec §3.12. */
async function zoomQuote(page, tag) {
  const width = page.viewportSize().width;
  if (width >= 1024) await rotella(page, SCATOLA, "top", 1);
  const scale = [];
  for (const [edge, frac] of [["top", 1], ["top", 0.95], ["top", 0.8], ["top", 0.6], ["bottom", 1]]) {
    await place(page, SCATOLA, edge, frac);
    await page.waitForTimeout(1_500); // scrub 1,0: il valore raggiunge lo scroll in circa un secondo
    scale.push(
      await page.evaluate((sel) => {
        const t = getComputedStyle(document.querySelector(sel)).transform;
        return new DOMMatrixReadOnly(t === "none" ? undefined : t).a;
      }, `${SCATOLA} > [data-zoom]`),
    );
  }
  check(scale[1] > (width >= 1024 ? 1.1 : 1.08), `${tag}: a top 95 % la scala è ${scale[1].toFixed(3)}, attesa > ${width >= 1024 ? "1,10" : "1,08"}`);
  check(Math.abs(scale[4] - 1) <= 0.01, `${tag}: col bordo basso sul fondo la scala è ${scale[4].toFixed(3)}, attesa 1 ± 0,01`);
  check(scale.every((s, i) => i === 0 || s <= scale[i - 1] + 0.002), `${tag}: la scala non scende in modo monotono (${scale.map((s) => s.toFixed(3)).join(" ")})`);

  await page.waitForFunction((sel) => document.querySelector(sel)?.complete === true, `${SCATOLA} img`, { timeout: 10_000 });
  const { w, serve, trabocca } = await page.evaluate(
    ({ sel, ratio }) => {
      const box = document.querySelector(sel);
      const img = box.querySelector("img");
      const r = box.getBoundingClientRect();
      return {
        w: Number(new URL(img.currentSrc, location.href).searchParams.get("w")),
        serve: Math.ceil(Math.max(r.width, r.height * ratio) * 1.15 * devicePixelRatio),
        trabocca: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    },
    { sel: SCATOLA, ratio: RATIO_RIGA_1 },
  );
  check(w >= serve, `${tag}: la riga 1 scarica ${w} px, ne servono ${serve}`);
  check(trabocca <= 0, `${tag}: la pagina trabocca di ${trabocca} px in orizzontale`);
  return { scale, w, serve, trabocca };
}

const docRows = [];
const zoomRows = [];
const clsRows = [];

try {
  // 1. D.O.C. su /: ingresso con la lista al 50 %, uscita con la lista all'80 %; poi Services.
  for (const vp of DOC_VIEWPORTS) {
    const tag = `${vp.width}×${vp.height}`;
    const { ctx, page } = await apri(vp, "/");
    try {
      if (!(await righeChiuse(page, tag))) continue;
      await page.waitForTimeout(1_000);

      const dentro = await sampleFrames(page, 2_200, linee, { lista: LISTA, linee: LINEE, frac: 0.5 });
      const assi = dentro[dentro.length - 1].v.map((x) => x[0]);
      const righe = assi.flatMap((a, k) => (a === "x" ? [k] : []));
      const iSpina = assi.indexOf("y");
      check(righe.length === 5, `${tag}: ${righe.length} righe visibili invece di 5`);
      check(vp.width >= 768 === iSpina > -1, `${tag}: spina ${iSpina > -1 ? "visibile" : "assente"} a ${vp.width} px (visibile solo da 768)`);
      if (righe.length !== 5) continue;

      const ing = righe.map((k) => corsa(serie(dentro, k), 1, "apre", [400]));
      const passiIn = ing.slice(1).map((c, i) => c.start - ing[i].start);
      check(ing[0].start !== null && ing[0].start >= 180 && ing[0].start <= 320, `${tag}: la riga 1 parte a ${ms(ing[0].start)} ms, attesi 180-320 (ritardo 0,2 s)`);
      passiIn.forEach((p, i) => check(entro(p, 80, 20), `${tag}: passo d'ingresso ${i + 1}→${i + 2} di ${ms(p)} ms, attesi 80 ± 20`));
      ing.forEach((c, i) => check(entro(c.dur, 800, 40), `${tag}: riga ${i + 1} tirata in ${ms(c.dur)} ms, attesi 800 ± 40`));
      check(entro(ing[0].punti[0], META_IN, 6), `${tag}: lato destro della riga 1 a 400 ms al ${pc(ing[0].punti[0])} %, atteso ${META_IN} ± 6 (lineare 50)`);
      let spIn = null;
      if (iSpina > -1) {
        spIn = corsa(serie(dentro, iSpina), 2, "apre", []);
        check(entro(spIn.dur, 1_120, 50), `${tag}: spina in ${ms(spIn.dur)} ms, attesi 1120 ± 50`);
        check(entro(spIn.start, ing[0].start ?? Number.NaN, 20), `${tag}: la spina parte a ${ms(spIn.start)} ms, la riga 1 a ${ms(ing[0].start)} (± 20)`);
        check(entro(spIn.end, ing[4].end ?? Number.NaN, 50), `${tag}: la spina finisce a ${ms(spIn.end)} ms, la riga 5 a ${ms(ing[4].end)} (± 50)`);
      }

      const fuori = await sampleFrames(page, 1_400, linee, { lista: LISTA, linee: LINEE, frac: 0.8 });
      const usc = righe.map((k) => corsa(serie(fuori, k), 3, "chiude", [250, 400]));
      const passiOut = [3, 2, 1, 0].map((i) => usc[i].start - usc[i + 1].start);
      check(usc[4].start !== null && usc[4].start <= 100, `${tag}: la riga 5 comincia a uscire a ${ms(usc[4].start)} ms, atteso ≤ 100 (uscita dall'ultima)`);
      passiOut.forEach((p, j) => check(entro(p, 50, 20), `${tag}: passo d'uscita ${5 - j}→${4 - j} di ${ms(p)} ms, attesi 50 ± 20`));
      usc.forEach((c, i) => check(entro(c.dur, 500, 40), `${tag}: riga ${i + 1} uscita in ${ms(c.dur)} ms, attesi 500 ± 40`));
      check(entro(usc[4].punti[0], META_OUT, 5), `${tag}: lato sinistro della riga 5 a 250 ms al ${pc(usc[4].punti[0])} %, atteso ${META_OUT} ± 5`);
      check(entro(usc[4].punti[1], OTTANTA_OUT, 6), `${tag}: lato sinistro della riga 5 a 400 ms al ${pc(usc[4].punti[1])} %, atteso ${OTTANTA_OUT} ± 6`);
      let spOut = null;
      if (iSpina > -1) {
        spOut = corsa(serie(fuori, iSpina), 0, "chiude", []);
        check(entro(spOut.dur, 500, 40), `${tag}: spina uscita in ${ms(spOut.dur)} ms, attesi 500 ± 40`);
      }

      docRows.push([
        tag,
        ms(ing[0].start),
        passiIn.map(ms).join(" / "),
        ing.map((c) => ms(c.dur)).join(" / "),
        pc(ing[0].punti[0]),
        spIn ? `${ms(spIn.start)} / ${ms(spIn.dur)} / ${ms(spIn.end)} (riga 5: ${ms(ing[4].end)})` : "sotto 768",
        ms(usc[4].start),
        passiOut.map(ms).join(" / "),
        usc.map((c) => ms(c.dur)).join(" / "),
        `${pc(usc[4].punti[0])} / ${pc(usc[4].punti[1])}`,
        spOut ? ms(spOut.dur) : "sotto 768",
      ]);

      const z = await zoomQuote(page, `${tag} /`);
      zoomRows.push(["/", tag, z.scale.slice(0, 4).map((s) => s.toFixed(3)).join(" / "), z.scale[4].toFixed(3), `${z.w} / ${z.serve}`, z.trabocca]);
    } finally {
      await ctx.close();
    }
  }

  // 2. Services su /servizi (spec §5.3): stesso zoom, nessun traboccamento.
  for (const vp of SERVIZI_VIEWPORTS) {
    const tag = `${vp.width}×${vp.height}`;
    const { ctx, page } = await apri(vp, "/servizi");
    try {
      await page.locator(SCATOLA).first().waitFor({ state: "attached" });
      await page.waitForTimeout(1_500);
      const z = await zoomQuote(page, `${tag} /servizi`);
      zoomRows.push(["/servizi", tag, z.scale.slice(0, 4).map((s) => s.toFixed(3)).join(" / "), z.scale[4].toFixed(3), `${z.w} / ${z.serve}`, z.trabocca]);
    } finally {
      await ctx.close();
    }
  }

  // 3. CLS con sorgente nel foglio del D.O.C. su /vendi, /metodo, /acquista a 390×664:
  //    la lista entra (50 %), esce (80 %) e rientra (50 %).
  for (const path of PAGINE_DOC) {
    const vp = { width: 390, height: 664 };
    const tag = `${path} 390×664`;
    const { ctx, page } = await apri(vp, path, () => {
      window.__shifts = [];
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) window.__shifts.push(e);
      }).observe({ type: "layout-shift", buffered: true });
    });
    try {
      if (!(await righeChiuse(page, tag))) continue;
      await page.waitForTimeout(1_000);
      const quote = [];
      for (const frac of [0.5, 0.8, 0.5]) {
        quote.push(await place(page, LISTA, "top", frac, { strict: false }));
        await page.waitForTimeout(1_800);
      }
      check(quote[0] < 0.6 && quote[1] > 0.6 && quote[2] < 0.6, `${tag}: la passata non attraversa la linea del 60 % (${quote.map((q) => q.toFixed(3)).join(" / ")})`);
      const { somma, nodi } = await page.evaluate(() => {
        const foglio = document.querySelector("#domus-doc [data-doc-sheet]");
        let somma = 0;
        const nodi = new Set();
        for (const e of window.__shifts) {
          if (e.hadRecentInput) continue;
          const dentro = (e.sources ?? []).filter((s) => s.node && foglio.contains(s.node));
          if (dentro.length === 0) continue;
          somma += e.value;
          for (const s of dentro) nodi.add(`${s.node.nodeName}${s.node.getAttribute ? `[${s.node.getAttribute("class") ?? ""}]` : ""}`);
        }
        return { somma, nodi: [...nodi] };
      });
      check(somma <= 0.0001, `${tag}: spostamenti di layout nel foglio per ${somma.toFixed(4)} (${nodi.join(", ")})`);
      clsRows.push([path, "390×664", somma.toFixed(4), nodi.length ? nodi.join(", ") : "nessuno", quote.map((q) => q.toFixed(3)).join(" / ")]);
    } finally {
      await ctx.close();
    }
  }

  // 4. Pellicole per Alberto (D26), a 1440 e 390: lista al 35 %, sopra la linea del 60 %,
  //    così il foglio sta quasi tutto a schermo. «ingresso» a 660 ms, metà dell'ingresso
  //    (1,32 s); «fermo» 2 s dopo, a gesto finito e pagina ferma.
  for (const vp of PELLICOLE_VIEWPORTS) {
    const tag = `${vp.width}×${vp.height}`;
    const { ctx, page } = await apri(vp, "/");
    try {
      if (!(await righeChiuse(page, tag))) continue;
      await page.waitForTimeout(1_000);
      await page.evaluate((sel) => {
        const r = document.querySelector(sel).getBoundingClientRect();
        window.scrollTo({ top: window.scrollY + r.top - 0.35 * window.innerHeight, behavior: "instant" });
      }, LISTA);
      await page.waitForTimeout(660);
      await page.screenshot({ path: join(HERE, `14-doc-ingresso-${vp.width}.png`) });
      await page.waitForTimeout(2_000);
      await page.screenshot({ path: join(HERE, `14-doc-fermo-${vp.width}.png`) });
    } finally {
      await ctx.close();
    }
  }
  for (const nome of ["14-doc-ingresso-1440.png", "14-doc-fermo-1440.png", "14-doc-ingresso-390.png", "14-doc-fermo-390.png"]) {
    check(existsSync(join(HERE, nome)), `manca la pellicola misure/${nome}`);
  }
} finally {
  await browser.close();
  await server.stop();
}

appendResults(
  [
    `## Commit 14 · D.O.C. rigato e zoom di Services (${today()}, ${gitCommit()})`,
    "### D.O.C. su /, tempi dai campioni rAF (ms e %)",
    mdTable(
      ["viewport", "riga 1 parte", "passi d'ingresso", "durate d'ingresso", "lato dx riga 1 a 400 ms", "spina inizio / durata / fine", "riga 5 esce da", "passi d'uscita (5→1)", "durate d'uscita", "lato sx riga 5 a 250 / 400 ms", "spina in uscita"],
      docRows,
    ),
    "### Services, scala dell'interno e sorgente della riga 1",
    mdTable(["pagina", "viewport", "scala a top 100 / 95 / 80 / 60 %", "scala a fondo", "w scaricata / servita", "traboccamento (px)"], zoomRows),
    "### CLS con sorgente nel foglio del D.O.C.",
    mdTable(["pagina", "viewport", "somma", "nodi", "quote della passata"], clsRows),
  ].join("\n\n"),
);

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log("commit 14: tutti i criteri reggono");
}
