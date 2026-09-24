// Backup / export / import dello storage territoriale (Prompt 7).
//
// L'export produce un bundle JSON DETERMINISTICO e riesaminabile in git (chiavi ordinate): è la
// strategia di backup dell'MVP (committare il bundle) e il ponte fra adattatori — dallo store
// scrivibile (filesystem) a quello di produzione (json committato o, in futuro, Supabase).
// L'import valida ogni record con lo schema prima di scriverlo, e traccia un evento di audit.

import { TERRITORY_SCHEMA_VERSION } from "../constants";
import type {
  ListingTerritoryEnrichment,
  MunicipalityTerritoryProfile,
  TerritoryAuditEvent,
} from "../types";
import type { TerritoryRepository } from "./repository";

export interface TerritoryBackupBundle {
  /** Versione del FORMATO del bundle (non dello schema dei record). */
  bundleVersion: number;
  /** Versione dello schema dei record al momento dell'export. */
  schemaVersion: number;
  /** ISO 8601 dell'export (iniettato: nessun Date.now nel modulo). */
  exportedAt: string;
  /** Immobili per codice RealSmart (chiavi ordinate). */
  listings: Record<string, ListingTerritoryEnrichment>;
  /** Profili per slug comune (chiavi ordinate). */
  profiles: Record<string, MunicipalityTerritoryProfile>;
  /** Eventi di audit in ordine cronologico crescente (per id). */
  audit: TerritoryAuditEvent[];
}

/** Esporta l'intero storage in un bundle deterministico. Sola lettura: non modifica nulla. */
export async function exportTerritory(
  repo: TerritoryRepository,
  exportedAt: string,
): Promise<TerritoryBackupBundle> {
  const meta = await repo.listEnrichmentMetadata();
  const codes = meta.map((m) => m.realSmartCode).sort();
  const listings: Record<string, ListingTerritoryEnrichment> = {};
  for (const code of codes) {
    const rec = await repo.getListingEnrichment(code);
    if (rec) listings[code] = rec;
  }

  const profiles: Record<string, MunicipalityTerritoryProfile> = {};
  for (const p of await repo.listMunicipalityProfiles()) profiles[p.municipality] = p;

  // listAuditEvents ritorna dal più recente: lo rimettiamo crescente per un bundle stabile.
  const audit = (await repo.listAuditEvents()).slice().reverse();

  return {
    bundleVersion: 1,
    schemaVersion: TERRITORY_SCHEMA_VERSION,
    exportedAt,
    listings,
    profiles,
    audit,
  };
}

/** Serializza un bundle in JSON DETERMINISTICO (indentato, `\n` finale): riesaminabile in git. */
export function serializeBundle(bundle: TerritoryBackupBundle): string {
  // Chiavi di primo livello e delle mappe listings/profiles ordinate; l'ordine dei campi dei record
  // è stabile perché prodotto sempre dagli stessi costruttori.
  const ordered: TerritoryBackupBundle = {
    bundleVersion: bundle.bundleVersion,
    schemaVersion: bundle.schemaVersion,
    exportedAt: bundle.exportedAt,
    listings: Object.fromEntries(Object.keys(bundle.listings).sort().map((k) => [k, bundle.listings[k]])),
    profiles: Object.fromEntries(Object.keys(bundle.profiles).sort().map((k) => [k, bundle.profiles[k]])),
    audit: [...bundle.audit].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)),
  };
  return `${JSON.stringify(ordered, null, 2)}\n`;
}

export interface ImportResult {
  listings: number;
  profiles: number;
  audit: number;
}

/**
 * Importa un bundle in un repository SCRIVIBILE. Valida ogni record tramite lo store (safeParse) e
 * traccia un evento di audit `import`. Non cancella nulla: sovrascrive per chiave.
 */
export async function importTerritory(
  repo: TerritoryRepository,
  bundle: TerritoryBackupBundle,
  opts: { actor: string; at: string },
): Promise<ImportResult> {
  let profiles = 0;
  for (const profile of Object.values(bundle.profiles)) {
    await repo.putMunicipalityProfile(profile);
    profiles += 1;
  }
  let listings = 0;
  for (const record of Object.values(bundle.listings)) {
    await repo.putListingEnrichment(record);
    listings += 1;
  }
  let audit = 0;
  for (const event of bundle.audit) {
    await repo.appendAuditEvent(event);
    audit += 1;
  }
  await repo.appendAuditEvent({
    at: opts.at,
    action: "import",
    actor: opts.actor,
    note: `import bundle: ${listings} immobili, ${profiles} profili, ${audit} eventi`,
  });
  return { listings, profiles, audit };
}
