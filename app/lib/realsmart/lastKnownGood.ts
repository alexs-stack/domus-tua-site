// Store dell'ULTIMO SNAPSHOT BUONO del feed RealSmart — l'astrazione dietro il fail-safe "stale".
//
// PERCHÉ un'interfaccia. Oggi l'ultimo-buono vive in memoria dell'istanza (best-effort, per-worker
// serverless): copre il caso comune — un blip del feed durante una rivalidazione su un'istanza già
// calda — senza introdurre infrastruttura. Ma a freddo, o su un'altra istanza, non c'è. Un adapter
// DUREVOLE (condiviso tra istanze e deploy) elimina quel buco. Lo teniamo dietro un'interfaccia:
//   • `memory`   — default, deterministico, per-istanza (test e runtime senza infra);
//   • `durable`  — stub fail-safe finché non è approvato un servizio (vedi PIANO DI MIGRAZIONE).
//
// COMPATIBILITÀ CON LO STORAGE TERRITORY. Quando lo store durevole di Territory V2 (Prompt 7) sarà
// approvato e configurato (Supabase o equivalente), l'adapter durevole qui sotto ci si appoggia:
// una singola riga versionata `realsmart_last_known_good` (snapshot JSON + fetchedAt originale),
// letta/scritta server-side, mai esposta al browser. Interfaccia identica, così il passaggio è una
// sola sostituzione di adapter senza toccare client.ts.
//
// PIANO DI MIGRAZIONE (da eseguire solo dopo approvazione dello store durevole):
//   1. creare la tabella/riga `realsmart_last_known_good` nello store approvato;
//   2. implementare createDurableLastKnownGoodStore() contro quello store (read/write server-only);
//   3. selezionare l'adapter con `REALSMART_LKG_STORE="durable"` (default resta "memory");
//   4. a runtime: scrittura su ogni fetch live riuscita, lettura come fallback prima del fail-closed.
// Finché non è approvato, l'adapter durevole NON è attivabile: fallisce in modo sicuro verso memory.

import type { ListingsSnapshot } from "./client";

export interface LastKnownGoodStore {
  /** Ultimo snapshot buono conosciuto, o null se non ce n'è. Mai lancia. */
  read(): Promise<ListingsSnapshot | null>;
  /** Registra uno snapshot buono (chiamato SOLO su fetch live riuscita). Mai lancia. */
  write(snapshot: ListingsSnapshot): Promise<void>;
  /** Etichetta diagnostica dell'adapter attivo (per /api/health), senza segreti. */
  readonly kind: "memory" | "durable";
}

/**
 * Adapter in-memory: per-istanza, best-effort. Sopravvive finché l'istanza resta calda.
 * È il default di runtime e l'unico usato nei test (deterministico, resettabile).
 */
export function createMemoryLastKnownGoodStore(): LastKnownGoodStore & { reset(): void } {
  let good: ListingsSnapshot | null = null;
  return {
    kind: "memory",
    async read() {
      return good;
    },
    async write(snapshot) {
      good = snapshot;
    },
    reset() {
      good = null;
    },
  };
}

/**
 * Selettore dell'adapter. Oggi ritorna SEMPRE memory: lo store durevole non è approvato/implementato
 * (vedi piano di migrazione). Anche con `REALSMART_LKG_STORE="durable"` si ripiega su memory con un
 * avviso — mai un errore a runtime, mai un servizio esterno attivato di nascosto.
 */
export function selectLastKnownGoodStore(): LastKnownGoodStore {
  if (process.env.REALSMART_LKG_STORE?.trim() === "durable") {
    console.warn(
      "[realsmart] REALSMART_LKG_STORE=durable richiesto ma l'adapter durevole non è ancora " +
        "implementato/approvato: si usa l'ultimo-buono in memoria (per-istanza).",
    );
  }
  return createMemoryLastKnownGoodStore();
}
