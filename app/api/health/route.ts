import { NextResponse } from "next/server";
import { getDemoStatus } from "../../lib/demoStatus";
import { getListingDataSourceStatus } from "../../lib/realsmart/status";
import { assistantAiEnabled, emailEnabled, WHATSAPP_NUMBER } from "../../lib/assistant/config";
import { verifiedEntries } from "../../lib/assistant/knowledge/entries";

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
      // Stato dell'assistente conversazionale, canale per canale. Serve a capire dopo un
      // deploy CHE COSA è attivo, senza aprire la dashboard e senza esporre alcun segreto.
      // Ogni voce è indipendente: l'assistente può funzionare con il canale email spento
      // (restano WhatsApp e telefono), ma non deve mai fingere il contrario.
      assistant: {
        /** L'interfaccia è visibile agli utenti (NEXT_PUBLIC_ENABLE_ASSISTANT). */
        chatbotEnabled: process.env.NEXT_PUBLIC_ENABLE_ASSISTANT === "true",
        /** Il provider AI è configurato. Senza, l'assistente risponde in fallback. */
        aiProviderConfigured: assistantAiEnabled,
        /** Il canale email può davvero inviare. Senza, nessun falso successo. */
        leadEmailConfigured: emailEnabled,
        /** WhatsApp: sempre disponibile, è un link. Esposto per completezza della checklist. */
        whatsappConfigured: WHATSAPP_NUMBER.length > 0,
        /** Gli immobili live sono la sorgente dell'assistente (mai i mock). */
        realsmartAvailable: listings.mode === "realsmart" && listings.feedConfigured,
        /** Quante voci di conoscenza sono approvate: 0 = l'assistente sa rispondere solo sugli immobili. */
        knowledgeVerifiedEntries: verifiedEntries().length,
        /** Il ranking semantico della knowledge base è opzionale. */
        knowledgeSemanticConfigured: s.semanticRankingConfigured,
      },
    },
    // Mai in cache: deve riflettere lo stato reale dell'ambiente a ogni chiamata.
    { headers: { "cache-control": "no-store" } },
  );
}
