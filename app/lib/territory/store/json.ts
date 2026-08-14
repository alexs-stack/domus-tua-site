// Adattatore di PRODUZIONE: JSON committato, sola lettura.
//
// È l'adattatore approvato dall'ADR-001 per la produzione: legge i file privati committati nel
// repository (prodotti offline dai CLI) e RIFIUTA ogni scrittura a runtime. Così il percorso di
// richiesta e qualunque codice server "normale" non possono mutare lo store: si arricchisce solo
// nei job controllati, si legge il dato approvato (constraint 5 e 6).

import {
  TerritoryStorageError,
  type EnrichmentMetadata,
  type TerritoryRepository,
} from "./repository";
import { FilesystemTerritoryRepository } from "./filesystem";
import type {
  ListingTerritoryEnrichment,
  MunicipalityTerritoryProfile,
  TerritoryAuditEvent,
} from "../types";

const READ_ONLY =
  "Store di produzione in sola lettura: gli arricchimenti si scrivono con i CLI (territory:sync) " +
  "e si committano. Il runtime non deve mai scrivere sullo store territoriale.";

export class JsonTerritoryRepository implements TerritoryRepository {
  private readonly reader: FilesystemTerritoryRepository;

  constructor(dir: string) {
    if (typeof window !== "undefined") {
      throw new Error("[territory/store] JSON repository server-only");
    }
    // Riusa la logica di lettura/validazione del filesystem; le scritture sono chiuse qui sotto.
    this.reader = new FilesystemTerritoryRepository(dir);
  }

  getListingEnrichment(realSmartCode: string): Promise<ListingTerritoryEnrichment | null> {
    return this.reader.getListingEnrichment(realSmartCode);
  }

  getMunicipalityProfile(municipality: string): Promise<MunicipalityTerritoryProfile | null> {
    return this.reader.getMunicipalityProfile(municipality);
  }

  listEnrichmentMetadata(): Promise<EnrichmentMetadata[]> {
    return this.reader.listEnrichmentMetadata();
  }

  listMunicipalityProfiles(): Promise<MunicipalityTerritoryProfile[]> {
    return this.reader.listMunicipalityProfiles();
  }

  // Le scritture sono chiuse: firme senza parametri (assegnabili all'interfaccia) che falliscono
  // sempre. Chi scrive deve usare il filesystem nei CLI, non il runtime di produzione.
  async putListingEnrichment(): Promise<void> {
    throw new TerritoryStorageError(READ_ONLY);
  }

  async putMunicipalityProfile(): Promise<void> {
    throw new TerritoryStorageError(READ_ONLY);
  }

  async markStale(): Promise<void> {
    throw new TerritoryStorageError(READ_ONLY);
  }

  async deleteListingEnrichment(): Promise<boolean> {
    throw new TerritoryStorageError(READ_ONLY);
  }

  async recordFailure(): Promise<void> {
    throw new TerritoryStorageError(READ_ONLY);
  }

  // Il lease è coordinazione a RUNTIME (in memoria, per-istanza), non una scrittura sui dati:
  // delegato al reader. In produzione (sola lettura) i job non girano comunque su questo store.
  tryAcquireLease(key: string, holder: string, expiresAtIso: string, now: Date): Promise<boolean> {
    return this.reader.tryAcquireLease(key, holder, expiresAtIso, now);
  }

  releaseLease(key: string, holder: string): Promise<void> {
    return this.reader.releaseLease(key, holder);
  }

  // L'audit committato è di SOLA LETTURA in produzione (scritto offline dai CLI e committato).
  listAuditEvents(filter?: { realSmartCode?: string; limit?: number }): Promise<TerritoryAuditEvent[]> {
    return this.reader.listAuditEvents(filter);
  }

  async appendAuditEvent(): Promise<never> {
    throw new TerritoryStorageError(READ_ONLY);
  }
}
