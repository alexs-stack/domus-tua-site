// CLI di audit/report territoriale (Prompt 7).
//
// Fotografa lo stato SENZA scrivere e senza chiamare il provider: quanti immobili eleggibili, quanti
// senza coordinate, invariati, draft in attesa, approvati, stale, falliti, e la stima di chiamate
// necessarie prima di eseguire un sync reale.
//
// USO:
//   npm run territory:report -- --file=./feed.xml
//   npm run territory:report -- --town=Tradate

import "../load-env";

import { loadListings } from "./loadListings";
import { readEnrichmentConfig } from "../../app/lib/territory/config";
import { createTerritoryRepository } from "../../app/lib/territory/store/config";
import { selectProviderFromEnv } from "../../app/lib/territory/provider/select";
import { syncListings, type SyncOptions } from "../../app/lib/territory/sync";
import type { EnrichmentDeps } from "../../app/lib/territory/engine";

const argv = process.argv.slice(2);
const flags = new Map<string, string>();
for (const a of argv) {
  if (a.startsWith("--")) {
    const [k, v] = a.slice(2).split("=");
    flags.set(k, v ?? "true");
  }
}

async function main(): Promise<void> {
  const config = readEnrichmentConfig();
  const { provider } = selectProviderFromEnv(config);
  const repository = createTerritoryRepository();
  const deps: EnrichmentDeps = { provider, repository, now: () => new Date(), config };

  const codes = flags.get("codes")?.split(",").map((s) => s.trim()).filter(Boolean);
  const options: SyncOptions = {
    dryRun: true,
    limit: Number.POSITIVE_INFINITY, // audit su TUTTI gli eleggibili, nessun cap
    ...(flags.get("town") ? { town: flags.get("town") } : {}),
    ...(codes ? { codes } : {}),
  };

  const listings = await loadListings(flags.get("file"));
  const r = await syncListings(listings, deps, options);

  console.log(`Audit territoriale (pilota: ${config.enabledMunicipalities.join(", ")})`);
  console.log(`  immobili totali nel feed:     ${listings.length}`);
  console.log(`  eleggibili (pilota+coord+cod):${r.eligible}`);
  console.log(`  senza coordinate:             ${r.missingCoordinates}`);
  console.log(`  senza codice:                 ${r.missingCode}`);
  console.log(`  invariati (approvati freschi): ${r.unchanged}`);
  console.log(`  draft in attesa di approvazione: ${r.existing.draft}`);
  console.log(`  approvati:                    ${r.existing.approved}`);
  console.log(`  stale:                        ${r.existing.stale}`);
  console.log(`  falliti:                      ${r.existing.failed}`);
  console.log(`  disabilitati:                 ${r.existing.disabled}`);
  console.log(`  ─────────────────────────────`);
  console.log(`  STIMA chiamate provider per un sync reale: ${r.estimatedProviderCalls}`);
}

main().catch((err) => {
  console.error("✗ errore:", err instanceof Error ? err.message : err);
  process.exit(1);
});
