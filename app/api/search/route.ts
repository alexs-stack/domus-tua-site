import { NextResponse } from "next/server";
import { getVisibleListings } from "../../lib/listings";
import { parseQuery } from "../../lib/ai/parseQuery";
import { applyFilters, rankResults } from "../../lib/ai/rank";
import { MAX_QUERY_LEN } from "../../lib/ai/config";
import type { FeatureLabel, SearchFacets, SearchResponse } from "../../lib/ai/types";

// Ricerca in linguaggio naturale: frase -> filtri (Claude Haiku o parser locale) ->
// filtro server-side -> ranking (semantico o per parole chiave). Sempre 200 con ok:false
// in caso di problemi: il client fa fallback ai filtri manuali (nessun blocco).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FEATURE_LABELS: FeatureLabel[] = ["Giardino", "Box / posto auto", "Terrazzo", "Doppi servizi"];

export async function POST(req: Request): Promise<NextResponse<SearchResponse>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "bad-json" }, { status: 400 });
  }
  const query = typeof (body as { q?: unknown })?.q === "string" ? (body as { q: string }).q.trim() : "";
  if (!query) return NextResponse.json({ ok: false, reason: "empty" }, { status: 400 });
  if (query.length > MAX_QUERY_LEN) {
    return NextResponse.json({ ok: false, reason: "too-long" }, { status: 400 });
  }

  try {
    const listings = await getVisibleListings();

    const comuni = [
      "Tutti",
      ...Array.from(new Set(listings.map((p) => p.zone.split(",")[0].trim())))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "it")),
    ];
    const facets: SearchFacets = {
      comuni,
      types: ["Appartamento", "Attico", "Villa", "Commerciale", "Terreno"],
      featureLabels: FEATURE_LABELS,
    };

    const { filters, source } = await parseQuery(query, facets);
    const candidates = applyFilters(listings, filters);
    const { slugs, semantic } = await rankResults(candidates, filters);

    return NextResponse.json({ ok: true, filters, rankedSlugs: slugs, source, semantic });
  } catch (err) {
    console.error("[search] errore:", err);
    return NextResponse.json({ ok: false, reason: "error" });
  }
}
