// «Questo testo potrebbe descrivere qualunque paese?»
//
// La difficoltà del problema è che la risposta giusta NON è «pretendi testi tutti diversi». Due
// comuni vicini condividono davvero dei fatti — un municipio, una farmacia, la stessa linea
// ferroviaria — e un controllo che li costringesse a parafrasare produrrebbe scrittura peggiore
// per superare un controllo. Che è il modo in cui i controlli si guadagnano il diritto di essere
// spenti.
//
// Perciò metà di questi test verifica che la sovrapposizione LEGITTIMA passi.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  measureGenericity,
  anchorsIn,
  compareNarratives,
  findSuspiciousPairs,
  MIN_ANCHOR_DENSITY,
  MAX_STRUCTURAL_SIMILARITY,
} from "../genericity";

// Un testo vero: nomina cose che un lettore può cercare.
const TRADATE =
  "La stazione di Tradate è servita dalla linea suburbana S40 di Trenord, con collegamenti " +
  "diretti verso Milano Cadorna e Como San Giovanni. La direttrice storica su gomma è la ex " +
  "statale 233 Varesina. L'ospedale Galmarini fa parte dell'ASST dei Sette Laghi, e il verde " +
  "pubblico è quello del Parco Pineta, esteso su circa 4.800 ettari.";

// Lo stesso, per un altro comune: struttura simile, ancore diverse. È sovrapposizione legittima.
const GALLARATE =
  "La stazione di Gallarate è servita dalla linea RE6 di Trenitalia, con collegamenti diretti " +
  "verso Milano Centrale e Domodossola. La direttrice storica su gomma è la ex statale 336 " +
  "della Malpensa. L'ospedale Sant'Antonio Abate fa parte dell'ASST Valle Olona, e il verde " +
  "pubblico è quello del Parco del Ticino, esteso su circa 20.000 ettari.";

// Generico: ogni frase è corretta, e non dice dove si è.
const GENERICO =
  "La zona offre diversi servizi utili alla vita quotidiana. Sono presenti numerose strutture " +
  "nelle immediate vicinanze del centro. I collegamenti principali consentono di raggiungere " +
  "le località vicine. L'area dispone di varie soluzioni per i residenti, e i servizi locali " +
  "sono disponibili nel territorio comunale.";

describe("ancore", () => {
  test("nomi propri, numeri e codici di linea", () => {
    const anchors = anchorsIn(TRADATE);
    for (const expected of ["Tradate", "S40", "Trenord", "Milano", "Galmarini", "Pineta"]) {
      assert.ok(anchors.includes(expected), `manca "${expected}": ${anchors.join(", ")}`);
    }
  });

  test("un numero è un'ancora anche a inizio frase", () => {
    assert.ok(anchorsIn("42 corse giornaliere servono la fermata.").includes("42"));
  });

  test("la parola d'apertura di una frase non lo è", () => {
    assert.ok(!anchorsIn("La stazione è aperta. Il servizio è attivo.").includes("La"));
  });

  test("un testo generico non ha quasi ancore", () => {
    assert.ok(anchorsIn(GENERICO).length <= 1, anchorsIn(GENERICO).join(", "));
  });
});

describe("genericità", () => {
  test("un testo che nomina cose passa", () => {
    const report = measureGenericity(TRADATE);
    assert.equal(report.tooGeneric, false, report.reasons.join("; "));
    assert.ok(report.anchorDensity >= MIN_ANCHOR_DENSITY);
  });

  test("un testo corretto in ogni frase e vuoto nel complesso NON passa", () => {
    // Non è un errore: è inutilità. E su duecento schede è inutilità moltiplicata per duecento.
    const report = measureGenericity(GENERICO);
    assert.equal(report.tooGeneric, true);
    assert.ok(report.reasons.some((r) => /non nomina niente/.test(r)), report.reasons.join("; "));
  });

  test("il riempitivo si conta", () => {
    assert.ok(measureGenericity(GENERICO).fillerRatio > measureGenericity(TRADATE).fillerRatio);
  });

  test("un testo vuoto non fa cadere il calcolo", () => {
    const report = measureGenericity("");
    assert.equal(report.words, 0);
    assert.equal(report.anchorDensity, 0);
  });
});

describe("confronto fra aree", () => {
  test("STESSA STRUTTURA e ancore diverse: legittimo, non si segnala", () => {
    // È il caso che un controllo ingenuo sbaglierebbe. Due comuni possono davvero avere
    // entrambi una stazione, un ospedale e un parco, raccontati nello stesso ordine.
    const pair = compareNarratives({ key: "tradate", text: TRADATE }, { key: "gallarate", text: GALLARATE });
    assert.equal(pair.suspicious, false, pair.reason);
    assert.ok(pair.distinctAnchors.length > 5, "i due testi devono nominare cose diverse");
  });

  test("lo STESSO testo con due nomi scambiati: si segnala", () => {
    // Tolti i nomi propri resta la frase identica: non sono due descrizioni, è un modello
    // riempito due volte.
    const a = "La stazione di Tradate è il riferimento per gli spostamenti quotidiani.";
    const b = "La stazione di Gallarate è il riferimento per gli spostamenti quotidiani.";
    const pair = compareNarratives({ key: "a", text: a }, { key: "b", text: b });
    assert.equal(pair.suspicious, true);
    assert.ok(pair.similarityWithoutAnchors >= MAX_STRUCTURAL_SIMILARITY);
    assert.match(pair.reason ?? "", /modello riempito due volte/);
  });

  test("due testi genuinamente diversi non si segnalano", () => {
    const pair = compareNarratives(
      { key: "a", text: TRADATE },
      { key: "b", text: "Il mercato settimanale si tiene il giovedì in piazza Vittorio Veneto." },
    );
    assert.equal(pair.suspicious, false);
  });

  test("la somiglianza GREZZA da sola non basta a condannare", () => {
    // Due comuni con gli stessi servizi condividono legittimamente molte parole: il calcolo che
    // conta è quello senza ancore.
    const pair = compareNarratives({ key: "tradate", text: TRADATE }, { key: "gallarate", text: GALLARATE });
    assert.ok(pair.similarity > 0.4, `somiglianza grezza ${pair.similarity}`);
    assert.ok(pair.similarityWithoutAnchors < MAX_STRUCTURAL_SIMILARITY);
    assert.equal(pair.suspicious, false);
  });

  test("su un insieme, escono solo le coppie sospette", () => {
    const suspicious = findSuspiciousPairs([
      { key: "tradate", text: TRADATE },
      { key: "gallarate", text: GALLARATE },
      { key: "copia-a", text: "Il municipio di Tradate ospita gli sportelli anagrafici." },
      { key: "copia-b", text: "Il municipio di Gallarate ospita gli sportelli anagrafici." },
    ]);
    assert.equal(suspicious.length, 1);
    assert.deepEqual([suspicious[0].a, suspicious[0].b].sort(), ["copia-a", "copia-b"]);
  });

  test("un insieme di uno solo non produce coppie", () => {
    assert.deepEqual(findSuspiciousPairs([{ key: "a", text: TRADATE }]), []);
  });
});
