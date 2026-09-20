// LA LASTRA: la geometria pura dell'entrata alla Lusion (A35 di Alberto, 19-20 set. 2026;
// qualita/a35/direttive-video-entrata.md). app/lib/motion/lastra.ts è puro (niente DOM): le
// costanti, il progresso del vertice centrale `vu`, il vertice piegato `puntoK` (Lusion alla
// lettera più il fattore di piega k), l'ingombro del foglio, la miniatura e la scatola piatta
// della via «scala». Le scatole (A42): `da` è lo slot 16:9 a destra del titolo nella testa (largo
// come la metà, min(42vw, 640px): 604,8×340,2 a (720; 164) a 1440×900), `a` è lo schermo intero
// (0; 0; 1440; 900); tutte e due si leggono dal DOM in viewport (`rettDi`). Il DOM (useLastra.ts)
// si legge come sorgente: cancello del renderer, texture dal nodo vero, nessun canvas in JSX,
// nessuna prospettiva (A22), nessun pin.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ANTICIPO,
  CORSA_SVH,
  DPR_MAX,
  FS,
  IDLE_MS,
  PIAN_SVH,
  PIEGA_S,
  RENDERER_SOFTWARE,
  SEG,
  SONDA_DRAW_MS,
  VS,
  ingombro,
  peso,
  progresso,
  puntoK,
  rettDi,
  scatolaPiatta,
  statoDi,
  vu,
  type Rett,
} from "../motion/lastra";

const ROOT = process.cwd();
const soloCodice = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
const leggi = (p: string) => soloCodice(readFileSync(join(ROOT, p), "utf8"));

/** A 1440×900: lo schermo intero e lo slot a destra del titolo (min(42vw, 640px) a filo del margine 8vw). */
const A: Rett = { x: 0, y: 0, w: 1440, h: 900 };
const DA: Rett = { x: 720, y: 164, w: 604.8, h: 340.2 };
const vicino = (a: number, b: number, tol: number, msg: string) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);

describe("le costanti delle direttive", () => {
  test("piano 32×32, DPR ≤ 1,5, corsa 100svh con anticipo 0,65 (65svh), pianerottolo 20svh", () => {
    assert.equal(SEG, 32);
    assert.equal(DPR_MAX, 1.5);
    assert.equal(CORSA_SVH, 100);
    assert.equal(ANTICIPO, 0.65);
    vicino(CORSA_SVH * ANTICIPO, 65, 1e-9, "anticipo in svh");
    assert.equal(PIAN_SVH, 20);
  });
  test("la sosta: 250 ms di fermo, distensione in 0,6 s; sonda del renderer a 1,5 ms", () => {
    assert.equal(IDLE_MS, 250);
    assert.equal(PIEGA_S, 0.6);
    assert.equal(SONDA_DRAW_MS, 1.5);
    for (const nome of ["Google SwiftShader", "llvmpipe (LLVM 15.0.7, 256 bits)", "Microsoft Basic Render Driver", "Software Rasterizer"]) {
      assert.ok(RENDERER_SOFTWARE.test(nome), `${nome} non è riconosciuto come software`);
    }
    assert.ok(!RENDERER_SOFTWARE.test("ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)"));
  });
});

describe("vu, peso e progresso", () => {
  test("vu: 0 a e 0, 1 a e 1, monotona, mezzo a metà", () => {
    assert.equal(vu(0), 0);
    assert.equal(vu(1), 1);
    vicino(vu(0.5), 0.5, 1e-9, "vu(0,5)");
    let prev = -1;
    for (let e = 0; e <= 1.0001; e += 0.01) {
      const v = vu(e);
      assert.ok(v >= prev - 1e-12, `vu non monotona a ${e}`);
      prev = v;
    }
  });
  test("il peso di Lusion ritarda: alto-destro (x 1, yd 0) peso 0 e parte per primo, basso-sinistro peso 1 e parte per ultimo", () => {
    vicino(peso(1, 0), 0, 1e-9, "alto-destro");
    vicino(peso(0, 1), 1, 1e-9, "basso-sinistro");
    vicino(peso(0.5, 0.5), 1 - (Math.pow(0.25, 0.75) + Math.pow(0.5, 1.5)) / 2, 1e-9, "centro");
    assert.ok(progresso(0.25, 1, 0) > progresso(0.25, 0, 1), "a e 0,25 l'angolo alto-destro è più avanti");
    assert.equal(progresso(0.25, 0, 1), 0, "il basso-sinistro non è ancora partito a e 0,25 (parte a 0,3)");
    assert.equal(progresso(0, 0.5, 0.5), 0);
    assert.equal(progresso(1, 0.5, 0.5), 1);
  });
});

describe("la geometria del foglio", () => {
  test("rettDi: la scatola di getBoundingClientRect in {x, y, w, h}", () => {
    assert.deepEqual(rettDi({ left: 720, top: 164, width: 604.8, height: 340.2 }), DA);
  });
  test("puntoK a k 0 è la scatola piatta: i quattro angoli coincidono a ogni e", () => {
    for (const e of [0, 0.25, 0.5, 0.75, 1]) {
      const b = scatolaPiatta(e, DA, A);
      for (const [x, yd] of [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1],
      ] as const) {
        const p = puntoK(e, x, yd, DA, A, 0);
        vicino(p.x, b.x + x * b.w, 1e-6, `e ${e} angolo (${x},${yd}) x`);
        vicino(p.y, b.y + yd * b.h, 1e-6, `e ${e} angolo (${x},${yd}) y`);
      }
    }
  });
  test("scatolaPiatta: la miniatura a e 0, la banda a e 1", () => {
    assert.deepEqual(scatolaPiatta(0, DA, A), DA);
    assert.deepEqual(scatolaPiatta(1, DA, A), A);
  });
  test("a e 0 e a e 1 il foglio è piatto anche a k 1: ingombro = miniatura, poi = banda", () => {
    const i0 = ingombro(0, DA, A, 1);
    const i1 = ingombro(1, DA, A, 1);
    for (const lato of ["x", "y", "w", "h"] as const) {
      vicino(i0[lato], DA[lato], 1e-6, `e 0 ${lato}`);
      vicino(i1[lato], A[lato], 1e-6, `e 1 ${lato}`);
    }
  });
  test("a metà piega il foglio sborda dalla scatola piatta; verso lo schermo intero lo sbordo sta sotto il 5 % del viewport", () => {
    const b = scatolaPiatta(0.5, DA, A);
    const i = ingombro(0.5, DA, A, 1);
    assert.ok(i.w > b.w && i.h > b.h, "a k 1 il foglio è più largo della scatola piatta");
    let fuori = 0;
    for (let e = 0; e <= 1; e += 0.005) {
      const k = ingombro(e, DA, A, 1);
      fuori = Math.max(fuori, -k.y, -k.x, k.x + k.w - A.w, k.y + k.h - A.h);
    }
    // Misurato a 1440×900: 73,6 px (l'onda del 10 % sul bordo destro a k 1); il canvas e' il viewport e lo ritaglia.
    assert.ok(fuori < 0.06 * A.w, `sbordo dal viewport ${fuori.toFixed(1)} px ≥ 86`);
  });
  test("statoDi: chiusa a e ≤ 0, piega fra, distesa a e ≥ 1", () => {
    assert.equal(statoDi(0), "chiusa");
    assert.equal(statoDi(-0.1), "chiusa");
    assert.equal(statoDi(0.5), "piega");
    assert.equal(statoDi(1), "distesa");
    assert.equal(statoDi(1.2), "distesa");
  });
});

describe("gli shader e il DOM", () => {
  test("il vertex è in piano (z 0, nessuna prospettiva: A22) e porta u_k; il fragment fa object-cover senza tinta", () => {
    assert.match(VS, /uniform float u_k/);
    assert.match(VS, /gl_Position=vec4\([^;]*,0\.,1\.\)/);
    assert.doesNotMatch(VS, /perspective|u_proj|matrix3d/i);
    assert.match(FS, /texture\(u_tex,uv\)/);
    assert.doesNotMatch(FS, /mix\(|\* ?vec[34]\(|smoothstep/);
  });
  test("useLastra: canvas creato imperativamente, cancello del renderer a whenStill, texture dal nodo vero, contesto perso → scala", () => {
    const h = leggi("app/components/motion/useLastra.ts");
    assert.match(h, /document\.createElement\("canvas"\)/);
    assert.match(h, /whenStill\(arma\)/);
    assert.match(h, /RENDERER_SOFTWARE\.test\(/);
    assert.match(h, /readPixels\(0, 0, 1, 1/);
    assert.match(h, /media > SONDA_DRAW_MS/);
    assert.match(h, /webglcontextlost/);
    assert.match(h, /createImageBitmap\(poster\)/);
    assert.doesNotMatch(h, /new Image\(/);
    assert.match(h, /window\.matchMedia\(MQ\.corridor\)/);
    assert.doesNotMatch(h, /\bpin\s*:/);
    assert.doesNotMatch(h, /perspective|matrix3d/);
    // Le scatole si leggono in viewport da slot e schermo, mai trasformati (A42); mai dai nodi che ricevono transform.
    assert.match(h, /rettDi\(slot\.getBoundingClientRect\(\)\)/);
    assert.match(h, /rettDi\(screen\.getBoundingClientRect\(\)\)/);
    assert.doesNotMatch(h, /(clip|marker|canvas|poster|video)\.getBoundingClientRect/);
    assert.doesNotMatch(h, /offsetTop|offsetLeft/);
  });
  test("Congedo non rende il canvas in JSX e non ha lettere sul foglio", () => {
    const c = leggi("app/components/Congedo.tsx");
    assert.doesNotMatch(c, /<canvas/);
    assert.match(c, /useLastra\(/);
  });
  test("globals.css: niente will-change e niente prospettiva nel blocco della cartolina", () => {
    const css = readFileSync(join(ROOT, "app/globals.css"), "utf8");
    const i = css.indexOf("La cartolina del Congedo e l'entrata alla Lusion");
    const j = css.indexOf("«La testa di era»", i);
    assert.ok(i > 0 && j > i, "blocco della cartolina non trovato");
    const blocco = css.slice(i, j);
    assert.doesNotMatch(blocco, /will-change|perspective|matrix3d|filter:|box-shadow|border-radius/);
  });
});
