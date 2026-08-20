// Configurazione (server-only) del motore di arricchimento territoriale.
//
// Valori guidati dall'ambiente con default sicuri dell'MVP. La lettura è separata dall'uso: il
// motore riceve una EnrichmentConfig già risolta, così è testabile senza toccare process.env.

import { TERRITORY_POI_CATEGORIES, type TerritoryPoiCategory } from "./categories";
import { TERRITORY_SCHEMA_VERSION } from "./constants";
import { normalizeMunicipality } from "./geo";

if (typeof window !== "undefined") {
  throw new Error("[territory/config] configurazione motore server-only");
}

/** Comuni del pilota (slug normalizzati). Coincidono con l'ADR-001. */
export const PILOT_MUNICIPALITIES: readonly string[] = [
  "tradate",
  "venegono-superiore",
  "venegono-inferiore",
  "lonate-ceppino",
];

export interface EnrichmentConfig {
  /** Comuni abilitati (slug normalizzati). Fuori da qui l'arricchimento non parte. */
  enabledMunicipalities: string[];
  /** Raggio di ricerca in metri. */
  searchRadiusMeters: number;
  /** Finestra di freschezza in giorni: oltre, un record approvato diventa stale. */
  freshnessDays: number;
  /** Massimo POI per categoria (2 nell'MVP). */
  maxPerCategory: number;
  /** Le categorie ammesse (le cinque del pilota). */
  categories: TerritoryPoiCategory[];
  /** Timeout della richiesta al provider, in ms. */
  requestTimeoutMs: number;
  /** Concorrenza fra immobili (usata dal CLI di sync, Prompt 7). */
  concurrency: number;
  /** Tetto di chiamate al provider per run. null = nessun tetto esplicito (lo limita già il numero di immobili). */
  maxCallsPerRun: number | null;
  /** Versione dello schema corrente. */
  schemaVersion: number;
  /** Decimali di arrotondamento della coordinata per il fingerprint. */
  roundDp: number;
}

type EnvLike = Record<string, string | undefined>;

function num(env: EnvLike, name: string, fallback: number): number {
  const raw = env[name];
  if (typeof raw !== "string" || raw.trim().length === 0) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function csvMunicipalities(env: EnvLike): string[] {
  const raw = env.TERRITORY_PILOT_TOWNS;
  if (typeof raw !== "string" || raw.trim().length === 0) return [...PILOT_MUNICIPALITIES];
  const slugs = raw
    .split(",")
    .map((s) => normalizeMunicipality(s))
    .filter((s) => s.length > 0);
  return slugs.length > 0 ? slugs : [...PILOT_MUNICIPALITIES];
}

/** Config di default dell'MVP (nessuna variabile impostata). */
export function defaultEnrichmentConfig(): EnrichmentConfig {
  return {
    enabledMunicipalities: [...PILOT_MUNICIPALITIES],
    searchRadiusMeters: 1500,
    freshnessDays: 180,
    maxPerCategory: 2,
    categories: [...TERRITORY_POI_CATEGORIES],
    requestTimeoutMs: 25_000,
    concurrency: 1,
    maxCallsPerRun: null,
    schemaVersion: TERRITORY_SCHEMA_VERSION,
    roundDp: 3,
  };
}

/** Legge la config dall'ambiente, con i default dell'MVP. */
export function readEnrichmentConfig(env: EnvLike = process.env): EnrichmentConfig {
  const base = defaultEnrichmentConfig();
  return {
    ...base,
    enabledMunicipalities: csvMunicipalities(env),
    searchRadiusMeters: num(env, "TERRITORY_SEARCH_RADIUS_M", base.searchRadiusMeters),
    freshnessDays: num(env, "TERRITORY_FRESHNESS_DAYS", base.freshnessDays),
    maxPerCategory: num(env, "TERRITORY_MAX_PER_CATEGORY", base.maxPerCategory),
    requestTimeoutMs: num(env, "TERRITORY_REQUEST_TIMEOUT_MS", base.requestTimeoutMs),
    concurrency: num(env, "TERRITORY_CONCURRENCY", base.concurrency),
    // 0 o assente → nessun tetto esplicito (il numero di immobili resta il limite).
    maxCallsPerRun: (() => {
      const raw = env.TERRITORY_MAX_CALLS_PER_RUN;
      if (typeof raw !== "string" || raw.trim().length === 0) return base.maxCallsPerRun;
      const parsed = Number(raw);
      return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : base.maxCallsPerRun;
    })(),
  };
}
