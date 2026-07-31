// Struttura della navigazione.
//
// Regole confermate col cliente:
//  • "Case" non è una voce primaria — duplicava "Acquista", che porta allo stesso percorso di
//    ricerca immobili. La rotta /case resta viva, nel menu secondario.
//  • "Open Domus" è un format dentro il Metodo, non un percorso di pari livello: sta nel
//    secondario.
//  • "Lavora con noi" NON va aggiunta: manca il contenuto.
//  • Restano Vendi, Acquista, Metodo Domus, Chi siamo e le voci secondarie utili.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { primaryNav, secondaryNav, nav } from "../site";
import { dictionaries, locales } from "../i18n/dictionaries";

const APP_DIR = path.join(process.cwd(), "app");

// Le liste sono `as const`: senza allargare a string[], confrontare una chiave con un valore
// che TypeScript sa già assente sarebbe un errore di compilazione invece di un test.
const primaryKeys: string[] = primaryNav.map((i) => i.key);
const secondaryKeys: string[] = secondaryNav.map((i) => i.key);

describe("navigazione — gerarchia", () => {
  test("le voci primarie sono quelle approvate, in ordine", () => {
    assert.deepEqual(
      primaryNav.map((i) => i.key),
      ["vendi", "acquista", "metodo", "chiSiamo", "contatti"],
    );
  });

  test('"Case" non è una voce primaria: duplicava "Acquista"', () => {
    assert.equal(primaryKeys.includes("case"), false);
    assert.equal(
      secondaryKeys.includes("case"),
      true,
      "/case deve restare raggiungibile dal menu secondario",
    );
  });

  test('"Acquista" porta al percorso di ricerca immobili', () => {
    const acquista = primaryNav.find((i) => i.key === "acquista");
    assert.equal(acquista?.href, "/acquista");
    // La pagina monta la ricerca con i listing: è il percorso, non una landing statica.
    const page = fs.readFileSync(path.join(APP_DIR, "acquista", "page.tsx"), "utf8");
    assert.match(page, /getVisibleListings|getAvailableListings/);
    const content = fs.readFileSync(path.join(APP_DIR, "acquista", "AcquistaContent.tsx"), "utf8");
    assert.match(content, /PropertySearch/);
  });

  test('"Open Domus" sta nel menu secondario, non tra le primarie', () => {
    assert.equal(primaryKeys.includes("openDomus"), false);
    assert.equal(secondaryNav[0].key, "openDomus");
  });

  test('nessuna voce "Lavora con noi": manca il contenuto', () => {
    const keys = nav.map((i) => i.key as string);
    assert.equal(keys.includes("lavoraConNoi"), false);
    for (const locale of locales) {
      const labels = Object.values(dictionaries[locale].nav).join(" ").toLowerCase();
      assert.doesNotMatch(labels, /lavora con noi|work with us|carriere|careers/);
    }
  });

  test("la rotta /case esiste e resta funzionante", () => {
    assert.ok(fs.existsSync(path.join(APP_DIR, "case", "page.tsx")));
    assert.ok(fs.existsSync(path.join(APP_DIR, "case", "[slug]", "page.tsx")));
  });

  test("ogni voce punta a una rotta esistente", () => {
    for (const item of nav) {
      const segments = item.href.replace(/^\//, "").split("/");
      const dir = path.join(APP_DIR, ...segments);
      assert.ok(
        fs.existsSync(path.join(dir, "page.tsx")),
        `${item.href} non ha una pagina: ${path.relative(process.cwd(), dir)}/page.tsx`,
      );
    }
  });

  test("nessuna voce duplicata tra primarie e secondarie", () => {
    const hrefs = nav.map((i) => i.href);
    assert.deepEqual(
      hrefs.filter((h, i) => hrefs.indexOf(h) !== i),
      [],
    );
  });
});

describe("navigazione — etichette", () => {
  test("ogni voce ha un'etichetta in tutte e cinque le lingue", () => {
    for (const locale of locales) {
      const dict = dictionaries[locale].nav as Record<string, string>;
      for (const item of nav) {
        const label = dict[item.key];
        assert.ok(label && label.length > 0, `${locale}: manca l'etichetta per "${item.key}"`);
      }
      assert.ok(dict.altro?.length > 0, `${locale}: manca l'etichetta "Altro"`);
      assert.ok(dict.altroAria?.length > 0, `${locale}: manca l'aria-label del menu secondario`);
    }
  });
});

describe("navigazione — header", () => {
  const header = fs.readFileSync(path.join(APP_DIR, "components", "Header.tsx"), "utf8");

  test("desktop e mobile leggono la stessa struttura", () => {
    assert.equal(header.match(/primaryNav\.map/g)?.length, 2, "una lista per desktop, una per mobile");
    assert.equal(header.match(/secondaryNav\.map/g)?.length, 2);
  });

  test('"Altro" si accende anche su /case/<slug>', () => {
    // isActive fa match esatto o di prefisso; moreActive lo applica alle secondarie.
    assert.match(header, /pathname === href \|\| pathname\.startsWith\(`\$\{href\}\/`\)/);
    assert.match(header, /const moreActive = secondaryNav\.some\(\(item\) => isActive\(item\.href\)\)/);
  });

  test("il pannello secondario è accessibile da tastiera", () => {
    assert.match(header, /aria-expanded=\{moreOpen\}/);
    assert.match(header, /aria-controls="nav-altro"/);
    assert.match(header, /hidden=\{!moreOpen\}/);
    // Escape chiude e restituisce il focus al bottone che l'ha aperto.
    assert.match(header, /if \(e\.key !== "Escape"\) return;/);
    assert.match(header, /moreButtonRef\.current\?\.focus\(\)/);
  });

  test("click esterno e uscita col Tab chiudono il pannello", () => {
    assert.match(header, /pointerdown/);
    assert.match(header, /focusout/);
  });

  test("la pill non si ritira mentre un menu è aperto", () => {
    // Con lo scroll la pill si ritrae: se un pannello è agganciato a lei, uscirebbe di schermo.
    assert.match(header, /openRef\.current = open \|\| moreOpen/);
  });

  test("il cambio pagina chiude il pannello", () => {
    assert.match(header, /if \(morePathname !== pathname\)/);
  });
});

describe("navigazione — footer", () => {
  test("il footer elenca tutte le voci, primarie e secondarie", () => {
    const footer = fs.readFileSync(path.join(APP_DIR, "components", "Footer.tsx"), "utf8");
    assert.match(footer, /nav\.map/);
    assert.equal(nav.length, primaryNav.length + secondaryNav.length);
  });
});
