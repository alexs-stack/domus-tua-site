// /case/[slug] RESTA FERMA. Alberto il 13 settembre: «Nessun sipario» (A26), e
// la decisione di lavoro D32: la scheda immobile è una pagina di conversione,
// fuori dalla coreografia di A18-A20 (spec §5.4). Il movimento di oggi resta
// com'è. Questo test rilegge i sorgenti della rotta, di PropertyGallery e di
// PropertyCard e fallisce se una primitiva della coreografia ci entra, se una
// classe di transizione cambia o se la guardia MotionFreeze sparisce.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, sep } from "node:path";

const ROOT = process.cwd();
const rel = (p: string) => p.slice(ROOT.length + 1).split(sep).join("/");
function soloCodice(testo: string): string {
  return testo.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}
function sorgenti(dir: string, out: string[] = []): string[] {
  for (const nome of readdirSync(dir)) {
    const p = join(dir, nome);
    if (statSync(p).isDirectory()) sorgenti(p, out);
    else if (/\.(tsx|ts)$/.test(nome)) out.push(p);
  }
  return out;
}

const FILES = [
  ...sorgenti(join(ROOT, "app", "case", "[slug]")),
  join(ROOT, "app", "components", "PropertyGallery.tsx"),
  join(ROOT, "app", "components", "PropertyCard.tsx"),
].map((p) => ({ path: rel(p), code: soloCodice(readFileSync(p, "utf8")) }));

const PRIMITIVE = [
  "RevealGroup",
  "SplitTitle",
  "ScriptWord",
  "Lead",
  "Hairline",
  "ClipMedia",
  "useCorridor",
  "useAmbientVideo",
  "reveal-engine",
  "text-roles",
  "PageHeroTesta",
  "MarkSegno",
  // La lama (A36): su /case/[slug] nessun modulo entra col ritaglio (A26/D32, D205).
  "LamaMedia",
  "data-lama",
];

/** Le classi di movimento di oggi, file per file (13 settembre 2026). */
const CLASSI_FERME: Record<string, string[]> = {
  "app/case/[slug]/ListingCopy.tsx": [],
  "app/case/[slug]/PropertyDetail.tsx": ["duration-300", "transition-colors", "transition-transform"],
  "app/case/[slug]/PropertyFacts.tsx": ["transition-colors"],
  "app/case/[slug]/TerritoryDistanceExplorer.tsx": ["transition-opacity"],
  "app/case/[slug]/VivereInZona.tsx": ["transition-colors"],
  "app/case/[slug]/page.tsx": [],
  "app/components/PropertyCard.tsx": [
    "duration-300",
    "duration-[1600ms]",
    "ease-[cubic-bezier(0.16,1,0.3,1)]",
    "transition-all",
    "transition-colors",
    "transition-transform",
  ],
  "app/components/PropertyGallery.tsx": [
    "duration-300",
    "duration-500",
    "ease-[cubic-bezier(0.32,0.72,0,1)]",
    "ease-soft",
    "transition-all",
    "transition-opacity",
    "transition-transform",
  ],
};
const MOTO = /(?<![\w-])(?:duration|ease|delay)-[\w[\]().,%-]+|(?<![\w-])transition(?:-[\w[\]().,%-]+)?(?![\w-])/g;

describe("/case/[slug] fuori dalla coreografia", () => {
  test("l'elenco dei file presidiati è quello di oggi", () => {
    assert.deepEqual(
      FILES.map((f) => f.path).sort(),
      Object.keys(CLASSI_FERME).sort(),
      "un file è entrato o uscito da app/case/[slug]: va deciso se resta fermo e aggiunto qui",
    );
  });

  test("nessuna primitiva della coreografia è importata", () => {
    const re = new RegExp(String.raw`from\s+["'][^"']*\b(?:${PRIMITIVE.join("|")})["']`);
    const colpevoli = FILES.filter((f) => re.test(f.code)).map((f) => f.path);
    assert.deepEqual(colpevoli, []);
  });

  test("nessun attributo della coreografia", () => {
    const re = /data-reveal=|data-reveal-group|data-corridor|data-bg|data-dive/;
    const colpevoli = FILES.filter((f) => re.test(f.code)).map((f) => f.path);
    assert.deepEqual(colpevoli, []);
  });

  test("le classi duration-*, ease-*, delay-*, transition* sono quelle di oggi", () => {
    for (const f of FILES) {
      const trovate = [...new Set(f.code.match(MOTO) ?? [])].sort();
      assert.deepEqual(trovate, CLASSI_FERME[f.path], `${f.path}: classi di movimento cambiate`);
    }
  });

  test("il boot script del layout non arma nessun sipario su /case/* (A26, D32)", () => {
    // Alberto il 13 settembre 2026, «Nessun sipario» (A26): su /case/* né film
    // né porta corta: `!caso` sta nel gate comune di film e corta, e nessun ramo
    // del boot script arma un sipario apposta per /case/* (D32).
    const layout = readFileSync(join(ROOT, "app/layout.tsx"), "utf8");
    const m = layout.match(/const preloaderBootScript = `([^`]*)`/);
    assert.ok(m, "preloaderBootScript non trovato in app/layout.tsx");
    const script = m![1];
    assert.ok(script.includes('var caso=p.indexOf("/case/")===0;'), "il boot script non riconosce /case/*");
    const gate = /var gate=([^;]*);/.exec(script);
    assert.ok(gate && gate[1].split("&&").includes("!caso"), "gate senza !caso: su /case/* suonerebbe un sipario");
    assert.match(script, /var pre=gate&&home&&/);
    assert.match(script, /var short=gate&&!pre&&/);
    assert.doesNotMatch(script, /\(caso&&/);
  });

  test("Contact senza gesture", () => {
    const colpevoli = FILES.filter((f) => /<Contact\b[^>]*\bgesture\b/.test(f.code)).map((f) => f.path);
    assert.deepEqual(colpevoli, []);
  });

  test("page.tsx avvolge Header, scheda, Footer e WhatsApp in MotionFreeze", () => {
    const page = FILES.find((f) => f.path === "app/case/[slug]/page.tsx")!.code;
    assert.match(page, /import MotionFreeze from "\.\.\/\.\.\/components\/motion\/MotionFreeze";/);
    assert.match(page, /<MotionFreeze>\s*<Header \/>\s*<PropertyDetail [^>]*\/>\s*<Footer \/>\s*<WhatsAppFloat \/>\s*<\/MotionFreeze>/);
  });

  test("PropertyDetail legge ancora il vocabolario di prima (dur.micro, stagger.chars)", () => {
    const detail = FILES.find((f) => f.path === "app/case/[slug]/PropertyDetail.tsx")!.code;
    assert.match(detail, /\bdur\.micro\b/);
    assert.match(detail, /\bstagger\.chars\b/);
    const gsapTs = readFileSync(join(ROOT, "app/lib/motion/gsap.ts"), "utf8");
    assert.match(gsapTs, /micro: 0\.3,/);
    assert.match(gsapTs, /chars: 0\.06,/);
  });
});

describe("dentro la guardia Reveal e la sua CSS sono quelli di oggi", () => {
  test("Reveal.tsx tiene l'implementazione di oggi per la guardia", () => {
    const reveal = soloCodice(readFileSync(join(ROOT, "app/components/Reveal.tsx"), "utf8"));
    assert.match(reveal, /function FrozenReveal\(/);
    assert.match(reveal, /useMotionFrozen\(\)/);
    assert.match(reveal, /\{ threshold: 0\.12, rootMargin: "0px 0px -8% 0px" \}/);
    assert.match(reveal, /window\.setTimeout\(\(\) => setShown\(true\), 2500\)/);
    assert.match(reveal, /className=\{`reveal \$\{shown \? "is-in" : ""\} \$\{className\}`\}/);
  });

  test("globals.css tiene il blocco congelato: 0,9 s out-expo da 2,5rem, senza JS pieno", () => {
    const css = soloCodice(readFileSync(join(ROOT, "app/globals.css"), "utf8"));
    assert.match(
      css,
      /\[data-motion-freeze\] \.reveal \{\s*opacity: 0;\s*transform: translateY\(2\.5rem\);\s*transition: opacity 0\.9s var\(--ease-out-expo\), transform 0\.9s var\(--ease-out-expo\);\s*\}/,
    );
    assert.match(css, /\[data-motion-freeze\] \.reveal\.is-in \{\s*opacity: 1;\s*transform: translateY\(0\);\s*\}/);
    assert.match(css, /@media \(scripting: none\) \{\s*\[data-motion-freeze\] \.reveal \{\s*opacity: 1;\s*transform: none;/);
    // chrome dell'interfaccia fermo sotto la guardia (spec §5.4); il commit 21 allunga la lista
    assert.match(
      css,
      /:root:has\(\[data-motion-freeze\]\) :is\(\.t-panel-slide, \.t-dropdown, \.dt-social__tip[^)]*\) \{\s*transition: none !important;/,
    );
  });
});
