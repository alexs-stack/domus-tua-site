import { NextResponse } from "next/server";
import { getVisibleListings } from "../../lib/listings";
import { comuniFacet } from "../../lib/comune";
import { parseQuery } from "../../lib/ai/parseQuery";
import { applyFilters, rankResults } from "../../lib/ai/rank";
import { MAX_QUERY_LEN } from "../../lib/ai/config";
import { rateLimitShared, clientKey, SEARCH_LIMIT } from "../../lib/security/rateLimit";
import type { FeatureLabel, SearchFacets, SearchResponse } from "../../lib/ai/types";

// Ricerca in linguaggio naturale: frase -> filtri (Claude Haiku o parser locale) ->
// filtro server-side -> ranking (semantico o per parole chiave). Sempre 200 con ok:false
// in caso di problemi: il client fa fallback ai filtri manuali (nessun blocco).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FEATURE_LABELS: FeatureLabel[] = ["Giardino", "Box / posto auto", "Terrazzo", "Doppi servizi"];

export async function POST(req: Request): Promise<NextResponse<SearchResponse>> {
  // Rate limit CONDIVISO tra le istanze (Redis se configurato, altrimenti in-memory best-effort):
  // scoraggia flood/scraping della ricerca. Chiave con IP hashato (privacy). Fail-open sul locale
  // se lo store condiviso è giù: la ricerca ha comunque un fallback client (filtri manuali).
  const rl = await rateLimitShared(clientKey(req, "search"), SEARCH_LIMIT);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, reason: "rate-limited" },
      { status: 429, headers: { "retry-after": String(rl.retryAfterSeconds) } },
    );
  }

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

    // Comuni con il nome pulito ("Tradate", non "Tradate (VA)"): è la forma che l'utente
    // scrive e che il parser locale cerca nella frase. Vedi app/lib/comune.ts.
    const facets: SearchFacets = {
      comuni: comuniFacet(listings),
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
