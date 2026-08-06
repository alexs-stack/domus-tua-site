// Test del formatter di presentazione delle descrizioni.
//
// Le prime due prove sono le uniche che contano davvero: il testo non cambia e i numeri non
// cambiano. Tutto il resto è tipografia, e la tipografia può sbagliare senza fare danni.
// Se una di queste due cade, il formatter sta riscrivendo un annuncio — cosa che non deve
// poter fare in nessun caso.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { formatListingDescription, splitSentences, blockText } from "../format";
import { descriptionParagraphs } from "../../realsmart/description";

// ── Corpus reale ─────────────────────────────────────────────────────────────

interface Sample {
  codice: string;
  descrizione: string;
}

const samples: Sample[] = JSON.parse(
  readFileSync("app/lib/realsmart/__fixtures__/descriptions.sample.json", "utf8"),
);

/** Multiset ordinato delle cifre: prezzi, metrature, anni, classi. */
function digitRuns(text: string): string[] {
  return text.match(/\d+/g) ?? [];
}

function significantWords(text: string): string[] {
  return (text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).filter((w) => w !== "e" && w !== "ed");
}

/** Tutto il testo che il formatter restituisce, nell'ordine in cui finisce in pagina. */
function outputText(paragraphs: string[]): string {
  return formatListingDescription(paragraphs)
    .blocks.map(blockText)
    .join(" ");
}

// ── 1. Nessun numero viene mai alterato ─────────────────────────────────────

test("i numeri dell'annuncio restano identici, nello stesso ordine", () => {
  for (const sample of samples) {
    const paragraphs = descriptionParagraphs(sample.descrizione);
    assert.deepEqual(
      digitRuns(outputText(paragraphs)),
      digitRuns(paragraphs.join(" ")),
      `cifre alterate in ${sample.codice}`,
    );
  }
});

test("prezzi e valute non vengono toccati", () => {
  const input = ["Prezzo richiesto € 420.000, trattabili. Spese condominiali di 1.250 € l'anno."];
  const out = outputText(input);
  assert.ok(out.includes("€ 420.000"));
  assert.ok(out.includes("1.250 €"));
});

// ── 2. Nessuna parola viene persa o inventata ───────────────────────────────

test("ogni parola significativa dell'annuncio sopravvive alla formattazione", () => {
  for (const sample of samples) {
    const paragraphs = descriptionParagraphs(sample.descrizione);
    const before = significantWords(paragraphs.join(" ")).sort();
    const after = significantWords(outputText(paragraphs)).sort();
    assert.deepEqual(after, before, `parole alterate in ${sample.codice}`);
  }
});

test("la metrica di conservazione vale 1 su tutto il corpus reale", () => {
  for (const sample of samples) {
    const { preservation } = formatListingDescription(descriptionParagraphs(sample.descrizione));
    assert.equal(preservation, 1, `conservazione < 1 in ${sample.codice}`);
  }
});

test("le run di un blocco di prosa ricompongono esattamente il paragrafo", () => {
  const input = [
    "Apertura.",
    "Un soggiorno di circa 30 mq si apre sul terrazzo, con riscaldamento a pavimento e vista libera.",
  ];
  const { blocks } = formatListingDescription(input);
  const prose = blocks.find((b) => b.kind === "para");
  assert.ok(prose && prose.kind === "para");
  assert.equal(prose.runs.map((r) => r.v).join(""), input[1]);
  assert.ok(prose.runs.some((r) => r.t === "strong"));
});

// ── 3. Degradazione elegante ────────────────────────────────────────────────

test("input degeneri non lanciano mai e restituiscono qualcosa di sensato", () => {
  const degenerate: unknown[] = [
    null,
    undefined,
    [],
    [""],
    ["   "],
    [null, undefined, 42, {}, "Una casa vera."],
    ["*"],
    ["**"],
    ["*non chiuso"],
    ["·"],
    ["· · ·"],
    ["A".repeat(20000)],
    ["Frase. ".repeat(500)],
    ["<script>alert(1)</script>"],
    ["MAIUSCOLO TOTALE SENZA PUNTEGGIATURA"],
    ["classe a ogni stanza"],
    ["1"],
  ];
  for (const input of degenerate) {
    const result = formatListingDescription(input as string[]);
    assert.ok(Array.isArray(result.blocks));
    assert.ok(result.preservation >= 0 && result.preservation <= 1);
    assert.equal(typeof result.hasClosing, "boolean");
  }
});

test("un array vuoto o assente non produce blocchi", () => {
  assert.deepEqual(formatListingDescription(null).blocks, []);
  assert.deepEqual(formatListingDescription(undefined).blocks, []);
  assert.deepEqual(formatListingDescription([]).blocks, []);
  assert.deepEqual(formatListingDescription(["", "  "]).blocks, []);
});

test("è deterministico: due esecuzioni danno lo stesso risultato", () => {
  for (const sample of samples.slice(0, 5)) {
    const paragraphs = descriptionParagraphs(sample.descrizione);
    assert.deepEqual(
      formatListingDescription(paragraphs),
      formatListingDescription(paragraphs),
      `output instabile in ${sample.codice}`,
    );
  }
});

// ── 4. La gerarchia editoriale ──────────────────────────────────────────────

test("il primo blocco è sempre l'aggancio", () => {
  for (const sample of samples) {
    const { blocks } = formatListingDescription(descriptionParagraphs(sample.descrizione));
    if (blocks.length === 0) continue;
    assert.equal(blocks[0].kind, "lead", `apertura non riconosciuta in ${sample.codice}`);
  }
});

test("un'apertura lunga cede solo la prima frase all'aggancio", () => {
  const long = `${"Questa è una casa nel centro di Tradate. ".repeat(12)}`.trim();
  const { blocks } = formatListingDescription([long]);
  assert.equal(blocks[0].kind, "lead");
  assert.ok(blocks.length > 1);
  assert.ok(blockText(blocks[0]).length < long.length);
});

test("l'invito finale diventa un blocco di chiusura", () => {
  const { blocks, hasClosing } = formatListingDescription([
    "Un trilocale luminoso nel centro di Tradate.",
    "Scopri l'eleganza di questa casa. Contattaci ora per prenotare la tua visita.",
  ]);
  assert.ok(hasClosing);
  assert.equal(blocks[blocks.length - 1].kind, "closing");
  assert.ok(blockText(blocks[blocks.length - 1]).startsWith("Contattaci"));
});

test("l'invito viene riconosciuto anche se seguito da una coda tecnica", () => {
  const { hasClosing } = formatListingDescription([
    "Un attico nel centro di Tradate.",
    "Prenota oggi stesso la tua visita.",
    "Tour virtuale 360°: esempio.it",
  ]);
  assert.ok(hasClosing);
});

test("senza invito nel testo non se ne inventa uno", () => {
  const { hasClosing, blocks } = formatListingDescription([
    "Un attico nel centro di Tradate.",
    "Tre camere, due bagni e un terrazzo esposto a sud.",
  ]);
  assert.equal(hasClosing, false);
  assert.ok(blocks.every((b) => b.kind !== "closing"));
});

test("un paragrafo evocativo va in corsivo", () => {
  const { blocks } = formatListingDescription([
    "Apertura.",
    "Questo terrazzo, in primavera, diventa il luogo della colazione; in estate, quello delle cene con gli amici; e nelle sere più tranquille il silenzio ha finalmente il suo spazio.",
  ]);
  assert.ok(blocks.some((b) => b.kind === "atmosphere"));
});

test("un paragrafo con misure non viene mai scambiato per atmosfera", () => {
  const { blocks } = formatListingDescription([
    "Apertura.",
    "Immagina di svegliarti qui: il soggiorno di 30 mq si apre sul terrazzo e la colazione arriva col profumo del giardino.",
  ]);
  assert.ok(blocks.every((b) => b.kind !== "atmosphere"));
});

// ── 5. Elenchi ──────────────────────────────────────────────────────────────

test("un'enumerazione di dotazioni diventa un elenco puntato", () => {
  const { blocks } = formatListingDescription([
    "Apertura.",
    "La villa è dotata di riscaldamento autonomo, caldaia a condensazione, radiatori in ghisa e un camino nel soggiorno.",
  ]);
  const list = blocks.find((b) => b.kind === "list");
  assert.ok(list && list.kind === "list");
  assert.deepEqual(list.items, [
    "riscaldamento autonomo",
    "caldaia a condensazione",
    "radiatori in ghisa",
    "un camino nel soggiorno",
  ]);
  assert.equal(list.lead.map((r) => r.v).join(""), "La villa è dotata di");
});

test("una riga telegrafica a separatori diventa un elenco", () => {
  const { blocks } = formatListingDescription([
    "Apertura.",
    "Classe B · Doppio terrazzo · Vista Monte Rosa · Due autorimesse",
  ]);
  const list = blocks.find((b) => b.kind === "list");
  assert.ok(list && list.kind === "list");
  assert.deepEqual(list.items, [
    "Classe B",
    "Doppio terrazzo",
    "Vista Monte Rosa",
    "Due autorimesse",
  ]);
  assert.deepEqual(list.lead, []);
});

test("una frase con virgole ma senza attacco d'elenco resta prosa", () => {
  const { blocks } = formatListingDescription([
    "Apertura.",
    "Gli spazi sono luminosi, ariosi, ben distribuiti e curati nei dettagli.",
  ]);
  assert.ok(blocks.every((b) => b.kind !== "list"));
});

test("gli elenchi non superano il tetto di tre per annuncio", () => {
  const sentence =
    "La villa è dotata di riscaldamento autonomo, caldaia a condensazione, radiatori in ghisa e un camino.";
  const { blocks } = formatListingDescription(["Apertura.", ...Array(8).fill(sentence)]);
  assert.equal(blocks.filter((b) => b.kind === "list").length, 3);
});

test("i due punti introducono un elenco quando le voci sono sintagmi brevi", () => {
  const { blocks } = formatListingDescription([
    "Apertura.",
    "Appena entri percepisci ciò che rende speciale questa abitazione: la luce, l’armonia degli spazi, la raffinatezza, la funzionalità.",
  ]);
  const list = blocks.find((b) => b.kind === "list");
  assert.ok(list && list.kind === "list");
  assert.deepEqual(list.items, ["la luce", "l’armonia degli spazi", "la raffinatezza", "la funzionalità"]);
});

test("i due punti di una frase normale non producono un elenco", () => {
  const { blocks } = formatListingDescription([
    "Apertura.",
    "Oggi a Tradate la risposta è semplice: gli attici, che non si costruiscono ogni giorno, aspettano il momento giusto per cambiare proprietario.",
  ]);
  assert.ok(blocks.every((b) => b.kind !== "list"));
});

test("una voce che continua la precedente annulla l'elenco: resta prosa", () => {
  // «dotato di…» e «comodo per…» descrivono il giardino, non sono altre voci.
  const { blocks } = formatListingDescription([
    "Apertura.",
    "La proprietà comprende un bel giardino di 183 m2, dotato di passerella e portico, comodo per pranzi e cene all’aperto.",
  ]);
  assert.ok(blocks.every((b) => b.kind !== "list"));
});

test("la congiunzione dopo la virgola non diventa una voce d'elenco", () => {
  const { blocks } = formatListingDescription([
    "Apertura.",
    "Nel seminterrato si trovano inoltre una comoda dispensa, una spaziosa lavanderia, due cantine, e il locale caldaia.",
  ]);
  const list = blocks.find((b) => b.kind === "list");
  assert.ok(list && list.kind === "list");
  assert.deepEqual(list.items, [
    "una comoda dispensa",
    "una spaziosa lavanderia",
    "due cantine",
    "il locale caldaia",
  ]);
});

test("un elenco di dotazioni anteposto al verbo diventa un elenco", () => {
  const { blocks } = formatListingDescription([
    "Apertura.",
    "Serramenti in legno con doppio vetro, caldaia autonoma, porta blindata, zanzariere, tende da sole, antifurto, aria condizionata e videocitofono sono solo alcuni plus che potrai venire a vedere.",
  ]);
  const list = blocks.find((b) => b.kind === "list");
  assert.ok(list && list.kind === "list");
  assert.deepEqual(list.items, [
    "Serramenti in legno con doppio vetro",
    "caldaia autonoma",
    "porta blindata",
    "zanzariere",
    "tende da sole",
    "antifurto",
    "aria condizionata",
    "videocitofono",
  ]);
  assert.deepEqual(list.lead, []);
  // La coda col verbo resta prosa, sotto l'elenco: non viene persa.
  assert.ok(
    blocks.some((b) => b.kind === "para" && blockText(b).startsWith("sono solo alcuni plus")),
    "coda dell'elenco anteposto persa",
  );
});

test("un elenco di aggettivi non viene scambiato per dotazioni anteposte", () => {
  const { blocks } = formatListingDescription([
    "Apertura.",
    "Gli spazi sono luminosi, ariosi, ben distribuiti e curati nei minimi dettagli.",
  ]);
  assert.ok(blocks.every((b) => b.kind !== "list"));
});

test("una frase con il punto fermo senza spazio viene comunque divisa", () => {
  // Il feed scrive «…lo consente.La zona notte…»: senza questa divisione l'invito finale
  // e gli elenchi del paragrafo resterebbero invisibili.
  assert.equal(splitSentences("La struttura lo consente.La zona notte è distinta.").length, 2);
  // …ma un prezzo NON è due frasi.
  assert.equal(splitSentences("Prezzo di 1.500 euro al mese.").length, 1);
});

test("un annuncio in un solo paragrafo viene comunque strutturato", () => {
  // Il caso peggiore del feed: aggancio, corpo con enumerazione e invito tutti in un blocco.
  // Prima di `bodyBlocks` ricorsivo il corpo finiva integralmente in prosa.
  const { blocks } = formatListingDescription([
    [
      "Una villa che non ti aspetti, a due passi dal centro.",
      "Il piano rialzato ospita la zona giorno affacciata sul parco, con una vetrata continua che porta la luce fin dentro al corridoio.",
      "Nel seminterrato si trovano una comoda dispensa, una spaziosa lavanderia, due cantine e il locale caldaia.",
      "Chiamateci per fissare un appuntamento.",
    ].join(" "),
  ]);
  assert.equal(blocks[0].kind, "lead");
  assert.ok(blocks.some((b) => b.kind === "list"), "elenco non riconosciuto nel corpo");
  assert.equal(blocks[blocks.length - 1].kind, "closing");
});

// ── 6. Disciplina del grassetto e degli accenti ─────────────────────────────

test("il grassetto non supera i cinque punti di forza per annuncio", () => {
  for (const sample of samples) {
    const { blocks } = formatListingDescription(descriptionParagraphs(sample.descrizione));
    const strongs = blocks.flatMap((b) =>
      b.kind === "list" ? [] : b.runs.filter((r) => r.t === "strong"),
    );
    assert.ok(strongs.length <= 5, `troppi grassetti in ${sample.codice}: ${strongs.length}`);
  }
});

test("lo stesso punto di forza non viene evidenziato due volte", () => {
  for (const sample of samples) {
    const { blocks } = formatListingDescription(descriptionParagraphs(sample.descrizione));
    const strongs = blocks
      .flatMap((b) => (b.kind === "list" ? [] : b.runs))
      .filter((r) => r.t === "strong")
      .map((r) => r.v.toLowerCase());
    assert.equal(new Set(strongs).size, strongs.length, `grassetto ripetuto in ${sample.codice}`);
  }
});

test("«un tocco di classe a ogni stanza» non viene letto come classe energetica", () => {
  const { blocks } = formatListingDescription([
    "Apertura.",
    "Il pavimento in gres aggiunge un tocco di classe a ogni stanza.",
  ]);
  const strongs = blocks.flatMap((b) => (b.kind === "list" ? [] : b.runs)).filter((r) => r.t === "strong");
  assert.deepEqual(strongs, []);
});

test("la classe energetica scritta per esteso viene evidenziata", () => {
  const { blocks } = formatListingDescription([
    "Apertura.",
    "L'immobile è in classe energetica B con impianti recenti.",
  ]);
  const strongs = blocks.flatMap((b) => (b.kind === "list" ? [] : b.runs)).filter((r) => r.t === "strong");
  assert.deepEqual(strongs.map((r) => r.v), ["classe energetica B"]);
});

test("le superfici in m² vengono evidenziate quanto quelle in mq", () => {
  for (const unit of ["mq", "m²", "m2"]) {
    const { blocks } = formatListingDescription(["Apertura.", `Uno studio di 45 ${unit} al piano primo.`]);
    const strongs = blocks
      .flatMap((b) => (b.kind === "list" ? [] : b.runs))
      .filter((r) => r.t === "strong");
    assert.deepEqual(strongs.map((r) => r.v), [`45 ${unit}`], `unità non riconosciuta: ${unit}`);
  }
});

test("gli accenti non superano i due per annuncio e non sono mai consecutivi", () => {
  for (const sample of samples) {
    const { blocks } = formatListingDescription(descriptionParagraphs(sample.descrizione));
    const accents = blocks.filter((b) => b.kind === "accent");
    assert.ok(accents.length <= 2, `troppi accenti in ${sample.codice}`);
    for (let i = 1; i < blocks.length; i += 1) {
      assert.ok(
        !(blocks[i].kind === "accent" && blocks[i - 1].kind === "accent"),
        `accenti consecutivi in ${sample.codice}`,
      );
    }
  }
});

test("una frase corta con incisi resta prosa, non diventa accento", () => {
  const { blocks } = formatListingDescription([
    "Apertura.",
    "La piscina, dalla forma armonica e ben posizionata, è integrata con il contesto.",
  ]);
  assert.ok(blocks.every((b) => b.kind !== "accent"));
});

test("gli asterischi dell'autore diventano enfasi, non testo", () => {
  const { blocks } = formatListingDescription(["Apertura.", "*Benvenuti nella Vostra Nuova Dimora*"]);
  const accent = blocks.find((b) => b.kind === "accent");
  assert.ok(accent && accent.kind === "accent");
  assert.equal(blockText(accent), "Benvenuti nella Vostra Nuova Dimora");
  assert.ok(!blockText(accent).includes("*"));
});

test("un titoletto dell'autore diventa accento e la prosa prosegue sotto", () => {
  const { blocks } = formatListingDescription([
    "Apertura.",
    "Un Viaggio Attraverso il Comfort e lo Stile: varcando il cancello un camminamento conduce verso la villa.",
  ]);
  const accent = blocks.find((b) => b.kind === "accent");
  assert.ok(accent && accent.kind === "accent");
  assert.equal(blockText(accent), "Un Viaggio Attraverso il Comfort e lo Stile");
});

test("una frase normale con i due punti non diventa un titoletto", () => {
  const { blocks } = formatListingDescription([
    "Apertura.",
    "Oggi a Tradate la risposta è semplice: gli attici sono introvabili e questa è la ragione per cui vale la pena muoversi subito.",
  ]);
  assert.ok(blocks.every((b) => b.kind !== "accent"));
});

// ── 7. Paragrafi lunghi ─────────────────────────────────────────────────────

test("un paragrafo molto lungo viene spezzato a fine frase", () => {
  const long = `${"Il soggiorno si apre sul giardino con una vetrata continua. ".repeat(10)}`.trim();
  const { blocks } = formatListingDescription(["Apertura.", long]);
  const paras = blocks.filter((b) => b.kind === "para");
  assert.ok(paras.length >= 2);
  for (const p of paras) {
    assert.ok(/[.!?…]$/.test(blockText(p).trim()), "spezzatura non a fine frase");
  }
});

// ── 8. Divisione in frasi ───────────────────────────────────────────────────

test("splitSentences ricompone sempre l'originale", () => {
  const cases = [
    "Una frase. Un'altra frase! E una terza?",
    "Servizi, negozi, scuole ecc. Il centro è a due passi.",
    "Il sig. Rossi vende. La casa è libera.",
    "Nessuna punteggiatura finale",
    "",
  ];
  for (const c of cases) {
    assert.equal(splitSentences(c).join(""), c, `ricomposizione fallita su: ${c}`);
  }
});

test("le abbreviazioni non spezzano la frase", () => {
  assert.equal(splitSentences("Servizi, negozi, scuole ecc. Il centro è vicino.").length, 1);
});
