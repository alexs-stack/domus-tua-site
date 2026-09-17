// IL RITAGLIO DELLA TESTIMONIANZA COL GESTO «LA FOTO AFFONDA».
//
// Spec 2026-09-13 §3.14 e D29: dentro la cornice ferma il contenitore della
// foto è alto il 110 % (overscan del 10 %) e scende del 10 % della cornice
// mentre il capitolo esce (A20 di Alberto). Il trim di `.dt-still-trim--top`
// vale 1,30 (D29), così trim × overscan = 1,43, il tetto delle copertine
// rifilate (DESIGN.md:593), e a fine corsa resta nascosto il 23,1 % della
// foto, sopra il 19,9 % del titolo cotto nel fotogramma. Il test rilegge i
// due numeri dal sorgente.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const css = readFileSync(join(ROOT, "app/globals.css"), "utf8");
const ft = readFileSync(join(ROOT, "app/components/FeaturedTestimonial.tsx"), "utf8");

const TETTO = 1.43;
const TITOLO_COTTO = 0.199;

const trim = /\.dt-still-trim--top\s*\{[^}]*?transform:\s*scale\(([\d.]+)\)/.exec(css);
const overscan = /top-\[-(\d+(?:\.\d+)?)%\]/.exec(ft);

describe("il ritaglio della testimonianza col gesto", () => {
  test("globals.css e FeaturedTestimonial.tsx dichiarano trim e overscan", () => {
    assert.ok(trim, "manca scale() in .dt-still-trim--top");
    assert.ok(overscan, "manca l'overscan top-[-N%] sul contenitore [data-sink]");
  });

  test("trim × overscan resta dentro il tetto di 1,43", () => {
    const s = Number(trim![1]);
    const x = 1 + Number(overscan![1]) / 100;
    // 1.3 * 1.1 in virgola mobile vale 1.4300000000000002: tolleranza di 1e-9.
    assert.ok(s * x <= TETTO + 1e-9, `${s} × ${x} = ${s * x}, oltre ${TETTO}`);
  });

  test("a fine corsa il titolo cotto resta fuori campo con margine", () => {
    const s = Number(trim![1]);
    assert.ok((s - 1) / s >= 0.21, `parte nascosta ${((s - 1) / s).toFixed(3)} < 0,21`);
    assert.ok((s - 1) / s > TITOLO_COTTO);
  });

  test("la corsa è il 10 % della cornice: yPercent 9.0909 del contenitore alto 110 %", () => {
    assert.match(ft, /yPercent:\s*9\.0909/);
  });
});
