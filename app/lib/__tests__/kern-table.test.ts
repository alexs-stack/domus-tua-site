// La crenatura dei caratteri spezzati (spec §2.3, D20): SplitChars la rimette con
// `--k` letto da app/lib/motion/kern-table.json, che scripts/kern-table.ts misura nel
// DOM del build. Il test pretende la forma della tabella e il suo peso: la tabella
// entra nel bundle client con SplitTitle (A20 di Alberto, titoli per lettera), e D36
// ne fissa il tetto a 64 KB.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { statSync } from "node:fs";
import { join } from "node:path";
import table from "../motion/kern-table.json";
import { kernBetween, kernOf, type KernFont } from "../motion/kern";

const CHIAVI: KernFont[] = ["brand-800", "display-400", "display-500", "script-400"];
const T = table as Record<string, Record<string, number>>;
// Tetto dei valori, contro le misure sbagliate (spec §9.1: ±0,2 em). D42: per `script-400`
// il tetto è ±0,25 em, perché il Pinyon Script ha nel GPOS la coppia A-W a −500/2048 =
// −0,244 em, la più larga fra due lettere del suo sottoinsieme latino (letta con fontTools
// sul woff2 del build); Playfair arriva a 0,154 em e Jakarta a 0,14, sotto ±0,2.
const TETTO_EM: Record<KernFont, number> = { "brand-800": 0.2, "display-400": 0.2, "display-500": 0.2, "script-400": 0.25 };

describe("kern-table.json", () => {
  test("quattro chiavi e nient'altro", () => {
    assert.deepEqual(Object.keys(T).sort(), [...CHIAVI].sort());
  });

  test("ogni chiave è stata misurata: nessuna tabella vuota", () => {
    for (const k of CHIAVI) {
      assert.ok(Object.keys(T[k]).length > 0, `${k} vuota: rigenerare con npx tsx scripts/kern-table.ts`);
    }
  });

  test("coppie di due caratteri, valori entro ±0,2 em (±0,25 per script-400, D42), al millesimo, |k| ≥ 0,002", () => {
    for (const k of CHIAVI) {
      for (const [coppia, v] of Object.entries(T[k])) {
        assert.equal(Array.from(coppia).length, 2, `${k} «${coppia}»: non è una coppia`);
        assert.ok(Math.abs(v) <= TETTO_EM[k], `${k} «${coppia}» = ${v} fuori da ±${TETTO_EM[k]} em`);
        assert.ok(Math.abs(v) >= 0.002, `${k} «${coppia}» = ${v} sotto la soglia di 0,002 em`);
        assert.equal(Math.round(v * 1000) / 1000, v, `${k} «${coppia}» = ${v} non arrotondato al millesimo`);
      }
    }
  });

  test("peso entro 64 KB (D36): la tabella va nel bundle client", () => {
    const byte = statSync(join(process.cwd(), "app/lib/motion/kern-table.json")).size;
    assert.ok(byte <= 64 * 1024, `kern-table.json pesa ${byte} byte`);
  });

  test("kernOf e kernBetween leggono la tabella, con il maiuscolo della lingua", () => {
    const [coppia, v] = Object.entries(T["display-500"]).find(([p]) => /^[A-Z]{2}$/.test(p)) ?? ["", 0];
    assert.ok(coppia, "display-500 senza coppie di lettere");
    assert.equal(kernOf("display-500", coppia), v);
    assert.equal(kernOf("display-500", "\u0000\u0001"), 0);
    const [a, b] = Array.from(coppia);
    assert.equal(kernBetween("display-500", a.toLocaleLowerCase("it"), b.toLocaleLowerCase("it"), true, "it"), v);
    // «ß» si cerca come «SS»: a sinistra conta l'ultima S, a destra la prima.
    assert.equal(kernBetween("display-500", "ß", "ß", true, "de"), kernOf("display-500", "SS"));
  });
});
