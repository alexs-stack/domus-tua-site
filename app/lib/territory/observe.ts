// Osservabilità PROVIDER-NEUTRA di Territory V2 (Prompt 14).
//
// Nessun vendor: un'interfaccia `ObservabilitySink` che si può implementare su qualunque
// infrastruttura (console JSON, la propria pipeline, un domani un vendor approvato). Gli eventi sono
// TIPIZZATI e PRIVACY-SAFE per costruzione: solo conteggi, enum, comune "grosso" (slug) e ID di record
// TRONCATI. Ciò che NON entra MAI: coordinate esatte, indirizzi, telefoni, chiavi, payload grezzi del
// provider, nomi di chi revisiona. Gli ID di correlazione legano gli eventi di un run/turno senza
// incrociare identità utente.

import { TerritoryProviderSchema } from "./types";
import type { EnrichmentFailureKind, TerritoryProvider } from "./types";

/** Slug comune "grosso": è già pubblico (compare nelle URL) e non individua una persona. */
type Municipality = string;
/** Hash di fingerprint/record TRONCATO a 8 char: identifica un record senza rivelarne l'origine. */
type ShortId = string;

// ── Eventi (unione chiusa e tipizzata) ────────────────────────────────────────

export type TerritoryMetricEvent =
  /** Chiamata a un provider di POI: esito, latenza, provider. Mai il payload. */
  | { kind: "provider-call"; provider: TerritoryProvider; outcome: "ok" | "failed"; failure?: EnrichmentFailureKind; latencyMs: number; municipality?: Municipality; runId?: string }
  /** Chiamata di GEOCODING: contata SEPARATAMENTE dai POI (constraint 1.8). */
  | { kind: "geocode-call"; outcome: "ok" | "failed"; latencyMs: number; municipality?: Municipality; runId?: string }
  /** Risoluzione della cache dei profili: hit/refreshed/stale/unavailable/budget-skipped. */
  | { kind: "profile-cache"; result: "hit" | "refreshed" | "stale" | "unavailable" | "budget-skipped"; municipality?: Municipality; runId?: string }
  /** Transizione di stato di un record (per record-by-status). */
  | { kind: "record-status"; status: "draft" | "approved" | "stale" | "failed" | "disabled"; municipality?: Municipality; recordId?: ShortId }
  /** Tempo di lavorazione dell'approvazione (draft→approved), in ore. */
  | { kind: "approval-turnaround"; hours: number; municipality?: Municipality }
  /** Impression/interazione della sezione pubblica "Vivere in zona". Nessun identificativo utente. */
  | { kind: "public-impression"; municipality?: Municipality }
  | { kind: "public-interaction"; action: "filter" | "explorer-open" | "source-link"; municipality?: Municipality }
  /** Uso di uno strumento territoriale dell'assistente + eventuale fallback (dato assente). */
  | { kind: "assistant-tool"; tool: "get_listing_details" | "get_area_profile"; hadTerritory: boolean; turnId?: string }
  | { kind: "assistant-fallback"; reason: "missing" | "stale"; scope: "listing" | "area"; turnId?: string };

/** Sink neutro: qualunque destinazione (console, pipeline propria, vendor approvato) lo implementa. */
export interface ObservabilitySink {
  emit(event: TerritoryMetricEvent): void;
}

// ── Difesa privacy: nessun campo proibito può entrare in un evento ─────────────

const FORBIDDEN_KEYS = new Set([
  "lat", "lng", "lon", "latitude", "longitude", "coord", "coords", "origin",
  "address", "indirizzo", "phone", "telefono", "email", "apiKey", "api_key",
  "token", "secret", "payload", "raw", "reviewer", "approvedBy", "actor",
]);

/**
 * Verifica difensiva: un evento NON deve contenere chiavi proibite né stringhe che sembrano
 * coordinate/telefoni/chiavi. Ritorna la lista delle violazioni (vuoto = pulito). Usato dai test e,
 * a runtime, come rete finale prima di emettere.
 */
export function findPrivacyViolations(event: TerritoryMetricEvent): string[] {
  const v: string[] = [];
  const looksLikeCoord = (s: string) => /-?\d{1,3}\.\d{3,}/.test(s); // 45.7085 ecc.
  const looksLikePhone = (s: string) => /(?:\+?\d[\s.\-]?){7,}/.test(s);
  for (const [key, value] of Object.entries(event)) {
    if (FORBIDDEN_KEYS.has(key)) v.push(`campo proibito: ${key}`);
    if (typeof value === "string") {
      if (looksLikeCoord(value)) v.push(`possibile coordinata in ${key}: "${value}"`);
      if (looksLikePhone(value)) v.push(`possibile telefono in ${key}: "${value}"`);
    }
  }
  return v;
}

/** Sink che scarta qualunque evento sospetto (rete finale) prima di delegare al sink reale. */
export function guarded(sink: ObservabilitySink): ObservabilitySink {
  return {
    emit(event) {
      if (findPrivacyViolations(event).length === 0) sink.emit(event);
      // Se sospetto: si SCARTA in silenzio. Meglio un buco nelle metriche che una fuga di PII.
    },
  };
}

/** Sink nullo (default in produzione senza logging). */
export const NULL_SINK: ObservabilitySink = { emit() {} };

/** Sink in memoria per i test e per gli aggregatori a breve termine. */
export class MemorySink implements ObservabilitySink {
  readonly events: TerritoryMetricEvent[] = [];
  emit(event: TerritoryMetricEvent): void {
    this.events.push(event);
  }
}

/** Sink su console in JSON (una riga per evento). Opt-in: solo se TERRITORY_METRICS_LOG=true. */
export class ConsoleJsonSink implements ObservabilitySink {
  constructor(private readonly log: (line: string) => void = (l) => console.log(l)) {}
  emit(event: TerritoryMetricEvent): void {
    this.log(JSON.stringify({ ts: new Date().toISOString(), metric: "territory", ...event }));
  }
}

/** Sceglie il sink dall'ambiente: console JSON se abilitato, altrimenti nullo. Sempre `guarded`. */
export function sinkFromEnv(env: Record<string, string | undefined> = process.env): ObservabilitySink {
  const base = env.TERRITORY_METRICS_LOG === "true" ? new ConsoleJsonSink() : NULL_SINK;
  return guarded(base);
}

// ── ID di correlazione ────────────────────────────────────────────────────────

function shortRandom(): string {
  // randomUUID è disponibile a runtime app; niente Date/Math.random vietati qui (non è un workflow).
  return globalThis.crypto.randomUUID().slice(0, 8);
}

/** ID di correlazione per un run di refresh (allinea gli eventi di uno stesso sync). */
export function makeRunId(): string {
  return `run_${shortRandom()}`;
}

/** ID di correlazione per un turno dell'assistente. NON è legato all'identità dell'utente. */
export function makeTurnId(): string {
  return `turn_${shortRandom()}`;
}

/** Provider valido (guardia usata da chi costruisce eventi da input esterno). */
export function isKnownProvider(p: string): p is TerritoryProvider {
  return TerritoryProviderSchema.safeParse(p).success;
}
