// Pool di endpoint Overpass APPROVATI con circuit breaker e health scoring (Prompt 11).
//
// Overpass è servito da più istanze pubbliche. Regola di cittadinanza (constraint 3): NON sparare
// traffico a caso su tutte. Il default è UN solo endpoint (l'istanza principale); i mirror sono
// opt-in. Il pool sceglie l'endpoint più «sano», apre il circuito su un endpoint che fallisce di
// continuo (per non martellarlo), lo ri-prova con cautela dopo un cooldown (half-open) e lo richiude
// al primo successo. Deterministico: l'orologio è iniettato.
//
// Stati del circuito per endpoint:
//   closed     → normale; si può usare.
//   open       → troppi fallimenti consecutivi; NON usare fino a `openUntil`.
//   half-open  → passato il cooldown: un solo tentativo di prova; successo→closed, fallimento→open.

/** Endpoint di default: l'istanza principale Overpass. I mirror si aggiungono via configurazione. */
export const DEFAULT_OVERPASS_ENDPOINTS = ["https://overpass-api.de/api/interpreter"] as const;

/**
 * Mirror pubblici NOTI e approvati per uso rispettoso (opt-in, non attivi di default). Elencati per
 * riferimento/config; l'attivazione è una scelta operativa esplicita, non automatica.
 */
export const KNOWN_OVERPASS_MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
] as const;

export type CircuitState = "closed" | "open" | "half-open";

export interface EndpointHealth {
  endpoint: string;
  state: CircuitState;
  consecutiveFailures: number;
  /** Contatori cumulativi per il punteggio di salute (non-PII). */
  totalOk: number;
  totalFail: number;
  /** Timestamp (ms) fino al quale il circuito resta aperto; 0 se chiuso. */
  openUntilMs: number;
}

export interface EndpointPoolOptions {
  /** Fallimenti consecutivi che aprono il circuito (default 4: un singolo giro di retry non lo apre). */
  failureThreshold?: number;
  /** Durata dell'apertura prima del tentativo half-open (default 60s). */
  cooldownMs?: number;
  /** Orologio iniettabile per determinismo nei test. */
  now?: () => Date;
}

/**
 * Pool di endpoint con circuito e salute. Non fa rete: decide SOLO quale endpoint usare e registra
 * l'esito. L'adattatore (osm.ts) lo interroga a ogni tentativo.
 */
export class OverpassEndpointPool {
  private readonly order: string[];
  private readonly health = new Map<string, EndpointHealth>();
  private readonly failureThreshold: number;
  private readonly cooldownMs: number;
  private readonly now: () => Date;

  constructor(endpoints: readonly string[] = DEFAULT_OVERPASS_ENDPOINTS, options: EndpointPoolOptions = {}) {
    const unique = [...new Set(endpoints)].filter((e) => e.trim().length > 0);
    if (unique.length === 0) throw new Error("OverpassEndpointPool: nessun endpoint approvato configurato.");
    this.order = unique;
    this.failureThreshold = Math.max(1, options.failureThreshold ?? 4);
    this.cooldownMs = Math.max(0, options.cooldownMs ?? 60_000);
    this.now = options.now ?? (() => new Date());
    for (const e of unique) {
      this.health.set(e, { endpoint: e, state: "closed", consecutiveFailures: 0, totalOk: 0, totalFail: 0, openUntilMs: 0 });
    }
  }

  /** Numero di endpoint nel pool. */
  get size(): number {
    return this.order.length;
  }

  /** Aggiorna lo stato «effettivo» di un endpoint: un aperto scaduto diventa half-open. */
  private effectiveState(h: EndpointHealth, nowMs: number): CircuitState {
    if (h.state === "open" && nowMs >= h.openUntilMs) {
      h.state = "half-open";
    }
    return h.state;
  }

  /**
   * Sceglie l'endpoint da usare ora, oppure `null` se sono tutti in circuito aperto (→ il chiamante
   * NON deve chiamare la rete). Preferenza: prima i `closed`/`half-open`, ordinati per meno
   * fallimenti consecutivi e poi per ordine di configurazione (deterministico).
   */
  pick(): string | null {
    const nowMs = this.now().getTime();
    const usable: EndpointHealth[] = [];
    for (const e of this.order) {
      const h = this.health.get(e)!;
      if (this.effectiveState(h, nowMs) !== "open") usable.push(h);
    }
    if (usable.length === 0) return null;
    usable.sort((a, b) => {
      if (a.consecutiveFailures !== b.consecutiveFailures) return a.consecutiveFailures - b.consecutiveFailures;
      return this.order.indexOf(a.endpoint) - this.order.indexOf(b.endpoint);
    });
    return usable[0].endpoint;
  }

  /** Registra un successo: chiude il circuito e azzera i fallimenti consecutivi. */
  recordSuccess(endpoint: string): void {
    const h = this.health.get(endpoint);
    if (!h) return;
    h.state = "closed";
    h.consecutiveFailures = 0;
    h.openUntilMs = 0;
    h.totalOk += 1;
  }

  /**
   * Registra un fallimento TRANSITORIO (rate-limit/timeout/rete): incrementa i fallimenti consecutivi
   * e, oltre soglia (o subito se era half-open), apre il circuito per `cooldownMs`.
   */
  recordFailure(endpoint: string): void {
    const h = this.health.get(endpoint);
    if (!h) return;
    h.totalFail += 1;
    h.consecutiveFailures += 1;
    const wasHalfOpen = h.state === "half-open";
    if (wasHalfOpen || h.consecutiveFailures >= this.failureThreshold) {
      h.state = "open";
      h.openUntilMs = this.now().getTime() + this.cooldownMs;
    }
  }

  /** Istantanea della salute (per osservabilità/diagnostica). Copia difensiva. */
  snapshot(): EndpointHealth[] {
    const nowMs = this.now().getTime();
    return this.order.map((e) => {
      const h = this.health.get(e)!;
      this.effectiveState(h, nowMs);
      return { ...h };
    });
  }
}
