// LA FINESTRA DI OPEN DOMUS: I POLIGONI DI ERA, LA SOGLIA, I FILE CHE LA PORTANO.
//
// Chi l'ha chiesto: A19 e A20 di Alberto (13 settembre, «Sticky dove serve» e «Fedeltà
// letterale»), spec 2026-09-13 §3.10; D28 la vuole solo in home. Com'è fatta oggi:
// app/lib/motion/finestra.ts tiene poligoni, sizes, numeri e rete di fuoco come dati puri;
// OpenDomus.tsx li monta con useCorridor; globals.css tiene il layout sotto la soglia dei
// corridoi. I sorgenti si rileggono coi commenti tolti, come logo-colore.test.ts.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  SHUTTER_L,
  SHUTTER_R,
  PHONE_CLIP,
  SIZES_FINESTRA,
  FINESTRA,
  finestraFocusY,
  offsetInside,
  ordinateOf,
} from "../motion/finestra";
import { assertStraight } from "../motion/clip";

const ROOT = process.cwd();
const leggi = (p: string) => readFileSync(join(ROOT, p), "utf8");
function soloCodice(testo: string): string {
  return testo.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}
const pct = (n: number, d: number) => Number(((n / d) * 100).toFixed(3));
const punti = (poly: string) =>
  /^polygon\((.*)\)$/.exec(poly)![1].split(",").map((pt) => pt.trim().split(/\s+/).map((v) => Number.parseFloat(v)));

describe("i poligoni della finestra", () => {
  test("le tende hanno le frazioni di Era (lane-homeB.md §9)", () => {
    assert.equal(ordinateOf(SHUTTER_L[0], 3), pct(13, 36));
    assert.equal(ordinateOf(SHUTTER_L[0], 5), pct(107, 108));
    assert.equal(ordinateOf(SHUTTER_L[1], 3), pct(5, 27));
    assert.equal(ordinateOf(SHUTTER_L[1], 5), pct(22, 27));
    assert.equal(punti(SHUTTER_L[0])[2][0], pct(4, 9));
    assert.equal(punti(SHUTTER_L[0])[4][0], pct(89, 90));
    assert.equal(punti(SHUTTER_L[2])[4][0], 100);
    assert.equal(ordinateOf(SHUTTER_R[0], 3), pct(1, 108));
    assert.equal(ordinateOf(SHUTTER_R[0], 5), pct(23, 36));
    assert.equal(ordinateOf(SHUTTER_R[1], 3), pct(5, 27));
    assert.equal(punti(SHUTTER_R[0])[2][0], pct(1, 90));
    assert.equal(punti(SHUTTER_R[0])[4][0], pct(5, 9));
    assert.equal(punti(SHUTTER_R[2])[2][0], 0);
  });

  test("ogni terna ha lo stesso numero di punti e forme dritte", () => {
    for (const terna of [SHUTTER_L, SHUTTER_R, PHONE_CLIP]) {
      const n = punti(terna[0]).length;
      for (const p of terna) {
        assert.equal(punti(p).length, n, p);
        assertStraight(p);
      }
    }
  });

  test("il quadrato del telefono: scarto 19/68, fessura fra 49 % e 51 %, poi pieno", () => {
    assert.equal(ordinateOf(PHONE_CLIP[0], 0), pct(19, 68));
    assert.equal(punti(PHONE_CLIP[0])[1][0], 49);
    assert.equal(punti(PHONE_CLIP[0])[5][0], 51);
    assert.deepEqual(
      punti(PHONE_CLIP[2]).map(([x]) => x),
      [0, 50, 50, 0, 0, 50, 100, 100, 50, 50],
    );
  });
});

describe("i numeri della finestra", () => {
  test("pista, soglia del contenuto, scale e tempi di spec §3.10", () => {
    assert.deepEqual(FINESTRA, {
      endVh: 3,
      runSvh: 200,
      contentPadSvh: 22,
      shutterScale: 1.84,
      stageFrom: 0.75,
      shutterEnd: 0.5,
      mullionEnd: 0.6,
      phoneOpen: 1.3,
      phoneSnap: 0.2,
      phoneThreshold: 0.35,
    });
  });

  test("la rete di fuoco porta l'elemento al 25 % dello schermo dopo lo sgancio", () => {
    assert.equal(finestraFocusY({ start: 10_000, vh: 900, offset: 198 }), 10_000 + 3600 + 198 - 225);
  });

  test("l'offset nel contenuto toglie la scala dello stage", () => {
    const content = { getBoundingClientRect: () => ({ top: 100, width: 1080 }), offsetWidth: 1440 } as unknown as HTMLElement;
    const el = { getBoundingClientRect: () => ({ top: 400 }) } as unknown as Element;
    assert.equal(offsetInside(content, el), 400);
  });

  test("sizes: fermo 84vw, corridoio 100vw sui 16:10, quadrato 135vw e 126vw", () => {
    assert.match(SIZES_FINESTRA, /^\(prefers-reduced-motion: reduce\) and \(min-width: 1024px\) 84vw, /);
    assert.match(SIZES_FINESTRA, /\(min-width: 1024px\) and \(min-aspect-ratio: 3\/2\) 100vw/);
    assert.match(SIZES_FINESTRA, /\(max-width: 767\.98px\) 135vw, 126vw$/);
  });
});

describe("dove vive la finestra", () => {
  test("solo la home passa `finestra` (D28)", () => {
    assert.match(soloCodice(leggi("app/page.tsx")), /<OpenDomus finestra \/>/);
    for (const p of ["app/metodo/MetodoContent.tsx", "app/open-domus/OpenDomusPageContent.tsx"]) {
      const t = soloCodice(leggi(p));
      assert.match(t, /<OpenDomus \/>/, p);
      assert.doesNotMatch(t, /<OpenDomus[^>]*finestra/, p);
    }
  });

  test("OpenDomus monta il corridoio `finestra` con la foto della villa e senza pin", () => {
    const t = soloCodice(leggi("app/components/OpenDomus.tsx"));
    assert.match(t, /useCorridor\(sectionRef, \{\s*id: "finestra"/);
    assert.match(t, /src="\/images\/reali\/villa-fronte-acqua\.jpg"/);
    assert.match(t, /sizes=\{SIZES_FINESTRA\}/);
    assert.match(t, /data-corridor="finestra"/);
    assert.match(t, /data-corridor-screen/);
    assert.match(t, /className="dt-od_window dt-media-half lg:w-full! lg:max-w-none! lg:aspect-video!"/);
    assert.match(t, /focus: \(\) => null/);
    assert.match(t, /stage\.addEventListener\("focusin", onFocus\)/);
    assert.match(t, /e\.intersectionRatio >= FINESTRA\.phoneThreshold && !open/);
    assert.doesNotMatch(t, /\bpin:|pinSpacing|anticipatePin|autoAlpha/);
  });

  // A19 di Alberto (spec §3.10): la soglia dei corridoi si riattraversa a pagina viva (finestra
  // ridimensionata, preferenza di motion cambiata) e `build` gira di nuovo coi cue spenti, quindi
  // l'indietro non suona. Oggi `build` riscrive lo stato di partenza per intero: schermo senza il
  // `visibility` inline che il cue di p 1 gli scrive a mano, contenuto di nuovo in attesa.
  test("build riscrive lo stato di partenza: schermo visibile e testo in attesa", () => {
    const t = soloCodice(leggi("app/components/OpenDomus.tsx"));
    const i = t.indexOf("build: (tl, q) =>");
    assert.notEqual(i, -1, "manca il build del corridoio");
    const corpo = t.slice(i, t.indexOf("cues:", i));
    assert.match(corpo, /q\("\.dt-od_screen"\)\[0\]\?\.style\.removeProperty\("visibility"\)/);
    assert.match(corpo, /q\("\.dt-od_content"\)\[0\]\?\.setAttribute\("data-reveal-hold", ""\)/);
  });

  test("dtInOut è registrata una volta, sulla sua riga", () => {
    const g = leggi("app/lib/motion/gsap.ts");
    assert.equal(g.match(/^CustomEase\.create\("dtInOut", "0\.75,0,0\.25,1"\);$/gm)?.length, 1);
  });

  test("la voce `finestra` di chapters.ts ha la firma di §3.1", () => {
    const t = soloCodice(leggi("app/lib/motion/chapters.ts"));
    const i = t.indexOf('id: "finestra"');
    assert.notEqual(i, -1, "manca la voce finestra");
    const j = t.indexOf("id:", i + 10);
    const voce = t.slice(i, j === -1 ? undefined : j);
    assert.match(voce, /ease: "dtInOut"/);
    assert.match(voce, /scrub: 0\.15/);
    assert.match(voce, /"top bottom",\s*"\+=300%"/);
  });

  test("globals.css: antenati né ritagliati né trasformati, schermo in clip, pista e soglia", () => {
    const css = leggi("app/globals.css");
    const i = css.indexOf("LA FINESTRA DI OPEN DOMUS");
    assert.notEqual(i, -1, "manca il blocco della finestra");
    const blocco = css.slice(i, css.indexOf("/* Riga e capitolo", i));
    assert.ok(blocco.includes("@media (min-width: 1024px) and (min-height: 640px) and (prefers-reduced-motion: no-preference)"));
    const regole = [...blocco.matchAll(/([^{}]*\.dt-od[^{}]*)\{([^{}]*)\}/g)].map((m) => ({ sel: m[1].trim(), body: m[2] }));
    for (const r of regole) {
      for (const s of r.sel.split(",").map((x) => x.trim())) {
        if (!/\.dt-od(_area|_shutterzone)?(\[[^\]]*\]|:not\([^)]*\))*$/.test(s)) continue;
        assert.doesNotMatch(r.body, /(^|[;\s])transform\s*:/, s);
        assert.doesNotMatch(r.body, /overflow(-x|-y)?\s*:\s*(hidden|auto|scroll)/, s);
        assert.doesNotMatch(r.body, /clip-path/, s);
      }
    }
    const schermo = regole.filter((r) => /\.dt-od_screen$/.test(r.sel));
    assert.ok(schermo.some((r) => /overflow:\s*clip/.test(r.body)), "lo schermo non ritaglia sé stesso");
    assert.ok(schermo.every((r) => !/overflow:\s*hidden/.test(r.body)), "lo schermo usa hidden");
    assert.ok(
      regole.every((r) => !(/\.dt-od_window$/.test(r.sel) && /aspect-ratio/.test(r.body))),
      "scatola a mano sulla foto: il formato lo danno dt-media-half e le utility lg",
    );
    assert.ok(regole.some((r) => /\.dt-od_run$/.test(r.sel) && /height:\s*200svh/.test(r.body)));
    assert.ok(regole.some((r) => /\.dt-od_content$/.test(r.sel) && /padding-top:\s*22svh/.test(r.body)));
  });

  test("le tende nascono col poligono chiuso di Era in CSS, senza stati nascosti prima del JS (spec §2.5)", () => {
    const css = leggi("app/globals.css");
    const i = css.indexOf("LA FINESTRA DI OPEN DOMUS");
    assert.notEqual(i, -1, "manca il blocco della finestra");
    const blocco = css.slice(i, css.indexOf("/* Riga e capitolo", i));
    const regola = (lato: "l" | "r", poly: string) =>
      new RegExp(String.raw`\.dt-od_shutter--${lato}\s*\{\s*clip-path:\s*` + poly.replace(/[.()]/g, "\\$&") + ";");
    assert.match(blocco, regola("l", SHUTTER_L[0]), "la tenda sinistra non nasce col poligono chiuso di SHUTTER_L[0]");
    assert.match(blocco, regola("r", SHUTTER_R[0]), "la tenda destra non nasce col poligono chiuso di SHUTTER_R[0]");
    assert.doesNotMatch(blocco, /visibility\s*:\s*hidden/, "stato nascosto scritto in CSS: nasce solo via JS (spec §2.5, §3.10)");
    assert.doesNotMatch(blocco, /opacity\s*:\s*0\s*[;}]/, "stato nascosto scritto in CSS: nasce solo via JS (spec §2.5)");
  });
});
