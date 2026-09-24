// CLI di sincronizzazione feed → arricchimento territoriale (Prompt 7).
//
// DEFAULT SICURI: dry-run (nessuna chiamata/scrittura), provider fake, max 5 immobili, concorrenza 1,
// solo comuni del pilota, nessuna approvazione automatica. Il provider reale (OSM) si attiva solo con
// TERRITORY_PLACES_PROVIDER=osm; l'esecuzione reale richiede --execute esplicito.
//
// USO:
//   npm run territory:sync -- --file=./feed.xml --town=Tradate --limit=5           # dry-run (default)
//   npm run territory:sync -- --file=./feed.xml --town=Tradate --execute           # scrive i draft
//   npm run territory:sync -- --codes=1043,2055 --execute --concurrency=1

import "../load-env";

import { loadListings } from "./loadListings";
import { readEnrichmentConfig } from "../../app/lib/territory/config";
import { createTerritoryRepository } from "../../app/lib/territory/store/config";
import { selectProviderFromEnv } from "../../app/lib/territory/provider/select";
import { syncListings, DEFAULT_MAX_LISTINGS, type SyncOptions, type SyncReport } from "../../app/lib/territory/sync";
import type { EnrichmentDeps } from "../../app/lib/territory/engine";

const argv = process.argv.slice(2);
const flags = new Map<string, string>();
for (const a of argv) {
  if (a.startsWith("--")) {
    const [k, v] = a.slice(2).split("=");
    flags.set(k, v ?? "true");
  }
}

function printReport(label: string, r: SyncReport): void {
  console.log(`\n── ${label} ──`);
  console.log(`  considerati: ${r.totalConsidered} · eleggibili: ${r.eligible}`);
  console.log(`  invariati: ${r.unchanged} · da arricchire: ${r.wouldEnrich}`);
  console.log(`  codice mancante: ${r.missingCode} · coordinate mancanti: ${r.missingCoordinates} · comune disabilitato: ${r.disabledMunicipality}`);
  if (!r.dryRun) {
    console.log(`  arricchiti: ${r.enriched} · falliti: ${r.failed}`);
    console.log(`  chiamate provider: ${r.metrics.providerCalls} · rate-limit: ${r.metrics.rateLimitResponses}`);
    if (r.skippedByBudget > 0 || r.budgetReached) {
      console.log(`  saltati per budget: ${r.skippedByBudget}${r.budgetReached ? " (tetto raggiunto)" : ""}`);
    }
  }
  console.log(`  stato store: draft=${r.existing.draft} approved=${r.existing.approved} stale=${r.existing.stale} failed=${r.existing.failed} nuovi=${r.existing.none}`);
  console.log(`  STIMA chiamate provider: ${r.estimatedProviderCalls}`);
}

async function main(): Promise<void> {
  const config = readEnrichmentConfig();
  const { provider, isReal } = selectProviderFromEnv(config);
  const repository = createTerritoryRepository();

  const deps: EnrichmentDeps = { provider, repository, now: () => new Date(), config };

  const codes = flags.get("codes")?.split(",").map((s) => s.trim()).filter(Boolean)
    ?? (flags.get("code") ? [flags.get("code")!] : undefined);

  const options: SyncOptions = {
    dryRun: !flags.has("execute"),
    ...(flags.get("town") ? { town: flags.get("town") } : {}),
    ...(codes ? { codes } : {}),
    ...(flags.get("limit") ? { limit: Number(flags.get("limit")) } : {}),
    ...(flags.get("concurrency") ? { concurrency: Number(flags.get("concurrency")) } : {}),
    ...(flags.get("max-calls") ? { maxCalls: Number(flags.get("max-calls")) } : {}),
  };

  const listings = await loadListings(flags.get("file"));
  console.log(`[territory:sync] immobili caricati: ${listings.length}`);
  console.log(`[territory:sync] provider: ${provider.name}${isReal ? " (REALE)" : ""} · limite: ${options.limit ?? DEFAULT_MAX_LISTINGS} · concorrenza: ${options.concurrency ?? config.concurrency}`);
  console.log(`[territory:sync] modalità: ${options.dryRun ? "DRY-RUN (nessuna scrittura)" : "ESECUZIONE (scrive draft)"}`);

  // Stima PRIMA dell'esecuzione (dry, nessuna chiamata).
  const dry = await syncListings(listings, deps, { ...options, dryRun: true });
  printReport("Stima (dry-run)", dry);

  if (options.dryRun) {
    console.log("\n✓ dry-run completato. Aggiungi --execute per scrivere i draft.");
    return;
  }

  const report = await syncListings(listings, deps, options);
  printReport("Esecuzione", report);
  console.log("\n✓ sync completato. I draft NON sono approvati: usa `npm run territory:review`.");
}

main().catch((err) => {
  console.error("✗ errore:", err instanceof Error ? err.message : err);
  process.exit(1);
});
