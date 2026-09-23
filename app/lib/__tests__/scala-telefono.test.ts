// LA SCALA DEI TITOLI SOTTO I 640 PX È UNA SOLA, E LE PAROLE LUNGHE ENTRANO.
//
// Chi l'ha chiesto. Audit del 21 settembre 2026 (blocco 23, rifinitura dopo le foto
// alte), difetto V04: a 390 px «accompagnamento.» (/metodo) e «veröffentlichen»
// (/vendi in tedesco) non entravano nella colonna, perché d1 sotto i 480 px è
// inchiodato al pavimento di 2,4rem (38,4 px) e una parola spezzata per lettera
// (`.dt-w`, nowrap) non va a capo. Il primo giro aveva messo una classe
// `dt-d1-lunga` su alcuni componenti (Highlights, i due capitoli di /vendi): i
// revisori hanno misurato sulla stessa pagina, in italiano, teste dello stesso rango
// a 31,2 e a 38,4 px, una dopo l'altra (/vendi capitoli 2 e 3), e DESIGN.md dice che
// la taglia segue la COLONNA: qui la colonna è la stessa. Da qui la regola vale per
// tutte le teste d1 e d2 sotto i 640: la taglia segue la larghezza (vw) e nessun
// componente porta una taglia sua.
//
// Com'è fatto. Quattro fatti, letti dai sorgenti:
// 1. il primo blocco «@media (max-width: 39.99rem)» di globals.css (quello dei
//    bottoni, letto anche da moduli-media.test.ts) porta `.text-d1` e `.text-d2`
//    con una taglia in vw; e nei componenti non resta nessuna classe «lunga»;
// 2. il blocco «LA SCALA SOTTO I 1024» di globals.css ridefinisce su :root solo
//    token che qualcuno legge con var(): il tema è `@theme inline`, le utility
//    `text-d1…d3` portano il valore scritto dentro e non leggono la variabile, quindi
//    tre righe di quel blocco (d1, d2, d3) erano morte da settimane e i numeri di V04
//    reggevano solo perché lo erano (revisore del secondo giro);
// 3. l'H1 di PageHero scende a 2,5rem solo nelle lingue che hanno la parola lunga
//    («Besichtigung.» in tedesco su /open-domus, «currículums.» in spagnolo e
//    «Lebensläufe.» in tedesco su /lavora-con-noi), non in tutte e cinque: chi
//    legge in italiano vede la stessa testa su ogni rotta;
// 4. i nove passi di /metodo (Method.tsx) stanno su due colonne fra 768 e 1023 px e
//    su tre da 1024, con il titolo a d4 nella griglia a tre: a 768 «Dokumentenprüfung»
//    (275,6 px a 24 px) usciva dallo schermo di 19,6 px in una colonna di 194,6, e a
//    1440 a d3 (462 px) copriva 97 px del margine destro in una colonna di 365.
// Il traboccamento vero lo misura e2e/mobile-motion.spec.ts nelle cinque lingue e
// nei cinque viewport; qui si pinna la regola, così non torna una classe da spargere.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const leggi = (rel: string) => readFileSync(join(ROOT, rel), "utf8");
const css = leggi("app/globals.css");

function sorgenti(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "__tests__" || e.name === "node_modules") continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) sorgenti(p, out);
    else if (e.name.endsWith(".tsx")) out.push(p);
  }
  return out;
}

/** Il blocco `@media (...)` che comincia alla prima occorrenza di `query`, parentesi bilanciate. */
function blocco(query: string): string {
  const i = css.indexOf(`@media ${query}`);
  assert.notEqual(i, -1, `manca il blocco @media ${query}`);
  const apre = css.indexOf("{", i);
  let livello = 0;
  for (let j = apre; j < css.length; j++) {
    if (css[j] === "{") livello++;
    else if (css[j] === "}" && --livello === 0) return css.slice(apre + 1, j);
  }
  throw new Error(`blocco @media ${query} senza chiusura`);
}

describe("V04 · sotto i 640 px la taglia dei capitoli è una sola e segue la larghezza", () => {
  const sotto640 = blocco("(max-width: 39.99rem)");

  test("il blocco dei 640 porta .text-d1 e .text-d2 in vw, con il pavimento di sempre come tetto", () => {
    for (const [classe, tetto] of [
      [".text-d1", "2.4rem"],
      [".text-d2", "2.3rem"],
    ] as const) {
      const m = new RegExp(`\\${classe}\\s*\\{[^}]*font-size:\\s*([^;]+);`).exec(sotto640);
      assert.ok(m, `${classe} non ha una taglia sotto i 640`);
      assert.match(m[1], /\d(?:\.\d+)?vw/, `${classe}: la taglia sotto i 640 non segue la larghezza`);
      assert.ok(m[1].includes(tetto), `${classe}: il tetto non è il pavimento di sempre (${tetto})`);
    }
  });

  test("nessuna classe «lunga» nei componenti né in globals.css: la regola è per rango, non per componente", () => {
    // Senza i commenti: il foglio e i componenti raccontano il primo giro in prosa.
    const senzaCommenti = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
    assert.doesNotMatch(senzaCommenti(css), /dt-d[12]-lunga/);
    const colpevoli = sorgenti(join(ROOT, "app"))
      .filter((f) => /dt-d[12]-lunga/.test(senzaCommenti(readFileSync(f, "utf8"))))
      .map((f) => f.slice(ROOT.length + 1).replaceAll("\\", "/"));
    assert.deepEqual(colpevoli, []);
  });
});

describe("V04 · il blocco «LA SCALA SOTTO I 1024» ridefinisce solo token letti con var()", () => {
  test("ogni --text-* del blocco è consumato da un var(--text-*) nel foglio", () => {
    const sotto1024 = blocco("(max-width: 63.99rem)");
    const token = [...sotto1024.matchAll(/(--text-[a-z0-9-]+):/g)].map((m) => m[1]);
    assert.ok(token.length > 0, "il blocco sotto i 1024 non dichiara più nessun token");
    const morti = token.filter((t) => !css.includes(`var(${t})`));
    assert.deepEqual(
      morti,
      [],
      `token ridefiniti che nessuno legge (il tema è @theme inline: le utility portano il valore scritto dentro): ${morti.join(", ")}`,
    );
  });
});

describe("V04 · l'H1 stretto di PageHero è per lingua, non per rotta", () => {
  for (const [file, lingue] of [
    ["app/open-domus/OpenDomusPageContent.tsx", ["de"]],
    ["app/lavora-con-noi/LavoraConNoiContent.tsx", ["es", "de"]],
  ] as const) {
    test(`${file}: tightTitle solo in «${lingue.join("», «")}»`, () => {
      const src = leggi(file);
      assert.doesNotMatch(src, /^\s*tightTitle\s*$/m, "tightTitle passato a tutte le lingue");
      const condizione = lingue.map((l) => `locale === "${l}"`).join(" \\|\\| ");
      assert.match(src, new RegExp(`tightTitle=\\{${condizione}\\}`), `l'H1 stretto non è legato alle lingue «${lingue.join("», «")}»`);
    });
  }
  test("le altre nove rotte non passano tightTitle", () => {
    const altre = sorgenti(join(ROOT, "app"))
      .filter((f) => !/OpenDomusPageContent|LavoraConNoiContent|components[\\/]PageHero\.tsx$/.test(f))
      .filter((f) => /\btightTitle\b/.test(readFileSync(f, "utf8")))
      .map((f) => f.slice(ROOT.length + 1).replaceAll("\\", "/"));
    assert.deepEqual(altre, []);
  });
});

describe("V04 · i nove passi di /metodo: due colonne fra 768 e 1023, tre da 1024 con il titolo a d4", () => {
  const src = leggi("app/components/Method.tsx");
  test("la griglia dei passi", () => {
    assert.match(src, /<ol className="[^"]*\bmd:grid-cols-2\b[^"]*\blg:grid-cols-3\b[^"]*"/);
    assert.doesNotMatch(src, /<ol className="[^"]*\bmd:grid-cols-3\b/);
  });
  test("il titolo del passo scende a d4 nella griglia a tre", () => {
    assert.match(src, /<SplitTitle as="h4" className="mt-4 font-display text-d3 lg:text-d4">/);
  });
});
