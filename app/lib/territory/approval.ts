// Transizioni di stato dell'approvazione editoriale — PURE e testabili (nessun I/O, nessuna AI).
//
// Regole (Prompt 6):
//  • l'approvazione è sempre ESPLICITA e memorizza approver + timestamp + nota opzionale;
//  • un record non valido non può essere approvato;
//  • una nuova bozza NON sostituisce il pubblico approvato finché non viene approvata: al momento
//    dell'approvazione si (ri)calcola lo snapshot pubblico e lo si congela in `lastApprovedPublic`;
//  • la prosa a livello di comune resta vuota se non fornita a parte (mai generata).
//
// Ogni funzione ritorna un NUOVO record (immutabile): il chiamante (CLI) decide se persistere.

import {
  ListingTerritoryEnrichmentSchema,
  type ListingTerritoryEnrichment,
  type TerritoryPoi,
} from "./types";
import type { TerritoryPoiCategory } from "./categories";
import { toPublicListingTerritory } from "./public";

/** Chi approva e quando (constraint: approver + timestamp + nota). */
export interface ApprovalActor {
  approver: string;
  /** Timestamp ISO 8601. */
  at: string;
  note?: string;
}

export interface ApprovalOptions extends ApprovalActor {
  freshnessDays?: number;
  maxPerCategory?: number;
}

export class ApprovalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApprovalError";
  }
}

function assertActor(actor: ApprovalActor): void {
  if (!actor.approver || actor.approver.trim().length === 0) {
    throw new ApprovalError("Approver mancante: ogni operazione editoriale richiede --by=<nome>.");
  }
  if (!actor.at || Number.isNaN(Date.parse(actor.at))) {
    throw new ApprovalError("Timestamp di approvazione non valido.");
  }
}

/** Valida strutturalmente il record: uno non valido non può essere approvato (constraint). */
export function assertValidRecord(record: ListingTerritoryEnrichment): ListingTerritoryEnrichment {
  const parsed = ListingTerritoryEnrichmentSchema.safeParse(record);
  if (!parsed.success) {
    throw new ApprovalError(`Record non valido, impossibile approvarlo: ${parsed.error.message}`);
  }
  return parsed.data;
}

/** Imposta lo stato d'approvazione dei POI indicati (per providerId). Non tocca lo status del record. */
export function setPoiApproval(
  record: ListingTerritoryEnrichment,
  providerIds: string[],
  state: "approved" | "rejected" | "draft",
  actor: ApprovalActor,
): ListingTerritoryEnrichment {
  assertActor(actor);
  if (providerIds.length === 0) {
    throw new ApprovalError("Nessun POI indicato: elenca gli ID espliciti (--ids=...).");
  }
  const known = new Set(record.pois.map((p) => p.providerId));
  const unknown = providerIds.filter((id) => !known.has(id));
  if (unknown.length > 0) {
    throw new ApprovalError(`POI inesistenti in ${record.realSmartCode}: ${unknown.join(", ")}`);
  }
  const target = new Set(providerIds);
  const pois: TerritoryPoi[] = record.pois.map((p) => {
    if (!target.has(p.providerId)) return p;
    return {
      ...p,
      approval:
        state === "approved"
          ? { state, approvedBy: actor.approver, approvedAt: actor.at, ...(actor.note ? { note: actor.note } : {}) }
          : { state, ...(actor.note ? { note: actor.note } : {}) },
    };
  });
  return { ...record, pois, updatedAt: actor.at };
}

/**
 * Approva l'INTERO record: approva ogni POI non esplicitamente rifiutato, imposta status
 * "approved", registra l'approvazione e congela lo snapshot pubblico. Fallisce se, dopo
 * l'approvazione, non resta alcun POI pubblicabile (record vuoto/stale).
 */
export function approveRecord(
  record: ListingTerritoryEnrichment,
  options: ApprovalOptions,
): ListingTerritoryEnrichment {
  assertActor(options);
  assertValidRecord(record);

  const pois: TerritoryPoi[] = record.pois.map((p) =>
    p.approval.state === "rejected"
      ? p
      : {
          ...p,
          approval: {
            state: "approved",
            approvedBy: options.approver,
            approvedAt: options.at,
            ...(options.note ? { note: options.note } : {}),
          },
        },
  );

  const approved: ListingTerritoryEnrichment = {
    ...record,
    status: "approved",
    pois,
    approval: { approvedBy: options.approver, approvedAt: options.at, ...(options.note ? { note: options.note } : {}) },
    updatedAt: options.at,
  };

  const publicView = toPublicListingTerritory(approved, {
    now: new Date(options.at),
    freshnessDays: options.freshnessDays ?? 180,
    maxPerCategory: options.maxPerCategory ?? 2,
  });
  if (!publicView) {
    throw new ApprovalError(
      `Nessun POI pubblicabile in ${record.realSmartCode}: niente da approvare (tutti rifiutati o dato stale).`,
    );
  }
  return { ...approved, lastApprovedPublic: publicView };
}

/** Disabilita l'arricchimento di un immobile: lo ritira dal pubblico, conservando i dati. */
export function disableRecord(
  record: ListingTerritoryEnrichment,
  actor: ApprovalActor,
): ListingTerritoryEnrichment {
  assertActor(actor);
  return {
    ...record,
    status: "disabled",
    approval: { approvedBy: actor.approver, approvedAt: actor.at, ...(actor.note ? { note: actor.note } : {}) },
    updatedAt: actor.at,
  };
}

/** Marca un record come stale (lo ritira dal pubblico senza cancellarne i dati). */
export function markRecordStale(
  record: ListingTerritoryEnrichment,
  at: string,
): ListingTerritoryEnrichment {
  return { ...record, status: "stale", updatedAt: at };
}

// ─────────────────────────────────────────────────────────────
// Confronto bozza ↔ approvato (per la review editoriale)
// ─────────────────────────────────────────────────────────────

export interface TerritoryDiffEntry {
  category: TerritoryPoiCategory;
  name: string;
  distanceMeters: number;
}

export interface TerritoryDiff {
  /** Nel draft di lavoro ma non nell'ultimo approvato. */
  added: TerritoryDiffEntry[];
  /** Nell'ultimo approvato ma non nel draft. */
  removed: TerritoryDiffEntry[];
  /** Presenti in entrambi (stessa categoria+nome). */
  unchanged: TerritoryDiffEntry[];
}

function keyOf(e: TerritoryDiffEntry): string {
  return `${e.category}|${e.name.trim().toLowerCase()}`;
}

/** Confronta i POI di lavoro (draft) con l'ultimo pubblico approvato. */
export function diffDraftAgainstApproved(record: ListingTerritoryEnrichment): TerritoryDiff {
  const draft: TerritoryDiffEntry[] = record.pois.map((p) => ({
    category: p.category,
    name: p.name,
    distanceMeters: p.distanceMeters,
  }));
  const approved: TerritoryDiffEntry[] = (record.lastApprovedPublic?.pois ?? []).map((p) => ({
    category: p.category,
    name: p.name,
    distanceMeters: p.distanceMeters,
  }));

  const draftKeys = new Set(draft.map(keyOf));
  const approvedKeys = new Set(approved.map(keyOf));

  return {
    added: draft.filter((e) => !approvedKeys.has(keyOf(e))),
    removed: approved.filter((e) => !draftKeys.has(keyOf(e))),
    unchanged: draft.filter((e) => approvedKeys.has(keyOf(e))),
  };
}
