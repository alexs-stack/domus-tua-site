// Feature flag dell'arricchimento territoriale (server-only).
//
// TUTTI spenti di default: senza configurazione esplicita, in produzione non parte alcun job, la
// sezione pubblica è nascosta e l'assistente non ha dati territoriali. I comuni del pilota sono una
// ALLOWLIST (non un interruttore "on"): l'arricchimento resta comunque gated dal flag dei job.
//
// Un flag è pubblico (NEXT_PUBLIC_TERRITORY_SECTION_ENABLED) perché la sua lettura serve anche a
// decidere se rendere la sezione; tutti gli altri sono server-only e non finiscono nel bundle.

import { readEnrichmentConfig } from "./config";
import { normalizeMunicipality } from "./geo";

type EnvLike = Record<string, string | undefined>;

/** Job di arricchimento (CLI/cron). Spento di default. */
export function isEnrichmentJobsEnabled(env: EnvLike = process.env): boolean {
  return env.TERRITORY_ENRICHMENT_ENABLED === "true";
}

/** Sezione pubblica "Vivere in zona". Spenta di default. */
export function isPublicSectionEnabled(env: EnvLike = process.env): boolean {
  return env.NEXT_PUBLIC_TERRITORY_SECTION_ENABLED === "true";
}

/** Accesso territoriale dell'assistente. Spento di default. */
export function isAssistantTerritoryEnabled(env: EnvLike = process.env): boolean {
  return env.TERRITORY_ASSISTANT_ENABLED === "true";
}

/** Logging strutturato delle metriche. Spento di default. */
export function isMetricsLogEnabled(env: EnvLike = process.env): boolean {
  return env.TERRITORY_METRICS_LOG === "true";
}

/** true se il comune (nome libero) è nella allowlist del pilota. */
export function isMunicipalityEnabled(town: string, env: EnvLike = process.env): boolean {
  const slug = normalizeMunicipality(town);
  return readEnrichmentConfig(env).enabledMunicipalities.includes(slug);
}

/** Snapshot booleano per l'osservabilità (es. /api/health). Nessun segreto, nessuna coordinata. */
export function territoryFlagsSnapshot(env: EnvLike = process.env): {
  enrichmentJobs: boolean;
  publicSection: boolean;
  assistant: boolean;
  metricsLog: boolean;
  pilotMunicipalities: number;
} {
  return {
    enrichmentJobs: isEnrichmentJobsEnabled(env),
    publicSection: isPublicSectionEnabled(env),
    assistant: isAssistantTerritoryEnabled(env),
    metricsLog: isMetricsLogEnabled(env),
    pilotMunicipalities: readEnrichmentConfig(env).enabledMunicipalities.length,
  };
}
