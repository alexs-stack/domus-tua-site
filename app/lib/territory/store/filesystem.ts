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
  type ListingTerritoryEnrichment,
  type MunicipalityTerritoryProfile,
  type EnrichmentFailure,
} from "../types";
import { parseListingEnrichmentMigrated, parseMunicipalityProfileMigrated } from "../migrate";
import {
  TerritoryConcurrencyError,
  TerritoryStorageError,
  toEnrichmentMetadata,
  withFailure,
  type EnrichmentMetadata,
  type PutOptions,
  type TerritoryRepository,
} from "./repository";

if (typeof window !== "undefined") {
  throw new Error(
    "[territory/store] adattatore su filesystem server-only: leggi la vista pubblica, mai lo store privato.",
  );
}

export const LISTINGS_FILE = "enrichment.private.json";
export const MUNICIPALITIES_FILE = "municipalities.private.json";

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

  constructor(protected readonly dir: string) {
    if (typeof window !== "undefined") {
      throw new Error("[territory/store] filesystem repository server-only");
    }
    this.listingsPath = join(dir, LISTINGS_FILE);
    this.municipalitiesPath = join(dir, MUNICIPALITIES_FILE);
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
}
