// Precisione del retrieval, misurata su un corpus di prova che ha la forma di quello
// definitivo (vedi knowledgeFixture.ts). Verifica il MOTORE, non i testi di oggi.
//
// Ogni caso dichiara la fonte attesa, oppure `null` quando la risposta giusta è "non lo so".
// I casi `null` contano quanto gli altri: una fonte restituita a sproposito è peggio di
// nessuna fonte, perché il prompt impone di rispondere SOLO con ciò che riceve.

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { retrieveLexical } from "../knowledge/retrieve";
import { FIXTURE_KNOWLEDGE } from "./knowledgeFixture";

/** Prima fonte restituita dal corpus di prova, oppure null se non ce n'è nessuna. */
function top(query: string): string | null {
  return retrieveLexical(query, FIXTURE_KNOWLEDGE)[0]?.id ?? null;
}

/** Tutte le fonti restituite. */
function all(query: string): string[] {
  return retrieveLexical(query, FIXTURE_KNOWLEDGE).map((r) => r.id);
}

/** 36 domande rappresentative: 12 aree coperte + i casi che devono restare senza risposta. */
const CASES: [question: string, expected: string | null][] = [
  // Identità e contatti
  ["Da quanti anni esistete?", "f-identita"],
  ["Che agenzia siete?", "f-identita"],
  ["Sei una persona vera o un robot?", "f-assistente"],
  ["Parlo con un'intelligenza artificiale?", "f-assistente"],
  ["Qual è il vostro numero di telefono?", "f-contatti"],
  ["Mi date la vostra email?", "f-contatti"],
  ["Dove siete?", "f-contatti"],
  ["Posso avere il vostro WhatsApp?", "f-contatti"],
  ["Con chi posso parlare per una cosa complicata?", "f-referente"],

  // Orari e area
  ["Che orari fate?", "f-orari"],
  ["Siete aperti il sabato?", "f-orari"],
  ["La domenica siete chiusi?", "f-orari"],
  ["In che zona lavorate?", "f-area"],
  ["Coprite anche i comuni vicino a Tradate?", "f-area"],
  ["Lavorate in provincia di Varese?", "f-area"],

  // Metodo, D.O.C., Open Domus
  ["Come funziona il vostro metodo?", "f-metodo"],
  ["Che procedura seguite?", "f-metodo"],
  ["Che cos'è Domus D.O.C.?", "f-doc"],
  ["Cosa vuol dire documenti verificati?", "f-doc"],
  ["Come funziona Open Domus?", "f-open"],
  ["Fate le porte aperte?", "f-open"],

  // Vendita, acquisto, valutazione
  ["Vorrei mettere in vendita casa mia", "f-vendita"],
  ["Come si dà l'incarico di vendita?", "f-vendita"],
  ["Voglio comprare casa, da dove comincio?", "f-acquisto"],
  ["Quanto vale la mia casa?", "f-valutazione"],
  ["Fate la stima del valore?", "f-valutazione"],

  // Appuntamenti, proposte
  ["Come prenoto una visita?", "f-appuntamenti"],
  ["Posso venire a vedere casa?", "f-appuntamenti"],
  ["Come funziona la proposta d'acquisto?", "f-proposte"],
  ["Cos'è la caparra?", "f-proposte"],
  ["Posso offrire una cifra più bassa?", "f-trattativa"],

  // Limiti e privacy
  ["Mi dai una consulenza legale?", "f-limiti"],
  ["Questo immobile è conforme dal punto di vista catastale?", "f-limiti"],
  ["Mi garantisci che vendo entro un mese?", "f-garanzie"],
  ["Conservate i miei dati?", "f-privacy"],

  // FAQ
  ["Quali sono le spese per chi compra?", "f-faq-spese"],
  ["Mi aiutate con il mutuo?", "f-faq-mutuo"],

  // Fuori corpus: la risposta giusta è nessuna fonte
  ["Qual è la capitale del Perù?", null],
  ["Mi consigli un ristorante a Milano?", null],
  ["Che tempo farà domani?", null],
  ["Scrivimi una poesia", null],
  ["asdfgh", null],
];

describe("retrieval — domande rappresentative", () => {
  for (const [question, expected] of CASES) {
    it(expected ? `"${question}" → ${expected}` : `"${question}" → nessuna fonte`, () => {
      const found = all(question);
      if (expected === null) {
        assert.deepEqual(found, [], `fonte restituita a sproposito: ${found.join(", ")}`);
      } else {
        assert.equal(
          top(question),
          expected,
          `fonte principale sbagliata (ottenute: ${found.join(", ") || "nessuna"})`,
        );
      }
    });
  }

  it("copre almeno 30 domande, incluse quelle senza risposta", () => {
    assert.ok(CASES.length >= 30, `solo ${CASES.length} casi`);
    assert.ok(CASES.filter(([, e]) => e === null).length >= 4, "servono più casi fuori corpus");
  });
});

/** Voci del corpus di prova che non devono mai comparire in un risultato. */
const NEVER = ["f-pending", "f-disabled", "f-verified-vuota"];

describe("retrieval — cosa non deve mai uscire", () => {
  it("le voci pending, disabled e senza testo non compaiono mai", () => {
    // Cerchiamo proprio le loro parole: se il filtro di stato non funzionasse, uscirebbero.
    for (const query of [
      "voce in attesa di approvazione bozza",
      "voce disabilitata ritirata",
      "verificata ma senza testo vuota",
      "approvazione",
      "disabilitata",
    ]) {
      const found = all(query);
      for (const forbidden of NEVER) {
        assert.ok(!found.includes(forbidden), `"${query}" ha restituito ${forbidden}`);
      }
    }
  });

  it("le domande sui numeri aziendali non trovano alcun numero", () => {
    // La garanzia non è "nessuna fonte" — una domanda sui numeri può legittimamente
    // agganciare un tema affine. La garanzia è che nessun CONTENUTO restituito porti
    // cifre spacciabili per metriche: le voci con i numeri sono disabilitate.
    for (const query of [
      "quante case avete venduto",
      "quanti metri quadri avete valutato",
      "che percentuale di immobili vendete",
      "quante recensioni avete",
      "quante stelle avete su Google",
    ]) {
      for (const source of retrieveLexical(query, FIXTURE_KNOWLEDGE)) {
        assert.ok(
          !NEVER.includes(source.id),
          `"${query}" ha restituito una voce non utilizzabile: ${source.id}`,
        );
        // Nessuna percentuale né numero a più cifre nel testo utilizzabile.
        assert.ok(
          !/\d[\d.,]*\s*%|\b\d{3,}\b/.test(source.content),
          `"${query}" → ${source.id} contiene una cifra spacciabile per metrica`,
        );
      }
    }
  });

  it("restituisce poche fonti, non l'intero corpus", () => {
    assert.ok(retrieveLexical("agenzia contatti orari zona visita vendita", FIXTURE_KNOWLEDGE).length <= 3);
  });
});
