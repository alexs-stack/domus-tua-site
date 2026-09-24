// Test delle transizioni di approvazione e delle operazioni non valide (Prompt 6).

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  setPoiApproval,
  approveRecord,
  disableRecord,
  markRecordStale,
  diffDraftAgainstApproved,
  ApprovalError,
} from "../approval";
import { TERRITORY_SCHEMA_VERSION } from "../constants";
import type { ListingTerritoryEnrichment, TerritoryPoi } from "../types";

const AT = "2026-08-13T10:00:00.000Z";
const ACTOR = { approver: "raffaela", at: AT, note: "ok" };

function poi(providerId: string, name: string, distanceMeters: number): TerritoryPoi {
  return {
    providerId,
    category: "pharmacy",
    name,
    distanceMeters,
    distanceMethod: "straight-line",
    source: { provider: "fake", retrievedAt: AT, attribution: "© Test" },
    approval: { state: "draft" },
  };
}

function draft(over: Partial<ListingTerritoryEnrichment> = {}): ListingTerritoryEnrichment {
  return {
    schemaVersion: TERRITORY_SCHEMA_VERSION,
    realSmartCode: "1043",
    municipality: "tradate",
    originPrecision: "municipality-centroid",
    originAccuracyMeters: 2000,
    originLabel: "Tradate",
    origin: { lat: 45.708, lng: 8.906 },
    fingerprint: {
      municipality: "tradate",
      coordKey: "45.708,8.906",
      ultimaModifica: "2026-08-01",
      schemaVersion: TERRITORY_SCHEMA_VERSION,
      hash: "deadbeef",
    },
    status: "draft",
    pois: over.pois ?? [poi("a", "Farmacia A", 120), poi("b", "Farmacia B", 300)],
    retrievedAt: AT,
    updatedAt: AT,
    ...over,
  };
}

describe("setPoiApproval", () => {
  test("approva i POI indicati, con approver e timestamp", () => {
    const out = setPoiApproval(draft(), ["a"], "approved", ACTOR);
    const a = out.pois.find((p) => p.providerId === "a");
    assert.equal(a?.approval.state, "approved");
    assert.equal(a?.approval.approvedBy, "raffaela");
    assert.equal(a?.approval.approvedAt, AT);
    // il record resta draft: approvare i POI non pubblica da solo
    assert.equal(out.status, "draft");
    // gli altri POI restano invariati
    assert.equal(out.pois.find((p) => p.providerId === "b")?.approval.state, "draft");
  });

  test("rifiuta i POI indicati", () => {
    const out = setPoiApproval(draft(), ["b"], "rejected", ACTOR);
    assert.equal(out.pois.find((p) => p.providerId === "b")?.approval.state, "rejected");
  });

  test("ID sconosciuto → errore", () => {
    assert.throws(() => setPoiApproval(draft(), ["zzz"], "approved", ACTOR), ApprovalError);
  });

  test("nessun ID → errore (no approva-tutto implicito)", () => {
    assert.throws(() => setPoiApproval(draft(), [], "approved", ACTOR), ApprovalError);
  });

  test("approver mancante → errore", () => {
    assert.throws(
      () => setPoiApproval(draft(), ["a"], "approved", { approver: "", at: AT }),
      ApprovalError,
    );
  });
});

describe("approveRecord", () => {
  test("approva l'intero record, congela lo snapshot pubblico", () => {
    const out = approveRecord(draft(), ACTOR);
    assert.equal(out.status, "approved");
    assert.equal(out.approval?.approvedBy, "raffaela");
    assert.equal(out.approval?.approvedAt, AT);
    assert.ok(out.pois.every((p) => p.approval.state === "approved"));
    assert.ok(out.lastApprovedPublic, "deve congelare il pubblico approvato");
    assert.equal(out.lastApprovedPublic?.pois.length, 2);
  });

  test("i POI già rifiutati NON vengono approvati", () => {
    const withRejected = setPoiApproval(draft(), ["b"], "rejected", ACTOR);
    const out = approveRecord(withRejected, ACTOR);
    assert.equal(out.pois.find((p) => p.providerId === "b")?.approval.state, "rejected");
    assert.equal(out.lastApprovedPublic?.pois.length, 1); // solo A nel pubblico
  });

  test("tutti i POI rifiutati → niente da approvare → errore", () => {
    let rec = setPoiApproval(draft(), ["a"], "rejected", ACTOR);
    rec = setPoiApproval(rec, ["b"], "rejected", ACTOR);
    assert.throws(() => approveRecord(rec, ACTOR), ApprovalError);
  });

  test("record stale → non approvabile (nessun pubblico)", () => {
    const stale = draft({ retrievedAt: "2024-01-01T00:00:00.000Z" });
    assert.throws(() => approveRecord(stale, ACTOR), ApprovalError);
  });

  test("record non valido → errore", () => {
    const bad = { ...draft(), status: "published" } as unknown as ListingTerritoryEnrichment;
    assert.throws(() => approveRecord(bad, ACTOR), ApprovalError);
  });

  test("approver mancante → errore", () => {
    assert.throws(() => approveRecord(draft(), { approver: "", at: AT }), ApprovalError);
  });
});

describe("disableRecord / markRecordStale", () => {
  test("disable → status disabled, dati conservati", () => {
    const out = disableRecord(draft(), ACTOR);
    assert.equal(out.status, "disabled");
    assert.equal(out.pois.length, 2);
    assert.equal(out.approval?.approvedBy, "raffaela");
  });

  test("stale → status stale", () => {
    assert.equal(markRecordStale(draft(), AT).status, "stale");
  });
});

describe("diffDraftAgainstApproved", () => {
  test("confronta draft e ultimo approvato per categoria+nome", () => {
    // Approvato: A e B. Nuova bozza: A (invariato) e C (nuovo), B rimosso.
    const approved = approveRecord(draft(), ACTOR);
    const newDraft: ListingTerritoryEnrichment = {
      ...approved,
      status: "draft",
      pois: [poi("a", "Farmacia A", 120), poi("c", "Farmacia C", 200)],
    };
    const diff = diffDraftAgainstApproved(newDraft);
    assert.deepEqual(diff.added.map((e) => e.name), ["Farmacia C"]);
    assert.deepEqual(diff.removed.map((e) => e.name), ["Farmacia B"]);
    assert.deepEqual(diff.unchanged.map((e) => e.name), ["Farmacia A"]);
  });

  test("senza approvato precedente → tutto 'added'", () => {
    const diff = diffDraftAgainstApproved(draft());
    assert.equal(diff.added.length, 2);
    assert.equal(diff.removed.length, 0);
  });
});
