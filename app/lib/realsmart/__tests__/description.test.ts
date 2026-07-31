// Regressione della normalizzazione delle descrizioni RealSmart.
//
// Bug coperto: il feed consegna i ritorni a capo come "<br/>" dentro una CDATA; fast-xml-parser
// li restituisce come TESTO, quindi finivano visibili in pagina. Inoltre il vecchio codice
// raggruppava le frasi "a gruppi di 3", inventando paragrafi che l'autore non aveva scritto.
//
// Il frammento principale è quello REALE dell'annuncio T447 (codice 2055, Tradate) mostrato
// nello screenshot del cliente: è il caso che deve restare verde per sempre.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { normalizeDescription, descriptionParagraphs, descriptionExcerpt } from "../description";

/** Frammento reale dell'annuncio T447 (feed live, campo AnnuncioCompleto). */
const T447_FRAGMENT =
  "Ci sono case che salgono di prezzo. E case che salgono di piano.<br/>" +
  "Classe B · Doppio terrazzo · Vista Monte Rosa · Due autorimesse<br/>" +
  "Indovina quali sono le più difficili da trovare.<br/>" +
  "Oggi a Tradate la risposta è semplice: gli attici. Soprattutto se recenti, in classe " +
  "energetica B, con riscaldamento a pavimento, cappotto termico e pavimenti in parquet.";

/** Invarianti che DEVONO valere per qualunque input. */
function assertClean(paragraphs: readonly string[], label: string) {
  for (const p of paragraphs) {
    assert.ok(p.length > 0, `${label}: paragrafo vuoto`);
    assert.equal(p, p.trim(), `${label}: paragrafo non trimmato → "${p}"`);
    assert.ok(!/<br/i.test(p), `${label}: break visibile → "${p}"`);
    assert.ok(!/<[a-z/!][^>]*>/i.test(p), `${label}: tag visibile → "${p}"`);
    assert.ok(
      !/&(amp|lt|gt|quot|apos|nbsp|#\d+);/i.test(p),
      `${label}: entità non decodificata → "${p}"`,
    );
    assert.ok(!/ |​/.test(p), `${label}: spazio unificatore residuo → "${p}"`);
  }
}

describe("normalizeDescription — frammento reale dello screenshot (T447)", () => {
  const { paragraphs } = normalizeDescription(T447_FRAGMENT);

  test("nessun <br/> visibile e nessun paragrafo vuoto", () => {
    assertClean(paragraphs, "T447");
  });

  test("ogni riga separata da un break resta un paragrafo distinto", () => {
    assert.deepEqual(paragraphs.slice(0, 3), [
      "Ci sono case che salgono di prezzo. E case che salgono di piano.",
      "Classe B · Doppio terrazzo · Vista Monte Rosa · Due autorimesse",
      "Indovina quali sono le più difficili da trovare.",
    ]);
  });

  test("la riga tecnica NON viene fusa con la narrativa né spezzata", () => {
    const technical = paragraphs.filter((p) => p.includes("Vista Monte Rosa"));
    assert.equal(technical.length, 1);
    assert.equal(technical[0], "Classe B · Doppio terrazzo · Vista Monte Rosa · Due autorimesse");
  });

  test("nessuna perdita di contenuto: ogni parola dell'originale sopravvive", () => {
    const wordsOf = (s: string) => (s.toLowerCase().match(/\p{L}{3,}/gu) ?? []).sort();
    const original = wordsOf(T447_FRAGMENT.replace(/<br\/>/g, " "));
    const result = wordsOf(paragraphs.join(" "));
    assert.deepEqual(result, original);
  });
});

describe("normalizeDescription — break in tutte le varianti", () => {
  test("break reali: <br>, <br/>, <br />, maiuscolo, con spazi interni", () => {
    const { paragraphs } = normalizeDescription("Uno<br>Due<br/>Tre<br />Quattro<BR   />Cinque");
    assert.deepEqual(paragraphs, ["Uno", "Due", "Tre", "Quattro", "Cinque"]);
  });

  test("break escaped (&lt;br/&gt;) trattati come break veri", () => {
    const { paragraphs } = normalizeDescription("Primo paragrafo.&lt;br/&gt;Secondo paragrafo.");
    assert.deepEqual(paragraphs, ["Primo paragrafo.", "Secondo paragrafo."]);
  });

  test("break doppiamente escaped (&amp;lt;br/&amp;gt;)", () => {
    const { paragraphs } = normalizeDescription("Primo.&amp;lt;br/&amp;gt;Secondo.");
    assert.deepEqual(paragraphs, ["Primo.", "Secondo."]);
    assertClean(paragraphs, "double-escape");
  });

  test("due break consecutivi non producono un paragrafo vuoto", () => {
    const { paragraphs } = normalizeDescription("Prima riga.<br/><br/>Seconda riga.");
    assert.deepEqual(paragraphs, ["Prima riga.", "Seconda riga."]);
  });

  test("break in testa e in coda non lasciano paragrafi vuoti né residui", () => {
    const { paragraphs } = normalizeDescription("<br/>Solo questa riga.<br/>");
    assert.deepEqual(paragraphs, ["Solo questa riga."]);
  });
});

describe("normalizeDescription — HTML misto e markup pericoloso", () => {
  test("HTML misto: paragrafi, grassetti, liste", () => {
    const { paragraphs } = normalizeDescription(
      "<p>Villa con <b>giardino</b> privato.</p><ul><li>Taverna</li><li>Doppio box</li></ul>",
    );
    assert.deepEqual(paragraphs, ["Villa con giardino privato.", "Taverna", "Doppio box"]);
  });

  test("script: il contenuto sparisce, il testo legittimo resta", () => {
    const { paragraphs } = normalizeDescription(
      "Attico luminoso.<script>alert('xss')</script><br/>Con terrazzo.",
    );
    assert.deepEqual(paragraphs, ["Attico luminoso.", "Con terrazzo."]);
    assert.ok(!paragraphs.join(" ").includes("alert"));
  });

  test("script escaped: nessun tag e nessun payload sopravvive", () => {
    const { paragraphs } = normalizeDescription(
      "Trilocale.&lt;script&gt;fetch('//evil')&lt;/script&gt;<br/>Secondo piano.",
    );
    assertClean(paragraphs, "script-escaped");
    assert.ok(!paragraphs.join(" ").includes("fetch"));
    assert.deepEqual(paragraphs, ["Trilocale.", "Secondo piano."]);
  });

  test("tag troncato dal feed malformato non resta a schermo", () => {
    const { paragraphs } = normalizeDescription("Bilocale ristrutturato.<br/>Ampio balcone.<div");
    assert.deepEqual(paragraphs, ["Bilocale ristrutturato.", "Ampio balcone."]);
  });

  test("style e iframe spariscono col loro contenuto", () => {
    const { paragraphs } = normalizeDescription(
      "<style>.x{color:red}</style>Villa singola.<iframe src='//x'>fallback</iframe>",
    );
    assert.deepEqual(paragraphs, ["Villa singola."]);
  });
});

describe("normalizeDescription — entità, apostrofi e spazi", () => {
  test("entità comuni decodificate (&amp; &nbsp; &quot; &rsquo; &#39;)", () => {
    const { paragraphs } = normalizeDescription(
      "Cucina&nbsp;abitabile &amp; salone. &quot;Un&rsquo;occasione&quot; d&#39;altri tempi.",
    );
    assert.deepEqual(paragraphs, [`Cucina abitabile & salone. "Un’occasione" d'altri tempi.`]);
    assertClean(paragraphs, "entità");
  });

  test("apostrofi tipografici e accenti restano intatti", () => {
    const source = "L’immobile è in un’ottima posizione. Perché? Perché sì.";
    const { paragraphs } = normalizeDescription(source);
    assert.equal(paragraphs.join(" "), source);
  });

  test("spazi duplicati e CRLF normalizzati", () => {
    const { paragraphs } = normalizeDescription("Primo   paragrafo.\r\n\r\nSecondo  paragrafo.");
    assert.deepEqual(paragraphs, ["Primo paragrafo.", "Secondo paragrafo."]);
  });

  test("entità sconosciuta non viene inventata ma non lascia markup", () => {
    const { paragraphs } = normalizeDescription("Terreno &fantasia; edificabile.");
    assert.deepEqual(paragraphs, ["Terreno &fantasia; edificabile."]);
    assert.ok(!/<[a-z]/i.test(paragraphs[0]));
  });
});

describe("normalizeDescription — paragrafi", () => {
  test("paragrafi già ben formattati restano identici", () => {
    const source = [
      "Nel cuore di Tradate proponiamo un elegante attico duplex.",
      "Il soggiorno si apre sul grande terrazzo, raggiungibile anche dalla cucina abitabile.",
      "Completano la proprietà due autorimesse.",
    ];
    const { paragraphs } = normalizeDescription(source.join("\n"));
    assert.deepEqual(paragraphs, source);
  });

  test("NON raggruppa automaticamente le frasi a gruppi di tre", () => {
    const source = "Prima frase. Seconda frase. Terza frase. Quarta frase. Quinta frase.";
    const { paragraphs } = normalizeDescription(source);
    // Nessun separatore reale nel testo → un solo paragrafo, esattamente com'era.
    assert.deepEqual(paragraphs, [source]);
  });

  test("giuntura di paragrafo persa (punto+Maiuscola senza spazio) → nuovo paragrafo", () => {
    const { paragraphs } = normalizeDescription(
      "…così desiderabili.Con una superficie di 1355 mq, questo terreno è una tela bianca.",
    );
    assert.deepEqual(paragraphs, [
      "…così desiderabili.",
      "Con una superficie di 1355 mq, questo terreno è una tela bianca.",
    ]);
  });

  test("le sigle puntate non vengono spezzate", () => {
    // La giuntura "singola.N" è una vera interruzione; "N.B." invece è una sigla e resta intera.
    const { paragraphs } = normalizeDescription("Villa singola.N.B. le spese sono in verifica.");
    assert.deepEqual(paragraphs, ["Villa singola.", "N.B. le spese sono in verifica."]);
  });

  test("gli URL non vengono spezzati", () => {
    const { paragraphs } = normalizeDescription(
      "Tour virtuale: my.matterport.com/show/?m=zQkXTt3bKMq",
    );
    assert.deepEqual(paragraphs, ["Tour virtuale: my.matterport.com/show/?m=zQkXTt3bKMq"]);
  });

  test("frammento spezzato per errore viene riunito alla riga precedente", () => {
    const { paragraphs } = normalizeDescription("Il soggiorno si apre sul grande<br/>terrazzo.");
    assert.deepEqual(paragraphs, ["Il soggiorno si apre sul grande terrazzo."]);
  });

  test("una riga chiusa seguita da una minuscola NON viene riunita a forza", () => {
    const { paragraphs } = normalizeDescription("Prima riga completa.<br/>e poi si prosegue.");
    // La riga precedente è chiusa: il break dell'autore vince.
    assert.deepEqual(paragraphs, ["Prima riga completa.", "e poi si prosegue."]);
  });

  test("testo senza punteggiatura resta un unico paragrafo intatto", () => {
    const source = "Ampio locale commerciale con vetrine su strada zona di forte passaggio";
    assert.deepEqual(descriptionParagraphs(source), [source]);
  });
});

describe("normalizeDescription — boilerplate commerciale", () => {
  test("la coda commerciale viene rimossa, la descrizione resta", () => {
    const { paragraphs } = normalizeDescription(
      "Villa con giardino e taverna.<br/>Con Domus Tua è facile vendere ed è sicuro acquistare." +
        "<br/>Da oltre 20 anni al tuo fianco",
    );
    assert.deepEqual(paragraphs, ["Villa con giardino e taverna."]);
  });

  test("varianti reali della firma (maiuscolo, we love home, recensioni)", () => {
    const { paragraphs } = normalizeDescription(
      "Trilocale ristrutturato con box.<br/>DOMUS TUA… WE LOVE HOME… WE LOVE LIFE!!!",
    );
    assert.deepEqual(paragraphs, ["Trilocale ristrutturato con box."]);
  });

  test("firma incollata alla fine della frase: si taglia solo la firma", () => {
    const { paragraphs } = normalizeDescription(
      "Un appartamento luminoso e ben tenuto. Contattaci per venire a vederlo perché con " +
        "Domus Tua è FACILE VENDERE ed è SICURO ACQUISTARE. Ti aspetto!",
    );
    assert.equal(paragraphs.length, 1);
    assert.ok(paragraphs[0].startsWith("Un appartamento luminoso e ben tenuto."));
    assert.ok(!/domus tua/i.test(paragraphs[0]));
    assert.ok(!/ti aspetto/i.test(paragraphs[0]));
  });

  test("guardia anti-perdita: un match anomalo a inizio testo non cancella l'annuncio", () => {
    const body = ` ${"Ampio soggiorno con vetrata sul giardino privato. ".repeat(30)}`;
    const { paragraphs } = normalizeDescription(`Con Domus Tua è facile vendere.${body}`);
    // Il taglio porterebbe via oltre il 30% del testo → non è una coda: si conserva tutto.
    assert.ok(paragraphs.join(" ").includes("Ampio soggiorno con vetrata sul giardino privato."));
    assert.ok(paragraphs.join(" ").length > 1000);
  });
});

describe("normalizeDescription — casi limite", () => {
  test("descrizione vuota / assente / solo markup", () => {
    for (const input of ["", "   ", "\n\n", undefined, null, "<br/><br/>", "<p></p>"]) {
      const result = normalizeDescription(input as string | null | undefined);
      assert.deepEqual(result.paragraphs, []);
      assert.equal(result.excerpt, "");
      assert.equal(result.plainText, "");
    }
  });

  test("è una funzione pura: due chiamate danno lo stesso risultato", () => {
    const a = normalizeDescription(T447_FRAGMENT);
    const b = normalizeDescription(T447_FRAGMENT);
    assert.deepEqual(a, b);
  });

  test("normalizzare due volte è idempotente sul testo già pulito", () => {
    const once = normalizeDescription(T447_FRAGMENT);
    const twice = normalizeDescription(once.plainText);
    assert.deepEqual(twice.paragraphs, once.paragraphs);
  });
});

describe("descriptionExcerpt — estratto pulito quanto i paragrafi", () => {
  test("frasi intere, nessun tag, nessuna entità", () => {
    const excerpt = descriptionExcerpt(T447_FRAGMENT);
    assert.ok(excerpt.length > 0);
    assert.ok(!/<br|&amp;|&nbsp;/i.test(excerpt));
    assert.ok(excerpt.startsWith("Ci sono case che salgono di prezzo."));
  });

  test("prima frase molto lunga: taglio su spazio con ellissi", () => {
    const long = `${"parola ".repeat(60)}fine.`;
    const excerpt = descriptionExcerpt(long);
    assert.ok(excerpt.endsWith("…"));
    assert.ok(excerpt.length <= 171);
    assert.ok(!excerpt.includes("parol…"));
  });

  test("estratto vuoto se la descrizione è solo boilerplate", () => {
    assert.equal(descriptionExcerpt("Con Domus Tua è facile vendere ed è sicuro acquistare."), "");
  });
});
