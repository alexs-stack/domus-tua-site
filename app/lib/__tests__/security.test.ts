// Sicurezza — regressioni trovate dall'audit finale.
//
// Ogni test qui nasce da un problema reale trovato guardando il sito costruito, non il codice.
// Servono a impedire che rientri: le tre falle chiuse in questa PR erano tutte invisibili a
// occhio e tutte in produzione da mesi.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { jsonLdScript } from "../site";

const root = (...p: string[]) => path.join(process.cwd(), ...p);
const CONFIG = fs.readFileSync(root("next.config.ts"), "utf8");
// L'iframe di Trustindex vive in TrustindexEmbed.tsx (estratto da Reviews.tsx per essere
// condiviso col capitolo recensioni della home): le garanzie si verificano lì.
const TRUSTINDEX = fs.readFileSync(root("app", "components", "TrustindexEmbed.tsx"), "utf8");

/** Ogni sorgente sotto app/, escluse le cartelle di test. */
function sourceFiles(dir = root("app")): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === "__tests__" ? [] : sourceFiles(full);
    return /\.tsx?$/.test(e.name) ? [full] : [];
  });
}

describe("dati strutturati — nessuna via d'uscita dal tag script", () => {
  test("una chiusura di script dentro un titolo non chiude il tag", () => {
    // Titolo e descrizione degli immobili arrivano dal gestionale: sono dati di terzi.
    const hostile = { name: "Villa </script><script>alert(1)</script>" };
    const out = jsonLdScript(hostile);
    assert.ok(!out.includes("</script"), "il payload chiude il tag: XSS");
    assert.match(out, /\\u003c/);
    // Resta JSON valido: il dato non viene alterato, solo scritto in modo sicuro.
    assert.equal((JSON.parse(out) as { name: string }).name, hostile.name);
  });

  test("i separatori di riga Unicode non rompono il parser", () => {
    // U+2028 e U+2029 sono JSON valido ma spezzano il parser JavaScript dentro uno <script>.
    const value = `riga\u2028riga\u2029riga`;
    const out = jsonLdScript({ a: value });
    assert.ok(!out.includes("\u2028") && !out.includes("\u2029"), "separatori lasciati grezzi");
    assert.equal((JSON.parse(out) as { a: string }).a, value);
  });

  test("tutti i JSON-LD del sito passano dall'escaper", () => {
    // Si scandisce l'albero, non un elenco scritto a mano: un elenco copre i file che
    // esistevano il giorno in cui è stato scritto e tace su quelli aggiunti dopo. È già
    // successo — /lavora-con-noi è nata dopo questo controllo ed è rimasta scoperta.
    const colpevoli: string[] = [];
    for (const file of sourceFiles()) {
      const src = fs.readFileSync(file, "utf8");
      if (/__html:\s*JSON\.stringify\(/.test(src)) {
        colpevoli.push(path.relative(process.cwd(), file));
      }
    }
    assert.deepEqual(
      colpevoli,
      [],
      `JSON.stringify grezzo dentro dangerouslySetInnerHTML: usa jsonLdScript() in ${colpevoli.join(", ")}`,
    );
  });

  test("le pagine con dati strutturati usano davvero l'escaper", () => {
    // Il controllo qui sopra è negativo (nessun JSON.stringify grezzo): da solo passerebbe
    // anche su un sito che ha smesso di emettere JSON-LD. Questo verifica il positivo.
    const conJsonLd = sourceFiles().filter((f) =>
      /type="application\/ld\+json"/.test(fs.readFileSync(f, "utf8")),
    );
    assert.ok(conJsonLd.length > 0, "nessun JSON-LD trovato: il controllo non sta guardando niente");
    for (const file of conJsonLd) {
      assert.match(
        fs.readFileSync(file, "utf8"),
        /jsonLdScript\(/,
        `${path.relative(process.cwd(), file)}: emette JSON-LD senza passare da jsonLdScript`,
      );
    }
  });
});

describe("widget di terze parti — confinato", () => {
  test("l'iframe delle recensioni è in sandbox, senza accesso alla nostra origine", () => {
    assert.match(TRUSTINDEX, /sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"/);
    // allow-same-origin annullerebbe la sandbox: con srcDoc l'iframe erediterebbe la nostra
    // origine e lo script di Trustindex vedrebbe cookie e localStorage del sito.
    assert.doesNotMatch(TRUSTINDEX, /sandbox="[^"]*allow-same-origin/);
  });

  test("il widget resta dietro il consenso in ogni punto di montaggio", () => {
    // Si scandisce l'albero, non un elenco a mano (stessa regola dei JSON-LD qui sopra),
    // e si scopre dai file che IMPORTANO il modulo: un import rinominato o dinamico
    // non può uscire dalla scansione in silenzio.
    const consumers = sourceFiles().filter((f) =>
      /(?:from\s*|import\()\s*["'][^"']*TrustindexEmbed["']/.test(fs.readFileSync(f, "utf8")),
    );
    assert.ok(consumers.length > 0, "nessun componente importa TrustindexEmbed: il controllo non sta guardando niente");
    for (const file of consumers) {
      assert.match(
        fs.readFileSync(file, "utf8"),
        /consent === "accepted"/,
        `${path.relative(process.cwd(), file)}: monta TrustindexEmbed senza il gate sul consenso`,
      );
    }
  });
});

describe("intestazioni di sicurezza", () => {
  test("sono dichiarate per ogni percorso", () => {
    assert.match(CONFIG, /async headers\(\)/);
    assert.match(CONFIG, /source: "\/:path\*"/);
    for (const h of [
      "X-Content-Type-Options",
      "X-Frame-Options",
      "Referrer-Policy",
      "Permissions-Policy",
      "Strict-Transport-Security",
    ]) {
      assert.ok(CONFIG.includes(h), `manca l'intestazione ${h}`);
    }
  });

  test("nosniff e niente incorniciamento da terzi", () => {
    assert.match(CONFIG, /value: "nosniff"/);
    assert.match(CONFIG, /value: "SAMEORIGIN"/);
  });
});
