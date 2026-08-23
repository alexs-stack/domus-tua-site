// Identità geografica canonica: chiave vs etichetta, frazioni, ambiguità, casi sporchi del feed.
//
// Il difetto che questi test chiudono: il `<Zona>` del gestionale veniva letto dal parser e
// buttato via dal normalizzatore, e la stringa di visualizzazione "Tradate (VA)" veniva usata
// come chiave di lettura dei contenuti d'area. Conseguenza pratica: due immobili in due frazioni
// diverse dello stesso comune erano indistinguibili, e lo stesso comune scritto in due modi
// diventava due aree.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  areaSlug,
  buildAreaKey,
  parseAreaKey,
  municipalityAreaKey,
  isNeighbourhoodKey,
  resolveAreaIdentity,
  publicAreaLabel,
  MUNICIPALITY_REGISTRY,
  LOCALITY_ALIASES,
  AMBIGUOUS_LOCALITIES,
  KNOWN_FRAZIONI,
} from "../identity";

describe("areaSlug — la regola di normalizzazione", () => {
  test("toglie il suffisso provincia, accenti, punteggiatura e maiuscole", () => {
    assert.equal(areaSlug("Tradate (VA)"), "tradate");
    assert.equal(areaSlug("Venegono Superiore"), "venegono-superiore");
    assert.equal(areaSlug("Gornate-Olona"), "gornate-olona");
    assert.equal(areaSlug("  CASTIGLIONE   OLONA  "), "castiglione-olona");
  });

  test("le località accentate e con apostrofo collassano su una chiave sola", () => {
    // Il caso concreto: lo stesso comune scritto una volta con l'accento e una senza deve
    // produrre la stessa riga, senza che nessuno debba prevedere la coppia in una tabella.
    assert.equal(areaSlug("Sant'Ambrogio Olona"), "sant-ambrogio-olona");
    assert.equal(areaSlug("Sant’Ambrogio Olona"), "sant-ambrogio-olona"); // apostrofo tipografico
    assert.equal(areaSlug("Cerrò Maggiore"), areaSlug("Cerro Maggiore"));
    assert.equal(areaSlug("Brissago‑Valtravaglia"), "brissago-valtravaglia"); // trattino unicode
  });

  test("input vuoto o non stringa non produce una chiave inventata", () => {
    assert.equal(areaSlug(""), "");
    assert.equal(areaSlug("   "), "");
    assert.equal(areaSlug(undefined), "");
    assert.equal(areaSlug(null), "");
    assert.equal(areaSlug("(VA)"), "");
  });
});

describe("chiave d'area — composizione e scomposizione", () => {
  test("cinque segmenti posizionali, i mancanti restano vuoti", () => {
    assert.equal(
      buildAreaKey({
        country: "it",
        region: "Lombardia",
        province: "VA",
        municipality: "Tradate",
        neighbourhood: "Abbiate Guazzone",
      }),
      "it|lombardia|va|tradate|abbiate-guazzone",
    );
    // Un comune senza provincia/regione note NON accorcia la chiave: le posizioni devono
    // restare le stesse, altrimenti segmenti diversi finirebbero a combaciare fra loro.
    assert.equal(buildAreaKey({ country: "it", municipality: "Gallarate" }), "it|||gallarate|");
  });

  test("è impossibile infilare un'etichetta dentro una chiave", () => {
    // I valori vengono ri-slugificati dentro buildAreaKey: passare "Tradate (VA)" non può
    // produrre una chiave con dentro spazi e parentesi.
    assert.equal(
      buildAreaKey({ country: "IT", municipality: "Tradate (VA)" }),
      "it|||tradate|",
    );
  });

  test("scomporre e ricomporre non perde nulla", () => {
    const key = "it|lombardia|va|tradate|ceppine";
    assert.deepEqual(parseAreaKey(key), {
      country: "it",
      region: "lombardia",
      province: "va",
      municipality: "tradate",
      neighbourhood: "ceppine",
    });
    assert.equal(buildAreaKey(parseAreaKey(key)), key);
  });

  test("i segmenti vuoti tornano undefined, non stringa vuota", () => {
    const parts = parseAreaKey("it|||gallarate|");
    assert.equal(parts.region, undefined);
    assert.equal(parts.province, undefined);
    assert.equal(parts.neighbourhood, undefined);
    assert.equal(parts.municipality, "gallarate");
  });

  test("due frazioni dello stesso comune condividono la chiave di comune", () => {
    // È ciò che permette il RIUSO del profilo d'area: i fatti a scala comunale (municipio,
    // stazione) si scrivono una volta, non una per frazione.
    const a = "it|lombardia|va|tradate|abbiate-guazzone";
    const b = "it|lombardia|va|tradate|ceppine";
    assert.notEqual(a, b);
    assert.equal(municipalityAreaKey(a), municipalityAreaKey(b));
    assert.equal(municipalityAreaKey(a), "it|lombardia|va|tradate|");
    assert.equal(isNeighbourhoodKey(a), true);
    assert.equal(isNeighbourhoodKey(municipalityAreaKey(a)), false);
  });
});

describe("risoluzione — solo comune", () => {
  test("comune del registro: chiave completa, provincia e regione dal registro", () => {
    const id = resolveAreaIdentity({ municipality: "Tradate" });
    assert.equal(id.areaKey, "it|lombardia|va|tradate|");
    assert.equal(id.municipalityKey, "tradate");
    assert.equal(id.municipalityLabel, "Tradate");
    assert.equal(id.provinceCode, "VA");
    assert.equal(id.region, "Lombardia");
    assert.equal(id.neighbourhoodKey, undefined);
    assert.equal(id.precision, "municipality");
    assert.deepEqual(id.review, []);
  });

  test("comune FUORI registro: resta usabile, ma provincia e regione non si deducono", () => {
    // La regola del progetto: in mancanza di evidenza si dichiara l'assenza. Provincia e
    // regione di un comune sono fatti geografici e qui entrano da una tabella con fonte,
    // non indovinati dal nome (né dal CAP: "Locate Varesino" non è in provincia di Varese).
    const id = resolveAreaIdentity({ municipality: "Gallarate" });
    assert.equal(id.areaKey, "it|||gallarate|");
    assert.equal(id.municipalityKey, "gallarate");
    assert.equal(id.provinceCode, undefined);
    assert.equal(id.region, undefined);
    assert.equal(id.precision, "municipality");
    assert.deepEqual(
      id.review.map((r) => r.code),
      ["municipality-not-in-registry"],
    );
  });

  test("l'etichetta corretta vince su come l'ha scritta il feed", () => {
    const id = resolveAreaIdentity({ municipality: "TRADATE" });
    assert.equal(id.municipalityLabel, "Tradate"); // dal registro, non "TRADATE"
    assert.equal(id.areaKey, "it|lombardia|va|tradate|");
  });

  test("comune assente: nessuna area, e lo si dice", () => {
    const id = resolveAreaIdentity({});
    assert.equal(id.areaKey, "it||||");
    assert.equal(id.precision, "unresolved");
    assert.equal(id.municipalityKey, undefined);
    assert.deepEqual(id.review.map((r) => r.code), ["municipality-missing"]);
  });
});

describe("risoluzione — comune più quartiere", () => {
  test("la zona del gestionale diventa il quinto segmento", () => {
    const id = resolveAreaIdentity({ municipality: "Tradate", neighbourhood: "Abbiate Guazzone" });
    assert.equal(id.areaKey, "it|lombardia|va|tradate|abbiate-guazzone");
    assert.equal(id.neighbourhoodKey, "abbiate-guazzone");
    assert.equal(id.neighbourhoodLabel, "Abbiate Guazzone");
    assert.equal(id.precision, "neighbourhood");
    assert.deepEqual(id.review, []); // frazione già confermata nel registro
  });

  test("DUE immobili, stesso comune, quartieri diversi → chiavi diverse", () => {
    // È il difetto originario, in una riga: prima queste due identità erano indistinguibili
    // e quindi non potevano ricevere contesto locale diverso.
    const a = resolveAreaIdentity({ municipality: "Tradate", neighbourhood: "Abbiate Guazzone" });
    const b = resolveAreaIdentity({ municipality: "Tradate", neighbourhood: "Ceppine" });
    assert.notEqual(a.areaKey, b.areaKey);
    assert.equal(a.municipalityAreaKey, b.municipalityAreaKey);
  });

  test("quartiere non ancora nel registro: si conserva, e si chiede conferma", () => {
    const id = resolveAreaIdentity({ municipality: "Tradate", neighbourhood: "Borsano" });
    assert.equal(id.neighbourhoodKey, "borsano");
    assert.equal(id.neighbourhoodLabel, "Borsano"); // il dato del feed non si butta
    assert.equal(id.areaKey, "it|lombardia|va|tradate|borsano");
    assert.deepEqual(id.review.map((r) => r.code), ["neighbourhood-not-in-registry"]);
  });

  test("zona vuota o segnaposto → nessun quartiere inventato", () => {
    // "N/D" lo toglie `cleanField` a monte (normalize.ts); qui si copre il resto: vuoto,
    // spazi, e una zona fatta di sola punteggiatura che slugificata non lascia nulla.
    for (const zona of ["", "   ", "-", undefined]) {
      const id = resolveAreaIdentity({ municipality: "Tradate", neighbourhood: zona });
      assert.equal(id.neighbourhoodKey, undefined, `zona ${JSON.stringify(zona)}`);
      assert.equal(id.neighbourhoodLabel, undefined);
      assert.equal(id.precision, "municipality");
      assert.equal(id.areaKey, "it|lombardia|va|tradate|");
    }
  });
});

describe("alias e ambiguità — quando NON si indovina", () => {
  test("un alias sicuro riporta alla chiave canonica", () => {
    const id = resolveAreaIdentity({ municipality: "Venegono Sup." });
    assert.equal(id.municipalityKey, "venegono-superiore");
    assert.equal(id.municipalityLabel, "Venegono Superiore");
    assert.equal(id.areaKey, "it|lombardia|va|venegono-superiore|");
  });

  test("un nome ambiguo NON viene risolto: si segnala con i candidati", () => {
    // "Venegono" da solo sono due comuni. Sceglierne uno significherebbe assegnare in
    // silenzio metà degli immobili al comune sbagliato, e scoprirlo mesi dopo.
    const id = resolveAreaIdentity({ municipality: "Venegono" });
    assert.equal(id.municipalityKey, undefined);
    assert.equal(id.precision, "unresolved");
    const flag = id.review.find((r) => r.code === "municipality-ambiguous");
    assert.ok(flag, "manca la segnalazione di ambiguità");
    assert.deepEqual(flag.candidates, ["venegono-superiore", "venegono-inferiore"]);
  });

  test("nessun alias punta a un'ambiguità o fuori dal registro", () => {
    // Difende la tabella: un alias verso un comune che non esiste nel registro sarebbe un
    // vicolo cieco silenzioso, e uno verso un nome ambiguo rimetterebbe l'indovinello.
    for (const [alias, target] of Object.entries(LOCALITY_ALIASES)) {
      assert.ok(MUNICIPALITY_REGISTRY[target], `alias "${alias}" → "${target}" non nel registro`);
      assert.ok(!AMBIGUOUS_LOCALITIES[target], `alias "${alias}" punta a un nome ambiguo`);
      assert.equal(areaSlug(alias), alias, `la chiave dell'alias "${alias}" non è normalizzata`);
    }
  });

  test("i candidati di ogni ambiguità esistono nel registro", () => {
    for (const [name, candidates] of Object.entries(AMBIGUOUS_LOCALITIES)) {
      assert.ok(candidates.length > 1, `"${name}" ha un solo candidato: non è ambiguo`);
      for (const c of candidates) {
        assert.ok(MUNICIPALITY_REGISTRY[c], `candidato "${c}" di "${name}" non nel registro`);
      }
    }
  });
});

describe("frazioni scritte nel campo Comune", () => {
  test("una frazione nota non viene promossa a comune", () => {
    // COMUNI_COORDS contiene "abbiate guazzone" come se fosse un comune: è una frazione di
    // Tradate. Se il feed la mette nel campo Comune, va al segmento giusto — non promossa.
    const id = resolveAreaIdentity({ municipality: "Abbiate Guazzone" });
    assert.equal(id.municipalityKey, "tradate");
    assert.equal(id.municipalityLabel, "Tradate");
    assert.equal(id.neighbourhoodKey, "abbiate-guazzone");
    assert.equal(id.neighbourhoodLabel, "Abbiate Guazzone");
    assert.equal(id.areaKey, "it|lombardia|va|tradate|abbiate-guazzone");
    assert.ok(id.review.some((r) => r.code === "municipality-is-frazione"));
  });

  test("se il feed dà già una zona, quella vince sulla frazione dedotta", () => {
    const id = resolveAreaIdentity({ municipality: "Abbiate Guazzone", neighbourhood: "Ceppine" });
    assert.equal(id.municipalityKey, "tradate");
    assert.equal(id.neighbourhoodKey, "ceppine"); // più specifica di quanto sappiamo noi
  });

  test("ogni frazione nota punta a un comune del registro", () => {
    for (const [key, f] of Object.entries(KNOWN_FRAZIONI)) {
      assert.ok(MUNICIPALITY_REGISTRY[f.municipality], `frazione "${key}" → comune sconosciuto`);
      assert.equal(areaSlug(key), key, `la chiave della frazione "${key}" non è normalizzata`);
    }
  });
});

describe("CAP", () => {
  test("un CAP valido si conserva", () => {
    const id = resolveAreaIdentity({ municipality: "Tradate", postalCode: "21049" });
    assert.equal(id.postalCode, "21049");
    assert.deepEqual(id.review, []);
  });

  test("un CAP malformato si scarta e si segnala, non si aggiusta", () => {
    for (const cap of ["2104", "210499", "21O49", "VA 21049"]) {
      const id = resolveAreaIdentity({ municipality: "Tradate", postalCode: cap });
      assert.equal(id.postalCode, undefined, `CAP "${cap}" non scartato`);
      assert.ok(id.review.some((r) => r.code === "postal-code-invalid"), `CAP "${cap}"`);
    }
  });
});

describe("etichetta pubblica", () => {
  test("il quartiere quando c'è, altrimenti il comune", () => {
    assert.equal(
      publicAreaLabel(resolveAreaIdentity({ municipality: "Tradate", neighbourhood: "Ceppine" })),
      "Ceppine",
    );
    assert.equal(publicAreaLabel(resolveAreaIdentity({ municipality: "Tradate" })), "Tradate");
  });

  test("senza area non si intesta nulla", () => {
    // Meglio nessuna sezione che una sezione intestata a un'area che non sappiamo nominare.
    assert.equal(publicAreaLabel(resolveAreaIdentity({})), null);
    assert.equal(publicAreaLabel(resolveAreaIdentity({ municipality: "Venegono" })), null);
  });
});

describe("il registro è coerente con sé stesso", () => {
  test("ogni chiave è già normalizzata e ogni riga dichiara la fonte", () => {
    for (const [key, entry] of Object.entries(MUNICIPALITY_REGISTRY)) {
      assert.equal(areaSlug(key), key, `chiave "${key}" non normalizzata`);
      assert.equal(areaSlug(entry.label), key, `l'etichetta "${entry.label}" non produce "${key}"`);
      assert.ok(entry.source.trim().length > 0, `"${key}": riga senza provenienza`);
      assert.match(entry.provinceCode, /^[A-Z]{2}$/, `"${key}": sigla provincia non valida`);
      for (const nKey of Object.keys(entry.neighbourhoods ?? {})) {
        assert.equal(areaSlug(nKey), nKey, `frazione "${nKey}" di "${key}" non normalizzata`);
      }
    }
  });
});
