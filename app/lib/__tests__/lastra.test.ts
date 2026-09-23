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
  CAMPIONI_SONDA,
  CORSA_SVH,
  DPR_MAX,
  DRAW_SONDA,
  ENTRATA_ATTR,
  ENTRATA_TETTO_MS,
  FS,
  IDLE_MS,
  PIAN_SVH,
  PIEGA_S,
  PX_SONDA,
  RENDERER_SOFTWARE,
  SEG,
  SONDA_DRAW_MS,
  SONDA_PASSO_MS,
  SONDA_PROVE,
  SONDA_TETTO,
  SONDA_TORBIDO_MS,
  VS,
  costoDraw,
  entrataInCorso,
  giro,
  giudizioSonda,
  sogliaSonda,
  sogliaTorbido,
  ingombro,
  peso,
  progresso,
  puntoK,
  rettDi,
  scatolaPiatta,
  scatoleSonda,
  statoDi,
  vu,
  type Giro,
  type Rett,
} from "../motion/lastra";
import { GOMMA_REVEAL_MS, GOMMA_TEMPI } from "../motion/intro-constants";
import { DISCESA, ENTRATA } from "../motion/hero";

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
    for (const nome of [
      "Google SwiftShader",
      "ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)",
      "llvmpipe (LLVM 15.0.7, 256 bits)",
      "softpipe",
      "Microsoft Basic Render Driver",
      // WARP forzato in Firefox (23 set.): la sonda lo passa (0,25-0,5 ms), lo ferma solo il nome.
      "ANGLE (Microsoft, Microsoft Basic Render Driver Direct3D11 vs_5_0 ps_5_0), or similar",
      "Software Rasterizer",
      "Apple Software Renderer",
    ]) {
      assert.ok(RENDERER_SOFTWARE.test(nome), `${nome} non è riconosciuto come software`);
    }
    assert.ok(!RENDERER_SOFTWARE.test("ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)"));
    // Il Surface Pro 11 (23 set.): il nome pieno di Chromium e quello ripulito di Firefox.
    assert.ok(!RENDERER_SOFTWARE.test("ANGLE (Qualcomm, Qualcomm(R) Adreno(TM) X1-85 GPU (0x36334330) Direct3D11 vs_5_0 ps_5_0, D3D11)"));
    assert.ok(!RENDERER_SOFTWARE.test("ANGLE (Qualcomm, Adreno (TM) X1-45 Direct3D11 vs_5_0 ps_5_0), or similar"));
    // resistFingerprinting: il nome mascherato passa, e decide la sonda.
    assert.ok(!RENDERER_SOFTWARE.test("Mozilla"));
  });
});

// La sonda del renderer al netto della lettura sincrona. I campioni sono misure vere del 23 set. a
// 1440×828, tre coppie (vuoto: clear + readPixels; pieno: clear + 4 draw + readPixels) sulle scatole
// della sonda. Sul Surface Pro 11 la sonda di prima (media dei draw 2-4, lettura compresa) dava
// 2-3 ms in Firefox dieci volte su dieci e mandava in scala una GPU che disegna la piega a 60 fps.
describe("la sonda del renderer", () => {
  test("quattro draw per campione pieno, tre coppie", () => {
    assert.equal(DRAW_SONDA, 4);
    assert.equal(CAMPIONI_SONDA, 3);
  });
  test("Surface Pro 11 (Adreno X1): passa in Firefox, col millisecondo intero e il canvas 2160×1242 di DPR 2", () => {
    const c = costoDraw([3, 2, 2], [4, 4, 6], DRAW_SONDA);
    vicino(c, 0.5, 1e-9, "costo di un draw");
    assert.ok(c <= SONDA_DRAW_MS);
    // Il campione peggiore della stessa corsa: tutto a 2 ms di lettura e 7 di pieno.
    assert.ok(costoDraw([2, 2, 2], [7, 7, 7], DRAW_SONDA) <= SONDA_DRAW_MS);
  });
  test("Surface Pro 11 (Adreno X1): passa in Chromium su D3D11, anche col primo giro a GPU che si sveglia", () => {
    vicino(costoDraw([1.3, 1.1, 1], [2, 2.1, 2.2], DRAW_SONDA), 0.25, 1e-9, "costo di un draw");
    // Il primo contesto del processo: i pieni scendono mentre la GPU sale di frequenza.
    const freddo = costoDraw([1.4, 1.5, 1.8], [7.4, 6.3, 5.4], DRAW_SONDA);
    vicino(freddo, 1, 1e-9, "primo giro");
    assert.ok(freddo <= SONDA_DRAW_MS);
  });
  test("SwiftShader resta fuori anche col nome mascherato", () => {
    const c = costoDraw([7.2, 2.5, 1.9], [51.6, 49, 50.8], DRAW_SONDA);
    vicino(c, 11.775, 1e-9, "costo di un draw");
    assert.ok(c > SONDA_DRAW_MS);
    // Il giro più veloce misurato su SwiftShader, con lo slot al load: oltre il tetto, bocciato al primo giro.
    assert.ok(costoDraw([3.1, 1.8, 1.6], [22.1, 21.9, 23.6], DRAW_SONDA) > SONDA_TETTO * SONDA_DRAW_MS);
  });
  test("la soglia cresce coi pixel del canvas sopra quello di taratura, mai sotto", () => {
    assert.equal(PX_SONDA, 2160 * 1242);
    assert.equal(sogliaSonda(PX_SONDA), SONDA_DRAW_MS);
    assert.equal(sogliaSonda(1440 * 828), SONDA_DRAW_MS, "SwiftShader a DPR 1: la soglia resta 1,5");
    // Lo stesso Adreno su un monitor esterno a 2560×1440 (DPR 2 fermato a 1,5: canvas 3840×2160).
    const grande = sogliaSonda(3840 * 2160);
    vicino(grande, (1.5 * 3840 * 2160) / (2160 * 1242), 1e-9, "soglia a 3840×2160");
    for (const c of [1.25, 1.35, 1.075, 1.225, 1.2, 1.8, 1.6, 1.1, 1.375, 1.35]) assert.ok(c <= grande, `${c} ms rifiutato a 3840×2160`);
    // SwiftShader, anche a pari pixel, resta oltre il tetto: 4,95 ms su 1440×828, cioè ~34 ms su 3840×2160.
    assert.ok((4.95 * (3840 * 2160)) / (1440 * 828) > SONDA_TETTO * grande);
  });
  test("i minimi: il rumore che si somma non decide, e il costo non va mai sotto zero", () => {
    vicino(costoDraw([2, 2, 2], [4, 4, 40], DRAW_SONDA), 0.5, 1e-9, "un pieno storto");
    vicino(costoDraw([2, 30, 2], [4, 4, 4], DRAW_SONDA), 0.5, 1e-9, "un vuoto storto");
    assert.equal(costoDraw([3, 3, 3], [2, 2, 2], DRAW_SONDA), 0);
  });
  test("le scatole della sonda stanno nel viewport anche con lo slot 14.000 px più giù", () => {
    const vp = { w: 1440, h: 828 };
    const { da, a } = scatoleSonda({ x: 720, y: 14000, w: 604.8, h: 340.2 }, vp);
    assert.deepEqual(a, { x: 0, y: 0, w: 1440, h: 828 });
    assert.equal(da.x, 720);
    assert.equal(da.w, 604.8);
    assert.equal(da.h, 340.2);
    vicino(da.y, (828 - 340.2) / 2, 1e-9, "miniatura a metà altezza");
    // A e 0,5 il foglio copre almeno un quarto del viewport: il draw colora pixel veri.
    const f = ingombro(0.5, da, a, 1);
    const w = Math.min(vp.w, f.x + f.w) - Math.max(0, f.x);
    const h = Math.min(vp.h, f.y + f.h) - Math.max(0, f.y);
    assert.ok(w * h >= 0.25 * vp.w * vp.h, `il foglio copre ${((w * h) / (vp.w * vp.h)).toFixed(2)} del viewport`);
  });
});

// Il cancello a tempo (23 set., seconda correzione). Sulla home vera la sonda girava al montaggio, sotto il
// sipario, e sul Surface leggeva 0,5-1,75 ms in Firefox (1,75 → scala) contro 0,25-1,0 a pagina ferma. Ora
// gira a entrata della home finita, a giri, e per bocciare vuole una conferma. Campioni veri del 23 set.
describe("il cancello a tempo e il giudizio a giri", () => {
  const P = SONDA_DRAW_MS;
  const pulito = (costo: number): Giro => ({ costo, torbido: false });
  const torbido = (costo: number): Giro => ({ costo, torbido: true });
  /** Il giro misurato sotto il sipario della home: vuoti [11, 6, 12], pieni [11, 10, 11]. */
  const intro = giro([11, 6, 12], [11, 10, 11], PX_SONDA);

  test("i tempi: passo di 1,5 s, più della coda della gomma; tre giri; torbido a 5 ms; tetto a tre volte la soglia", () => {
    assert.equal(SONDA_PASSO_MS, 1500);
    assert.ok(SONDA_PASSO_MS > GOMMA_TEMPI.normale.exit && SONDA_PASSO_MS > GOMMA_TEMPI.veloce.exit, "il primo giro cadrebbe nella coda della gomma");
    assert.equal(SONDA_PROVE, 3);
    assert.equal(SONDA_TORBIDO_MS, 5);
    assert.equal(SONDA_TETTO, 3);
    // Il tetto sta fra la GPU vera peggiore (1,75 sotto il sipario, 1,8 a 3840×2160) e lo SwiftShader più veloce (4,95 a DPR 1).
    assert.ok(SONDA_TETTO * P > 1.8);
    assert.ok(SONDA_TETTO * P < 4.95);
  });

  test("l'entrata della home trattiene il cancello: sipario e salita dell'hero, mai oltre il tetto", () => {
    assert.deepEqual([...ENTRATA_ATTR], ["data-preloader", "data-hero-entrata"]);
    const ha = (...attr: string[]) => (a: string) => attr.includes(a);
    assert.equal(entrataInCorso(ha("data-preloader", "data-hero-entrata"), 5000), true);
    assert.equal(entrataInCorso(ha("data-hero-entrata"), 9000), true);
    assert.equal(entrataInCorso(ha(), 9000), false);
    assert.equal(entrataInCorso(ha("data-hero-entrata"), ENTRATA_TETTO_MS), false, "la rete per un attributo rimasto appeso");
    // Sul film la salita finisce all'handoff più DISCESA.entrata, ENTRATA.sale e la salita (≈ 10,0 s): il tetto lascia 3 s a una gomma in ritardo.
    const fineFilm = GOMMA_REVEAL_MS + (DISCESA.entrata + ENTRATA.sale + ENTRATA.saleDurata) * 1000;
    assert.ok(ENTRATA_TETTO_MS >= fineFilm + 3000, `tetto ${ENTRATA_TETTO_MS} ms, fine del film ${fineFilm} ms`);
    // I segnali che il cancello aspetta ci sono ancora.
    const pre = leggi("app/components/motion/Preloader.tsx");
    assert.match(pre, /window\.dispatchEvent\(new Event\(INTRO_EVENT\)\)/);
    assert.match(pre, /html\.removeAttribute\("data-preloader"\);/);
    assert.match(leggi("app/components/HeroCinematic.tsx"), /html\.removeAttribute\("data-hero-entrata"\);/);
  });

  test("giro: torbido quando anche il vuoto più corto supera la soglia, che cresce coi pixel", () => {
    assert.deepEqual(intro, { costo: 1, torbido: true });
    assert.deepEqual(giro([3, 2, 2], [4, 4, 6], PX_SONDA), { costo: 0.5, torbido: false });
    assert.equal(giro([5, 5, 6], [9, 9, 9], PX_SONDA).torbido, false);
    assert.equal(giro([6, 6, 6], [9, 9, 9], PX_SONDA).torbido, true);
    assert.equal(sogliaTorbido(1440 * 828), SONDA_TORBIDO_MS);
    // A 3840×2160 il vuoto risolve un MSAA tre volte più grande: la soglia cresce con lui.
    vicino(sogliaTorbido(3840 * 2160), (SONDA_TORBIDO_MS * 3840 * 2160) / PX_SONDA, 1e-9, "torbido a 3840×2160");
    assert.equal(giro([6, 6, 6], [9, 9, 9], 3840 * 2160).torbido, false);
  });

  test("giudizioSonda: un giro pulito sotto soglia basta", () => {
    assert.equal(giudizioSonda([], P).esito, "ancora");
    assert.deepEqual(giudizioSonda([giro([3, 2, 2], [4, 4, 6], PX_SONDA)], P), { esito: "gl", costo: 0.5 });
    // Chromium, il primo contesto del processo: i pieni scendono mentre la GPU sale di frequenza.
    const freddo = giudizioSonda([giro([1.4, 1.5, 1.8], [7.4, 6.3, 5.4], PX_SONDA)], P);
    assert.equal(freddo.esito, "gl");
    vicino(freddo.costo, 1, 1e-9, "primo giro di Chromium");
    // Lo stesso Adreno su un monitor esterno a 2560×1440 (canvas 3840×2160): il giro peggiore, 1,8 ms.
    assert.equal(giudizioSonda([pulito(1.8)], sogliaSonda(3840 * 2160)).esito, "gl");
    // I valori del cancello della home sul Surface, presi sotto il sipario: nessuno boccia da solo.
    for (const c of [1.75, 0.75, 1.25, 0.5, 1.5, 1.25, 0.75, 1.45, 1.3, 1.05, 1.15, 1.33]) {
      assert.notEqual(giudizioSonda([pulito(c)], P).esito, "scala", `${c} ms`);
    }
  });

  test("i giri torbidi non promuovono da soli; se sono tutti torbidi, al terzo decide il minimo", () => {
    assert.equal(giudizioSonda([intro], P).esito, "ancora", "il costo 1,0 sotto il sipario non basta");
    assert.equal(giudizioSonda([intro, intro], P).esito, "ancora");
    assert.deepEqual(giudizioSonda([intro, intro, intro], P), { esito: "gl", costo: 1 });
    assert.deepEqual(giudizioSonda([torbido(2), torbido(2), torbido(2)], P), { esito: "scala", costo: 2 });
  });

  test("per bocciare serve una conferma: due giri puliti sopra soglia, o uno oltre il tetto", () => {
    // 1,75: il cancello della home in Firefox, sotto il sipario.
    const a = pulito(1.75);
    assert.equal(giudizioSonda([a], P).esito, "ancora");
    assert.deepEqual(giudizioSonda([a, pulito(0.75)], P), { esito: "gl", costo: 0.75 });
    assert.deepEqual(giudizioSonda([a, a], P), { esito: "scala", costo: 1.75 });
    assert.equal(giudizioSonda([a, intro], P).esito, "ancora");
    // Senza conferma, al terzo giro decide il minimo di tutti: una GPU sulla soglia non si boccia per un giro solo.
    assert.deepEqual(giudizioSonda([a, intro, intro], P), { esito: "gl", costo: 1 });
    assert.deepEqual(giudizioSonda([pulito(2.5), torbido(2), torbido(3)], P), { esito: "scala", costo: 2 });
    // SwiftShader: oltre il tetto al primo giro, niente altri giri (lì costano 200 ms l'uno).
    const ss = giudizioSonda([giro([7.2, 2.5, 1.9], [51.6, 49, 50.8], PX_SONDA)], P);
    assert.equal(ss.esito, "scala");
    vicino(ss.costo, 11.775, 1e-9, "SwiftShader");
    assert.equal(giudizioSonda([pulito(4.95)], P).esito, "scala");
    assert.equal(giudizioSonda([pulito(SONDA_TETTO * P)], P).esito, "ancora", "sul tetto non si boccia ancora");
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
  test("useLastra: canvas creato imperativamente, cancello a tempo (in un'occasione, a entrata finita, a giri), texture dal nodo vero, contesto perso → scala", () => {
    const h = leggi("app/components/motion/useLastra.ts");
    assert.match(h, /document\.createElement\("canvas"\)/);
    assert.match(h, /RENDERER_SOFTWARE\.test\(nome\)/);
    assert.match(h, /readPixels\(0, 0, 1, 1/);
    // La sonda misura il draw al netto della lettura, sulle scatole portate nel viewport, a giri.
    assert.match(h, /scatoleSonda\(rettDi\(slot\.getBoundingClientRect\(\)\), vp\)/);
    assert.doesNotMatch(h, /scatole\(0\.5\)/);
    assert.match(h, /giri\.push\(giro\(vuoti, pieni, px\)\)/);
    assert.match(h, /giudizioSonda\(giri, sogliaSonda\(px\)\)/);
    assert.match(h, /occasione\(SONDA_PASSO_MS, tenta\)/);
    assert.match(h, /isContextLost\(\)/);
    // Quando (23 set.): mai al montaggio, che sulla home cade sotto il sipario; all'handoff, poi in un'occasione.
    assert.doesNotMatch(h, /whenStill\(/);
    assert.match(h, /if \(curtainPending\(\)\) fermaSipario = afterCurtain\(parti\);\s*else parti\(\);/);
    assert.match(h, /requestIdleCallback\(vai, \{ timeout: SONDA_PASSO_MS \}\)/);
    assert.match(
      h,
      /document\.hidden \|\|\s*ScrollTrigger\.isScrolling\(\) \|\|\s*\(S\.e > 0 && S\.e < 1\) \|\|\s*entrataInCorso\(\(a\) => html\.hasAttribute\(a\), performance\.now\(\)\)/,
    );
    assert.match(h, /if \(daAspettare\(\)\) occasione\(SONDA_PASSO_MS, fn\);\s*else fn\(\);/);
    // La texture passa dalla stessa porta: il poster pigro arriva di solito mentre si scorre.
    assert.match(h, /const onPosterLoad = \(\) => occasione\(0, caricaTexture\);/);
    // Il giudizio vale per il documento: un rimontaggio con `scala` non crea il contesto.
    assert.match(h, /if \(ricordo\?\.via === "scala"\) decidi\("scala", ricordo\.motivo, ricordo\.giri\);/);
    // La sonda disegna nel viewport: il buffer torna trasparente dopo lo scaldo e dopo ogni giro, prima che
    // il canvas entri nello schermo (misura() riscrive le stesse misure e non lo pulisce).
    assert.match(h, /function trasparente\(g: WebGL2RenderingContext\): void \{\s*g\.clearColor\(0, 0, 0, 0\);\s*g\.clear\(g\.COLOR_BUFFER_BIT\);\s*g\.flush\(\);/);
    assert.match(h, /disegna\(g, p, vp, da, a, 0\.5, 1, 16 \/ 9\);\s*trasparente\(g\);\s*return \{ c, ctx: g, p, campione \};/);
    assert.match(h, /pieni\.push\(s\.campione\(DRAW_SONDA\)\);\s*\}\s*trasparente\(s\.ctx\);/);
    // Il canvas entra nello schermo in un posto solo, a giudizio gl.
    assert.equal((h.match(/screen\.appendChild\(/g) ?? []).length, 1);
    assert.match(h, /const innesta = \(s: Sonda\) => \{[\s\S]*?screen\.appendChild\(s\.c\);/);
    // Lo smontaggio ferma l'attesa e il sipario, e molla la sonda in volo.
    assert.match(h, /fermaAttesa\(\);\s*fermaSipario\(\);\s*if \(sonda\) molla\(sonda\.ctx\);/);
    assert.match(h, /removeAttribute\("data-lastra-prove"\)/);
    // Il canvas innestato: allo smontaggio prima il listener della perdita, poi il contesto (loseContext lo
    // farebbe scattare su nodi già ripuliti).
    assert.match(h, /canvas\?\.removeEventListener\("webglcontextlost", onPersa\);\s*if \(gl\) molla\(gl\);\s*canvas\?\.remove\(\);/);
    // Un giudizio fatto di soli giri torbidi non vale per il documento.
    assert.match(h, /if \(giri\.some\(\(g\) => !g\.torbido\)\) ricorda\(/);
    // La texture: il poster pigro si chiede al giudizio gl, e se torna a caricare si riascolta il suo load.
    assert.match(h, /if \(poster\.loading === "lazy"\) poster\.loading = "eager";/);
    assert.match(h, /if \(!poster\.complete\) \{\s*poster\.addEventListener\("load", onPosterLoad, \{ once: true \}\);\s*return;/);
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
