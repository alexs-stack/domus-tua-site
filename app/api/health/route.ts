import { NextResponse } from "next/server";
import { getDemoStatus } from "../../lib/demoStatus";
import { getListingDataSourceStatus } from "../../lib/realsmart/status";

// Self-check runtime (server-only). Serve a verificare al volo lo stato dell'ambiente
// DOPO un deploy su Vercel, senza aprire la dashboard: `curl https://<dominio>/api/health`.
//
// ⚠️ NON espone MAI valori segreti (chiavi, URL di webhook, credenziali): solo booleani/enum
//    derivati e il NEXT_PUBLIC_SITE_URL (che è già pubblico per definizione). Vedi
//    docs/vercel-live-checklist.md.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const s = getDemoStatus();
  const listings = getListingDataSourceStatus();

  return NextResponse.json(
    {
      ok: true,
      timestamp: new Date().toISOString(),
      env: {
        // NEXT_PUBLIC_SITE_URL è pubblico (finisce nel bundle client): mostrarlo è sicuro.
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL || null,
        nodeEnv: process.env.NODE_ENV,
        previewBadge: s.previewBadge,
        i18nEnabled: s.i18nEnabled,
      },
      integrations: {
        useRealSmart: s.listingsMode === "realsmart",
        listingsMode: listings.mode,
        listingsFeedConfigured: listings.feedConfigured,
        listingsFallbackPossible: listings.fallbackPossible,
        leadWebhookConfigured: s.leadBackend === "sheets",
        leadBackend: s.leadBackend,
        trustindexLive: s.trustindexLive,
        heroVideoLive: s.heroVideoLive,
        searchAiConfigured: s.searchAiConfigured,
        semanticRankingConfigured: s.semanticRankingConfigured,
      },
    },
    // Mai in cache: deve riflettere lo stato reale dell'ambiente a ogni chiamata.
    { headers: { "cache-control": "no-store" } },
  );
}
