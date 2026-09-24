// Il CORPUS REALE: struttura, stati e ciò che oggi l'assistente sa davvero.
// La precisione del motore di retrieval è verificata a parte, su un corpus di prova
// completo (knowledgeRetrieval.test.ts): qui interessa l'integrità dei dati.

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { faqFlat } from "../../../domande-frequenti/faq";
import { faqIt as careersFaqIt } from "../../../lavora-con-noi/faq";
import { DEVE_AGGANCIARE } from "../__evals__/semanticCases";
import { KNOWLEDGE, verifiedEntries } from "../knowledge/entries";
import { retrieveKnowledge } from "../knowledge/retrieve";
import { SEMANTIC_FLOOR, semanticScores } from "../knowledge/semantic";

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

  it("risponde su tutto ciò che il sito pubblica", async () => {
    // Il gradino di approvazione non è sparito: si è spostato. Quello che l'agenzia ha
    // già messo online è approvato dal fatto di essere online, e l'assistente lo dice.
    // Ogni caso qui sotto è una domanda che prima finiva in "non lo so".
    const cases: [string, string][] = [
      ["Cos'è Domus D.O.C.?", "domus-doc"],
      ["Che cosa verificate sui documenti?", "faq-doc"],
      ["Come funziona Open Domus?", "open-domus"],
      ["Devo lasciare libera la casa durante l'Open Domus?", "faq-open-domus"],
      ["Che metodo usate?", "metodo-domus"],
      ["Vorrei vendere casa, da dove comincio?", "processo-vendita"],
      ["Quanto costa vendere casa con voi?", "faq-costi"],
      ["Come stabilite il prezzo?", "faq-prezzo"],
      ["Cosa fate prima di pubblicare l'annuncio?", "faq-prima-online"],
      ["In quanto tempo si vende una casa?", "faq-tempi"],
      ["Quanto vale casa mia?", "valutazione-immobile"],
      ["Come si compra casa con voi?", "processo-acquisto"],
      ["Come faccio a sapere se i documenti sono in ordine?", "faq-documenti-acquisto"],
      ["Non trovo quello che cerco, posso lasciarvi una richiesta?", "faq-richiesta-su-misura"],
      ["Posso avere le informazioni prima della visita?", "faq-info-visita"],
      ["Come prenoto una visita?", "appuntamenti-visite"],
      ["Mi seguite anche dopo la proposta?", "faq-dopo-proposta"],
      ["Posso offrire una cifra più bassa?", "proposte-documenti"],
      ["Dove trovo l'informativa privacy?", "privacy-pagina"],
    ];
    for (const [query, expectedId] of cases) {
      const ids = (await retrieveKnowledge(query)).map((r) => r.id);
      assert.ok(ids.includes(expectedId), `"${query}" → attesa ${expectedId}, ottenute ${ids}`);
    }
  });

  it("le voci FAQ restano agganciate alla pagina, non ne sono una copia", () => {
    // Il testo NON è ricopiato: `fromFaq` e `fromCareersFaq` lo leggono dalle rispettive
    // fonti uniche, le stesse che alimentano le pagine e il JSON-LD. Se un giorno qualcuno
    // incollasse le risposte dentro entries.ts, il corpus continuerebbe a funzionare e
    // nessuno se ne accorgerebbe finché una risposta corretta sul sito non smettesse di
    // arrivare all'assistente. Il confronto stringa per stringa è l'unico modo per vederlo.
    //
    // Due famiglie, due prefissi. `faq-lavoro-` va controllato PRIMA di `faq-`, che ne è
    // un prefisso: è la svista che ha fatto fallire questo test appena le candidature sono
    // entrate nel corpus, ed è il motivo per cui l'ordine qui sotto conta.
    const famiglie = [
      {
        prefisso: "faq-lavoro-",
        minimo: 4,
        origini: new Map(careersFaqIt.map((e) => [e.id as string, e] as const)),
      },
      {
        prefisso: "faq-",
        minimo: 10,
        origini: new Map(faqFlat("it").map((e) => [e.id as string, e] as const)),
      },
    ];

    const conteggi = new Map(famiglie.map((f) => [f.prefisso, 0]));
    for (const entry of verifiedEntries()) {
      if (entry.id === "faq-pagina") continue; // indica la pagina, non ne recita una voce
      const famiglia = famiglie.find((f) => entry.id.startsWith(f.prefisso));
      if (!famiglia) continue;
      const origine = famiglia.origini.get(entry.id.slice(famiglia.prefisso.length));
      assert.ok(origine, `nessuna FAQ del sito per ${entry.id}`);
      assert.equal(entry.content, origine.a, `${entry.id}: testo diverso dalla pagina`);
      assert.equal(entry.title, origine.q, `${entry.id}: domanda diversa dalla pagina`);
      conteggi.set(famiglia.prefisso, (conteggi.get(famiglia.prefisso) ?? 0) + 1);
    }

    for (const famiglia of famiglie) {
      const trovate = conteggi.get(famiglia.prefisso) ?? 0;
      assert.ok(
        trovate >= famiglia.minimo,
        `${famiglia.prefisso}: attese almeno ${famiglia.minimo} voci, trovate ${trovate}`,
      );
    }
  });

  it("ogni FAQ pubblicata sul sito è arrivata nel corpus", () => {
    // Il test sopra dice che quelle promosse sono fedeli; questo dice che non ne manca
    // nessuna. Senza, aggiungere una FAQ alla pagina e scordarsi di promuoverla non
    // farebbe rumore — e l'assistente resterebbe indietro rispetto al sito in silenzio.
    //
    // Le esclusioni sono deliberate e vanno motivate qui, non altrove:
    //  • sede-orari / contatti / zone → già coperte da voci dedicate che leggono lo stesso
    //    `site`: promuoverle aggiungerebbe copie, non conoscenza;
    //  • storia → la risposta cita valutazione media e numero di recensioni, dati VIVI.
    //    È il motivo per cui `reputazione-recensioni` è disabled, e non si aggira da qui.
    const escluse = new Set(["sede-orari", "contatti", "zone", "storia"]);
    const presenti = new Set(verifiedEntries().map((e) => e.id));

    for (const faq of faqFlat("it")) {
      if (escluse.has(faq.id)) {
        assert.ok(!presenti.has(`faq-${faq.id}`), `${faq.id} è esclusa ma risulta promossa`);
        continue;
      }
      assert.ok(presenti.has(`faq-${faq.id}`), `FAQ del sito non promossa: ${faq.id}`);
    }
    for (const faq of careersFaqIt) {
      assert.ok(presenti.has(`faq-lavoro-${faq.id}`), `FAQ lavoro non promossa: ${faq.id}`);
    }
  });

  it("copre le domande poste con parole diverse da quelle del corpus", async () => {
    // Questi casi erano nati per TARARE il livello semantico: sono riformulazioni che il
    // lessicale, in teoria, non dovrebbe prendere. Misurandoli è venuto fuori l'opposto di
    // quello che ci si aspettava.
    //
    //   solo lessicale, prima:  3 giuste, 6 fonti sbagliate, 4 vuote
    //   solo lessicale, dopo:  10 giuste, 3 fonti diverse,   0 vuote
    //   semantico (misurato):   2 prime scelte giuste su 10
    //
    // In mezzo non c'è un algoritmo nuovo: ci sono le parole vere. "IMU" e "detrarre" per i
    // limiti fiscali, "curiosi" per Open Domus, "burocrazia" per le pratiche, "carte in
    // regola" per Domus D.O.C., "fare da solo" per la vendita. Su un corpus di poche decine
    // di voci in una sola lingua, le keyword curate a mano battono gli embeddings — e sono
    // deterministiche, gratuite e offline.
    //
    // La soglia è 9 su 13, non 13 su 13: le tre che restano ricevono una fonte diversa da
    // quella attesa ma non sbagliata (a *"sto pagando troppo?"* risponde `faq-prezzo`, che
    // spiega come si costruisce il prezzo). Inseguire il punteggio pieno su tredici frasi
    // scritte a mano significherebbe tarare il corpus su questo test invece che sugli utenti.
    let giuste = 0;
    for (const caso of DEVE_AGGANCIARE) {
      const ids = (await retrieveKnowledge(caso.q)).map((r) => r.id);
      assert.ok(ids.length > 0, `nessuna fonte per "${caso.q}" (${caso.perche})`);
      if (ids.includes(caso.id)) giuste++;
    }
    assert.ok(
      giuste >= 9,
      `solo ${giuste}/${DEVE_AGGANCIARE.length} riformulazioni raggiungono la voce attesa`,
    );
  });

  it("le parole comuni non trascinano dentro la voce sbagliata", async () => {
    // Il registro dei falsi positivi veri, quelli trovati sul corpus REALE. In italiano le
    // radici si sovrappongono, e una keyword generica costa più di quanto renda: ogni riga
    // qui sotto è una keyword che sembrava innocua e agganciava un'altra conversazione.
    //
    //   "tempi"  su limiti-garanzie  → "Che tempo farà domani?"
    //   "aperto" su orari-apertura   → "…non ci sono posizioni aperte?"
    //
    // Il test non chiede che la risposta sia vuota — su alcune di queste domande una fonte
    // pertinente c'è. Chiede che NON compaia quella sbagliata.
    const casi: [string, string][] = [
      ["Che tempo farà domani?", "limiti-garanzie"],
      ["Posso candidarmi se non ci sono posizioni aperte?", "orari-apertura"],
      ["Avete posizioni aperte?", "orari-apertura"],
      ["Quanto costa vendere casa?", "orari-apertura"],
    ];
    for (const [query, vietata] of casi) {
      const ids = (await retrieveKnowledge(query)).map((r) => r.id);
      assert.ok(!ids.includes(vietata), `"${query}" ha agganciato ${vietata}: ${ids}`);
    }
  });

  it("ammette di non sapere dove il sito non dice nulla", async () => {
    // Ogni voce rimasta ha una ragione precisa:
    //  - i numeri di volume non sono mai stati documentati (`metriche-aziendali`, disabled);
    //  - chi segua i casi complessi il sito non lo scrive (`referente-casi-complessi`).
    for (const query of [
      "Quante case avete venduto?",
      "Chi è il referente per i casi complessi?",
    ]) {
      assert.deepEqual(await retrieveKnowledge(query), [], `"${query}" ha restituito fonti`);
    }
  });

  it("sulle recensioni dice dove sono, mai quante", async () => {
    // Il silenzio non era la risposta giusta: le recensioni sono pubbliche, su una pagina
    // del sito. Prima "Quante recensioni avete?" non trovava nulla e l'assistente proponeva
    // il team — onesto e inutile. Ora manda alla pagina.
    //
    // Il confine è il NUMERO. `reputazione-recensioni` resta disabled perché quantità e
    // media sono dati vivi: scritti a mano invecchiano senza che nessuno se ne accorga.
    // Un indirizzo non invecchia. Questo test tiene ferma la distinzione, che è sottile e
    // facile da erodere con "aggiungiamo solo la media, che fa scena".
    const fonti = await retrieveKnowledge("Quante recensioni avete?");
    const ids = fonti.map((f) => f.id);
    assert.ok(ids.includes("recensioni-pagina"), `attesa recensioni-pagina, ottenute ${ids}`);
    assert.ok(!ids.includes("reputazione-recensioni"), "la voce disabilitata è tornata viva");

    for (const fonte of fonti) {
      assert.ok(!/\d/.test(fonte.content), `${fonte.id} porta una cifra: ${fonte.content}`);
    }
    const [voce] = fonti.filter((f) => f.id === "recensioni-pagina");
    assert.match(voce.content, /\/recensioni/, "non dice dove sono");
  });

  it("non recita l'informativa privacy, ci rimanda", async () => {
    // La pagina /privacy dichiara di essere una traduzione automatica da rivedere con un
    // legale: `privacy-policy` resta pending apposta. `privacy-pagina` può dire dove sta
    // l'informativa e chi è il titolare, non cosa c'è scritto dentro.
    const [voce] = verifiedEntries().filter((e) => e.id === "privacy-pagina");
    assert.ok(voce, "privacy-pagina non è verificata");
    assert.match(voce.content, /\/privacy/);
    for (const legalese of ["art. 6", "GDPR", "base giuridica", "Regolamento UE"]) {
      assert.ok(!voce.content.includes(legalese), `privacy-pagina recita l'informativa: ${legalese}`);
    }
  });

  it("la voce sulla pagina FAQ resta sulla sua domanda", async () => {
    // `faq-pagina` risponde "le domande frequenti sono lì", che è utile solo a chi chiede
    // proprio quello. Se si allargasse fino a intercettare i temi di merito, l'assistente
    // rimanderebbe alla pagina invece di rispondere — un passo indietro, ora che le
    // risposte le ha davvero.
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
    // È il percorso di oggi. Il retrieval deve restare completo.
    assert.ok((await retrieveKnowledge("Che orari fate?")).length > 0);
  });

  it("il livello semantico resta spento finché la soglia non è misurata", async () => {
    // Non è un dettaglio di configurazione, è una guardia. La misura del 2026-08-06
    // (`npm run calibrate:semantic`, gemini-embedding-001) dice che su questo corpus le
    // domande fuori tema somigliano alle voci quanto quelle pertinenti: "Quanto pagherò di
    // IMU?" arriva a 0,683 contro `valutazione-immobile`, più in alto di otto domande
    // buone su dieci. Col vecchio default di 0,6 sarebbe passata anche "Che voto avete su
    // Google?" (0,625), aggirando per caso `reputazione-recensioni`, disabilitata apposta.
    //
    // Da lì la regola: nessun default. La soglia esiste solo se qualcuno l'ha misurata e
    // scritta in ASSISTANT_SEMANTIC_FLOOR. Se questo test diventa rosso perché la variabile
    // è impostata nell'ambiente, la domanda giusta non è "come lo aggiusto" ma "chi ha
    // acceso il semantico, e con quale misura?".
    if (process.env.ASSISTANT_SEMANTIC_FLOOR) {
      assert.ok(SEMANTIC_FLOOR !== null, "soglia impostata ma non letta");
      return;
    }
    assert.equal(SEMANTIC_FLOOR, null, "soglia con un default: era la vecchia trappola");
    assert.equal(await semanticScores("Quanto pagherò di IMU?"), null);
  });
});
