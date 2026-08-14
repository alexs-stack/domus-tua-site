// Adattatore su filesystem: sorgente di verità per i CLI di sviluppo e per il backfill controllato.
//
// Scrive due file JSON PRIVATI (mai importati dal browser), ordinati per chiave e con scrittura
// ATOMICA (file temporaneo nella stessa cartella + rename): un'interruzione non lascia mai un file
// mezzo scritto. È lo stesso schema di scrittura di scripts/detect-sold.ts, che questo progetto già
// usa per i dati generati offline e poi committati.
//
// SERVER-ONLY: usa node:fs. La guardia sotto rende esplicito che non deve finire in un bundle client.

import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

import {
  ListingTerritoryEnrichmentSchema,
  MunicipalityTerritoryProfileSchema,
  TerritoryAuditEventSchema,
  type ListingTerritoryEnrichment,
  type MunicipalityTerritoryProfile,
  type EnrichmentFailure,
  type TerritoryAuditEvent,
} from "../types";
import { parseListingEnrichmentMigrated, parseMunicipalityProfileMigrated } from "../migrate";
import {
  TerritoryConcurrencyError,
  TerritoryStorageError,
  InMemoryLeaseTable,
  toEnrichmentMetadata,
  withFailure,
  type EnrichmentMetadata,
  type PutOptions,
  type TerritoryRepository,
  type TerritoryAuditEventInput,
} from "./repository";

if (typeof window !== "undefined") {
  throw new Error(
    "[territory/store] adattatore su filesystem server-only: leggi la vista pubblica, mai lo store privato.",
  );
}

export const LISTINGS_FILE = "enrichment.private.json";
export const MUNICIPALITIES_FILE = "municipalities.private.json";
export const AUDIT_FILE = "audit.private.json";

/** Legge un file JSON come mappa chiave→record; `{}` se il file non esiste. */
function readJsonMap(path: string): Record<string, unknown> {
  if (!existsSync(path)) return {};
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch (err) {
    throw new TerritoryStorageError(`Lettura fallita di ${path}: ${(err as Error).message}`);
  }
  if (raw.trim().length === 0) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("il contenuto non è un oggetto chiave→record");
    }
    return parsed as Record<string, unknown>;
  } catch (err) {
    throw new TerritoryStorageError(`JSON non valido in ${path}: ${(err as Error).message}`);
  }
}

/** Scrive una mappa come JSON ordinato per chiave, in modo atomico (tmp + rename). */
function writeJsonMapAtomic(path: string, dir: string, map: Record<string, unknown>): void {
  mkdirSync(dir, { recursive: true });
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(map).sort()) sorted[key] = map[key];
  const tmp = `${path}.tmp-${process.pid}`;
  writeFileSync(tmp, `${JSON.stringify(sorted, null, 2)}\n`);
  renameSync(tmp, path);
}

export class FilesystemTerritoryRepository implements TerritoryRepository {
  protected readonly listingsPath: string;
  protected readonly municipalitiesPath: string;
  protected readonly auditPath: string;
  // Lease PER-ISTANZA (best-effort): coordina i run nello stesso processo. Il lease cross-istanza
  // durevole arriva con lo store approvato (Prompt 7).
  private readonly leases = new InMemoryLeaseTable();

  async tryAcquireLease(key: string, holder: string, expiresAtIso: string, now: Date): Promise<boolean> {
    return this.leases.tryAcquire(key, holder, expiresAtIso, now);
  }

  async releaseLease(key: string, holder: string): Promise<void> {
    this.leases.release(key, holder);
  }

  constructor(protected readonly dir: string) {
    if (typeof window !== "undefined") {
      throw new Error("[territory/store] filesystem repository server-only");
    }
    this.listingsPath = join(dir, LISTINGS_FILE);
    this.municipalitiesPath = join(dir, MUNICIPALITIES_FILE);
    this.auditPath = join(dir, AUDIT_FILE);
  }

  protected readListings(): Map<string, ListingTerritoryEnrichment> {
    const raw = readJsonMap(this.listingsPath);
    const out = new Map<string, ListingTerritoryEnrichment>();
    for (const [key, value] of Object.entries(raw)) {
      // Migrazione allo schema corrente PRIMA della validazione: un record v1 su disco viene
      // portato a v2 (gerarchia di precisione) senza mai cambiarne lo status.
      const parsed = parseListingEnrichmentMigrated(value);
      if (!parsed.success) {
        throw new TerritoryStorageError(
          `Record immobile corrotto in ${this.listingsPath} (${key}): ${parsed.error.message}`,
        );
      }
      out.set(key, parsed.data);
    }
    return out;
  }

  protected readProfiles(): Map<string, MunicipalityTerritoryProfile> {
    const raw = readJsonMap(this.municipalitiesPath);
    const out = new Map<string, MunicipalityTerritoryProfile>();
    for (const [key, value] of Object.entries(raw)) {
      const parsed = parseMunicipalityProfileMigrated(value);
      if (!parsed.success) {
        throw new TerritoryStorageError(
          `Profilo comune corrotto in ${this.municipalitiesPath} (${key}): ${parsed.error.message}`,
        );
      }
      out.set(key, parsed.data);
    }
    return out;
  }

  private writeListings(map: Map<string, ListingTerritoryEnrichment>): void {
    writeJsonMapAtomic(this.listingsPath, this.dir, Object.fromEntries(map));
  }

  private writeProfiles(map: Map<string, MunicipalityTerritoryProfile>): void {
    writeJsonMapAtomic(this.municipalitiesPath, this.dir, Object.fromEntries(map));
  }

  async getListingEnrichment(realSmartCode: string): Promise<ListingTerritoryEnrichment | null> {
    return this.readListings().get(realSmartCode) ?? null;
  }

  async putListingEnrichment(
    record: ListingTerritoryEnrichment,
    options?: PutOptions,
  ): Promise<void> {
    const parsed = ListingTerritoryEnrichmentSchema.safeParse(record);
    if (!parsed.success) {
      throw new TerritoryStorageError(
        `Record immobile non valido (${record?.realSmartCode ?? "?"}): ${parsed.error.message}`,
      );
    }
    const map = this.readListings();
    if (options?.ifUpdatedAt !== undefined) {
      const existing = map.get(parsed.data.realSmartCode);
      if ((existing?.updatedAt ?? null) !== options.ifUpdatedAt) {
        throw new TerritoryConcurrencyError(
          `Conflitto di concorrenza su ${parsed.data.realSmartCode}.`,
        );
      }
    }
    map.set(parsed.data.realSmartCode, parsed.data);
    this.writeListings(map);
  }

  async getMunicipalityProfile(
    municipality: string,
  ): Promise<MunicipalityTerritoryProfile | null> {
    return this.readProfiles().get(municipality) ?? null;
  }

  async putMunicipalityProfile(
    profile: MunicipalityTerritoryProfile,
    options?: PutOptions,
  ): Promise<void> {
    const parsed = MunicipalityTerritoryProfileSchema.safeParse(profile);
    if (!parsed.success) {
      throw new TerritoryStorageError(
        `Profilo comune non valido (${profile?.municipality ?? "?"}): ${parsed.error.message}`,
      );
    }
    const map = this.readProfiles();
    if (options?.ifUpdatedAt !== undefined) {
      const existing = map.get(parsed.data.municipality);
      if ((existing?.updatedAt ?? null) !== options.ifUpdatedAt) {
        throw new TerritoryConcurrencyError(
          `Conflitto di concorrenza sul comune ${parsed.data.municipality}.`,
        );
      }
    }
    map.set(parsed.data.municipality, parsed.data);
    this.writeProfiles(map);
  }

  async listEnrichmentMetadata(): Promise<EnrichmentMetadata[]> {
    return [...this.readListings().values()]
      .sort((a, b) => (a.realSmartCode < b.realSmartCode ? -1 : 1))
      .map(toEnrichmentMetadata);
  }

  async markStale(realSmartCode: string): Promise<void> {
    const map = this.readListings();
    const existing = map.get(realSmartCode);
    if (!existing) {
      throw new TerritoryStorageError(`Impossibile marcare stale: ${realSmartCode} non esiste.`);
    }
    map.set(realSmartCode, { ...existing, status: "stale" });
    this.writeListings(map);
  }

  async deleteListingEnrichment(realSmartCode: string): Promise<boolean> {
    const map = this.readListings();
    if (!map.delete(realSmartCode)) return false;
    this.writeListings(map);
    return true;
  }

  async listMunicipalityProfiles(): Promise<MunicipalityTerritoryProfile[]> {
    return [...this.readProfiles().values()].sort((a, b) => (a.municipality < b.municipality ? -1 : 1));
  }

  async recordFailure(realSmartCode: string, failure: EnrichmentFailure): Promise<void> {
    const map = this.readListings();
    const existing = map.get(realSmartCode);
    if (!existing) {
      throw new TerritoryStorageError(
        `Impossibile registrare il fallimento: ${realSmartCode} non esiste.`,
      );
    }
    map.set(realSmartCode, withFailure(existing, failure));
    this.writeListings(map);
  }

  // ── AUDIT append-only su file (durevole per il flusso CLI) ──────────────────
  // Memorizzato come mappa {id → evento}: gli id sono monotòni (evt_000001…), quindi l'ordine per
  // chiave è cronologico. Si aggiunge soltanto: gli eventi passati non si toccano mai.
  private readAuditMap(): Record<string, unknown> {
    return readJsonMap(this.auditPath);
  }

  async appendAuditEvent(event: TerritoryAuditEventInput): Promise<TerritoryAuditEvent> {
    const raw = this.readAuditMap();
    const id = event.id ?? `evt_${(Object.keys(raw).length + 1).toString(36).padStart(6, "0")}`;
    const parsed = TerritoryAuditEventSchema.safeParse({ ...event, id });
    if (!parsed.success) {
      throw new TerritoryStorageError(`Evento di audit non valido: ${parsed.error.message}`);
    }
    if (raw[id] !== undefined) {
      throw new TerritoryStorageError(`Audit append-only: l'id ${id} esiste già.`);
    }
    raw[id] = parsed.data;
    writeJsonMapAtomic(this.auditPath, this.dir, raw);
    return { ...parsed.data };
  }

  async listAuditEvents(filter?: { realSmartCode?: string; limit?: number }): Promise<TerritoryAuditEvent[]> {
    const raw = this.readAuditMap();
    const events = Object.keys(raw)
      .sort()
      .map((k) => TerritoryAuditEventSchema.parse(raw[k]));
    let out = events;
    if (filter?.realSmartCode) out = out.filter((e) => e.realSmartCode === filter.realSmartCode);
    const ordered = [...out].reverse();
    return filter?.limit != null ? ordered.slice(0, filter.limit) : ordered;
  }
}
