// PERCORSI E METODO — spec 2026-09-13 §3.8 e §3.9 (A20 di Alberto: un gesto
// per capitolo, valori da chapters.ts).
// 1. dtSosta è registrata una volta, con la curva della spec, e sosta davvero
//    al centro: gli e2e di Paths leggono f(0,1), f(0,5), f(0,9) da qui.
// 2. Paths e Method non usano più la Parallax (D23) e leggono le firme dal
//    registro; la tendina passa solo da ClipMedia e da clip.ts (C01).
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { chapters } from "../motion/chapters";

const APP = join(process.cwd(), "app");
const leggi = (...p: string[]) => readFileSync(join(APP, ...p), "utf8");
const richiedi = createRequire(join(process.cwd(), "package.json"));
const { gsap } = richiedi("gsap/dist/gsap.js");
const { CustomEase } = richiedi("gsap/dist/CustomEase.js");
gsap.registerPlugin(CustomEase);

function soloCodice(testo: string): string {
  return testo.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

const SOSTA = "M0,0 C0.25,0.45 0.3,0.5 0.5,0.5 C0.7,0.5 0.75,0.55 1,1";

describe("dtSosta", () => {
  const gsapTs = leggi("lib", "motion", "gsap.ts");

  test("registrata una volta, una riga, con la curva della spec", () => {
    const righe = gsapTs.match(/CustomEase\.create\("dtSosta", "([^"]+)"\);/g) ?? [];
    assert.equal(righe.length, 1, "dtSosta deve comparire una volta in gsap.ts");
    assert.equal(/"dtSosta", "([^"]+)"/.exec(righe[0])![1], SOSTA);
  });

  test("sosta al centro, monotona, con i valori che gli e2e usano", () => {
    const def = /CustomEase\.create\("dtSosta", "([^"]+)"\);/.exec(gsapTs)![1];
    CustomEase.create("dtSosta", def);
    const f = gsap.parseEase("dtSosta") as (x: number) => number;
    assert.ok(Math.abs(f(0.5) - 0.5) <= 0.001, `f(0.5) = ${f(0.5)}`);
    for (let x = 0.4; x <= 0.6001; x += 0.01) {
      assert.ok(Math.abs(f(x) - 0.5) <= 0.01, `a ${x.toFixed(2)} la colonna non sosta: ${f(x)}`);
    }
    assert.ok(f(0.1) >= 0.171 && f(0.1) <= 0.181, `f(0.1) = ${f(0.1)}`);
    assert.ok(f(0.9) >= 0.819 && f(0.9) <= 0.829, `f(0.9) = ${f(0.9)}`);
    let prima = -1;
    for (let i = 0; i <= 1000; i++) {
      const v = f(i / 1000);
      assert.ok(v >= prima - 1e-9, `non monotona a ${i / 1000}`);
      prima = v;
    }
  });
});

describe("le firme dei capitoli 7 e 8 nel registro", () => {
  test("paths: dtSosta, scrub 0,5, top 125% → bottom -25%", () => {
    const s = chapters.paths.signature;
    assert.equal(s.ease, "dtSosta");
    assert.deepEqual(s.time, { scrub: 0.5 });
    assert.ok("st" in s.trigger);
    assert.deepEqual(s.trigger.st, ["top 125%", "bottom -25%"]);
  });

  test("method: power4.out 2,4 s dopo 0,8, IO a -10 %, uscita power4.in", () => {
    const m = chapters.method;
    assert.equal(m.signature.ease, "power4.out");
    assert.ok("dur" in m.signature.time);
    assert.equal(m.signature.time.dur, 2.4);
    assert.equal(m.signature.time.delay, 0.8);
    assert.ok("io" in m.signature.trigger);
    assert.equal(m.signature.trigger.io.rootMargin, "0px 0px -10% 0px");
    assert.equal(m.secondary?.[0]?.ease, "power4.in");
  });
});

describe("Paths e Method senza Parallax, coi valori dal registro", () => {
  test("Paths: righe e colonne marcate, firma letta da chapters.paths", () => {
    const src = soloCodice(leggi("components", "Paths.tsx"));
    assert.doesNotMatch(src, /Parallax/);
    assert.match(src, /data-paths-row/);
    // Gli attributi JSX, non il selettore "[data-paths-col]" del gesto.
    assert.equal((src.match(/<div data-paths-col\b/g) ?? []).length, 2);
    assert.match(src, /chapters\.paths/);
    assert.doesNotMatch(src, /"dtSosta"|top 125%|bottom -25%/, "i valori stanno in chapters.ts");
    assert.match(src, /revertOnUpdate: true/);
  });

  test("Method: tendina a verso alternato con ClipMedia", () => {
    const src = soloCodice(leggi("components", "Method.tsx"));
    assert.doesNotMatch(src, /Parallax/);
    assert.match(src, /<ClipMedia\s+chapter="method"\s+from=\{i % 2 \? "right" : "left"\}/);
  });

  test("ClipMedia: forme da clip.ts, valori da chapters.ts, nessun inset scritto a mano", () => {
    const src = soloCodice(leggi("components", "motion", "ClipMedia.tsx"));
    assert.match(src, /chapters\[chapter\]/);
    assert.match(src, /clipClosed\(/);
    assert.match(src, /clipOpen/);
    assert.doesNotMatch(src, /inset\(/);
    assert.doesNotMatch(src, /Parallax|scale:/, "la tendina non aggiunge scala (§3.1: senza scala)");
  });
});
