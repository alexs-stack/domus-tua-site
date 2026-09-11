// La validazione dura dei fatti d'area, comprese le frasi avversarie dell'audit.
//
// Metà di questi test verificano che qualcosa NON passi. È la parte che conta: un guard si
// giudica da ciò che ferma, e la lista di frasi qui sotto è quella che un generatore — umano o
// modello — produce spontaneamente quando gli si chiede di descrivere una zona.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  validateAreaFact,
  isFactApprovable,
  jaccardSimilarity,
  longestCommonWordRun,
  numbersIn,
  significantWords,
  NEAR_DUPLICATE_THRESHOLD,
  COPIED_RUN_THRESHOLD,
  type FactViolationCode,
} from "../factGuard";
import { AREA_SCHEMA_VERSION } from "../types";
import type { AreaFact } from "../types";
import type { AreaSourceRecord } from "../store/repository";

const AREA_KEY = "it|lombardia|va|tradate|";
const NOW = new Date("2026-08-20T10:00:00.000Z");

function fact(over: Partial<AreaFact> = {}): AreaFact {
  return {
    id: "af_1",
    municipality: "Tradate",
    category: "transport",
    scope: "municipality",
    text: "La stazione di Tradate è servita da una linea ferroviaria regionale.",
    translations: [],
    source: {
      url: "https://www.comune.tradate.va.it/stazione",
      owner: "Comune di Tradate",
      retrievedAt: "2026-08-01T00:00:00.000Z",
    },
    reviewBy: "2027-02-01T00:00:00.000Z",
    status: "draft",
    conflicts: [],
    schemaVersion: AREA_SCHEMA_VERSION,
    ...over,
  };
}

function source(over: Partial<AreaSourceRecord> = {}): AreaSourceRecord {
  return {
    sourceId: "as_1",
    areaKey: AREA_KEY,
    url: "https://www.comune.tradate.va.it/stazione",
    canonicalUrl: "https://www.comune.tradate.va.it/stazione",
    owner: "Comune di Tradate",
    sourceType: "municipality",
    retrievedAt: "2026-08-01T00:00:00.000Z",
    reviewBy: "2027-02-01T00:00:00.000Z",
    contentHash: "h",
    status: "active",
    ...over,
  };
}

/** Codici emessi validando `text` (resto del fatto invariato). */
function codesFor(text: string, over: Partial<AreaFact> = {}): FactViolationCode[] {
  return validateAreaFact({ fact: fact({ text, ...over }), areaKey: AREA_KEY, now: NOW }).violations.map(
    (x) => x.code,
  );
}

describe("il caso buono passa", () => {
  test("un fatto neutro, con fonte fresca e ambito coerente, non ha ostacoli", () => {
    const result = validateAreaFact({ fact: fact(), areaKey: AREA_KEY, now: NOW, source: source() });
    assert.deepEqual(result.violations, []);
    assert.equal(result.state, "approvable");
  });

  test('"approvabile" non è "approvato"', () => {
    // La distinzione è il cuore del dominio: il guard toglie gli ostacoli automatici, non
    // sostituisce la firma di un umano.
    const result = validateAreaFact({ fact: fact(), areaKey: AREA_KEY, now: NOW });
    assert.equal(result.state, "approvable");
    assert.equal(fact().status, "draft");
  });
});

describe("frasi avversarie — l'elenco dell'audit", () => {
  // Ogni riga è una frase che un generatore produce spontaneamente e che non deve passare.
  const CASES: Array<{ text: string; expect: FactViolationCode }> = [
    { text: "Tradate è una zona sicura e ben tenuta.", expect: "subjective-language" },
    { text: "Il quartiere è prestigioso e molto richiesto.", expect: "subjective-language" },
    { text: "È una zona ideale per famiglie con bambini.", expect: "subjective-language" },
    { text: "Le scuole della zona sono eccellenti.", expect: "school-quality-claim" },
    { text: "È un'area giovane, abitata da giovani famiglie.", expect: "protected-class-implication" },
    { text: "La stazione è a due passi dal centro.", expect: "promotional-language" },
    { text: "È una via ben frequentata e tranquilla.", expect: "promotional-language" },
    { text: "Il collegamento con Milano è rapidissimo.", expect: "subjective-language" },
    { text: "Milano si raggiunge in pochi minuti in treno.", expect: "travel-time-without-routing" },
    { text: "La stazione è a 10 minuti a piedi dal municipio.", expect: "travel-time-without-routing" },
    { text: "Il liceo di Tradate è fra i migliori della provincia.", expect: "ranking-claim" },
    { text: "La biblioteca si trova in Via Gramsci 12.", expect: "exact-address-disclosure" },
    { text: "Zona servitissima da negozi e servizi.", expect: "promotional-language" },
    { text: "Posizione strategica rispetto alle principali arterie.", expect: "promotional-language" },
    { text: "Il comune è ben collegato con il capoluogo.", expect: "promotional-language" },
  ];

  for (const { text, expect } of CASES) {
    test(`«${text}» → ${expect}`, () => {
      const codes = codesFor(text);
      assert.ok(
        codes.includes(expect),
        `atteso ${expect}, ottenuto [${codes.join(", ")}]`,
      );
    });
  }

  test("nessuna di queste frasi è approvabile", () => {
    for (const { text } of CASES) {
      assert.equal(
        isFactApprovable({ fact: fact({ text }), areaKey: AREA_KEY, now: NOW }),
        false,
        `«${text}» è passata`,
      );
    }
  });
});

describe("le alternative fattuali dell'audit invece passano", () => {
  // La controprova che il guard non è solo severo: le riformulazioni corrette devono passare,
  // altrimenti sarebbe inutilizzabile e qualcuno lo spegnerebbe.
  const GOOD = [
    "Nel raggio verificato risultano una farmacia, un supermercato e la stazione.",
    "La stazione di Tradate serve la linea ferroviaria regionale Milano–Varese.",
    "Nel comune sono presenti una scuola primaria e un parco pubblico.",
    "Il municipio di Tradate ospita i servizi anagrafici.",
    "La biblioteca comunale è aperta dal lunedì al sabato.",
  ];
  for (const text of GOOD) {
    test(`«${text}»`, () => {
      const codes = codesFor(text);
      assert.deepEqual(codes, [], `bloccata senza motivo: [${codes.join(", ")}]`);
    });
  }
});

describe("provenienza", () => {
  test("fonte incompleta: bloccato", () => {
    const codes = validateAreaFact({
      fact: fact({ source: { url: "https://x.it/a", owner: "", retrievedAt: "2026-08-01T00:00:00.000Z" } as AreaFact["source"] }),
      areaKey: AREA_KEY,
      now: NOW,
    }).violations.map((x) => x.code);
    assert.ok(codes.includes("missing-provenance"));
  });

  test("fonte non registrata nello store: bloccato", () => {
    const r = validateAreaFact({ fact: fact(), areaKey: AREA_KEY, now: NOW, source: null });
    assert.ok(r.violations.some((x) => x.code === "source-not-found"));
  });

  test("fonte irraggiungibile: bloccato", () => {
    const r = validateAreaFact({
      fact: fact(),
      areaKey: AREA_KEY,
      now: NOW,
      source: source({ status: "unreachable", lastHttpStatus: 404 }),
    });
    assert.ok(r.violations.some((x) => x.code === "source-unreachable"));
  });

  test("fonte scaduta: stato «stale», non «rejected»", () => {
    // Una fonte scaduta si ricontrolla; non è un fatto sbagliato. Confondere i due stati farebbe
    // buttare evidenza buona a ogni scadenza.
    const r = validateAreaFact({
      fact: fact(),
      areaKey: AREA_KEY,
      now: NOW,
      source: source({ reviewBy: "2026-01-01T00:00:00.000Z" }),
    });
    assert.ok(r.violations.some((x) => x.code === "source-stale"));
    assert.equal(r.state, "stale");
  });

  test("fatto scaduto: stato «stale»", () => {
    const r = validateAreaFact({
      fact: fact({ reviewBy: "2026-01-01T00:00:00.000Z" }),
      areaKey: AREA_KEY,
      now: NOW,
    });
    assert.equal(r.state, "stale");
  });
});

describe("geografia", () => {
  test("comune diverso da quello dell'area: bloccato", () => {
    assert.ok(codesFor("Testo neutro sulla stazione.", { municipality: "Gallarate" }).includes("wrong-municipality"));
  });

  test("quartiere diverso da quello dell'area: bloccato", () => {
    const r = validateAreaFact({
      fact: fact({ zone: "Ceppine", scope: "zone" }),
      areaKey: "it|lombardia|va|tradate|abbiate-guazzone",
      now: NOW,
    });
    assert.ok(r.violations.some((x) => x.code === "wrong-neighbourhood"));
  });

  test("fatto di quartiere su un profilo di comune: ambito troppo largo", () => {
    // Varrebbe per tutto il comune, cioè afferma più di quanto la fonte sostenga.
    assert.ok(codesFor("Testo neutro.", { scope: "zone" }).includes("scope-mismatch"));
  });

  test("il comune scritto in modo diverso non è un errore", () => {
    // "TRADATE (VA)" e "Tradate" sono la stessa area: bloccarlo sarebbe rumore.
    assert.deepEqual(codesFor("Testo neutro sulla stazione.", { municipality: "TRADATE (VA)" }), []);
  });
});

describe("conflitti e duplicati", () => {
  test("un conflitto aperto porta allo stato «conflicted», non a un rifiuto", () => {
    // È una decisione da prendere, non un errore da correggere: il fatto potrebbe essere quello
    // giusto dei due, e trattarlo come scarto butterebbe l'evidenza migliore.
    const r = validateAreaFact({
      fact: fact({
        conflicts: [
          {
            source: { url: "https://regione.it/x", owner: "Regione Lombardia", retrievedAt: "2026-08-01T00:00:00.000Z" },
            note: "la Regione dichiara un orario diverso",
          },
        ],
      }),
      areaKey: AREA_KEY,
      now: NOW,
    });
    assert.equal(r.state, "conflicted");
  });

  test("duplicato esatto: bloccato", () => {
    const existing = fact({ id: "af_esistente" });
    const r = validateAreaFact({
      fact: fact({ id: "af_nuovo" }),
      areaKey: AREA_KEY,
      now: NOW,
      existingFacts: [existing],
    });
    assert.ok(r.violations.some((x) => x.code === "duplicate-fact"));
  });

  test("quasi-duplicato riordinato: bloccato lo stesso", () => {
    // Un `===` non se ne accorgerebbe mai, ed è così che la stessa informazione compare due
    // volte nella stessa sezione con parole diverse.
    const existing = fact({ id: "af_esistente", text: "La linea ferroviaria regionale serve la stazione di Tradate." });
    const r = validateAreaFact({
      fact: fact({ id: "af_nuovo", text: "La stazione di Tradate è servita dalla linea ferroviaria regionale." }),
      areaKey: AREA_KEY,
      now: NOW,
      existingFacts: [existing],
    });
    assert.ok(r.violations.some((x) => x.code === "near-duplicate-fact"));
  });

  test("un fatto già scartato non blocca il suo sostituto", () => {
    const rejected = fact({ id: "af_scartato", status: "rejected" });
    const r = validateAreaFact({
      fact: fact({ id: "af_nuovo" }),
      areaKey: AREA_KEY,
      now: NOW,
      existingFacts: [rejected],
    });
    assert.deepEqual(r.violations, []);
  });

  test("due fatti diversi sullo STESSO soggetto non sono duplicati", () => {
    // La controprova della soglia: abbassarla troppo fonderebbe evidenza distinta.
    const other = fact({ id: "af_parcheggio", text: "La stazione di Tradate ha un parcheggio di interscambio." });
    const r = validateAreaFact({
      fact: fact({ text: "La stazione di Tradate serve la linea Saronno–Varese." }),
      areaKey: AREA_KEY,
      now: NOW,
      existingFacts: [other],
    });
    assert.deepEqual(r.violations, []);
  });

  test("due fatti diversi sulla stessa area convivono", () => {
    const other = fact({ id: "af_altro", category: "healthcare", text: "Nel comune è presente un poliambulatorio." });
    const r = validateAreaFact({ fact: fact(), areaKey: AREA_KEY, now: NOW, existingFacts: [other] });
    assert.deepEqual(r.violations, []);
  });
});

describe("confronto con la fonte", () => {
  const excerpt =
    "La stazione di Tradate si trova sulla linea Saronno–Varese ed è servita da 42 corse giornaliere " +
    "gestite dall'operatore regionale nei giorni feriali.";

  test("un numero che nella fonte non c'è: bloccato", () => {
    const r = validateAreaFact({
      fact: fact({ text: "La stazione di Tradate è servita da 60 corse giornaliere." }),
      areaKey: AREA_KEY,
      now: NOW,
      sourceExcerpt: excerpt,
    });
    assert.ok(r.violations.some((x) => x.code === "unsupported-number"));
  });

  test("un numero che nella fonte c'è: passa", () => {
    const r = validateAreaFact({
      fact: fact({ text: "Le corse giornaliere sono 42." }),
      areaKey: AREA_KEY,
      now: NOW,
      sourceExcerpt: excerpt,
    });
    assert.ok(!r.violations.some((x) => x.code === "unsupported-number"));
  });

  test("il formato del numero non cambia il verdetto", () => {
    // "1.200" e "1200" sono lo stesso numero: fallire per il separatore sarebbe un falso positivo
    // che nessuno saprebbe correggere.
    const r = validateAreaFact({
      fact: fact({ text: "Gli abitanti censiti sono 1.200." }),
      areaKey: AREA_KEY,
      now: NOW,
      sourceExcerpt: "Il quartiere conta 1200 abitanti secondo l'ultimo censimento comunale.",
    });
    assert.ok(!r.violations.some((x) => x.code === "unsupported-number"));
  });

  test("copiare la fonte parola per parola: bloccato", () => {
    const r = validateAreaFact({
      fact: fact({ text: excerpt }),
      areaKey: AREA_KEY,
      now: NOW,
      sourceExcerpt: excerpt,
    });
    assert.ok(r.violations.some((x) => x.code === "copied-source-language"));
  });

  test("una parafrasi vera passa", () => {
    const r = validateAreaFact({
      fact: fact({ text: "Sulla linea Saronno–Varese, la fermata di Tradate ha 42 corse nei feriali." }),
      areaKey: AREA_KEY,
      now: NOW,
      sourceExcerpt: excerpt,
    });
    assert.deepEqual(r.violations, []);
  });

  test("senza estratto della fonte, i due controlli NON sono eseguiti — e si sa", () => {
    // È la parte importante: l'assenza del controllo è dichiarata, non silenziosa. Un chiamante
    // che pubblica basandosi su `violations: []` deve poter sapere che i numeri non sono stati
    // verificati contro nulla.
    const senza = validateAreaFact({ fact: fact({ text: "Le corse sono 999." }), areaKey: AREA_KEY, now: NOW });
    assert.equal(senza.checkedAgainstSource, false);
    assert.deepEqual(senza.violations, []);

    const con = validateAreaFact({
      fact: fact({ text: "Le corse sono 999." }),
      areaKey: AREA_KEY,
      now: NOW,
      sourceExcerpt: excerpt,
    });
    assert.equal(con.checkedAgainstSource, true);
    assert.ok(con.violations.some((x) => x.code === "unsupported-number"));
  });
});

describe("le funzioni di supporto", () => {
  test("le parole vuote non contano nella somiglianza", () => {
    // "la", "di", "è" e "sulla" sono tutte parole vuote: non distinguono un fatto da un altro.
    assert.deepEqual(significantWords("La stazione di Tradate è sulla linea."), [
      "stazione",
      "tradate",
      "linea",
    ]);
  });

  test("Jaccard: uguale a sé stesso, zero con testi disgiunti", () => {
    assert.equal(jaccardSimilarity("stazione tradate linea", "stazione tradate linea"), 1);
    assert.equal(jaccardSimilarity("stazione tradate", "farmacia gallarate"), 0);
    assert.ok(
      jaccardSimilarity(
        "La stazione di Tradate serve la linea regionale.",
        "La linea regionale serve la stazione di Tradate.",
      ) >= NEAR_DUPLICATE_THRESHOLD,
    );
  });

  test("sequenza comune più lunga: distingue parafrasi e copiatura", () => {
    const fonte =
      "la stazione di tradate si trova sulla linea saronno varese ed e servita da quarantadue " +
      "corse giornaliere gestite dall operatore regionale nei giorni feriali";
    assert.ok(longestCommonWordRun(fonte, fonte) >= COPIED_RUN_THRESHOLD);
    assert.ok(longestCommonWordRun(fonte, "sulla linea saronno varese ferma anche tradate") < COPIED_RUN_THRESHOLD);
    assert.equal(longestCommonWordRun("", "qualcosa"), 0);
  });

  test("i numeri si estraggono normalizzati", () => {
    assert.deepEqual(numbersIn("42 corse, 1.200 abitanti, 3,5 km"), ["42", "1200", "3.5"]);
    assert.deepEqual(numbersIn("nessun numero"), []);
  });
});
