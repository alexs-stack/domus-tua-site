// Export dello storage territoriale in un bundle JSON deterministico (Prompt 7).
//
//   npm run territory:export                 # su stdout
//   npm run territory:export -- backup.json  # su file
//
// Sola lettura: non modifica nulla. Il bundle è riesaminabile in git e reimportabile (territory:import).

import { writeFileSync } from "node:fs";
import { createTerritoryRepository } from "../../app/lib/territory/store/config";
import { exportTerritory, serializeBundle } from "../../app/lib/territory/store/backup";

async function main() {
  const outPath = process.argv[2];
  const repo = createTerritoryRepository();
  const bundle = await exportTerritory(repo, new Date().toISOString());
  const text = serializeBundle(bundle);
  if (outPath) {
    writeFileSync(outPath, text);
    console.error(
      `Export: ${Object.keys(bundle.listings).length} immobili, ${Object.keys(bundle.profiles).length} profili, ` +
        `${bundle.audit.length} eventi → ${outPath}`,
    );
  } else {
    process.stdout.write(text);
  }
}

main().catch((err) => {
  console.error("Export fallito:", err instanceof Error ? err.message : err);
  process.exit(1);
});
