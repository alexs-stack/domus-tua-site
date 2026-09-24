// CLI del report operativo MENSILE (Prompt 14). Legge lo store approvato + l'audit, non chiama alcun
// provider e non scrive nulla. Deterministico e tracciabile alla fonte: adatto al retainer.
//
// USO:
//   npm run territory:ops-report                      # mese corrente, Markdown a schermo
//   npm run territory:ops-report -- --month=2026-08   # mese specifico
//   npm run territory:ops-report -- --format=json --out=report-2026-08.json

import "../load-env";

import { writeFile } from "node:fs/promises";
import { createTerritoryRepository } from "../../app/lib/territory/store/config";
import {
  buildMonthlyReport,
  renderMonthlyReportMarkdown,
  serializeMonthlyReportJson,
} from "../../app/lib/territory/opsReport";

const argv = process.argv.slice(2);
const flags = new Map<string, string>();
for (const a of argv) {
  if (a.startsWith("--")) {
    const [k, v] = a.slice(2).split("=");
    flags.set(k, v ?? "true");
  }
}

async function main(): Promise<void> {
  const repo = createTerritoryRepository();
  const metadata = await repo.listEnrichmentMetadata();
  const auditEvents = await repo.listAuditEvents({});

  const report = buildMonthlyReport({
    now: new Date(),
    ...(flags.get("month") ? { month: flags.get("month") } : {}),
    metadata,
    auditEvents,
    // Engagement: raccolto dal sink osservabilità della sezione pubblica (non persistito nello store).
    // Se in futuro verrà persistito, si passa qui; oggi è dichiarato "non raccolto".
    engagement: null,
  });

  const output = flags.get("format") === "json" ? serializeMonthlyReportJson(report) : renderMonthlyReportMarkdown(report);
  const out = flags.get("out");
  if (out && out !== "true") {
    await writeFile(out, output, "utf8");
    console.log(`✓ Report ${report.period} scritto in ${out}.`);
  } else {
    process.stdout.write(output);
  }
}

main().catch((err) => {
  console.error("✗ report fallito:", err instanceof Error ? err.message : err);
  process.exit(1);
});
