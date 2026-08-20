// La misurazione non deve mai diventare un canale di dati personali, e non deve mai
// impedire un contatto. Sono le due sole cose che questi test difendono — il resto
// (quante visite, quali pagine) lo verifica il pannello di Vercel, non una suite.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { CONVERSIONS, CONVERSION_SOURCES, trackConversion } from "../analytics";

const read = (p: string) => readFileSync(join(process.cwd(), "app", p), "utf8");

describe("eventi di conversione", () => {
  test("i nomi sono costanti, non stringhe sparse nei componenti", () => {
    // Il difetto che questo chiude: un evento battuto a mano con una lettera diversa è un
    // evento che non esiste, e te ne accorgi mesi dopo davanti a un grafico vuoto.
    for (const file of ["components/Contact.tsx", "components/SiteAnalytics.tsx"]) {
      const src = read(file);
      assert.doesNotMatch(
        src,
        /track\(\s*["'`]lead_/,
        `${file}: nome evento scritto a mano invece di CONVERSIONS.*`
      );
    }
  });

  test("ogni conversione ha un nome distinto", () => {
    const names = Object.values(CONVERSIONS);
    assert.equal(new Set(names).size, names.length, `nomi duplicati: ${names.join(", ")}`);
  });

  test("non lancia mai — una misura mancata non deve bloccare un contatto", () => {
    // Fuori dal browser `track` non ha nessuno a cui parlare: deve restare silenzioso.
    // Se un giorno lanciasse, l'invio del modulo si fermerebbe PRIMA di aprire WhatsApp
    // (vedi Contact.tsx: la chiamata sta sul percorso di successo).
    assert.doesNotThrow(() => trackConversion(CONVERSIONS.valutazione, "modulo", { intent: "seller" }));
    assert.doesNotThrow(() => trackConversion(CONVERSIONS.whatsapp, "header"));
    assert.doesNotThrow(() => trackConversion(CONVERSIONS.telefono, "footer"));
  });
});

describe("nessun dato personale nella misurazione", () => {
  test("il modulo passa solo il tipo di richiesta, mai i campi compilati", () => {
    const src = read("components/Contact.tsx");
    // `[\s\S]` invece del flag `s`: il target di tsconfig è precedente a es2018 e il
    // dotAll non compila (TS1501), pur funzionando a runtime — cioè il tipo di difetto
    // che passa i test e rompe la build.
    const call = src.match(/trackConversion\([\s\S]*?\)/)?.[0] ?? "";
    assert.ok(call, "chiamata a trackConversion non trovata in Contact.tsx");
    // I nomi dei campi del lead non devono comparire nella chiamata.
    for (const field of ["name", "phone", "email", "place", "surface", "budget", "message"]) {
      assert.doesNotMatch(
        call,
        new RegExp(`\\b${field}\\b`),
        `il campo "${field}" finisce nelle proprietà dell'evento: ${call}`
      );
    }
  });

  test("beforeSend ripulisce i parametri che potrebbero identificare una persona", () => {
    const src = read("components/SiteAnalytics.tsx");
    assert.match(src, /beforeSend/, "manca il filtro sulle URL inviate");
    for (const key of ["email", "telefono", "nome", "token"]) {
      assert.ok(src.includes(`"${key}"`), `beforeSend non rimuove il parametro "${key}"`);
    }
  });
});

describe("sorgenti di conversione", () => {
  test("l'elenco è unico: SiteAnalytics non ne tiene una copia propria", () => {
    // Due elenchi = un attributo che TypeScript accetta e il listener scarta in silenzio.
    const src = read("components/SiteAnalytics.tsx");
    assert.match(src, /CONVERSION_SOURCES/, "il Set delle sorgenti va derivato dalla fonte unica");
  });

  test("le sorgenti dichiarate nel markup esistono nell'elenco", () => {
    // Ogni `data-conv-source` scritto in un componente deve essere una sorgente valida,
    // altrimenti il clic viene attribuito al ripiego invece che al blocco giusto.
    const files = [
      "components/MobileActionBar.tsx",
      "components/WhatsAppFloat.tsx",
      "case/[slug]/PropertyDetail.tsx",
    ];
    const valid = new Set<string>(CONVERSION_SOURCES);
    for (const file of files) {
      for (const m of read(file).matchAll(/data-conv-source="([^"]+)"/g)) {
        assert.ok(valid.has(m[1]), `${file}: sorgente sconosciuta "${m[1]}"`);
      }
    }
  });
});
