// STRATO 2 del cancello: il GIUDICE DI QUALITÀ, e la decisione di pubblicazione.
//
// Lo strato 1 (./narrativeGuard.ts) risponde a «ogni frase è agganciata a evidenza approvata?».
// Questo strato risponde alla domanda che nessuna regola sa porre: «questo testo è UTILE, o è
// una sequenza di fatti veri messi in fila che potrebbe descrivere qualunque paese?».
//
// TRE PROPRIETÀ, tutte volute.
//
// 1. IL GIUDICE NON RIPARA. Restituisce un verdetto e istruzioni di revisione, mai testo
//    corretto. Un giudice che aggiusta la bozza per farla passare è il generatore che si dà un
//    voto da solo — cioè nessun controllo.
//
// 2. IL GIUDICE NON PUÒ SALVARE. Il cancello somma i due strati: un fallimento deterministico
//    resta un fallimento anche con 100/100. Il punteggio serve a bocciare, non ad assolvere.
//
// 3. IL PROVIDER È INIETTABILE. In test si usa un giudice deterministico; in produzione un
//    modello. Le regole del cancello non cambiano fra i due — cambia solo chi assegna i punti.

import type { AreaFact, AreaNarrative } from "../types";
import { validateNarrative, type NarrativeFailure } from "./narrativeGuard";

// ─────────────────────────────────────────────────────────────
// Punteggio
// ─────────────────────────────────────────────────────────────

/** I nove criteri e il loro peso. Somma: 100. */
export const JUDGE_CRITERIA = {
  accuracyAndProvenance: 25,
  usefulness: 20,
  structure: 15,
  geographicSpecificity: 10,
  toneAndReadability: 10,
  nonDuplication: 5,
  accessibility: 5,
  localRelevance: 5,
  freshnessAndOperability: 5,
} as const;

export type JudgeCriterion = keyof typeof JUDGE_CRITERIA;

export const MAX_SCORE = Object.values(JUDGE_CRITERIA).reduce((a, b) => a + b, 0);

/**
 * Soglia di pubblicazione: 95 su 100.
 *
 * È alta di proposito, e la ragione non è il perfezionismo. Il testo esce su ogni scheda del
 * comune: un difetto qui si moltiplica per il numero di immobili, e nessun lettore lo attribuirà
 * al generatore — lo attribuirà all'agenzia.
 */
export const PUBLICATION_THRESHOLD = 95;

/** Sotto questa soglia non vale la pena nemmeno rivedere: si rigenera. */
export const REJECT_THRESHOLD = 75;

export interface JudgeVerdict {
  pass: boolean;
  score: number;
  criterionScores: Record<JudgeCriterion, number>;
  /** Violazioni gravi: una sola basta a bocciare, qualunque sia il punteggio. */
  hardFailures: string[];
  unsupportedClaims: string[];
  weakClaims: string[];
  styleProblems: string[];
  geographicProblems: string[];
  /** Cosa cambiare. MAI il testo corretto: quello lo riscrive il generatore. */
  revisionInstructions: string[];
}

export interface JudgeInput {
  narrative: AreaNarrative;
  approvedFacts: readonly AreaFact[];
  now: Date;
}

/** Un giudice: sincrono o asincrono, deterministico o modello. */
export type AreaJudge = (input: JudgeInput) => Promise<JudgeVerdict>;

// ─────────────────────────────────────────────────────────────
// Il cancello
// ─────────────────────────────────────────────────────────────

export type PublicationDecision = "publish-eligible" | "manual-review" | "reject";

export interface GateResult {
  decision: PublicationDecision;
  /** Fallimenti deterministici dello strato 1. */
  deterministicFailures: NarrativeFailure[];
  verdict: JudgeVerdict | null;
  /** In italiano, per la coda editoriale: perché è finita così. */
  reasons: string[];
}

export interface GateInput extends JudgeInput {
  promptVersion: string;
  judge: AreaJudge;
}

/**
 * Il cancello completo: strato deterministico, poi giudice, poi decisione.
 *
 * L'ordine fa risparmiare: una bozza che sbaglia i riferimenti ai fatti non arriva mai a costare
 * una chiamata al modello. Ma soprattutto rende impossibile il caso peggiore — un testo con
 * un'affermazione non sostenuta che passa perché il giudice l'ha trovato ben scritto.
 *
 * `publish-eligible` NON è "pubblicato": è "non ci sono ostacoli automatici". La pubblicazione
 * resta un atto umano con nome, data e motivazione (vedi AreaReviewEvent).
 */
export async function runPublicationGate(input: GateInput): Promise<GateResult> {
  const { failures } = validateNarrative({
    narrative: input.narrative,
    approvedFacts: input.approvedFacts,
    now: input.now,
    promptVersion: input.promptVersion,
  });

  if (failures.length > 0) {
    // Si esce PRIMA del giudice: nessuna chiamata, nessun costo, e nessuna possibilità che un
    // punteggio alto copra un'affermazione non agganciata.
    return {
      decision: "reject",
      deterministicFailures: failures,
      verdict: null,
      reasons: failures.map((x) => `${x.code}: ${x.message}`),
    };
  }

  const verdict = await input.judge({
    narrative: input.narrative,
    approvedFacts: input.approvedFacts,
    now: input.now,
  });

  const reasons: string[] = [];
  if (verdict.hardFailures.length > 0) {
    reasons.push(...verdict.hardFailures.map((x) => `violazione grave: ${x}`));
    return { decision: "reject", deterministicFailures: [], verdict, reasons };
  }
  if (verdict.score < REJECT_THRESHOLD) {
    reasons.push(`punteggio ${verdict.score}/${MAX_SCORE}: sotto ${REJECT_THRESHOLD}, si rigenera.`);
    return { decision: "reject", deterministicFailures: [], verdict, reasons };
  }
  if (verdict.score < PUBLICATION_THRESHOLD) {
    reasons.push(
      `punteggio ${verdict.score}/${MAX_SCORE}: sotto ${PUBLICATION_THRESHOLD}, serve una revisione umana.`,
    );
    return { decision: "manual-review", deterministicFailures: [], verdict, reasons };
  }

  reasons.push(`punteggio ${verdict.score}/${MAX_SCORE}, nessuna violazione: idoneo alla pubblicazione.`);
  return { decision: "publish-eligible", deterministicFailures: [], verdict, reasons };
}

// ─────────────────────────────────────────────────────────────
// Giudice deterministico (test, dry-run, e rete di sicurezza)
// ─────────────────────────────────────────────────────────────

/** Parole distintive di un testo, per misurarne la genericità. */
function distinctiveTokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 4),
  );
}

/**
 * Un giudice DETERMINISTICO: nessuna rete, nessun modello, esito riproducibile.
 *
 * Serve a tre cose: far girare i test senza provider, permettere il dry-run dei CLI, e restare
 * disponibile come rete di sicurezza quando il fornitore AI è giù — perché la regola del
 * progetto è che una pagina pubblica non dipenda da un modello raggiungibile.
 *
 * Non pretende di valutare la prosa: valuta ciò che si può contare. Il criterio interessante è
 * `usefulness`, che penalizza un testo che non nomina NULLA di specifico — la modalità di
 * fallimento più subdola del dominio, perché produce testi corretti in ogni singola frase e
 * validi per qualunque paese d'Italia.
 */
export const deterministicJudge: AreaJudge = async ({ narrative, approvedFacts }) => {
  const scores: Record<JudgeCriterion, number> = { ...JUDGE_CRITERIA };
  const weak: string[] = [];
  const style: string[] = [];
  const instructions: string[] = [];

  // Provenienza: quota di fatti approvati effettivamente usati.
  const used = new Set(narrative.sections.flatMap((s) => s.factIds));
  const coverage = approvedFacts.length === 0 ? 0 : used.size / approvedFacts.length;
  if (coverage < 0.5) {
    scores.accuracyAndProvenance -= 5;
    weak.push(`solo ${used.size} fatti su ${approvedFacts.length} sono citati`);
    instructions.push("Coprire più fatti approvati, o spiegare perché quelli esclusi non servono.");
  }

  // Utilità: il testo nomina qualcosa di specifico?
  const prose = [narrative.intro, ...narrative.sections.map((s) => s.body)].join(" ");
  const specific = [...distinctiveTokens(prose)].filter((t) =>
    approvedFacts.some((f) => distinctiveTokens(f.text).has(t)),
  );
  if (specific.length < 4) {
    scores.usefulness -= 10;
    weak.push("il testo non nomina abbastanza elementi specifici dell'area");
    instructions.push(
      "Nominare i servizi e i collegamenti con il loro nome: un testo che vale per qualunque paese non serve a nessuno.",
    );
  }

  // Struttura: due sezioni sono il minimo, ma un testo con due sezioni è più povero.
  if (narrative.sections.length < 3) {
    scores.structure -= 3;
    style.push("poche sezioni: la scheda risulta più scarna delle altre del comune");
  }

  // Specificità geografica: il titolo nomina l'area?
  const label = narrative.areaKey.split("|").filter(Boolean).pop() ?? "";
  const titleNamesArea = label
    .split("-")
    .every((piece) => narrative.title.toLowerCase().includes(piece));
  if (!titleNamesArea) {
    scores.geographicSpecificity -= 5;
    style.push("il titolo non nomina l'area");
    instructions.push('Il titolo deve essere "Vivere a {Comune}" o "Vivere in {Quartiere}".');
  }

  // Leggibilità: frasi lunghissime.
  const longSentences = prose.split(/(?<=[.!?])\s+/).filter((s) => s.split(/\s+/).length > 40);
  if (longSentences.length > 0) {
    scores.toneAndReadability -= 3;
    style.push(`${longSentences.length} frase/i oltre le 40 parole`);
  }

  const score = Object.values(scores).reduce((a, b) => a + b, 0);
  return {
    // Nessuna violazione grave: quelle le trova lo strato deterministico, che gira prima.
    pass: score >= PUBLICATION_THRESHOLD,
    score,
    criterionScores: scores,
    hardFailures: [],
    unsupportedClaims: [],
    weakClaims: weak,
    styleProblems: style,
    geographicProblems: [],
    revisionInstructions: instructions,
  };
};
