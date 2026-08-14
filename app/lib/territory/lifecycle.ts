// Ciclo di vita e RITENZIONE del territorio di un immobile (Prompt 16).
//
// Quando un immobile viene ritirato/venduto/eliminato, o quando l'autorizzazione all'origine precisa
// viene REVOCATA, il territorio non deve più USARE né esporre l'origine esatta. Qui le transizioni
// PURE che lo garantiscono (il chiamante persiste + registra l'audit):
//   • withdrawTerritory        → disabilitato + origine RIDOTTA al centroide comunale + autorizzazione rimossa;
//   • revokeOriginAuthorization → autorizzazione rimossa + precisione ridotta + record STALE (ri-derivare dal centroide);
//   • shouldPurgeTerritory     → politica di cancellazione definitiva dopo la finestra di ritenzione.
//
// Nota: l'origine esatta (coord) è già SERVER-ONLY e mai nel payload pubblico; queste transizioni
// impediscono anche di CONTINUARE A USARLA (precisione ridotta → distanze dal centro, non dall'immobile).

import { ORIGIN_ACCURACY_METERS } from "./constants";
import { isPropertyLevelPrecision } from "./types";
import type { ListingTerritoryEnrichment } from "./types";
import type { TerritoryAuditEventInput } from "./store/repository";

export interface LifecycleActor {
  actor: string;
  at: string;
  note?: string;
}

/** Riduce l'origine al centroide comunale: nessuna precisione a livello di immobile resta attiva. */
function downgradeOriginToMunicipality(record: ListingTerritoryEnrichment): Partial<ListingTerritoryEnrichment> {
  if (!isPropertyLevelPrecision(record.originPrecision)) return {}; // già centroide
  const patch: Partial<ListingTerritoryEnrichment> = {
    originPrecision: "municipality-centroid",
    originAccuracyMeters: ORIGIN_ACCURACY_METERS["municipality-centroid"],
  };
  // Rimuove l'autorizzazione all'origine precisa (undefined = campo assente).
  return { ...patch, originAuthorization: undefined };
}

/**
 * Immobile RITIRATO/VENDUTO/ELIMINATO: il territorio viene DISABILITATO (sparisce dal pubblico) e
 * l'origine ridotta al centroide comunale con autorizzazione rimossa. I dati restano per l'audit/
 * ripristino finché la ritenzione non scade (vedi shouldPurgeTerritory).
 */
export function withdrawTerritory(
  record: ListingTerritoryEnrichment,
  actor: LifecycleActor,
): { record: ListingTerritoryEnrichment; audit: TerritoryAuditEventInput } {
  const next: ListingTerritoryEnrichment = {
    ...record,
    ...downgradeOriginToMunicipality(record),
    status: "disabled",
    updatedAt: actor.at,
  };
  return {
    record: next,
    audit: {
      at: actor.at,
      action: "withdraw",
      actor: actor.actor,
      realSmartCode: record.realSmartCode,
      municipality: record.municipality,
      fromStatus: record.status,
      toStatus: "disabled",
      ...(actor.note ? { note: actor.note } : {}),
    },
  };
}

/**
 * Autorizzazione all'origine precisa REVOCATA: si rimuove l'autorizzazione, si riduce la precisione al
 * centroide e si marca STALE così il prossimo sync ri-deriva le distanze dal CENTRO del comune (non
 * dall'immobile). Finché non è ri-derivato e riapprovato, il pubblico non mostra nulla.
 */
export function revokeOriginAuthorization(
  record: ListingTerritoryEnrichment,
  actor: LifecycleActor,
): { record: ListingTerritoryEnrichment; audit: TerritoryAuditEventInput } {
  const next: ListingTerritoryEnrichment = {
    ...record,
    ...downgradeOriginToMunicipality(record),
    status: "stale",
    updatedAt: actor.at,
  };
  return {
    record: next,
    audit: {
      at: actor.at,
      action: "revoke-origin",
      actor: actor.actor,
      realSmartCode: record.realSmartCode,
      municipality: record.municipality,
      fromStatus: record.status,
      toStatus: "stale",
      ...(actor.note ? { note: actor.note } : {}),
    },
  };
}

/**
 * Politica di CANCELLAZIONE definitiva: un record DISABILITATO da più di `retentionDays` può essere
 * eliminato (l'audit resta, immutabile). Deterministico dato `now`.
 */
export function shouldPurgeTerritory(
  record: ListingTerritoryEnrichment,
  now: Date,
  retentionDays: number,
): boolean {
  if (record.status !== "disabled") return false;
  const updated = Date.parse(record.updatedAt);
  if (Number.isNaN(updated)) return false;
  const ageDays = (now.getTime() - updated) / (24 * 60 * 60 * 1000);
  return ageDays >= retentionDays;
}

/** Finestra di ritenzione (giorni) prima della cancellazione definitiva di un record disabilitato. */
export const DEFAULT_TERRITORY_RETENTION_DAYS = 90;
