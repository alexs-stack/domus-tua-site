// D.O.C. E SERVICES, CAPITOLI 10 E 11 DELLA HOME (spec 2026-09-13 §3.11, §3.12).
//
// A20 di Alberto («Fedeltà letterale»): un gesto per capitolo, con la firma
// scritta in app/lib/motion/chapters.ts. Il D.O.C. tira le righe sopra i
// pilastri e la spina fra le colonne (Hairline; D26: ferme restano disegnate).
// Services scende da 1,15 a 1 dentro la scatola (D27, niente parallasse) e ogni
// riga dichiara il rapporto vero del suo file (D60).
// Qui si rileggono firme, forme e sorgenti; il movimento lo misura
// e2e/home.spec.ts sul build. I commenti vanno via prima di cercare, come in
// app/components/__tests__/logo-colore.test.ts.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { chapters } from "../motion/chapters";
import { clipClosed, clipOpen } from "../motion/clip";
import { ZOOM_FROM, zoomSizes } from "../motion/zoom";

const ROOT = process.cwd();

function soloCodice(testo: string): string {
  return testo.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}
const grezzo = (p: string) => readFileSync(join(ROOT, p), "utf8");
const codice = (p: string) => soloCodice(grezzo(p));

describe("D.O.C.: le righe che si tirano (spec §3.11)", () => {
  test("la firma del capitolo 10 è quella della tabella di §3.1", () => {
    const s = chapters.doc.signature;
    assert.equal(s.ease, "power1.out");
    assert.deepEqual(s.time, { dur: 0.8, delay: 0.2, stagger: 0.08 });
    assert.deepEqual(s.trigger, { io: { rootMargin: "0px 0px -40% 0px", threshold: 0 } });
  });

  test("i tratti interni della riga 10: spina 1,12 s power1.out, uscita 0,5 s circ.in", () => {
    const sec = chapters.doc.secondary ?? [];
    const spina = sec.find((t) => t.note.startsWith("spina"));
    const uscita = sec.find((t) => t.note.startsWith("uscita"));
    assert.equal(spina?.ease, "power1.out");
    assert.match(spina?.note ?? "", /1,12 s/);
    assert.equal(uscita?.ease, "circ.in");
    assert.match(uscita?.note ?? "", /0,5 s/);
  });

  test("le forme di clip.ts che il gesto usa sono a spigolo vivo e nel verso giusto", () => {
    assert.equal(clipOpen, "inset(0% 0% 0% 0%)");
    assert.equal(clipClosed("left"), "inset(0% 100% 0% 0%)");
    assert.equal(clipClosed("right"), "inset(0% 0% 0% 100%)");
    assert.equal(clipClosed("top"), "inset(0% 0% 100% 0%)");
    assert.equal(clipClosed("bottom"), "inset(100% 0% 0% 0%)");
  });

  test("una riga per pilastro e una spina, e la spina sta nel wrapper prima della ul", () => {
    const src = codice("app/components/DomusDocProtocol.tsx");
    assert.equal((src.match(/<Hairline\b/g) ?? []).length, 2, "attese due <Hairline: una nel map dei pilastri, una per la spina");
    // A59: la spina separa la lista dalla cornice delle foto, che sta accanto da lg.
    assert.match(src, /<Hairline chapter="doc" axis="y" className="hidden lg:block" \/>/);
    assert.match(src, /<Hairline chapter="doc" \/>/);
    assert.match(src, /useHairlineSheet\(sheetRef, "doc", \[locale\]\)/);
    const foglio = src.indexOf("data-doc-sheet");
    const spina = src.indexOf('axis="y"');
    const lista = src.indexOf("<ul", foglio);
    assert.ok(foglio > -1 && foglio < spina && spina < lista, "la spina deve stare nel wrapper [data-doc-sheet], prima della ul");
  });

  test("Hairline legge firma, innesco, ease e durate dei tratti da chapters.ts e le forme da clip.ts", () => {
    const src = codice("app/components/motion/Hairline.tsx");
    assert.match(src, /chapters\[chapter\]\.signature/);
    assert.match(src, /chapters\[chapter\]\.secondary/);
    assert.match(src, /const spina = tratto\(chapter, "spina"\)/);
    assert.match(src, /const uscita = tratto\(chapter, "uscita"\)/);
    assert.match(src, /duration: spina\.dur/);
    assert.match(src, /duration: uscita\.dur/);
    // Lo stagger d'uscita non ha una nota in chapters.ts: spec §3.11, «stagger 0,05 dall'ultima».
    assert.match(src, /const OUT_STAGGER = 0\.05;/);
    assert.match(src, /stagger: \{ each: OUT_STAGGER, from: "end" \}/);
    assert.doesNotMatch(src, /\b(1\.12|0\.5)\b/);
    assert.doesNotMatch(src, /"(power1\.out|circ\.in|power3\.in)"/);
    assert.doesNotMatch(src, /duration:\s*0\.8\b/);
    assert.doesNotMatch(src, /rootMargin:\s*"0px 0px -40% 0px"/);
    assert.doesNotMatch(src, /\binset\(/);
    assert.doesNotMatch(src, /\bpin(Spacing)?:|anticipatePin/);
    assert.doesNotMatch(src, /translate-/);
  });

  test("righe e spina si rileggono a ogni gesto e il foglio si riarma al cambio di lingua", () => {
    const src = codice("app/components/motion/Hairline.tsx");
    assert.match(src, /const rules = \(\) =>/);
    assert.match(src, /const spines = \(\) =>/);
    assert.match(src, /dependencies: \[chapter, \.\.\.deps\], revertOnUpdate: true/);
    assert.doesNotMatch(src, /if \(primo\) \{/);
    // La rete vale solo finché l'IntersectionObserver non ha deciso: righe uscite in vista restano uscite.
    assert.match(src, /if \(!deciso && !aperto && r\.top < window\.innerHeight && r\.bottom > 0\)/);
    assert.equal((src.match(/deciso = true;\s*window\.clearTimeout\(rete\);/g) ?? []).length, 2);
  });
});

describe("Services: lo zoom d'ingresso (spec §3.12)", () => {
  test("la firma del capitolo 11 è quella della tabella di §3.1", () => {
    const s = chapters.servizi.signature;
    assert.equal(s.ease, "sine.out");
    assert.deepEqual(s.time, { scrub: 1 });
    assert.deepEqual("st" in s.trigger ? s.trigger.st : null, ["top bottom", "bottom bottom"]);
    // Innesco sulla scatola, non sull'interno che scala (spec §3.1 riga 11, §3.12).
    assert.equal("el" in s.trigger ? s.trigger.el : null, "#servizi [data-zoom-box]");
  });

  test("zoomSizes: resa = scatola × rapporto × 1,15 (lane-homeB §11)", () => {
    assert.equal(ZOOM_FROM, 1.15);
    assert.equal(zoomSizes(16 / 9), "(max-width:767px) 184vw, (max-width:1023px) 172vw, (min-width:1524px) 1309px, 86vw");
    assert.equal(zoomSizes(3 / 2), "(max-width:767px) 156vw, (max-width:1023px) 145vw, (min-width:1524px) 1104px, 73vw");
    assert.equal(zoomSizes(1), "(max-width:767px) 104vw, (max-width:1023px) 97vw, (min-width:1524px) 736px, 49vw");
  });

  test("ogni riga dichiara il rapporto vero del suo file", async () => {
    const src = codice("app/components/Services.tsx");
    const righe = [...src.matchAll(/\{\s*src:\s*"([^"]+)",\s*ratio:\s*(\d+)\s*\/\s*(\d+)\s*\}/g)];
    assert.equal(righe.length, 3, "attese tre righe { src, ratio: a / b }");
    // D60: la riga 1 tiene la sala di oggi; villa-sala-tour.jpg è scartata per R2
    // (targa a muro leggibile) e non esiste.
    assert.equal(righe[0][1], "/images/home_staging_01_sala_reale_sedie_gialle.jpg");
    for (const [, file, a, b] of righe) {
      const m = await sharp(join(ROOT, "public", file)).metadata();
      assert.ok(m.width && m.height, `${file}: dimensioni illeggibili`);
      assert.ok(Math.abs(m.width / m.height - Number(a) / Number(b)) < 0.01, `${file}: ${m.width}×${m.height} non è ${a}:${b}`);
    }
  });

  test("niente Parallax: lo zoom sta su un wrapper dentro la scatola, non sull'img", () => {
    const src = codice("app/components/Services.tsx");
    assert.doesNotMatch(src, /Parallax/);
    assert.match(src, /data-zoom-box/);
    assert.match(src, /<div data-zoom className="absolute inset-0">/);
    // Dal 2026-09-20 la scatola e' la meta' forzata a 16:9: `zoomSizes` vuole il rapporto
    // fra sorgente e scatola (D04), non quello del solo sorgente.
    assert.match(src, /sizes=\{zoomSizes\(row\.ratio \/ BOX_ASPECT\)\}/);
    assert.match(src, /const BOX_ASPECT = 16 \/ 9;/);
    assert.match(src, /dt-media-half !aspect-video/);
    // gsap.matchMedia() crea contesti senza selettore: la query parte dalla radice della sezione.
    assert.match(src, /root\.querySelectorAll<HTMLElement>\("\[data-zoom\]"\)/);
    assert.doesNotMatch(src, /toArray<HTMLElement>\("\[data-zoom\]"\)/);
  });

  test("l'alt della riga 1 descrive quel che si vede, in cinque lingue (spec §7.5)", () => {
    const src = grezzo("app/components/Services.tsx");
    for (const alt of [
      "Soggiorno con tavolo, sedie gialle, lampada ad arco e libreria",
      "Living room with a table, yellow chairs, an arc lamp and a bookcase",
      "Séjour avec une table, des chaises jaunes, un lampadaire arc et une bibliothèque",
      "Wohnzimmer mit Tisch, gelben Stühlen, Bogenlampe und Bücherregal",
      "Salón con mesa, sillas amarillas, lámpara de arco y librería",
    ]) {
      assert.ok(src.includes(`"${alt}"`), `manca l'alt «${alt}»`);
    }
    assert.doesNotMatch(src, /valorizzato dall’home staging|enhanced by home staging|valorisé par le home staging|Durch Home Staging aufgewerteter|revalorizado con home staging/);
  });
});
