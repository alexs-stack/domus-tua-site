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

/**
 * Sezione pubblica «Vivere in zona». ACCESA di default, si spegne con `="false"`.
 *
 * Era spenta perché la funzionalità non era finita e non c'era niente da mostrare. Entrambe le
 * condizioni sono cadute: i fatti di Tradate sono approvati e firmati
 * (`app/lib/territory/area/data.ts`), e per ogni altro comune la proiezione pubblica torna `null`
 * — quindi la sezione non compare, comune per comune, senza bisogno di un interruttore globale.
 *
 * Il fail-closed vero è quello: nessun fatto approvato, nessuna sezione. Tenere ANCHE un flag
 * spento significava che pubblicare un fatto non bastava a pubblicarlo, e la seconda metà del
 * lavoro restava invisibile in attesa di una variabile d'ambiente che nessuno ricordava.
 *
 * L'interruttore resta, ma come freno: `NEXT_PUBLIC_TERRITORY_SECTION_ENABLED=false` spegne tutto
 * subito, senza toccare il codice.
 */
export function isPublicSectionEnabled(env: EnvLike = process.env): boolean {
  return env.NEXT_PUBLIC_TERRITORY_SECTION_ENABLED !== "false";
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
