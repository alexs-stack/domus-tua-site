import { NextResponse } from "next/server";
import { getDemoStatus } from "../../lib/demoStatus";
import { getListingDataSourceStatus } from "../../lib/realsmart/status";
import soldDetected from "../../lib/realsmart/sold-detected.json";

// Self-check runtime (server-only). Serve a verificare al volo lo stato dell'ambiente
// DOPO un deploy su Vercel, senza aprire la dashboard: `curl https://<dominio>/api/health`.
//
// Espone anche l'identità del deploy (commit SHA, ref, env Vercel, deployment id, build time)
// così `deployed SHA == main` è verificabile con un solo curl (vedi scripts/verify-deploy.mjs
// e docs/vercel-live-checklist.md).
//
// ⚠️ NON espone MAI valori segreti (chiavi, URL di webhook, credenziali): solo booleani/enum
//    derivati, metadati di build pubblici e il NEXT_PUBLIC_SITE_URL (già pubblico per
//    definizione). Il commit SHA è già pubblico su GitHub: mostrarlo è sicuro.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Metadati del deploy. Le VERCEL_* sono iniettate da Vercel a build/runtime; assenti in locale. */
function deployInfo() {
  return {
    // SHA del commit da cui è stato buildato questo deploy (null in locale).
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    // Branch/ref di provenienza (es. "main" in produzione).
    commitRef: process.env.VERCEL_GIT_COMMIT_REF ?? null,
    // "production" | "preview" | "development".
    vercelEnv: process.env.VERCEL_ENV ?? null,
    deploymentId: process.env.VERCEL_DEPLOYMENT_ID ?? null,
    // Timestamp ISO del build, inlinato da next.config.ts (BUILD_TIME). null se non impostato.
    buildTime: process.env.BUILD_TIME ?? null,
  };
}

/** Disponibilità della mappa "venduto" (OCR copertine). Solo metadati, nessun dato sensibile. */
function soldMapInfo() {
  const map = soldDetected as {
    items?: Record<string, unknown>;
    counts?: Record<string, number>;
    generatedAt?: string;
  };
  const itemCount = Object.keys(map.items ?? {}).length;
  return {
    available: itemCount > 0,
    generatedAt: map.generatedAt ?? null,
    itemCount,
    counts: map.counts ?? {},
  };
}

export async function GET() {
  const s = getDemoStatus();
  const listings = getListingDataSourceStatus();
  const sold = soldMapInfo();

  return NextResponse.json(
    {
      ok: true,
      timestamp: new Date().toISOString(),
      deploy: deployInfo(),
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
        soldMapAvailable: sold.available,
      },
      soldMap: sold,
    },
    // Mai in cache: deve riflettere lo stato reale dell'ambiente a ogni chiamata.
    { headers: { "cache-control": "no-store" } },
  );
}
