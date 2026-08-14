// UNICA FONTE dei fatti d'area VERIFICATI (Prompt 9). SERVER-ONLY.
//
// VUOTO di proposito: nessun fatto d'area si pubblica finché un ricercatore non lo aggiunge (con
// fonte primaria, parafrasi neutra, data di revisione) e un revisore non lo approva. La ricerca
// avviene in job editoriali controllati, MAI durante una chat o il render di pagina. Le voci sono
// validate a import-time (in build): una voce non valida rompe la build, non la pagina.

import { AreaFactSchema, type AreaFact, type KnowledgeLocale } from "./types";
import { toPublicAreaProfile } from "./public";
import { approvalBlockers } from "./validate";

if (typeof window !== "undefined") {
  throw new Error("[territory/area] fatti d'area: modulo server-only.");
}

/** Fatti d'area di produzione. Volutamente VUOTO finché non c'è ricerca autorizzata + approvazione. */
const AREA_FACTS: AreaFact[] = [];

// Validazione a import-time: schema + niente fatto "approved" con blocker (soggettivo/conflitto).
for (const fact of AREA_FACTS) {
  const parsed = AreaFactSchema.safeParse(fact);
  if (!parsed.success) throw new Error(`[area] fatto non valido (${fact?.id ?? "?"}): ${parsed.error.message}`);
  if (fact.status === "approved") {
    const blockers = approvalBlockers(fact);
    if (blockers.length > 0) {
      throw new Error(`[area] fatto approvato ma con blocker (${fact.id}): ${blockers.join("; ")}`);
    }
  }
}

/** Tutti i fatti d'area (server-only). L'assistente NON legge questo: usa getPublicAreaProfile. */
export function allAreaFacts(): readonly AreaFact[] {
  return AREA_FACTS;
}

/**
 * Percorso di LETTURA dell'assistente (Prompt 13): profilo pubblico d'area per un comune, solo
 * fatti approvati/freschi/senza conflitti, localizzati. `null` se non c'è nulla di pubblicabile —
 * così l'assistente lo dice e non inventa.
 */
export function getPublicAreaProfile(
  municipality: string,
  options: { now: Date; locale: KnowledgeLocale; zone?: string },
): ReturnType<typeof toPublicAreaProfile> {
  return toPublicAreaProfile(AREA_FACTS, { ...options, municipality });
}
