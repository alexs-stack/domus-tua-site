// IL CUORE GIRA SEMPRE IN SENSO ORARIO, E CON UN TETTO.
//
// Il verso è della cliente (2026-09-10, «il cuore deve ruotare in senso
// orario», C06). Il tetto della velocità è della spec del 13 settembre 2026
// (§6.1, D34): un End nativo dava una velocità pari all'intero salto. Alberto
// quel giorno ha scelto «Si stacca da 1024» (A21): il segno fisso MarkSegno
// gira con lo stesso RotatingMark della testata, quindi la formula vive in un
// posto solo. Il test rilegge il codice senza commenti (schema `soloCodice` di
// app/components/__tests__/logo-colore.test.ts).
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { MARK_GAIN, MARK_REST_DEG_S, MARK_VMAX } from "../motion/mark";

const ROOT = process.cwd();
function soloCodice(testo: string): string {
  return testo.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}
const codice = (rel: string) => soloCodice(readFileSync(join(ROOT, rel), "utf8"));

describe("il cuore gira in senso orario, con un tetto", () => {
  const rotating = codice("app/components/motion/RotatingMark.tsx");
  const segno = codice("app/components/motion/MarkSegno.tsx");

  test("RotatingMark: riposo + guadagno · min(|v|, tetto), mai un segno", () => {
    assert.match(rotating, /MARK_REST_DEG_S \+ MARK_GAIN \* Math\.min\(Math\.abs\(velocity\), MARK_VMAX\)/);
    assert.match(rotating, /speed: MARK_REST_DEG_S,/);
    assert.doesNotMatch(rotating, /Math\.sign\(/);
    assert.doesNotMatch(rotating, /30 \+ 10 \* Math\.abs/);
    assert.doesNotMatch(rotating, /rotation:\s*-/);
  });

  test("MarkSegno gira con RotatingMark e non ha un verso suo", () => {
    assert.match(segno, /<RotatingMark\b/);
    assert.doesNotMatch(segno, /Math\.sign\(|rotation:|\breverse\b|velocity/);
  });

  test("i numeri: 30 °/s a riposo, 10 di guadagno, tetto fra 20 e 200 px per fotogramma", () => {
    assert.equal(MARK_REST_DEG_S, 30);
    assert.equal(MARK_GAIN, 10);
    assert.ok(Number.isInteger(MARK_VMAX) && MARK_VMAX >= 20 && MARK_VMAX <= 200, `MARK_VMAX ${MARK_VMAX}`);
  });

  test("si arma anche coi tasti di scorrimento, mai dentro i campi", () => {
    assert.match(rotating, /addEventListener\("keydown", onKey\)/);
    assert.match(rotating, /removeEventListener\("keydown", onKey\)/);
    assert.match(rotating, /isContentEditable/);
    assert.match(rotating, /closest\("input, textarea, select"\)/);
    for (const k of ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"]) {
      assert.ok(rotating.includes(`"${k}"`), `manca il tasto ${k}`);
    }
    assert.ok(rotating.includes('" "'), "manca lo spazio");
  });

  test("paused ferma il ticker, e il ticker è fermo sotto il sipario", () => {
    assert.match(rotating, /paused\?: boolean/);
    assert.match(rotating, /if \(pausedRef\.current \|\| html\.hasAttribute\("data-preloader"\)\) return;/);
  });
});
