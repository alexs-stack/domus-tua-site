// CLI di RITENZIONE (Prompt 16, cablata qui): cancella definitivamente i record territoriali
// DISABILITATI più vecchi della finestra di ritenzione.
//
// Sicurezza: DRY-RUN di default — senza `--confirm` non cancella NULLA, elenca soltanto. La
// cancellazione è irreversibile sui dati del record; l'AUDIT resta (è append-only e non si tocca).
// Solo i record `disabled` sono candidati: un immobile ritirato passa prima da `withdrawTerritory`.
//
// USO:
//   npm run territory:purge                       # elenca i candidati (nessuna scrittura)
//   npm run territory:purge -- --days=90          # finestra personalizzata
//   npm run territory:purge -- --confirm          # cancella davvero

import "../load-env";

import { createTerritoryRepository } from "../../app/lib/territory/store/config";
import { shouldPurgeTerritory, DEFAULT_TERRITORY_RETENTION_DAYS } from "../../app/lib/territory/lifecycle";

const argv = process.argv.slice(2);
const flags = new Map<string, string>();
for (const a of argv) {
  if (a.startsWith("--")) {
    const [k, v] = a.slice(2).split("=");
    flags.set(k, v ?? "true");
  }
}

async function main(): Promise<void> {
  const days = Number(flags.get("days") ?? DEFAULT_TERRITORY_RETENTION_DAYS);
  if (!Number.isFinite(days) || days < 0) {
    console.error("✗ --days deve essere un numero non negativo.");
    process.exit(1);
  }
  const confirm = flags.has("confirm");
  const repo = createTerritoryRepository();
  const now = new Date();

  // I metadati bastano per decidere: stato + updatedAt. Nessuna coordinata viene letta o stampata.
  const metadata = await repo.listEnrichmentMetadata();
  const candidates: string[] = [];
  for (const m of metadata) {
    if (m.status !== "disabled") continue;
    // shouldPurgeTerritory lavora sul record; qui basta la forma minima (status + updatedAt).
    const fake = { status: m.status, updatedAt: m.updatedAt } as Parameters<typeof shouldPurgeTerritory>[0];
    if (shouldPurgeTerritory(fake, now, days)) candidates.push(m.realSmartCode);
  }

  console.log(`Ritenzione territoriale: finestra ${days} giorni · record disabilitati candidati: ${candidates.length}`);
  for (const code of candidates) console.log(`  - ${code}`);

  if (candidates.length === 0) return;
  if (!confirm) {
    console.log("\nⓘ DRY-RUN: nessuna cancellazione. Rilancia con --confirm per eliminarli definitivamente.");
    console.log("  L'audit NON viene toccato: la storia delle decisioni resta.");
    return;
  }

  let deleted = 0;
  for (const code of candidates) {
    if (await repo.deleteListingEnrichment(code)) deleted += 1;
  }
  console.log(`\n✓ Cancellati ${deleted} record. L'audit resta intatto.`);
}

main().catch((err) => {
  console.error("✗ purge fallito:", err instanceof Error ? err.message : err);
  process.exit(1);
});
