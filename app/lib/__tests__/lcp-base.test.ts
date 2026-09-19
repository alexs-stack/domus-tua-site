// LA BASE DELL'LCP DI OGGI, PRIMA DI SPEZZARE I TITOLI.
//
// Alberto ha scelto il 13 settembre «Fedeltà letterale» (A20), l'opzione che
// diceva «rischio: LCP e H1 nascosti su 14 pagine»: il rischio è accettato e si
// ingegnerizza (spec 2026-09-13 §2.5). Il test 6 di e2e/text-motion.spec.ts
// confronta l'LCP col titolo spezzato con la base misurata oggi, con TextLines e
// Reveal, da scripts/probe-lcp-base.mjs: cinque rotte, senza consenso, sipario
// saltato, rete e CPU non frenate, un contesto alla volta, `load` più 4 s,
// mediana di tre giri. Il file ha due forme: `projects` coi descrittori dei
// progetti Playwright, che il test 6 legge con
// readLcpBase().projects[info.project.name][rotta].lcpMs, e le chiavi «1440 /»,
// «390 /»… di measure-lcp.mjs, misurate in contesti nudi a DPR 1 come la tabella
// di §2.5, per il confronto con la spec (nessun test le legge). Qui si controlla
// che il file esista e sia leggibile da quel test; i numeri li giudica il test 6.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "..", "..", "..");
const read = (rel: string) => readFileSync(join(root, rel), "utf8");

const ROUTES = ["/", "/vendi", "/contatti", "/case-vendute", "/valutazione-immobile-tradate"];
const PROJECTS = ["desktop-1440", "mobile-390"];
const WIDTHS = ["1440", "390"];

type Run = { lcpMs: number; tag: string | null; url: string | null; cls: number };
type Route = Run & { runs: Run[]; spreadMs: number };
type Flat = { median: { t: number; tag: string | null; url: string | null }; cls: number[]; runs: number[] };
type Base = {
  schema: number;
  measuredAt: string;
  commit: string;
  machine: { platform: string; cpu: string; cores: number; node: string };
  conditions: {
    consent: string;
    curtain: string;
    network: string;
    cpu: string;
    reducedMotion: string;
    runs: number;
    settleMs: number;
    waitUntil: string;
    workers: number;
    server: string;
    flatViewports: Record<string, { width: number; height: number; deviceScaleFactor: number }>;
  };
  routes: string[];
  projects: Record<string, Record<string, Route>>;
};

const raw = JSON.parse(read("e2e/baseline/lcp-base.json")) as Record<string, unknown>;
const base = raw as unknown as Base;
const flat = (key: string) => raw[key] as Flat | undefined;
const config = read("playwright.site.config.ts");

describe("base dell'LCP (spec 2026-09-13 §2.5)", () => {
  test("schema 1, con data, commit e macchina della misura", () => {
    assert.equal(base.schema, 1);
    assert.ok(!Number.isNaN(Date.parse(base.measuredAt)), `measuredAt non è una data: ${base.measuredAt}`);
    assert.match(base.commit, /^[0-9a-f]{7,}\+?$/);
    assert.ok(base.machine.cores > 0, "machine.cores");
    assert.ok(base.machine.node.startsWith("v"), "machine.node");
  });

  test("le condizioni sono quelle di §2.5, un contesto alla volta", () => {
    const { consent, curtain, network, cpu, reducedMotion, runs, waitUntil, workers, server } = base.conditions;
    assert.deepEqual(
      { consent, curtain, network, cpu, reducedMotion, runs, waitUntil, workers, server },
      {
        consent: "none",
        curtain: "skipped",
        network: "unthrottled",
        cpu: "unthrottled",
        reducedMotion: "no-preference",
        runs: 3,
        waitUntil: "load",
        workers: 1,
        server: "next start",
      },
    );
    assert.ok(base.conditions.settleMs >= 4000, "attesa dopo load sotto i 4 s");
    assert.deepEqual(base.conditions.flatViewports, {
      "1440": { width: 1440, height: 900, deviceScaleFactor: 1 },
      "390": { width: 390, height: 664, deviceScaleFactor: 1 },
    });
  });

  test("le cinque rotte di §2.5 e i due progetti di playwright.site.config.ts", () => {
    assert.deepEqual(base.routes, ROUTES);
    assert.deepEqual(Object.keys(base.projects).sort(), [...PROJECTS].sort());
    for (const p of PROJECTS) {
      assert.ok(config.includes(`name: "${p}"`), `playwright.site.config.ts non ha il progetto ${p}`);
    }
  });

  test("ogni rotta ha la mediana di tre giri", () => {
    for (const p of PROJECTS) {
      for (const r of ROUTES) {
        const m = base.projects[p]?.[r];
        assert.ok(m, `manca ${p} ${r}`);
        assert.equal(m.runs.length, 3, `${p} ${r}: ${m.runs.length} giri`);
        const sorted = m.runs.map((x) => x.lcpMs).sort((a, b) => a - b);
        assert.equal(m.lcpMs, sorted[1], `${p} ${r}: lcpMs non è la mediana`);
        assert.equal(m.spreadMs, sorted[2] - sorted[0], `${p} ${r}: spreadMs`);
        assert.equal(m.cls, Math.max(...m.runs.map((x) => x.cls)), `${p} ${r}: cls non è il massimo dei giri`);
        for (const run of m.runs) {
          assert.ok(Number.isInteger(run.lcpMs) && run.lcpMs > 0, `${p} ${r}: lcpMs ${run.lcpMs}`);
          assert.ok(run.cls >= 0, `${p} ${r}: cls ${run.cls}`);
        }
        assert.ok(typeof m.tag === "string" && m.tag.length > 0, `${p} ${r}: nessun elemento LCP`);
      }
    }
  });

  test("le chiavi di measure-lcp.mjs per il confronto con la tabella di §2.5, da «1440 /» a «390 /valutazione-immobile-tradate»", () => {
    for (const w of WIDTHS) {
      for (const r of ROUTES) {
        const key = `${w} ${r}`;
        const f = flat(key);
        assert.ok(f, `manca «${key}»`);
        assert.equal(f.runs.length, 3, `${key}: ${f.runs.length} giri`);
        assert.equal(f.cls.length, 3, `${key}: ${f.cls.length} valori di CLS`);
        const sorted = [...f.runs].sort((a, b) => a - b);
        assert.equal(f.median.t, sorted[1], `${key}: median.t non è la mediana dei giri`);
        for (const t of f.runs) assert.ok(Number.isInteger(t) && t > 0, `${key}: giro di ${t} ms`);
        for (const c of f.cls) assert.ok(c >= 0, `${key}: cls ${c}`);
        assert.ok(typeof f.median.tag === "string" && f.median.tag.length > 0, `${key}: nessun elemento LCP`);
      }
    }
  });
});
