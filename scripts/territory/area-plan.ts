// DRY RUN dell'automazione d'area: «cosa succederebbe?», senza che succeda niente.
//
//   npx tsx scripts/territory/area-plan.ts [--file <feed.xml>] [--max-jobs 50] [--json]
//
// Risponde alle domande che servono PRIMA di accendere qualcosa in produzione:
//   • quante aree distinte servono davvero per il catalogo attuale?
//   • quanti immobili condividono ciascuna area? (è il fattore di risparmio della ricerca fonti)
//   • quanti immobili hanno un quartiere e quanti solo il comune?
//   • quanti comuni non sono nel registro, e quindi escono senza provincia né regione?
//   • quali località sono ambigue e vanno decise a mano?
//
// NON SCRIVE NULLA. Usa lo store in memoria, quindi ogni esecuzione parte da zero e produce il
// piano completo per un catalogo vergine. Nessuna chiamata a provider, nessun token AI: questo
// comando si può eseguire quante volte si vuole senza spendere.

import { loadListings } from "./loadListings";
import { runAreaAutomation } from "../../app/lib/territory/area/automation/orchestrate";
import { InMemoryAreaRepository } from "../../app/lib/territory/area/store/memory";
import { parseAreaKey } from "../../app/lib/territory/area/identity";
import type { NormalizedProperty } from "../../app/lib/realsmart/types";

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function fmt(n: number, total: number): string {
  const pct = total === 0 ? 0 : Math.round((n / total) * 100);
  return `${n} (${pct}%)`;
}

async function main(): Promise<void> {
  const file = argValue("--file");
  const maxJobs = Number.parseInt(argValue("--max-jobs") ?? "1000", 10);
  const asJson = process.argv.includes("--json");

  const listings: NormalizedProperty[] = await loadListings(file);
  if (listings.length === 0) {
    console.error("Nessun immobile caricato. Con --file controlla il percorso; senza, il feed.");
    process.exit(1);
  }

  const repo = new InMemoryAreaRepository();
  const report = await runAreaAutomation({
    listings,
    repo,
    now: new Date(),
    runId: "dry-run",
    maxJobsPerRun: maxJobs,
  });

  // ── Aggregati sull'identità geografica ────────────────────
  const byArea = new Map<string, string[]>();
  const reviewCounts = new Map<string, number>();
  let withNeighbourhood = 0;
  for (const l of listings) {
    byArea.set(l.area.areaKey, [...(byArea.get(l.area.areaKey) ?? []), l.sourceRef.codice]);
    if (l.area.neighbourhoodKey) withNeighbourhood++;
    for (const r of l.area.review) {
      reviewCounts.set(r.code, (reviewCounts.get(r.code) ?? 0) + 1);
    }
  }
  const areas = [...byArea.entries()].sort((a, b) => b[1].length - a[1].length);
  const inRegistry = areas.filter(([key]) => Boolean(parseAreaKey(key).province));

  if (asJson) {
    console.log(
      JSON.stringify(
        {
          report,
          areas: areas.map(([key, codes]) => ({ areaKey: key, listings: codes.length })),
          review: Object.fromEntries(reviewCounts),
        },
        null,
        2,
      ),
    );
    return;
  }

  const line = (s = "") => console.log(s);
  line();
  line("═".repeat(72));
  line("  PIANO D'AREA — dry run. Nessuna scrittura, nessuna chiamata a provider.");
  line("═".repeat(72));
  line();
  line(`  Immobili nel feed .................. ${listings.length}`);
  line(`  Aree distinte da coprire .......... ${areas.length}`);
  line(`  Immobili per area (media) ......... ${(listings.length / Math.max(1, areas.length)).toFixed(1)}`);
  line();
  line("  RISOLUZIONE GEOGRAFICA");
  line(`    con quartiere ................... ${fmt(withNeighbourhood, listings.length)}`);
  line(`    solo comune ..................... ${fmt(listings.length - withNeighbourhood, listings.length)}`);
  line(`    senza area risolvibile .......... ${report.unresolved.length}`);
  if (report.unresolved.length > 0) {
    line(`      codici: ${report.unresolved.slice(0, 12).join(", ")}${report.unresolved.length > 12 ? "…" : ""}`);
  }
  line();
  line("  REGISTRO DEI COMUNI");
  line(`    aree con provincia e regione .... ${fmt(inRegistry.length, areas.length)}`);
  line(`    aree fuori registro ............. ${areas.length - inRegistry.length}`);
  line("    (fuori registro = pubblicabili, ma senza provincia/regione: aggiungere la riga");
  line("     in app/lib/territory/area/identity.ts con la sua fonte)");
  line();
  if (reviewCounts.size > 0) {
    line("  DA RIVEDERE A MANO");
    for (const [code, count] of [...reviewCounts].sort((a, b) => b[1] - a[1])) {
      line(`    ${code.padEnd(34, ".")} ${count}`);
    }
    line();
  }
  line("  LAVORO CHE VERREBBE ACCODATO");
  line(`    profili d'area da creare ........ ${report.profilesCreated}`);
  line(`    ricerche fonti .................. ${report.profilesCreated}`);
  line(`    contesti per immobile ........... ${report.changed}`);
  line(`    job totali ...................... ${report.jobsEnqueued}`);
  line();
  line("  RISPARMIO DEL RIUSO");
  line(`    senza riuso servirebbero ........ ${listings.length} ricerche fonti`);
  line(`    con il riuso ne servono ......... ${report.profilesCreated}`);
  const saving = listings.length === 0 ? 0 : Math.round((1 - report.profilesCreated / listings.length) * 100);
  line(`    ricerche risparmiate ............ ${saving}%`);
  line();
  line("  LE DIECI AREE PIÙ POPOLATE");
  for (const [key, codes] of areas.slice(0, 10)) {
    line(`    ${String(codes.length).padStart(4)} immobili   ${key}`);
  }
  if (report.errors.length > 0) {
    line();
    line("  AVVISI");
    for (const e of report.errors) line(`    • ${e}`);
  }
  line();
  line("  Nessun dato è stato scritto. Per procedere davvero serve lo store durevole:");
  line("  applicare supabase/migrations/0002_area_schema.sql e collegare l'adattatore.");
  line();
}

main().catch((err) => {
  console.error("[area-plan]", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
