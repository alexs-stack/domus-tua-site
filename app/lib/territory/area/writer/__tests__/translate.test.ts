// La traduzione delle narrative d'area: cosa può cambiare, e cosa no.
//
// Il rischio specifico di questo passaggio è che un traduttore AGGIUNGA. È addestrato a produrre
// testo scorrevole, e in prosa immobiliare "scorrevole" significa un aggettivo in più, un
// "conveniently located" che nessuna fonte sostiene, una distanza arrotondata per chiarezza.
// Ogni aggiunta passerebbe i controlli sul testo italiano — che resta corretto — e uscirebbe in
// una lingua che nessuno in agenzia rilegge.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  translateNarrative,
  validateTranslation,
  protectedTokens,
  isTranslationStale,
  type AreaTranslator,
  type TranslationFailureCode,
} from "../translate";
import { AREA_TRANSLATION_SYSTEM } from "../prompts";
import { AREA_SCHEMA_VERSION, AREA_PROMPT_VERSION } from "../../types";
import type { AreaNarrative } from "../../types";

const NOW = new Date("2026-08-20T10:00:00.000Z");

function narrative(over: Partial<AreaNarrative> = {}): AreaNarrative {
  return {
    areaKey: "it|lombardia|va|tradate|",
    locale: "it",
    title: "Vivere a Tradate",
    intro: "La stazione di Tradate è servita dalla linea S40, con 42 corse giornaliere.",
    sections: [
      {
        category: "transport",
        heading: "Mobilità",
        body: "Dalla stazione di Tradate parte la linea S40 verso Milano Cadorna.",
        factIds: ["af_1"],
      },
      {
        category: "municipal-service",
        heading: "Servizi quotidiani",
        body: "La biblioteca Frera ha sede in centro.",
        factIds: ["af_2"],
      },
    ],
    claimMap: [
      { claim: "La stazione serve la linea S40.", factIds: ["af_1"] },
      { claim: "La biblioteca Frera è in centro.", factIds: ["af_2"] },
    ],
    sourceIdsUsed: ["as_1", "as_2"],
    factsHash: "impronta-canonica",
    promptVersion: AREA_PROMPT_VERSION,
    generatedAt: "2026-08-19T10:00:00.000Z",
    status: "approved",
    approvedBy: "redazione",
    approvedAt: "2026-08-19T12:00:00.000Z",
    schemaVersion: AREA_SCHEMA_VERSION,
    ...over,
  };
}

/** Un traduttore onesto: cambia le parole, tocca nient'altro. */
const honestTranslator: AreaTranslator = async ({ source }) => ({
  title: "Living in Tradate",
  intro: "Tradate station is served by the S40 line, with 42 daily services.",
  sections: [
    { heading: "Getting around", body: "The S40 line runs from Tradate station towards Milano Cadorna." },
    { heading: "Everyday services", body: "The Frera library is in the town centre." },
  ],
  claimMap: [
    { claim: "The station serves the S40 line." },
    { claim: "The Frera library is in the centre." },
  ],
  // Il traduttore restituisce anche altro: deve essere ignorato.
  areaKey: "it|||altrove|",
  factsHash: "inventata",
  status: "approved",
  ...(source ? {} : {}),
});

async function translate(t: AreaTranslator, source = narrative()) {
  return translateNarrative({ source, target: "en" }, t, { now: NOW });
}

describe("il caso buono", () => {
  test("una traduzione onesta passa e nasce BOZZA", async () => {
    const r = await translate(honestTranslator);
    assert.equal(r.ok, true, r.ok === false ? JSON.stringify(r.failures) : "");
    if (!r.ok) return;
    assert.equal(r.narrative.locale, "en");
    assert.equal(r.narrative.title, "Living in Tradate");
    // Una traduzione automatica di un testo approvato NON eredita l'approvazione:
    // l'approvazione riguardava parole diverse.
    assert.equal(r.narrative.status, "draft");
    assert.equal(r.narrative.approvedBy, undefined);
  });

  test("ciò che il traduttore non deve toccare viene dalla canonica, non da lui", async () => {
    // Il traduttore finto dichiara un'altra area, un'altra impronta e lo stato approvato:
    // nessuno dei tre arriva. È lo stesso elenco chiuso usato dal generatore.
    const r = await translate(honestTranslator);
    assert.equal(r.ok, true);
    if (!r.ok) return;
    assert.equal(r.narrative.areaKey, "it|lombardia|va|tradate|");
    assert.equal(r.narrative.factsHash, "impronta-canonica");
    assert.deepEqual(r.narrative.sections.map((s) => s.factIds), [["af_1"], ["af_2"]]);
    assert.deepEqual(r.narrative.sections.map((s) => s.category), ["transport", "municipal-service"]);
    assert.deepEqual(r.narrative.sourceIdsUsed, ["as_1", "as_2"]);
  });

  test("il modello traduttore viene registrato", async () => {
    const r = await translateNarrative({ source: narrative(), target: "en" }, honestTranslator, {
      now: NOW,
      modelId: "traduttore-x",
    });
    assert.equal(r.ok && r.narrative.modelId, "traduttore-x");
  });
});

describe("si traduce solo l'approvato", () => {
  for (const status of ["draft", "rejected", "superseded"] as const) {
    test(`una canonica "${status}" non si traduce`, async () => {
      // Tradurre una bozza significa moltiplicare per il numero di lingue un testo che
      // potrebbe non uscire mai.
      const r = await translate(honestTranslator, narrative({ status, approvedBy: undefined, approvedAt: undefined }));
      assert.equal(r.ok, false);
      assert.equal(r.ok === false && r.failures[0].code, "not-approved-source");
    });
  }

  test("non si traduce l'italiano in italiano", async () => {
    const r = await translateNarrative({ source: narrative(), target: "it" }, honestTranslator, { now: NOW });
    assert.equal(r.ok, false);
    assert.equal(r.ok === false && r.failures[0].code, "same-locale");
  });
});

describe("ciò che una traduzione NON può fare", () => {
  /** Un traduttore che parte onesto e poi sbaglia una cosa sola. */
  function sloppy(mutate: (out: Record<string, unknown>) => void): AreaTranslator {
    return async (input, prompt) => {
      const out = (await honestTranslator(input, prompt)) as Record<string, unknown>;
      mutate(out);
      return out;
    };
  }

  const cases: Array<{ name: string; mutate: (o: Record<string, unknown>) => void; expect: TranslationFailureCode }> = [
    {
      name: "cambiare un numero",
      mutate: (o) => {
        o.intro = "Tradate station is served by the S40 line, with about 40 daily services.";
      },
      expect: "numbers-changed",
    },
    {
      name: "aggiungere un numero che in italiano non c'era",
      mutate: (o) => {
        o.intro = "Tradate station is served by the S40 line, 2 km from the centre, with 42 daily services.";
      },
      expect: "numbers-changed",
    },
    {
      name: "tradurre il nome di una linea ufficiale",
      mutate: (o) => {
        o.intro = "Tradate station is served by line 40, with 42 daily services.";
        o.sections = [
          { heading: "Getting around", body: "Line 40 runs from Tradate station towards Milan Cadorna." },
          { heading: "Everyday services", body: "The Frera library is in the town centre." },
        ];
      },
      expect: "proper-names-changed",
    },
    {
      // Il modo reale in cui un traduttore perde un nome proprio: non lo traduce, lo GENERALIZZA
      // ("la biblioteca Frera" → "the public library"). Il testo resta corretto e diventa
      // inservibile a chi deve cercarla.
      name: "generalizzare un nome proprio invece di conservarlo",
      mutate: (o) => {
        o.sections = [
          { heading: "Getting around", body: "The S40 line runs from Tradate station towards Milano Cadorna." },
          { heading: "Everyday services", body: "The public library is in the town centre." },
        ];
        o.claimMap = [{ claim: "The station serves the S40 line." }, { claim: "The library is in the centre." }];
      },
      expect: "proper-names-changed",
    },
    {
      name: "restituire meno sezioni",
      mutate: (o) => {
        o.sections = [{ heading: "Getting around", body: "The S40 line runs from Tradate station." }];
      },
      expect: "structure-changed",
    },
    {
      name: "restituire il testo italiano invariato",
      mutate: (o) => {
        o.title = "Vivere a Tradate";
        o.intro = "La stazione di Tradate è servita dalla linea S40, con 42 corse giornaliere.";
        o.sections = [
          { heading: "Mobilità", body: "Dalla stazione di Tradate parte la linea S40 verso Milano Cadorna." },
          { heading: "Servizi quotidiani", body: "La biblioteca Frera ha sede in centro." },
        ];
        o.claimMap = [
          { claim: "La stazione serve la linea S40." },
          { claim: "La biblioteca Frera è in centro." },
        ];
      },
      expect: "untranslated",
    },
  ];

  for (const { name, mutate, expect } of cases) {
    test(`${name} → ${expect}`, async () => {
      const r = await translate(sloppy(mutate));
      assert.equal(r.ok, false, `«${name}» è passata`);
      if (r.ok) return;
      assert.ok(
        r.failures.some((x) => x.code === expect),
        `atteso ${expect}, ottenuto [${r.failures.map((x) => x.code).join(", ")}]`,
      );
    });
  }
});

describe("nomi protetti", () => {
  test("codici di linea e strada sono protetti ovunque, anche a inizio frase", () => {
    // "S40" a inizio frase è comunque una denominazione ufficiale: tradurla rende
    // l'informazione inutilizzabile a chi deve cercarla su un cartello.
    assert.ok(protectedTokens("S40 collega Tradate a Milano.").includes("S40"));
    assert.ok(protectedTokens("La linea è la SS233 Varesina.").includes("SS233"));
  });

  test("la parola d'apertura di una frase non è un nome proprio", () => {
    assert.ok(!protectedTokens("La stazione è aperta. Il servizio è attivo.").includes("La"));
    assert.ok(!protectedTokens("La stazione è aperta. Il servizio è attivo.").includes("Il"));
  });

  test("i nomi propri interni alla frase lo sono", () => {
    const tokens = protectedTokens("Il parco Cinque Vie confina con Tradate.");
    assert.ok(tokens.includes("Cinque"));
    assert.ok(tokens.includes("Tradate"));
  });
});

describe("obsolescenza", () => {
  test("se la canonica cambia sotto, la traduzione è obsoleta", () => {
    // È la parte che nessuno noterebbe da solo: la traduzione racconterebbe fatti che non sono
    // più quelli, in una lingua che in agenzia nessuno rilegge.
    const source = narrative({ factsHash: "nuova-impronta" });
    const translated = narrative({ locale: "en", status: "draft", factsHash: "impronta-canonica" });
    assert.equal(isTranslationStale(source, translated), true);
    assert.equal(isTranslationStale(narrative(), translated), false);
  });

  test("la validazione blocca una traduzione con impronta diversa", () => {
    const failures = validateTranslation(
      narrative(),
      narrative({ locale: "en", status: "draft", factsHash: "altra" }),
    );
    assert.ok(failures.some((f) => f.code === "facts-hash-changed"));
  });
});

describe("il prompt", () => {
  test("vieta esplicitamente di aggiungere e di tradurre i nomi ufficiali", () => {
    assert.match(AREA_TRANSLATION_SYSTEM, /Add no fact, adjective, distance/i);
    assert.match(AREA_TRANSLATION_SYSTEM, /Do not translate official proper names/i);
    assert.match(AREA_TRANSLATION_SYSTEM, /DRAFT and must not claim to be approved/i);
  });
});
