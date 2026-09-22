// Il tuffo dell'hero e il foglio di Posizionamento, letti dal sorgente.
//
// Alberto ha chiesto il 13 settembre 2026 la coreografia piena (A18), i
// corridoi sticky dove servono (A19) e la fedeltà letterale a era-residence
// (A20); per l'hero le lettere piatte (A22) e la foto che sale fino a
// 0,80·tImg (A23). Spec coreografia §3.2-§3.3. Schema di intro-clocks.test.ts:
// regex sul sorgente, commenti tolti prima di cercare (soloCodice di
// app/components/__tests__/logo-colore.test.ts).
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { chapters } from "../motion/chapters";
import { kernBetween } from "../motion/kern";
import { heroCinematic } from "../media";
import SplitChars from "../../components/motion/SplitChars";

const root = join(__dirname, "..", "..", "..");
const read = (rel: string) => readFileSync(join(root, rel), "utf8");
const soloCodice = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1");

const hero = soloCodice(read("app/components/HeroCinematic.tsx"));
const pos = soloCodice(read("app/components/Posizionamento.tsx"));
const fold = soloCodice(read("app/lib/motion/fold.ts"));
const gsapTs = read("app/lib/motion/gsap.ts");
const css = read("app/globals.css");
// Il commento di contratto di page.tsx è un commento JSX: si legge com'è, senza soloCodice.
const pageTsx = read("app/page.tsx");

/** Larghezza e altezza di un JPEG dal marcatore SOF. */
function jpegSize(buf: Buffer): { w: number; h: number } {
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) {
      i += 1;
      continue;
    }
    const marker = buf[i + 1];
    const len = buf.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
    }
    i += 2 + len;
  }
  throw new Error("marcatore SOF non trovato");
}

// La stessa stringa di MQ_CORRIDOIO in corridor-contract.test.ts (commit 7): così quel test
// legge anche il blocco del foglio e ne presidia gli overflow.
const GATE = "@media (min-width: 1024px) and (min-height: 640px) and (prefers-reduced-motion: no-preference)";

describe("HeroCinematic: il DOM del tuffo", () => {
  test("lo zoom ha già in SSR l'altezza resa della foto, col rapporto dei due file (A44), ancorato in basso", () => {
    // A44 (20 set. 2026): due file (2:3 da 768, 9:16 sotto), il rapporto sta nel token
    // `--dt-hero-ar` di globals.css, letto dalla classe aspect; il riquadro è ancorato in basso.
    const css = readFileSync(join(root, "app/globals.css"), "utf8");
    // A55 (22 set.): i due file sono quelli di media.ts — la foto vera della piscina, 3:2 e 9:16 —
    // e le misure dichiarate lì (`baseSize`, `baseMSize`) devono essere quelle dei file.
    const d = jpegSize(readFileSync(join(root, "public", heroCinematic.base)));
    const t = jpegSize(readFileSync(join(root, "public", heroCinematic.baseM)));
    assert.deepEqual({ w: d.w, h: d.h }, { ...heroCinematic.baseSize }, "baseSize di media.ts non è la misura del file");
    assert.deepEqual({ w: t.w, h: t.h }, { ...heroCinematic.baseMSize }, "baseMSize di media.ts non è la misura del file");
    assert.match(css, new RegExp(`--dt-hero-ar:\\s*${t.w} / ${t.h};`), "il rapporto del telefono nel token");
    assert.match(css, new RegExp(`@media \\(min-width: 48rem\\) \\{\\s*:root \\{\\s*--dt-hero-ar:\\s*${d.w} / ${d.h};`), "il rapporto del desktop da 768");
    const m = hero.match(/data-hero-zoom\s+className="([^"]*)"/);
    assert.ok(m, "manca il div data-hero-zoom con la sua classe");
    for (const cls of ["absolute", "inset-x-0", "bottom-0", "min-h-full", "aspect-[var(--dt-hero-ar)]", "origin-[50%_75%]"]) {
      assert.ok(m![1].split(/\s+/).includes(cls), `data-hero-zoom senza la classe ${cls}`);
    }
    assert.ok(!m![1].split(/\s+/).includes("top-0"), "data-hero-zoom non è più ancorato in alto");
    // Si parte dal TAG: i selettori `[data-hero-zoom]` e `[data-hero-lift]` compaiono anche nelle misure e nella timeline.
    const zoom = hero.search(/<div\s+data-hero-zoom\b/);
    assert.ok(zoom > -1, "manca il tag <div data-hero-zoom>");
    const lift = zoom + hero.slice(zoom).search(/<div\s+data-hero-lift\b/);
    const img = hero.indexOf("<picture", zoom);
    const video = hero.indexOf("<video", zoom);
    assert.ok(img > zoom && img < lift, "il <picture> dell'hero non sta dentro data-hero-zoom");
    assert.ok(video > zoom && video < lift, "il video dell'hero non sta dentro data-hero-zoom");
  });

  // A55 (Alberto, 22 set. 2026: «vorrei invertire le posizioni di questa immagine con quella della
  // hero»): l'hero è la foto vera della piscina che stava in Paths, e la scena generata di A44/A45
  // sta in Paths. Raffaela è al centro della foto: il lockup, che stava al centro della banda, sta in
  // basso e da lg a destra, così nessuna lettera la copre (A27: la cliente intera, mai coperta).
  test("A55: l'hero è la foto della piscina, la scena generata sta in Paths, il lockup in basso a destra", () => {
    assert.equal(heroCinematic.base, "/media/hero-raffaela-piscina.jpg");
    assert.equal(heroCinematic.baseM, "/media/hero-raffaela-piscina-m.jpg");
    const paths = soloCodice(read("app/components/Paths.tsx"));
    assert.match(paths, /image:\s*"\/media\/hero-raffaela-villa\.jpg"/, "Paths (acquista) non mostra la scena generata dell'hero di prima");
    assert.doesNotMatch(paths, /villa-pool\.jpg/, "villa-pool.jpg è l'hero: in Paths non torna");
    const m = hero.match(/data-hero-lift\s+className="([^"]*)"/);
    assert.ok(m, "manca il div del lockup con data-hero-lift");
    const classi = m![1].split(/\s+/);
    for (const cls of ["justify-end", "lg:items-end", "lg:text-right"]) assert.ok(classi.includes(cls), `il lockup senza ${cls}`);
    assert.ok(!classi.includes("justify-center"), "il lockup è tornato al centro della banda, sopra Raffaela");
    // Da lg le lettere scendono a 10,5vw (`--text-hero-lg`): a 13vw la «D» di «Domus» le copriva le
    // gambe a 1440 e a 1024. Il telefono e il lockup del preloader restano a `--text-hero`.
    assert.match(hero, /font-brand text-hero [^"]*lg:text-\(length:--text-hero-lg\)/, "il lockup dell'hero senza la misura ridotta da lg");
    assert.match(css, /--text-hero-lg:\s*clamp\(3\.1rem, 10\.5vw, 13rem\);/, "manca il token --text-hero-lg in globals.css");
    const shell = read("app/components/motion/PreloaderShell.tsx");
    assert.doesNotMatch(shell, /--text-hero-lg/, "il lockup del preloader non deve seguire la misura ridotta dell'hero");
  });

  test("la banda resta quella del patto: nessun data- e nessuno style fra data-hero-media e il token", () => {
    assert.match(
      hero,
      /<div\s+data-hero-media\s+className="relative flex h-\[var\(--dt-band-h\)\] w-full flex-col bg-cream-deep"\s*>/,
    );
  });

  test("il marcatore data-bg sta fuori dallo schermo sticky (correzione bloccante 4 di homeA)", () => {
    const bg = hero.indexOf('data-bg="foto"');
    const screen = hero.indexOf("data-corridor-screen");
    assert.ok(bg > -1 && screen > -1, "manca il marcatore o lo schermo");
    assert.ok(bg < screen, "data-bg è dentro o dopo lo schermo sticky");
    assert.equal(hero.split('data-bg="foto"').length - 1, 1, "un marcatore solo in #top");
  });

  test("nessun tween su un nodo con utility translate-* (correzione bloccante 2 di homeA)", () => {
    assert.doesNotMatch(hero, /<[^<>]*data-hero-lift[^<>]*translate-/);
    assert.doesNotMatch(hero, /<[^<>]*data-hero-block-lift[^<>]*translate-/);
    assert.match(hero, /<span\s+data-hero-script[^>]*translate-y-\[26%\]/);
  });

  test("section#top è il corridoio hero con lo spaziatore nascosto in SSR", () => {
    assert.match(hero, /<section\s+ref=\{sectionRef\}\s+id="top"\s+data-corridor="hero"\s+data-stick="bottom"/);
    assert.match(hero, /<div\s+data-corridor-run\s+aria-hidden\s+className="hidden"\s*\/>/);
    assert.match(hero, /useCorridor\(sectionRef,\s*\{\s*id:\s*"hero",\s*stick:\s*"bottom"/);
  });

  test("nessun pin di GSAP e nessuna prospettiva (A22)", () => {
    assert.doesNotMatch(hero, /\bpin\s*:|pinSpacing|anticipatePin/);
    assert.doesNotMatch(hero, /transformPerspective|perspective\(/);
  });

  test("le lettere prendono i ruoli title e accent, con origine e overwrite, non dur.hero", () => {
    assert.match(hero, /ROLES\.title\.enter/);
    assert.match(hero, /ROLES\.accent\.enter/);
    assert.match(hero, /accent\.origin/);
    assert.equal((hero.match(/overwrite:\s*true/g) ?? []).length, 3, "i tre fromTo delle lettere senza overwrite: true (spec §2.2)");
    assert.doesNotMatch(hero, /dur\.hero/);
    assert.doesNotMatch(gsapTs, /\bhero:\s*1\.4/);
  });

  test("lettere spezzate da SplitChars con la crenatura del loro font (spec §2.2, D20)", () => {
    assert.doesNotMatch(hero, /function Chars\b|<Chars\b/);
    assert.equal((hero.match(/<SplitChars[^>]*font="brand-800"[^>]*charAttr="data-hero-char"/g) ?? []).length, 2, "lockup: Domus e Tua");
    assert.equal(
      (hero.match(/<SplitChars[^>]*font="display-500"[^>]*\bupper\b[^>]*charAttr="data-hero-tchar"/g) ?? []).length,
      2,
      "H1: title1 e title2, maiuscolo come ogni h1",
    );
    assert.equal((hero.match(/<SplitChars[^>]*font="script-400"[^>]*charAttr="data-hero-schar"/g) ?? []).length, 1, "firma");
  });

  test("rete da fold.ts con la keyframe dell'hero, sipario con afterCurtain, riarmo al cambio lingua", () => {
    assert.doesNotMatch(hero, /function heroNetFired/);
    assert.match(hero, /foldNetFired\(allChars\[0\], "dt-rest-failsafe"\)/);
    assert.match(hero, /if \(html\.hasAttribute\("data-preloader"\)\) return afterCurtain\(play\);/);
    assert.doesNotMatch(hero, /curtainPending/);
    assert.match(hero, /\{ scope: sectionRef, dependencies: \[locale\], revertOnUpdate: true \}/);
    assert.match(hero, /gsap\.set\(allChars, \{ opacity: painted \}\);/);
  });

  test("il fuoco non sposta la pagina se l'elemento è in vista e dentro il ritaglio del blocco", () => {
    assert.match(hero, /focus:\s*\(el, st\) =>/);
    assert.match(hero, /querySelector\("\[data-hero-block\]"\)/);
    assert.match(hero, /return dentro \? null : st\.start;/);
  });

  test("nessuna salita della foto (A44: riquadro ancorato in basso, t′ = banda) e le due ease del tuffo", () => {
    assert.doesNotMatch(hero, /0\.8\s*\*\s*tImg/, "la salita a 0,80·tImg (A23) scoprirebbe il fondo sotto il riquadro ancorato in basso");
    assert.match(hero, /return \{ bandH, tPrime: bandH \};/);
    assert.match(hero, /const svh = \(\) => window\.innerHeight \/ 100;/, "il svh del telefono non è più la banda / 60");
    assert.match(hero, /ease:\s*"dtEase"/);
    assert.match(hero, /ease:\s*chapters\.hero\.signature\.ease/);
  });
});

describe("gsap.ts e chapters.ts: le firme del tuffo e del foglio", () => {
  test("dtEase e dtIn sono CustomEase una per riga coi valori di Era", () => {
    assert.match(gsapTs, /^CustomEase\.create\("dtEase", "0\.25,0\.1,0\.25,1"\);$/m);
    assert.match(gsapTs, /^CustomEase\.create\("dtIn", "0\.5,0,0\.75,0"\);$/m);
  });

  test("chapters.hero: dtIn, scrub true, da #top a bottom bottom, salita dtEase", () => {
    const s = chapters.hero.signature;
    assert.equal(s.ease, "dtIn");
    assert.ok("scrub" in s.time && s.time.scrub === true);
    assert.ok("st" in s.trigger && s.trigger.st[1] === "bottom bottom" && s.trigger.el === "#top");
    assert.ok((chapters.hero.secondary ?? []).some((x) => x.ease === "dtEase"));
  });

  test("chapters.posizionamento: none, scrub 0,8, h2 top bottom → center top", () => {
    const s = chapters.posizionamento.signature;
    assert.equal(s.ease, "none");
    assert.ok("scrub" in s.time && s.time.scrub === 0.8);
    assert.ok("st" in s.trigger);
    if ("st" in s.trigger) assert.deepEqual(s.trigger.st, ["top bottom", "center top"]);
  });
});

describe("globals.css: la corsa e il foglio in CSS prima del paint", () => {
  test("la corsa dell'hero è 200svh", () => {
    assert.match(css, /\[data-corridor="hero"\]\s*\{\s*--corridor-run:\s*200svh;\s*\}/);
  });

  test("margine del foglio, ritaglio del blocco e marcatore solo sotto il gate", () => {
    for (const sel of [
      '[data-corridor="hero"] + [data-hero-cover]',
      '[data-corridor="hero"] [data-hero-block]',
      '[data-corridor="hero"] > [data-bg="foto"]',
    ]) {
      const i = css.indexOf(`:root[data-hero-intro] ${sel}`);
      assert.ok(i > -1, `regola assente: ${sel}`);
      const media = css.lastIndexOf("@media", i);
      assert.equal(css.slice(media, css.indexOf("{", media)).trim(), GATE, `${sel} fuori dal gate`);
    }
    assert.equal(css.split("[data-hero-cover]").length - 1, 1, "una regola sola per il foglio, dentro il gate");
    assert.doesNotMatch(css, /\[data-hero-block\]\s*\{[^}]*overflow:\s*hidden/);
  });
});

describe("Posizionamento: il foglio e le parole", () => {
  test("via la Parallax (D23), la section è il foglio, le parole leggono chapters.posizionamento", () => {
    assert.doesNotMatch(pos, /import Parallax|<Parallax/);
    assert.match(pos, /<section\s+data-hero-cover\s+className="dt-chapter bg-cream"/);
    assert.match(pos, /chapters\.posizionamento\.signature/);
    assert.match(pos, /invalidateOnRefresh:\s*true/);
    assert.match(pos, /revertOnUpdate:\s*true/);
  });
});

describe("le primitive che il commit 8 allarga", () => {
  test("SplitChars con charAttr: l'attributo dell'hero su ogni carattere, --k invariato", () => {
    const html = renderToStaticMarkup(
      // eslint-disable-next-line react/no-children-prop -- file .ts senza JSX: `children` è un prop obbligatorio di SplitCharsProps
      createElement(SplitChars, { font: "brand-800", locale: "it", upper: false, charAttr: "data-hero-char", children: "Domus" }),
    );
    assert.equal((html.match(/data-hero-char=""/g) ?? []).length, 5);
    const lettere = Array.from("Domus");
    for (let i = 0; i < lettere.length - 1; i += 1) {
      const k = kernBetween("brand-800", lettere[i], lettere[i + 1], false, "it");
      if (k !== 0) assert.match(html, new RegExp(`style="--k:${k}em">${lettere[i]}</span>`));
    }
    // eslint-disable-next-line react/no-children-prop -- file .ts senza JSX: `children` è un prop obbligatorio di SplitCharsProps
    const senza = renderToStaticMarkup(createElement(SplitChars, { font: "brand-800", locale: "it", upper: false, children: "Domus" }));
    assert.doesNotMatch(senza, /data-hero-/);
  });

  test("foldNetFired accetta la keyframe, default dt-reveal-failsafe", () => {
    assert.match(
      fold,
      /export function foldNetFired\(el: Element, keyframe: "dt-reveal-failsafe" \| "dt-rest-failsafe" = "dt-reveal-failsafe"\): boolean/,
    );
    assert.match(fold, /animationName === keyframe/);
  });

  test("il commento di contratto di page.tsx conta il tuffo fra i corridoi", () => {
    assert.doesNotMatch(pageTsx, /Tre nastri pilotati dallo/);
    assert.doesNotMatch(pageTsx, /nessun'altra sezione\s+pinnata/);
    assert.match(pageTsx, /il\s+tuffo\s+dell'hero/);
  });
});
