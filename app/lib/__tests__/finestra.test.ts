// LA FINESTRA DI OPEN DOMUS: IL NASTRO CON LA FACCIATA CHE SALE, I FILE CHE LA PORTANO.
//
// Chi l'ha chiesto: A57 e A58 di Alberto (22 set. 2026, sera): «aggiungere lo stesso effetto di
// scroll orizzontale con gsap e animazione entrata immagine come in "Tra la Pineta e Milano" nella
// sezione Open domus»; «togli l'animazione dell'immagine di open domus all'entrata, mantieni la
// stessa posizione ma lasciala a schermo intero da subito (non serve neanche l'animazione di
// uscita che si chiude)». D28 la vuole solo in home. Com'è fatta oggi: app/lib/motion/finestra.ts
// tiene i numeri come dati puri; OpenDomus.tsx monta HorizonScroller con la salita (`lead`) e la
// firma del registro; globals.css tiene il layout della cornice e del terzo pannello. I sorgenti
// si rileggono coi commenti tolti, come logo-colore.test.ts.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { FINESTRA, SIZES_FINESTRA, codaDistance, codaFrom, leadDistance } from "../motion/finestra";

const ROOT = process.cwd();
const leggi = (p: string) => readFileSync(join(ROOT, p), "utf8");
function soloCodice(testo: string): string {
  return testo.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

describe("i numeri della finestra (A57/A58)", () => {
  test("la salita finisce col tetto a metà del titolo (A65), la coda arriva col soggetto al 55 % (A67), e i pannelli sono tre", () => {
    assert.equal(FINESTRA.copri, 0.5);
    assert.equal(FINESTRA.codaSopra, 0.55);
    assert.equal(FINESTRA.panels, 3);
  });

  test("leadDistance: cima × altezza resa meno la quota del titolo, mai negativa", () => {
    // 1920 px di larghezza: la foto 9:16 è alta 3440, la cima al 24,6 % sta a 846; metà titolo a 110.
    assert.ok(Math.abs(leadDistance({ cima: 0.246, fotoH: 3440, copri: 110 }) - 736.24) < 0.01);
    assert.equal(leadDistance({ cima: 0.05, fotoH: 1000, copri: 90 }), 0);
  });

  test("la coda: arriva alzata col soggetto al 55 % del viewport e scende di quel che resta sotto lo schermo", () => {
    // 1440×900: la piscina 2:3 è alta 2146, la cima al 26,7 % sta a 573; il 55 % di 900 è 495.
    const from = codaFrom({ cima: 0.267, fotoH: 2146, vh: 900 });
    assert.ok(Math.abs(from + 77.98) < 0.01, `from ${from}`);
    assert.ok(Math.abs(codaDistance({ fotoH: 2146, vh: 900, from }) - 1168.02) < 0.01);
    assert.equal(codaFrom({ cima: 0.1, fotoH: 1000, vh: 900 }), -0);
    assert.equal(codaDistance({ fotoH: 800, vh: 900, from: 0 }), 0);
  });

  test("finestra.json, il CSS e la soglia dicono la stessa geometria (A47, A57)", () => {
    const foto = JSON.parse(leggi("app/lib/motion/finestra.json")) as {
      file: string;
      sorgente: number[];
      cielo: { cima: number; linea: number };
      segno: number[][];
    };
    assert.match(foto.file, /^\/images\/reali\/villa-facciata-sale-alta-cielo\.webp$/);
    const [w, h] = foto.sorgente;
    assert.ok(h / w > 1.7 && h / w < 1.8, `la facciata che sale è 9:16: ${w}×${h}`);
    assert.ok(foto.cielo.cima > 0.15 && foto.cielo.cima < 0.35, `il cielo sopra la facciata vale ${foto.cielo.cima} dell'altezza: il titolo ci deve stare`);
    for (const [a, b] of foto.segno) assert.ok(a >= 0 && b <= 1 && a < b, `banda del segno ${a}-${b}`);
    const css = leggi("app/globals.css").replace(/\/\*[\s\S]*?\*\//g, " ");
    assert.match(css, new RegExp(String.raw`\.dt-od\s*\{[^}]*--dt-od-ar:\s*${w} / ${h};`), "il rapporto della foto nel CSS non è quello di finestra.json");
    // A67: la coda è la piscina lunga no-bg scelta da Alberto, misurata da finestra.mjs in coda.json.
    const coda = JSON.parse(leggi("app/lib/motion/coda.json")) as { file: string; sorgente: number[]; cielo: { cima: number }; segno: number[][] };
    assert.match(coda.file, /^\/images\/reali\/villa-piscina-lunga-alta-cielo\.webp$/);
    const [cw, ch] = coda.sorgente;
    assert.ok(coda.cielo.cima > 0.15 && coda.cielo.cima < 0.4, `il cielo sopra la piscina vale ${coda.cielo.cima}: le scritte ci devono stare`);
    for (const [a, b] of coda.segno) assert.ok(a >= 0 && b <= 1 && a < b, `banda del segno ${a}-${b}`);
    assert.match(css, new RegExp(String.raw`\.dt-od_coda\s*\{[^}]*aspect-ratio:\s*${cw} / ${ch};`), "la scatola della coda non ha il rapporto del sorgente");
    assert.match(css, new RegExp(String.raw`\.dt-od\[data-on\] \.dt-od_coda_foto\s*\{[^}]*aspect-ratio:\s*${cw} / ${ch};`), "nel nastro la foto della coda deve restare alta quanto il sorgente");
  });

  test("sizes: 100vw a ogni larghezza (A47: la foto intera, larga tutto, nessun cover che ritagli)", () => {
    assert.equal(SIZES_FINESTRA, "100vw");
  });
});

describe("dove vive la finestra", () => {
  test("OpenDomus.tsx monta il nastro con la salita, la firma del registro e i due sipari; tende, stage e chiusura sono morti (A58)", () => {
    const src = soloCodice(leggi("app/components/OpenDomus.tsx"));
    assert.match(src, /<HorizonScroller[\s\S]*corridor="finestra"/);
    // A65: sale la scatola della foto, non la cornice (il titolo resta fermo); A67: la coda scende insieme alle scritte.
    assert.match(src, /lead=\{\{\s*selector: "\.dt-od_window"/);
    assert.match(src, /tail=\{\{\s*selector: "\.dt-od_coda_foto",\s*also: "\.dt-od_coda_testo"/);
    assert.match(src, /ease=\{chapters\.finestra\.signature\.ease\}/);
    assert.match(src, /scrub=\{scrubOf\("finestra"\)\}/);
    assert.equal((src.match(/data-horizon-slide\b(?!-)/g) ?? []).length, 2, "due sipari: il video di Teresa e la piscina della coda");
    assert.equal((src.match(/data-horizon-stair\b/g) ?? []).length, 1, "il titolo a gradini della coda (A66)");
    // A68: la chiusura in cartolina della coda, dallo sgancio al 10 % del viewport, con la cornice del Congedo.
    assert.match(src, /scrollTrigger: \{ trigger: root, start: "bottom bottom", end: "bottom 10%", scrub: 0\.9, invalidateOnRefresh: true \}/);
    assert.match(src, /import \{ CORNICE_LG \} from "\.\/motion\/ChiusuraFoto"/);
    // `<ChiusuraFoto` (il componente delle teste) è morto sulla finestra; da ChiusuraFoto si importa solo CORNICE_LG (A68).
    for (const morto of ["useCorridor", "<ChiusuraFoto", "dt-od_shutter", "dt-od_stage", "dt-od_mark", "dt-od_run", "SHUTTER_L", "PHONE_CLIP", "PORTA", "dt-od_porta"]) {
      assert.ok(!src.includes(morto), `${morto} è ancora in OpenDomus.tsx`);
    }
  });

  test("HorizonScroller porta la salita, l'ease e lo scrub per prop, con la firma di storia come default (D18)", () => {
    const src = soloCodice(leggi("app/components/motion/HorizonScroller.tsx"));
    assert.match(src, /lead\?: \{ selector: string; distance:/);
    assert.match(src, /tail\?: \{\s*selector: string;\s*also\?: string;/);
    assert.match(src, /ease = STORIA\.ease/);
    assert.match(src, /root\.style\.height = esplicito \? `\$\{leadPx \+ run \+ tailPx \+ screen\.clientHeight\}px` : `\$\{track\.offsetWidth\}px`/);
    assert.ok(!/track\.scrollWidth/.test(src), "il nastro misura i pannelli con offsetWidth: scrollWidth conta lo sbordo dei gradini");
    assert.match(src, /innesco\.start = \(\) => `top\+=\$\{leadPx\} top`/);
    assert.match(src, /innesco\.end = \(\) => `top\+=\$\{leadPx \+ run\} top`/);
  });

  test("globals.css: niente più tende, stage, pista, marcatori né spazio sopra della finestra", () => {
    const css = leggi("app/globals.css").replace(/\/\*[\s\S]*?\*\//g, " ");
    for (const morto of [".dt-od_shutter", ".dt-od_stage", ".dt-od_run", ".dt-od_mark", ".dt-od_area", "--dt-od-sopra", ".dt-od_content", ".dt-od_porta"]) {
      assert.ok(!css.includes(morto), `${morto} è ancora in globals.css`);
    }
    assert.match(css, /\.dt-od\[data-on\] \.dt-od_panel--foto\s*\{[^}]*overflow:\s*clip/, "nel nastro il pannello della foto deve ritagliare la cornice che sale");
  });
});
