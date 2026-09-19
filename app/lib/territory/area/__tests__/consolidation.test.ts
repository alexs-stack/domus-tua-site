// Il dominio d'area è UNO SOLO — e resta uno solo.
//
// Il difetto che questi test chiudono: esistevano DUE modelli di "fatto d'area" nello stesso
// repository. Quello canonico in app/lib/territory/area (fonte, proprietario, ambito geografico,
// stato di approvazione, conflitti, traduzioni, data di revisione) e un secondo in
// app/lib/realsmart/ai/areaFacts.ts, più povero e incompatibile (comune/scope/fact/sourceUrl/
// retrievedAt/approvedBy). Entrambi con una costante AREA_FACTS vuota.
//
// Due modelli vuoti non fanno danno finché restano vuoti. Il danno arriva al primo fatto
// approvato scritto in quello sbagliato: da lì in poi ci sono due verità sulla stessa area, e
// nessuna delle due sa dell'altra. Il secondo modello è stato rimosso — vedi
// docs/adr/015-area-domain-consolidation.md.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";

import {
  AREA_SCHEMA_VERSION,
  AREA_PROMPT_VERSION,
  AreaProfileSchema,
  AreaNarrativeSchema,
  AreaReviewEventSchema,
  parseAreaFact,
} from "../types";
import { allAreaFacts, getPublicAreaProfile } from "../data";
import { areaFactId, areaSourceId, areaFactsHash, contentHash, stableStringify } from "../hash";

/**
 * Elenco dei file .ts/.tsx (sotto le cartelle date) il cui testo soddisfa la regex, o vuoto
 * quando nessuno la soddisfa. Scandisce in Node, come content-integrity.test.ts: prima passava
 * da un `grep` esterno, che su Windows (`npm test` da PowerShell) non esiste — e il test
 * segnava «nessuna dichiarazione» dove ce n'era una.
 */
function grepFiles(pattern: string, ...paths: string[]): string[] {
  const re = new RegExp(pattern);
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.tsx?$/.test(entry.name) && re.test(readFileSync(full, "utf8"))) {
        out.push(relative(process.cwd(), full).split(sep).join("/"));
      }
    }
  };
  for (const p of paths) if (existsSync(p)) walk(p);
  return out.sort();
}

describe("un solo modello di fatto d'area in tutto il repository", () => {
  test("il modello duplicato non esiste più", () => {
    assert.equal(
      existsSync(join(process.cwd(), "app/lib/realsmart/ai/areaFacts.ts")),
      false,
      "app/lib/realsmart/ai/areaFacts.ts è tornato: era il secondo modello, incompatibile col canonico.",
    );
  });

  test("nessun'altra costante AREA_FACTS fuori dal dominio canonico", () => {
    const files = grepFiles("(const|let|var)\\s+AREA_FACTS", "app", "scripts");
    assert.deepEqual(
      files,
      ["app/lib/territory/area/data.ts"],
      "il dataset dei fatti d'area deve avere UNA sola dichiarazione, in app/lib/territory/area/data.ts",
    );
  });

  test("il dominio d'area non importa dal dominio AI di RealSmart", () => {
    // La direzione ammessa è una sola: realsmart → territory/area. L'inverso ricreerebbe la
    // dipendenza circolare fra i due modelli che la consolidazione ha appena tolto.
    const files = grepFiles('from "[^"]*realsmart/ai', "app/lib/territory");
    assert.deepEqual(files, [], `territory importa da realsmart/ai: ${files.join(", ")}`);
  });
});

describe("niente esce in pagina senza un'approvazione firmata", () => {
  // Questo blocco pretendeva che il dataset fosse VUOTO. Contare era comodo finché lo era, ma
  // «vuoto» non è la proprietà che serve: la proprietà è che nessun fatto raggiunga il lettore
  // senza che qualcuno lo abbia approvato mettendoci il nome. Da quando in `data.ts` ci sono
  // bozze in attesa di verifica, contare avrebbe solo impedito di parcheggiarle dove si rivedono.

  test("nessun fatto approvato senza chi e quando", () => {
    for (const f of allAreaFacts()) {
      if (f.status !== "approved") continue;
      assert.ok(
        f.approvedBy?.trim() && f.approvedAt?.trim(),
        `${f.id}: "approved" senza approvedBy/approvedAt — non esiste auto-approve`,
      );
    }
  });

  test("le bozze NON diventano pubbliche", () => {
    // La prova vera: si prende ogni comune presente nel dataset e si verifica che la proiezione
    // pubblica non contenga nulla che non sia approvato.
    for (const municipality of new Set(allAreaFacts().map((f) => f.municipality))) {
      const profile = getPublicAreaProfile(municipality, { now: new Date(), locale: "it" });
      const published = profile?.facts.map((f) => f.text) ?? [];
      for (const draft of allAreaFacts().filter((f) => f.status !== "approved")) {
        assert.ok(
          !published.includes(draft.text),
          `${draft.id} è in stato "${draft.status}" ma comparirebbe in pagina`,
        );
      }
    }
  });
});

describe("provenienza: uno schema solo, e pretende tutto", () => {
  test("il vecchio record povero non passa più per un fatto d'area", () => {
    // Questa è ESATTAMENTE la forma che il modello rimosso accettava. Ora è rifiutata: mancano
    // ambito geografico, stato di approvazione, conflitti, data di revisione e proprietario
    // della fonte — cioè tutto ciò che rende un fatto pubblicabile con criterio.
    const legacy = {
      comune: "Tradate",
      scope: "comune",
      fact: "La stazione è sulla linea regionale.",
      sourceUrl: "https://www.comune.tradate.va.it/stazione",
      retrievedAt: "2026-08-01",
      approvedBy: "redazione",
    };
    const parsed = parseAreaFact(legacy);
    assert.equal(parsed.success, false);
  });

  test("una fonte senza proprietario non passa", () => {
    const parsed = parseAreaFact({
      id: "x",
      municipality: "Tradate",
      category: "transport",
      scope: "municipality",
      text: "La stazione di Tradate è sulla linea regionale.",
      source: { url: "https://esempio.it/a", retrievedAt: "2026-08-01T00:00:00.000Z" },
      reviewBy: "2027-02-01T00:00:00.000Z",
      status: "draft",
    });
    assert.equal(parsed.success, false);
  });

  test("schemaVersion ha un default: i record già scritti restano leggibili", () => {
    const parsed = parseAreaFact({
      id: "x",
      municipality: "Tradate",
      category: "transport",
      scope: "municipality",
      text: "La stazione di Tradate è sulla linea regionale.",
      source: {
        url: "https://esempio.it/a",
        owner: "Comune di Tradate",
        retrievedAt: "2026-08-01T00:00:00.000Z",
      },
      reviewBy: "2027-02-01T00:00:00.000Z",
      status: "draft",
    });
    assert.equal(parsed.success, true);
    assert.equal(parsed.data?.schemaVersion, AREA_SCHEMA_VERSION);
  });
});

describe("evidenza e racconto restano due cose separate", () => {
  const narrative = {
    areaKey: "it|lombardia|va|tradate|",
    locale: "it" as const,
    title: "Vivere a Tradate",
    intro: "Testo introduttivo.",
    sections: [
      { category: "transport" as const, heading: "Mobilità", body: "Testo.", factIds: ["af_1"] },
    ],
    claimMap: [{ claim: "La stazione serve la linea regionale.", factIds: ["af_1"] }],
    sourceIdsUsed: ["as_1"],
    factsHash: "deadbeefdeadbeef",
    promptVersion: AREA_PROMPT_VERSION,
    generatedAt: "2026-08-20T10:00:00.000Z",
    status: "draft" as const,
  };

  test("una narrativa valida si parsa e nasce bozza", () => {
    const parsed = AreaNarrativeSchema.safeParse(narrative);
    assert.equal(parsed.success, true, JSON.stringify(parsed.error?.issues));
    assert.equal(parsed.data?.status, "draft");
  });

  test("una sezione senza fatti a sostegno NON è ammessa", () => {
    // È il vincolo, non un'annotazione: prosa senza evidenza non si pubblica.
    const parsed = AreaNarrativeSchema.safeParse({
      ...narrative,
      sections: [{ category: "transport", heading: "Mobilità", body: "Testo.", factIds: [] }],
    });
    assert.equal(parsed.success, false);
  });

  test("il profilo d'area porta l'anagrafica, non i contenuti", () => {
    const parsed = AreaProfileSchema.safeParse({
      areaKey: "it|lombardia|va|tradate|abbiate-guazzone",
      label: "Abbiate Guazzone",
      municipalityAreaKey: "it|lombardia|va|tradate|",
      scope: "zone",
      status: "draft",
    });
    assert.equal(parsed.success, true, JSON.stringify(parsed.error?.issues));
    // Niente fatti né testi dentro il profilo: se ci fossero, tornerebbero le due verità.
    const keys = Object.keys(parsed.data ?? {});
    for (const forbidden of ["facts", "narrative", "text", "sections"]) {
      assert.ok(!keys.includes(forbidden), `il profilo non deve contenere "${forbidden}"`);
    }
  });

  test('"prove insufficienti" è uno stato legittimo del profilo', () => {
    // Un'area su cui le fonti non bastano ha un esito dichiarato, non un limbo: è la differenza
    // fra «non pubblichiamo perché non sappiamo» e «ci siamo dimenticati di quest'area».
    const parsed = AreaProfileSchema.safeParse({
      areaKey: "it|||gallarate|",
      label: "Gallarate",
      municipalityAreaKey: "it|||gallarate|",
      scope: "municipality",
      status: "insufficient-evidence",
    });
    assert.equal(parsed.success, true);
  });
});

describe("storia di revisione", () => {
  const base = {
    id: "ev_1",
    areaKey: "it|lombardia|va|tradate|",
    subject: "narrative" as const,
    subjectId: "n_1",
    actor: "redazione",
    at: "2026-08-20T10:00:00.000Z",
  };

  test("pubblicare, ritirare e rifiutare pretendono una motivazione", () => {
    for (const action of ["publish", "unpublish", "reject"] as const) {
      assert.equal(
        AreaReviewEventSchema.safeParse({ ...base, action }).success,
        false,
        `"${action}" senza motivazione non deve passare`,
      );
      assert.equal(
        AreaReviewEventSchema.safeParse({ ...base, action, reason: "verificato in redazione" })
          .success,
        true,
        `"${action}" con motivazione deve passare`,
      );
    }
  });

  test("gli eventi neutri non pretendono una motivazione", () => {
    assert.equal(AreaReviewEventSchema.safeParse({ ...base, action: "generate" }).success, true);
  });
});

describe("impronte deterministiche", () => {
  test("l'ordine dei campi non cambia l'impronta", () => {
    // Senza questa proprietà, riordinare i campi di un letterale rigenererebbe mezzo catalogo.
    assert.equal(stableStringify({ a: 1, b: 2 }), stableStringify({ b: 2, a: 1 }));
    assert.equal(contentHash({ a: 1, b: [2, 3] }), contentHash({ b: [2, 3], a: 1 }));
  });

  test("un campo assente e uno undefined sono la stessa cosa", () => {
    assert.equal(contentHash({ a: 1 }), contentHash({ a: 1, b: undefined }));
  });

  test("l'ordine di un array invece conta", () => {
    // Un array è una sequenza: [2,3] e [3,2] sono due contenuti diversi, e devono restarlo.
    assert.notEqual(contentHash({ a: [2, 3] }), contentHash({ a: [3, 2] }));
  });

  const factInput = {
    municipality: "Tradate",
    category: "transport",
    scope: "municipality",
    sourceUrl: "https://www.comune.tradate.va.it/stazione",
    text: "La stazione di Tradate è sulla linea ferroviaria regionale.",
  };

  test("stesso fatto → stesso id, ogni volta", () => {
    assert.equal(areaFactId(factInput), areaFactId({ ...factInput }));
    assert.match(areaFactId(factInput), /^af_[0-9a-f]{16}$/);
  });

  test("differenze di sola forma non creano un fatto nuovo", () => {
    // Correggere una maiuscola o un doppio spazio non deve costringere a riapprovare da zero.
    assert.equal(
      areaFactId(factInput),
      areaFactId({ ...factInput, municipality: "TRADATE  (VA)", text: `  ${factInput.text.toUpperCase()} ` }),
    );
  });

  test("cambiare ciò che il fatto AFFERMA crea un fatto diverso", () => {
    assert.notEqual(
      areaFactId(factInput),
      areaFactId({ ...factInput, text: "La stazione di Tradate è chiusa." }),
    );
  });

  test("stesso testo da una fonte diversa è un fatto diverso", () => {
    // Due enti che affermano la stessa cosa sono due evidenze, e il conflitto fra fonti deve
    // poter esistere: fonderle sotto un id solo lo renderebbe invisibile.
    assert.notEqual(
      areaFactId(factInput),
      areaFactId({ ...factInput, sourceUrl: "https://www.trenord.it/tradate" }),
    );
  });

  test("una frazione non è il suo comune", () => {
    assert.notEqual(areaFactId(factInput), areaFactId({ ...factInput, zone: "Abbiate Guazzone" }));
  });

  test("l'id di una fonte è il suo URL canonico", () => {
    assert.equal(areaSourceId("https://Esempio.it/A "), areaSourceId("https://esempio.it/a"));
    assert.match(areaSourceId("https://esempio.it/a"), /^as_[0-9a-f]{16}$/);
  });

  const facts = [
    { id: "af_b", text: "Secondo fatto." },
    { id: "af_a", text: "Primo fatto." },
  ];

  test("l'impronta dei fatti non dipende dall'ordine di lettura", () => {
    // Due job che leggono gli stessi fatti in ordine diverso devono concludere entrambi
    // «nulla da rigenerare».
    const opts = { locale: "it" as const, promptVersion: AREA_PROMPT_VERSION };
    assert.equal(areaFactsHash(facts, opts), areaFactsHash([...facts].reverse(), opts));
  });

  test("un fatto corretto nel testo rende obsoleta la narrativa", () => {
    const opts = { locale: "it" as const, promptVersion: AREA_PROMPT_VERSION };
    const corrected = [{ id: "af_b", text: "Secondo fatto, corretto." }, facts[1]];
    assert.notEqual(areaFactsHash(facts, opts), areaFactsHash(corrected, opts));
  });

  test("cambiare versione di prompt o lingua rende obsoleta la narrativa", () => {
    const base = { locale: "it" as const, promptVersion: AREA_PROMPT_VERSION };
    assert.notEqual(areaFactsHash(facts, base), areaFactsHash(facts, { ...base, promptVersion: "area-writer-2" }));
    assert.notEqual(areaFactsHash(facts, base), areaFactsHash(facts, { ...base, locale: "en" }));
  });
});

describe("l'italiano resta la lingua canonica", () => {
  test("il commento di dominio lo dichiara, e lo schema lo riflette", () => {
    const src = readFileSync(join(process.cwd(), "app/lib/territory/area/types.ts"), "utf8");
    assert.match(src, /copia CANONICA/i);
    // Una traduzione porta un flag `approved` proprio: non esce finché non è rivista.
    assert.match(src, /AreaFactTranslationSchema[\s\S]{0,200}approved: z\.boolean\(\)/);
  });
});
