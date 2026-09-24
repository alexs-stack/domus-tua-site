// LA QUALITÀ DELLE IMMAGINI: SOLO WEBP, UNA QUALITÀ PER TUTTO IL SITO.
//
// Chi l'ha chiesto. Alberto, 24 settembre 2026, dal PC fisso: «le qualità di tutte le immagini
// sono state abbassate … passa a WebP e alza la qualità a 85». next.config non era cambiato dal
// 18 set. e le varianti servite avevano la risoluzione di prima; solo l'hero era sceso da 78 a 75
// col cambio di foto (52fad5e, 22 set.). Il grosso veniva dall'AVIF: con `formats: ["image/avif",
// "image/webp"]` Chrome e Firefox lo ricevevano, e l'ottimizzatore di Next lo codifica a
// quality × 50/80 (75 → 47, 60 → 38); a DPR 1 la morbidezza si vede (a parità di `q`, 1,5-2,3 dB
// di PSNR sotto il WebP). Sulla home, a 85 in WebP: +4,1…+4,6 dB e circa 2,6 volte i byte
// (1.834 → 4.892 KB a 1920×1080, 929 → 2.441 KB a 390×844 @3; misurato sul build il 24 set.).
//
// Com'è fatto: next.config ammette una qualità sola, 85, e serve solo WebP. Next 16 porta ogni
// `quality` (e il default 75 quando il componente non la dà) alla voce più vicina della lista,
// quindi il numero vive in un posto solo e nessun componente passa `quality`: un 60 o un 75
// scritti a mano sarebbero serviti a 85 lo stesso, con un avviso in sviluppo, e mentirebbero a
// chi legge.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { findClosestQuality } from "next/dist/shared/lib/find-closest-quality";

const ROOT = process.cwd();
const config = readFileSync(join(ROOT, "next.config.ts"), "utf8");

/** I sorgenti dell'app, test esclusi. */
function sorgenti(dir: string): string[] {
  const out: string[] = [];
  for (const nome of readdirSync(dir)) {
    const p = join(dir, nome);
    if (nome === "__tests__" || nome === "node_modules") continue;
    if (statSync(p).isDirectory()) out.push(...sorgenti(p));
    else if (/\.(tsx?|mjs)$/.test(nome)) out.push(p);
  }
  return out;
}

describe("la qualità delle immagini (24 set.)", () => {
  test("next.config: solo WebP, e 85 è l'unica qualità ammessa", () => {
    assert.match(config, /formats:\s*\["image\/webp"\]/);
    assert.doesNotMatch(config, /image\/avif/, "l'AVIF è tornato fra i formati");
    assert.match(config, /qualities:\s*\[85\]/);
  });

  test("ogni immagine esce a 85: anche il default di next/image e le qualità scritte a mano", () => {
    const cfg = { qualities: [85] };
    for (const q of [undefined, 60, 75, 78, 85, 100]) assert.equal(findClosestQuality(q, cfg), 85, `quality ${q}`);
  });

  test("nessun componente passa `quality`: il numero vive solo in next.config", () => {
    const colpevoli = sorgenti(join(ROOT, "app"))
      .filter((p) => /(^|[\s{,(])quality\s*(=\s*["'{]|:\s*[\w"'])/m.test(readFileSync(p, "utf8")))
      .map((p) => relative(ROOT, p));
    assert.deepEqual(colpevoli, []);
  });
});
