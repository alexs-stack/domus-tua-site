// Taratura della soglia del retrieval semantico sulla knowledge base.
//
//   npm run calibrate:semantic     → richiede VOYAGE_API_KEY
//
// Perché esiste: `ASSISTANT_SEMANTIC_FLOOR` è nato come 0,6 scelto a occhio, e quel numero
// decide se una domanda fuori corpus riceve una fonte — cioè se l'assistente risponde a
// fianco della domanda con la sicurezza di chi una fonte ce l'ha. Un valore mai misurato
// su questo corpus è una scommessa; questo script la trasforma in una misura.
//
// Cosa fa: calcola gli embedding del corpus verificato e delle domande di
// app/lib/assistant/__evals__/semanticCases.ts, poi guarda le due distribuzioni.
//
//  • Per ogni caso DEVE_AGGANCIARE: la similarità con la voce attesa (deve stare SOPRA).
//  • Per ogni caso DEVE_TACERE: la similarità con la voce più vicina, qualunque sia
//    (deve stare SOTTO — è il rumore di fondo che la soglia deve tagliare).
//
// La soglia giusta sta nella forbice fra le due. Se non c'è forbice, lo script lo dice: il
// livello semantico su questo corpus non separa, e tenerlo alto (o spento) è la scelta
// onesta. Non scrive nulla in automatico: propone un valore e lo motiva, la decisione resta
// di chi legge.

// PRIMO import: valorizza process.env da .env.local prima che i moduli di config lo leggano.
import "./load-env";
import { DEVE_AGGANCIARE, DEVE_TACERE } from "../app/lib/assistant/__evals__/semanticCases";
import { verifiedEntries } from "../app/lib/assistant/knowledge/entries";
import { entryText, SEMANTIC_FLOOR } from "../app/lib/assistant/knowledge/semantic";
import { cosine, embed } from "../app/lib/ai/embeddings";
import { EMBEDDINGS_MODEL, EMBEDDINGS_PROVIDER, semanticEnabled } from "../app/lib/ai/config";

function fmt(n: number): string {
  return n.toFixed(3);
}

/**
 * Quanto il punteggio migliore SVETTA sul resto del corpus, in deviazioni standard.
 *
 * È la seconda ipotesi, e vale la pena provarla prima di dichiarare inutile il semantico.
 * La soglia assoluta chiede "quanto somiglia?", che su un corpus tutto sullo stesso tema
 * discrimina male: una domanda su una casa somiglia un po' a tutto. Questa chiede una cosa
 * diversa — "somiglia a UNA voce più che alle altre?" — e l'intuizione è che una domanda
 * fuori corpus sia genericamente tiepida con tutte, mentre una pertinente abbia un picco.
 *
 * Se anche questa non separa, il problema non è la taratura: è che gli embeddings su questo
 * corpus non portano il segnale che cerchiamo.
 */
function zScore(punteggi: number[], valore: number): number {
  const media = punteggi.reduce((a, b) => a + b, 0) / punteggi.length;
  const varianza = punteggi.reduce((a, b) => a + (b - media) ** 2, 0) / punteggi.length;
  const sigma = Math.sqrt(varianza);
  return sigma === 0 ? 0 : (valore - media) / sigma;
}

/** Margine di sicurezza sotto la peggiore delle domande che devono agganciare. */
const MARGINE = 0.02;

async function main() {
  if (!semanticEnabled) {
    console.error(
      "Nessun provider di embeddings: serve VOYAGE_API_KEY, oppure GEMINI_API_KEY con\n" +
        "AI_PROVIDER=google. Senza, non c'è niente da misurare — e il retrieval resta\n" +
        "lessicale e continua a funzionare. Vedi docs/assistant-knowledge.md.",
    );
    process.exit(1);
  }

  const entries = verifiedEntries();
  console.log(
    `Corpus verificato: ${entries.length} voci. ` +
      `Embeddings: ${EMBEDDINGS_MODEL} (${EMBEDDINGS_PROVIDER}).\n`,
  );

  const vettoriVoci = await embed(entries.map(entryText), "document");
  if (!vettoriVoci) {
    console.error("Embedding del corpus fallito (chiave rifiutata, rete, o timeout).");
    process.exit(1);
  }

  const domande = [...DEVE_AGGANCIARE.map((c) => c.q), ...DEVE_TACERE];
  const vettoriDomande = await embed(domande, "query");
  if (!vettoriDomande) {
    console.error("Embedding delle domande fallito.");
    process.exit(1);
  }

  /** Similarità di una domanda con ogni voce, ordinate dalla più vicina. */
  const punteggi = (i: number) =>
    entries
      .map((entry, j) => ({ id: entry.id, score: cosine(vettoriDomande[i], vettoriVoci[j]) }))
      .sort((a, b) => b.score - a.score);

  console.log("DEVE AGGANCIARE — similarità con la voce attesa (e quanto svetta, in σ)\n");
  const attese: number[] = [];
  const atteseZ: number[] = [];
  DEVE_AGGANCIARE.forEach((caso, i) => {
    const ordinate = punteggi(i);
    const tutte = ordinate.map((r) => r.score);
    const attesa = ordinate.find((r) => r.id === caso.id);
    const primo = ordinate[0];
    const score = attesa?.score ?? 0;
    attese.push(score);
    atteseZ.push(zScore(tutte, score));
    const posizione = ordinate.findIndex((r) => r.id === caso.id) + 1;
    const nota = primo.id === caso.id ? "" : `  (prima esce ${primo.id} a ${fmt(primo.score)})`;
    console.log(`  ${fmt(score)}  z=${fmt(zScore(tutte, score))}  #${posizione}  ${caso.id}${nota}`);
    console.log(`         "${caso.q}"`);
  });

  console.log("\nDEVE TACERE — similarità con la voce più vicina, qualunque sia\n");
  const rumore: number[] = [];
  const rumoreZ: number[] = [];
  DEVE_TACERE.forEach((q, k) => {
    const ordinate = punteggi(DEVE_AGGANCIARE.length + k);
    const primo = ordinate[0];
    rumore.push(primo.score);
    rumoreZ.push(zScore(ordinate.map((r) => r.score), primo.score));
    console.log(`  ${fmt(primo.score)}  z=${fmt(rumoreZ[k])}  ${primo.id}`);
    console.log(`         "${q}"`);
  });

  const peggioreAggancio = Math.min(...attese);
  const massimoRumore = Math.max(...rumore);

  console.log("\n─────────────────────────────────────────────────────────────");
  console.log(`  domanda pertinente più debole   ${fmt(peggioreAggancio)}`);
  console.log(`  domanda fuori corpus più vicina ${fmt(massimoRumore)}`);
  console.log(
    `  soglia attuale                  ${
      SEMANTIC_FLOOR === null ? "non impostata (livello semantico SPENTO)" : fmt(SEMANTIC_FLOOR)
    }`,
  );
  console.log("─────────────────────────────────────────────────────────────");

  // Seconda ipotesi: la soglia relativa. Vedi `zScore`.
  const peggioreZ = Math.min(...atteseZ);
  const massimoRumoreZ = Math.max(...rumoreZ);
  console.log("  ── e se invece di 'quanto somiglia' chiedessimo 'quanto svetta'? ──");
  console.log(`  z della pertinente più debole   ${fmt(peggioreZ)}`);
  console.log(`  z della fuori corpus più netta  ${fmt(massimoRumoreZ)}`);
  console.log(
    `  ${
      massimoRumoreZ < peggioreZ
        ? `SEPARA: una regola su z fra ${fmt(massimoRumoreZ)} e ${fmt(peggioreZ)} dividerebbe i due gruppi`
        : "NON separa nemmeno lei"
    }`,
  );
  console.log("─────────────────────────────────────────────────────────────\n");

  if (massimoRumore >= peggioreAggancio) {
    console.log(
      "NESSUNA FORBICE: una domanda fuori corpus assomiglia al corpus quanto una\n" +
        "pertinente. Nessuna soglia separa i due gruppi. Su questo corpus il livello\n" +
        "semantico non aggiunge segnale affidabile: lascia ASSISTANT_SEMANTIC_FLOOR non\n" +
        "impostata (è così che resta spento) e affidati al lessicale, che è deterministico.\n\n" +
        "Prima di concludere, però, guarda i casi qui sopra: se a sbagliare è UNA domanda\n" +
        "sola, spesso il problema è quella — non il metodo.",
    );
    if (SEMANTIC_FLOOR !== null && SEMANTIC_FLOOR <= massimoRumore) {
      console.log(
        `\n⚠️  Eppure una soglia è impostata (${fmt(SEMANTIC_FLOOR)}), sotto il rumore ` +
          `misurato (${fmt(massimoRumore)}).\n    Così com'è, domande fuori corpus ricevono ` +
          "fonti: toglila dall'ambiente.",
      );
    }
    return;
  }

  const proposta = Math.max(massimoRumore + MARGINE, Number((peggioreAggancio - MARGINE).toFixed(3)));
  console.log(
    `Forbice utile: ${fmt(massimoRumore)} → ${fmt(peggioreAggancio)}.\n` +
      `Soglia proposta: ASSISTANT_SEMANTIC_FLOOR=${fmt(proposta)}\n\n` +
      "Sta appena sopra il rumore, non a metà strada: dentro la forbice si sta più sicuri\n" +
      "vicino al bordo che costa un \"non lo so\" che vicino a quello che costa una risposta\n" +
      "sbagliata. Rilancia dopo ogni cambio importante al corpus: la forbice si sposta.",
  );

  if (SEMANTIC_FLOOR !== null && SEMANTIC_FLOOR < massimoRumore) {
    console.log(
      `\n⚠️  La soglia attuale (${fmt(SEMANTIC_FLOOR)}) è SOTTO il rumore misurato ` +
        `(${fmt(massimoRumore)}):\n    così com'è, domande fuori corpus ricevono fonti. Alzala.`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
