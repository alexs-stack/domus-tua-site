// A20 di Alberto («Fedeltà letterale»: flip per lettera su tutti i titoli), spec §2.3 e §5.3:
// i 32 punti di chiamata di TextLines, i quattro titoli semplici (Services h3,
// DomusDocProtocol h3, OpenDomus h3, Method h4 su /metodo) e i 35 titoli display nudi delle
// pagine interne e dei moduli condivisi (G6) passano a SplitTitle; le calligrafie fuori
// dall'hero passano a ScriptWord. Sotto MotionFreeze (/case/[slug], D32 e A26) SplitTitle
// rende FrozenLines, le righe in maschera che la scheda immobile ha oggi. Il test conta i
// punti di chiamata per file, così un gruppo di migrazione si verifica sui suoi file. I
// conteggi sono minimi e le esclusioni sono tetti: i commit dei capitoli possono solo
// aggiungere titoli per lettera.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const leggi = (p: string) => readFileSync(join(ROOT, p), "utf8");
/* I commenti vanno via prima di cercare (schema di logo-colore.test.ts). */
const soloCodice = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1");

// split: TextLines e titoli semplici (G1-G5); g6: titoli display nudi (G6).
const ATTESI: Record<string, { split: number; g6?: number; script?: number }> = {
  "app/components/Posizionamento.tsx": { split: 1 },
  "app/components/HomeSearchGateway.tsx": { split: 1, g6: 1 },
  "app/components/HorizonStory.tsx": { split: 3, script: 1 },
  "app/components/StarReviews.tsx": { split: 1 },
  "app/components/Voci.tsx": { split: 1 },
  "app/components/Paths.tsx": { split: 2 },
  "app/components/Method.tsx": { split: 3, script: 1 },
  "app/components/OpenDomus.tsx": { split: 2 },
  "app/components/DomusDocProtocol.tsx": { split: 2 },
  "app/components/Services.tsx": { split: 2 },
  "app/components/CostiChiari.tsx": { split: 1 },
  "app/components/FeaturedTestimonial.tsx": { split: 1 },
  "app/components/Social.tsx": { split: 1 },
  "app/components/Team.tsx": { split: 2 },
  "app/components/Contact.tsx": { split: 1 },
  "app/components/FaqTeaser.tsx": { split: 1 },
  "app/components/PageHero.tsx": { split: 1, script: 1 },
  "app/components/Reviews.tsx": { split: 1, g6: 1 },
  "app/components/BeforeAfter.tsx": { split: 1 },
  "app/contatti/ContattiContent.tsx": { split: 1 },
  "app/case-vendute/CaseVenduteContent.tsx": { split: 2 },
  "app/valutazione-immobile-tradate/ValutazioneContent.tsx": { split: 3, g6: 1 },
  "app/chi-siamo/ChiSiamoContent.tsx": { split: 1, g6: 1 },
  "app/lavora-con-noi/LavoraConNoiContent.tsx": { split: 1, g6: 4 },
  "app/metodo/MetodoContent.tsx": { split: 1 },
  "app/domande-frequenti/FaqContent.tsx": { split: 1, g6: 1 },
  "app/vendi/VendiContent.tsx": { split: 0, g6: 5 },
  "app/acquista/AcquistaContent.tsx": { split: 0, g6: 2 },
  "app/open-domus/OpenDomusPageContent.tsx": { split: 0, g6: 10 },
  "app/components/EditorialRows.tsx": { split: 0, g6: 4 },
  "app/components/Highlights.tsx": { split: 0, g6: 2 },
  "app/components/CareerApplication.tsx": { split: 0, g6: 1 },
  "app/cookie/CookieContent.tsx": { split: 0, g6: 1 },
  "app/privacy/PrivacyContent.tsx": { split: 0, g6: 1 },
};

// Titoli display rimasti tag nudi dopo il commit 5: tetto per file, col commit o la ragione.
const NUDI_AMMESSI: Record<string, number> = {
  "app/case/[slug]/PropertyDetail.tsx": 7, // D32, A26
  "app/case/[slug]/PropertyFacts.tsx": 1, // D32
  "app/case/[slug]/VivereInZona.tsx": 3, // D32
  "app/components/Footer.tsx": 3, // reso anche in /case/[slug] (spec §5.4); commit 17
  "app/components/Congedo.tsx": 1, // commit 17 (spec §3.18)
  "app/components/HorizonStory.tsx": 1, // il titolo a gradini (data-horizon-stair): gesto di HorizonScroller, A12 (spec §3.5)
  "app/components/HeroCinematic.tsx": 1, // commit 8 (spec §2.5, strada «a»)
  "app/components/Contact.tsx": 1, // blocco del modulo con key={intent} (spec §8); commit 16
  "app/components/PropertyMap.tsx": 1, // dentro PropertySearch, invariato per spec §5.3
  "app/components/PropertyCard.tsx": 1, // tessera cliccabile resa anche in /case/[slug] (D32)
  "app/components/CaseQuickLook.tsx": 1, // scheda rapida col suo GSAP (data-ql-fact)
  "app/valutazione-immobile-tradate/ValutazioneContent.tsx": 1, // testa del modulo (spec §8)
  "app/error.tsx": 1, // fuori dalle 14 pagine di spec §5.2: domanda per Alberto
  "app/not-found.tsx": 1, // fuori dalle 14 pagine di spec §5.2: domanda per Alberto
};

function sorgenti(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === "__tests__") continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) sorgenti(p, out);
    else if (/\.(tsx|ts)$/.test(e.name)) out.push(relative(ROOT, p).split(sep).join("/"));
  }
  return out;
}

const conta = (t: string, re: RegExp) => (t.match(re) ?? []).length;

describe("SplitTitle al posto di TextLines", () => {
  test("73 SplitTitle in 34 file: 32 TextLines, 4 titoli semplici, manifesto e h4 del nastro, 35 titoli nudi (G6)", () => {
    assert.equal(Object.values(ATTESI).reduce((s, x) => s + x.split, 0), 38);
    assert.equal(Object.values(ATTESI).reduce((s, x) => s + (x.g6 ?? 0), 0), 35);
    assert.equal(Object.keys(ATTESI).length, 34);
  });

  for (const [file, n] of Object.entries(ATTESI)) {
    test(`${file}: almeno ${n.split} SplitTitle, ${n.script ?? 0} ScriptWord, nessun TextLines`, () => {
      const t = soloCodice(leggi(file));
      assert.ok(conta(t, /<SplitTitle\b/g) >= n.split, `SplitTitle: ${conta(t, /<SplitTitle\b/g)} < ${n.split}`);
      assert.ok(conta(t, /<ScriptWord\b/g) >= (n.script ?? 0), "ScriptWord");
      assert.doesNotMatch(t, /\bTextLines\b/);
    });
    const g6 = n.g6;
    if (g6) {
      test(`G6 ${file}: almeno ${n.split + g6} SplitTitle`, () => {
        const k = conta(soloCodice(leggi(file)), /<SplitTitle\b/g);
        assert.ok(k >= n.split + g6, `SplitTitle: ${k} < ${n.split + g6}`);
      });
    }
  }

  test("nessun titolo display resta un tag nudo fuori dalle esclusioni dichiarate", () => {
    const oltre: string[] = [];
    for (const f of sorgenti(join(ROOT, "app")).filter((x) => x.endsWith(".tsx"))) {
      const k = conta(soloCodice(leggi(f)), /<h[1-4]\b[^>]*\bfont-display\b/g);
      if (k > (NUDI_AMMESSI[f] ?? 0)) oltre.push(`${f}: ${k} (tetto ${NUDI_AMMESSI[f] ?? 0})`);
    }
    assert.deepEqual(oltre, []);
  });

  test("sotto MotionFreeze (/case/[slug], D32) SplitTitle rende FrozenLines e ScriptWord uno span fermo", () => {
    const st = soloCodice(leggi("app/components/motion/SplitTitle.tsx"));
    assert.match(st, /useMotionFrozen\(\)/);
    assert.match(st, /<FrozenLines\b/);
    assert.match(soloCodice(leggi("app/components/motion/ScriptWord.tsx")), /useMotionFrozen\(\)/);
    const fl = soloCodice(leggi("app/components/motion/FrozenLines.tsx"));
    assert.doesNotMatch(fl, /data-reveal/);
    assert.match(fl, /start: "top 86%"/);
    const chi = sorgenti(join(ROOT, "app")).filter((f) => /from\s+["'][^"']*\/FrozenLines["']/.test(soloCodice(leggi(f))));
    assert.deepEqual(chi, ["app/components/motion/SplitTitle.tsx"]);
  });

  test("i quattro titoli semplici di spec §2.3 non restano tag nudi", () => {
    assert.doesNotMatch(leggi("app/components/Services.tsx"), /<h3 className="mt-4 font-display text-d3">\{s\.title\}<\/h3>/);
    assert.doesNotMatch(leggi("app/components/DomusDocProtocol.tsx"), /<h3 className="font-display text-d4 font-light">\{p\.t\}<\/h3>/);
    assert.doesNotMatch(leggi("app/components/OpenDomus.tsx"), /<h3 className="font-display text-d4 font-light">\{list\.title\}<\/h3>/);
    assert.doesNotMatch(leggi("app/components/Method.tsx"), /<h4 className="mt-4 font-display text-d3">\{s\.title\}<\/h4>/);
  });

  test("nessun file importa TextLines fuori dal suo alias", () => {
    const colpevoli = [...sorgenti(join(ROOT, "app")), ...sorgenti(join(ROOT, "e2e"))]
      .filter((f) => f !== "app/components/motion/TextLines.tsx")
      .filter((f) => /from\s+["'][^"']*TextLines["']/.test(soloCodice(leggi(f))));
    assert.deepEqual(colpevoli, []);
  });

  test("la calligrafia nuda resta solo nell'hero della home (commit 8)", () => {
    const colpevoli = sorgenti(join(ROOT, "app"))
      .filter((f) => f.endsWith(".tsx"))
      .filter((f) => /className="script-word\b/.test(soloCodice(leggi(f))));
    assert.deepEqual(colpevoli, ["app/components/HeroCinematic.tsx"]);
  });
});
