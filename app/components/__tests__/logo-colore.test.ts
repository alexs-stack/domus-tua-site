// IL LOGO NON CAMBIA COLORE — grigio e rosso, ovunque.
//
// Direttiva cliente, ribadita il 2026-08-26: «il logo dev'essere quello grigio
// e rosso, non dobbiamo cambiare il colore rendendolo bianco e rosso».
//
// Il colore virava in due modi, e questo test li presidia entrambi:
//  1. il VETTORIALE — MarkDomus aveva una variante "light" che rendeva il
//     grigio in crema. La variante è stata tolta, e il tipo basta a fermare
//     chi la passa; non basta a fermare chi la riscrive. Qui si controlla che
//     i due colori depositati siano ancora quelli e che non ne spunti un terzo.
//  2. il RASTER — in /public restano le negative del logo (crema + rosso).
//     Sono asset del cliente e restano su disco, ma nessun componente deve
//     tornare a renderle: era la negativa del wordmark il logo bianco che si
//     vedeva nell'header sopra l'hero.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, sep } from "node:path";

const APP = join(process.cwd(), "app");

const GRIGIO_DEPOSITATO = "#595a58";
const ROSSO_DEPOSITATO = "#e30716";
// La crema del sito: legittima ovunque, tranne che dentro il marchio.
const CREMA = "#f2ebda";
// Le negative raster, nominate a pezzi per non farsi trovare da sé.
const NEGATIVA = new RegExp("logo-domustua-[a-z]+-" + "dark" + "\\.png");

function sorgenti(dir: string, out: string[] = []): string[] {
  for (const nome of readdirSync(dir)) {
    if (nome === "node_modules" || nome === "__tests__") continue;
    const p = join(dir, nome);
    if (statSync(p).isDirectory()) sorgenti(p, out);
    else if (/\.(tsx|ts|css)$/.test(nome)) out.push(p);
  }
  return out;
}

/* I commenti vanno via PRIMA di cercare: i file che questo test presidia
   spiegano il difetto nominando per esteso sia la crema sia le negative —
   senza questo passaggio il test si accenderebbe sulla loro documentazione.
   (Il `//` di un URL taglia il resto della riga: qui non cambia nulla, perché
   quello che cerchiamo non convive mai con un link.) */
function soloCodice(testo: string): string {
  return testo.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

const FILE = sorgenti(APP).map((p) => ({
  p,
  testo: soloCodice(readFileSync(p, "utf8")),
}));
const rel = (p: string) => p.slice(process.cwd().length + 1).split(sep).join("/");

describe("il logo resta grigio e rosso", () => {
  test("il monogramma porta solo i due colori depositati", () => {
    const mark = soloCodice(readFileSync(join(APP, "components", "MarkDomus.tsx"), "utf8"));
    assert.ok(mark.includes(GRIGIO_DEPOSITATO), "il grigio depositato non c'è più");
    assert.ok(mark.includes(ROSSO_DEPOSITATO), "il rosso depositato non c'è più");
    assert.ok(!mark.toLowerCase().includes(CREMA), "è tornata la variante crema del marchio");
    // Nessun altro colore: i due hex sopra sono gli unici del file.
    const hex = [...new Set([...mark.matchAll(/#[0-9a-f]{6}\b/gi)].map((m) => m[0].toLowerCase()))];
    assert.deepEqual(
      hex.sort(),
      [GRIGIO_DEPOSITATO, ROSSO_DEPOSITATO].sort(),
      "nel marchio è comparso un colore che non è quello depositato",
    );
  });

  test("nessun componente rende le negative del logo", () => {
    const colpevoli = FILE.filter((f) => NEGATIVA.test(f.testo)).map((f) => rel(f.p));
    assert.deepEqual(colpevoli, [], "un componente rende di nuovo il logo bianco");
  });

  test("nessuno chiede la variante chiara del marchio", () => {
    // `[^>]*` attraversa già gli a capo (è una classe, non un punto): niente
    // flag `s`, che il target di questo tsconfig non accetta.
    const props = /<(MarkBadge|RotatingMark|MarkDomus|SegnoDomus)\b[^>]*\b(dark|variant)\b/;
    const colpevoli = FILE.filter((f) => props.test(f.testo)).map((f) => rel(f.p));
    assert.deepEqual(colpevoli, [], "una prop di colore è tornata su un componente del marchio");
  });

  test("il marchio non viene invertito o schiarito via CSS", () => {
    // invert / brightness-0 / grayscale sul contenitore otterrebbero lo stesso
    // risultato scavalcando il componente.
    const filtro =
      /(MarkDomus|MarkBadge|SegnoDomus|RotatingMark)[^\n]*\b(invert|brightness-0|grayscale)\b/;
    const colpevoli = FILE.filter((f) => filtro.test(f.testo)).map((f) => rel(f.p));
    assert.deepEqual(colpevoli, [], "un filtro CSS sta ricolorando il marchio");
  });
});
