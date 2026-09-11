// L'identità geografica sopravvive all'INTERA pipeline: XML del gestionale → grezzo →
// normalizzato → Property pubblica.
//
// I test unitari di app/lib/territory/area/__tests__/identity.test.ts coprono la regola. Questi
// coprono i due punti in cui la regola veniva persa prima: il normalizzatore, che leggeva
// `<Zona>` e non la riportava da nessuna parte, e il mapper pubblico, che riduceva tutta la
// geografia alla stringa di visualizzazione "Comune (PR)".
//
// La fixture è il feed vero in miniatura: app/lib/realsmart/__fixtures__/sample-feed.xml.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { XMLParser } from "fast-xml-parser";

import { parseRealSmartPayload } from "../parse";
import { normalizeRealSmartListing } from "../normalize";
import { normalizedToProperty } from "../toProperty";
import type { RealSmartListingRaw } from "../types";

const xml = readFileSync(
  join(process.cwd(), "app/lib/realsmart/__fixtures__/sample-feed.xml"),
  "utf8",
);
const parser = new XMLParser({ ignoreAttributes: true, trimValues: true });
const raws: RealSmartListingRaw[] = parseRealSmartPayload(parser.parse(xml) as unknown);
const byCode = (code: string) => {
  const raw = raws.find((r) => r.codice === code);
  assert.ok(raw, `fixture: manca l'immobile ${code}`);
  return raw;
};
const normalized = (code: string) => normalizeRealSmartListing(byCode(code));
const property = (code: string) => normalizedToProperty(normalized(code));

describe("il parser legge davvero la geografia del feed", () => {
  test("Comune, Zona, CAP e Indirizzo arrivano al grezzo", () => {
    const raw = byCode("2001");
    assert.equal(raw.localita?.comune, "Tradate");
    assert.equal(raw.localita?.zona, "Abbiate Guazzone");
    assert.equal(raw.localita?.cap, "21049");
    assert.equal(raw.localita?.indirizzo, "Via Piave 14");
  });
});

describe("il normalizzatore non butta più via la zona", () => {
  test("comune + quartiere: chiave a cinque segmenti", () => {
    const n = normalized("2001");
    assert.equal(n.area.areaKey, "it|lombardia|va|tradate|abbiate-guazzone");
    assert.equal(n.area.municipalityLabel, "Tradate");
    assert.equal(n.area.neighbourhoodLabel, "Abbiate Guazzone");
    assert.equal(n.area.postalCode, "21049");
    assert.equal(n.area.precision, "neighbourhood");
  });

  test("due immobili dello stesso comune in quartieri diversi sono distinguibili", () => {
    // Il difetto originario. 2001 sta ad Abbiate Guazzone, 2002 a Ceppine: prima erano
    // entrambi "Tradate (VA)" e non potevano ricevere contesto locale diverso.
    const a = normalized("2001").area;
    const b = normalized("2002").area;
    assert.notEqual(a.areaKey, b.areaKey);
    assert.equal(a.municipalityAreaKey, b.municipalityAreaKey, "il comune va condiviso");
  });

  test("comune senza zona: chiave a livello di comune, nessun quartiere inventato", () => {
    const n = normalized("2003");
    assert.equal(n.area.neighbourhoodKey, undefined);
    assert.equal(n.area.neighbourhoodLabel, undefined);
    assert.equal(n.area.precision, "municipality");
    // Venegono Superiore è nel registro: provincia e regione ci sono.
    assert.equal(n.area.areaKey, "it|lombardia|va|venegono-superiore|");
  });

  test("zona segnaposto («N/D») è un'assenza, non una frazione di nome N/D", () => {
    // È `cleanField` a monte a decidere: senza quel passaggio la chiave sarebbe finita
    // `…|sant-ambrogio-olona|n-d`, cioè un quartiere che non esiste.
    const n = normalized("2005");
    assert.equal(byCode("2005").localita?.zona, "N/D", "la fixture deve contenere il segnaposto");
    assert.equal(n.area.neighbourhoodKey, undefined);
    assert.equal(n.area.precision, "municipality");
  });

  test("comune accentato/con apostrofo: chiave deterministica", () => {
    const n = normalized("2005");
    assert.equal(n.area.municipalityKey, "sant-ambrogio-olona");
    // Fuori registro: provincia e regione restano vuote invece di essere dedotte.
    assert.equal(n.area.areaKey, "it|||sant-ambrogio-olona|");
    assert.equal(n.area.provinceCode, undefined);
    assert.ok(n.area.review.some((r) => r.code === "municipality-not-in-registry"));
  });

  test("comune fuori registro resta pubblicabile", () => {
    // Una segnalazione di revisione non deve mai togliere l'immobile dal sito: blocca l'uso
    // della sua area come chiave di contenuti verificati, non la scheda.
    const n = normalized("2004");
    assert.equal(n.town, "Castiglione Olona");
    assert.equal(n.area.municipalityKey, "castiglione-olona");
    assert.equal(n.area.neighbourhoodKey, "gornate-superiore");
    assert.ok(n.title.length > 0);
    assert.ok(n.descriptionParagraphs.length > 0);
  });
});

describe("Property pubblica: etichetta e chiave sono due campi diversi", () => {
  test("la chiave canonica arriva fino alla pagina", () => {
    const p = property("2001");
    assert.equal(p.areaKey, "it|lombardia|va|tradate|abbiate-guazzone");
    assert.equal(p.municipalityLabel, "Tradate");
    assert.equal(p.neighbourhoodLabel, "Abbiate Guazzone");
  });

  test("`zone` resta l'etichetta storica e NON è la chiave", () => {
    const p = property("2001");
    // Il feed reale non compila <Provincia>, quindi qui `zone` è il solo comune. Il punto del
    // test non è la parentesi: è che `zone` e `areaKey` sono due cose diverse, e che la prima
    // non contiene la seconda.
    assert.equal(p.zone, "Tradate");
    assert.notEqual(p.zone, p.areaKey);
    assert.doesNotMatch(p.zone, /\|/, "l'etichetta non deve contenere una chiave");
  });

  test("il quartiere non finisce nell'etichetta storica", () => {
    // Cambiare `zone` sposterebbe testo visibile in card, filtri e meta description senza che
    // nessuno l'abbia chiesto: la frazione viaggia nel suo campo.
    const a = property("2001");
    const b = property("2002");
    assert.equal(a.zone, b.zone);
    assert.notEqual(a.neighbourhoodLabel, b.neighbourhoodLabel);
  });
});

describe("privacy: la geografia pubblica non è una posizione", () => {
  test("nessuna coordinata attraversa la pipeline", () => {
    // Il feed non espone latitudine/longitudine (docs/adr/001-territorial-enrichment.md §2) e
    // qui non se ne inventano. Questo test è la rete: se un domani il feed le esponesse,
    // devono passare da un canale server-only esplicito, non entrare per inerzia nel payload
    // pubblico insieme al resto della località.
    for (const code of ["2001", "2002", "2003", "2004", "2005"]) {
      const serialized = JSON.stringify(property(code));
      assert.doesNotMatch(serialized, /"lat"|"lng"|"latitud|"longitud/i, `immobile ${code}`);
    }
  });

  test("l'indirizzo civico non esce senza un'autorizzazione esplicita", () => {
    // 2001 ha <Indirizzo>Via Piave 14</Indirizzo> nel feed e nessun override che ne autorizzi
    // la pubblicazione: non deve comparire in nessun campo pubblico.
    const n = normalized("2001");
    assert.equal(n.showAddress, false);
    const p = property("2001");
    assert.doesNotMatch(JSON.stringify(p), /Via Piave/i);
  });

  test("il CAP resta lato server e non entra nella Property pubblica", () => {
    // Il CAP serve alla risoluzione dell'area, non alla scheda: restringe la posizione senza
    // aggiungere nulla a chi legge.
    assert.equal(normalized("2001").area.postalCode, "21049");
    assert.doesNotMatch(JSON.stringify(property("2001")), /21049/);
  });

  test("le segnalazioni di revisione sono diagnostica interna, non payload pubblico", () => {
    const n = normalized("2005");
    assert.ok(n.area.review.length > 0, "la fixture deve produrre almeno una segnalazione");
    const p = property("2005") as Record<string, unknown>;
    assert.equal(p.area, undefined, "l'oggetto identità interno non va sulla Property pubblica");
    assert.doesNotMatch(JSON.stringify(p), /municipality-not-in-registry/);
  });
});
