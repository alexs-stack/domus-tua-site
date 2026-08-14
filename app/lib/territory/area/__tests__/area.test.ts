// Base di conoscenza dei fatti d'area (Prompt 9): provenienza, guard soggettivo, pubblicazione,
// staleness, conflitti, i18n, import/export.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { AreaFactSchema, type AreaFact } from "../types";
import { findSubjectiveViolations, isFactualText } from "../subjective";
import { toPublicAreaProfile, factsDueForReview, localizeFactText, isPublishable } from "../public";
import { approvalBlockers, approveAreaFact, rejectAreaFact, areaQualitySuggestions, AreaApprovalError } from "../validate";
import { areaQualityHints, isWellWritten } from "../quality";
import { extractClaims, claimsChecklist, hasVolatileClaim } from "../claims";
import { parseAreaFactsBundle, serializeAreaFacts, AREA_FACT_TEMPLATE } from "../importExport";
import { getPublicAreaProfile } from "../data";
import { buildAreaView } from "../../view";

const NOW = new Date("2026-08-14T10:00:00.000Z");

function fact(over: Partial<AreaFact> = {}): AreaFact {
  return {
    id: over.id ?? "tradate-stazione-01",
    municipality: over.municipality ?? "tradate",
    category: over.category ?? "transport",
    scope: over.scope ?? "municipality",
    text: over.text ?? "La stazione di Tradate è sulla linea ferroviaria regionale.",
    translations: over.translations ?? [],
    source: over.source ?? {
      url: "https://www.comune.tradate.va.it/stazione",
      owner: "Comune di Tradate",
      retrievedAt: "2026-08-01T00:00:00.000Z",
    },
    reviewBy: over.reviewBy ?? "2027-02-14T00:00:00.000Z",
    status: over.status ?? "approved",
    conflicts: over.conflicts ?? [],
    // `zone` va propagata: senza, un fatto di scope "zone" nasce senza zona e i test sullo scope
    // passerebbero per il motivo sbagliato (escluso perché privo di zona, non perché non combacia).
    ...(over.zone ? { zone: over.zone } : {}),
    ...(over.approvedBy ? { approvedBy: over.approvedBy } : {}),
    ...(over.approvedAt ? { approvedAt: over.approvedAt } : {}),
  };
}

describe("schema: provenienza obbligatoria", () => {
  test("un fatto senza fonte è RIFIUTATO", () => {
    const bad = { ...fact() } as Record<string, unknown>;
    delete bad.source;
    assert.equal(AreaFactSchema.safeParse(bad).success, false);
  });
  test("un URL non valido è RIFIUTATO", () => {
    assert.equal(AreaFactSchema.safeParse(fact({ source: { url: "non-un-url", owner: "x", retrievedAt: "2026-08-01T00:00:00.000Z" } })).success, false);
  });
});

describe("guard soggettivo", () => {
  const forbidden: Array<[string, string]> = [
    ["Zona sicura e tranquilla, senza criminalità.", "safety"],
    ["Quartiere prestigioso e signorile.", "prestige"],
    ["Le migliori scuole della provincia.", "superlative"],
    ["Zona abitata da famiglie ricche.", "demographic"],
    ["Ottimo investimento: il valore crescerà.", "investment"],
    ["Ideale per famiglie con bambini.", "suitability"],
  ];
  for (const [text, cat] of forbidden) {
    test(`blocca (${cat}): "${text.slice(0, 24)}…"`, () => {
      const v = findSubjectiveViolations(text);
      assert.ok(v.some((x) => x.category === cat), JSON.stringify(v));
    });
  }
  test("un fatto neutro passa", () => {
    assert.equal(isFactualText("La biblioteca comunale è aperta dal lunedì al sabato."), true);
  });
  test("un fatto soggettivo NON è approvabile", () => {
    const blockers = approvalBlockers(fact({ text: "Quartiere prestigioso vicino alle migliori scuole." }));
    assert.ok(blockers.length >= 1);
  });
});

describe("pubblicazione: approvato + fresco + senza conflitti + fattuale", () => {
  test("un fatto valido è pubblicabile e compare nel profilo", () => {
    assert.equal(isPublishable(fact(), NOW), true);
    const profile = toPublicAreaProfile([fact()], { now: NOW, locale: "it", municipality: "tradate" });
    assert.equal(profile?.facts.length, 1);
    // Nessun campo interno/di stato nel pubblico.
    assert.ok(!("status" in (profile!.facts[0] as object)));
  });
  test("draft / scaduto / con conflitto / soggettivo → esclusi", () => {
    const draft = fact({ id: "a", status: "draft" });
    const stale = fact({ id: "b", reviewBy: "2026-01-01T00:00:00.000Z" });
    const conflict = fact({ id: "c", conflicts: [{ source: fact().source, note: "fonte diversa dice altro" }] });
    const subjective = fact({ id: "d", text: "Zona prestigiosa." });
    const profile = toPublicAreaProfile([draft, stale, conflict, subjective], { now: NOW, locale: "it", municipality: "tradate" });
    assert.equal(profile, null, "niente di pubblicabile");
  });
});

describe("i18n: traduzione approvata o ripiego alla canonica", () => {
  test("traduzione APPROVATA usata per la lingua", () => {
    const f = fact({ translations: [{ locale: "en", text: "Tradate station is on the regional line.", approved: true }] });
    assert.equal(localizeFactText(f, "en"), "Tradate station is on the regional line.");
  });
  test("traduzione NON approvata → ripiego alla canonica italiana", () => {
    const f = fact({ translations: [{ locale: "en", text: "draft machine translation", approved: false }] });
    assert.equal(localizeFactText(f, "en"), f.text);
  });
});

describe("staleness / promemoria di revisione", () => {
  test("fatti in scadenza entro N giorni sono elencati", () => {
    const soon = fact({ id: "soon", reviewBy: "2026-08-20T00:00:00.000Z" });
    const later = fact({ id: "later", reviewBy: "2027-06-01T00:00:00.000Z" });
    const due = factsDueForReview([soon, later], NOW, 30);
    assert.deepEqual(due.map((f) => f.id), ["soon"]);
  });
});

describe("review editoriale dei fatti d'area", () => {
  const REV = { approver: "raffaela", at: "2026-08-14T10:00:00.000Z" };
  test("approveAreaFact promuove a approved con traccia quando non ci sono blocker", () => {
    const out = approveAreaFact(fact({ status: "draft" }), REV);
    assert.equal(out.status, "approved");
    assert.equal(out.approvedBy, "raffaela");
    assert.equal(out.approvedAt, REV.at);
  });
  test("approveAreaFact RIFIUTA un fatto soggettivo (guard come rete finale)", () => {
    assert.throws(() => approveAreaFact(fact({ status: "draft", text: "Zona prestigiosa." }), REV), AreaApprovalError);
  });
  test("approveAreaFact RIFIUTA un fatto scaduto (reviewBy passato)", () => {
    assert.throws(
      () => approveAreaFact(fact({ status: "draft", reviewBy: "2026-01-01T00:00:00.000Z" }), REV),
      AreaApprovalError,
    );
  });
  test("approveAreaFact RIFIUTA con conflitti di fonte non risolti", () => {
    assert.throws(
      () =>
        approveAreaFact(
          fact({
            status: "draft",
            conflicts: [
              { source: { url: "https://x.example/a", owner: "Fonte A", retrievedAt: "2026-08-01T00:00:00.000Z" }, note: "in conflitto" },
            ],
          }),
          REV,
        ),
      AreaApprovalError,
    );
  });
  test("rejectAreaFact segna rejected con traccia", () => {
    const out = rejectAreaFact(fact({ status: "draft" }), REV);
    assert.equal(out.status, "rejected");
    assert.equal(out.approvedBy, "raffaela");
  });
});

describe("import/export", () => {
  test("parse valida e segnala i blocker senza scartare in silenzio", () => {
    const report = parseAreaFactsBundle({ facts: [fact(), fact({ id: "x", text: "Zona prestigiosa." })] });
    assert.equal(report.ok.length, 2);
    assert.equal(report.errors.length, 0);
    assert.ok(report.blockers.some((b) => b.id === "x"));
  });
  test("l'import consegna al revisore COSA verificare, non solo cosa è rotto", () => {
    const sbagliato = fact({ id: "s40", text: "Dalla stazione di Tradate la linea S40 di Trenord porta a Milano Cadorna." });
    const report = parseAreaFactsBundle({ facts: [sbagliato] });
    // Nessun blocker: è ben scritto e non giudica. È proprio il caso pericoloso.
    assert.deepEqual(report.blockers, []);
    const v = report.verification.find((x) => x.id === "s40")!;
    assert.ok(v.checklist.join("\n").includes("S40"), "la sigla da verificare deve essere esplicita");
    assert.equal(v.volatile, true, "una sigla di linea va ricontrollata a ogni revisione");
  });

  test("serialize è deterministico (ordinato per id)", () => {
    const s1 = serializeAreaFacts([fact({ id: "b" }), fact({ id: "a" })]);
    const s2 = serializeAreaFacts([fact({ id: "a" }), fact({ id: "b" })]);
    assert.equal(s1, s2);
    assert.ok(s1.indexOf('"a"') < s1.indexOf('"b"'));
  });
  test("il template è uno scheletro valido per forma (una volta compilato)", () => {
    // Il template ha zone:null; con zone omessa lo schema passa.
    const { zone: _zone, ...rest } = AREA_FACT_TEMPLATE;
    void _zone;
    assert.equal(AreaFactSchema.safeParse(rest).success, true);
  });
});

describe("scomposizione in affermazioni: ciò che il revisore deve spuntare", () => {
  // LA FRASE SBAGLIATA VERA, scritta su questo repo e presentata come esemplare. Superava ogni
  // guard ed era falsa due volte: Tradate non è sulla S40, e non c'è un diretto per Como San
  // Giovanni. Serve da caso di prova permanente: la scomposizione deve far EMERGERE entrambi gli
  // errori come domande separate, perché è l'unico modo in cui un umano li becca.
  const SBAGLIATA = "Dalla stazione di Tradate la linea S40 di Trenord porta diretti a Milano Cadorna e a Como San Giovanni.";

  test("gli errori reali diventano domande separate e verificabili", () => {
    const domande = claimsChecklist(SBAGLIATA).join("\n");
    assert.match(domande, /S40/, "la sigla sbagliata deve diventare una domanda a sé");
    assert.match(domande, /Como San Giovanni/, "la destinazione sbagliata deve diventare una domanda a sé");
    // Non è una frase sola da approvare a colpo d'occhio: sono più cose da controllare.
    assert.ok(extractClaims(SBAGLIATA).length >= 4);
  });

  test("una sigla di linea è marcata VOLATILE (da ricontrollare a ogni revisione)", () => {
    assert.equal(hasVolatileClaim(SBAGLIATA), true);
    const sigla = extractClaims(SBAGLIATA).find((c) => c.kind === "designazione");
    assert.equal(sigla?.value, "S40");
    assert.equal(sigla?.volatile, true);
  });

  test("le quantità diventano una verifica sul numero", () => {
    const c = extractClaims("Il Parco Pineta di Appiano Gentile e Tradate è un parco regionale protetto di circa 4.800 ettari.");
    assert.ok(c.some((x) => x.kind === "quantità" && /4\.800/.test(x.value)));
  });

  test("gli enti vengono estratti senza l'articolo iniziale né frammenti di sigla", () => {
    const valori = extractClaims("Il Parco Pineta di Appiano Gentile e Tradate è protetto.").map((c) => c.value);
    assert.ok(valori.includes("Parco Pineta di Appiano Gentile"), JSON.stringify(valori));
    assert.ok(!valori.some((v) => v.startsWith("Il ")), "l'articolo non fa parte del nome");
    assert.ok(!valori.some((v) => v.length < 3), "niente frammenti di una lettera");
  });

  test("un testo senza dati verificabili lo dichiara invece di fingere una checklist", () => {
    assert.match(claimsChecklist("in zona ci sono servizi").join(""), /nessun dato verificabile|più concreto/);
  });

  test("il fatto corretto produce una checklist coerente con la fonte", () => {
    const domande = claimsChecklist("La stazione di Tradate è sulla linea Saronno–Laveno di Ferrovienord: i treni Trenord arrivano a Milano Cadorna passando da Saronno.").join("\n");
    for (const atteso of ["Tradate", "Ferrovienord", "Trenord", "Milano Cadorna"]) {
      assert.match(domande, new RegExp(atteso));
    }
    // Nessuna sigla di linea: niente da ricontrollare a ogni giro.
    assert.equal(hasVolatileClaim("La stazione di Tradate è sulla linea Saronno–Laveno di Ferrovienord."), false);
  });
});

describe("scomposizione: batteria avversariale (difetti trovati testando, non immaginando)", () => {
  // Ognuno di questi casi ha ROTTO l'estrattore alla prima esecuzione. Restano qui perché un
  // estrattore a espressioni regolari regredisce in silenzio: un falso positivo assurdo
  // («verifica «Aperta»») insegna al revisore a saltare la checklist, ed è il danno peggiore.

  test("un verbo a inizio frase non è un ente da verificare", () => {
    const v = extractClaims("Aperta dal lunedì al sabato. Chiusa la domenica.").map((c) => c.value);
    assert.deepEqual(v, [], `falsi positivi: ${JSON.stringify(v)}`);
  });

  test("un nome proprio a inizio frase invece SÌ (ed è anche un'ancora)", () => {
    assert.deepEqual(extractClaims("Tradate ospita un mercato settimanale.").map((c) => c.value), ["Tradate"]);
    // Regressione: veniva giudicata «vaga» perché l'ancora era la prima parola.
    assert.deepEqual(areaQualityHints("Tradate ospita un mercato settimanale."), []);
  });

  test("l'articolo eliso non fa diventare ente un nome comune", () => {
    const v = extractClaims("L'ospedale è gestito dall'ASST dei Sette Laghi.").map((c) => c.value);
    assert.deepEqual(v, ["ASST dei Sette Laghi"], JSON.stringify(v));
  });

  test("un anno viene estratto come quantità verificabile", () => {
    const c = extractClaims("Nel 2024 è stata inaugurata la palestra comunale.");
    assert.ok(c.some((x) => x.kind === "quantità" && x.value === "2024"), JSON.stringify(c));
  });

  test("un giorno della settimana maiuscolo non è un ente", () => {
    assert.deepEqual(extractClaims("Il mercato si tiene ogni Martedì.").map((c) => c.value), []);
  });

  test("una seconda frase che apre con un verbo non inventa enti", () => {
    assert.deepEqual(extractClaims("La biblioteca è in centro. Ospita corsi serali.").map((c) => c.value), []);
  });

  test("sigla e località convivono senza confondersi", () => {
    const c = extractClaims("La linea RE5 collega Varese a Milano.");
    assert.equal(c.find((x) => x.kind === "designazione")?.value, "RE5");
    assert.deepEqual(c.filter((x) => x.kind === "entità").map((x) => x.value), ["Varese", "Milano"]);
  });
});

describe("qualità editoriale: vero non basta, deve anche essere leggibile", () => {
  test("il burocratese viene segnalato con l'alternativa", () => {
    const h = areaQualityHints("Nel centro cittadino hanno sede la biblioteca civica e gli sportelli anagrafici del Comune.");
    assert.ok(h.some((x) => x.kind === "gergo" && /si trova/.test(x.message)));
    assert.ok(h.some((x) => x.match === "sportelli"));
  });

  test("il registro da atto («il territorio comunale») viene segnalato", () => {
    const h = areaQualityHints("Il territorio comunale è attraversato dalla ex strada statale 233.");
    assert.ok(h.some((x) => /chi ci vive/.test(x.message)));
  });

  test("una frase senza dati concreti è segnalata come vaga", () => {
    assert.ok(areaQualityHints("in zona ci sono diversi servizi utili").some((x) => x.kind === "vago"));
  });

  test("una frase troppo lunga viene segnalata", () => {
    assert.ok(areaQualityHints("A Tradate c'è " + "un servizio pubblico molto articolato ".repeat(8)).some((x) => x.kind === "lungo"));
  });

  test("le versioni riscritte dei 5 fatti sono pulite", () => {
    const riscritti = [
      "La stazione di Tradate è sulla linea Saronno–Laveno di Ferrovienord: i treni Trenord arrivano a Milano Cadorna passando da Saronno.",
      "La Varesina, la ex statale 233, attraversa Tradate e collega Varese a Milano.",
      "Il Comune di Tradate ha gli uffici dell'anagrafe in piazza Mazzini; la biblioteca civica è in via Zara.",
      "A Tradate c'è l'ospedale Galmarini, che fa parte dell'ASST dei Sette Laghi.",
      "Il Parco Pineta di Appiano Gentile e Tradate è un parco regionale protetto di circa 4.800 ettari.",
    ];
    for (const t of riscritti) {
      assert.deepEqual(areaQualityHints(t), [], `da migliorare: "${t}"`);
      assert.equal(isWellWritten(t), true);
      assert.deepEqual(findSubjectiveViolations(t), [], `soggettivo: "${t}"`);
    }
  });

  test("i suggerimenti NON bloccano l'approvazione (la verità sì, lo stile no)", () => {
    const brutto = fact({ status: "draft", text: "Nel centro cittadino hanno sede gli sportelli del Comune di Tradate." });
    assert.ok(areaQualitySuggestions(brutto).length > 0, "ha suggerimenti di stile");
    assert.deepEqual(approvalBlockers(brutto, NOW), [], "ma resta approvabile: è vero");
  });
});

describe("SCOPE di zona: un fatto di frazione non finisce su tutto il comune", () => {
  const comunale = fact({ id: "c", scope: "municipality", category: "transport", text: "La stazione di Tradate è sulla linea regionale." });
  const diZona = fact({ id: "z", scope: "zone", zone: "abbiate-guazzone", category: "municipal-service", text: "Ad Abbiate Guazzone si tiene un mercato settimanale." });

  test("senza zona richiesta il fatto di zona è ESCLUSO (non vale per tutto il comune)", () => {
    const p = toPublicAreaProfile([comunale, diZona], { now: NOW, locale: "it", municipality: "tradate" });
    assert.equal(p?.facts.length, 1);
    assert.match(p!.facts[0].text, /stazione di Tradate/);
  });

  test("con la zona giusta il fatto compare, e viene PRIMA di quello comunale (più specifico)", () => {
    const p = toPublicAreaProfile([comunale, diZona], { now: NOW, locale: "it", municipality: "tradate", zone: "abbiate-guazzone" });
    assert.equal(p?.facts.length, 2);
    assert.match(p!.facts[0].text, /Abbiate Guazzone/);
  });

  test("con una zona DIVERSA il fatto di quella frazione resta escluso", () => {
    const p = toPublicAreaProfile([comunale, diZona], { now: NOW, locale: "it", municipality: "tradate", zone: "ceppine" });
    assert.equal(p?.facts.length, 1);
    assert.match(p!.facts[0].text, /stazione di Tradate/);
  });
});

describe("lingua: mai un paragrafo italiano dentro una pagina tradotta", () => {
  const soloItaliano = fact({ id: "it", text: "La biblioteca comunale è aperta dal lunedì al sabato." });
  const tradotto = fact({
    id: "en",
    text: "La stazione è servita da una linea regionale.",
    translations: [{ locale: "en", text: "The station is served by a regional line.", approved: true }],
  });

  test("in italiano si vede tutto", () => {
    const p = toPublicAreaProfile([soloItaliano, tradotto], { now: NOW, locale: "it", municipality: "tradate" });
    assert.equal(p?.facts.length, 2);
  });

  test("in inglese si vedono SOLO i fatti con traduzione approvata", () => {
    const p = toPublicAreaProfile([soloItaliano, tradotto], { now: NOW, locale: "en", municipality: "tradate" });
    assert.equal(p?.facts.length, 1);
    assert.equal(p!.facts[0].text, "The station is served by a regional line.");
  });

  test("nessuna traduzione approvata → profilo null (sezione nascosta, non testo italiano)", () => {
    assert.equal(toPublicAreaProfile([soloItaliano], { now: NOW, locale: "de", municipality: "tradate" }), null);
  });

  test("una traduzione NON approvata non basta", () => {
    const bozza = fact({ id: "b", translations: [{ locale: "fr", text: "Traduction non revue.", approved: false }] });
    assert.equal(toPublicAreaProfile([bozza], { now: NOW, locale: "fr", municipality: "tradate" }), null);
  });
});

describe("descrizioni d'area sulla pagina (buildAreaView) + qualità 10/10", () => {
  // I 6 fatti dimostrativi di Tradate mostrati nella preview: devono essere FATTUALI e NEUTRI.
  const TRADATE_FACTS: string[] = [
    "La stazione di Tradate è sulla linea Saronno–Laveno di Ferrovienord: i treni Trenord arrivano a Milano Cadorna passando da Saronno.",
    "Il territorio comunale è attraversato dalla ex strada statale 233 Varesina, direttrice storica tra Varese e Milano.",
    "Nel centro cittadino hanno sede la biblioteca civica e gli sportelli anagrafici del Comune.",
    "L'ospedale «Galmarini» di Tradate fa parte dell'ASST dei Sette Laghi.",
    "A Tradate sono presenti scuole di ogni grado, dall'infanzia alla secondaria di secondo grado.",
    "Il Parco Pineta di Appiano Gentile e Tradate è un'area naturale protetta regionale estesa su circa 4.800 ettari.",
  ];

  test("tutti i fatti dimostrativi passano il guard soggettivo (nessun giudizio, 10/10)", () => {
    for (const t of TRADATE_FACTS) {
      assert.deepEqual(findSubjectiveViolations(t), [], `fatto soggettivo: "${t}"`);
    }
  });

  test("buildAreaView localizza categoria, fonte e data; coord-free", () => {
    const profile = toPublicAreaProfile(
      [
        fact({ id: "t", category: "transport", text: TRADATE_FACTS[0] }),
        fact({ id: "p", category: "park-facility", text: TRADATE_FACTS[5] }),
      ],
      { now: NOW, locale: "it", municipality: "tradate" },
    );
    const view = buildAreaView(profile, "it");
    assert.ok(view);
    assert.equal(view.title, "La zona in sintesi");
    assert.equal(view.facts.length, 2);
    assert.equal(view.facts[0].categoryLabel, "Trasporti");
    assert.match(view.facts[0].reviewedLabel, /verificato il .*2026/);
    assert.ok(view.facts[0].sourceOwner.length > 0);
    const json = JSON.stringify(view);
    for (const bad of ["lat", "lng", "coord", "45.7"]) assert.equal(json.includes(bad), false);
  });

  test("profilo vuoto/nullo → null (la sezione 'La zona' non compare)", () => {
    assert.equal(buildAreaView(null, "it"), null);
    assert.equal(buildAreaView({ municipality: "tradate", facts: [] }, "it"), null);
  });
});

describe("separazione + nessuna invenzione", () => {
  test("dati vuoti di default → getPublicAreaProfile null (l'assistente non inventa)", () => {
    assert.equal(getPublicAreaProfile("tradate", { now: NOW, locale: "it" }), null);
  });
  test("con fatti approvati, 'com'è vivere a Tradate?' ha di che rispondere (solo fatti d'area)", () => {
    const profile = toPublicAreaProfile(
      [
        fact({ id: "t1", category: "transport" }),
        fact({ id: "s1", category: "municipal-service", text: "La biblioteca comunale è aperta dal lunedì al sabato." }),
      ],
      { now: NOW, locale: "it", municipality: "tradate" },
    );
    assert.equal(profile?.municipality, "tradate");
    assert.equal(profile?.facts.length, 2);
    // Ogni fatto pubblico è tracciabile a una fonte corrente.
    assert.ok(profile!.facts.every((f) => f.sourceUrl.startsWith("http") && f.sourceOwner.length > 0));
  });
});
