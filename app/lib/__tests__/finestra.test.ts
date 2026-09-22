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
import { FINESTRA, PORTA, SIZES_FINESTRA, leadDistance } from "../motion/finestra";

const ROOT = process.cwd();
const leggi = (p: string) => readFileSync(join(ROOT, p), "utf8");
function soloCodice(testo: string): string {
  return testo.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

describe("i numeri della finestra (A57/A58)", () => {
  test("la salita finisce con la cima del soggetto al 10 % del viewport, e i pannelli sono tre", () => {
    assert.equal(FINESTRA.leadTop, 0.1);
    assert.equal(FINESTRA.panels, 3);
  });

  test("leadDistance: cima × altezza resa meno il 10 % del viewport, mai negativa", () => {
    // 1920 px di larghezza: la foto 9:16 è alta 3440, la cima al 24,6 % sta a 846; viewport 977.
    assert.equal(Math.round(leadDistance({ cima: 0.246, fotoH: 3440, vh: 977 })), 749);
    assert.equal(leadDistance({ cima: 0.05, fotoH: 1000, vh: 900 }), 0);
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
    assert.match(
      css,
      new RegExp(String.raw`\.dt-od_porta\s*\{[^}]*aspect-ratio:\s*${PORTA.sorgente[0]} / ${PORTA.sorgente[1]};`),
      "la scatola della soglia non ha il rapporto del sorgente",
    );
    assert.match(PORTA.file, /^\/images\/reali\/raffaela-porta-alta\.jpg$/);
  });

  test("sizes: 100vw a ogni larghezza (A47: la foto intera, larga tutto, nessun cover che ritagli)", () => {
    assert.equal(SIZES_FINESTRA, "100vw");
  });
});

describe("dove vive la finestra", () => {
  test("OpenDomus.tsx monta il nastro con la salita, la firma del registro e i due sipari; tende, stage e chiusura sono morti (A58)", () => {
    const src = soloCodice(leggi("app/components/OpenDomus.tsx"));
    assert.match(src, /<HorizonScroller[\s\S]*corridor="finestra"/);
    assert.match(src, /lead=\{\{\s*selector: "\.dt-od_cornice"/);
    assert.match(src, /ease=\{chapters\.finestra\.signature\.ease\}/);
    assert.match(src, /scrub=\{scrubOf\("finestra"\)\}/);
    assert.equal((src.match(/data-horizon-slide\b(?!-)/g) ?? []).length, 2, "due sipari: il video di Teresa e Raffaela sulla soglia");
    for (const morto of ["useCorridor", "ChiusuraFoto", "dt-od_shutter", "dt-od_stage", "dt-od_mark", "dt-od_run", "SHUTTER_L", "PHONE_CLIP"]) {
      assert.ok(!src.includes(morto), `${morto} è ancora in OpenDomus.tsx`);
    }
  });

  test("HorizonScroller porta la salita, l'ease e lo scrub per prop, con la firma di storia come default (D18)", () => {
    const src = soloCodice(leggi("app/components/motion/HorizonScroller.tsx"));
    assert.match(src, /lead\?: \{ selector: string; distance:/);
    assert.match(src, /ease = STORIA\.ease/);
    assert.match(src, /root\.style\.height = `\$\{track\.scrollWidth \+ leadPx\}px`/);
    assert.match(src, /innesco\.start = \(\) => `top\+=\$\{leadPx\} top`/);
  });

  test("globals.css: niente più tende, stage, pista, marcatori né spazio sopra della finestra", () => {
    const css = leggi("app/globals.css").replace(/\/\*[\s\S]*?\*\//g, " ");
    for (const morto of [".dt-od_shutter", ".dt-od_stage", ".dt-od_run", ".dt-od_mark", ".dt-od_area", "--dt-od-sopra", ".dt-od_content"]) {
      assert.ok(!css.includes(morto), `${morto} è ancora in globals.css`);
    }
    assert.match(css, /\.dt-od\[data-on\] \.dt-od_panel--foto\s*\{[^}]*overflow:\s*clip/, "nel nastro il pannello della foto deve ritagliare la cornice che sale");
  });
});
