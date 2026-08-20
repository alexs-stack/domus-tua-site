import { NextResponse } from "next/server";
import { getDemoStatus } from "../../lib/demoStatus";
import { getListingDataSourceStatus } from "../../lib/realsmart/status";
import { getListingsRuntimeStatus } from "../../lib/listings";
import { isRealListingSource, lastKnownGoodKind } from "../../lib/realsmart/client";
import { isProductionRuntime, releaseMinListings, releaseAllowEmpty } from "../../lib/realsmart/env";
import { evaluateRelease } from "../../lib/realsmart/release";
import {
  AI_PROVIDER,
  assistantAiEnabled,
  emailEnabled,
  ASSISTANT_MODEL,
  WHATSAPP_NUMBER,
} from "../../lib/assistant/config";
import { verifiedEntries } from "../../lib/assistant/knowledge/entries";
import { SEMANTIC_FLOOR } from "../../lib/assistant/knowledge/semantic";
import { soldMapSize } from "../../lib/realsmart/soldOverrides";
import { createTerritoryRepository } from "../../lib/territory/store/config";
import { computeTerritoryHealth } from "../../lib/territory/healthReport";
import { readThresholds } from "../../lib/territory/thresholds";
import { territoryFlagsSnapshot, isEnrichmentJobsEnabled, isPublicSectionEnabled } from "../../lib/territory/flags";
import { readBudgets } from "../../lib/territory/budget";

/**
 * Blocco AGGREGATO di salute territoriale (Prompt 14): solo numeri, livelli ed enum. MAI nomi di
 * revisori, origini precise o dettagli di fonte. Difensivo: un errore dello store non fa cadere health.
 */
async function territoryHealthBlock() {
  const flags = territoryFlagsSnapshot();
  const budgets = readBudgets();
  try {
    const repo = createTerritoryRepository();
    const metadata = await repo.listEnrichmentMetadata();
    const enablementActive = isEnrichmentJobsEnabled() || isPublicSectionEnabled();
    const h = computeTerritoryHealth(metadata, { now: new Date(), thresholds: readThresholds(), enablementActive });
    return {
      flags,
      killSwitch: budgets.killSwitch,
      budgets: { poiMonthly: budgets.poiMonthly, geocodeMonthly: budgets.geocodeMonthly },
      status: h.level,
      counts: h.counts,
      municipalitiesCovered: h.municipalitiesCovered,
      staleCoverage: Math.round(h.staleCoverage * 100) / 100,
      backlog: h.backlog,
      oldestPendingHours: Math.round(h.oldestPendingHours),
      providerErrorRate: Math.round(h.providerErrorRate * 100) / 100,
      avgApprovalTurnaroundHours: h.avgApprovalTurnaroundHours === null ? null : Math.round(h.avgApprovalTurnaroundHours),
      // Livelli per segnale come mappa nome→bool "in allerta": numeri/booleani, nessuna stringa
      // che vari (il dettaglio testuale resta in computeTerritoryHealth per report e runbook).
      alerts: Object.fromEntries(h.signals.map((s) => [s.name, s.level !== "ok"])),
    };
  } catch {
    // Nessun dato leggibile: si espone comunque lo stato dei flag, senza rompere l'endpoint.
    return { flags, killSwitch: budgets.killSwitch, budgets: { poiMonthly: budgets.poiMonthly, geocodeMonthly: budgets.geocodeMonthly }, status: "unknown" as const };
  }
}

// Self-check runtime (server-only). Serve a verificare al volo lo stato dell'ambiente DOPO un
// deploy su Vercel, senza aprire la dashboard: `curl https://<dominio>/api/health`.
// Lo consuma anche `npm run verify:deploy` (scripts/verify-deploy.ts).
//
// ⚠️ SOLO booleani, enum e metadati non sensibili. Mai chiavi, mai URL di webhook, mai
//    credenziali. Le uniche stringhe esposte sono pubbliche per definizione:
//    NEXT_PUBLIC_SITE_URL (finisce nel bundle client), il commit del deploy (visibile su
//    GitHub), l'ambiente Vercel e il nome del modello dell'assistente.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Commit del deploy, in forma breve. Vercel lo espone; in locale non esiste. */
function deployedCommit(): string | null {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA;
  return sha ? sha.slice(0, 7) : null;
}

export async function GET() {
  const s = getDemoStatus();
  const listings = getListingDataSourceStatus();
  // Stato REALE del feed a runtime (stessa cache del sito): live/stale/mock/unavailable,
  // freschezza e conteggio. Difensivo: un errore imprevisto non deve far cadere l'health.
  const runtime = await getListingsRuntimeStatus().catch(() => null);
  const soldMap = soldMapSize();
  const territory = await territoryHealthBlock().catch(() => null);

  return NextResponse.json(
    {
      ok: true,
      timestamp: new Date().toISOString(),
      deploy: {
        /** Commit effettivamente in esecuzione: è così che si scopre un deploy vecchio. */
        commit: deployedCommit(),
        /** "production" | "preview" | "development" su Vercel; null in locale. */
        environment: process.env.VERCEL_ENV ?? null,
        /** Pubblico per definizione: finisce nel bundle client. */
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL || null,
        // Sempre presente, anche quando la variabile non c'è: chi legge distingue
        // "non impostato" da "campo assente perché l'endpoint è vecchio".
        nodeEnv: process.env.NODE_ENV ?? null,
        /** Il badge "contenuti in verifica" NON deve essere acceso in produzione. */
        previewBadge: s.previewBadge,
        i18nEnabled: s.i18nEnabled,
      },
      integrations: {
        // ── Immobili ──────────────────────────────────────────────────────
        realsmart: (() => {
          const configuredLive = listings.mode === "realsmart";
          // In produzione VERA con modalità live, il feed è obbligatorio: il rilascio non deve
          // promuovere un catalogo vuoto/implausibile. Fuori produzione il gate è permissivo.
          const policy = {
            requireLive: isProductionRuntime() && configuredLive,
            minListings: releaseMinListings(),
            allowEmpty: releaseAllowEmpty(),
          };
          const release = runtime
            ? evaluateRelease(
                { source: runtime.source, ok: runtime.ok, itemCount: runtime.itemCount },
                policy,
              )
            : { verdict: "BLOCKED" as const, ready: false, reasons: ["snapshot non leggibile"] };
          return {
            /** Modalità ATTESA dal flag (config), non l'esito a runtime. Campo storico. */
            live: configuredLive,
            feedConfigured: listings.feedConfigured,
            /** true se questo è un runtime di PRODUZIONE vera (segnali server-only). */
            productionRuntime: isProductionRuntime(),
            /** Adapter dell'ultimo-buono attivo: "memory" (per-istanza) | "durable". */
            lastKnownGood: lastKnownGoodKind(),
            /**
             * Stato REALE del feed a questa richiesta — la VERITÀ a runtime, distinta dalla
             * modalità attesa (`live`). `source`: live | stale | mock | unavailable.
             * `ok:false` = fail-closed (feed caduto, nessun ultimo-buono): il sito mostra lo stato
             * vuoto, MAI immobili finti. `stale:true` = si serve l'ultimo-buono.
             * `lastFetch` = quando il dato servito è stato scaricato (null se nessun dato reale);
             * `lastAttempt` = quando è stato TENTATO l'ultimo refresh (distinto dal successo).
             */
            runtime: runtime
              ? {
                  source: runtime.source,
                  ok: runtime.ok,
                  stale: runtime.stale,
                  itemCount: runtime.itemCount,
                  lastFetch: runtime.fetchedAt,
                  lastAttempt: runtime.lastAttemptAt,
                }
              : null,
            /**
             * Cancello di RILASCIO: `ready:false` = questo deploy NON va promosso (catalogo vuoto/
             * implausibile con feed richiesto). Lo consuma `npm run verify:deploy`. Solo booleani,
             * enum e numeri — i motivi testuali restano server-side (log), fuori dall'endpoint.
             */
            release: {
              ready: release.ready,
              verdict: release.verdict,
              requireLive: policy.requireLive,
              minListings: policy.minListings,
            },
          };
        })(),
        /** Mappa dei venduti: se è vuota, un immobile venduto può comparire fra i disponibili. */
        soldMap: {
          present: soldMap.detected + soldMap.manual > 0,
          detected: soldMap.detected,
          manual: soldMap.manual,
        },
        // ── Contatti ──────────────────────────────────────────────────────
        /**
         * I due canali di consegna VERI del form (/api/lead): notifica email e Google
         * Sheet. Erano riassunti in un solo campo che contemplava "whatsapp" come se
         * fosse una consegna — non lo è, apre una chat dal browser. Vedi demoStatus.ts.
         */
        leadDelivery: {
          email: s.leadEmailConfigured,
          sheet: s.leadSheetConfigured,
          ok: s.leadEmailConfigured || s.leadSheetConfigured,
        },
        /**
         * Canale email: oggi lo usa l'assistente, non il form contatti (che passa da
         * /api/lead). Dichiararlo a parte evita di far credere che il form spedisca email.
         */
        emailLead: {
          configured: emailEnabled,
        },
        whatsappConfigured: WHATSAPP_NUMBER.length > 0,
        // ── Terze parti e AI ──────────────────────────────────────────────
        trustindexLive: s.trustindexLive,
        heroVideoLive: s.heroVideoLive,
        searchAiConfigured: s.searchAiConfigured,
        semanticRankingConfigured: s.semanticRankingConfigured,
        // Stato dell'assistente conversazionale, canale per canale. Serve a capire dopo un
        // deploy CHE COSA è attivo, senza aprire la dashboard e senza esporre alcun segreto.
        // Ogni voce è indipendente: l'assistente può funzionare con il canale email spento
        // (restano WhatsApp e telefono), ma non deve mai fingere il contrario.
        assistant: {
          /** L'interfaccia è visibile agli utenti (NEXT_PUBLIC_ENABLE_ASSISTANT). */
          enabled: process.env.NEXT_PUBLIC_ENABLE_ASSISTANT === "true",
          /** Il provider AI è configurato. Senza, l'assistente risponde in fallback. */
          providerConfigured: assistantAiEnabled,
          /**
           * Quale provider sta rispondendo: "google" | "anthropic" | null. Enum, non segreto.
           * Con due provider possibili, il solo nome del modello non basta a capire quale
           * chiave l'ambiente stia davvero usando.
           */
          provider: AI_PROVIDER,
          /** Nome del modello: pubblico, serve a capire cosa sta girando davvero. */
          model: ASSISTANT_MODEL,
          /** Il canale email può davvero inviare. Senza, nessun falso successo. */
          leadEmailConfigured: emailEnabled,
          /**
           * L'assistente ha immobili REALI da citare in questo istante: sorgente reale
           * (live o stale) e almeno un immobile. Mai i mock, mai il vuoto fail-closed.
           * Riflette lo stato a runtime, non la sola configurazione attesa.
           */
          realsmartAvailable:
            runtime !== null && isRealListingSource(runtime.source) && runtime.itemCount > 0,
          /** Quante voci di conoscenza sono approvate: 0 = l'assistente sa rispondere solo sugli immobili. */
          knowledgeVerifiedEntries: verifiedEntries().length,
          /**
           * Il retrieval semantico SULLA KNOWLEDGE BASE è attivo.
           *
           * Leggeva `semanticRankingConfigured`, cioè il flag della RICERCA IMMOBILI, e per
           * un po' è stato lo stesso valore. Dal 2026-08-06 non lo è più: gli embeddings
           * ci sono (li fa Gemini) e il ranking immobili li usa, ma sulla knowledge base il
           * livello semantico è spento di proposito, perché la taratura ha mostrato che non
           * separa le domande pertinenti da quelle fuori corpus. Tenere un campo solo
           * avrebbe detto "configurato" di una cosa deliberatamente spenta — l'errore più
           * facile da non notare durante un audit di deploy.
           */
          knowledgeSemanticConfigured: SEMANTIC_FLOOR !== null && s.semanticRankingConfigured,
        },
        // ── Compatibilità ─────────────────────────────────────────────────
        // Nomi piatti mantenuti per gli strumenti che già li leggono (smoke test live).
        listingsMode: listings.mode,
        listingsFeedConfigured: listings.feedConfigured,
      },
      /**
       * Salute AGGREGATA del territorio (Prompt 14): stato ok/warning/critical, conteggi per stato,
       * copertura, backlog, tasso d'errore, kill switch e budget. Solo numeri/enum: nessun nome di
       * revisore, nessuna origine precisa, nessun dettaglio di fonte. Un operatore capisce se il
       * territorio è sano senza aprire il database.
       */
      territory,
    },
    // Mai in cache: deve riflettere lo stato reale dell'ambiente a ogni chiamata.
    { headers: { "cache-control": "no-store" } },
  );
}
