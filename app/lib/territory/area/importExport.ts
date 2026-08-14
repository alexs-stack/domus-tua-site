// Import/export dei fatti d'area per ricercatori ed editor (Prompt 9).
//
// Il bundle è JSON DETERMINISTICO (ordinato per id) e riesaminabile in git. L'import VALIDA ogni
// voce con lo schema e segnala i blocker di approvabilità (soggettivo/conflitti) senza scartare in
// silenzio. `AREA_FACT_TEMPLATE` è la traccia che il ricercatore compila per ogni fatto.

import { AreaFactSchema, type AreaFact } from "./types";
import { approvalBlockers } from "./validate";
import { claimsChecklist, hasVolatileClaim } from "./claims";
import { areaQualityHints } from "./quality";

export interface AreaFactsBundle {
  bundleVersion: number;
  facts: AreaFact[];
}

/** Traccia (con valori d'esempio) per aggiungere un fatto: TUTTI i campi obbligatori sono espliciti. */
export const AREA_FACT_TEMPLATE = {
  id: "tradate-stazione-01",
  municipality: "tradate",
  zone: null,
  category: "transport",
  scope: "municipality",
  text: "La stazione di Tradate è servita dalla linea ferroviaria S…", // parafrasi neutra, senza virgolette
  translations: [],
  source: {
    url: "https://www.comune.tradate.va.it/…",
    owner: "Comune di Tradate",
    retrievedAt: "2026-08-14T00:00:00.000Z",
  },
  reviewBy: "2027-02-14T00:00:00.000Z", // rivedere entro 6 mesi
  status: "draft",
  conflicts: [],
} as const;

export interface ImportReport {
  ok: AreaFact[];
  errors: Array<{ index: number; id?: string; message: string }>;
  /** Per ogni fatto valido, gli eventuali blocker che ne impediscono l'approvazione. */
  blockers: Array<{ id: string; blockers: string[] }>;
  /**
   * Per ogni fatto valido: le AFFERMAZIONI da spuntare contro la fonte, i suggerimenti di forma e
   * se contiene dati volatili (sigle di linea) da ricontrollare a ogni revisione.
   *
   * Nasce da un errore reale: una frase con la sigla di linea sbagliata ha superato schema, guard
   * soggettivo e controlli di stile, perché nessuno di quelli sa se una cosa è VERA. Qui l'import
   * non prova a saperlo: consegna al revisore l'elenco di ciò che deve guardare.
   */
  verification: Array<{ id: string; checklist: string[]; hints: string[]; volatile: boolean }>;
}

/** Valida un bundle: forma (schema) + blocker di approvabilità. Non scarta in silenzio. */
export function parseAreaFactsBundle(value: unknown): ImportReport {
  const report: ImportReport = { ok: [], errors: [], blockers: [], verification: [] };
  const facts = (value as { facts?: unknown }).facts;
  if (!Array.isArray(facts)) {
    report.errors.push({ index: -1, message: "bundle senza array 'facts'" });
    return report;
  }
  facts.forEach((raw, index) => {
    const parsed = AreaFactSchema.safeParse(raw);
    if (!parsed.success) {
      report.errors.push({ index, id: (raw as { id?: string })?.id, message: parsed.error.message });
      return;
    }
    report.ok.push(parsed.data);
    const b = approvalBlockers(parsed.data);
    if (b.length > 0) report.blockers.push({ id: parsed.data.id, blockers: b });
    report.verification.push({
      id: parsed.data.id,
      checklist: claimsChecklist(parsed.data.text),
      hints: areaQualityHints(parsed.data.text).map((h) => `${h.kind}: ${h.message}`),
      volatile: hasVolatileClaim(parsed.data.text),
    });
  });
  return report;
}

/** Serializza i fatti in un bundle deterministico (ordinato per id, `\n` finale). */
export function serializeAreaFacts(facts: readonly AreaFact[]): string {
  const bundle: AreaFactsBundle = {
    bundleVersion: 1,
    facts: [...facts].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)),
  };
  return `${JSON.stringify(bundle, null, 2)}\n`;
}
