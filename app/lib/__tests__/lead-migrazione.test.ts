// Il lead a righe (spec §2.2-§2.3; A20 di Alberto) e la fine di TextLines (spec §2.7). Lead
// prende i paragrafi `p.lead` (ruolo `lead` di spec §2.2), fuori dalle esclusioni dichiarate;
// le quattro teste sopra la piega (spec §5.2) hanno un gruppo di testa (PageHero anche uno
// annidato per la colonna del lead, D50), e le tre senza foto portano `data-fold-lcp`
// (spec §2.5); SplitText resta a Lead e a FrozenLines (/case/[slug], D32): il manifesto del
// nastro è un SplitTitle e i lead di HorizonStory e delle cinque stelle sono Lead (commit 10b).
// I conteggi di Lead sono minimi e le esclusioni tetti: i commit dei capitoli possono solo
// aggiungere lead a righe.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const leggi = (p: string) => readFileSync(join(ROOT, p), "utf8");
const soloCodice = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
const conta = (t: string, re: RegExp) => (t.match(re) ?? []).length;

// file → numero minimo di <Lead (GA, GB, GC poi GD)
const LEAD: Record<string, number> = {
  "app/components/PageHero.tsx": 1,
  "app/contatti/ContattiContent.tsx": 1,
  "app/case-vendute/CaseVenduteContent.tsx": 4,
  "app/components/Posizionamento.tsx": 1,
  "app/components/HorizonStory.tsx": 2,
  "app/components/StarReviews.tsx": 1,
  "app/components/Paths.tsx": 1,
  "app/components/Method.tsx": 1,
  "app/components/OpenDomus.tsx": 1,
  "app/components/DomusDocProtocol.tsx": 1,
  "app/components/CostiChiari.tsx": 1,
  "app/components/FeaturedTestimonial.tsx": 1,
  "app/components/Social.tsx": 1,
  "app/components/Reviews.tsx": 1,
  "app/components/BeforeAfter.tsx": 1,
  "app/lavora-con-noi/LavoraConNoiContent.tsx": 1,
  "app/vendi/VendiContent.tsx": 3,
  "app/acquista/AcquistaContent.tsx": 2,
  "app/open-domus/OpenDomusPageContent.tsx": 3,
  "app/components/EditorialRows.tsx": 4,
  "app/components/Highlights.tsx": 1,
  "app/components/CareerApplication.tsx": 1,
  "app/domande-frequenti/FaqContent.tsx": 1,
  "app/chi-siamo/ChiSiamoContent.tsx": 1,
  "app/valutazione-immobile-tradate/ValutazioneContent.tsx": 1,
  "app/components/Team.tsx": 2,
  "app/components/Voci.tsx": 1,
  "app/components/HomeSearchGateway.tsx": 1,
  "app/components/Stats.tsx": 1,
};

// Paragrafi `.lead` che restano <p>: tetto per file, col commit o la ragione.
const LEAD_NUDI: Record<string, number> = {
  "app/chi-siamo/ChiSiamoContent.tsx": 2, // capolettera: ::first-letter non regge le righe
  "app/components/Contact.tsx": 1, // il testo cambia con l'intento (spec §8); commit 16
  "app/components/Reviews.tsx": 1, // il testo cambia col consenso
  "app/components/Footer.tsx": 1, // reso anche in /case/[slug] (spec §5.4); commit 17
  "app/components/PropertySearch.tsx": 1, // PropertySearch invariato (spec §5.3)
  "app/case/[slug]/PropertyDetail.tsx": 2, // D32
  "app/case/[slug]/VivereInZona.tsx": 1, // D32
};

// Teste sopra la piega (spec §5.2): RevealGroup nel file e attesa LCP delle tre senza foto.
const TESTE: Record<string, { gruppi: number; lcp: boolean }> = {
  // uno per la testa, uno annidato per la colonna del lead (D50, giro di correzione 1 di 6-7)
  "app/components/PageHero.tsx": { gruppi: 2, lcp: false },
  "app/contatti/ContattiContent.tsx": { gruppi: 1, lcp: true },
  "app/case-vendute/CaseVenduteContent.tsx": { gruppi: 1, lcp: true },
  // uno per la testa (GA), uno per i due livelli (G6 del commit 5)
  "app/valutazione-immobile-tradate/ValutazioneContent.tsx": { gruppi: 2, lcp: true },
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

describe("Lead al posto dei paragrafi .lead", () => {
  test("42 Lead in 29 file: i 39 del lead a righe, i due lead di HorizonStory e quello delle stelle", () => {
    assert.equal(Object.values(LEAD).reduce((s, n) => s + n, 0), 42);
    assert.equal(Object.keys(LEAD).length, 29);
  });
  for (const [file, n] of Object.entries(LEAD)) {
    test(`${file}: almeno ${n} Lead`, () => {
      const k = conta(soloCodice(leggi(file)), /<Lead\b/g);
      assert.ok(k >= n, `Lead: ${k} < ${n}`);
    });
  }
  test("i paragrafi .lead nudi restano solo nelle esclusioni dichiarate", () => {
    const oltre: string[] = [];
    for (const f of sorgenti(join(ROOT, "app")).filter((x) => x.endsWith(".tsx"))) {
      const k = conta(soloCodice(leggi(f)), /className="lead[\s"]/g);
      if (k > (LEAD_NUDI[f] ?? 0)) oltre.push(`${f}: ${k} (tetto ${LEAD_NUDI[f] ?? 0})`);
    }
    assert.deepEqual(oltre, []);
  });
  test("le quattro teste sopra la piega: i RevealGroup attesi, data-fold-lcp sulle tre senza foto", () => {
    for (const [f, t] of Object.entries(TESTE)) {
      const s = soloCodice(leggi(f));
      assert.equal(conta(s, /<RevealGroup\b/g), t.gruppi, `${f}: RevealGroup`);
      assert.equal(conta(s, /data-fold-lcp/g), t.lcp ? 1 : 0, `${f}: data-fold-lcp`);
    }
  });
});

describe("TextLines non c'è più", () => {
  test("il file è cancellato e nessun codice lo nomina", () => {
    assert.equal(existsSync(join(ROOT, "app/components/motion/TextLines.tsx")), false);
    const colpevoli = [...sorgenti(join(ROOT, "app")), ...sorgenti(join(ROOT, "e2e"))].filter((f) => /\bTextLines\b/.test(soloCodice(leggi(f))));
    assert.deepEqual(colpevoli, []);
  });
  test("SplitText lo importano solo Lead e FrozenLines (spec §2.3, D32)", () => {
    const chi = sorgenti(join(ROOT, "app")).filter((f) => /from\s+["']gsap\/SplitText["']/.test(leggi(f)));
    assert.deepEqual(chi.sort(), ["app/components/motion/FrozenLines.tsx", "app/components/motion/Lead.tsx"]);
  });
});
