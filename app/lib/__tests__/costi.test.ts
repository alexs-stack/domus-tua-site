// IL NASTRO DI COSTI CHIARI: LA FACCIATA CON LA RIGA SUL CIELO, CARMINE E SEGUICI (A72).
//
// A72 di Alberto (22 set. 2026, notte): «togliamo il video della piscina, e mettiamo un'altra immagine
// no-bg alta: villa-facciata-piscina-alta-cielo.webp, stesso stile e animazione dello sticky scroll che
// poi diventa scroll orizzontale, ed entra la sezione di Carmine e Seguici». D28 lo vuole solo in home.
// Com'è fatto oggi: app/lib/motion/costi.ts tiene i numeri come dati puri; CostiChiari.tsx monta
// HorizonScroller con l'arrivo (`lead`) e la firma del registro (D18: dtTappe, scrub true), Carmine come
// pannello (FeaturedTestimonial `panel`, la foto che affonda agganciata al track con useHorizonTrack)
// e Seguici (Social); la banda dell'acqua è uscita dal codice (ambient-video.test.ts). Qui si rileggono
// numeri, file, markup e CSS; il movimento lo misura e2e/home.spec.ts sul build. I commenti vanno via
// prima di cercare, come in logo-colore.test.ts.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { COSTI, SIZES_COSTI, arrivoDistance } from "../motion/costi";
import { chapters, scrubOf } from "../motion/chapters";

const ROOT = process.cwd();
const leggi = (p: string) => readFileSync(join(ROOT, p), "utf8");
function soloCodice(testo: string): string {
  return testo.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

describe("i numeri del nastro di Costi chiari (A72)", () => {
  test("il titolo a 12svh, quattro pannelli, la foto larga tutto, il tetto a metà delle lettere (A65)", () => {
    assert.equal(COSTI.rigaTop, "12svh");
    assert.equal(COSTI.panels, 4);
    assert.equal(COSTI.copri, 0.5);
    assert.equal(COSTI.cimaTitolo, 0.332);
    assert.equal(SIZES_COSTI, "100vw");
  });

  test("l'arrivo: tetto × altezza − metà del titolo, mai negativo (D-A72-1, A65)", () => {
    // 1440 × 900 (1425 px utili con la barra): la foto è alta 2124 px (1425 × 3816 / 2560), il tetto sotto il
    // titolo a 0,332 → 705,2 px; il titolo sta a 108 px (12svh) ed è alto 292 (tre righe a 7,5vw): metà a
    // 254. La scatola sale di ~451 px.
    assert.ok(Math.abs(arrivoDistance({ fotoH: 2124, copri: 108 + 0.5 * 292 }) - (0.332 * 2124 - 254)) < 1e-9);
    assert.ok(Math.abs(arrivoDistance({ fotoH: 2124, copri: 254 }) - 451.2) < 0.1);
    // 1024 × 768 (1009 utili): la foto è alta 1504 px, il titolo a 92 px e alto 208: la scatola sale di ~303 px.
    assert.ok(Math.abs(arrivoDistance({ fotoH: 1504, copri: 92 + 0.5 * 208 }) - 303.3) < 0.1);
    // Mai negativa.
    assert.equal(arrivoDistance({ fotoH: 100, copri: 400 }), 0);
    assert.equal(arrivoDistance({ fotoH: 0, copri: 0 }), 0);
  });

  test("costi.json, il CSS e il file dicono la stessa geometria", async () => {
    const foto = JSON.parse(leggi("app/lib/motion/costi.json")) as {
      file: string;
      sorgente: [number, number];
      cielo: { linea: number; cima: number };
      segno: number[][];
    };
    assert.equal(foto.file, "/images/reali/villa-facciata-piscina-alta-cielo.webp");
    const percorso = join(ROOT, "public", foto.file);
    assert.ok(existsSync(percorso), `manca ${foto.file}`);
    const m = await sharp(percorso).metadata();
    assert.deepEqual([m.width, m.height], foto.sorgente, "la sorgente di costi.json non è il file");
    assert.equal(m.hasAlpha, true, "il cielo deve essere trasparente (la carta)");
    assert.ok(foto.cielo.cima > 0.1 && foto.cielo.cima < 0.4, `cima ${foto.cielo.cima}: le punte dei cipressi stanno nel primo terzo`);
    // COSTI.cimaTitolo è il tetto piatto sotto il titolo (dal 45 al 92 % della larghezza): la prima riga opaca lì.
    const { data, info } = await sharp(percorso).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let tetto = 1;
    for (let y = 0; y < info.height && tetto === 1; y++) {
      for (let x = Math.round(0.45 * info.width); x < Math.round(0.92 * info.width); x++) {
        if (data[(y * info.width + x) * 4 + 3] > 128) {
          tetto = y / info.height;
          break;
        }
      }
    }
    assert.ok(Math.abs(tetto - COSTI.cimaTitolo) < 0.006, `il tetto sotto il titolo sta a ${tetto.toFixed(3)}, COSTI.cimaTitolo dice ${COSTI.cimaTitolo}`);
    assert.ok(tetto > foto.cielo.cima, "sotto il titolo il cielo scende più giù delle punte dei cipressi");
    assert.ok(foto.segno.length >= 1 && foto.segno.every(([a, z]) => a < z && a >= 0 && z <= 1));
    const css = leggi("app/globals.css").replace(/\/\*[\s\S]*?\*\//g, " ");
    const [w, h] = foto.sorgente;
    assert.match(css, new RegExp(String.raw`\.dt-cc\s*\{[^}]*--dt-cc-ar:\s*${w} / ${h};`), "il rapporto della foto nel CSS non è quello di costi.json");
    assert.match(css, new RegExp(String.raw`\.dt-cc\[data-on\] \.dt-cc_riga\s*\{[^}]*position:\s*absolute;[^}]*top:\s*${COSTI.rigaTop};`), "la riga del nastro non posa a COSTI.rigaTop");
    assert.match(css, /\.dt-cc\[data-on\] \.dt-cc_panel--foto\s*\{[^}]*overflow:\s*clip/, "nel nastro il pannello della foto deve ritagliare la cornice che sale");
    // Con .dt-horizon_panel nel selettore: senza, la regola generica del nastro (100vw, più in basso) vince.
    assert.match(css, /\.dt-cc\[data-on\] \.dt-horizon_panel\.dt-cc_panel--claim\s*\{[^}]*width:\s*60vw/, "il claim, testo solo, è largo 60vw: niente carta vuota nel nastro");
    assert.match(css, /\.dt-cc_window\s*\{[^}]*background-color:\s*var\(--color-cream\)/, "la finestra posa sulla carta");
  });
});

describe("dove vive il nastro (D28) e com'è fatto", () => {
  test("solo la home monta il nastro; /vendi resta la riga", () => {
    assert.match(soloCodice(leggi("app/page.tsx")), /<CostiChiari nastro \/>/);
    assert.doesNotMatch(soloCodice(leggi("app/page.tsx")), /<FeaturedTestimonial\b|<Social\b/);
    assert.match(soloCodice(leggi("app/vendi/VendiContent.tsx")), /<CostiChiari surface="cream" \/>/);
  });

  test("CostiChiari monta HorizonScroller con l'arrivo, la firma del registro, Carmine e Seguici; niente coda, niente acqua", () => {
    const src = soloCodice(leggi("app/components/CostiChiari.tsx"));
    assert.match(src, /<HorizonScroller[\s\S]*corridor="costi"/);
    assert.match(src, /ease=\{chapters\.costi\.signature\.ease\}/);
    assert.match(src, /scrub=\{scrubOf\("costi"\)\}/);
    assert.match(src, /lead=\{\{\s*selector: "\.dt-cc_window"/);
    assert.match(src, /copri = riga && titolo \? riga\.offsetTop \+ titolo\.offsetTop \+ COSTI\.copri \* titolo\.offsetHeight : 0/);
    assert.match(src, /arrivoDistance\(\{ fotoH: el\.offsetHeight, copri \}\)/);
    assert.doesNotMatch(src, /tail=\{/, "nessuna coda (D-A72-3)");
    assert.doesNotMatch(src, /ChiusuraFoto|CORNICE_LG|useAmbientVideo|<video|data-acqua-band/);
    assert.match(src, /<FeaturedTestimonial panel \/>/);
    assert.match(src, /<Social \/>/);
    // Il titolo prima della foto nel DOM (l'ordine di lettura), in inchiostro, per lettera, a destra;
    // la foto intera col rapporto della sorgente e le bande del segno; poi il claim con occhiello,
    // prima frase in d2, intro, righe del mandato e il rilancio pieno dell'hero (A66).
    const riga = src.indexOf('className="dt-cc_riga');
    const cornice = src.indexOf('className="dt-cc_cornice"');
    const claim = src.indexOf("dt-cc_panel--claim");
    assert.ok(riga > 0 && cornice > riga && claim > cornice, "titolo, poi cornice, poi il claim");
    assert.match(src, /<SplitTitle as="h2" className="dt-cc_titolo font-display lg:ml-auto lg:w-\[52vw\] lg:text-right">/);
    assert.match(src, /<SplitTitle as="h3" className="mt-6 font-display text-d2">\s*\{claim\}/);
    assert.match(src, /<Lead className="mt-6 max-w-\[40ch\]">\{intro\}<\/Lead>/);
    assert.match(src, /\{c\.first\} \{c\.noSale\}/);
    assert.match(src, /<Cta href="#contatti" variant="cta-solid" size="lg" className="mt-8">/);
    assert.match(src, /const taglio = c\.lead\.indexOf\("\. "\);/);
    assert.match(src, /sizes=\{SIZES_COSTI\}/);
    assert.match(src, /className="dt-cc_soggetto"/);
    assert.match(src, /import foto from "\.\.\/lib\/motion\/costi\.json"/);
  });

  test("Carmine: il pannello col sipario del nastro e la foto che affonda agganciata al track", () => {
    const src = soloCodice(leggi("app/components/FeaturedTestimonial.tsx"));
    assert.match(src, /panel\?: boolean;/);
    assert.doesNotMatch(src, /\bgesture\b/, "gesture è morta con A72");
    assert.match(src, /<a\s+ref=\{frameRef\}\s+data-horizon-slide\s+data-sink-frame\s+data-bg="foto"/);
    assert.match(src, /<div data-horizon-slide-img className="absolute inset-0">\s*<div ref=\{sinkRef\} data-sink=""/);
    assert.match(src, /useHorizonTrack\(\)/);
    assert.match(src, /containerAnimation: tween/);
    assert.match(src, /start: "left right",\s*end: "right left"/);
    assert.match(src, /<div className="dt-horizon_panel dt-cc_panel dt-cc_panel--carmine/);
  });

  test("Seguici: il pannello col titolo per lettera e il congedo allo sgancio", () => {
    const src = soloCodice(leggi("app/components/Social.tsx"));
    assert.match(src, /<div className="dt-horizon_panel dt-cc_panel dt-cc_panel--seguici/);
    assert.match(src, /data-seguici-congedo/);
    assert.match(src, /useHorizonTrack\(\)/);
    assert.match(src, /start: "bottom bottom"/);
    assert.match(src, /<SplitTitle as="h2"/);
    assert.doesNotMatch(src, /data-horizon-stair/);
  });

  test("HorizonScroller: il canale del track chiama gli iscritti quando il track esiste e li pulisce con lui", () => {
    const src = soloCodice(leggi("app/components/motion/HorizonScroller.tsx"));
    assert.match(src, /export function useHorizonTrack\(\): TrackSub \| null/);
    assert.match(src, /live\.current = \{ tween, screen \};\s*for \(const cb of subs\.current\.keys\(\)\) subs\.current\.set\(cb, cb\(tween, screen\) \|\| undefined\);/);
    assert.match(src, /live\.current = null;/);
    assert.match(src, /<TrackSlot\.Provider value=\{subscribe\}>/);
  });

  test("il registro: dtTappe in gsap.ts con le cifre del registro, scrub true, gli inneschi di Carmine e Seguici", () => {
    const costi = chapters.costi;
    assert.equal(costi.signature.ease, "dtTappe");
    assert.ok(costi.signature.curve?.startsWith("M0,0 C0.08,0 0.15,0.239 0.22,0.27"), "la curva a tappe del registro");
    assert.equal(scrubOf("costi"), true);
    const gsapTs = soloCodice(leggi("app/lib/motion/gsap.ts"));
    assert.ok(gsapTs.includes(`CustomEase.create("dtTappe", "${costi.signature.curve}");`), "gsap.ts registra dtTappe con le cifre del registro");
    assert.doesNotMatch(gsapTs, /dtPosa/, "la curva di prima (dtPosa) è morta");
    assert.deepEqual("st" in costi.signature.trigger ? costi.signature.trigger.st : null, ["top+=arrivo top", "top+=arrivo+corsa top"]);
    assert.deepEqual((costi.secondary ?? []).map((s) => s.ease), ["none", "dtOut"]);
    const t = chapters.testimonianza.signature;
    assert.deepEqual("st" in t.trigger ? t.trigger.st : null, ["left right", "right left"]);
    const s = chapters.social.signature;
    assert.ok("st" in s.trigger && s.trigger.st[0] === "bottom bottom");
  });
});
