// Contratto dello storage dell'arricchimento territoriale.
//
// Un'unica interfaccia, più adattatori (memoria per i test, filesystem per i CLI, JSON committato
// read-only per la produzione, Supabase come strada futura disabilitata). Tutti gli adattatori
// devono superare lo stesso contract test (vedi __tests__/repository-contract.ts): il comportamento
// non deve dipendere dall'implementazione.
//
// Principi (ADR-001):
//  • chiave stabile = codice RealSmart (immobili) / slug comune (profili);
//  • ogni record porta la propria versione di schema;
//  • i dati approvati restano leggibili anche se un refresh fallisce (constraint 12);
//  • nessun segreto e nessun payload grezzo del provider viene persistito.

import type {
  ListingTerritoryEnrichment,
  MunicipalityTerritoryProfile,
  EnrichmentFailure,
  EnrichmentStatus,
  CoordSource,
} from "../types";

/**
 * Riassunto leggero di un record, SENZA l'array `pois` (che porta i metadati del provider):
 * pensato per elenchi e report editoriali che non devono caricare l'intero payload.
 */
export interface EnrichmentMetadata {
  realSmartCode: string;
  municipality: string;
  status: EnrichmentStatus;
  coordSource: CoordSource;
  fingerprintHash: string;
  poiCount: number;
  approvedPoiCount: number;
  hasFailure: boolean;
  retrievedAt: string;
  updatedAt: string;
}

export interface PutOptions {
  /**
   * Concorrenza ottimistica: se valorizzato, il put fallisce con TerritoryConcurrencyError quando
   * lo `updatedAt` memorizzato non coincide (qualcuno ha scritto nel frattempo).
   */
  ifUpdatedAt?: string;
}

/** Errore generico dello storage (I/O, record non valido, adattatore non configurato). */
export class TerritoryStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TerritoryStorageError";
  }
}

/** Conflitto di concorrenza ottimistica su un put con `ifUpdatedAt`. */
export class TerritoryConcurrencyError extends TerritoryStorageError {
  constructor(message: string) {
    super(message);
    this.name = "TerritoryConcurrencyError";
  }
}

export interface TerritoryRepository {
  /** Legge l'arricchimento di un immobile dal codice RealSmart. `null` se assente. */
  getListingEnrichment(realSmartCode: string): Promise<ListingTerritoryEnrichment | null>;
  /** Scrive/aggiorna l'arricchimento di un immobile (validato prima di persistere). */
  putListingEnrichment(record: ListingTerritoryEnrichment, options?: PutOptions): Promise<void>;
  /** Legge il profilo territoriale di un comune. `null` se assente. */
  getMunicipalityProfile(municipality: string): Promise<MunicipalityTerritoryProfile | null>;
  /** Scrive/aggiorna il profilo territoriale di un comune. */
  putMunicipalityProfile(
    profile: MunicipalityTerritoryProfile,
    options?: PutOptions,
  ): Promise<void>;
  /** Elenca i metadati leggeri di tutti gli arricchimenti, senza caricarne i `pois`. */
  listEnrichmentMetadata(): Promise<EnrichmentMetadata[]>;
  /** Marca un record come `stale` (lo ritira dal pubblico senza cancellarne i dati). */
  markStale(realSmartCode: string): Promise<void>;
  /**
   * Registra un tentativo fallito SENZA distruggere i dati approvati: se il record era `approved`
   * resta pubblicabile, il fallimento viene solo annotato (constraint 12).
   */
  recordFailure(realSmartCode: string, failure: EnrichmentFailure): Promise<void>;
}

/** Proietta un record completo nel suo metadato leggero (nessun `pois` nel risultato). */
export function toEnrichmentMetadata(record: ListingTerritoryEnrichment): EnrichmentMetadata {
  return {
    realSmartCode: record.realSmartCode,
    municipality: record.municipality,
    status: record.status,
    coordSource: record.coordSource,
    fingerprintHash: record.fingerprint.hash,
    poiCount: record.pois.length,
    approvedPoiCount: record.pois.filter((p) => p.approval.state === "approved").length,
    hasFailure: record.failure !== undefined,
    retrievedAt: record.retrievedAt,
    updatedAt: record.updatedAt,
  };
}

/**
 * Applica un fallimento a un record preservando i dati approvati.
 * Puro: non tocca lo storage, ritorna il nuovo record. `updatedAt` prende il timestamp del
 * fallimento (già fornito dal chiamante), così il repository non deve inventare l'ora.
 */
export function withFailure(
  record: ListingTerritoryEnrichment,
  failure: EnrichmentFailure,
): ListingTerritoryEnrichment {
  return {
    ...record,
    // Un record approvato resta approvato (il pubblico continua a vederlo); gli altri → failed.
    status: record.status === "approved" ? "approved" : "failed",
    failure,
    updatedAt: failure.at,
  };
}
