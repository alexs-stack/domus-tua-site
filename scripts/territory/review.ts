// CLI editoriale dell'arricchimento territoriale (Prompt 6).
//
// Comandi controllati per la review umana: elenca le bozze, ispeziona un record, approva/rifiuta
// POI o l'intero record, disabilita o marca stale, confronta bozza e approvato. NESSUNA AI, nessun
// token o endpoint di scrittura nel browser: si opera solo da terminale, sul RealSmart code.
//
// Sicurezza dell'output: non stampa MAI coordinate esatte né chiavi. --dry-run mostra cosa
// cambierebbe senza scrivere. Serve sempre un codice esplicito: nessun "approva tutto".
//
// USO:
//   npm run territory:review -- list [--status=draft]
//   npm run territory:review -- show <codice>
//   npm run territory:review -- compare <codice>
//   npm run territory:review -- approve <codice> --by=<nome> [--note="..."] [--dry-run]
//   npm run territory:review -- approve-poi <codice> --ids=<id1,id2> --by=<nome> [--dry-run]
//   npm run territory:review -- reject-poi <codice> --ids=<id1,id2> --by=<nome> [--dry-run]
//   npm run territory:review -- disable <codice> --by=<nome> [--dry-run]
//   npm run territory:review -- stale <codice> [--dry-run]

import "../load-env";

import { createTerritoryRepository } from "../../app/lib/territory/store/config";
import type { TerritoryRepository } from "../../app/lib/territory/store/repository";
import type { ListingTerritoryEnrichment, EnrichmentStatus } from "../../app/lib/territory/types";
import {
  approveRecord,
  disableRecord,
  markRecordStale,
  setPoiApproval,
  diffDraftAgainstApproved,
} from "../../app/lib/territory/approval";

// ── Parsing argomenti ─────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const command = argv[0];
const positionals = argv.slice(1).filter((a) => !a.startsWith("--"));
const flags = new Map<string, string>();
for (const a of argv) {
  if (a.startsWith("--")) {
    const [k, v] = a.slice(2).split("=");
    flags.set(k, v ?? "true");
  }
}
const dryRun = flags.has("dry-run");
const nowIso = () => new Date().toISOString();

function fail(message: string): never {
  console.error(`✗ ${message}`);
  process.exit(1);
}

function requireCode(): string {
  const code = positionals[0];
  if (!code) fail("Codice RealSmart mancante. Specifica un codice esplicito (nessun 'approva tutto').");
  return code;
}

function requireBy(): string {
  const by = flags.get("by");
  if (!by || by === "true") fail("--by=<nome> obbligatorio: ogni operazione registra chi approva.");
  return by;
}

function requireIds(): string[] {
  const raw = flags.get("ids");
  const ids = (raw ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (ids.length === 0) fail("--ids=<id1,id2> obbligatorio: elenca i POI espliciti da modificare.");
  return ids;
}

async function loadRecord(repo: TerritoryRepository, code: string): Promise<ListingTerritoryEnrichment> {
  const rec = await repo.getListingEnrichment(code);
  if (!rec) fail(`Nessun record per il codice ${code}.`);
  return rec;
}

/** Scrive con concorrenza ottimistica, oppure spiega cosa farebbe in dry-run. */
async function persist(
  repo: TerritoryRepository,
  before: ListingTerritoryEnrichment,
  after: ListingTerritoryEnrichment,
): Promise<void> {
  if (dryRun) {
    console.log(`  (dry-run) ${before.realSmartCode}: ${before.status} → ${after.status}, nessuna scrittura.`);
    return;
  }
  await repo.putListingEnrichment(after, { ifUpdatedAt: before.updatedAt });
  console.log(`  ✓ ${after.realSmartCode}: salvato (status ${after.status}).`);
}

// ── Stampa sicura (mai coordinate, mai chiavi) ─────────────────────────────────
function printPoi(p: ListingTerritoryEnrichment["pois"][number]): void {
  console.log(
    `    - [${p.approval.state}] ${p.category} · ${p.name} · ~${p.distanceMeters} m ${p.distanceMethod} ` +
      `· ${p.source.provider} · ${p.source.retrievedAt} · id=${p.providerId}`,
  );
}

function printRecord(rec: ListingTerritoryEnrichment): void {
  // NB: origin/coord NON vengono stampati (server-only).
  console.log(`Immobile ${rec.realSmartCode} — comune ${rec.municipality}`);
  console.log(`  status: ${rec.status} · schema v${rec.schemaVersion} · aggiornato ${rec.updatedAt}`);
  console.log(
    `  origine: ${rec.originPrecision} (±${rec.originAccuracyMeters} m, base "${rec.originLabel}", ` +
      `coordinate non mostrate) · impronta ${rec.fingerprint.hash}`,
  );
  if (rec.originAuthorization) {
    console.log(
      `  origine autorizzata: ${rec.originAuthorization.precision} — ${rec.originAuthorization.source} ` +
        `(${rec.originAuthorization.reviewedBy} @ ${rec.originAuthorization.reviewedAt})`,
    );
  }
  if (rec.failure) console.log(`  ⚠ ultimo fallimento: ${rec.failure.kind} @ ${rec.failure.at}`);
  if (rec.approval) console.log(`  approvato da ${rec.approval.approvedBy} @ ${rec.approval.approvedAt}`);
  console.log(`  POI (${rec.pois.length}):`);
  rec.pois.forEach(printPoi);
  if (rec.lastApprovedPublic) {
    console.log(`  ultimo pubblico approvato: ${rec.lastApprovedPublic.pois.length} POI`);
  }
}

// ── Comandi ────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  const repo = createTerritoryRepository();

  switch (command) {
    case "list": {
      const statusFilter = flags.get("status") as EnrichmentStatus | undefined;
      const meta = await repo.listEnrichmentMetadata();
      const rows = statusFilter ? meta.filter((m) => m.status === statusFilter) : meta;
      if (rows.length === 0) {
        console.log("Nessun record." + (statusFilter ? ` (status=${statusFilter})` : ""));
        return;
      }
      console.log(`codice        comune               status     POI  appr.  aggiornato`);
      for (const m of rows) {
        console.log(
          `${m.realSmartCode.padEnd(13)} ${m.municipality.padEnd(20)} ${m.status.padEnd(10)} ` +
            `${String(m.poiCount).padStart(3)}  ${String(m.approvedPoiCount).padStart(4)}   ${m.retrievedAt}`,
        );
      }
      return;
    }

    case "show": {
      printRecord(await loadRecord(repo, requireCode()));
      return;
    }

    case "compare": {
      const rec = await loadRecord(repo, requireCode());
      const diff = diffDraftAgainstApproved(rec);
      console.log(`Confronto bozza ↔ ultimo approvato per ${rec.realSmartCode}:`);
      console.log(`  + aggiunti (${diff.added.length}): ${diff.added.map((e) => e.name).join(", ") || "—"}`);
      console.log(`  - rimossi  (${diff.removed.length}): ${diff.removed.map((e) => e.name).join(", ") || "—"}`);
      console.log(`  = invariati(${diff.unchanged.length}): ${diff.unchanged.map((e) => e.name).join(", ") || "—"}`);
      return;
    }

    case "approve": {
      const before = await loadRecord(repo, requireCode());
      const after = approveRecord(before, { approver: requireBy(), at: nowIso(), ...(flags.get("note") ? { note: flags.get("note") } : {}) });
      console.log(`Approvazione ${before.realSmartCode}: ${after.lastApprovedPublic?.pois.length} POI pubblici.`);
      await persist(repo, before, after);
      return;
    }

    case "approve-poi":
    case "reject-poi": {
      const before = await loadRecord(repo, requireCode());
      const state = command === "approve-poi" ? "approved" : "rejected";
      const after = setPoiApproval(before, requireIds(), state, {
        approver: requireBy(),
        at: nowIso(),
        ...(flags.get("note") ? { note: flags.get("note") } : {}),
      });
      console.log(`${state === "approved" ? "Approvati" : "Rifiutati"} ${requireIds().length} POI su ${before.realSmartCode}.`);
      await persist(repo, before, after);
      return;
    }

    case "disable": {
      const before = await loadRecord(repo, requireCode());
      const after = disableRecord(before, { approver: requireBy(), at: nowIso() });
      await persist(repo, before, after);
      return;
    }

    case "stale": {
      const before = await loadRecord(repo, requireCode());
      const after = markRecordStale(before, nowIso());
      await persist(repo, before, after);
      return;
    }

    default:
      fail(
        `Comando sconosciuto: ${command ?? "(nessuno)"}. Usa: list | show | compare | approve | ` +
          `approve-poi | reject-poi | disable | stale.`,
      );
  }
}

main().catch((err) => {
  console.error("✗ errore:", err instanceof Error ? err.message : err);
  process.exit(1);
});
