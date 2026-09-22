// Ritagli a spigolo vivo: C01 della cliente (niente curve, niente card).
//
// Oggi app/lib/motion/clip.ts dà le quattro forme dei gesti a clip:
// - tendina di Method, righe del D.O.C., acqua di Costi chiari;
// - cornice della cartolina;
// - parallelogramma di Voci.
// Questo test pretende i valori esatti, i quattro numeri in percentuale e
// nessun clip curvo scritto nel codice dell'app né in globals.css: la chiave
// clipPath, l'assegnazione `.clipPath =`, `setProperty("clip-path", …)` e la
// proprietà CSS. Oggi in globals.css ci sono solo `inset(…)` e
// `var(--dt-star)`, un poligono.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { assertStraight, clipClosed, clipFrame, clipOpen, clipSlant } from "../motion/clip";

const ROOT = join(__dirname, "..", "..", "..");
function soloCodice(testo: string): string {
  return testo.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}
function sorgenti(dir: string, out: string[] = []): string[] {
  for (const nome of readdirSync(dir)) {
    if (nome === "node_modules" || nome === "__tests__") continue;
    const p = join(dir, nome);
    if (statSync(p).isDirectory()) sorgenti(p, out);
    else if (/\.(tsx|ts)$/.test(nome)) out.push(p);
  }
  return out;
}

const NUM = String.raw`-?\d+(?:\.\d+)?%`;
const INSET4 = new RegExp(String.raw`^inset\(${NUM} ${NUM} ${NUM} ${NUM}\)$`);
const POLY4 = new RegExp(String.raw`^polygon\(${NUM} ${NUM}, ${NUM} ${NUM}, ${NUM} ${NUM}, ${NUM} ${NUM}\)$`);

describe("clip.ts: forme a spigolo vivo (C01)", () => {
  test("aperto e chiuso dai quattro lati", () => {
    assert.equal(clipOpen, "inset(0% 0% 0% 0%)");
    assert.equal(clipClosed("left"), "inset(0% 100% 0% 0%)");
    assert.equal(clipClosed("right"), "inset(0% 0% 0% 100%)");
    assert.equal(clipClosed("top"), "inset(0% 0% 100% 0%)");
    assert.equal(clipClosed("bottom"), "inset(100% 0% 0% 0%)");
  });

  test("la cornice della cartolina (spec §3.18, D29)", () => {
    assert.equal(clipFrame(8, 22), "inset(8% 22% 8% 22%)");
    assert.equal(clipFrame(4, 14), "inset(4% 14% 4% 14%)");
    assert.equal(clipFrame(4, 10), "inset(4% 10% 4% 10%)");
    assert.equal(clipFrame(0.25, 7.5), "inset(0.25% 7.5% 0.25% 7.5%)");
    assert.throws(() => clipFrame(51, 0), /0-50/);
    assert.throws(() => clipFrame(0, -1), /0-50/);
  });

  test("il parallelogramma di Voci (CAT §4, spec §3.7)", () => {
    assert.equal(clipSlant(0), "polygon(100% 0%, 100% 0%, 101% 100%, 125% 100%)");
    assert.equal(clipSlant(1), "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)");
    assert.equal(clipSlant(0.5), "polygon(50% 0%, 100% 0%, 100.5% 100%, 62.5% 100%)");
    assert.equal(clipSlant(-1), clipSlant(0));
    assert.equal(clipSlant(2), clipSlant(1));
  });

  test("sempre quattro valori in percentuale, così GSAP interpola numero per numero", () => {
    for (const v of [clipOpen, clipClosed("left"), clipClosed("right"), clipClosed("top"), clipClosed("bottom"), clipFrame(8, 22)]) {
      assert.match(v, INSET4);
    }
    for (const p of [0, 0.3, 0.77, 1]) assert.match(clipSlant(p), POLY4);
  });

  test("assertStraight rifiuta le forme curve e accetta quelle di clip.ts", () => {
    for (const curva of ["inset(0% round 4px)", "circle(50%)", "ellipse(40% 50%)", "path('M0 0')", "url(#maschera)"]) {
      assert.throws(() => assertStraight(curva), /C01/);
    }
    for (const dritta of [clipOpen, clipClosed("bottom"), clipFrame(8, 22), clipSlant(0.4), "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)"]) {
      assert.doesNotThrow(() => assertStraight(dritta));
    }
  });

  test("nel codice dell'app e in globals.css nessun clip curvo (lane-sistema §7.1)", () => {
    const errori: string[] = [];
    const prova = (dove: string, valore: string) => {
      try {
        assertStraight(valore);
      } catch {
        errori.push(`${dove}: ${valore}`);
      }
    };
    // Nei tsx (C01, lane-sistema §7.1): la chiave degli oggetti, l'assegnazione su style e setProperty.
    const TSX = [
      /clip(?:Path|-path)\s*:\s*["'`]([^"'`]*)["'`]/g,
      /\.clipPath\s*=\s*["'`]([^"'`]*)["'`]/g,
      /setProperty\(\s*["'`]clip-path["'`]\s*,\s*["'`]([^"'`]*)["'`]/g,
    ];
    for (const p of sorgenti(join(ROOT, "app"))) {
      const code = soloCodice(readFileSync(p, "utf8"));
      const rel = relative(ROOT, p).split(sep).join("/");
      for (const re of TSX) for (const m of code.matchAll(re)) prova(rel, m[1]);
    }
    // In CSS (C01) i commenti sono solo /* */: `//` può stare in un url().
    const css = readFileSync(join(ROOT, "app", "globals.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, " ");
    for (const m of css.matchAll(/clip-path\s*:\s*([^;}]+)[;}]/g)) prova("app/globals.css", m[1].trim());
    assert.deepEqual(errori, []);
  });
});
