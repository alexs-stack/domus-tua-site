// «TRADATE E I COMUNI DI LA PROVINCIA DI VARESE…»: L'ARTICOLO DOPPIO NON TORNA.
//
// Chi l'ha chiesto. Audit del 21 settembre 2026 (blocco 23, rifinitura dopo le foto
// alte), difetto H03: la label del territorio in app/lib/site.ts comincia con
// l'articolo («la provincia di Varese e l'alta provincia di Como», e lì serve così a
// CareerApplication: «Tradate e la provincia…»), quindi ogni frase che la interpola
// dopo un «di» stampa «di la provincia». La home l'aveva (HorizonStory) ed è stata
// corretta nel primo giro; il secondo giro l'ha trovata ancora su /domande-frequenti
// (testo visibile e JSON-LD FAQPage: tre copie nella pagina servita) e nella
// conoscenza dell'assistente (entries.ts). La regola del progetto è una fonte sola
// per il territorio (site.ts: «è già successo che divergessero»), quindi la label non
// si copia: si cambia la frase intorno.
//
// Com'è fatto. Si leggono i sorgenti .ts/.tsx di app/ (test esclusi) e si vieta
// l'interpolazione `di ${territoryLabel}` in ogni forma (di, dei, nei, sui, dal…)
// e la stringa già risolta «di la provincia». In più si risolve davvero la frase
// italiana della FAQ e dell'assistente e si pretende che non contenga l'articolo
// doppio: il test vede il risultato, non solo il sorgente.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { territoryLabel } from "../site";
import { KNOWLEDGE } from "../assistant/knowledge/entries";
import { faq } from "../../domande-frequenti/faq";

const ROOT = process.cwd();

function sorgenti(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "__tests__" || e.name === "node_modules") continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) sorgenti(p, out);
    else if (/\.tsx?$/.test(e.name)) out.push(p);
  }
  return out;
}

describe("H03 · la label del territorio non finisce mai dopo una preposizione articolata", () => {
  test("la label comincia con l'articolo: è questo che rende sbagliato «di ${territoryLabel}»", () => {
    assert.match(territoryLabel, /^la /);
  });

  test("nessun sorgente interpola «di/dei/nei/sui ${territoryLabel}» né contiene «di la provincia»", () => {
    // Il codice senza commenti: HorizonStory.tsx racconta il refuso in un commento.
    // I commenti a blocco diventano spazi riga per riga, così i numeri di riga restano veri.
    const soloCodice = (t: string) =>
      t.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " ")).replace(/(^|[^:])\/\/[^\n]*/g, "$1");
    const colpevoli: string[] = [];
    for (const file of sorgenti(join(ROOT, "app"))) {
      const testo = soloCodice(readFileSync(file, "utf8"));
      const rel = file.slice(ROOT.length + 1).replaceAll("\\", "/");
      const righe = testo.split("\n");
      righe.forEach((riga, i) => {
        if (/\b(?:di|dei|nei|sui|dal|del|nel|sul)\s+\$\{territoryLabel(?:By\.it)?\}/.test(riga)) colpevoli.push(`${rel}:${i + 1}: ${riga.trim()}`);
        if (/\bdi la provincia\b/.test(riga)) colpevoli.push(`${rel}:${i + 1}: ${riga.trim()}`);
      });
    }
    assert.deepEqual(colpevoli, [], `l'articolo doppio è ancora in:\n${colpevoli.join("\n")}`);
  });

  test("la risposta «In quali zone lavorate?» della FAQ italiana non dice «di la provincia»", () => {
    const zone = faq.it.flatMap((g) => g.entries).find((e) => e.id === "zone");
    assert.ok(zone, "la voce «zone» della FAQ non c'è più: se è voluto, aggiornare questo test");
    assert.doesNotMatch(zone.a, /\bdi la\b/);
    assert.match(zone.a, /Tradate/);
    assert.ok(zone.a.includes(territoryLabel), "la FAQ non usa più la label unica di site.ts");
  });

  test("la voce «area-servita» dell'assistente non dice «di la provincia»", () => {
    const area = KNOWLEDGE.find((e) => e.id === "area-servita");
    assert.ok(area, "la voce «area-servita» non c'è più: se è voluto, aggiornare questo test");
    assert.doesNotMatch(area.content, /\bdi la\b/);
    assert.ok(area.content.includes(territoryLabel), "l'assistente non usa più la label unica di site.ts");
  });
});
