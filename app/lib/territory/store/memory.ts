// Adattatore in memoria: deterministico, senza I/O, usato dai test unitari e di contratto.
//
// Clona in ingresso e in uscita (structuredClone) per evitare aliasing: chi scrive e chi legge
// non condividono mai lo stesso oggetto. Valida ogni record con lo schema Zod prima di persistere,
// esattamente come gli adattatori su disco.

import {
  ListingTerritoryEnrichmentSchema,
  MunicipalityTerritoryProfileSchema,
  type ListingTerritoryEnrichment,
  type MunicipalityTerritoryProfile,
  type EnrichmentFailure,
} from "../types";
import {
  TerritoryConcurrencyError,
  TerritoryStorageError,
  InMemoryLeaseTable,
  InMemoryAuditLog,
  toEnrichmentMetadata,
  withFailure,
  type EnrichmentMetadata,
  type PutOptions,
  type TerritoryRepository,
  type TerritoryAuditEventInput,
} from "./repository";
import type { TerritoryAuditEvent } from "../types";

function validateListing(record: ListingTerritoryEnrichment): ListingTerritoryEnrichment {
  const parsed = ListingTerritoryEnrichmentSchema.safeParse(record);
  if (!parsed.success) {
    throw new TerritoryStorageError(
      `Record immobile non valido (${record?.realSmartCode ?? "?"}): ${parsed.error.message}`,
    );
  }
  return parsed.data;
}

function validateProfile(profile: MunicipalityTerritoryProfile): MunicipalityTerritoryProfile {
  const parsed = MunicipalityTerritoryProfileSchema.safeParse(profile);
  if (!parsed.success) {
    throw new TerritoryStorageError(
      `Profilo comune non valido (${profile?.municipality ?? "?"}): ${parsed.error.message}`,
    );
  }
  return parsed.data;
}

export class MemoryTerritoryRepository implements TerritoryRepository {
  private readonly listings = new Map<string, ListingTerritoryEnrichment>();
  private readonly profiles = new Map<string, MunicipalityTerritoryProfile>();
  private readonly leases = new InMemoryLeaseTable();
  private readonly audit = new InMemoryAuditLog();

  async tryAcquireLease(key: string, holder: string, expiresAtIso: string, now: Date): Promise<boolean> {
    return this.leases.tryAcquire(key, holder, expiresAtIso, now);
  }

  async releaseLease(key: string, holder: string): Promise<void> {
    this.leases.release(key, holder);
  }

  async appendAuditEvent(event: TerritoryAuditEventInput): Promise<TerritoryAuditEvent> {
    return this.audit.append(event);
  }

  async listAuditEvents(filter?: { realSmartCode?: string; limit?: number }): Promise<TerritoryAuditEvent[]> {
    return this.audit.list(filter);
  }

  async getListingEnrichment(realSmartCode: string): Promise<ListingTerritoryEnrichment | null> {
    const found = this.listings.get(realSmartCode);
    return found ? structuredClone(found) : null;
  }

  async putListingEnrichment(
    record: ListingTerritoryEnrichment,
    options?: PutOptions,
  ): Promise<void> {
    const valid = validateListing(record);
    if (options?.ifUpdatedAt !== undefined) {
      const existing = this.listings.get(valid.realSmartCode);
      if ((existing?.updatedAt ?? null) !== options.ifUpdatedAt) {
        throw new TerritoryConcurrencyError(
          `Conflitto di concorrenza su ${valid.realSmartCode}: atteso updatedAt=${options.ifUpdatedAt}.`,
        );
      }
    }
    this.listings.set(valid.realSmartCode, structuredClone(valid));
  }

  async getMunicipalityProfile(
    municipality: string,
  ): Promise<MunicipalityTerritoryProfile | null> {
    const found = this.profiles.get(municipality);
    return found ? structuredClone(found) : null;
  }

  async putMunicipalityProfile(
    profile: MunicipalityTerritoryProfile,
    options?: PutOptions,
  ): Promise<void> {
    const valid = validateProfile(profile);
    if (options?.ifUpdatedAt !== undefined) {
      const existing = this.profiles.get(valid.municipality);
      if ((existing?.updatedAt ?? null) !== options.ifUpdatedAt) {
        throw new TerritoryConcurrencyError(
          `Conflitto di concorrenza sul comune ${valid.municipality}.`,
        );
      }
    }
    this.profiles.set(valid.municipality, structuredClone(valid));
  }

  async listEnrichmentMetadata(): Promise<EnrichmentMetadata[]> {
    return [...this.listings.values()]
      .sort((a, b) => (a.realSmartCode < b.realSmartCode ? -1 : 1))
      .map(toEnrichmentMetadata);
  }

  async listMunicipalityProfiles(): Promise<MunicipalityTerritoryProfile[]> {
    return [...this.profiles.values()]
      .sort((a, b) => (a.municipality < b.municipality ? -1 : 1))
      .map((p) => structuredClone(p));
  }

  async markStale(realSmartCode: string): Promise<void> {
    const existing = this.listings.get(realSmartCode);
    if (!existing) {
      throw new TerritoryStorageError(`Impossibile marcare stale: ${realSmartCode} non esiste.`);
    }
    this.listings.set(realSmartCode, { ...structuredClone(existing), status: "stale" });
  }

  async deleteListingEnrichment(realSmartCode: string): Promise<boolean> {
    return this.listings.delete(realSmartCode);
  }

  async recordFailure(realSmartCode: string, failure: EnrichmentFailure): Promise<void> {
    const existing = this.listings.get(realSmartCode);
    if (!existing) {
      throw new TerritoryStorageError(
        `Impossibile registrare il fallimento: ${realSmartCode} non esiste.`,
      );
    }
    this.listings.set(realSmartCode, withFailure(structuredClone(existing), failure));
  }
}
