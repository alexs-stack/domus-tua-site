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
  // A47 (Alberto, 22 set. 2026): la soglia del contenuto a 22svh è morta: il capitolo posa SULLA foto,
  // dal 55 % della sua altezza (`sopra`), e la foto intera è alta quanto è resa (finestra.json).
  test("pista, quota del capitolo sulla foto, scale e tempi di spec §3.10", () => {
    assert.deepEqual(FINESTRA, {
      endVh: 3,
      runSvh: 200,
      sopra: 0.55,
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
    // Lo sgancio sta a start + 3vh (la pista di 200svh dopo l'aggancio a +100vh); il contenuto sta a
    // `contentTop` dalla cima dello stage (A47: sulla foto, non più a 122svh) e l'elemento a `offset`
    // dentro il contenuto.
    assert.equal(finestraFocusY({ start: 10_000, vh: 900, contentTop: 1419, offset: 198 }), 10_000 + 2700 + 1419 + 198 - 225);
  });
  test("finestra.json, il CSS e la quota `sopra` dicono la stessa geometria (A47)", () => {
    const foto = JSON.parse(leggi("app/lib/motion/finestra.json")) as { file: string; sorgente: number[]; cielo: { cima: number; linea: number }; segno: number[][] };
    assert.match(foto.file, /^\/images\/reali\/villa-facciata-sale-alta-cielo\.webp$/);
    const [w, h] = foto.sorgente;
    assert.ok(h / w > 1.7 && h / w < 1.8, `la facciata che sale è 9:16: ${w}×${h}`);
    assert.ok(foto.cielo.cima > 0.15 && foto.cielo.cima < 0.35, `il cielo sopra la facciata vale ${foto.cielo.cima} dell'altezza: il titolo ci deve stare`);
    for (const [a, b] of foto.segno) assert.ok(a >= 0 && b <= 1 && a < b, `banda del segno ${a}-${b}`);
    const css = leggi("app/globals.css").replace(/\/\*[\s\S]*?\*\//g, " ");
    assert.match(css, new RegExp(String.raw`\.dt-od\s*\{[^}]*--dt-od-ar:\s*${w} / ${h};`), "il rapporto della foto nel CSS non è quello di finestra.json");
    const sopra = Number((FINESTRA.sopra * h) / w).toFixed(4);
    assert.match(css, new RegExp(String.raw`--dt-od-sopra:\s*${sopra.replace(".", "\\.")};`), `--dt-od-sopra deve valere ${sopra} (sopra × h / w: il padding in percentuale si misura sulla larghezza)`);
  });

  test("l'offset nel contenuto toglie la scala dello stage", () => {
    const content = { getBoundingClientRect: () => ({ top: 100, width: 1080 }), offsetWidth: 1440 } as unknown as HTMLElement;
    const el = { getBoundingClientRect: () => ({ top: 400 }) } as unknown as Element;
    assert.equal(offsetInside(content, el), 400);
  });

  test("sizes: 100vw a ogni larghezza (A47: la foto intera, larga tutto, nessun cover che ritagli)", () => {
    assert.equal(SIZES_FINESTRA, "100vw");
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
    // A45: il titolo del capitolo sta nella cornice, prima della foto, e il corpo in home non lo ripete.
    // A46 (Alberto, 21 set. 2026, sera): il cielo è trasparente (`-cielo.webp`, scripts/media/cielo.mjs) e il
    // fondo pagina fa da cielo; il titolo è inchiostro. A47 (22 set.): la foto è la facciata che SALE, 9:16,
    // intera (finestra.json), col capitolo posato sopra dal 55 % (la cornice tiene titolo, foto e capitolo)
    // e i marcatori del segno sulle travi (le bande di finestra.json), come sulle teste.
    assert.match(t, /import foto from "\.\.\/lib\/motion\/finestra\.json"/, "OpenDomus.tsx non legge finestra.json (A47)");
    assert.match(t, /src=\{foto\.file\}/, "la finestra non monta il file di finestra.json (A47)");
    assert.doesNotMatch(t, /villa-terrazze-glicine|villa-facciata-sale/, "un percorso della foto scritto a mano");
    assert.match(t, /objectPosition: "50% 0%"/, "la foto della finestra non è ancorata in cima (A47: se il capitolo è più alto della foto, il cover scala dalla cima)");
    assert.match(t, /<div className="dt-od_cornice">\s*<h2 className="dt-od_titolo font-display">\{titolo\}<\/h2>\s*<div className="dt-od_window"/);
    assert.match(t, /foto\.segno\.map\(/, "i marcatori del segno della finestra non vengono da finestra.json");
    assert.match(t, /data-bg="foto"\s+className="dt-od_soggetto"/, "manca il marcatore del segno sulle travi");
    // Il capitolo (il gruppo in attesa) sta DENTRO la cornice, dopo la foto: è lo spazio sopra la foto.
    const cornice = t.indexOf('className="dt-od_cornice"');
    const finestraBox = t.indexOf('className="dt-od_window"', cornice);
    const contenuto = t.indexOf('className="dt-od_content dt-chapter"', finestraBox);
    const pista = t.indexOf('className="dt-od_run"', contenuto);
    assert.ok(cornice > -1 && finestraBox > cornice && contenuto > finestraBox && pista > contenuto, "il capitolo non sta nella cornice dopo la foto (A47)");
    assert.match(t, /<section[^>]*className="dt-od bg-cream"[^>]*data-sopra="foto"/, "la section della finestra non dichiara data-sopra=\"foto\" (A47)");
    const css = leggi("app/globals.css").replace(/\/\*[\s\S]*?\*\//g, " ");
    const titolo = /\.dt-od_titolo\s*\{[^}]*\}/.exec(css)?.[0] ?? "";
    assert.match(titolo, /color:\s*var\(--color-ink\);/, "il titolo della finestra non è inchiostro (A46: «Open Domus» scuro sul cielo che è il fondo, come «ARCHITECTURE» su era)");
    assert.doesNotMatch(titolo, /#fff\b|white/, "il titolo della finestra è ancora bianco (A46)");
    assert.match(t, /\{!finestra && \(\s*<SplitTitle as="h2"/);
    assert.match(t, /sizes=\{SIZES_FINESTRA\}/);
    assert.match(t, /data-corridor="finestra"/);
    assert.match(t, /data-corridor-screen/);
    // A47: la scatola della foto è la sua (`.dt-od_window` col rapporto della sorgente), non il modulo
    // media né le utility lg: la foto è intera a ogni larghezza (il video della storia di Teresa, nel
    // corpo, resta nel modulo media 16:9).
    assert.doesNotMatch(t, /className="dt-od_window[^"]*(dt-media-half|aspect-video)/, "la finestra usa ancora il modulo media o il 16:9 (A47: la foto intera)");
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
    // A47: la scatola della foto ha il rapporto della sorgente (`--dt-od-ar`) a ogni larghezza; da lg la
    // cornice ha lo stesso rapporto e la scatola la riempie (`inset: 0`, come `.dt-testa_foto` da lg): se il
    // capitolo è più alto della foto la cornice cresce e il cover scala dalla cima.
    assert.ok(
      regole.some((r) => /\.dt-od_window$/.test(r.sel) && /aspect-ratio:\s*var\(--dt-od-ar\)/.test(r.body)),
      "la scatola della foto non ha il rapporto della sorgente (A47)",
    );
    assert.ok(
      regole.some((r) => /\.dt-od_cornice$/.test(r.sel) && /aspect-ratio:\s*var\(--dt-od-ar\)/.test(r.body)),
      "la cornice non ha il rapporto della foto da lg (A47)",
    );
    assert.ok(
      regole.some((r) => /\.dt-od_window$/.test(r.sel) && /inset:\s*0/.test(r.body) && /position:\s*absolute/.test(r.body)),
      "da lg la scatola della foto non riempie la cornice (A47)",
    );
    assert.ok(regole.every((r) => !(/\.dt-od_window$/.test(r.sel) && /height:\s*100svh/.test(r.body))), "la foto è ancora ritagliata a uno schermo (A47)");
    assert.ok(regole.some((r) => /\.dt-od_run$/.test(r.sel) && /height:\s*200svh/.test(r.body)));
    // Il capitolo sulla foto: dal 55 % dell'altezza (`--dt-od-sopra`), nel grigio del lockup e senza ombra (A56,
    // 22 set.: «le scritte bianche sopra le immagini, mettile di colore grigio, come quello della hero della
    // scritta "domus"»).
    assert.ok(regole.every((r) => !(/\.dt-od_content$/.test(r.sel) && /padding-top:\s*22svh/.test(r.body))), "la soglia dei 22svh è tornata (A47)");
    const sopra = regole.find((r) => /\.dt-od\[data-sopra="foto"\] \.dt-od_content$/.test(r.sel) && /padding-top:\s*calc\(100% \* var\(--dt-od-sopra\)\)/.test(r.body));
    assert.ok(sopra, "il capitolo non posa sulla foto dal 55 % (A47)");
    assert.match(sopra!.body, /color:\s*var\(--color-graphite\);/, "il capitolo sulla foto non è nel grigio del lockup (A56)");
    assert.doesNotMatch(sopra!.body, /text-shadow|#fff\b/, "il capitolo sulla foto porta ancora il bianco o l'ombra (A56)");
    // I marcatori del segno sulle travi: assoluti nella scatola, larghi tutto (come .dt-testa_soggetto).
    assert.ok(regole.some((r) => /\.dt-od_soggetto$/.test(r.sel) && /position:\s*absolute/.test(r.body) && /pointer-events:\s*none/.test(r.body)), "manca la regola dei marcatori del segno");
    // Il marcatore `foto-chiara` copre la foto fino alla fine dell'area: la facciata continua dopo la pista.
    assert.ok(regole.some((r) => /\.dt-od_mark--f$/.test(r.sel) && /bottom:\s*0/.test(r.body)), "il marcatore foto-chiara non arriva al fondo dell'area (A47)");
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
