// I TRE MODULI MEDIA, E LE DUE ABITUDINI CHE LI FACEVANO SALTARE.
//
// L'11 settembre il cliente ha detto che «sono emerse un sacco di cose brutte
// e formattate male, a livello layout, e di scelta: come il menu sopra, la
// posizione delle foto e dei video». La misura del difetto: a 1440 la home
// mostrava DODICI larghezze di media diverse — 374, 420, 468, 490, 511, 535,
// 562, 589, 624, 816, 835, 1440 — e tredici righe «foto | testo» di fila,
// ognuna con la propria proporzione di griglia. Scorrendo, l'occhio non
// ritrovava mai la stessa linea verticale.
//
// La risposta sta in tre classi di globals.css e in due divieti. Questo test
// non giudica il bello: rilegge il sorgente e pretende che i tre moduli
// esistano coi rapporti dichiarati, e che le due abitudini non tornino.
// Le prove visive stanno altrove (Playwright); qui c'è solo ciò che si può
// verificare leggendo, cioè ciò che regredisce di soppiatto in un refactor.
//
// La ricerca nei file è un cammino di `readdirSync`, non un `grep` esterno:
// su Windows in PowerShell `grep` non esiste, ed è già stata la causa di un
// fallimento (commit 370d582).

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const css = readFileSync(join(ROOT, "app/globals.css"), "utf8");

/** Tutti i .tsx sotto `app`, esclusi i test. */
function tsxFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "__tests__" || entry.name === "node_modules") continue;
      tsxFiles(full, out);
    } else if (entry.name.endsWith(".tsx")) {
      out.push(full);
    }
  }
  return out;
}

const files = tsxFiles(join(ROOT, "app")).map((full) => ({
  path: relative(ROOT, full).split(sep).join("/"),
  text: readFileSync(full, "utf8"),
}));

describe("i tre moduli media", () => {
  test("globals.css dichiara la banda, la metà e la colonna", () => {
    assert.match(css, /\.dt-media-full\s*\{/, "manca .dt-media-full");
    assert.match(css, /\.dt-media-half,\s*\r?\n\s*\.dt-media-column\s*\{/, "mancano .dt-media-half/.dt-media-column");
    assert.match(css, /\.dt-media-column--tall\s*\{/, "manca il modificatore verticale");
  });

  test("i rapporti sono quelli registrati nel DESIGN.md: 16:9, 1:1, 4:5, 9:16", () => {
    const full = css.slice(css.indexOf(".dt-media-full"), css.indexOf(".dt-media-half,"));
    assert.match(full, /aspect-ratio:\s*16\s*\/\s*9/, "la banda non è più 16:9");
    const half = css.slice(css.indexOf(".dt-media-half,"), css.indexOf(".dt-media-column--tall"));
    assert.match(half, /aspect-ratio:\s*1\s*\/\s*1/, "la metà non è più quadrata");
    assert.match(half, /aspect-ratio:\s*4\s*\/\s*5/, "la colonna non è più 4:5");
    const tall = css.slice(css.indexOf(".dt-media-column--tall"));
    assert.match(tall.slice(0, 120), /aspect-ratio:\s*9\s*\/\s*16/, "il modificatore non è più 9:16");
  });

  test("la metà e la colonna valgono 42vw con un tetto, da lg in su", () => {
    const block = css.slice(css.indexOf(".dt-media-column--tall"));
    assert.match(block, /width:\s*42vw/, "la larghezza condivisa non è più 42vw");
    assert.match(block, /max-width:\s*640px/, "manca il tetto di 640px");
  });
});

describe("le due abitudini che non devono tornare", () => {
  // (a) L'etichetta lunga. «Richiedi la valutazione del tuo immobile» sono 40
  // caratteri: in una colonna da 302px (la CTA della barra mobile a 390) una
  // maiuscola spaziata ne tiene 26, quindi la scatola rossa andava a capo con
  // la freccia appesa a destra — su sei superfici e in fondo a tutte le
  // schermate della home.
  test("nessuna superficie torna all'etichetta lunga della valutazione", () => {
    const colpevoli = files
      .filter((f) => /valutazione del tuo immobile|valuation of your property/i.test(f.text))
      .map((f) => f.path);
    assert.deepEqual(colpevoli, [], `etichetta lunga in: ${colpevoli.join(", ")}`);
  });

  // (b) Il capitolo recensioni fotocopiato. Erano 1.529px identici in coda a
  // /vendi, /metodo, /acquista e /open-domus, sotto contenuti diversi.
  test("il capitolo recensioni sta in una pagina sola", () => {
    const usa = files.filter((f) => /<Reviews\s*\/>/.test(f.text)).map((f) => f.path);
    assert.deepEqual(usa, ["app/recensioni/RecensioniContent.tsx"], `<Reviews /> anche in: ${usa.join(", ")}`);
  });
});

describe("i bottoni sul telefono", () => {
  // 32px di padding per lato più 0.08em di tracking costavano ~90px a
  // un'etichetta che ne aveva 302: è il conto che faceva andare a capo TUTTE
  // le CTA lunghe, non solo quella della valutazione.
  test("sotto i 640 la scatola stringe i fianchi e apre meno le lettere", () => {
    const i = css.indexOf("@media (max-width: 39.99rem)");
    assert.notEqual(i, -1, "manca il blocco dei bottoni sotto i 640");
    const block = css.slice(i, i + 400);
    assert.match(block, /--btn-px:\s*1\.25rem/);
    assert.match(block, /letter-spacing:\s*0\.05em/);
  });
});
