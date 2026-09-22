// Il paint dell'alone della testa di era (commit T, D193; A38 di Alberto). Sul modello di
// 17-paint.mjs: CDP tracing con CPU ×4, gli eventi Paint del thread del renderer sommati in
// finestre da 16,7 ms fra due performance.mark, tetto p95 < 4 ms sulla posa e sulla cartolina.
//   1. `--riproduci`: la cartolina della home (17-paint.mjs), il caso noto: il metro è lo stesso;
//   2. /servizi in tedesco (l'H1 più lungo, 5 righe, ~60 lettere) a 1440×900 durante la posa
//      `title` dei reveal della testa — con D198 le lettere in moto non portano ombra: le 18 ombre
//      stanno sulla copia statica, che il browser rasterizza una volta e poi dissolve — e poi
//      lungo la corsa della scatola (scroll 0 → 900, lo strato che scende con dtTerreno);
//   3. `--controllo`: la stessa corsa, sullo stesso build, con la testa spenta un pezzo alla volta,
//      tre lanci ciascuno, intercalati ai lanci del ramo (stessa macchina, stesso momento) e per la
//      stessa via (pagina nuova, la posa lasciata finire, poi la corsa: ramo e controllo differiscono
//      solo per il CSS iniettato):
//        (a) senza alone — `.dt-alone { text-shadow: none !important }` iniettato;
//        (b) strato fermo — `--dt-testa-mf: 0` su :root (lo strato è il riquadro, come sui legali e
//            con moto ridotto) più `transform: none !important` e `will-change: auto !important`
//            sullo strato: il tween di PageHeroTesta legge `m` dalla prop (tinte.json), non dal CSS,
//            e continuerebbe a scrivere la trasformata inline; la regola `!important` la batte, e
//            lo strato non si muove né tiene un livello suo.
//      Il numero che giudica la testa lungo la corsa è **mediana del ramo − mediana di (b)** (≤ +1 ms):
//      il resto del paint della corsa è della pagina (i reveal delle sezioni sotto la testa e il
//      segno mutano stili inline a ogni fotogramma sul layer radice, invalidation tracking di
//      Chromium) e c'è anche con la testa ferma. Il delta contro (a) è il dato sull'alone. Il tetto
//      dei 4 ms veniva dalla cartolina (17-paint.mjs), dove nulla si svela sotto uno sticky: resta
//      sulla posa e sulla cartolina, non sulla corsa. D199 (T4) si scrive su questi numeri.
//   4. i fermi del reveal (D230): a t 1,0 s e 2,0 s dalla partenza della posa `title` uno
//      screenshot, e il p10 dei pixel PIENI delle lettere dell'H1 GIÀ ATTERRATE a quell'istante
//      (opacità 1, nessuna trasformata; la maschera a riposo ritagliata sui loro rettangoli)
//      contro il riposo sugli stessi pixel entro ±0,02 — la copia che sale non deve sporcare le
//      lettere che atterrano; poi a fine posa (`shown`) il p10 di TUTTI i pixel pieni contro il
//      riposo entro ±0,02: l'immagine è quella a riposo. Perché non «a 2,0 s l'immagine a riposo»
//      come il brief T (T1.4): su /servizi de l'H1 ha 60 lettere e la posa dura 0,3 + 1,2 (stagger,
//      tetto D19) + 1,2 (durata) = 2,7 s, misurato 2706-2710 ms; a 2,0 s le ultime lettere sono
//      ancora in volo per costruzione (p10 0,47 sulla maschera intera: era la misura della posa,
//      non della copia). I due istanti restano quelli del brief e misurano ciò che il brief voleva.
//      Un fermo è di ~100 ms (lo screenshot): le lettere atterrate si leggono PRIMA dello scatto,
//      e chi è atterrato resta atterrato (la posa è monotona), quindi la maschera è un sottoinsieme.
//   5. `--base=URL` (facoltativo, solo riferimento): la stessa corsa su un `next start` di HEAD
//      cec1551 (worktree, acceso dal chiamante su un'altra porta). Non è un controllo della testa:
//      su HEAD /servizi corre il tuffo di A20 (sticky, scala 1 → 2), un'altra animazione. Si riporta
//      senza giudizio.
// Il blocco di Open Domus dentro la finestra (T2) non è ancora costruito: si misura in T2.2.
// Gira sul build esistente con lib.mjs (next start sulla 3178).
//   node docs/superpowers/specs/2026-09-13-coreografia-era-residence/misure/T-paint.mjs [--riproduci] [--controllo] [--lanci=3] [--base=http://127.0.0.1:3179]
import sharp from "sharp";
import { appendResults, gitCommit, launch, mdTable, motionContext, startServer, today } from "./lib.mjs";

const argv = process.argv.slice(2);
const RIPRODUCI = argv.includes("--riproduci");
const CONTROLLO = argv.includes("--controllo");
const LANCI = Number((argv.find((a) => a.startsWith("--lanci=")) ?? "--lanci=3").slice(8));
/** `--base=http://127.0.0.1:3179`: un `next start` di HEAD cec1551 (worktree) acceso dal chiamante, solo riferimento. */
const BASE = (argv.find((a) => a.startsWith("--base=")) ?? "").slice(7) || null;
const vp = { width: 1440, height: 900 };
const TETTO = 4;
/** Il delta ammesso fra la corsa del ramo e la corsa col controllo (b): la testa non aggiunge paint alla corsa. */
const DELTA_MAX = 1;

/**
 * La corsa del ramo e i due controlli: stessa procedura (pagina nuova, la posa lasciata finire, la corsa), il
 * CSS del controllo iniettato dopo il DOMContentLoaded e prima della posa; sul ramo nulla. Così ramo e
 * controllo differiscono SOLO per il CSS iniettato, e la corsa del ramo non è quella della pagina che ha
 * già portato la traccia della posa (una sessione CDP in più, il throttling durante il caricamento).
 */
const CORSE = {
  ramo: { nome: "ramo", css: null },
  a: { nome: "controllo (a) senza alone", css: ".dt-alone { text-shadow: none !important; }" },
  b: {
    nome: "controllo (b) strato fermo",
    css: ":root { --dt-testa-mf: 0 !important; } [data-testa-strato] { transform: none !important; will-change: auto !important; }",
  },
};

/** La corsa: scroll 0 → 900 a passi di 10 px ogni 50 ms (Lenis in mezzo), il paint fra i due mark. */
async function misuraCorsa(ctx, page) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(500);
  const fineCorsa = await traccia(ctx, page);
  await page.mouse.move(vp.width / 2, vp.height / 2);
  await page.evaluate(() => performance.mark("dt-corsa-start"));
  for (let i = 0; i < 400; i++) {
    const y = await page.evaluate(() => window.scrollY);
    if (y >= 900 - 20) break;
    await page.mouse.wheel(0, 10);
    await page.waitForTimeout(50);
  }
  await page.waitForTimeout(800);
  await page.evaluate(() => performance.mark("dt-corsa-end"));
  return paintFra(await fineCorsa(), "dt-corsa-start", "dt-corsa-end");
}

/**
 * Una corsa di CORSE: /servizi de su una pagina nuova, il CSS (se c'è) iniettato appena il DOM c'è, la posa
 * lasciata finire (`shown` sul blocco), poi la corsa. A fine corsa verifica che la pagina sia quella voluta
 * (`preso`): sul ramo lo strato è alto 100 % + m e porta la trasformata della parallasse (il tween ha
 * corso); (a) nessuna ombra calcolata sui nodi `.dt-alone`, testata compresa; (b) lo strato è alto quanto
 * il riquadro, senza trasformata e senza will-change.
 */
async function misuraCorsaDi(browser, base, chiave) {
  const { css } = CORSE[chiave];
  const ctx = await motionContext(browser, { viewport: vp }, { consent: "accepted", locale: "de" });
  const page = await ctx.newPage();
  await page.goto(`${base}/servizi`, { waitUntil: "domcontentloaded" });
  if (css) await page.addStyleTag({ content: css });
  await page.waitForFunction(() => document.querySelector("[data-testa] .dt-testa_blocco")?.getAttribute("data-reveal-state") === "shown", null, { timeout: 30_000 });
  const corsa = await misuraCorsa(ctx, page);
  const preso = await page.evaluate((k) => {
    if (k === "a") return Array.from(document.querySelectorAll("[data-testa] .dt-alone, header .dt-alone")).every((el) => getComputedStyle(el).textShadow === "none");
    const strato = document.querySelector("[data-testa-strato]");
    const riquadro = document.querySelector("[data-testa] [data-dive-zoom]");
    if (!strato || !riquadro) return false;
    const cs = getComputedStyle(strato);
    const h = strato.getBoundingClientRect().height;
    const hr = riquadro.getBoundingClientRect().height;
    if (k === "b") return Math.abs(h - hr) <= 1 && cs.transform === "none" && cs.willChange === "auto";
    // ramo: alto 100 % + m e traslato verso il basso (a scroll ≈ 880 la parallasse è quasi a fine corsa).
    const ty = Number(/matrix\(1, 0, 0, 1, 0, (-?[\d.]+)\)/.exec(cs.transform)?.[1] ?? 0);
    return h > hr * 1.1 && ty > 1;
  }, chiave);
  await ctx.close();
  return { ...corsa, preso };
}

/** Gli eventi Paint fra due mark, sommati per finestre da 16,7 ms sul thread con più Paint: p95 e max in ms. */
function paintFra(eventi, m0, m1) {
  const mark = (nome) => eventi.find((e) => e.name === nome && String(e.cat).includes("blink.user_timing"))?.ts;
  const t0 = mark(m0);
  const t1 = mark(m1);
  const paint = eventi.filter((e) => e.name === "Paint" && typeof e.dur === "number" && t0 !== undefined && t1 !== undefined && e.ts >= t0 && e.ts <= t1);
  const perTid = new Map();
  for (const e of paint) perTid.set(e.tid, (perTid.get(e.tid) ?? 0) + 1);
  const tid = [...perTid.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const secchi = new Map();
  for (const e of paint.filter((x) => x.tid === tid)) {
    const k = Math.floor((e.ts - t0) / 16_667);
    secchi.set(k, (secchi.get(k) ?? 0) + e.dur);
  }
  const ms = [...secchi.values()].map((u) => u / 1000).sort((a, b) => a - b);
  return { marks: t0 !== undefined && t1 !== undefined, fotogrammi: ms.length, p95: ms[Math.floor(0.95 * (ms.length - 1))] ?? 0, max: ms.at(-1) ?? 0 };
}

/** Avvia la traccia con CPU ×4; `fine()` la chiude e rende gli eventi. */
async function traccia(ctx, page) {
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  const eventi = [];
  cdp.on("Tracing.dataCollected", (e) => eventi.push(...e.value));
  const completo = new Promise((r) => cdp.on("Tracing.tracingComplete", r));
  await cdp.send("Tracing.start", { categories: "devtools.timeline,blink.user_timing", transferMode: "ReportEvents" });
  return async () => {
    await cdp.send("Tracing.end");
    await completo;
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
    return eventi;
  };
}

const mediana = (v) => [...v].sort((a, b) => a - b)[Math.floor((v.length - 1) / 2)];
const segno = (d) => `${d >= 0 ? "+" : ""}${d.toFixed(2)} ms`;

// ─── colorimetria (cancello-T1.mjs) ───
const lin = (c) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const Yrel = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
async function lumaDi(png) {
  const { data, info } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const Y = new Float32Array(info.width * info.height);
  for (let i = 0; i < Y.length; i++) Y[i] = Yrel(data[i * info.channels], data[i * info.channels + 1], data[i * info.channels + 2]);
  return { w: info.width, h: info.height, Y };
}
async function pieniDi(png) {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const pieni = [];
  for (let q = 0; q < info.width * info.height; q++) if (data[q * 4 + 3] === 255) pieni.push(q);
  return pieni;
}
const p10Su = (f, pieni) => {
  const v = pieni.map((q) => f.Y[q]).sort((a, b) => a - b);
  return v[Math.floor(v.length * 0.1)] ?? NaN;
};
const STILE_MASCHERA =
  "html, body { background: transparent !important; } body * { visibility: hidden !important; } [data-testa] h1, [data-testa] h1 * { visibility: visible !important; text-shadow: none !important; color: #fff !important; } [data-alone-copia] { visibility: hidden !important; }";
const STILE_RESA = "header, .dt-segno, nextjs-portal { visibility: hidden !important; }";
async function conStile(page, css, fn) {
  await page.evaluate((c) => {
    const s = document.createElement("style");
    s.id = "dt-t-paint";
    s.textContent = c;
    document.head.append(s);
  }, css);
  try {
    return await fn();
  } finally {
    await page.evaluate(() => document.getElementById("dt-t-paint")?.remove());
  }
}

const { base, stop } = await startServer();
const browser = await launch();
const righe = [];
const corse = [];
const corseControllo = { a: [], b: [] };
const corseBase = [];
let ok = true;
try {
  if (RIPRODUCI) {
    // 1. La cartolina (17-paint.mjs), lo stesso metro.
    const ctx = await motionContext(browser, { viewport: vp }, { consent: "accepted" });
    const page = await ctx.newPage();
    await page.goto(`${base}/`, { waitUntil: "load" });
    await page.waitForTimeout(800);
    const q = await page.evaluate(() => {
      let y = 0;
      for (let n = document.querySelector('[data-corridor="cartolina"]'); n; n = n.offsetParent) y += n.offsetTop;
      return { secTop: y, vh: window.innerHeight };
    });
    const fineSticky = q.secTop + q.vh * 0.8;
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), q.secTop - 10);
    await page.waitForFunction(() => document.querySelector("[data-postcard-clip]")?.getAttribute("data-ambient") === "playing", null, { timeout: 10_000 }).catch(() => {});
    const fine = await traccia(ctx, page);
    await page.mouse.move(vp.width / 2, vp.height / 2);
    await page.evaluate(() => performance.mark("dt-sticky-start"));
    for (let i = 0; i < 400; i++) {
      const y = await page.evaluate(() => window.scrollY);
      if (y >= fineSticky - 30) break;
      await page.mouse.wheel(0, 10);
      await page.waitForTimeout(50);
    }
    await page.waitForTimeout(1000);
    await page.evaluate(() => performance.mark("dt-sticky-end"));
    const e = paintFra(await fine(), "dt-sticky-start", "dt-sticky-end");
    await ctx.close();
    // Il tetto è il p95 (brief T §6, «tetto p95 4 ms»): 17-paint.mjs giudicava sul max, che sulla cartolina è
    // sempre stato 7,9-10,4 ms (risultati.md, commit 17) con p95 1,8-2,0: il metro riprodotto è quello del p95.
    const passa = e.marks && e.fotogrammi >= 30 && e.p95 < TETTO;
    ok = ok && passa;
    righe.push(["cartolina (17-paint.mjs)", "1440×900", e.fotogrammi, +e.p95.toFixed(2), +e.max.toFixed(2), "p95 < 4 ms, ≥ 30 fotogrammi (17-paint: p95 1,8-2,0, max 7,9-10,4)", passa ? "ok" : "KO"]);
    console.log("cartolina", e);
  } else {
    for (let lancio = 1; lancio <= LANCI; lancio++) {
      // 2a. La posa `title` su /servizi de: dall'armamento del gruppo della testa alla fine della posa.
      const ctx = await motionContext(browser, { viewport: vp }, { consent: "accepted", locale: "de" });
      const page = await ctx.newPage();
      await page.goto(`${base}/servizi`, { waitUntil: "domcontentloaded" });
      // Prima che il motore armi il gruppo: un osservatore che marca la partenza della posa.
      await page.evaluate(() => {
        const g = document.querySelector("[data-testa] .dt-testa_blocco");
        const w = window;
        w.__dtPosa = { t0: null, t1: null };
        new MutationObserver(() => {
          const s = g?.getAttribute("data-reveal-state");
          if (s === "revealing" && w.__dtPosa.t0 === null) {
            w.__dtPosa.t0 = performance.now();
            performance.mark("dt-posa-start");
          }
          if (s === "shown" && w.__dtPosa.t0 !== null && w.__dtPosa.t1 === null) {
            w.__dtPosa.t1 = performance.now();
            performance.mark("dt-posa-end");
          }
        }).observe(g, { attributes: true, attributeFilter: ["data-reveal-state"] });
      });
      const fine = await traccia(ctx, page);
      await page.waitForFunction(() => window.__dtPosa?.t1 !== null, null, { timeout: 30_000 });
      const eventi = await fine();
      const posa = paintFra(eventi, "dt-posa-start", "dt-posa-end");
      const durata = await page.evaluate(() => Math.round(window.__dtPosa.t1 - window.__dtPosa.t0));
      await ctx.close();
      const passaPosa = posa.marks && posa.fotogrammi >= 30 && posa.p95 < TETTO;
      ok = ok && passaPosa;
      righe.push([`posa title /servizi de (lancio ${lancio}, ${durata} ms)`, "1440×900", posa.fotogrammi, +posa.p95.toFixed(2), +posa.max.toFixed(2), "p95 < 4 ms, ≥ 30 fotogrammi", passaPosa ? "ok" : "KO"]);
      console.log(`lancio ${lancio}: posa`, posa);
      // 2b + 3. La corsa (scroll 0 → 900 a passi di 10 px ogni 50 ms, lo strato che scende) su una pagina nuova,
      //     e con `--controllo` i due controlli intercalati, per la stessa via: (a) senza alone, (b) strato fermo.
      //     Il tetto dei 4 ms vale sulla posa; la corsa si giudica sul delta ramo − (b), sotto.
      for (const k of CONTROLLO ? ["ramo", "a", "b"] : ["ramo"]) {
        const c = await misuraCorsaDi(browser, base, k);
        const letta = c.marks && c.fotogrammi >= 30 && c.preso;
        ok = ok && letta;
        (k === "ramo" ? corse : corseControllo[k]).push(c.p95);
        righe.push([
          `corsa 0 → 900 /servizi de, ${CORSE[k].nome} (lancio ${lancio})`,
          "1440×900",
          c.fotogrammi,
          +c.p95.toFixed(2),
          +c.max.toFixed(2),
          k === "ramo" ? "≥ 30 fotogrammi, parallasse corsa; il giudizio è il delta contro il controllo (b)" : `\`${CORSE[k].css}\` iniettato; ≥ 30 fotogrammi`,
          !c.preso ? (k === "ramo" ? "KO (la parallasse non ha corso)" : "KO (il controllo non ha preso)") : letta ? "dato" : "KO",
        ]);
        console.log(`lancio ${lancio}: corsa ${CORSE[k].nome}`, c);
      }
      // 5. La stessa corsa su HEAD (`--base=URL`): solo riferimento, su HEAD corre un'altra animazione (il tuffo di A20).
      if (BASE) {
        const ctxB = await motionContext(browser, { viewport: vp }, { consent: "accepted", locale: "de" });
        const pageB = await ctxB.newPage();
        await pageB.goto(`${BASE}/servizi`, { waitUntil: "load" });
        await pageB.waitForTimeout(3000);
        const corsaB = await misuraCorsa(ctxB, pageB);
        await ctxB.close();
        corseBase.push(corsaB.p95);
        righe.push([`corsa 0 → 900 /servizi de su HEAD cec1551 ${BASE} (lancio ${lancio})`, "1440×900", corsaB.fotogrammi, +corsaB.p95.toFixed(2), +corsaB.max.toFixed(2), "riferimento, non controllo: su HEAD corre il tuffo di A20", "—"]);
        console.log(`lancio ${lancio}: corsa HEAD`, corsaB);
      }
    }
    if (CONTROLLO) {
      // Il numero che giudica la testa lungo la corsa: mediana del ramo − mediana del controllo (b) (strato fermo).
      const deltaB = mediana(corse) - mediana(corseControllo.b);
      const passa = deltaB <= DELTA_MAX;
      ok = ok && passa;
      righe.push([`corsa: mediana del ramo − mediana del controllo (b) strato fermo (${LANCI} lanci)`, "1440×900", "—", +mediana(corse).toFixed(2), +mediana(corseControllo.b).toFixed(2), `delta ≤ +${DELTA_MAX} ms: la parallasse della testa non aggiunge paint alla corsa (D199, T4)`, passa ? `ok (${segno(deltaB)})` : `KO (${segno(deltaB)})`]);
      // L'alone lungo la corsa: dato.
      const deltaA = mediana(corse) - mediana(corseControllo.a);
      righe.push([`corsa: mediana del ramo − mediana del controllo (a) senza alone (${LANCI} lanci)`, "1440×900", "—", +mediana(corse).toFixed(2), +mediana(corseControllo.a).toFixed(2), "dato: il costo delle 18 ombre lungo la corsa", `— (${segno(deltaA)})`]);
    } else {
      righe.push(["corsa: giudizio", "1440×900", "—", +mediana(corse).toFixed(2), "—", "senza --controllo la corsa non si giudica: lanciare con --controllo", "—"]);
    }
    if (BASE) {
      righe.push([`corsa: mediana del ramo − mediana di HEAD cec1551 (${LANCI} lanci)`, "1440×900", "—", +mediana(corse).toFixed(2), +mediana(corseBase).toFixed(2), "riferimento: un'altra animazione su HEAD, nessun giudizio", `— (${segno(mediana(corse) - mediana(corseBase))})`]);
    }
    // 4. I fermi del reveal (D230): t 1,0 s e 2,0 s dalla partenza della posa sulle lettere già atterrate,
    //    poi fine posa (`shown`) sull'H1 intero, contro il riposo.
    const ctx = await motionContext(browser, { viewport: vp }, { consent: "accepted", locale: "de" });
    const page = await ctx.newPage();
    await page.goto(`${base}/servizi`, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      const g = document.querySelector("[data-testa] .dt-testa_blocco");
      window.__dtPosa = { t0: null, t1: null };
      new MutationObserver(() => {
        const s = g?.getAttribute("data-reveal-state");
        if (s === "revealing" && window.__dtPosa.t0 === null) window.__dtPosa.t0 = performance.now();
        if (s === "shown" && window.__dtPosa.t0 !== null && window.__dtPosa.t1 === null) window.__dtPosa.t1 = performance.now();
      }).observe(g, { attributes: true, attributeFilter: ["data-reveal-state"] });
    });
    /** Le lettere dell'H1 vero: indice → atterrata (opacità 1, nessuna trasformata) e il suo rettangolo. */
    const lettere = () =>
      page.evaluate(() =>
        Array.from(document.querySelectorAll("[data-testa] h1 .dt-c[data-c]"), (el) => {
          const cs = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          return { atterrata: Number(cs.opacity) >= 0.999 && /^(none|matrix\(1, 0, 0, 1, 0, 0\))$/.test(cs.transform), x: r.left, y: r.top, w: r.width, h: r.height };
        }),
      );
    await page.waitForFunction(() => window.__dtPosa?.t0 !== null, null, { timeout: 30_000 });
    const fermi = {};
    for (const t of [1000, 2000]) {
      await page.waitForFunction((soglia) => performance.now() - window.__dtPosa.t0 >= soglia, t, { timeout: 10_000 });
      // Prima chi è atterrato, poi lo scatto: la posa è monotona, e l'insieme letto è un sottoinsieme di quello nello scatto.
      const atterrate = (await lettere()).map((l, i) => (l.atterrata ? i : -1)).filter((i) => i >= 0);
      const quando = await page.evaluate(() => Math.round(performance.now() - window.__dtPosa.t0));
      fermi[t] = { quando, atterrate, png: await conStile(page, STILE_RESA, () => page.screenshot()) };
    }
    await page.waitForFunction(() => window.__dtPosa?.t1 !== null, null, { timeout: 10_000 });
    const finePosa = { quando: await page.evaluate(() => Math.round(window.__dtPosa.t1 - window.__dtPosa.t0)), png: await conStile(page, STILE_RESA, () => page.screenshot()) };
    await page.waitForTimeout(300);
    const riposoPng = await conStile(page, STILE_RESA, () => page.screenshot());
    const riposoLuma = await lumaDi(riposoPng);
    const pieni = await pieniDi(await conStile(page, STILE_MASCHERA, () => page.screenshot({ omitBackground: true })));
    const tutte = await lettere();
    const W = riposoLuma.w;
    /** I pixel pieni dentro i rettangoli delle lettere date (a riposo le lettere sono ferme: i rettangoli valgono anche per gli scatti). */
    const pieniNei = (rett) => pieni.filter((q) => {
      const x = q % W;
      const y = (q - x) / W;
      return rett.some((r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);
    });
    for (const t of [1000, 2000]) {
      const f = fermi[t];
      // I rettangoli a riposo delle lettere atterrate (per indice: stesso DOM, stessa crenatura).
      const rett = f.atterrate.map((i) => tutte[i]);
      const sotto = pieniNei(rett);
      // A t 1,0 s nessuna lettera è atterrata per costruzione (la prima vola da 0,3 a 1,5 s): la riga lo dice e non
      // giudica; il cancello vive dove qualche lettera è a terra (t 2,0 s) e a fine posa.
      const p10 = sotto.length ? p10Su(await lumaDi(f.png), sotto) : NaN;
      const rif = sotto.length ? p10Su(riposoLuma, sotto) : NaN;
      const passa = sotto.length === 0 || p10 >= rif - 0.02;
      ok = ok && passa;
      righe.push([
        `fermo a t ${f.quando} ms: p10 dei pixel pieni delle ${f.atterrate.length}/${tutte.length} lettere atterrate`,
        "1440×900",
        sotto.length,
        sotto.length ? +p10.toFixed(3) : "—",
        sotto.length ? +rif.toFixed(3) : "—",
        "≥ riposo − 0,02 sugli stessi pixel (le lettere atterrano pulite, D230)",
        sotto.length === 0 ? "— (nessuna lettera a terra: nulla da sporcare)" : passa ? "ok" : "KO",
      ]);
      console.log(`fermo ${t}: ${f.atterrate.length}/${tutte.length} lettere atterrate, p10 ${p10.toFixed(3)} (riposo ${rif.toFixed(3)}) a t ${f.quando} ms`);
    }
    {
      const p10 = p10Su(await lumaDi(finePosa.png), pieni);
      const rif = p10Su(riposoLuma, pieni);
      const passa = Math.abs(p10 - rif) <= 0.02;
      ok = ok && passa;
      righe.push([`fine posa a t ${finePosa.quando} ms: p10 dei pixel pieni dell'H1 intero`, "1440×900", pieni.length, +p10.toFixed(3), +rif.toFixed(3), "riposo ± 0,02 (l'immagine è quella a riposo, D230)", passa ? "ok" : "KO"]);
      console.log(`fine posa: p10 ${p10.toFixed(3)} (riposo ${rif.toFixed(3)}) a t ${finePosa.quando} ms`);
    }
    await ctx.close();
  }
} finally {
  await browser.close();
  await stop();
}

appendResults(
  [
    `### Commit T · paint dell'alone della testa di era, 1440×900, CPU ×4 (${today()}, ${gitCommit()})${RIPRODUCI ? " — riproduzione del metro di 17-paint.mjs" : CONTROLLO ? " — coi controlli della corsa" : ""}`,
    "",
    mdTable(["misura", "viewport", "fotogrammi / pixel", "p95 ms / p10", "max ms / riposo", "atteso", "esito"], righe),
    "",
    RIPRODUCI
      ? "Nota: lo stesso metro di 17-paint.mjs (Paint per finestra da 16,7 ms fra due mark, thread del renderer)."
      : "Nota: con D198 le lettere in moto (posa `title`) non portano ombra; le 18 ombre stanno sulla copia statica sotto, che il browser rasterizza una volta e dissolve; il tetto dei 4 ms vale sulla posa e sulla cartolina. La corsa si giudica sul delta contro il controllo (b), la stessa pagina con lo strato fermo (`--dt-testa-mf: 0`, trasformata e will-change azzerati con `!important`): il paint della corsa è dei reveal delle sezioni sotto la testa e del segno (stili inline mutati a ogni fotogramma sul layer radice, invalidation tracking di Chromium) e c'è anche con la testa ferma; il delta contro (a) (`.dt-alone { text-shadow: none !important }`) è il dato sull'alone. I controlli sono intercalati ai lanci del ramo (stessa macchina, stesso momento) e per la stessa via (pagina nuova, posa finita, corsa: ramo e controllo differiscono solo per il CSS iniettato). I fermi (D230): a t 1,0 s nessuna lettera è a terra per costruzione (la prima vola da 0,3 a 1,5 s), a 2,0 s le atterrate, a fine posa (≈ 2,7 s) l'H1 intero. Il blocco di Open Domus dentro la finestra si misura in T2.2.",
  ].join("\n"),
);
process.exitCode = ok ? 0 : 1;
