// Lettura PUBBLICA dell'arricchimento territoriale (server-only) per la pagina immobile.
//
// Legge SOLO dato locale committato (nessuna chiamata esterna in fase di richiesta, constraint 4).
// Gated dal flag NEXT_PUBLIC_TERRITORY_SECTION_ENABLED: spento di default in produzione → nessun
// accesso allo store e sezione nascosta. Fail-safe: qualunque errore dello store ritorna null, la
// pagina non si rompe mai (constraint: il sito funziona anche senza store/provider).

import { isFresh, toPublicListingTerritory } from "./public";
import { readEnrichmentConfig } from "./config";
import { createTerritoryRepository } from "./store/config";
import { toAssistantTerritory, type AssistantTerritory } from "./assistant";
import { isPublicSectionEnabled, isAssistantTerritoryEnabled } from "./flags";
import { logTerritoryEvent, truncatedFingerprint } from "./metrics";
import type { TerritoryRepository } from "./store/repository";
import type { ListingTerritoryEnrichment, PublicListingTerritory } from "./types";

if (typeof window !== "undefined") {
  throw new Error("[territory/read] modulo server-only: la sezione riceve i dati come prop dal server.");
}

export interface ResolvePublicOptions {
  now: Date;
  freshnessDays: number;
  maxPerCategory: number;
}

/**
 * Risolve la vista pubblica da un record privato:
 *  1. se il record è approvato e fresco → la sua proiezione pubblica;
 *  2. altrimenti, se esiste uno snapshot approvato precedente ANCORA fresco → quello
 *     (constraint 11/12: si mostra l'ultimo approvato finché un nuovo draft non è approvato);
 *  3. altrimenti null (sezione nascosta).
 */
export function resolvePublicTerritory(
  record: ListingTerritoryEnrichment,
  options: ResolvePublicOptions,
): PublicListingTerritory | null {
  const live = toPublicListingTerritory(record, options);
  if (live) return live;

  const last = record.lastApprovedPublic;
  if (last && isFresh(last.retrievedAt, options.now, options.freshnessDays)) return last;

  return null;
}

/** Esito di servizio per l'osservabilità: cosa è stato mostrato o trattenuto, e perché. */
type ServeOutcome = "served-approved" | "served-preserved" | "withheld-stale" | "withheld-unapproved";

function classifyServe(
  record: ListingTerritoryEnrichment,
  resolved: PublicListingTerritory | null,
  options: ResolvePublicOptions,
): ServeOutcome {
  if (resolved) {
    return record.status === "approved" && toPublicListingTerritory(record, options)
      ? "served-approved"
      : "served-preserved";
  }
  // Trattenuto: distinguo "stale" (esisteva un approvato/preservato ma non fresco) da "non approvato".
  const hadApproved = record.status === "approved" || record.lastApprovedPublic !== undefined;
  return hadApproved ? "withheld-stale" : "withheld-unapproved";
}

/**
 * Legge la vista pubblica per un codice RealSmart. Ritorna null (sezione nascosta) quando:
 * il flag è spento, non c'è record, il dato non è approvato/fresco, o lo store non è disponibile.
 */
export async function getPublicTerritory(
  code: string | undefined,
  repository?: TerritoryRepository,
): Promise<PublicListingTerritory | null> {
  if (!code) return null;
  if (!isPublicSectionEnabled()) return null;

  try {
    const repo = repository ?? createTerritoryRepository();
    const record = await repo.getListingEnrichment(code);
    if (!record) return null;
    const config = readEnrichmentConfig();
    const options = { now: new Date(), freshnessDays: config.freshnessDays, maxPerCategory: config.maxPerCategory };
    const resolved = resolvePublicTerritory(record, options);
    // Metrica "stale serviti/trattenuti" (opt-in, privacy-safe: codice + fingerprint troncato).
    logTerritoryEvent("serve.public", {
      code,
      fp: truncatedFingerprint(record.fingerprint.hash),
      outcome: classifyServe(record, resolved, options),
    });
    return resolved;
  } catch {
    // Store non disponibile / non configurato: la pagina non deve rompersi. Sezione nascosta.
    return null;
  }
}

/**
 * Dati territoriali per l'ASSISTENTE. Flag DEDICATO (TERRITORY_ASSISTANT_ENABLED), separato da
 * quello della sezione pubblica: si può approvare/mostrare in pagina senza esporli al chatbot, o
 * viceversa. Nessuna chiamata esterna, nessuna coordinata. Fail-safe: errore → null.
 */
export async function getAssistantTerritory(
  code: string | undefined,
  repository?: TerritoryRepository,
): Promise<AssistantTerritory | null> {
  if (!code) return null;
  if (!isAssistantTerritoryEnabled()) return null;

  try {
    const repo = repository ?? createTerritoryRepository();
    const record = await repo.getListingEnrichment(code);
    if (!record) return null;
    const config = readEnrichmentConfig();
    const options = { now: new Date(), freshnessDays: config.freshnessDays, maxPerCategory: config.maxPerCategory };
    const publicView = resolvePublicTerritory(record, options);
    logTerritoryEvent("serve.assistant", {
      code,
      fp: truncatedFingerprint(record.fingerprint.hash),
      outcome: classifyServe(record, publicView, options),
    });
    return toAssistantTerritory(publicView);
  } catch {
    return null;
  }
}
