// SEO multilingua: DEVE restare spento finché non esistono rotte per lingua complete.
//
// Il sito ha copy in it/en/fr/de/es (LocaleProvider), ma la lingua vive in un COOKIE, non
// nell'URL: nessuna rotta /en, nessun hreflang, nessuna alternate nel sitemap. È corretto per il
// lancio (solo-italiano indicizzato). Un SEO multilingua a metà — hreflang senza rotte reali, o
// alternate che puntano a URL inesistenti — è peggio di niente: manda i crawler su 404 e diluisce
// il segnale. Questo test fallisce se qualcuno lo accende senza implementarlo per intero.

import { describe, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { locales } from "../i18n/dictionaries";

const APP_DIR = path.join(process.cwd(), "app");

function productionSources(): string[] {
  const out: string[] = [];
  (function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === "__tests__" || entry.name === "__fixtures__") continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.tsx?$/.test(entry.name)) out.push(full);
    }
  })(APP_DIR);
  return out;
}

const REL = (f: string) => path.relative(process.cwd(), f).split(path.sep).join("/");
// Toglie i commenti: spiegano il divieto citando per forza il termine vietato.
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`\\])\/\/.*$/gm, "$1");

describe("SEO multilingua spento finché non ci sono rotte per lingua", () => {
  const files = productionSources();

  test("le sorgenti di produzione esistono (il test non passa a vuoto)", () => {
    assert.ok(files.length > 50, `trovati solo ${files.length} file`);
  });

  test("nessun hreflang / alternate-languages in metadata o markup", () => {
    const forbidden = /hreflang|hrefLang|alternates\s*:\s*\{[^}]*languages|languages\s*:\s*\{[^}]*(en|fr|de|es)/i;
    const hits = files.filter((f) => forbidden.test(strip(fs.readFileSync(f, "utf8"))));
    assert.deepEqual(
      hits.map(REL),
      [],
      "SEO multilingua a metà: hreflang/alternate-languages senza rotte per lingua complete.",
    );
  });

  test("nessuna rotta di pagina prefissata per lingua (app/[locale]/… o app/en/…)", () => {
    const localeDirs = [...locales, "[locale]", "[lang]"].filter((l) => l !== "it");
    for (const l of localeDirs) {
      assert.equal(
        fs.existsSync(path.join(APP_DIR, l)),
        false,
        `esiste app/${l}/: una rotta per lingua senza hreflang/canonical/sitemap completi`,
      );
    }
  });

  test("il sitemap non dichiara alternate per lingua (nessuna chiave 'alternates')", () => {
    const src = strip(fs.readFileSync(path.join(APP_DIR, "sitemap.ts"), "utf8"));
    assert.ok(!/alternates/i.test(src), "il sitemap dichiara alternate per lingua senza rotte reali");
  });
});
