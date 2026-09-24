// Report del PILOTA territoriale (Prompt 17) — PURO, deterministico, PII-safe.
//
// Sintetizza l'acquisizione controllata per i comuni del pilota: per ogni comune, la base d'origine,
// i POI per categoria con le fonti, lo stato dei fatti d'area, i dati mancanti/ambigui e quelli
// cambiati/stale. Riporta l'uso del provider (chiamate, fallimenti, RIUSO = 1 query per origine) e la
// lista delle DECISIONI UMANE ancora in sospeso. NON approva nulla: fotografa lo stato per la review.
// Nessuna coordinata: legge SOLO ReviewItem (già coord-free salvo autorizzazione) e metriche aggregate.

import type { ReviewItem } from "./review/service";
import type { TerritoryMetricsSnapshot } from "./metrics";
import type { TerritoryPoiCategory } from "./categories";
import type { PublicAreaProfile } from "./area/types";

export type PilotMode = "fixture" | "live-osm";

export interface PilotMunicipalityReport {
  municipality: string;
  listingsInScope: number;
  drafts: number;
  /** Base d'origine (precisione + etichetta + accuratezza), senza coordinate. */
  originBasis: { precision: string; label: string; accuracyMeters: number } | null;
  poisByCategory: Partial<Record<TerritoryPoiCategory, number>>;
  /** Fino a 5 link fonte PUBBLICI (per il revisore). */
  sampleSources: string[];
  areaFactsApproved: number;
  areaFactsStatus: "empty-pending-research" | "present";
  /** Dati mancanti o ambigui da chiarire in review. */
  missingOrAmbiguous: string[];
  /** Record cambiati rispetto all'ultimo approvato (drift), o stale. */
  changedOrStale: number;
}

export interface PilotProviderUsage {
  providerCalls: number;
  profileHits: number;
  profilesRefreshed: number;
  failures: number;
  /** Origini/comuni unici interrogati: con il riuso, providerCalls ≈ uniqueOrigins. */
  uniqueOrigins: number;
  /** Immobili serviti per ogni query (riuso del profilo): listingsInScope / providerCalls. */
  listingsPerQuery: number;
}

export interface PilotReport {
  generatedAt: string;
  mode: PilotMode;
  pilotMunicipalities: string[];
  municipalities: PilotMunicipalityReport[];
  totals: { listingsInScope: number; drafts: number };
  providerUsage: PilotProviderUsage;
  pendingHumanDecisions: string[];
  notes: string[];
}

export interface PilotReportInput {
  generatedAt: string;
  mode: PilotMode;
  pilotMunicipalities: string[];
  /** Immobili in scope per comune (slug → conteggio). */
  listingsInScope: Record<string, number>;
  /** Item di review (draft/stale/failed) da cui derivare il pacchetto. */
  reviewItems: ReviewItem[];
  /** Profilo d'area verificato per comune (o null se ricerca non ancora autorizzata). */
  areaProfiles: Record<string, PublicAreaProfile | null>;
  metrics: TerritoryMetricsSnapshot;
}

function bySlug<T>(items: T[], slug: (t: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const it of items) {
    const k = slug(it);
    (map.get(k) ?? map.set(k, []).get(k)!).push(it);
  }
  return map;
}

/** Costruisce il report del pilota. Puro e deterministico dato `generatedAt`. */
export function buildPilotReport(input: PilotReportInput): PilotReport {
  const itemsByMun = bySlug(input.reviewItems, (i) => i.municipality);

  const municipalities: PilotMunicipalityReport[] = [...input.pilotMunicipalities].sort().map((mun) => {
    const items = (itemsByMun.get(mun) ?? []).slice().sort((a, b) => (a.realSmartCode < b.realSmartCode ? -1 : 1));
    const drafts = items.filter((i) => i.status === "draft").length;
    const changedOrStale = items.filter((i) => i.status === "stale" || i.diff.added.length + i.diff.removed.length > 0).length;

    const poisByCategory: Partial<Record<TerritoryPoiCategory, number>> = {};
    const sources = new Set<string>();
    for (const it of items) {
      for (const p of it.pois) {
        poisByCategory[p.category as TerritoryPoiCategory] = (poisByCategory[p.category as TerritoryPoiCategory] ?? 0) + 1;
        if (p.sourceUrl) sources.add(p.sourceUrl);
      }
    }

    const originBasis = items[0]?.originBasis ?? null;
    const missingOrAmbiguous: string[] = [];
    if (items.length === 0) missingOrAmbiguous.push("nessun immobile in scope o nessun draft generato");
    for (const cat of ["railway-station", "pharmacy", "supermarket", "school", "park"] as TerritoryPoiCategory[]) {
      if (!(cat in poisByCategory)) missingOrAmbiguous.push(`categoria senza POI: ${cat}`);
    }

    const area = input.areaProfiles[mun] ?? null;

    return {
      municipality: mun,
      listingsInScope: input.listingsInScope[mun] ?? 0,
      drafts,
      originBasis,
      poisByCategory,
      sampleSources: [...sources].sort().slice(0, 5),
      areaFactsApproved: area?.facts.length ?? 0,
      areaFactsStatus: area && area.facts.length > 0 ? "present" : "empty-pending-research",
      missingOrAmbiguous,
      changedOrStale,
    };
  });

  const totalListings = Object.values(input.listingsInScope).reduce((a, b) => a + b, 0);
  const totalDrafts = municipalities.reduce((a, m) => a + m.drafts, 0);
  const calls = input.metrics.providerCalls;
  const providerUsage: PilotProviderUsage = {
    providerCalls: calls,
    profileHits: input.metrics.profileCache.hit,
    profilesRefreshed: input.metrics.profileCache.refreshed,
    failures: Object.values(input.metrics.providerFailuresByKind).reduce((a, b) => a + b, 0),
    uniqueOrigins: input.metrics.profileCache.refreshed, // un refresh = un'origine interrogata
    listingsPerQuery: calls > 0 ? Math.round((totalListings / calls) * 10) / 10 : 0,
  };

  const anyAreaFacts = municipalities.some((m) => m.areaFactsStatus === "present");
  const pendingHumanDecisions = [
    "Approvare/rifiutare i draft POI per ogni comune (CLI territory:review) — nessun draft è approvato automaticamente.",
    "Autorizzare la ricerca dei fatti d'area (fonti primarie) — oggi vuoti in attesa di autorizzazione." + (anyAreaFacts ? " [alcuni presenti]" : ""),
    "Autorizzare (se voluto) l'uso dell'origine a livello di immobile per singoli annunci — altrimenti resta il centroide comunale.",
    "Confermare l'attivazione dello storage durevole e dei flag di produzione SOLO alla verifica finale (Prompt 18).",
  ];

  const notes = [
    input.mode === "fixture"
      ? "MODALITÀ FIXTURE: provider e immobili SINTETICI, nessuna rete. Dimostra il flusso; i POI NON sono reali."
      : "MODALITÀ LIVE-OSM: chiamate reali a Overpass (autorizzate). POI reali sotto ODbL.",
    "Nessun flag di produzione è stato attivato; nessun draft è stato approvato; nulla è pubblicato.",
    "Riuso del profilo: con più immobili nello stesso comune, una sola query per origine (vedi listingsPerQuery).",
  ];

  return {
    generatedAt: input.generatedAt,
    mode: input.mode,
    pilotMunicipalities: [...input.pilotMunicipalities].sort(),
    municipalities,
    totals: { listingsInScope: totalListings, drafts: totalDrafts },
    providerUsage,
    pendingHumanDecisions,
    notes,
  };
}

export function serializePilotReportJson(report: PilotReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}

/** Markdown deterministico del report del pilota (per il retainer/revisore). */
export function renderPilotReportMarkdown(report: PilotReport): string {
  const l = (s: string) => `${s}\n`;
  let out = "";
  out += l(`# Pilota territoriale — ${report.generatedAt}`);
  out += l("");
  out += l(`Modalità: **${report.mode}** · comuni: ${report.pilotMunicipalities.join(", ")}`);
  out += l("");
  for (const n of report.notes) out += l(`> ${n}`);
  out += l("");
  out += l("## Uso del provider");
  const u = report.providerUsage;
  out += l(`- Chiamate al provider: ${u.providerCalls} · profili aggiornati (origini uniche): ${u.profilesRefreshed} · cache hit: ${u.profileHits} · fallimenti: ${u.failures}`);
  out += l(`- Riuso: **${u.listingsPerQuery} immobili per query** (una query per origine/comune).`);
  out += l("");
  out += l("## Per comune");
  for (const m of report.municipalities) {
    out += l("");
    out += l(`### ${m.municipality}`);
    out += l(`- Immobili in scope: ${m.listingsInScope} · draft: ${m.drafts} · cambiati/stale: ${m.changedOrStale}`);
    out += l(`- Origine: ${m.originBasis ? `${m.originBasis.precision} — "${m.originBasis.label}" (±${m.originBasis.accuracyMeters} m)` : "—"}`);
    const cats = Object.entries(m.poisByCategory).map(([c, n]) => `${c}: ${n}`).join(", ") || "—";
    out += l(`- POI per categoria: ${cats}`);
    out += l(`- Fonti (esempi): ${m.sampleSources.join(", ") || "—"}`);
    out += l(`- Fatti d'area: ${m.areaFactsStatus === "present" ? `${m.areaFactsApproved} approvati` : "vuoti (ricerca da autorizzare)"}`);
    if (m.missingOrAmbiguous.length) out += l(`- Mancanti/ambigui: ${m.missingOrAmbiguous.join("; ")}`);
  }
  out += l("");
  out += l("## Decisioni umane in sospeso");
  for (const d of report.pendingHumanDecisions) out += l(`- ${d}`);
  out += l("");
  out += l("## Come approvare (nessun auto-approve)");
  out += l("```bash");
  out += l("npm run territory:review -- list --status=draft");
  out += l("npm run territory:review -- show <codice>");
  out += l("npm run territory:review -- approve <codice> --by=<nome>");
  out += l("```");
  return out;
}
