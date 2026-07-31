// Regressione dell'estrazione deterministica dei fatti strutturati.
//
// Bug coperti:
//  • le camere venivano dedotte come "locali - 1" (dato inventato);
//  • <ClasseImmobile> ("media", "signorile") veniva letta come classe energetica;
//  • le informazioni tecniche esplicite nella descrizione restavano sepolte nel testo;
//  • "Doppio terrazzo" produceva due caratteristiche invece del conteggio.
//
// Il caso reale di riferimento è l'annuncio T447 (attico duplex, Tradate).

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  FACT_GROUPS,
  factsFromDescription,
  factsFromFields,
  groupFacts,
  mergeFacts,
  type PropertyFact,
} from "../facts";
import { parseRealSmartPayload } from "../parse";
import { normalizeRealSmartListing } from "../normalize";

/** Trova un fatto per chiave (undefined se non estratto). */
function fact(facts: readonly PropertyFact[], key: string): PropertyFact | undefined {
  return facts.find((f) => f.key === key);
}

/** Chiavi estratte da una descrizione (scorciatoia per i test di presenza/assenza). */
function keysFrom(...paragraphs: string[]): string[] {
  return factsFromDescription(paragraphs).facts.map((f) => f.key);
}

describe("factsFromDescription — affermazioni positive", () => {
  test("«Doppio terrazzo» diventa Terrazzi: 2, non due caratteristiche separate", () => {
    const { facts } = factsFromDescription(["Classe B · Doppio terrazzo · Due autorimesse"]);
    const terrazzi = facts.filter((f) => f.key === "terrazzi");
    assert.equal(terrazzi.length, 1);
    assert.equal(terrazzi[0].value, "2");
    assert.equal(terrazzi[0].label, "Terrazzi");
  });

  test("sinonimi box / autorimessa / garage deduplicati sulla stessa chiave", () => {
    for (const phrase of ["due autorimesse", "2 box", "due garage", "due box auto"]) {
      const { facts } = factsFromDescription([`La proprietà comprende ${phrase}.`]);
      const boxes = facts.filter((f) => f.key === "autorimesse");
      assert.equal(boxes.length, 1, phrase);
      assert.equal(boxes[0].value, "2", phrase);
    }
  });

  test("riscaldamento a pavimento, cappotto, parquet, ascensore", () => {
    const keys = keysFrom(
      "Attico recente con riscaldamento a pavimento, cappotto termico e pavimenti in parquet.",
      "Il palazzo è servito da ascensore.",
    );
    assert.ok(keys.includes("riscaldamento"));
    assert.ok(keys.includes("cappottoTermico"));
    assert.ok(keys.includes("pavimenti"));
    assert.ok(keys.includes("ascensore"));
  });

  test("metrature: soggiorno e superficie commerciale", () => {
    const { facts } = factsFromDescription([
      "Proponiamo un attico duplex di circa 176 mq commerciali.",
      "Un soggiorno di circa 30 mq accoglie la famiglia.",
    ]);
    assert.equal(fact(facts, "superficie")?.value, "circa 176 m²");
    assert.equal(fact(facts, "soggiorno")?.value, "circa 30 m²");
  });

  test("vista e camera matrimoniale qualificata", () => {
    const { facts } = factsFromDescription([
      "Una camera matrimoniale con ulteriore terrazzo e vista Monte Rosa.",
    ]);
    assert.equal(fact(facts, "vista")?.value, "Monte Rosa");
    assert.equal(fact(facts, "cameraMatrimoniale")?.value, "con terrazzo");
  });

  test("un conteggio non aggancia mai una misura («11 mq di balconi»)", () => {
    const { facts } = factsFromDescription(["Trilocale di 97 mq, con 11 mq di balconi."]);
    assert.notEqual(fact(facts, "balconi")?.value, "11");
  });
});

describe("factsFromDescription — affermazioni negative", () => {
  const negations: [string, string][] = [
    ["Palazzina senza ascensore, al secondo piano.", "ascensore"],
    ["Appartamento privo di box e cantina.", "autorimesse"],
    ["L'immobile non dispone di giardino.", "giardino"],
    ["Soluzione senza terrazzo ma con due balconi.", "terrazzi"],
  ];
  for (const [text, key] of negations) {
    test(`«${text}» non produce il fatto "${key}"`, () => {
      assert.ok(!keysFrom(text).includes(key));
    });
  }

  test("la negazione non spegne i fatti delle altre proposizioni", () => {
    const keys = keysFrom("Palazzina senza ascensore. La cucina abitabile è molto luminosa.");
    assert.ok(!keys.includes("ascensore"));
    assert.ok(keys.includes("cucinaAbitabile"));
  });
});

describe("factsFromDescription — potenzialità e prossimità", () => {
  const potentials: [string, string][] = [
    ["Possibilità di box al piano interrato.", "autorimesse"],
    ["Predisposizione per aria condizionata in ogni stanza.", "ariaCondizionata"],
    ["Nelle vicinanze è presente un garage in affitto.", "autorimesse"],
    ["Ampio locale ideale per realizzare uno studio.", "studio"],
    ["Il sottotetto è da realizzare secondo i tuoi gusti.", "sottotetto"],
    ["La lavanderia potrebbe facilmente essere trasformata in uno studio.", "studio"],
  ];
  for (const [text, key] of potentials) {
    test(`«${text}» non produce il fatto "${key}"`, () => {
      assert.ok(!keysFrom(text).includes(key));
    });
  }

  test("un uso soltanto suggerito («come studio») non crea un ambiente", () => {
    assert.ok(!keysFrom("Una camera, funzionale anche come studio, affacciata sul verde.").includes("studio"));
  });

  test("uno studio professionale citato nel copy non è un ambiente dell'immobile", () => {
    assert.ok(!keysFrom("Progettata dallo studio dell’architetto Mario Bacciocchi di Milano.").includes("studio"));
  });
});

describe("factsFromDescription — ambiguità e contraddizioni", () => {
  test("frase ipotetica: niente fatto, ma una voce nel report di revisione", () => {
    const { facts, review } = factsFromDescription([
      "Immagina di fare colazione ammirando il giardino fiorito.",
    ]);
    assert.ok(!facts.some((f) => f.key === "giardino"));
    assert.equal(review.length, 1);
    assert.equal(review[0].key, "giardino");
    assert.equal(review[0].reason, "ambiguo");
    assert.ok(review[0].evidence.includes("giardino"));
  });

  test("l'ipotesi che SEGUE il fatto non lo invalida", () => {
    const { facts } = factsFromDescription([
      "Completa la proprietà un box di 18 mq, di cui potresti aver bisogno.",
    ]);
    assert.ok(facts.some((f) => f.key === "autorimesse"));
  });

  test("conteggi contraddittori: nessuna pubblicazione, voce in revisione", () => {
    const { facts, review } = factsFromDescription([
      "La proprietà comprende due autorimesse.",
      "Completano l'immobile tre box al piano interrato.",
    ]);
    assert.ok(!facts.some((f) => f.key === "autorimesse"));
    assert.ok(review.some((r) => r.key === "autorimesse" && r.reason === "contraddittorio"));
  });

  test("le voci in revisione non finiscono mai tra i fatti pubblicati", () => {
    const { facts, review } = factsFromDescription([
      "Immagina un terrazzo affacciato sul lago.",
      "Il soggiorno di circa 28 mq è luminoso.",
    ]);
    assert.deepEqual(facts.map((f) => f.key).sort(), ["soggiorno"]);
    assert.ok(review.length > 0);
  });
});

describe("factsFromFields — campi espliciti del gestionale", () => {
  test("le camere arrivano solo da <Camere>: mai «locali - 1»", () => {
    const facts = factsFromFields({ locali: 4 });
    assert.equal(fact(facts, "locali")?.value, "4");
    assert.equal(fact(facts, "camere"), undefined);
  });

  test("un campo assente non produce «—» né «No»", () => {
    const facts = factsFromFields({ tipologia: "Appartamento" });
    for (const f of facts) {
      assert.notEqual(f.value, "—");
      assert.notEqual(f.value, "No");
    }
    assert.equal(fact(facts, "ascensore"), undefined);
    assert.equal(fact(facts, "classeEnergetica"), undefined);
  });

  test("un flag esplicito «No» non genera un fatto negativo", () => {
    const facts = factsFromFields({ dettagli: { ascensore: false, giardino: false, box: false } });
    assert.deepEqual(facts, []);
  });

  test("classe energetica e stato dell'APE", () => {
    assert.equal(
      fact(factsFromFields({ classeEnergetica: "A4" }), "classeEnergetica")?.value,
      "A4",
    );
    assert.equal(
      fact(factsFromFields({ statoAttestatoEnergetico: "in fase di rilascio" }), "classeEnergetica")
        ?.value,
      "in fase di rilascio",
    );
  });

  test("il piano viene reso leggibile", () => {
    const cases: [string, string][] = [
      ["T", "Terra"],
      ["t", "Terra"],
      ["2", "2°"],
      ["T/1", "Terra e 1°"],
      ["s1", "Seminterrato"],
    ];
    for (const [raw, expected] of cases) {
      assert.equal(fact(factsFromFields({ piano: raw }), "piano")?.value, expected, raw);
    }
  });

  test("gli ambienti censiti danno la PRESENZA, mai un conteggio", () => {
    const facts = factsFromFields({
      dettagli: {
        ambienti: [
          { descrizione: "Balcone", qta: 1 },
          { descrizione: "Balcone", qta: 1 },
          { descrizione: "Balcone", qta: 1 },
        ],
      },
    });
    const balconi = facts.filter((f) => f.key === "balconi");
    assert.equal(balconi.length, 1);
    assert.equal(balconi[0].value, undefined);
  });
});

describe("mergeFacts — gerarchia delle fonti", () => {
  const field: PropertyFact = {
    key: "classeEnergetica",
    group: "principali",
    label: "Classe energetica",
    value: "B",
    source: "realsmart",
    confidence: "alta",
  };
  const description: PropertyFact = { ...field, value: "D", source: "descrizione" };

  test("il campo RealSmart batte l'estrazione dalla descrizione", () => {
    const merged = mergeFacts([field], [description]);
    assert.equal(merged.length, 1);
    assert.equal(merged[0].value, "B");
    assert.equal(merged[0].source, "realsmart");
  });

  test("arricchimento: la presenza dal campo + il conteggio dalla descrizione", () => {
    const presence: PropertyFact = {
      key: "terrazzi",
      group: "esterni",
      label: "Terrazzi",
      source: "realsmart",
      confidence: "alta",
    };
    const counted: PropertyFact = { ...presence, value: "2", source: "descrizione" };
    const merged = mergeFacts([presence], [counted]);
    assert.equal(merged.length, 1);
    assert.equal(merged[0].value, "2");
  });

  test("nessuna chiave duplicata e nessun dato in due gruppi", () => {
    const merged = mergeFacts(
      factsFromFields({ mq: 100, dettagli: { terrazzo: true, box: true } }),
      factsFromDescription(["Ampio terrazzo e due box. Terrazzo vivibile."]).facts,
    );
    const keys = merged.map((f) => f.key);
    assert.equal(new Set(keys).size, keys.length);
    for (const key of new Set(keys)) {
      const groups = new Set(merged.filter((f) => f.key === key).map((f) => f.group));
      assert.equal(groups.size, 1, key);
    }
  });

  test("i gruppi vuoti non vengono mai restituiti", () => {
    const grouped = groupFacts(factsFromFields({ mq: 100 }));
    assert.deepEqual(grouped.map((g) => g.group), ["principali"]);
    for (const g of grouped) assert.ok(g.facts.length > 0);
    assert.ok(FACT_GROUPS.includes(grouped[0].group));
  });
});

// ── Caso reale end-to-end: l'attico T447 dello screenshot ───────────────────

/** Estratto (ridotto) del feed reale: stessi tag e stessi valori dell'annuncio T447. */
const T447_XML = `<Dati><immobili><immobile>
  <Codice>2055</Codice><Riferimento>T447</Riferimento><Contratto>Vendita</Contratto>
  <Comune>Tradate</Comune><Indirizzo>Via Francesco Petrarca, 7</Indirizzo>
  <Tipologia>Attico</Tipologia><Locali>4</Locali><Camere>3</Camere><Mq>176</Mq><Bagni>2</Bagni>
  <Costo>370000</Costo><Titolo>Attico duplex con terrazzo e doppi box a Tradate</Titolo>
  <AnnuncioCompleto><![CDATA[Ci sono case che salgono di prezzo. E case che salgono di piano.<br/>Classe B · Doppio terrazzo · Vista Monte Rosa · Due autorimesse<br/>Oggi a Tradate la risposta è semplice: gli attici. Soprattutto se recenti, in classe energetica B, con riscaldamento a pavimento, cappotto termico e pavimenti in parquet.<br/>Domus Tua propone in vendita un elegante attico duplex di circa 176 mq commerciali, servito da ascensore e completo di due autorimesse.<br/>Un soggiorno di circa 30 mq si apre sul grande terrazzo, raggiungibile anche dalla cucina abitabile.<br/>E poi non può mancare uno studio particolare, ideale anche per lo smart working.<br/>Sempre sullo stesso livello trovi una camera matrimoniale con ulteriore terrazzo.]]></AnnuncioCompleto>
  <Riscaldamento>Centralizzato gest. Autonoma</Riscaldamento><AriaCondizionata>Si</AriaCondizionata>
  <Terrazzo>Si</Terrazzo><mq_terrazzo><![CDATA[33]]></mq_terrazzo><Box>Si</Box>
  <Tipo_Box>Box Doppio</Tipo_Box><PostoAuto>No</PostoAuto><Giardino>No</Giardino>
  <Piano>3</Piano><ClasseImmobile>media</ClasseImmobile><Ascensore>Si</Ascensore><ACE>B</ACE>
</immobile></immobili></Dati>`;

describe("caso reale T447 — dallo XML ai fatti pubblicati", async () => {
  const { XMLParser } = await import("fast-xml-parser");
  const payload = new XMLParser({ ignoreAttributes: true, trimValues: true }).parse(T447_XML);
  const raw = parseRealSmartPayload(payload as unknown);
  const listing = normalizeRealSmartListing(raw[0]);
  const value = (key: string) => fact(listing.facts, key)?.value;
  const has = (key: string) => listing.facts.some((f) => f.key === key);

  test("<ClasseImmobile> «media» NON diventa la classe energetica: vale <ACE>", () => {
    assert.equal(listing.energyClass, "B");
    assert.equal(value("classeEnergetica"), "B");
  });

  test("i dati attesi dallo screenshot ci sono tutti", () => {
    assert.equal(value("terrazzi"), "2");
    assert.equal(value("autorimesse"), "2");
    assert.equal(value("vista"), "Monte Rosa");
    assert.equal(value("riscaldamento"), "a pavimento");
    assert.equal(value("pavimenti"), "parquet");
    assert.equal(value("soggiorno"), "circa 30 m²");
    assert.equal(value("superficie"), "176 m²");
    assert.equal(value("camere"), "3");
    assert.equal(value("cameraMatrimoniale"), "con terrazzo");
    assert.ok(has("cappottoTermico"));
    assert.ok(has("ascensore"));
    assert.ok(has("cucinaAbitabile"));
    assert.ok(has("studio"));
  });

  test("nessun indirizzo civico e nessun dato sensibile tra i fatti", () => {
    for (const f of listing.facts) {
      const text = `${f.label} ${f.value ?? ""}`;
      assert.ok(!/\bvia\b/i.test(text), text);
      assert.ok(!/petrarca|buzzati/i.test(text), text);
    }
  });

  test("ogni fatto dichiara provenienza e confidenza", () => {
    for (const f of listing.facts) {
      assert.ok(["override", "realsmart", "descrizione"].includes(f.source), f.key);
      assert.equal(f.confidence, "alta");
    }
  });
});

describe("factsFromFields — casi che generavano dati fuorvianti", () => {
  test("su un terreno il lotto non diventa un «giardino privato»", () => {
    const facts = factsFromFields({
      tipologia: "Terreno edificabile",
      mq: 1355,
      dettagli: { giardino: true, tipoGiardino: "Privato", mqGiardino: 1355 },
    });
    assert.equal(fact(facts, "giardino"), undefined);
    assert.equal(fact(facts, "mqGiardino"), undefined);
    assert.equal(fact(facts, "superficie")?.value, "1355 m²");
  });

  test("la superficie del giardino non ripete la superficie commerciale", () => {
    const same = factsFromFields({ tipologia: "Villa", mq: 300, dettagli: { mqGiardino: 300 } });
    assert.equal(fact(same, "mqGiardino"), undefined);

    const different = factsFromFields({ tipologia: "Villa", mq: 300, dettagli: { mqGiardino: 800 } });
    assert.equal(fact(different, "mqGiardino")?.value, "800 m²");
  });
});
