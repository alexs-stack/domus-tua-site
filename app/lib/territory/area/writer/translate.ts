// TRADUZIONE delle narrative d'area (Prompt 12).
//
// L'italiano è la copia CANONICA. Si traduce solo ciò che è già stato approvato in italiano, e
// il risultato resta una BOZZA: una traduzione automatica di un testo approvato non eredita
// l'approvazione, perché l'approvazione riguardava parole diverse.
//
// IL RISCHIO SPECIFICO DI QUESTO PASSAGGIO, e perché serve un guard suo. Un traduttore è
// addestrato a produrre testo scorrevole nella lingua d'arrivo, e "scorrevole" in prosa
// immobiliare significa aggiungere: un aggettivo che in italiano non c'era, un "conveniently
// located" che nessuna fonte sostiene, una distanza arrotondata "per chiarezza". Ogni aggiunta
// passerebbe i controlli sul testo italiano — che è ancora corretto — e uscirebbe in una lingua
// che nessuno in agenzia rilegge.
//
// Da qui il principio: la traduzione può cambiare SOLO le parole. Struttura, factId, claimMap,
// sourceId, numeri e nomi propri devono tornare identici, byte per byte. Ciò che non torna
// identico è un errore del traduttore, non una sfumatura.

import { AreaNarrativeSchema } from "../types";
import type { AreaNarrative, KnowledgeLocale } from "../types";
import { numbersIn } from "../factGuard";
import { AREA_TRANSLATION_SYSTEM } from "./prompts";

export type TranslationFailureCode =
  | "schema-invalid"
  | "not-approved-source"
  | "same-locale"
  | "area-key-changed"
  | "structure-changed"
  | "fact-ids-changed"
  | "claim-map-changed"
  | "source-ids-changed"
  | "facts-hash-changed"
  | "numbers-changed"
  | "proper-names-changed"
  | "claims-status-approved"
  | "untranslated";

export interface TranslationFailure {
  code: TranslationFailureCode;
  message: string;
  evidence?: string;
}

export interface TranslationInput {
  /** La narrativa canonica italiana, GIÀ approvata. */
  source: AreaNarrative;
  target: KnowledgeLocale;
}

export type TranslationOutcome =
  | { ok: true; narrative: AreaNarrative }
  | { ok: false; failures: TranslationFailure[] };

/** Un traduttore: modello reale o deterministico. Riceve la narrativa e la lingua d'arrivo. */
export type AreaTranslator = (
  input: TranslationInput,
  prompt: { system: string; user: string },
) => Promise<unknown>;

/** Ciò che il traduttore può cambiare: le PAROLE, e nient'altro. */
type TranslatableFields = Pick<AreaNarrative, "title" | "intro"> & {
  sections: { heading: string; body: string }[];
  claimMap: { claim: string }[];
};

function push(list: TranslationFailure[], code: TranslationFailureCode, message: string, evidence?: string): void {
  list.push(evidence === undefined ? { code, message } : { code, message, evidence });
}

/**
 * Le frasi di un testo, contando come inizio di frase anche l'inizio di ogni RIGA.
 *
 * Serve perché titoli, intestazioni e corpi vengono uniti con "\n" prima dell'analisi, e la
 * prima parola di ciascuno è a tutti gli effetti un'apertura: la sua maiuscola non dice niente.
 * Un solo `split` con lookbehind non bastava — pretendeva uno spazio DOPO il ritorno a capo, che
 * in un testo unito con "\n" non c'è mai. Effetto: «Dalla stazione…» a inizio corpo veniva
 * classificato come nome proprio.
 */
function sentences(text: string): string[] {
  return text
    .split(/\n+/)
    .flatMap((line) => line.split(/(?<=[.!?:])\s+/))
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * I NOMI PROPRI che devono sopravvivere alla traduzione.
 *
 * "Stazione di Tradate" non diventa "Tradate Station", e la linea "S40" non diventa "line 40":
 * sono denominazioni ufficiali, e tradurle rende l'informazione inutilizzabile proprio a chi ne
 * ha più bisogno — chi deve cercarle su un cartello o un orario.
 *
 * Si estraggono le parole capitalizzate e i codici alfanumerici (S40, SS233), ignorando l'inizio
 * di frase. Poi si verifica che ciascuna compaia ancora nella traduzione.
 */
export function protectedTokens(text: string): string[] {
  const out = new Set<string>();
  for (const sentence of sentences(text)) {
    sentence
      .split(/\s+/)
      .forEach((raw, i) => {
        const token = raw.replace(/^[«"'(]+|[»"'),.;:!?]+$/g, "");
        // Codice alfanumerico (S40, SS233, A8): protetto ovunque, anche a inizio frase.
        if (/^[A-Z]{1,3}\d{1,4}$/.test(token)) {
          out.add(token);
          return;
        }
        if (i === 0) return; // apertura di frase: la maiuscola non dice nulla
        if (/^[A-ZÀ-Ù][\wÀ-ù'’-]{2,}$/.test(token)) out.add(token);
      });
  }
  return [...out];
}

/** Tutto il testo leggibile, in un pezzo solo. */
function prose(n: Pick<AreaNarrative, "title" | "intro" | "sections" | "claimMap">): string {
  return [
    n.title,
    n.intro,
    ...n.sections.flatMap((s) => [s.heading, s.body]),
    ...n.claimMap.map((c) => c.claim),
  ].join("\n");
}

/**
 * Confronta la traduzione con la canonica e restituisce tutto ciò che NON doveva cambiare e
 * invece è cambiato.
 *
 * Deterministico. Non ripara e non riscrive: una traduzione che perde un factId non si
 * "aggiusta" rimettendocelo — non si sa più a cosa si riferisse la frase tradotta.
 */
export function validateTranslation(source: AreaNarrative, translated: AreaNarrative): TranslationFailure[] {
  const f: TranslationFailure[] = [];

  if (translated.areaKey !== source.areaKey) {
    push(f, "area-key-changed", "La traduzione dichiara un'altra area.", translated.areaKey);
  }
  if (translated.locale === source.locale) {
    push(f, "same-locale", "La traduzione ha la stessa lingua della canonica.");
  }
  if (translated.factsHash !== source.factsHash) {
    // L'impronta lega il testo ai fatti che lo sostengono: se cambia, la traduzione non è più
    // riconducibile all'evidenza che aveva superato il cancello.
    push(f, "facts-hash-changed", "L'impronta dei fatti è cambiata: la traduzione non è più tracciabile.");
  }
  if (translated.status === "approved") {
    // Una traduzione automatica di un testo approvato NON eredita l'approvazione:
    // l'approvazione riguardava parole diverse.
    push(f, "claims-status-approved", "Una traduzione nasce bozza: non può dichiararsi approvata.");
  }

  // ── Struttura ──────────────────────────────────────────────
  if (translated.sections.length !== source.sections.length) {
    push(
      f,
      "structure-changed",
      `Sezioni: ${source.sections.length} nella canonica, ${translated.sections.length} nella traduzione.`,
    );
  } else {
    source.sections.forEach((s, i) => {
      const t = translated.sections[i];
      if (t.category !== s.category) {
        push(f, "structure-changed", `Sezione ${i + 1}: categoria "${s.category}" → "${t.category}".`);
      }
      if (JSON.stringify(t.factIds) !== JSON.stringify(s.factIds)) {
        push(f, "fact-ids-changed", `Sezione ${i + 1}: i factId non coincidono.`, s.category);
      }
    });
  }

  if (translated.claimMap.length !== source.claimMap.length) {
    push(f, "claim-map-changed", "La claimMap ha un numero di affermazioni diverso.");
  } else {
    source.claimMap.forEach((c, i) => {
      if (JSON.stringify(translated.claimMap[i].factIds) !== JSON.stringify(c.factIds)) {
        push(f, "claim-map-changed", `Affermazione ${i + 1}: i factId non coincidono.`);
      }
    });
  }

  if (JSON.stringify([...translated.sourceIdsUsed].sort()) !== JSON.stringify([...source.sourceIdsUsed].sort())) {
    push(f, "source-ids-changed", "Le fonti citate non coincidono con quelle della canonica.");
  }

  // ── Contenuto: numeri e nomi propri ────────────────────────
  const sourceProse = prose(source);
  const targetProse = prose(translated);

  const sourceNumbers = numbersIn(sourceProse).sort();
  const targetNumbers = numbersIn(targetProse).sort();
  if (JSON.stringify(sourceNumbers) !== JSON.stringify(targetNumbers)) {
    push(
      f,
      "numbers-changed",
      `Numeri diversi: canonica [${sourceNumbers.join(", ")}], traduzione [${targetNumbers.join(", ")}].`,
    );
  }

  for (const token of protectedTokens(sourceProse)) {
    if (!targetProse.includes(token)) {
      push(
        f,
        "proper-names-changed",
        `"${token}" non compare nella traduzione: le denominazioni ufficiali non si traducono.`,
        token,
      );
    }
  }

  // ── Traduzione avvenuta davvero ────────────────────────────
  if (targetProse.trim() === sourceProse.trim()) {
    push(f, "untranslated", "Il testo è identico alla canonica: la traduzione non è avvenuta.");
  }

  return f;
}

/** Il messaggio utente del traduttore: la canonica e la lingua d'arrivo. */
export function buildTranslationUserPrompt(input: TranslationInput): string {
  const { source } = input;
  return [
    `TARGET LOCALE: ${input.target}`,
    `areaKey: ${source.areaKey}`,
    "",
    "APPROVED CANONICAL ITALIAN NARRATIVE:",
    JSON.stringify(
      {
        title: source.title,
        intro: source.intro,
        sections: source.sections,
        claimMap: source.claimMap,
        sourceIdsUsed: source.sourceIdsUsed,
      },
      null,
      2,
    ),
  ].join("\n");
}

/**
 * Traduce una narrativa approvata. Il risultato è una BOZZA validata, o l'elenco dei motivi per
 * cui la traduzione non è utilizzabile.
 */
export async function translateNarrative(
  input: TranslationInput,
  translator: AreaTranslator,
  options: { now: Date; modelId?: string } = { now: new Date() },
): Promise<TranslationOutcome> {
  if (input.source.status !== "approved") {
    // Si traduce SOLO l'approvato: tradurre una bozza significa moltiplicare per il numero di
    // lingue un testo che potrebbe non uscire mai.
    return {
      ok: false,
      failures: [
        {
          code: "not-approved-source",
          message: `La canonica è "${input.source.status}": si traduce solo ciò che è approvato.`,
        },
      ],
    };
  }
  if (input.target === input.source.locale) {
    return { ok: false, failures: [{ code: "same-locale", message: "Lingua d'arrivo uguale alla canonica." }] };
  }

  const raw = await translator(input, {
    system: AREA_TRANSLATION_SYSTEM,
    user: buildTranslationUserPrompt(input),
  });

  // ELENCO CHIUSO, come nel generatore: il traduttore può cambiare le PAROLE, e le prende da
  // qui. Tutto il resto — factId, categorie, impronta, fonti — viene dalla canonica, quindi non
  // può essere perso per distrazione né riscritto di proposito.
  const t = (raw ?? {}) as Partial<TranslatableFields>;

  // Controllo strutturale PRIMA di comporre il candidato. Senza, una traduzione con una sezione
  // in meno usciva come "schema-invalid" — vero, ma inutile a chi legge il rapporto: il motivo
  // è che il traduttore ha perso una sezione, e va detto così.
  const structural: TranslationFailure[] = [];
  if ((t.sections?.length ?? 0) !== input.source.sections.length) {
    structural.push({
      code: "structure-changed",
      message: `Sezioni: ${input.source.sections.length} nella canonica, ${t.sections?.length ?? 0} dal traduttore.`,
    });
  }
  if ((t.claimMap?.length ?? 0) !== input.source.claimMap.length) {
    structural.push({
      code: "claim-map-changed",
      message: `Affermazioni: ${input.source.claimMap.length} nella canonica, ${t.claimMap?.length ?? 0} dal traduttore.`,
    });
  }
  if (structural.length > 0) return { ok: false, failures: structural };

  const candidate = {
    ...input.source,
    locale: input.target,
    title: t.title,
    intro: t.intro,
    sections: input.source.sections.map((s, i) => ({
      ...s,
      heading: t.sections?.[i]?.heading,
      body: t.sections?.[i]?.body,
    })),
    claimMap: input.source.claimMap.map((c, i) => ({ ...c, claim: t.claimMap?.[i]?.claim })),
    // Nasce bozza, sempre. E la traccia di approvazione della canonica non si eredita.
    status: "draft" as const,
    approvedBy: undefined,
    approvedAt: undefined,
    ...(options.modelId ? { modelId: options.modelId } : {}),
    generatedAt: options.now.toISOString(),
  };

  const parsed = AreaNarrativeSchema.safeParse(candidate);
  if (!parsed.success) {
    return {
      ok: false,
      failures: [{ code: "schema-invalid", message: parsed.error.issues[0]?.message ?? "forma non valida" }],
    };
  }

  const failures = validateTranslation(input.source, parsed.data);
  return failures.length > 0 ? { ok: false, failures } : { ok: true, narrative: parsed.data };
}

/**
 * Una traduzione è OBSOLETA quando la canonica è cambiata sotto di lei.
 *
 * Si confronta l'impronta dei fatti: se la canonica è stata rigenerata su evidenza diversa, la
 * traduzione racconta fatti che non sono più quelli — e lo fa in una lingua che nessuno in
 * agenzia rilegge, quindi non se ne accorgerebbe nessuno.
 */
export function isTranslationStale(source: AreaNarrative, translation: AreaNarrative): boolean {
  return translation.factsHash !== source.factsHash;
}
