// Il CORPUS REALE: struttura, stati e ciò che oggi l'assistente sa davvero.
// La precisione del motore di retrieval è verificata a parte, su un corpus di prova
// completo (knowledgeRetrieval.test.ts): qui interessa l'integrità dei dati.

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { KNOWLEDGE, verifiedEntries } from "../knowledge/entries";
import { retrieveKnowledge } from "../knowledge/retrieve";

describe("corpus reale — integrità", () => {
  it("ogni voce ha ID stabile, categoria e fonte", () => {
    const ids = new Set<string>();
    for (const entry of KNOWLEDGE) {
      assert.ok(entry.id.length > 0, "ID mancante");
      assert.ok(!ids.has(entry.id), `ID duplicato: ${entry.id}`);
      ids.add(entry.id);
      assert.ok(entry.category.length > 0, `categoria mancante: ${entry.id}`);
      assert.ok(entry.source.length > 0, `fonte mancante: ${entry.id}`);
      assert.ok(["verified", "pending", "disabled"].includes(entry.status));
      assert.equal(entry.locale, "it");
    }
  });

  it("ogni voce verificata ha contenuto e data di verifica", () => {
    for (const entry of KNOWLEDGE.filter((e) => e.status === "verified")) {
      assert.ok(entry.content.trim().length > 0, `contenuto vuoto: ${entry.id}`);
      assert.match(entry.lastVerified, /^\d{4}-\d{2}-\d{2}$/, `data non valida: ${entry.id}`);
    }
  });

  it("ogni voce non verificata spiega perché lo è", () => {
    // Senza il motivo, chi eredita il file non sa cosa serve per sbloccarla.
    for (const entry of KNOWLEDGE.filter((e) => e.status !== "verified")) {
      assert.ok((entry.note ?? "").trim().length > 0, `manca la nota: ${entry.id}`);
    }
  });

  it("copre tutte le dodici aree previste dal programma", () => {
    const required = [
      "identita", "contatti", "orari", "area", "metodo", "domus-doc", "open-domus",
      "acquisto", "vendita", "valutazione", "appuntamenti", "proposte", "faq", "limiti",
    ];
    const present = new Set(KNOWLEDGE.map((e) => e.category));
    for (const category of required) {
      assert.ok(present.has(category as never), `area non coperta: ${category}`);
    }
  });

  it("le voci pending e disabled non sono mai utilizzabili", () => {
    const usable = new Set(verifiedEntries().map((e) => e.id));
    for (const entry of KNOWLEDGE.filter((e) => e.status !== "verified")) {
      assert.equal(usable.has(entry.id), false, `voce non verificata utilizzabile: ${entry.id}`);
    }
  });

  it("nessun contenuto verificato contiene metriche aziendali", () => {
    // Numeri che cambiano nel tempo o non documentati: se finissero qui, l'assistente li
    // ripeterebbe come fatti. Le uniche cifre ammesse sono orari, anno di fondazione,
    // telefono e CAP — tutte verificabili e stabili.
    for (const entry of verifiedEntries()) {
      assert.ok(!/%/.test(entry.content), `percentuale non documentata in ${entry.id}`);
      assert.ok(
        !/\b\d{4,}\b(?!\s*\))/.test(entry.content.replace(/\b(0331 844898|21049|2007|346 6042314)\b/g, "")),
        `numero grande non documentato in ${entry.id}: ${entry.content}`,
      );
    }
  });
});

describe("corpus reale — cosa sa e cosa non sa oggi", () => {
  it("risponde sulle aree verificate", async () => {
    const cases: [string, string][] = [
      ["A che ora siete aperti il sabato?", "orari-apertura"],
      ["Qual è il vostro numero di telefono?", "contatti-ufficiali"],
      ["In che zona lavorate?", "area-servita"],
      ["Da quanti anni esiste l'agenzia?", "identita-agenzia"],
      ["Puoi darmi una consulenza legale?", "limiti-assistente"],
      ["Sei una persona vera?", "identita-assistente"],
      ["Conservate questa conversazione?", "privacy-conversazione"],
      ["Mi garantisci che vendo entro un mese?", "limiti-garanzie"],
    ];
    for (const [query, expectedId] of cases) {
      const ids = (await retrieveKnowledge(query)).map((r) => r.id);
      assert.ok(ids.includes(expectedId), `"${query}" → attesa ${expectedId}, ottenute ${ids}`);
    }
  });

  it("ammette di non sapere sui temi ancora da approvare", async () => {
    // Comportamento VOLUTO finché il cliente non fornisce i testi ufficiali: meglio
    // "non lo so, ti metto in contatto" che una spiegazione ricostruita a orecchio.
    for (const query of [
      "Cos'è Domus D.O.C.?",
      "Come funziona Open Domus?",
      "Vorrei vendere casa, da dove comincio?",
      "Quanto vale casa mia?",
      "Come prenoto una visita?",
      "Quante recensioni avete?",
    ]) {
      assert.deepEqual(await retrieveKnowledge(query), [], `"${query}" ha restituito fonti`);
    }
  });

  it("la voce sulla pagina FAQ non scavalca il gradino di approvazione", async () => {
    // `faq-pagina` dice DOVE sono le risposte, non le recita. Se un giorno le sue
    // keyword si allargassero fino a intercettare i temi ancora da approvare,
    // l'assistente comincerebbe a rispondere "guarda la FAQ" al posto di ammettere
    // che non sa — e il gradino sarebbe aggirato senza che nessuno l'abbia deciso.
    for (const query of [
      "Cos'è Domus D.O.C.?",
      "Come funziona Open Domus?",
      "Vorrei vendere casa, da dove comincio?",
      "Quanto vale casa mia?",
    ]) {
      const ids = (await retrieveKnowledge(query)).map((r) => r.id);
      assert.ok(!ids.includes("faq-pagina"), `"${query}" ha raggiunto faq-pagina`);
    }
    // Sulla sua domanda, invece, deve esserci.
    const ids = (await retrieveKnowledge("Avete una pagina con le domande frequenti?")).map((r) => r.id);
    assert.ok(ids.includes("faq-pagina"), `non trovata: ${ids}`);
  });

  it("una domanda fuori ambito non restituisce nulla", async () => {
    for (const query of ["Qual è la capitale del Perù?", "Mi consigli un ristorante?", "zzzz"]) {
      assert.deepEqual(await retrieveKnowledge(query), [], `query fuori corpus: ${query}`);
    }
  });

  it("una query vuota non restituisce nulla", async () => {
    assert.deepEqual(await retrieveKnowledge(""), []);
    assert.deepEqual(await retrieveKnowledge("   "), []);
  });

  it("restituisce poche fonti, non l'intero corpus", async () => {
    assert.ok((await retrieveKnowledge("agenzia contatti orari zona")).length <= 3);
  });

  it("funziona senza il livello semantico configurato", async () => {
    // È il percorso di oggi: nessuna VOYAGE_API_KEY. Il retrieval deve restare completo.
    assert.ok((await retrieveKnowledge("Che orari fate?")).length > 0);
  });
});
