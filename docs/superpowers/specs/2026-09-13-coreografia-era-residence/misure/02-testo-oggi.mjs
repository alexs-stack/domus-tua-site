// Tempi del testo di oggi (TextLines e Reveal), commit 2 del piano 2026-09-13.
//
// La cliente ha chiesto il 4 agosto il replay nei due versi (C22), Alberto il 13
// settembre le uscite speculari (A18); spec 2026-09-13 §9.2 dà i tetti: ingresso
// entro 3,5 s, uscita entro 1,3 s. Tre comandi.
//
// sonda: con lib.mjs (next start sulla 3178 sul build esistente, un browser, un
// contesto alla volta) conta le righe `.tl-line` di ogni titolo TextLines della
// home fuori dai corridoi, a desktop-1440 e mobile-390; prevede l'uscita di oggi,
// 1,05 s + 0,09 s per riga oltre la prima − 0,033 s (TextLines.tsx:100-117: il
// reverse dell'expo.out porta la prima riga sotto il 10 % visibile 0,033 s prima
// della fine); sceglie il titolo del test 2 fra quelli con al più due righe sui
// due progetti (EXIT_TARGET di e2e/text-motion.spec.ts resta se è idoneo) e ne
// misura l'uscita senza la sonda dell'inchiostro dei test: yPercent calcolato di
// ogni riga (m42 della matrice / altezza della riga), dal primo fotogramma col
// bordo alto sotto la linea dell'85 % al primo con tutte le righe a yPercent ≥ 90,
// dopo una rotellata da 0,5 a 0,93, a ScrollTrigger rinfrescati dopo lo split
// (freshTriggers di lib.mjs, decisione di lavoro D38: oggi il sito non rinfresca
// dopo l'idratazione e senza la scossa l'uscita non arriva; la condizione è
// scritta nella sezione). Tre giri per progetto, in
// test-results/02-testo-oggi-sonda.json e in risultati.md.
// Uscita: 0 titolo confermato ed entro 1230 ms; 2 titolo da cambiare (comando
// applica); 1 nessun titolo idoneo (scarto della spec) o uscita oltre 1230 ms.
//
// applica: scrive in e2e/text-motion.spec.ts il titolo scelto dalla sonda.
//
// report <report.json>: legge gli allegati «tempi» del report JSON di
// e2e/text-motion.spec.ts (--repeat-each=3 --workers=1), scrive la tabella in
// risultati.md e confronta l'uscita del test con quella della sonda: stesso
// titolo, mediane a meno di 50 ms per progetto, giro peggiore entro 1230 ms (70
// ms, quattro fotogrammi, sotto il tetto), test verdi. Uscita: 0 o 1.
//
// Uso: node docs/superpowers/specs/2026-09-13-coreografia-era-residence/misure/02-testo-oggi.mjs sonda
//      node docs/superpowers/specs/2026-09-13-coreografia-era-residence/misure/02-testo-oggi.mjs applica
//      node docs/superpowers/specs/2026-09-13-coreografia-era-residence/misure/02-testo-oggi.mjs report <report.json>

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { devices } from "@playwright/test";
import {
  ROOT,
  appendResults,
  freshTriggers,
  gitCommit,
  launch,
  mdTable,
  median,
  motionContext,
  sampleFrames,
  startServer,
  today,
  wheelScale,
} from "./lib.mjs";

const EXIT_LIMIT_MS = 1230;
const MATCH_MS = 50;
const RUNS = 3;
const SONDA = join(ROOT, "test-results", "02-testo-oggi-sonda.json");
const SPEC_FILE = join(ROOT, "e2e", "text-motion.spec.ts");
const PROJECTS = {
  "desktop-1440": { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
  "mobile-390": { ...devices["iPhone 13"] },
};
const NAMES = Object.keys(PROJECTS);
const TEXTLINES_SEL = ":is(h1, h2, h3, h4, p, div, blockquote):has(> .tl-line-mask)";
const TARGET_RE = /const EXIT_TARGET = "([^"]+)";/;

function currentTarget() {
  const m = TARGET_RE.exec(readFileSync(SPEC_FILE, "utf8"));
  if (!m) throw new Error("EXIT_TARGET non trovato in e2e/text-motion.spec.ts");
  return m[1];
}

/** Uscita prevista oggi, in ms, per un titolo di `lines` righe. */
const predictedMs = (lines) => Math.round((1.05 + 0.09 * (lines - 1) - 0.033) * 1000);

/** Nella pagina: bordo alto del titolo in frazioni di innerHeight e yPercent calcolato di ogni riga. */
const linesY = (sel) => {
  const el = document.querySelector(sel);
  return {
    top: el.getBoundingClientRect().top / window.innerHeight,
    y: Array.from(el.querySelectorAll(".tl-line")).map((line) => {
      const t = getComputedStyle(line).transform;
      const m = new DOMMatrixReadOnly(t === "none" ? undefined : t);
      return (m.m42 / line.offsetHeight) * 100;
    }),
  };
};

async function settle(page, quiet = 6) {
  return page.evaluate(
    (q) =>
      new Promise((resolve) => {
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

/** Bordo alto di `sel` a `ratio` × innerHeight con la rotella, come wheelToTop di e2e/coreografia.ts (colpi tarati). */
async function wheelToTop(page, sel, ratio, tol = 0.02) {
  const vp = page.viewportSize();
  const scale = await wheelScale(page);
  await page.mouse.move(12, Math.round(vp.height / 2));
  for (let i = 0; ; i++) {
    const m = await page.evaluate((s) => {
      const r = document.querySelector(s).getBoundingClientRect();
      return {
        top: r.top,
        ih: window.innerHeight,
        sy: window.scrollY,
        max: document.documentElement.scrollHeight - window.innerHeight,
      };
    }, sel);
    const at = m.top / m.ih;
    if (Math.abs(at - ratio) <= tol) return;
    if (i === 8) throw new Error(`wheelToTop ${sel}: bordo alto a ${at.toFixed(3)} × innerHeight invece di ${ratio}`);
    let rest = Math.max(0, Math.min(m.sy + m.top - ratio * m.ih, m.max)) - m.sy;
    while (Math.abs(rest) > 2) {
      const step = Math.sign(rest) * Math.min(Math.abs(rest), 1200);
      await page.mouse.wheel(0, step * scale);
      await page.waitForTimeout(40);
      rest -= step;
    }
    await settle(page);
  }
}

async function openHome(browser, base, descriptor) {
  const ctx = await motionContext(browser, descriptor, { consent: "accepted" });
  const page = await ctx.newPage();
  await page.goto(`${base}/`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.locator("header").first().waitFor({ state: "visible", timeout: 30_000 });
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await page.waitForFunction(() => document.querySelectorAll(".tl-line").length > 0, null, { timeout: 15_000 });
  // Trigger rinfrescati dopo lo split, come `refreshTriggers` nei test 1-2 (D38): altrimenti «top 86%» è stantio.
  await freshTriggers(page);
  return { ctx, page };
}

/** Titoli TextLines della home fuori dai corridoi, con un selettore `#sezione tag` che trova proprio loro. */
async function listTitles(page) {
  return page.evaluate((titleSel) => {
    const main = document.getElementById("main");
    if (!main) return [];
    const max = document.documentElement.scrollHeight - window.innerHeight;
    return Array.from(main.querySelectorAll(titleSel)).flatMap((el) => {
      const section = el.closest("section[id]");
      if (!section) return [];
      const sel = `#${section.id} ${el.tagName.toLowerCase()}`;
      if (document.querySelector(sel) !== el) return [];
      for (let a = el.parentElement; a; a = a.parentElement) {
        const position = getComputedStyle(a).position;
        if (position === "sticky" || position === "fixed") return [];
      }
      const r = el.getBoundingClientRect();
      if (r.height <= 0) return [];
      return [
        {
          sel,
          text: (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 40),
          lines: el.querySelectorAll(".tl-line").length,
          top: Math.round(r.top + window.scrollY),
          ih: window.innerHeight,
          max,
        },
      ];
    });
  }, TEXTLINES_SEL);
}

async function measureExit(browser, base, descriptor, sel) {
  const { ctx, page } = await openHome(browser, base, descriptor);
  try {
    await wheelToTop(page, sel, 0.5);
    await page.waitForFunction(
      (s) => {
        const lines = Array.from(document.querySelector(s).querySelectorAll(".tl-line"));
        return (
          lines.length > 0 &&
          lines.every((line) => {
            const t = getComputedStyle(line).transform;
            const m = new DOMMatrixReadOnly(t === "none" ? undefined : t);
            return Math.abs((m.m42 / line.offsetHeight) * 100) <= 1;
          })
        );
      },
      sel,
      { timeout: 3500, polling: "raf" },
    );
    const ih = page.viewportSize().height;
    const scale = await wheelScale(page);
    // Il campionamento parte prima della rotellata: il primo fotogramma sotto la linea dell'85 % è dentro la serie.
    // Il colpo è tarato (sotto l'emulazione dell'iPhone 13 la pagina riceve deltaY / 3) così la risalita da 0,5 a
    // 0,93 è un movimento solo di Lenis, come sul desktop; la finestra di 4 s copre risalita e uscita.
    const pending = sampleFrames(page, 4000, linesY, sel);
    await page.mouse.wheel(0, -Math.round((0.93 - 0.5) * ih) * scale);
    const samples = await pending;
    const i0 = samples.findIndex((s) => s.v.top >= 0.85);
    if (i0 < 0) return { ms: null, lines: 0, reason: "linea mai passata" };
    const i1 = samples.findIndex((s, i) => i >= i0 && s.v.y.length > 0 && s.v.y.every((y) => y >= 90));
    if (i1 < 0) return { ms: null, lines: samples[i0].v.y.length, reason: "ancora visibile dopo 4 s" };
    return { ms: samples[i1].t - samples[i0].t, lines: samples[i0].v.y.length, reason: "ok" };
  } finally {
    await ctx.close();
  }
}

async function sonda() {
  const specTarget = currentTarget();
  const server = await startServer();
  const browser = await launch();
  const found = {};
  const exit = {};
  let candidates = [];
  let chosen = null;
  try {
    for (const [name, descriptor] of Object.entries(PROJECTS)) {
      const { ctx, page } = await openHome(browser, server.base, descriptor);
      try {
        found[name] = await listTitles(page);
      } finally {
        await ctx.close();
      }
    }
    const sels = [...new Set(NAMES.flatMap((p) => found[p].map((t) => t.sel)))];
    candidates = sels.map((sel) => {
      const by = Object.fromEntries(NAMES.map((p) => [p, found[p].find((t) => t.sel === sel) ?? null]));
      const lines = Object.fromEntries(NAMES.map((p) => [p, by[p] ? by[p].lines : null]));
      const room = NAMES.every(
        (p) => by[p] !== null && by[p].top - 0.93 * by[p].ih >= 0 && by[p].top - 0.5 * by[p].ih <= by[p].max,
      );
      const worstLines = NAMES.every((p) => lines[p] !== null) ? Math.max(...NAMES.map((p) => lines[p])) : null;
      const first = by[NAMES[0]] ?? by[NAMES[1]];
      return {
        sel,
        text: first.text,
        top: first.top,
        lines,
        predictedMs: worstLines === null ? null : predictedMs(worstLines),
        eligible: room && worstLines !== null && worstLines >= 1 && worstLines <= 2,
      };
    });
    // Ordine: righe crescenti (massimo sui due progetti), poi più in fondo alla home.
    const eligible = candidates.filter((c) => c.eligible).sort((a, b) => a.predictedMs - b.predictedMs || b.top - a.top);
    chosen = eligible.some((c) => c.sel === specTarget) ? specTarget : (eligible[0]?.sel ?? null);
    if (chosen) {
      for (const [name, descriptor] of Object.entries(PROJECTS)) {
        exit[name] = [];
        for (let i = 0; i < RUNS; i++) exit[name].push(await measureExit(browser, server.base, descriptor, chosen));
      }
    }
  } finally {
    await browser.close();
    await server.stop();
  }

  const all = Object.values(exit).flat();
  const worst = all.length > 0 && all.every((e) => typeof e.ms === "number") ? Math.max(...all.map((e) => e.ms)) : null;
  let code;
  let decision;
  if (!chosen) {
    code = 1;
    decision =
      "Nessun titolo TextLines della home ha al più due righe a 1440 e a 390 con lo spazio per portare il bordo alto a 0,5 e a 0,93: oggi il tetto di 1,3 s di spec §9.2 non si può provare su TextLines (scarto della spec). Il blocco si ferma e la tabella va al coordinatore; il tetto non si alza.";
  } else if (worst === null || worst > EXIT_LIMIT_MS) {
    code = 1;
    decision = `Uscita di ${chosen} misurata ${worst === null ? "senza fine in almeno un giro" : `a ${worst} ms`}, oltre ${EXIT_LIMIT_MS} ms: il blocco si ferma e i numeri vanno al coordinatore; il tetto di 1,3 s non si alza.`;
  } else if (chosen !== specTarget) {
    code = 2;
    decision = `EXIT_TARGET passa da ${specTarget} a ${chosen}: ${specTarget} non ha al più due righe sui due progetti o lo spazio per la rotella; giro peggiore di ${chosen} ${worst} ms ≤ ${EXIT_LIMIT_MS} ms.`;
  } else {
    code = 0;
    decision = `EXIT_TARGET resta ${chosen}: al più due righe sui due progetti, giro peggiore ${worst} ms ≤ ${EXIT_LIMIT_MS} ms.`;
  }

  mkdirSync(dirname(SONDA), { recursive: true });
  writeFileSync(
    SONDA,
    `${JSON.stringify({ measuredAt: new Date().toISOString(), commit: gitCommit(), specTarget, chosen, candidates, exit }, null, 2)}\n`,
    "utf8",
  );
  appendResults(
    [
      "## 02 · Sonda dell'uscita di oggi (02-testo-oggi.mjs sonda)",
      "",
      `${today()} · commit ${gitCommit()} · desktop-1440 (Desktop Chrome, 1440×900) e mobile-390 (iPhone 13 su chromium, 390×664) · next start sulla 3178 col build della suite, un contesto alla volta, motion attivo, consenso accettato, sipario saltato · ScrollTrigger rinfrescati dall'attrezzatura dopo lo split (D38: cambio di larghezza di 1 px e ritorno; oggi il sito non rinfresca dopo l'idratazione) · uscita: ms dal primo fotogramma col bordo alto sotto 0,85 × innerHeight al primo con tutte le righe a yPercent ≥ 90 (m42 della matrice / altezza della riga), dopo una rotellata da 0,5 a 0,93`,
      "",
      mdTable(
        ["titolo", "testo", "righe 1440", "righe 390", "uscita prevista ms (righe massime)", "idoneo"],
        candidates.map((c) => [
          c.sel,
          c.text,
          c.lines["desktop-1440"] ?? "—",
          c.lines["mobile-390"] ?? "—",
          c.predictedMs ?? "—",
          c.eligible ? "sì" : "no",
        ]),
      ),
      "",
      chosen
        ? mdTable(
            ["progetto", "titolo", "giri ms", "mediana ms", "peggiore ms", "righe"],
            NAMES.map((p) => {
              const ms = exit[p].map((e) => e.ms).filter((x) => typeof x === "number");
              return [
                p,
                chosen,
                exit[p].map((e) => e.ms ?? e.reason).join(" / "),
                ms.length > 0 ? median(ms) : "—",
                ms.length === exit[p].length ? Math.max(...ms) : "senza uscita",
                exit[p][0]?.lines ?? "—",
              ];
            }),
          )
        : "Nessuna uscita misurata.",
      "",
      `Decisione: ${decision}`,
    ].join("\n"),
  );
  console.log(decision);
  return code;
}

function applica() {
  const { chosen } = JSON.parse(readFileSync(SONDA, "utf8"));
  if (!chosen) {
    console.error("la sonda non ha scelto un titolo: e2e/text-motion.spec.ts resta com'è");
    return 1;
  }
  const before = readFileSync(SPEC_FILE, "utf8");
  if (!TARGET_RE.test(before)) {
    console.error("EXIT_TARGET non trovato in e2e/text-motion.spec.ts");
    return 1;
  }
  writeFileSync(SPEC_FILE, before.replace(TARGET_RE, `const EXIT_TARGET = ${JSON.stringify(chosen)};`), "utf8");
  console.log(`e2e/text-motion.spec.ts: const EXIT_TARGET = ${JSON.stringify(chosen)};`);
  return 0;
}

function report(file) {
  const rep = JSON.parse(readFileSync(file, "utf8"));
  let sondaData = null;
  try {
    sondaData = JSON.parse(readFileSync(SONDA, "utf8"));
  } catch {
    sondaData = null;
  }
  const decode = (body) => {
    try {
      return JSON.parse(body);
    } catch {
      return JSON.parse(Buffer.from(body, "base64").toString("utf8"));
    }
  };
  const rows = [];
  const failed = [];
  const walk = (suite) => {
    for (const child of suite.suites ?? []) walk(child);
    for (const spec of suite.specs ?? []) {
      for (const t of spec.tests) {
        for (const r of t.results) {
          if (r.status !== "passed") failed.push(`${t.projectName} · ${spec.title}: ${r.status}`);
          for (const a of r.attachments) {
            if (a.name === "tempi" && a.body) rows.push({ project: t.projectName, ...decode(a.body) });
          }
        }
      }
    }
  };
  for (const s of rep.suites ?? []) walk(s);
  if (rows.length === 0) {
    console.error("nessun allegato «tempi» nel report");
    return 1;
  }

  const groups = new Map();
  for (const r of rows) {
    const k = `${r.kind}|${r.key}|${r.project}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(r);
  }
  const table = [...groups.keys()].sort().map((k) => {
    const list = groups.get(k);
    const [kind, key, project] = k.split("|");
    const inkOnly = kind === "dall-alto" || kind === "rientro-dall-alto";
    const ms = list.map((x) => x.ms).filter((x) => typeof x === "number");
    const detail =
      kind === "uscita"
        ? `foglie ${list[0].leaves}`
        : kind === "ingresso"
          ? `titoli ${list[0].titles}, blocchi ${list[0].blocks}`
          : `inchiostro minimo ${Math.min(...list.map((x) => x.minInk)).toFixed(2)}`;
    const worst = inkOnly ? "—" : ms.length === list.length && ms.length > 0 ? Math.max(...ms) : "senza tempo";
    return [kind, key, project, list.length, inkOnly || ms.length === 0 ? "—" : median(ms), worst, detail];
  });

  const checks = [];
  const exits = rows.filter((r) => r.kind === "uscita");
  const key = exits[0]?.key;
  if (!sondaData) checks.push("manca test-results/02-testo-oggi-sonda.json: prima «02-testo-oggi.mjs sonda»");
  else if (key !== sondaData.chosen) checks.push(`il test misura ${key}, la sonda ${sondaData.chosen}`);
  const compare = NAMES.map((p) => {
    const mine = exits.filter((r) => r.project === p);
    const t = mine.map((r) => r.ms).filter((x) => typeof x === "number");
    const s = (sondaData?.exit?.[p] ?? []).map((e) => e.ms).filter((x) => typeof x === "number");
    if (mine.length === 0 || t.length < mine.length) checks.push(`${p}: almeno un giro del test senza uscita`);
    if (sondaData && s.length === 0) checks.push(`${p}: la sonda non ha uscite`);
    if (t.length > 0 && Math.max(...t) > EXIT_LIMIT_MS) checks.push(`${p}: giro peggiore del test ${Math.max(...t)} ms > ${EXIT_LIMIT_MS} ms`);
    const diff = t.length > 0 && s.length > 0 ? Math.round(Math.abs(median(t) - median(s))) : null;
    if (diff !== null && diff > MATCH_MS) checks.push(`${p}: scarto delle mediane fra test e sonda ${diff} ms > ${MATCH_MS} ms`);
    return [p, t.length > 0 ? median(t) : "—", s.length > 0 ? median(s) : "—", diff ?? "—"];
  });
  const ok = failed.length === 0 && checks.length === 0;
  const decision = ok
    ? `Il test 2 e la sonda misurano la stessa uscita di ${key} (scarto delle mediane ≤ ${MATCH_MS} ms, giro peggiore ≤ ${EXIT_LIMIT_MS} ms) e i test 1-3 sono verdi in tutti i giri.`
    : `Da fermare: ${[...failed.map((f) => `test non passato ${f}`), ...checks].join("; ")}.`;

  appendResults(
    [
      "## 02 · Tempi del testo di oggi (e2e/text-motion.spec.ts su TextLines e Reveal, confronto con la sonda)",
      "",
      `${today()} · commit ${gitCommit()} · desktop-1440 (1440×900) e mobile-390 (iPhone 13 su chromium, 390×664) · build della suite sulla 3177, --workers=1, --repeat-each=3, motion attivo, consenso accettato, sipario saltato · test 1 e 2 a ScrollTrigger rinfrescati dall'attrezzatura dopo lo split (refreshTriggers, D38: cambio di larghezza di 1 px e ritorno; oggi il sito non rinfresca dopo l'idratazione) · ingresso: ms dal fotogramma in cui il bordo alto entra dal basso all'inizio dell'ultimo tratto pieno, peggiore fra titoli e blocchi in vista; uscita: ms dal passaggio della linea dell'85 % all'inchiostro massimo sotto 0,1`,
      "",
      mdTable(["gesto", "titolo o capitolo", "progetto", "giri", "mediana ms", "peggiore ms", "dettaglio"], table),
      "",
      mdTable(["progetto", "uscita del test, mediana ms", "uscita della sonda, mediana ms", "scarto ms"], compare),
      "",
      `Decisione: ${decision}`,
    ].join("\n"),
  );
  console.log(decision);
  return ok ? 0 : 1;
}

const [cmd, arg] = process.argv.slice(2);
let code;
if (cmd === "sonda") code = await sonda();
else if (cmd === "applica") code = applica();
else if (cmd === "report" && arg) code = report(arg);
else {
  console.error("uso: node 02-testo-oggi.mjs sonda | applica | report <report.json>");
  code = 1;
}
process.exit(code);
