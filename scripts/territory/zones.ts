// CLI di CURATURA delle zone: dice quali zone compaiono nel feed e quali centroidi mancano.
//
// Perché serve. Un centroide di zona porta la precisione da ±2000 m (centro comune) a ±500 m, ed è
// un punto PUBBLICO: non richiede autorizzazione. Ma NON si inventa: va preso da una fonte reale
// (OpenStreetMap, cartografia comunale). Questo comando trasforma la curatura in una lista di lavoro
// precisa: "queste N zone compaiono nel feed, di queste M non hanno ancora un centroide".
//
// USO:
//   npm run territory:zones -- --file=./feed.xml     # dal file salvato
//   npm run territory:zones                          # dal feed configurato

import "../load-env";

import { loadListings } from "./loadListings";
import { defaultOriginSources } from "../../app/lib/territory/territoryOrigin.data";
import { parseZoneField, zoneKey } from "../../app/lib/territory/zone";
import { normalizeMunicipality } from "../../app/lib/territory/geo";
import { readEnrichmentConfig } from "../../app/lib/territory/config";

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
  const sources = defaultOriginSources();
  const listings = await loadListings(flags.get("file"));

  // Zona → quanti annunci la dichiarano (solo comuni del pilota).
  const counts = new Map<string, { municipality: string; zone: string; label: string; listings: number }>();
  let withoutZone = 0;

  for (const p of listings) {
    const municipality = normalizeMunicipality(p.town);
    if (!config.enabledMunicipalities.includes(municipality)) continue;
    if (!p.zoneName) {
      withoutZone += 1;
      continue;
    }
    const parsed = parseZoneField(p.zoneName, p.town);
    const zone = parsed.zone ?? normalizeMunicipality(p.zoneName);
    if (!zone || zone === municipality) {
      withoutZone += 1;
      continue;
    }
    const key = zoneKey(municipality, zone);
    const entry = counts.get(key) ?? { municipality, zone, label: p.zoneName, listings: 0 };
    entry.listings += 1;
    counts.set(key, entry);
  }

  const rows = [...counts.values()].sort((a, b) =>
    a.municipality === b.municipality ? b.listings - a.listings : a.municipality < b.municipality ? -1 : 1,
  );

  console.log(`Zone dichiarate dal feed nei comuni del pilota: ${rows.length}`);
  console.log(`Annunci senza zona (restano al centroide comunale): ${withoutZone}\n`);
  if (rows.length === 0) {
    console.log("Nessuna zona nel feed: niente da curare, la precisione resta comunale (±2000 m).");
    return;
  }

  console.log("comune               zona                      annunci  centroide");
  let missing = 0;
  for (const r of rows) {
    const curated = sources.zoneByName?.(r.municipality, r.zone);
    if (!curated) missing += 1;
    console.log(
      `${r.municipality.padEnd(20)} ${r.zone.padEnd(25)} ${String(r.listings).padStart(7)}  ${curated ? "✓ curato" : "— DA CURARE"}`,
    );
  }

  if (missing > 0) {
    console.log(`\n${missing} zone senza centroide. Per curarle, aggiungi in territoryOrigin.data.ts:`);
    console.log(`
  const ZONES: Record<string, TerritoryZoneCentroid> = {
    "<slug-zona>": {
      slug: "<slug-zona>",
      label: "<Nome leggibile>",
      municipality: "<slug-comune>",
      coord: { lat: <da fonte reale>, lng: <da fonte reale> },
    },
  };`);
    console.log("\n⚠ Le coordinate NON si inventano: prendile da OpenStreetMap o dalla cartografia");
    console.log("  comunale. Un centroide sbagliato produce distanze sbagliate, cioè dati falsi.");
  }
}

main().catch((err) => {
  console.error("✗ errore:", err instanceof Error ? err.message : err);
  process.exit(1);
});
