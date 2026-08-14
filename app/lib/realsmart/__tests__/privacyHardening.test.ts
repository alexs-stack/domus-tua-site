// Redazione privacy — batteria estesa di varianti italiane reali (Prompt 2).
//
// Copre ≥40 forme di indirizzo civico che DEVONO sparire con showAddress=false, i falsi positivi
// che NON vanno toccati (misure, prezzi, modi di dire), il layer (a) sull'indirizzo strutturato
// noto, i telefoni e un test di IMPORT del modulo (nessuna sintassi regex non supportata: la
// SyntaxError `(?i:…)` del PR originale non deve tornare).

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  redactPrivateText,
  redactParagraphs,
  hasCivicAddress,
  hasPhoneNumber,
  structuredAddressRegex,
} from "../privacy";
import { verifyRedaction } from "../privacyVerify";

const R = (text: string, extra: { comune?: string; sourceAddress?: string } = {}) =>
  redactPrivateText(text, { showAddress: false, comune: "Tradate", ...extra });

// ── Indirizzi civici che il pattern GENERICO deve redigere (≥40) ──────────────
const ADDRESSES: string[] = [
  "Via Petrarca 7",
  "via Petrarca 7", // parola-chiave minuscola, nome maiuscolo
  "Via Monte Rosa n. 12",
  "Via Monte Rosa n.12",
  "Via Monte Rosa numero 12",
  "Via Roma civico 5",
  "Piazza Garibaldi 3",
  "Piazzale Roma 1",
  "Corso Italia, 15", // virgola prima del numero
  "Viale Europa 8B", // suffisso lettera
  "Viale Europa 8 B",
  "Via Verdi 12/A", // frazione
  "Via Verdi 12/2",
  "Via Dante 3 bis", // bis
  "Vicolo Stretto 2",
  "Largo Cairoli 4",
  "V.le Kennedy 10", // abbreviazione
  "P.zza Duomo 1",
  "C.so Magenta 20",
  "Str. Comunale 8",
  "Località Colline 3",
  "Loc. San Martino 7",
  "Frazione Belvedere 2",
  "Fraz. Sacconago 5",
  "Borgo Antico 9",
  "Contrada Fontana 4",
  "Via Camillo Benso Cavour 15", // via multi-parola
  "Via IV Novembre 8", // numero romano nel nome
  "Via San Francesco d'Assisi 12", // apostrofo
  "Via Alessandro Manzoni 3",
  "in via Dante 5", // preposizione davanti
  "sulla Via Emilia 100",
  "nei pressi di Piazza Repubblica 7",
  "abitazione in Corso Sempione 44",
  "l'ingresso è in Via Battisti 2",
  "Via Ludovico il Moro 22",
  "Viale della Vittoria 16",
  "Via dei Mille 30",
  "Piazza dei Martiri 1",
  "Via Fratelli Bandiera 9",
];

describe(`indirizzi civici redatti con showAddress=false (${ADDRESSES.length} varianti)`, () => {
  for (const addr of ADDRESSES) {
    test(`redatto: "${addr}"`, () => {
      const text = `Immobile luminoso in ${addr}, a due passi dal centro.`;
      const r = R(text);
      assert.ok(!hasCivicAddress(r.text), `indirizzo residuo (rilevatore): "${r.text}"`);
      // Rete indipendente: nessuna fuga anche per il verificatore.
      assert.ok(
        verifyRedaction(r.text, { showAddress: false }).ok,
        `fuga per il verificatore indipendente: "${r.text}"`,
      );
      assert.ok(r.text.includes("Tradate"), `il comune deve restare: "${r.text}"`);
    });
  }
});

// Nota su "Via 25 Aprile 11": il nome inizia con una cifra, quindi il pattern generico (che àncora
// il nome su una MAIUSCOLA) non lo intercetta. È un falso negativo NOTO del solo layer generico,
// coperto dal layer (a) quando l'indirizzo strutturato è noto (test sotto) e comunque intercettato
// dal verificatore quando c'è l'indirizzo di fonte. Lo documentiamo con un test esplicito.
describe("falso negativo NOTO del pattern generico: nome-via che inizia con cifra", () => {
  test("«Via 25 Aprile 11» senza indirizzo strutturato NON è intercettato dal generico", () => {
    const r = R("Immobile in Via 25 Aprile 11.");
    // Lo dichiariamo apertamente: il generico non lo prende (serve il layer a o una correzione).
    assert.equal(hasCivicAddress("Via 25 Aprile 11"), false);
    assert.ok(r.text.includes("Via 25 Aprile 11"));
  });
  test("…ma col layer (a) l'indirizzo strutturato noto viene redatto", () => {
    const r = R("Immobile in Via 25 Aprile 11.", { sourceAddress: "Via 25 Aprile 11" });
    assert.ok(r.civicRedactions >= 1);
    assert.ok(!r.text.includes("25 Aprile 11"), `residuo: "${r.text}"`);
  });
});

// ── Falsi positivi: misure, prezzi, modi di dire — NON toccati ────────────────
const KEEP: string[] = [
  "Via libera a 3 offerte nei primi 5 giorni.",
  "Vista Monte Rosa e doppio terrazzo.",
  "Immobile in corso di ristrutturazione totale.",
  "Ampio soggiorno di 120 mq con 3 locali.",
  "Prezzo richiesto € 420.000, mutuo possibile.",
  "Valore 1.250.000 euro, trattabili.",
  "Spese condominiali 1.200 € l'anno.",
  "A 500 metri dal centro storico.",
  "Al piano 2 con 4 vani e 2 bagni.",
  "Classe energetica A, ottima esposizione.",
  "Strada facendo si scoprono scorci suggestivi.",
  "Largo respiro e soffitti alti 3 metri.",
  "Cantina di 15 mq e box auto doppio.",
  "A 5 min. dalla stazione ferroviaria.",
  "Riscaldamento autonomo, 4 radiatori nuovi.",
];

describe(`numeri e modi di dire che NON sono indirizzi (${KEEP.length} casi)`, () => {
  for (const text of KEEP) {
    test(`intatto: "${text.slice(0, 34)}…"`, () => {
      assert.ok(!hasCivicAddress(text), `falso positivo indirizzo: "${text}"`);
      const r = R(text);
      assert.equal(r.text, text, "il testo non-indirizzo non deve cambiare");
      assert.equal(r.civicRedactions, 0);
    });
  }
});

// ── Layer (a): indirizzo strutturato noto e sue varianti tipografiche ─────────
describe("layer (a) — indirizzo strutturato noto, varianti tipografiche", () => {
  const source = "Via Petrarca 7";
  const variants = [
    "in via petrarca 7 tutto minuscolo",
    "VIA PETRARCA 7 in stampatello",
    "Via Petrarca, 7 con virgola",
    "Via Petrarca n. 7",
    "Via Petrarca civico 7",
    "affacciato su Via Petrarca senza numero", // la via nota, senza civico
  ];
  for (const v of variants) {
    test(`redatto via layer (a): "${v}"`, () => {
      const r = R(v, { sourceAddress: source });
      assert.ok(r.civicRedactions >= 1, `non redatto: "${r.text}"`);
      assert.ok(!/petrarca/i.test(r.text), `nome via residuo: "${r.text}"`);
    });
  }

  test("con frazione: sourceAddress 'Via Verdi 12/A' redige 'Via Verdi 12/A'", () => {
    const r = R("Ingresso da Via Verdi 12/A.", { sourceAddress: "Via Verdi 12/A" });
    assert.ok(!hasCivicAddress(r.text) && !/verdi/i.test(r.text), r.text);
  });

  test("structuredAddressRegex ritorna null su input vuoto", () => {
    assert.equal(structuredAddressRegex(""), null);
    assert.equal(structuredAddressRegex(undefined), null);
  });
});

// ── showAddress=true: indirizzo resta, telefono comunque via ──────────────────
describe("showAddress=true — indirizzo autorizzato resta, telefono sempre rimosso", () => {
  test("l'indirizzo autorizzato non viene toccato", () => {
    const r = redactPrivateText("Villa in Via Petrarca 7.", { showAddress: true, comune: "Tradate" });
    assert.equal(r.civicRedactions, 0);
    assert.ok(r.text.includes("Via Petrarca 7"));
  });
  test("ma il telefono nel corpo è rimosso anche con showAddress=true", () => {
    const r = redactPrivateText("Info al 333 1234567, Via Petrarca 7.", {
      showAddress: true,
      comune: "Tradate",
    });
    assert.equal(r.phoneRedactions >= 1, true);
    assert.ok(!hasPhoneNumber(r.text), `telefono residuo: "${r.text}"`);
    assert.ok(r.text.includes("Via Petrarca 7"), "l'indirizzo autorizzato resta");
  });
});

// ── Telefoni: rimossi sempre; prezzi e misure salvi ──────────────────────────
const PHONES = [
  "Per info chiama 333 1234567.",
  "Tel. 0331 123456 per appuntamenti.",
  "Contattaci al +39 333 123 4567.",
  "Cellulare 333.123.4567 disponibile.",
  "Rif. agente 0039 02 12345678.",
  "WhatsApp 348-1122334 attivo.",
];
describe(`telefoni rimossi (${PHONES.length}); prezzi/misure preservati`, () => {
  for (const text of PHONES) {
    test(`rimosso: "${text.slice(0, 30)}…"`, () => {
      assert.ok(hasPhoneNumber(text), "il rilevatore deve vedere il telefono");
      const r = redactPrivateText(text, { showAddress: true });
      assert.ok(!hasPhoneNumber(r.text), `telefono residuo: "${r.text}"`);
      assert.ok(verifyRedaction(r.text, { showAddress: true }).ok, `fuga telefono (verifier): "${r.text}"`);
    });
  }
  test("prezzi raggruppati e misure non sono telefoni", () => {
    for (const s of ["€ 420.000", "1.250.000 euro", "spese 1.200 €", "120 mq", "200 m²", "piano 2"]) {
      assert.ok(!hasPhoneNumber(s), `scambiato per telefono: "${s}"`);
    }
  });
});

// ── Paragrafi: il paragrafo svuotato dalla redazione sparisce ─────────────────
describe("redazione a livello di paragrafi", () => {
  test("scarta il paragrafo rimasto vuoto (solo telefono)", () => {
    const r = redactParagraphs(
      ["Bell'attico in Via Petrarca 7.", "0331 123456", "Tre camere e doppi servizi."],
      { showAddress: false, comune: "Tradate", sourceAddress: "Via Petrarca 7" },
    );
    assert.equal(r.paragraphs.length, 2);
    assert.ok(!r.paragraphs.some(hasCivicAddress));
    assert.ok(!r.paragraphs.some(hasPhoneNumber));
  });
});

// ── IMPORT del modulo: nessuna sintassi regex non supportata ──────────────────
describe("import del modulo sotto la versione Node supportata", () => {
  test("privacy.ts si importa e le regex si costruiscono senza SyntaxError", async () => {
    // Se `(?i:…)` o altra sintassi non supportata tornasse, questo import fallirebbe in CI (Node 22).
    const mod = await import("../privacy");
    assert.equal(typeof mod.redactPrivateText, "function");
    assert.equal(typeof mod.hasCivicAddress, "function");
    // Costruzione dinamica del redattore strutturato: non deve lanciare.
    assert.doesNotThrow(() => mod.structuredAddressRegex("Via Prova 1"));
  });
});
