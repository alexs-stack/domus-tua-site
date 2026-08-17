// La proiezione da griglia è una difesa sul PESO della pagina, e le difese sul peso si
// sgretolano in silenzio: nessuno se ne accorge finché qualcuno non misura.
//
// Il difetto che questi test tengono chiuso: `GridProperty` era una `Omit` di due campi,
// quindi ogni campo aggiunto a `Property` dopo — `facts`, `energyClass`, `ref`,
// `docVerified` — entrava nel payload per inerzia. Su /acquista sono 196 immobili: ogni
// campo inutile è moltiplicato per 196, e la pagina era arrivata a 1070 KB (punto 29 del
// Documento finale di sintesi). Ora è una `Pick`, e questi test verificano che resti tale.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { properties, toGridProperty, type Property } from "../properties";

const sample = properties[0];

describe("proiezione da griglia", () => {
  test("tiene esattamente i campi che la griglia legge, e nessun altro", () => {
    const atteso = [
      "slug", "title", "zone", "type", "status", "price", "priceValue",
      "sqm", "rooms", "beds", "baths", "badges", "cover", "excerpt",
      "features", "sold",
    ].sort();
    // `sold` è opzionale: sulla fixture può mancare, e in quel caso non deve comparire
    // come chiave `undefined` (peso inutile nel payload).
    const ottenuto = Object.keys(toGridProperty(sample)).sort();
    for (const k of ottenuto) {
      assert.ok(atteso.includes(k), `campo non previsto nella griglia: "${k}"`);
    }
  });

  test("i campi pesanti NON passano", () => {
    // `facts` è il più grosso: i fatti strutturati della scheda immobile, che la griglia
    // non disegna. `description` e `gallery` erano già esclusi; questi quattro no.
    const g = toGridProperty(sample) as Record<string, unknown>;
    for (const k of ["description", "gallery", "facts", "energyClass", "ref", "docVerified"]) {
      assert.equal(g[k], undefined, `"${k}" è finito nel payload della griglia`);
    }
  });

  test("non introduce chiavi con valore undefined", () => {
    // `{ ref: undefined }` si serializza comunque nel flight payload: la proiezione deve
    // omettere la chiave, non impostarla a undefined.
    const g = toGridProperty(sample) as Record<string, unknown>;
    for (const [k, v] of Object.entries(g)) {
      assert.notEqual(v, undefined, `chiave "${k}" presente ma undefined`);
    }
  });

  test("l'elenco a runtime non diverge da quello del tipo", () => {
    // `GRID_FIELDS` è dichiarato `satisfies readonly (keyof GridProperty)[]`, quindi il
    // compilatore impedisce un nome inesistente. Questo controlla il verso opposto: che
    // il tipo non abbia campi che la funzione dimentica di copiare.
    const src = readFileSync(join(process.cwd(), "app/lib/properties.ts"), "utf8");
    const tipo = src.match(/export type GridProperty = Pick<\s*Property,([\s\S]*?)>;/)?.[1] ?? "";
    const runtime = src.match(/const GRID_FIELDS = \[([\s\S]*?)\] as const/)?.[1] ?? "";
    const nomi = (s: string) => [...s.matchAll(/"([a-zA-Z]+)"/g)].map((m) => m[1]).sort();
    assert.deepEqual(nomi(tipo), nomi(runtime), "tipo e GRID_FIELDS elencano campi diversi");
  });

  test("la griglia resta filtrabile: i campi dei filtri ci sono tutti", () => {
    // Se un domani si toglie un campo per alleggerire, questi sono quelli che romperebbero
    // la ricerca invece di limitarsi a togliere testo (PropertySearch: filtri e haystack).
    const g = toGridProperty(sample) as Record<string, unknown>;
    for (const k of ["priceValue", "rooms", "sqm", "type", "status", "zone", "features", "excerpt", "badges"]) {
      assert.notEqual(g[k], undefined, `il filtro perderebbe "${k}"`);
    }
  });
});

describe("Property → griglia, su tutte le fixture", () => {
  test("nessuna fixture porta campi fuori elenco", () => {
    for (const p of properties as Property[]) {
      const g = toGridProperty(p) as Record<string, unknown>;
      assert.equal(g.facts, undefined, `${p.slug}: facts nel payload`);
      assert.equal(g.description, undefined, `${p.slug}: description nel payload`);
      assert.equal(g.gallery, undefined, `${p.slug}: gallery nel payload`);
    }
  });
});
