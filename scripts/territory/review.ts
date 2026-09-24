// CLI editoriale dell'arricchimento territoriale (Prompt 6, esteso in Prompt 10).
//
// Comandi controllati per la review umana: elenca la coda, ispeziona un record, confronta bozza e
// approvato, approva/rifiuta POI o l'intero record, ritira dal pubblico, annota, approva in blocco
// (SOLO stesso profilo e con conferma) ed emette il pacchetto di review deterministico (JSON/MD).
//
// Tutte le SCRITTURE passano da TerritoryReviewService: concorrenza ottimistica + audit immutabile in
// un solo punto. NESSUNA AI, nessun token o endpoint di scrittura: si opera solo da terminale, sul
// RealSmart code. Le coordinate NON si stampano mai, tranne nel pacchetto con --with-coordinates
// (editor autorizzato). --dry-run mostra cosa cambierebbe senza scrivere. Serve sempre un codice
// esplicito: nessun "approva tutto" implicito.
//
// USO:
//   npm run territory:review -- list [--status=draft]
//   npm run territory:review -- show <codice>
//   npm run territory:review -- compare <codice>
//   npm run territory:review -- approve <codice> --by=<nome> [--note="..."] [--dry-run]
//   npm run territory:review -- approve-poi <codice> --ids=<id1,id2> --by=<nome> [--dry-run]
//   npm run territory:review -- reject-poi <codice> --ids=<id1,id2> --by=<nome> [--dry-run]
//   npm run territory:review -- unpublish <codice> --by=<nome> [--note="..."] [--dry-run]
//   npm run territory:review -- note <codice> --by=<nome> --note="..."
//   npm run territory:review -- bulk-approve --codes=<c1,c2> --by=<nome> [--confirm] [--dry-run]
//   npm run territory:review -- pack [--municipality=<slug>] [--status=draft] [--format=md|json]
//                                    [--with-coordinates] [--out=<file>]

import "../load-env";

import { createTerritoryRepository } from "../../app/lib/territory/store/config";
import { diffDraftAgainstApproved } from "../../app/lib/territory/approval";
import { TerritoryReviewService } from "../../app/lib/territory/review/service";
import {
  buildReviewPack,
  renderReviewPackMarkdown,
  serializeReviewPackJson,
} from "../../app/lib/territory/review/artifacts";
import type { ListingTerritoryEnrichment, EnrichmentStatus } from "../../app/lib/territory/types";
import { writeFile } from "node:fs/promises";

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

function requireCodes(): string[] {
  const raw = flags.get("codes");
  const codes = (raw ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (codes.length === 0) fail("--codes=<c1,c2> obbligatorio per l'approvazione in blocco.");
  return codes;
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
  const service = new TerritoryReviewService(repo, { now: () => new Date() });

  switch (command) {
    case "list": {
      const statusFilter = flags.get("status") as EnrichmentStatus | undefined;
      const rows = await service.listForReview(statusFilter ? { status: statusFilter } : undefined);
      if (rows.length === 0) {
        console.log("Nessun record da rivedere." + (statusFilter ? ` (status=${statusFilter})` : ""));
        return;
      }
      console.log(`codice        comune               status     POI  appr.  versione`);
      for (const m of rows) {
        console.log(
          `${m.realSmartCode.padEnd(13)} ${m.municipality.padEnd(20)} ${m.status.padEnd(10)} ` +
            `${String(m.poiCount).padStart(3)}  ${String(m.approvedPoiCount).padStart(4)}   ${m.version}`,
        );
      }
      return;
    }

    case "show": {
      const rec = await repo.getListingEnrichment(requireCode());
      if (!rec) fail(`Nessun record per il codice ${requireCode()}.`);
      printRecord(rec);
      return;
    }

    case "compare": {
      const rec = await repo.getListingEnrichment(requireCode());
      if (!rec) fail(`Nessun record per il codice ${requireCode()}.`);
      const diff = diffDraftAgainstApproved(rec);
      console.log(`Confronto bozza ↔ ultimo approvato per ${rec.realSmartCode}:`);
      console.log(`  + aggiunti (${diff.added.length}): ${diff.added.map((e) => e.name).join(", ") || "—"}`);
      console.log(`  - rimossi  (${diff.removed.length}): ${diff.removed.map((e) => e.name).join(", ") || "—"}`);
      console.log(`  = invariati(${diff.unchanged.length}): ${diff.unchanged.map((e) => e.name).join(", ") || "—"}`);
      return;
    }

    case "approve": {
      const code = requireCode();
      const by = requireBy();
      const rec = await repo.getListingEnrichment(code);
      if (!rec) fail(`Nessun record per il codice ${code}.`);
      if (dryRun) {
        console.log(`  (dry-run) ${code}: ${rec.status} → approved, ${rec.pois.filter((p) => p.approval.state !== "rejected").length} POI pubblici, nessuna scrittura.`);
        return;
      }
      const after = await service.approveListing(code, rec.updatedAt, {
        actor: by,
        at: nowIso(),
        ...(flags.get("note") ? { note: flags.get("note") } : {}),
      });
      console.log(`✓ ${code}: approvato — ${after.lastApprovedPublic?.pois.length ?? 0} POI pubblici (audit registrato).`);
      return;
    }

    case "approve-poi":
    case "reject-poi": {
      const code = requireCode();
      const by = requireBy();
      const ids = requireIds();
      const state = command === "approve-poi" ? "approved" : "rejected";
      const rec = await repo.getListingEnrichment(code);
      if (!rec) fail(`Nessun record per il codice ${code}.`);
      if (dryRun) {
        console.log(`  (dry-run) ${code}: ${ids.length} POI → ${state}, nessuna scrittura.`);
        return;
      }
      await service.setPoiDecisions(code, rec.updatedAt, ids, state, {
        actor: by,
        at: nowIso(),
        ...(flags.get("note") ? { note: flags.get("note") } : {}),
      });
      console.log(`✓ ${state === "approved" ? "Approvati" : "Rifiutati"} ${ids.length} POI su ${code} (audit registrato).`);
      return;
    }

    case "unpublish": {
      const code = requireCode();
      const by = requireBy();
      const rec = await repo.getListingEnrichment(code);
      if (!rec) fail(`Nessun record per il codice ${code}.`);
      if (dryRun) {
        console.log(`  (dry-run) ${code}: ${rec.status} → disabled, nessuna scrittura.`);
        return;
      }
      await service.unpublish(code, rec.updatedAt, {
        actor: by,
        at: nowIso(),
        ...(flags.get("note") ? { note: flags.get("note") } : {}),
      });
      console.log(`✓ ${code}: ritirato dal pubblico (audit registrato).`);
      return;
    }

    case "note": {
      const code = requireCode();
      const by = requireBy();
      const note = flags.get("note");
      if (!note || note === "true") fail('--note="..." obbligatorio per annotare.');
      await service.addNote(code, { actor: by, at: nowIso(), note });
      console.log(`✓ Nota registrata su ${code} (nessun cambio di stato).`);
      return;
    }

    case "bulk-approve": {
      const codes = requireCodes();
      const by = requireBy();
      const plan = await service.planBulkApprove(codes);
      console.log(plan.summary);
      console.log(`  codici: ${plan.codes.join(", ")}`);
      if (!flags.has("confirm")) {
        console.log("  ⓘ conferma richiesta: rilancia con --confirm per applicare.");
        return;
      }
      if (dryRun) {
        console.log(`  (dry-run) approverei ${plan.codes.length} immobili, nessuna scrittura.`);
        return;
      }
      const n = await service.applyBulkApprove(plan, { actor: by, at: nowIso(), ...(flags.get("note") ? { note: flags.get("note") } : {}) }, true);
      console.log(`✓ Approvati in blocco ${n} immobili (audit per ciascuno).`);
      return;
    }

    case "pack": {
      const withCoords = flags.has("with-coordinates");
      const format = flags.get("format") ?? "md";
      const pack = await buildReviewPack(service, {
        generatedAt: nowIso(),
        ...(flags.get("municipality") ? { municipality: flags.get("municipality") } : {}),
        ...(flags.get("status") ? { status: flags.get("status") as EnrichmentStatus } : {}),
        includeCoordinates: withCoords,
      });
      const output = format === "json" ? serializeReviewPackJson(pack) : renderReviewPackMarkdown(pack);
      const out = flags.get("out");
      if (out && out !== "true") {
        await writeFile(out, output, "utf8");
        console.log(`✓ Pacchetto di review (${pack.items.length} immobili, ${format}) scritto in ${out}.`);
      } else {
        process.stdout.write(output);
      }
      return;
    }

    default:
      fail(
        `Comando sconosciuto: ${command ?? "(nessuno)"}. Usa: list | show | compare | approve | ` +
          `approve-poi | reject-poi | unpublish | note | bulk-approve | pack.`,
      );
  }
}

main().catch((err) => {
  console.error("✗ errore:", err instanceof Error ? err.message : err);
  process.exit(1);
});
