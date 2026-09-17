// Nessun pin di GSAP: spec §8. I corridoi sono position: sticky su un
// corridoio (A19 di Alberto, «Sticky dove serve»). Il pin scrive
// position: fixed e uno spaziatore, e litiga con lo stacking di main e footer.
//
// Oggi nessun file di app/ scrive `pin:`, `pinSpacing` o `anticipatePin`
// fuori dai commenti; il test lo pretende.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = join(__dirname, "..", "..", "..");
function soloCodice(testo: string): string {
  return testo.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}
function sorgenti(dir: string, out: string[] = []): string[] {
  for (const nome of readdirSync(dir)) {
    if (nome === "node_modules" || nome === "__tests__") continue;
    const p = join(dir, nome);
    if (statSync(p).isDirectory()) sorgenti(p, out);
    else if (/\.(tsx|ts)$/.test(nome)) out.push(p);
  }
  return out;
}

const PIN = [/\bpin\s*:/, /\bpinSpacing\b/, /\banticipatePin\b/];
const pinned = (code: string) => PIN.some((re) => re.test(code));

describe("nessun pin di GSAP (spec §8)", () => {
  test("il rilevatore vede le tre forme e ignora i commenti", () => {
    assert.ok(pinned("ScrollTrigger.create({ trigger: el, pin: true })"));
    assert.ok(pinned("scrollTrigger: { pinSpacing: false }"));
    assert.ok(pinned("scrollTrigger: { anticipatePin: 1 }"));
    assert.ok(!pinned(soloCodice("// mai il pin di GSAP: pin: true scrive position fixed")));
    assert.ok(!pinned("const spinner = 1; pinned.add(x);"));
  });

  test("nessun file di app/ usa pin, pinSpacing o anticipatePin", () => {
    const colpevoli = sorgenti(join(ROOT, "app"))
      .filter((p) => pinned(soloCodice(readFileSync(p, "utf8"))))
      .map((p) => relative(ROOT, p).split(sep).join("/"));
    assert.deepEqual(colpevoli, []);
  });
});
