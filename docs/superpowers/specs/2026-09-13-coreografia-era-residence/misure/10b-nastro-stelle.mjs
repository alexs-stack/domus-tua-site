// Commit 10b del piano 2026-09-13: pellicole del manifesto del nastro e del
// titolo delle cinque stelle, prima e dopo il passaggio al motore dei reveal.
// A12 e A20 di Alberto (il nastro e il film restano, titoli per lettera), A22
// (lettere piatte), A21 (data-bg della copertina); spec §2.4, §3.5 punto 2,
// §3.6, §6.1. La pellicola del manifesto va mostrata ad Alberto (spec §9.3;
// corsia sistema §3.6). Viewport 1440x900 e 1024x768 (MQ.corridor, D22).
// Argomento: l'etichetta della corsa, "prima" (albero del 10a: registra e
// basta) o "dopo" (controlla i criteri ed esce con 1 se uno sfora).
import {
  startServer,
  launch,
  motionContext,
  scrollInstant,
  sampleFrames,
  mdTable,
  appendResults,
  gitCommit,
  today,
} from "./lib.mjs";

const label = process.argv[2] ?? "dopo";
const controlla = label === "dopo";
const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
];
// Bordo alto di #storia a questa frazione di innerHeight. L'innesco di oggi dei
// caratteri è «top 55%» della radice, il cue del 10b «top 70%».
const QUOTE_MANIFESTO = [0.8, 0.7, 0.6, 0.55, 0.45, 0.8];
const ISTANTI_MANIFESTO = [0, 300, 600, 1200, 2500, 3000];
// Progresso p del film: runway «top 55%» → «bottom bottom»; il cue 0,94 su 1,3
// unità cade a p 0,723.
const P_STELLE = [0.66, 0.64, 0.78, 0.66, 0.04, 0.46, 1];
const ISTANTI_STELLE = [0, 600, 1200, 2500, 4500, 5000];
const sbagli = [];

// Gira nella pagina: sampleFrames lo serializza, quindi niente variabili esterne.
// Lettere [data-c] dopo il 10b, .dt-hchar prima (split di HorizonScroller).
const campiona = (sel) => {
  const ls = Array.from(document.querySelectorAll(sel));
  const intro = document.querySelector("#recensioni .dt-starrev_intro");
  const bg = intro && intro.hasAttribute("data-bg") ? 1 : 0;
  if (!ls.length) return { n: 0, min: -1, max: -1, a: -1, m42: 0, ident: 0, prod: -1, bg };
  const mat = (e) => {
    const t = getComputedStyle(e).transform;
    return new DOMMatrixReadOnly(t === "none" ? undefined : t);
  };
  const ops = ls.map((e) => Number(getComputedStyle(e).opacity));
  const ident = ls.every((e) => {
    const m = mat(e);
    return (
      Math.abs(m.a - 1) < 1e-3 &&
      Math.abs(m.b) < 1e-3 &&
      Math.abs(m.c) < 1e-3 &&
      Math.abs(m.d - 1) < 1e-3 &&
      Math.abs(m.m41) < 0.5 &&
      Math.abs(m.m42) < 0.5
    );
  });
  let prod = 1;
  for (let n = ls[0]; n; n = n.parentElement) {
    prod *= Number(getComputedStyle(n).opacity);
    if (n.id === "main") break;
  }
  const m0 = mat(ls[0]);
  const r3 = (x) => Math.round(x * 1000) / 1000;
  return {
    n: ls.length,
    min: r3(Math.min(...ops)),
    max: r3(Math.max(...ops)),
    a: r3(m0.a),
    m42: Math.round(m0.m42 * 10) / 10,
    ident: ident ? 1 : 0,
    prod: r3(prod),
    bg,
  };
};

const agliIstanti = (frames, istanti) =>
  istanti.map((ms) => frames.find((f) => f.t >= ms) ?? frames[frames.length - 1]);

const srv = await startServer();
const browser = await launch();
try {
  for (const vp of VIEWPORTS) {
    const dim = `${vp.width}x${vp.height}`;
    const ctx = await motionContext(browser, { viewport: vp, deviceScaleFactor: 1 }, { consent: "accepted" });
    const page = await ctx.newPage();
    await page.goto(`${srv.base}/`, { waitUntil: "load" });
    await page.waitForTimeout(1500);

    // ── Manifesto ───────────────────────────────────────────────────────────
    const SEL_M =
      "#storia .dt-horizon_panel--statement h3 [data-c], #storia .dt-horizon_panel--statement h3 .dt-hchar";
    const righeM = [];
    for (const [k, q] of QUOTE_MANIFESTO.entries()) {
      const y = await page.evaluate((quota) => {
        const root = document.querySelector("#storia");
        return root.getBoundingClientRect().top + window.scrollY - quota * window.innerHeight;
      }, q);
      await scrollInstant(page, Math.max(0, y));
      const frames = await sampleFrames(page, 3100, campiona, SEL_M);
      for (const [j, f] of agliIstanti(frames, ISTANTI_MANIFESTO).entries()) {
        const v = f.v;
        const ms = ISTANTI_MANIFESTO[j];
        righeM.push([k + 1, q, ms, v.n, v.min, v.max, v.a, v.m42]);
        if (!controlla) continue;
        if (j === 0 && v.n === 0) sbagli.push(`${dim} manifesto, passo ${k + 1}: nessuna lettera [data-c] nell'h3`);
        if (k === 0 && v.max >= 0.1) sbagli.push(`${dim} manifesto, radice a 0,80 prima del cue, ${ms} ms: max ${v.max}`);
        if (q === 0.6 && ms === 3000 && (v.min < 0.99 || Math.abs(v.a - 1) >= 1e-3 || Math.abs(v.m42) >= 0.5)) {
          sbagli.push(`${dim} manifesto, radice a 0,60, 3000 ms: min ${v.min}, a ${v.a}, m42 ${v.m42}`);
        }
        if (k === QUOTE_MANIFESTO.length - 1 && ms === 1200 && v.max >= 0.1) {
          sbagli.push(`${dim} manifesto, di nuovo a 0,80, 1200 ms: max ${v.max}`);
        }
      }
    }
    appendResults(
      `### 10b pellicola del manifesto (${label}), ${today()}, ${gitCommit()}, ${dim}\n\n` +
        mdTable(
          ["passo", "radice / innerHeight", "ms", "lettere", "min opacità", "max opacità", "a 1ª lettera (cos rotateY)", "m42 1ª lettera"],
          righeM,
        ),
    );

    // ── Titolo delle cinque stelle ──────────────────────────────────────────
    const SEL_S = "#recensioni h2 [data-c]";
    const righeS = [];
    for (const [k, p] of P_STELLE.entries()) {
      const y = await page.evaluate((prog) => {
        const runway = document.querySelector("#recensioni .dt-starrev_runway");
        const top = runway.getBoundingClientRect().top + window.scrollY;
        const start = top - 0.55 * window.innerHeight;
        const end = top + runway.offsetHeight - window.innerHeight;
        return start + prog * (end - start);
      }, p);
      await scrollInstant(page, Math.max(0, y));
      const frames = await sampleFrames(page, 5100, campiona, SEL_S);
      const passo = k + 1;
      for (const [j, f] of agliIstanti(frames, ISTANTI_STELLE).entries()) {
        const v = f.v;
        const ms = ISTANTI_STELLE[j];
        righeS.push([passo, p, ms, v.n, v.min, v.max, v.ident, v.prod, v.bg]);
        if (!controlla) continue;
        const fuori = (cosa) => sbagli.push(`${dim} stelle, passo ${passo} (p ${p}), ${ms} ms: ${cosa}`);
        if (passo === 1 && ms === 1200 && (v.max >= 0.1 || v.prod >= 0.1)) fuori(`max ${v.max}, prodotto ${v.prod}`);
        if (passo === 1 && ms === 5000 && v.prod >= 0.1) fuori(`prodotto ${v.prod} col wrapper ancora spento`);
        if (passo === 2 && ms === 1200 && v.max >= 0.1) fuori(`max ${v.max}: onFilm non ha riportato il gruppo nascosto`);
        if (passo === 3 && ms === 4500 && v.min < 0.99) fuori(`min ${v.min} oltre il cue`);
        if (passo === 4 && ms === 2500 && v.max >= 0.1) fuori(`max ${v.max} di nuovo sotto il cue`);
        if (passo === 5 && ms === 2500 && v.bg !== 0) fuori("copertina zona foto con la stella piccola");
        if (passo === 6 && ms === 2500 && v.bg !== 1) fuori("copertina a tutto schermo senza data-bg=\"foto\"");
        if (passo === 7 && ms === 4500 && (v.min < 0.99 || v.ident !== 1 || v.prod < 0.99 || v.bg !== 0)) {
          fuori(`fine runway: min ${v.min}, identità ${v.ident}, prodotto ${v.prod}, data-bg ${v.bg}`);
        }
      }
    }
    appendResults(
      `### 10b pellicola del titolo delle stelle (${label}), ${today()}, ${gitCommit()}, ${dim}\n\n` +
        mdTable(["passo", "p", "ms", "lettere", "min opacità", "max opacità", "identità", "prodotto fino a #main", "data-bg"], righeS),
    );
    await ctx.close();
  }
  if (label === "dopo") {
    appendResults(
      "Nota per Alberto (spec §9.3; corsia sistema §3.6): confrontare le tabelle «10b pellicola del manifesto (prima)» e «(dopo)». " +
        "Prima: caratteri spezzati da SplitText nel client, innesco a «top 55%» della radice, 1,2 s dtOut, stagger 0,03 s, prospettiva 800. " +
        "Dopo: SplitTitle col ruolo title di spec §2.2 (1,2 s dtOut, stagger 0,05 col tetto di D19), lettere piatte (A22), " +
        "cue «top 70%» della radice, quello di `enter` in spec §2.4.",
    );
  }
} finally {
  await browser.close();
  await srv.stop();
}

if (sbagli.length) {
  console.error(`10b-nastro-stelle (${label}): ${sbagli.length} criteri fuori\n- ${sbagli.join("\n- ")}`);
  process.exitCode = 1;
}
