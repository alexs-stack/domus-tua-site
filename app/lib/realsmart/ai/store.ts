// Persistenza della copy generata — INTERFACCIA + implementazione in-memory.
//
// Il mandato è esplicito: "do not add a vendor silently. Implement the generation core and
// persistence interface, then propose the smallest deployment option." Qui c'è quindi il CONTRATTO
// (`GeneratedCopyStore`) e un'implementazione in memoria (dev/test/anteprima). La versione durevole
// — un solo JSON per record, o una tabella — si aggancia dietro la stessa interfaccia senza toccare
// il core. Proposta in docs/ai-enrichment.md.

import type { CopyStatus, GeneratedCopyRecord } from "./record";

export interface GeneratedCopyStore {
  /** Record per (annuncio, hash della fonte), se esiste. */
  get(listingId: string, sourceHash: string): Promise<GeneratedCopyRecord | null>;
  /** La copy PUBLISHED corrente di un annuncio, se esiste (quella che il sito può applicare). */
  getPublished(listingId: string): Promise<GeneratedCopyRecord | null>;
  /** Crea/aggiorna un record (chiave: listingId + sourceHash). */
  put(record: GeneratedCopyRecord): Promise<void>;
  /** Tutti i record in un dato stato (per il report di revisione). */
  listByStatus(status: CopyStatus): Promise<GeneratedCopyRecord[]>;
}

/** Chiave interna. */
const key = (listingId: string, sourceHash: string) => `${listingId}:${sourceHash}`;

/**
 * Store in memoria. Per-processo: perfetto per test e batch offline, NON durevole tra deploy.
 * In produzione va sostituito da un'implementazione durevole dietro la stessa interfaccia.
 */
export class InMemoryGeneratedCopyStore implements GeneratedCopyStore {
  private readonly map = new Map<string, GeneratedCopyRecord>();

  async get(listingId: string, sourceHash: string): Promise<GeneratedCopyRecord | null> {
    return this.map.get(key(listingId, sourceHash)) ?? null;
  }

  async getPublished(listingId: string): Promise<GeneratedCopyRecord | null> {
    for (const r of this.map.values()) {
      if (r.listingId === listingId && r.status === "published") return r;
    }
    return null;
  }

  async put(record: GeneratedCopyRecord): Promise<void> {
    // Un solo record "published" per annuncio: pubblicandone uno, gli altri published dello stesso
    // annuncio tornano "review" (storicizzati), così il sito non trova due verità.
    if (record.status === "published") {
      for (const [k, r] of this.map) {
        if (r.listingId === record.listingId && r.status === "published" && k !== key(record.listingId, record.sourceHash)) {
          this.map.set(k, { ...r, status: "review" });
        }
      }
    }
    this.map.set(key(record.listingId, record.sourceHash), record);
  }

  async listByStatus(status: CopyStatus): Promise<GeneratedCopyRecord[]> {
    return [...this.map.values()].filter((r) => r.status === status);
  }
}
