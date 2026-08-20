// Import di un bundle di backup nello storage territoriale (Prompt 7).
//
//   npm run territory:import -- backup.json
//
// Valida ogni record con lo schema prima di scriverlo e lascia un evento di audit. NON gira sullo
// store `json` (sola lettura di produzione): usare `filesystem` in locale, poi committare/esportare.

import { readFileSync } from "node:fs";
import { createTerritoryRepository } from "../../app/lib/territory/store/config";
import { importTerritory, type TerritoryBackupBundle } from "../../app/lib/territory/store/backup";

async function main() {
  const inPath = process.argv[2];
  if (!inPath) {
    console.error("Uso: npm run territory:import -- <bundle.json>");
    process.exit(2);
  }
  const bundle = JSON.parse(readFileSync(inPath, "utf8")) as TerritoryBackupBundle;
  const repo = createTerritoryRepository();
  const res = await importTerritory(repo, bundle, { actor: "cli", at: new Date().toISOString() });
  console.error(`Import: ${res.listings} immobili, ${res.profiles} profili, ${res.audit} eventi da ${inPath}`);
}

main().catch((err) => {
  console.error("Import fallito:", err instanceof Error ? err.message : err);
  process.exit(1);
});
