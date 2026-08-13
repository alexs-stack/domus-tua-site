// Livello di SERVIZIO della review editoriale (Prompt 10) — tipizzato, server-only.
//
// È il cuore del workspace editoriale, indipendente da CLI o UI: entrambe lo chiamano. Ogni SCRITTURA
//   • usa CONCORRENZA OTTIMISTICA (ifUpdatedAt): un editor con dati vecchi non sovrascrive lavoro nuovo;
//   • registra un evento di AUDIT immutabile (attore + ora + motivo);
//   • NON pubblica mai in automatico dati generati: la pubblicazione è un'azione editoriale esplicita.
// Le COORDINATE non escono di default: la vista di review mostra etichette leggibili; le coordinate
// solo a un editor autorizzato che le richiede.

import {
  approveRecord,
  disableRecord,
  setPoiApproval,
  diffDraftAgainstApproved,
  ApprovalError,
  type TerritoryDiff,
} from "../approval";
import type { EnrichmentMetadata, TerritoryRepository } from "../store/repository";
import type {
  ListingTerritoryEnrichment,
  TerritoryAuditEvent,
  TerritoryAuditAction,
  EnrichmentStatus,
} from "../types";

export interface ReviewActor {
  actor: string;
  at: string;
  note?: string;
}

/** Stati che entrano nella coda di review. */
const REVIEWABLE: ReadonlySet<EnrichmentStatus> = new Set(["draft", "stale", "failed"]);

export interface ReviewSummary extends EnrichmentMetadata {
  /** Versione per la concorrenza ottimistica: l'editor la rimanda alla scrittura. */
  version: string;
}

/** POI in forma di review: SENZA coordinate di default. */
export interface ReviewPoi {
  providerId: string;
  category: string;
  name: string;
  distanceMeters: number;
  approvalState: "draft" | "approved" | "rejected";
  sourceOwner: string;
  sourceUrl?: string;
  retrievedAt: string;
  /** Solo se l'editor è autorizzato e le chiede. */
  coord?: { lat: number; lng: number };
}

export interface ReviewItem {
  realSmartCode: string;
  municipality: string;
  status: EnrichmentStatus;
  /** Base d'origine LEGGIBILE (precisione + etichetta), mai coordinate di default. */
  originBasis: { precision: string; label: string; accuracyMeters: number };
  /** Coordinata d'origine SOLO se autorizzato. */
  originCoord?: { lat: number; lng: number };
  fingerprintHash: string;
  retrievedAt: string;
  pois: ReviewPoi[];
  /** Cosa è cambiato rispetto all'ultimo approvato (perché il refresh). */
  diff: TerritoryDiff;
  /** Cronologia immutabile delle decisioni su questo immobile. */
  audit: TerritoryAuditEvent[];
  version: string;
}

export interface BulkApprovePlan {
  /** Codici che verrebbero approvati insieme (stesso profilo/impronta). */
  codes: string[];
  fingerprintHash: string;
  /** Riepilogo di conferma da mostrare PRIMA di applicare. */
  summary: string;
}

export class TerritoryReviewService {
  constructor(
    private readonly repo: TerritoryRepository,
    private readonly deps: { now: () => Date; freshnessDays?: number; maxPerCategory?: number } = { now: () => new Date() },
  ) {}

  // ── Lettura ────────────────────────────────────────────────────────────────

  /** Coda di review: draft/stale/failed (metadati leggeri, con versione). */
  async listForReview(filter?: { status?: EnrichmentStatus }): Promise<ReviewSummary[]> {
    const all = await this.repo.listEnrichmentMetadata();
    return all
      .filter((m) => (filter?.status ? m.status === filter.status : REVIEWABLE.has(m.status)))
      .map((m) => ({ ...m, version: m.updatedAt }));
  }

  /** Dettaglio di un immobile per la review. Coordinate SOLO con `includeCoordinates` (autorizzato). */
  async getReviewItem(
    code: string,
    opts: { includeCoordinates?: boolean } = {},
  ): Promise<ReviewItem | null> {
    const rec = await this.repo.getListingEnrichment(code);
    if (!rec) return null;
    const audit = await this.repo.listAuditEvents({ realSmartCode: code });
    return {
      realSmartCode: rec.realSmartCode,
      municipality: rec.municipality,
      status: rec.status,
      originBasis: { precision: rec.originPrecision, label: rec.originLabel, accuracyMeters: rec.originAccuracyMeters },
      ...(opts.includeCoordinates ? { originCoord: { ...rec.origin } } : {}),
      fingerprintHash: rec.fingerprint.hash,
      retrievedAt: rec.retrievedAt,
      pois: rec.pois.map((p) => ({
        providerId: p.providerId,
        category: p.category,
        name: p.name,
        distanceMeters: p.distanceMeters,
        approvalState: p.approval.state,
        sourceOwner: p.source.attribution,
        ...(p.source.sourceUrl ? { sourceUrl: p.source.sourceUrl } : {}),
        retrievedAt: p.source.retrievedAt,
        ...(opts.includeCoordinates && p.coord ? { coord: { ...p.coord } } : {}),
      })),
      diff: diffDraftAgainstApproved(rec),
      audit,
      version: rec.updatedAt,
    };
  }

  async getAudit(code: string): Promise<TerritoryAuditEvent[]> {
    return this.repo.listAuditEvents({ realSmartCode: code });
  }

  // ── Scritture (concorrenza ottimistica + audit) ──────────────────────────────

  private async writeWithConcurrency(
    code: string,
    expectedVersion: string,
    transform: (rec: ListingTerritoryEnrichment) => ListingTerritoryEnrichment,
    auditEvent: { action: TerritoryAuditAction; actor: string; at: string; note?: string; toStatus?: EnrichmentStatus },
    fromStatus: EnrichmentStatus,
  ): Promise<ListingTerritoryEnrichment> {
    const rec = await this.repo.getListingEnrichment(code);
    if (!rec) throw new ApprovalError(`Immobile ${code} non trovato.`);
    const next = transform(rec);
    // ifUpdatedAt = la versione che l'editor ha visto: se qualcuno ha scritto nel frattempo, fallisce.
    await this.repo.putListingEnrichment(next, { ifUpdatedAt: expectedVersion });
    await this.repo.appendAuditEvent({
      at: auditEvent.at,
      action: auditEvent.action,
      actor: auditEvent.actor,
      realSmartCode: code,
      municipality: rec.municipality,
      fromStatus,
      ...(auditEvent.toStatus ? { toStatus: auditEvent.toStatus } : {}),
      ...(auditEvent.note ? { note: auditEvent.note } : {}),
    });
    return next;
  }

  /** Approva e PUBBLICA un immobile (azione esplicita: nessun auto-publish). */
  async approveListing(code: string, expectedVersion: string, actor: ReviewActor): Promise<ListingTerritoryEnrichment> {
    const fromStatus = (await this.repo.getListingEnrichment(code))?.status ?? "draft";
    return this.writeWithConcurrency(
      code,
      expectedVersion,
      (rec) =>
        approveRecord(rec, {
          approver: actor.actor,
          at: actor.at,
          ...(actor.note ? { note: actor.note } : {}),
          freshnessDays: this.deps.freshnessDays,
          maxPerCategory: this.deps.maxPerCategory,
        }),
      { action: "approve", actor: actor.actor, at: actor.at, note: actor.note, toStatus: "approved" },
      fromStatus,
    );
  }

  /** Approva/rifiuta singoli POI (per providerId), senza cambiare lo status del record. */
  async setPoiDecisions(
    code: string,
    expectedVersion: string,
    providerIds: string[],
    state: "approved" | "rejected" | "draft",
    actor: ReviewActor,
  ): Promise<ListingTerritoryEnrichment> {
    const fromStatus = (await this.repo.getListingEnrichment(code))?.status ?? "draft";
    return this.writeWithConcurrency(
      code,
      expectedVersion,
      (rec) => setPoiApproval(rec, providerIds, state, { approver: actor.actor, at: actor.at, ...(actor.note ? { note: actor.note } : {}) }),
      { action: state === "rejected" ? "reject" : "approve", actor: actor.actor, at: actor.at, note: actor.note },
      fromStatus,
    );
  }

  /** Ritira dal pubblico (unpublish/disable), conservando i dati. */
  async unpublish(code: string, expectedVersion: string, actor: ReviewActor): Promise<ListingTerritoryEnrichment> {
    const fromStatus = (await this.repo.getListingEnrichment(code))?.status ?? "approved";
    return this.writeWithConcurrency(
      code,
      expectedVersion,
      (rec) => disableRecord(rec, { approver: actor.actor, at: actor.at, ...(actor.note ? { note: actor.note } : {}) }),
      { action: "unpublish", actor: actor.actor, at: actor.at, note: actor.note, toStatus: "disabled" },
      fromStatus,
    );
  }

  /** Aggiunge una nota editoriale SENZA cambiare stato (traccia di audit). */
  async addNote(code: string, actor: ReviewActor & { note: string }): Promise<TerritoryAuditEvent> {
    const rec = await this.repo.getListingEnrichment(code);
    if (!rec) throw new ApprovalError(`Immobile ${code} non trovato.`);
    return this.repo.appendAuditEvent({
      at: actor.at,
      action: "note", // nota editoriale: nessun cambio di stato
      actor: actor.actor,
      realSmartCode: code,
      municipality: rec.municipality,
      note: actor.note,
    });
  }

  // ── Approvazione in blocco (solo stesso profilo, con conferma) ────────────────

  /** Prepara un piano di approvazione in blocco: SOLO record con la STESSA impronta di profilo. */
  async planBulkApprove(codes: string[]): Promise<BulkApprovePlan> {
    const recs = await Promise.all(codes.map((c) => this.repo.getListingEnrichment(c)));
    const present = recs.filter((r): r is ListingTerritoryEnrichment => r !== null);
    const hashes = new Set(present.map((r) => r.fingerprint.hash));
    if (hashes.size !== 1) {
      throw new ApprovalError(
        `Approvazione in blocco ammessa solo per lo STESSO profilo: trovate ${hashes.size} impronte diverse.`,
      );
    }
    const fingerprintHash = [...hashes][0];
    const municipality = present[0]?.municipality ?? "?";
    return {
      codes: present.map((r) => r.realSmartCode),
      fingerprintHash,
      summary: `Approvazione in blocco di ${present.length} immobili nel comune ${municipality}, stesso profilo (impronta ${fingerprintHash}).`,
    };
  }

  /** Applica il piano SOLO se `confirm` è true (conferma esplicita richiesta). */
  async applyBulkApprove(plan: BulkApprovePlan, actor: ReviewActor, confirm: boolean): Promise<number> {
    if (!confirm) throw new ApprovalError("Approvazione in blocco non confermata: passare confirm=true.");
    let approved = 0;
    for (const code of plan.codes) {
      const rec = await this.repo.getListingEnrichment(code);
      if (!rec) continue;
      await this.approveListing(code, rec.updatedAt, actor);
      approved += 1;
    }
    return approved;
  }
}
