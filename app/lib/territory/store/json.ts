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

  async recordFailure(): Promise<void> {
    throw new TerritoryStorageError(READ_ONLY);
  }
}
