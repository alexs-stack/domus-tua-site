// I FIORI SONO FUORI DAL NASTRO — C12 della cliente (niente fiori, ornamenti,
// texture) e spec 2026-09-13 §3.5 punto 1. HorizonStory non ha nodi con
// `data-horizon-flower` dalla rivista bianca; questo test tiene fuori anche i
// selettori che li cercavano. I commenti del codice si tolgono prima di
// cercare l'attributo (schema `soloCodice` di logo-colore.test.ts); la parola
// «fiori» invece si cerca anche nei commenti di HorizonScroller, perché era lì
// che il contratto li elencava ancora.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, sep } from "node:path";

const APP = join(process.cwd(), "app");

function sorgenti(dir: string, out: string[] = []): string[] {
  for (const nome of readdirSync(dir)) {
    if (nome === "node_modules" || nome === "__tests__") continue;
    const p = join(dir, nome);
    if (statSync(p).isDirectory()) sorgenti(p, out);
    else if (/\.(tsx|ts|css)$/.test(nome)) out.push(p);
  }
  return out;
}

function soloCodice(testo: string): string {
  return testo.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

const rel = (p: string) => p.slice(process.cwd().length + 1).split(sep).join("/");

describe("il nastro orizzontale non cerca fiori", () => {
  test("nessun data-horizon-flower nel codice di app/", () => {
    const colpevoli = sorgenti(APP)
      .filter((p) => soloCodice(readFileSync(p, "utf8")).includes("data-horizon-flower"))
      .map(rel);
    assert.deepEqual(colpevoli, [], "un selettore dei fiori è tornato nel codice");
  });

  test("HorizonScroller non nomina più i fiori, nemmeno nei commenti", () => {
    const testo = readFileSync(join(APP, "components", "motion", "HorizonScroller.tsx"), "utf8");
    const righe = testo
      .split("\n")
      .map((r, i) => ({ r, n: i + 1 }))
      .filter(({ r }) => /\bfior[ei]\b/i.test(r))
      .map(({ n, r }) => `${n}: ${r.trim()}`);
    assert.deepEqual(righe, [], "HorizonScroller parla ancora di fiori");
  });
});
