// Integrazione RealSmart — parsing, normalizzazione, pulizia delle descrizioni, integrità.
//
// Tutti i test girano su una fixture CONTROLLATA nella forma reale del feed
// (__fixtures__/feed-sample.xml): nessuna dipendenza dalla rete, nessun immobile reale.
// Il controllo contro il feed LIVE è separato (scripts/check-realsmart-live.ts) e non gira
// in CI: se il feed dell'agenzia è giù, la CI non deve diventare rossa.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { XMLParser } from "fast-xml-parser";

import { parseRealSmartPayload, provinceFromIstat, readEnergy } from "../parse";
import { normalizeRealSmartListing } from "../normalize";
import { normalizedToProperty } from "../toProperty";
import {
  cleanDescription,
  excerptFrom,
  normalizeWhitespace,
  stripMarkup,
  toParagraphs,
} from "../description";
import { isAvailable, isReserved, isSold, onlyAvailable } from "../../availability";
import type { NormalizedProperty } from "../types";

const FIXTURE = path.join(process.cwd(), "app", "lib", "realsmart", "__fixtures__", "feed-sample.xml");

function loadFixture(): NormalizedProperty[] {
  const xml = fs.readFileSync(FIXTURE, "utf8");
  const parser = new XMLParser({ ignoreAttributes: true, trimValues: true });
  return parseRealSmartPayload(parser.parse(xml)).map(normalizeRealSmartListing);
}

const listings = loadFixture();
const byCode = new Map(listings.map((l) => [l.id, l]));
const properties = listings.map(normalizedToProperty);
const propByCode = new Map(listings.map((l, i) => [l.id, properties[i]]));

// ══════════════════════════════════════════════════════════════════════════════════════

describe("descrizioni — markup", () => {
  test("i <br> diventano paragrafi, non testo visibile", () => {
    // Regressione dal feed reale: 158 descrizioni su 193 contengono <br/>, e prima finivano
    // a schermo come testo perché React escapa il markup.
    const paragraphs = toParagraphs("Primo. <br/>Secondo.<br />Terzo.");
    assert.deepEqual(paragraphs, ["Primo.", "Secondo.", "Terzo."]);
    for (const p of paragraphs) assert.doesNotMatch(p, /<[^>]*>/);
  });

  test("nessun tag sopravvive alla pulizia, script compresi", () => {
    const out = stripMarkup("<p>Ciao</p><script>alert('xss')</script><b>ok</b>");
    assert.doesNotMatch(out, /<[a-z/!]/i);
    assert.match(out, /alert\('xss'\)/); // resta testo inerte, mai eseguibile
    assert.match(out, /Ciao/);
    assert.match(out, /ok/);
  });

  test("le entità HTML diventano caratteri", () => {
    assert.equal(stripMarkup("Citt&agrave; &amp; caff&egrave;"), "Città & caffè");
    assert.equal(stripMarkup("Prezzo &lt; 1.500"), "Prezzo < 1.500");
    assert.equal(stripMarkup("&#233;"), "é");
  });

  test("spazi doppi, righe vuote e punti incollati vengono sistemati", () => {
    assert.equal(normalizeWhitespace("uno   due"), "uno due");
    assert.equal(normalizeWhitespace("fine.Inizio"), "fine. Inizio");
    assert.equal(normalizeWhitespace("a\n\n\n\nb"), "a\n\nb");
  });

  test("frasi e informazioni originali restano intatte", () => {
    const src = "Villa con 4 locali e giardino di 300 mq. Classe A4. Vicino alla stazione.";
    const clean = cleanDescription(src);
    for (const needle of ["4 locali", "giardino di 300 mq", "Classe A4", "Vicino alla stazione"]) {
      assert.ok(clean.includes(needle), `perso: ${needle}`);
    }
  });

  test("solo la firma commerciale dell'agenzia viene tolta", () => {
    const clean = cleanDescription(
      "Immobile luminoso. Con Domus Tua è facile vendere ed è sicuro acquistare.Da oltre 20 anni al tuo fianco",
    );
    assert.equal(clean, "Immobile luminoso.");
  });

  test("descrizione vuota → nessun paragrafo, nessun estratto", () => {
    assert.deepEqual(toParagraphs(""), []);
    assert.deepEqual(toParagraphs(undefined), []);
    assert.equal(excerptFrom(null), "");
  });

  test("l'estratto non taglia le parole a metà", () => {
    const long = `${"parola ".repeat(60)}fine.`;
    const ex = excerptFrom(long);
    assert.ok(ex.length <= 175);
    assert.doesNotMatch(ex, /parol…$/);
  });
});

describe("mapping dei campi del feed", () => {
  test("la fixture produce gli annunci attesi, scartando quelli senza chiave", () => {
    assert.deepEqual(
      listings.map((l) => l.id),
      ["9001", "9002", "9003", "9004", "9005"],
    );
  });

  test("tipologia, contratto, comune, prezzo, metratura, locali, camere, bagni", () => {
    const p = propByCode.get("9001")!;
    assert.equal(p.type, "Appartamento");
    assert.equal(p.status, "Vendita");
    assert.equal(p.zone, "Tradate (VA)");
    assert.equal(p.priceValue, 420000);
    assert.equal(p.sqm, "145 m²");
    assert.equal(p.rooms, "4 locali");
    assert.equal(p.beds, "3 camere");
    assert.equal(p.baths, "2 bagni");
  });

  test("la provincia si ricava dal codice ISTAT (il feed non la espone)", () => {
    assert.equal(provinceFromIstat("12127"), "VA");
    assert.equal(provinceFromIstat("13159"), "CO");
    assert.equal(provinceFromIstat("15146"), "MI");
    assert.equal(propByCode.get("9003")!.zone, "Venegono Inferiore (VA)");
    assert.equal(propByCode.get("9005")!.zone, "Milano (MI)");
  });

  test("un codice ISTAT fuori tabella non inventa una provincia", () => {
    // 003103 è il codice storico di un comune oggi in un'altra provincia: meglio niente.
    assert.equal(provinceFromIstat("3103"), "");
    assert.equal(provinceFromIstat(""), "");
    assert.equal(provinceFromIstat(undefined), "");
    assert.equal(provinceFromIstat("non-un-codice"), "");
  });

  test("piano: solo 'T' viene tradotto, il resto passa com'è", () => {
    assert.equal(propByCode.get("9001")!.floor, "Piano 2");
    assert.equal(propByCode.get("9003")!.floor, "Piano terra");
    assert.equal(propByCode.get("9005")!.floor, "s1"); // nessuna interpretazione inventata
    assert.equal(propByCode.get("9002")!.floor, undefined);
  });

  test("classe energetica: da <ACE>, non da <ClasseImmobile>", () => {
    // <ClasseImmobile> vale media/signorile/economica: leggendola come classe energetica,
    // nessun immobile del feed reale mostrava mai la classe.
    assert.equal(propByCode.get("9001")!.energyClass, "A4");
    assert.equal(propByCode.get("9004")!.energyClass, "G");
  });

  test("uno stato del certificato non viene spacciato per una classe", () => {
    const reserved = propByCode.get("9003")!;
    assert.equal(reserved.energyClass, undefined);
    assert.equal(reserved.energyClassStatus, "In fase di rilascio");
    assert.equal(propByCode.get("9005")!.energyClassStatus, "Mancante");
    assert.deepEqual(readEnergy("A+"), { classe: "A+" });
    assert.deepEqual(readEnergy("Non richiesta"), { stato: "Non richiesta" });
    assert.deepEqual(readEnergy(""), {});
  });

  test("stato dell'immobile dal gestionale", () => {
    assert.equal(propByCode.get("9001")!.condition, "Ristrutturato");
    assert.equal(propByCode.get("9005")!.condition, "Da Ristrutturare");
    assert.equal(propByCode.get("9002")!.condition, undefined);
  });
});

describe("integrità — un campo assente non è un 'no'", () => {
  test("dotazioni dichiarate: true/false rispettati", () => {
    const a = byCode.get("9001")!.amenities;
    assert.equal(a.elevator, true);
    assert.equal(a.terrace, true);
    assert.equal(a.garden, false); // il feed dichiara "No": è un'informazione, non un vuoto
    assert.equal(a.parking, true); // Box=Si anche se PostoAuto=No
  });

  test("dotazioni non dichiarate restano undefined", () => {
    const a = byCode.get("9002")!.amenities;
    assert.deepEqual(a, {
      elevator: undefined,
      garden: undefined,
      terrace: undefined,
      parking: undefined,
    });
  });

  test("un valore inatteso non diventa un 'sì' né un 'no'", () => {
    assert.equal(byCode.get("9005")!.amenities.terrace, undefined); // <Terrazzo>forse</Terrazzo>
  });

  test("box e posto auto: 'no' solo se entrambi dichiarati assenti", () => {
    // 9001: Box=Si, PostoAuto=No → true. 9002: entrambi assenti → undefined.
    assert.equal(byCode.get("9001")!.amenities.parking, true);
    assert.equal(byCode.get("9002")!.amenities.parking, undefined);
  });

  test("le caratteristiche non vengono dedotte dalla descrizione", () => {
    // 9005 parla di "vetrina" e "luce" ma non dichiara dotazioni: nessuna feature inventata.
    const features = byCode.get("9005")!.features;
    assert.deepEqual(features, []);
  });

  test("i dati mancanti diventano '—', mai uno zero finto", () => {
    const p = propByCode.get("9002")!;
    assert.equal(p.sqm, "—");
    assert.equal(p.rooms, "—");
    assert.equal(p.baths, "—");
    assert.equal(p.price, "Prezzo su richiesta");
    assert.equal(p.priceValue, 0);
  });
});

describe("disponibilità — venduto, in trattativa, disponibile", () => {
  test("i tre stati restano distinguibili", () => {
    assert.equal(propByCode.get("9001")!.availability, "available");
    assert.equal(propByCode.get("9003")!.availability, "reserved");
    assert.equal(propByCode.get("9004")!.availability, "sold");
  });

  test("l'immobile in trattativa resta in vetrina, con il suo badge", () => {
    const p = propByCode.get("9003")!;
    assert.equal(isAvailable(p), true);
    assert.equal(isReserved(p), true);
    assert.ok(p.badges.includes("In trattativa"));
  });

  test("il venduto esce dai risultati disponibili e porta il badge", () => {
    const p = propByCode.get("9004")!;
    assert.equal(isSold(p), true);
    assert.equal(isAvailable(p), false);
    assert.ok(p.badges.includes("Venduto"));
    assert.equal(
      onlyAvailable(properties).some((x) => x.slug === p.slug),
      false,
    );
  });

  test("il badge 'In evidenza' arriva dal feed, non è decorativo", () => {
    assert.ok(propByCode.get("9001")!.badges.includes("In evidenza"));
    assert.equal(propByCode.get("9003")!.badges.includes("In evidenza"), false);
  });
});

describe("sicurezza", () => {
  test("solo immagini HTTPS su host consentito", () => {
    // La fixture 9005 propone un URL http:// e uno su un host esterno: entrambi scartati.
    const images = byCode.get("9005")!.images.map((i) => i.src);
    assert.deepEqual(images, ["https://cloud2.realsmart.it/media//portali/foto/724/724-9005-a.jpg"]);
    for (const l of listings) {
      for (const img of l.images) {
        assert.match(img.src, /^https:\/\/([a-z0-9-]+\.)?realsmart\.it\//);
      }
    }
  });

  test("nessun HTML sopravvive nel testo consumato dalla UI", () => {
    for (const p of properties) {
      for (const para of p.description) assert.doesNotMatch(para, /<[a-z/][^>]*>/i);
      assert.doesNotMatch(p.excerpt, /<[a-z/][^>]*>/i);
    }
  });

  test("più immagini: ordine del feed preservato", () => {
    assert.deepEqual(
      propByCode.get("9001")!.gallery,
      [
        "https://cloud2.realsmart.it/media//portali/foto/724/724-9001-a.jpg",
        "https://cloud2.realsmart.it/media//portali/foto/724/724-9001-b.jpg",
        "https://cloud2.realsmart.it/media//portali/foto/724/724-9001-c.jpg",
      ],
    );
  });

  test("senza immagini la scheda non resta senza copertina", () => {
    const p = propByCode.get("9002")!;
    assert.ok(p.cover.length > 0);
    assert.deepEqual(p.gallery, [p.cover]);
  });
});

describe("robustezza del parser", () => {
  test("payload inatteso → lista vuota, mai un'eccezione", () => {
    for (const payload of [null, undefined, "", 42, [], {}, { Dati: {} }, { Dati: { immobili: {} } }]) {
      assert.deepEqual(parseRealSmartPayload(payload), []);
    }
  });

  test("dati incoerenti non fanno cadere l'annuncio", () => {
    const p = propByCode.get("9005")!;
    assert.equal(p.status, "Affitto"); // "AFFITTO" maiuscolo dal feed
    assert.equal(p.priceValue, 1250); // "1.250 €/mese"
    assert.equal(p.rooms, "—"); // "due" non è un numero: nessun valore inventato
    assert.equal(p.sqm, "80 m²"); // "80 mq"
  });

  test("caratteri speciali e accenti restano corretti", () => {
    const p = propByCode.get("9005")!;
    assert.match(p.title, /Ufficio di prova & co\./);
    assert.match(p.description.join(" "), /Città storica, caffè sotto casa/);
  });

  test("un annuncio rotto non compromette gli altri", () => {
    // La fixture contiene un <immobile> senza Codice né Riferimento: viene scartato e basta.
    assert.equal(listings.length, 5);
  });
});
