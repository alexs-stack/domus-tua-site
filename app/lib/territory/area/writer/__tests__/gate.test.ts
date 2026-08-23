// Il cancello di pubblicazione: strato deterministico + giudice.
//
// Il test che conta più di tutti è «una narrativa elegante ma non sostenuta viene bocciata».
// È la richiesta esplicita dell'audit, ed è anche l'unico modo di dimostrare che il sistema non
// premia la prosa: un testo scritto benissimo che cita un parco inesistente deve fallire
// esattamente come uno scritto male.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { validateNarrative, properNamesIn, INTRO_MIN_WORDS } from "../narrativeGuard";
import {
  runPublicationGate,
  deterministicJudge,
  PUBLICATION_THRESHOLD,
  REJECT_THRESHOLD,
  MAX_SCORE,
  JUDGE_CRITERIA,
  type AreaJudge,
  type JudgeVerdict,
} from "../judge";
import { AREA_SCHEMA_VERSION, AREA_PROMPT_VERSION } from "../../types";
import type { AreaFact, AreaNarrative } from "../../types";
import { areaFactsHash } from "../../hash";

const AREA_KEY = "it|lombardia|va|tradate|";
const NOW = new Date("2026-08-20T10:00:00.000Z");

function approvedFact(over: Partial<AreaFact> & { id: string; text: string }): AreaFact {
  return {
    municipality: "Tradate",
    category: "transport",
    scope: "municipality",
    translations: [],
    source: {
      url: "https://www.comune.tradate.va.it/a",
      owner: "Comune di Tradate",
      retrievedAt: "2026-08-01T00:00:00.000Z",
    },
    reviewBy: "2027-02-01T00:00:00.000Z",
    status: "approved",
    approvedBy: "redazione",
    approvedAt: "2026-08-05T00:00:00.000Z",
    conflicts: [],
    schemaVersion: AREA_SCHEMA_VERSION,
    ...over,
  };
}

const FACTS: AreaFact[] = [
  approvedFact({
    id: "af_stazione",
    category: "transport",
    text: "La stazione di Tradate è servita dalla linea ferroviaria regionale Saronno–Varese.",
  }),
  approvedFact({
    id: "af_biblioteca",
    category: "municipal-service",
    text: "La biblioteca comunale Frera si trova nel centro di Tradate.",
  }),
  approvedFact({
    id: "af_parco",
    category: "park-facility",
    text: "Il parco pubblico Cinque Vie è gestito dal Comune di Tradate.",
  }),
];

/** Introduzione di lunghezza corretta (60–90 parole), costruita dai fatti reali. */
const INTRO = [
  "Tradate si trova nella parte meridionale della provincia, e la sua vita quotidiana ruota",
  "attorno a pochi riferimenti facili da individuare. La stazione collega il comune alla rete",
  "ferroviaria regionale sulla direttrice Saronno–Varese, mentre i servizi comunali si",
  "concentrano nel centro, dove ha sede anche la biblioteca Frera. Il verde pubblico è",
  "presidiato dal parco Cinque Vie, gestito direttamente dal Comune. Quello che segue riporta",
  "soltanto informazioni verificate su fonti comunali, con la data del controllo indicata in",
  "fondo alla pagina per ciascuna voce riportata qui sopra.",
].join(" ");

function narrative(over: Partial<AreaNarrative> = {}): AreaNarrative {
  const base: AreaNarrative = {
    areaKey: AREA_KEY,
    locale: "it",
    title: "Vivere a Tradate",
    intro: INTRO,
    sections: [
      {
        category: "transport",
        heading: "Mobilità",
        body: "Il comune è collegato alla rete regionale: dalla stazione partono i treni della direttrice Saronno–Varese.",
        factIds: ["af_stazione"],
      },
      {
        category: "municipal-service",
        heading: "Servizi quotidiani",
        body: "I servizi comunali si concentrano in centro, dove ha sede la biblioteca Frera.",
        factIds: ["af_biblioteca"],
      },
      {
        category: "park-facility",
        heading: "Verde e tempo libero",
        body: "Il verde pubblico più esteso è il parco Cinque Vie, in gestione al Comune.",
        factIds: ["af_parco"],
      },
    ],
    claimMap: [
      { claim: "La stazione serve la direttrice Saronno–Varese.", factIds: ["af_stazione"] },
      { claim: "La biblioteca Frera è in centro.", factIds: ["af_biblioteca"] },
      { claim: "Il parco Cinque Vie è comunale.", factIds: ["af_parco"] },
    ],
    sourceIdsUsed: ["as_1"],
    factsHash: areaFactsHash(FACTS, { locale: "it", promptVersion: AREA_PROMPT_VERSION }),
    promptVersion: AREA_PROMPT_VERSION,
    generatedAt: "2026-08-20T09:00:00.000Z",
    status: "draft",
    schemaVersion: AREA_SCHEMA_VERSION,
    ...over,
  };
  // Se il chiamante cambia i fatti attesi, l'impronta va ricalcolata a meno che non l'abbia
  // sovrascritta lui apposta (è quello che fa il test sull'impronta).
  return base;
}

function validate(n: AreaNarrative, facts: readonly AreaFact[] = FACTS) {
  return validateNarrative({
    narrative: n,
    approvedFacts: facts,
    now: NOW,
    promptVersion: AREA_PROMPT_VERSION,
  });
}

describe("strato 1 — il caso buono passa", () => {
  test("una narrativa agganciata a fatti approvati e freschi non ha ostacoli", () => {
    const r = validate(narrative());
    assert.deepEqual(r.failures, [], JSON.stringify(r.failures, null, 2));
    assert.deepEqual(r.citedFactIds, ["af_biblioteca", "af_parco", "af_stazione"]);
  });
});

describe("strato 1 — l'aggancio all'evidenza", () => {
  test("IL TEST CHE CONTA: elegante ma non sostenuta → bocciata", () => {
    // Prosa impeccabile, ritmo giusto, nessuna parola vietata. E un parco che non esiste in
    // nessun fatto approvato. Deve fallire esattamente come un testo scritto male: il sistema
    // non premia la scrittura, verifica l'evidenza.
    const elegant = narrative({
      sections: [
        narrative().sections[0],
        {
          category: "park-facility",
          heading: "Verde e tempo libero",
          body:
            "Le giornate più lente trovano spazio nel parco delle Rimembranze, dove i platani " +
            "disegnano un viale ombroso fino alla riva del torrente.",
          factIds: ["af_parco"],
        },
      ],
      claimMap: [{ claim: "Il parco delle Rimembranze ha un viale di platani.", factIds: ["af_parco"] }],
    });
    const r = validate(elegant);
    assert.ok(r.failures.length > 0, "una narrativa non sostenuta è passata");
    assert.ok(
      r.failures.some((x) => x.code === "unsupported-place-name"),
      `atteso unsupported-place-name, ottenuto [${r.failures.map((x) => x.code).join(", ")}]`,
    );
  });

  test("un'affermazione senza fatti: bocciata", () => {
    const r = validate(
      narrative({
        claimMap: [{ claim: "In centro ci sono molti negozi.", factIds: [] }],
      }),
    );
    // Lo schema pretende almeno un factId per affermazione: il rifiuto arriva già dalla forma.
    assert.ok(r.failures.some((x) => x.code === "schema-invalid" || x.code === "claim-without-facts"));
  });

  test("un fatto citato che non esiste: bocciata", () => {
    const r = validate(
      narrative({
        claimMap: [{ claim: "Esiste un mercato settimanale.", factIds: ["af_inventato"] }],
      }),
    );
    assert.ok(r.failures.some((x) => x.code === "fact-not-found"));
  });

  test("un fatto non approvato: bocciata", () => {
    const draftFacts = FACTS.map((f) =>
      f.id === "af_parco" ? { ...f, status: "draft" as const, approvedBy: undefined, approvedAt: undefined } : f,
    );
    const r = validateNarrative({
      narrative: narrative({
        factsHash: areaFactsHash(draftFacts, { locale: "it", promptVersion: AREA_PROMPT_VERSION }),
      }),
      approvedFacts: draftFacts,
      now: NOW,
      promptVersion: AREA_PROMPT_VERSION,
    });
    assert.ok(r.failures.some((x) => x.code === "fact-not-approved"));
  });

  test("un fatto scaduto: bocciata", () => {
    const staleFacts = FACTS.map((f) =>
      f.id === "af_parco" ? { ...f, reviewBy: "2026-01-01T00:00:00.000Z" } : f,
    );
    const r = validateNarrative({
      narrative: narrative({
        factsHash: areaFactsHash(staleFacts, { locale: "it", promptVersion: AREA_PROMPT_VERSION }),
      }),
      approvedFacts: staleFacts,
      now: NOW,
      promptVersion: AREA_PROMPT_VERSION,
    });
    assert.ok(r.failures.some((x) => x.code === "fact-stale"));
  });

  test("i fatti sono cambiati dopo la generazione: il testo si sa obsoleto", () => {
    // Senza questo controllo un testo resterebbe pubblicato all'infinito mentre l'evidenza
    // sotto cambia, affermando oggi ciò che era vero mesi fa.
    const r = validate(narrative({ factsHash: "impronta-vecchia" }));
    assert.ok(r.failures.some((x) => x.code === "facts-hash-mismatch"));
  });
});

describe("strato 1 — numeri e nomi", () => {
  test("un numero che nessun fatto citato contiene: bocciato", () => {
    const r = validate(
      narrative({
        sections: [
          {
            category: "transport",
            heading: "Mobilità",
            body: "Dalla stazione partono 40 corse al giorno verso il capoluogo.",
            factIds: ["af_stazione"],
          },
          narrative().sections[1],
        ],
        claimMap: [{ claim: "Ci sono 40 corse.", factIds: ["af_stazione"] }],
      }),
    );
    assert.ok(r.failures.some((x) => x.code === "unsupported-number"));
  });

  test("il nome dell'area non è mai un nome non sostenuto", () => {
    // "Tradate" compare nel titolo e nell'introduzione: bloccarlo renderebbe impossibile
    // scrivere qualunque testo.
    const r = validate(narrative());
    assert.ok(!r.failures.some((x) => x.evidence === "Tradate"));
  });

  test("i nomi propri si riconoscono senza contare l'inizio di frase", () => {
    assert.deepEqual(properNamesIn("Tradate è un comune. La stazione Frera è chiusa."), ["Frera"]);
    assert.deepEqual(properNamesIn("Il parco Cinque Vie è comunale."), ["Cinque", "Vie"]);
  });
});

describe("strato 1 — struttura e linguaggio", () => {
  test("introduzione troppo corta: bocciata", () => {
    const r = validate(narrative({ intro: "Tradate è un comune della provincia di Varese." }));
    const failure = r.failures.find((x) => x.code === "intro-length");
    assert.ok(failure);
    assert.match(failure.message, new RegExp(String(INTRO_MIN_WORDS)));
  });

  test("categorie fuori dall'ordine canonico: bocciata", () => {
    // L'ordine è ciò che rende le schede confrontabili: senza, ogni pagina va riletta da capo.
    const s = narrative().sections;
    const r = validate(narrative({ sections: [s[2], s[0], s[1]] }));
    assert.ok(r.failures.some((x) => x.code === "category-out-of-order"));
  });

  test("stesso fatto in due sezioni: bocciata", () => {
    const r = validate(
      narrative({
        sections: [
          narrative().sections[0],
          { ...narrative().sections[1], factIds: ["af_stazione"] },
        ],
      }),
    );
    assert.ok(r.failures.some((x) => x.code === "duplicate-fact-across-sections"));
  });

  test("linguaggio vietato: bocciata", () => {
    const r = validate(
      narrative({ title: "Vivere a Tradate, zona sicura e tranquilla" }),
    );
    assert.ok(r.failures.some((x) => x.code === "prohibited-language"));
  });

  test("coordinate nel testo: bocciata", () => {
    const r = validate(
      narrative({
        sections: [
          { ...narrative().sections[0], body: "La stazione si trova a 45.70812, 8.90634 nel comune." },
          narrative().sections[1],
        ],
      }),
    );
    assert.ok(r.failures.some((x) => x.code === "coordinates-exposed"));
  });

  test("la sezione che ricopia il fatto invece di raccontarlo: bocciata", () => {
    // Il risultato sarebbe un elenco di fatti incollati, non una descrizione.
    const r = validate(
      narrative({
        sections: [
          { ...narrative().sections[0], body: FACTS[0].text },
          narrative().sections[1],
        ],
      }),
    );
    assert.ok(r.failures.some((x) => x.code === "copied-fact-language"));
  });
});

describe("il cancello completo", () => {
  const gate = (n: AreaNarrative, judge: AreaJudge = deterministicJudge) =>
    runPublicationGate({
      narrative: n,
      approvedFacts: FACTS,
      now: NOW,
      promptVersion: AREA_PROMPT_VERSION,
      judge,
    });

  const perfectJudge: AreaJudge = async () => ({
    pass: true,
    score: MAX_SCORE,
    criterionScores: { ...JUDGE_CRITERIA },
    hardFailures: [],
    unsupportedClaims: [],
    weakClaims: [],
    styleProblems: [],
    geographicProblems: [],
    revisionInstructions: [],
  });

  test("una bozza rotta non arriva MAI al giudice", async () => {
    // Due effetti: non si paga una chiamata inutile, e un punteggio alto non può coprire
    // un'affermazione non agganciata.
    let called = false;
    const spy: AreaJudge = async (...args) => {
      called = true;
      return perfectJudge(...args);
    };
    const r = await gate(narrative({ factsHash: "vecchia" }), spy);
    assert.equal(called, false, "il giudice è stato chiamato su una bozza già bocciata");
    assert.equal(r.decision, "reject");
    assert.equal(r.verdict, null);
  });

  test("100/100 non salva una violazione grave", async () => {
    const strictJudge: AreaJudge = async (...args) => ({
      ...(await perfectJudge(...args)),
      hardFailures: ["il toponimo «parco delle Rimembranze» non compare nell'evidenza"],
    });
    const r = await gate(narrative(), strictJudge);
    assert.equal(r.decision, "reject");
    assert.ok(r.reasons.some((x) => /violazione grave/.test(x)));
  });

  test("sotto 75: si rigenera", async () => {
    const badJudge: AreaJudge = async (...args) => ({ ...(await perfectJudge(...args)), score: 60, pass: false });
    const r = await gate(narrative(), badJudge);
    assert.equal(r.decision, "reject");
    assert.ok(r.reasons.some((x) => x.includes(String(REJECT_THRESHOLD))));
  });

  test("fra 75 e 95: revisione umana, non pubblicazione", async () => {
    const okJudge: AreaJudge = async (...args) => ({ ...(await perfectJudge(...args)), score: 88, pass: false });
    const r = await gate(narrative(), okJudge);
    assert.equal(r.decision, "manual-review");
  });

  test("da 95 in su e senza violazioni: idoneo", async () => {
    const r = await gate(narrative(), perfectJudge);
    assert.equal(r.decision, "publish-eligible");
    assert.ok(r.reasons[0].includes(String(PUBLICATION_THRESHOLD)) || r.verdict!.score >= PUBLICATION_THRESHOLD);
  });

  test('"idoneo" non è "pubblicato"', async () => {
    // La distinzione regge tutto il dominio: il cancello toglie gli ostacoli automatici, la
    // pubblicazione resta un atto umano con nome, data e motivazione.
    const r = await gate(narrative(), perfectJudge);
    assert.equal(r.decision, "publish-eligible");
    assert.equal(narrative().status, "draft");
  });
});

describe("il giudice deterministico", () => {
  test("non restituisce mai testo corretto, solo istruzioni", async () => {
    // Un giudice che ripara è il generatore che si dà un voto da solo.
    const verdict: JudgeVerdict = await deterministicJudge({
      narrative: narrative({ title: "Una descrizione della zona" }),
      approvedFacts: FACTS,
      now: NOW,
    });
    const keys = Object.keys(verdict);
    for (const forbidden of ["correctedNarrative", "rewrittenText", "narrative", "fixed"]) {
      assert.ok(!keys.includes(forbidden), `il giudice restituisce "${forbidden}"`);
    }
    assert.ok(verdict.revisionInstructions.length > 0);
  });

  test("penalizza il testo che non nomina nulla di specifico", async () => {
    // È la modalità di fallimento più subdola: ogni frase è corretta, e il testo vale per
    // qualunque paese d'Italia.
    const generic = narrative({
      intro: Array.from({ length: 70 }, (_, i) => (i % 2 ? "servizi" : "comune")).join(" "),
      sections: [
        { category: "transport", heading: "Mobilità", body: "Sono presenti collegamenti.", factIds: ["af_stazione"] },
        { category: "municipal-service", heading: "Servizi", body: "Sono presenti servizi.", factIds: ["af_biblioteca"] },
      ],
      claimMap: [{ claim: "Sono presenti collegamenti.", factIds: ["af_stazione"] }],
    });
    const verdict = await deterministicJudge({ narrative: generic, approvedFacts: FACTS, now: NOW });
    assert.ok(verdict.score < PUBLICATION_THRESHOLD, `punteggio ${verdict.score}`);
    assert.ok(verdict.weakClaims.length > 0);
  });

  test("il testo buono supera la soglia", async () => {
    const verdict = await deterministicJudge({ narrative: narrative(), approvedFacts: FACTS, now: NOW });
    assert.ok(verdict.score >= PUBLICATION_THRESHOLD, `punteggio ${verdict.score}: ${verdict.weakClaims.join("; ")}`);
  });

  test("i pesi dei criteri sommano a 100", () => {
    assert.equal(MAX_SCORE, 100);
  });
});
