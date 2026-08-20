// CLI del PILOTA territoriale (Prompt 17): acquisizione CONTROLLATA per i comuni del pilota.
//
// Genera i DRAFT (profili d'origine + POI) e i pacchetti di review, misura l'uso del provider e
// scrive un report. NON approva nulla, NON attiva flag di produzione, NON pubblica.
//
// Modalità:
//   • fixture (default): provider e immobili SINTETICI, NESSUNA RETE. Dimostra il flusso end-to-end.
//   • live-osm: chiamate reali a Overpass — richiede TERRITORY_PLACES_PROVIDER=osm E il flag esplicito
//     --i-am-authorized (autorizzazione del cliente all'uso del provider e della ricerca).
//
// USO:
//   npm run territory:pilot -- --out=./pilot-out                 # fixture, self-contained
//   npm run territory:pilot -- --out=./pilot-out --live --i-am-authorized

import "../load-env";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { readEnrichmentConfig } from "../../app/lib/territory/config";
import { MemoryTerritoryRepository } from "../../app/lib/territory/store/memory";
import { createTerritoryRepository } from "../../app/lib/territory/store/config";
import { FakePlacesProvider } from "../../app/lib/territory/provider/fake";
import { OsmOverpassProvider } from "../../app/lib/territory/provider/osm";
import { syncListings } from "../../app/lib/territory/sync";
import { TerritoryReviewService } from "../../app/lib/territory/review/service";
import { buildReviewPack, renderReviewPackMarkdown, serializeReviewPackJson } from "../../app/lib/territory/review/artifacts";
import { getPublicAreaProfile } from "../../app/lib/territory/area/data";
import { municipalityLabelFromSlug } from "../../app/lib/territory/origin";
import { buildPilotReport, renderPilotReportMarkdown, serializePilotReportJson, type PilotMode } from "../../app/lib/territory/pilot";
import type { EnrichmentDeps } from "../../app/lib/territory/engine";
import type { NormalizedProperty } from "../../app/lib/realsmart/types";
import type { ReviewItem } from "../../app/lib/territory/review/service";
import type { PublicAreaProfile } from "../../app/lib/territory/area/types";

const argv = process.argv.slice(2);
const flags = new Map<string, string>();
for (const a of argv) {
  if (a.startsWith("--")) {
    const [k, v] = a.slice(2).split("=");
    flags.set(k, v ?? "true");
  }
}

const ISO = "2026-08-14T10:00:00.000Z"; // deterministico per il report

/** Immobili SINTETICI per il pilota: 3 per comune, con codice/town; nessun dato reale. */
function syntheticListings(pilotSlugs: string[]): NormalizedProperty[] {
  const out: NormalizedProperty[] = [];
  pilotSlugs.forEach((slug, mi) => {
    const town = municipalityLabelFromSlug(slug);
    for (let i = 0; i < 3; i++) {
      const code = `PILOT-${mi}${i}`;
      out.push({
        id: code,
        slug: `pilota-${slug}-${i}`,
        title: `Immobile dimostrativo ${code}`,
        descriptionParagraphs: [],
        structuredFactLines: [],
        keptFactLines: [],
        contentPreservation: 1,
        placeholderQuarantined: false,
        excerpt: "Immobile sintetico del pilota.",
        price: 250000,
        priceLabel: "€ 250.000",
        contract: "vendita",
        type: "Appartamento",
        town,
        province: "VA",
        showAddress: false,
        docVerified: false,
        sqm: 90,
        rooms: 3,
        bedrooms: 2,
        baths: 1,
        features: [],
        facts: [],
        factsReview: [],
        images: [],
        status: "published",
        badges: [],
        publishedAt: ISO,
        updatedAt: ISO,
        sourceRef: { codice: code },
        normalizedBy: "deterministic",
      });
    }
  });
  return out;
}

async function main(): Promise<void> {
  const config = readEnrichmentConfig();
  const pilot = config.enabledMunicipalities;
  const live = flags.has("live");
  const mode: PilotMode = live ? "live-osm" : "fixture";
  const outDir = flags.get("out") ?? "./pilot-out";

  if (live) {
    if (process.env.TERRITORY_PLACES_PROVIDER !== "osm" || !flags.has("i-am-authorized")) {
      console.error(
        "✗ Modalità live-osm: richiede TERRITORY_PLACES_PROVIDER=osm E --i-am-authorized (autorizzazione\n" +
          "  del cliente all'uso del provider e alla ricerca). Interrompo: nessuna chiamata esterna non autorizzata.",
      );
      process.exit(1);
    }
  }

  // Store e provider: fixture = memoria + fake (nessuna rete); live = store configurato + OSM.
  const repository = live ? createTerritoryRepository() : new MemoryTerritoryRepository();
  const provider = live ? new OsmOverpassProvider({ timeoutMs: config.requestTimeoutMs }) : new FakePlacesProvider();
  const deps: EnrichmentDeps = { provider, repository, now: () => new Date(ISO), config };

  const listings = syntheticListings(pilot);
  const listingsInScope: Record<string, number> = {};
  for (const slug of pilot) listingsInScope[slug] = listings.filter((l) => l.town === municipalityLabelFromSlug(slug)).length;

  console.log(`Pilota territoriale — modalità ${mode} · comuni: ${pilot.join(", ")}`);
  console.log(`Immobili (sintetici) in scope: ${listings.length}`);

  // 1) Genera i DRAFT (una query per origine grazie al riuso del profilo). NESSUNA approvazione.
  const sync = await syncListings(listings, deps, { dryRun: false, limit: Number.POSITIVE_INFINITY });
  console.log(`Chiamate al provider: ${sync.metrics.providerCalls} (profili aggiornati: ${sync.metrics.profileCache.refreshed})`);

  // 2) Raccogli gli item di review (draft/stale/failed) dallo store.
  const service = new TerritoryReviewService(repository, { now: () => new Date(ISO) });
  const summaries = await service.listForReview();
  const reviewItems: ReviewItem[] = [];
  for (const s of summaries) {
    const item = await service.getReviewItem(s.realSmartCode); // MAI includeCoordinates: pack PII-safe
    if (item) reviewItems.push(item);
  }

  // 3) Profili d'area (oggi vuoti finché la ricerca non è autorizzata).
  const areaProfiles: Record<string, PublicAreaProfile | null> = {};
  for (const slug of pilot) areaProfiles[slug] = getPublicAreaProfile(slug, { now: new Date(ISO), locale: "it" });

  // 4) Pacchetto di review per comune + report del pilota.
  await mkdir(outDir, { recursive: true });
  for (const slug of pilot) {
    const pack = await buildReviewPack(service, { generatedAt: ISO, municipality: slug });
    await writeFile(path.join(outDir, `review-${slug}.md`), renderReviewPackMarkdown(pack), "utf8");
    await writeFile(path.join(outDir, `review-${slug}.json`), serializeReviewPackJson(pack), "utf8");
  }

  const report = buildPilotReport({ generatedAt: ISO, mode, pilotMunicipalities: pilot, listingsInScope, reviewItems, areaProfiles, metrics: sync.metrics });
  await writeFile(path.join(outDir, "pilot-report.md"), renderPilotReportMarkdown(report), "utf8");
  await writeFile(path.join(outDir, "pilot-report.json"), serializePilotReportJson(report), "utf8");

  console.log(`✓ Artefatti scritti in ${outDir} (pilot-report + review-<comune>). NESSUN draft approvato, NESSUN flag attivato.`);
  console.log("Decisioni umane in sospeso:");
  for (const d of report.pendingHumanDecisions) console.log(`  - ${d}`);
}

main().catch((err) => {
  console.error("✗ pilota fallito:", err instanceof Error ? err.message : err);
  process.exit(1);
});
