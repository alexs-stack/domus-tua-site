// IL SEGNAPOSTO DEL LOGO HA LA MISURA DELL'IMMAGINE (CLS 0 sul telefono).
//
// Chi l'ha chiesto: A46 di Alberto (21 settembre 2026, sera) pretende CLS 0 sulle teste a sei
// viewport, e la misura sui pixel (e2e/a28.spec.ts, «le scritte sull'avorio») ha trovato l'unico
// spostamento di layout fuori dalla testa: il logo della testata. Com'era: mentre `Logo.tsx`
// sonda l'asset (status «loading») rende uno <span> largo `brand.width` × `brand.height`
// (200 × 37 px), poi l'<img> con la stessa classe della testata, `w-[clamp(150px,13vw,210px)]
// h-auto`: a 390 px l'immagine è 150 × 28 e il link della testata si sposta di 4 px (0,000125 di
// CLS, deterministico, su ogni rotta del telefono; su desktop 13vw ≥ 187 px e non si vede quasi).
// Com'è fatto oggi: il segnaposto porta la STESSA classe dell'immagine e il rapporto
// `brand.width / brand.height` in `aspect-ratio`, quindi ha la misura resa dell'immagine a ogni
// larghezza e nulla si sposta al carico. Il logo resta quello grigio e rosso (C23): qui cambia
// solo la scatola vuota che lo precede.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(join(process.cwd(), "app/components/Logo.tsx"), "utf8").replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1");

describe("il segnaposto del logo (A46: CLS 0)", () => {
  test("mentre l'asset si sonda, lo span vuoto ha la classe dell'immagine e il suo rapporto, non 200 × 37 px fissi", () => {
    const span = /<span aria-hidden className=\{className\} style=\{\{[\s\S]*?\}\}\s*\/>/.exec(src)?.[0] ?? "";
    assert.ok(span, "manca lo <span aria-hidden className={className} …/> del segnaposto");
    assert.match(span, /display:\s*"inline-block"/);
    assert.match(span, /aspectRatio:\s*`\$\{brand\.width\} \/ \$\{brand\.height\}`/, "il segnaposto non porta il rapporto dell'immagine");
    assert.doesNotMatch(span, /width:\s*brand\.width|height:\s*brand\.height/, "il segnaposto riserva 200 × 37 px fissi: a 390 px l'immagine è 150 × 28 e il link si sposta");
  });

  test("l'immagine tiene gli attributi width/height e la stessa classe: il rapporto del segnaposto è il suo", () => {
    const img = /<img\s[^>]*\/>/.exec(src)?.[0] ?? "";
    assert.ok(img, "manca l'<img> del logo");
    assert.match(img, /width=\{brand\.width\}/);
    assert.match(img, /height=\{brand\.height\}/);
    assert.match(img, /className=\{className\}/);
  });
});
