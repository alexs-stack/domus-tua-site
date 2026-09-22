// Il contratto dei corridoi sticky: A19 di Alberto («Sticky dove serve»), D22
// (una soglia, layout in CSS prima del paint). Spec §2.7 e §4.
//
// Oggi app/components/motion/useCorridor.ts e il CSS dei corridoi in
// app/globals.css reggono due cose:
// - i corridoi del hook: la cartolina (l'hero, la finestra e page-dive sono
//   morti: A49, A57, A41);
// - il layout delle stelle prima del paint.
// Il test legge i sorgenti coi commenti tolti (schema di logo-colore.test.ts)
// e pretende:
// - nel CSS, sotto la media query dei corridoi e :root[data-hero-intro]:
//   - le tre regole di spec §2.7;
//   - nessun overflow hidden, auto o scroll;
//   - --corridor-run per id;
//   - runway e schermo delle stelle;
// - nel hook:
//   - lo scrub dal registro e invalidateOnRefresh;
//   - data-on dopo la timeline, poi il refresh;
//   - refreshInit e refresh tolti al cleanup;
//   - la rete di fuoco sull'host, solo con :focus-visible.
// I commit 13, 16 e 17 aggiungono blocchi con la stessa media query: il test
// li legge tutti.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..", "..", "..");
const leggi = (rel: string) => {
  try {
    return readFileSync(join(ROOT, rel), "utf8");
  } catch {
    return "";
  }
};
function soloCodice(testo: string): string {
  return testo.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}
/* In CSS i commenti sono solo quelli a blocco: `//` può stare in un url() (D22, schema di logo-colore.test.ts). */
const cssPulito = () => leggi("app/globals.css").replace(/\/\*[\s\S]*?\*\//g, " ");
const hook = () => soloCodice(leggi("app/components/motion/useCorridor.ts"));

const MQ_CORRIDOIO = "@media (min-width: 1024px) and (min-height: 640px) and (prefers-reduced-motion: no-preference)";
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** I corpi di tutti i blocchi @media dei corridoi. */
function blocchiCorridoio(css: string): string[] {
  const out: string[] = [];
  let from = 0;
  for (let at = css.indexOf(MQ_CORRIDOIO, from); at !== -1; at = css.indexOf(MQ_CORRIDOIO, from)) {
    const open = css.indexOf("{", at);
    let depth = 0;
    let end = css.length;
    for (let i = open; i < css.length; i++) {
      if (css[i] === "{") depth++;
      else if (css[i] === "}" && --depth === 0) {
        end = i;
        break;
      }
    }
    out.push(css.slice(open + 1, end));
    from = end + 1;
  }
  return out;
}

/** Le dichiarazioni della regola con quel selettore intero, normalizzate in "prop: valore"; null se manca. */
function regola(css: string, selettore: string): string[] | null {
  const m = new RegExp(String.raw`(?:^|[;{}])\s*${escapeRe(selettore)}\s*\{([^}]*)\}`).exec(css);
  if (!m) return null;
  return m[1]
    .split(";")
    .map((d) => d.trim().replace(/\s*:\s*/, ": ").replace(/\s+/g, " "))
    .filter(Boolean);
}

describe("CSS dei corridoi prima del paint (spec §2.7 e §4, D22)", () => {
  test("un blocco dei corridoi porta le tre regole della spec", () => {
    const blocchi = blocchiCorridoio(cssPulito());
    assert.ok(blocchi.length > 0, "nessun blocco @media dei corridoi in globals.css");
    const trovato = blocchi.some((b) => {
      const screen = regola(b, ":root[data-hero-intro] [data-corridor] > [data-corridor-screen]");
      const top = regola(b, ':root[data-hero-intro] [data-corridor][data-stick="top"] > [data-corridor-screen]');
      const run = regola(b, ":root[data-hero-intro] [data-corridor] > [data-corridor-run]");
      return (
        !!screen &&
        screen.includes("position: sticky") &&
        screen.includes("top: var(--corridor-stick, 0px)") &&
        !!top &&
        top.includes("height: 100svh") &&
        top.includes("overflow: clip") &&
        !!run &&
        run.includes("display: block") &&
        run.includes("height: var(--corridor-run)")
      );
    });
    assert.ok(trovato, "manca una delle tre regole o una delle loro dichiarazioni");
  });

  test("nessun blocco dei corridoi scrive overflow hidden, auto o scroll", () => {
    const blocchi = blocchiCorridoio(cssPulito());
    assert.ok(blocchi.length > 0, "nessun blocco @media dei corridoi in globals.css");
    const colpe = blocchi.flatMap((b) => [...b.matchAll(/overflow(?:-[xy])?\s*:\s*(?:hidden|auto|scroll)\b/g)].map((m) => m[0]));
    assert.deepEqual(colpe, []);
  });

  test("--corridor-run per id: cartolina 135svh (A35/A42: 100 − 65 + 20 + 80); nessun corridoio di pagina (A41) né dell'hero (A49)", () => {
    const css = cssPulito();
    // A49 (22 set. 2026): il tuffo dell'hero (200svh) è morto: l'hero è la foto alta in flusso.
    for (const morto of ["page-dive", "soglia", "ingresso", "hero"]) assert.equal(regola(css, `[data-corridor="${morto}"]`), null, `${morto}: corridoio morto con A38/A41/A49`);
    for (const [id, run] of [["cartolina", "135svh"]] as const) {
      const r = regola(css, `[data-corridor="${id}"]`);
      assert.ok(r?.includes(`--corridor-run: ${run}`), `${id}: manca --corridor-run: ${run}`);
    }
  });

  test("le stelle hanno runway e schermo sticky prima del paint (spec §4)", () => {
    const ok = blocchiCorridoio(cssPulito()).some((b) => {
      const runway = regola(b, ":root[data-hero-intro] .dt-starrev .dt-starrev_runway");
      const screen = regola(b, ":root[data-hero-intro] .dt-starrev .dt-starrev_screen");
      return (
        !!runway &&
        runway.includes("height: 360svh") &&
        !!screen &&
        ["position: sticky", "top: 0", "height: 100svh", "overflow: clip"].every((d) => screen.includes(d))
      );
    });
    assert.ok(ok, "mancano runway o schermo delle stelle nel blocco dei corridoi");
  });
});

describe("useCorridor.ts (spec §2.7, A19)", () => {
  test("timeline con lo scrub del registro e invalidateOnRefresh", () => {
    const h = hook();
    assert.match(h, /scrub:\s*scrubOf\(o\.id\)/);
    assert.match(h, /invalidateOnRefresh:\s*true/);
    assert.match(h, /defaults:\s*\{\s*ease:\s*"none",\s*immediateRender:\s*false\s*\}/);
  });

  test("data-on dopo la timeline, poi il refresh", () => {
    const h = hook();
    const build = h.indexOf("o.build(");
    const on = h.indexOf('setAttribute("data-on"');
    assert.ok(build > -1 && on > build, "data-on va messo dopo o.build(");
    assert.ok(h.indexOf("requestRefresh()", on) > on, "requestRefresh() va chiamato dopo data-on");
  });

  test("refreshInit e refresh ascoltati e tolti al cleanup", () => {
    const h = hook();
    for (const ev of ["refreshInit", "refresh"]) {
      assert.match(h, new RegExp(String.raw`ScrollTrigger\.addEventListener\("${ev}"`), `manca addEventListener("${ev}"`);
      assert.match(h, new RegExp(String.raw`ScrollTrigger\.removeEventListener\("${ev}"`), `manca removeEventListener("${ev}"`);
    }
  });

  test("rete di fuoco sull'host, solo con :focus-visible (spec §3.10 e §3.18)", () => {
    const h = hook();
    assert.match(h, /root\.addEventListener\("focusin",/);
    assert.match(h, /root\.removeEventListener\("focusin",/);
    assert.doesNotMatch(h, /screen\.addEventListener\("focusin"/);
    assert.match(h, /matches\(":focus-visible"\)/);
  });
});
