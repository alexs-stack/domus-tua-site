// Il GENERATORE di narrative d'area (Prompt 7).
//
// ⚠️ È UN GENERATORE SEPARATO da quello delle schede immobile. Il writer di
// app/lib/realsmart/ai/generate.ts ha il divieto esplicito di parlare di zona, servizi,
// trasporti e distanze, e quel divieto NON va indebolito: è ciò che tiene le affermazioni
// territoriali fuori da un testo che non ha le fonti per sostenerle. Questo è l'altro
// generatore, quello che le fonti ce le ha — e che infatti non può scrivere nulla che non sia
// agganciato a un factId.
//
// COSA GARANTISCE QUESTO MODULO, indipendentemente dal modello dietro:
//   • l'input fattuale è SOLO il fact pack (fatti già approvati). Nessuna conoscenza generale;
//   • l'output nasce sempre `draft`. Non esiste un percorso che produca `approved`;
//   • l'impronta dei fatti viene calcolata QUI, non dichiarata dal modello: un testo non può
//     mentire su quale evidenza lo sostiene;
//   • se il modello restituisce qualcosa di non conforme, si SCARTA. Non si aggiusta.

import { AREA_PROMPT_VERSION, AreaNarrativeSchema } from "../types";
import type { AreaFact, AreaNarrative, KnowledgeLocale } from "../types";
import { areaFactsHash } from "../hash";
import { AREA_CATEGORY_ORDER } from "../categories";
import { AREA_CATEGORY_LABEL_IT } from "../categories";
import { buildFactPack, AREA_WRITER_SYSTEM } from "./prompts";
import { parseAreaKey } from "../identity";

/** Ciò che il modello deve restituire: la narrativa SENZA i campi che assegna il sistema. */
export type WriterOutput = Pick<
  AreaNarrative,
  "areaKey" | "locale" | "title" | "intro" | "sections" | "claimMap" | "sourceIdsUsed"
>;

export interface WriterInput {
  areaKey: string;
  /** Etichetta pubblica dell'area: entra nel titolo, non nella chiave. */
  label: string;
  locale: KnowledgeLocale;
  /** SOLO fatti già approvati e freschi. Chi chiama ha già filtrato. */
  facts: readonly AreaFact[];
  /** La narrativa approvata precedente, se esiste: aiuta a non stravolgere ciò che funziona. */
  previous?: AreaNarrative | null;
}

/** Un generatore: modello reale o deterministico. Ritorna l'output grezzo, non il record. */
export type AreaWriter = (input: WriterInput, prompt: { system: string; user: string }) => Promise<unknown>;

export type GenerationOutcome =
  | { ok: true; narrative: AreaNarrative }
  | { ok: false; reason: string; raw?: unknown };

/** Il messaggio utente: fact pack, area, lingua. Niente altro — nessun URL, nessuno stato. */
export function buildWriterUserPrompt(input: WriterInput): string {
  return [
    `AREA: ${input.label}`,
    `areaKey: ${input.areaKey}`,
    `locale: ${input.locale}`,
    "",
    "FATTI APPROVATI (l'unica fonte ammessa):",
    buildFactPack(input.facts),
    input.previous
      ? `\nVERSIONE PRECEDENTE APPROVATA (da migliorare, non da stravolgere):\n${JSON.stringify(
          { title: input.previous.title, intro: input.previous.intro, sections: input.previous.sections },
          null,
          2,
        )}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Genera una BOZZA di narrativa.
 *
 * `promptVersion` e `factsHash` li mette il sistema, non il modello: se li dichiarasse il
 * modello, un testo potrebbe affermare di nascere da fatti che non ha mai visto — e sarebbe
 * proprio l'impronta, cioè il meccanismo che dovrebbe scoprirlo, a essere falsificata.
 */
export async function generateNarrative(
  input: WriterInput,
  writer: AreaWriter,
  options: { now: Date; modelId?: string; promptVersion?: string } = { now: new Date() },
): Promise<GenerationOutcome> {
  if (input.facts.length === 0) {
    // Nessun fatto = nessun testo. È un esito corretto, non un errore: un'area senza evidenza
    // approvata non deve avere una descrizione, deve non avere la sezione.
    return { ok: false, reason: "nessun fatto approvato: non c'è nulla da raccontare" };
  }

  const promptVersion = options.promptVersion ?? AREA_PROMPT_VERSION;
  const raw = await writer(input, {
    system: AREA_WRITER_SYSTEM,
    user: buildWriterUserPrompt(input),
  });

  // ELENCO CHIUSO dei campi che il modello può fornire.
  //
  // Non è una spread con qualche sovrascrittura: è una selezione. La differenza l'ha trovata un
  // test — con la spread, un modello che restituiva `approvedBy: "sé stesso"` vedeva sì lo
  // `status` riportato a "draft", ma la traccia di approvazione inventata SOPRAVVIVEVA nel
  // record. Sarebbe rimasta lì, pronta a essere letta come una firma vera al primo passaggio
  // di stato. Ciò che il modello non può fornire non deve poter arrivare per inerzia.
  const output = (raw ?? {}) as Partial<WriterOutput>;
  const candidate = {
    areaKey: output.areaKey,
    locale: output.locale,
    title: output.title,
    intro: output.intro,
    sections: output.sections,
    claimMap: output.claimMap,
    sourceIdsUsed: output.sourceIdsUsed,
    // Da qui in giù decide il sistema, e nient'altro.
    factsHash: areaFactsHash(input.facts, { locale: input.locale, promptVersion }),
    promptVersion,
    ...(options.modelId ? { modelId: options.modelId } : {}),
    generatedAt: options.now.toISOString(),
    // Nessun percorso produce `approved`: è scritto qui, una volta, e non è parametrizzabile.
    // `approvedBy` e `approvedAt` semplicemente non esistono in questo oggetto.
    status: "draft" as const,
  };

  const parsed = AreaNarrativeSchema.safeParse(candidate);
  if (!parsed.success) {
    return { ok: false, reason: `output non conforme: ${parsed.error.issues[0]?.message ?? "?"}`, raw };
  }
  if (parsed.data.areaKey !== input.areaKey) {
    // Il modello ha scritto di un'altra area: scartare, non correggere. Se ha sbagliato area
    // potrebbe aver usato fatti di quell'area.
    return { ok: false, reason: `il testo dichiara l'area ${parsed.data.areaKey}, attesa ${input.areaKey}`, raw };
  }
  return { ok: true, narrative: parsed.data };
}

/**
 * Un generatore DETERMINISTICO: nessuna rete, nessun modello, esito riproducibile.
 *
 * Serve ai test e al dry-run dei CLI, e a rispondere alla domanda «quanti testi produrrebbe
 * questa area?» senza spendere un token. Non pretende di scrivere bene: compone i fatti nelle
 * loro sezioni, con l'ordine e le etichette canoniche.
 *
 * Nota su cosa NON fa: non inventa collegamenti fra i fatti, non aggiunge aggettivi, non riempie
 * le categorie mancanti. Un testo prodotto da qui passa lo strato deterministico ma di norma
 * NON supera il giudice — ed è giusto così: è una struttura, non una descrizione.
 */
export const deterministicWriter: AreaWriter = async (input) => {
  const byCategory = new Map<string, AreaFact[]>();
  for (const fact of input.facts) {
    byCategory.set(fact.category, [...(byCategory.get(fact.category) ?? []), fact]);
  }

  const sections = AREA_CATEGORY_ORDER.filter((c) => byCategory.has(c)).map((category) => {
    const facts = byCategory.get(category)!;
    return {
      category,
      heading: AREA_CATEGORY_LABEL_IT[category],
      // Si riprende il testo del fatto senza riscriverlo: un generatore deterministico che
      // "parafrasa" produrrebbe parafrasi meccaniche, che è peggio del testo originale.
      body: facts.map((f) => f.text).join(" "),
      factIds: facts.map((f) => f.id),
    };
  });

  const parts = parseAreaKey(input.areaKey);
  const title = parts.neighbourhood ? `Vivere in ${input.label}` : `Vivere a ${input.label}`;

  return {
    areaKey: input.areaKey,
    locale: input.locale,
    title,
    intro: input.facts.map((f) => f.text).join(" "),
    sections,
    claimMap: input.facts.map((f) => ({ claim: f.text, factIds: [f.id] })),
    sourceIdsUsed: [...new Set(input.facts.map((f) => f.source.url))],
  } satisfies WriterOutput;
};
