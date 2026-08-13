// Endpoint schedulato PROTETTO per l'arricchimento territoriale — PREPARATO ma NON ATTIVATO.
//
// Non è cablato in alcun cron (nessun vercel.json): esiste per essere pronto, non per girare oggi
// (Prompt 7: "prepare but do not activate"). Regole:
//   • autenticazione dello scheduler (Authorization: Bearer $CRON_SECRET, convenzione Vercel);
//   • disabilitato di default (feature flag TERRITORY_ENRICHMENT_ENABLED);
//   • limite d'esecuzione STRETTO (CRON_MAX_LISTINGS);
//   • processa SOLO immobili RealSmart (getLiveListings) — nessuna coordinata dal chiamante;
//   • nessun segreto né coordinata nella risposta;
//   • idempotente/sicuro a invocazioni ripetute (il motore è guidato dal fingerprint).
//
// NB store: in produzione l'adattatore è `json` (sola lettura); una scrittura a runtime fallirebbe
// per costruzione. Questo endpoint è quindi utile solo con un adattatore scrivibile (futuro) — resta
// il flusso offline via CLI la strada supportata dell'MVP. Vedi ADR-001.

import { NextResponse } from "next/server";
import { getLiveListings } from "../../../lib/realsmart/client";
import { readEnrichmentConfig } from "../../../lib/territory/config";
import { createTerritoryRepository } from "../../../lib/territory/store/config";
import { selectProviderFromEnv } from "../../../lib/territory/provider/select";
import { isEnrichmentJobsEnabled } from "../../../lib/territory/flags";
import { syncListings } from "../../../lib/territory/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Limite d'esecuzione stretto: mai un backfill di massa da un tick di cron. */
const CRON_MAX_LISTINGS = 5;

export async function GET(req: Request) {
  // 1. Configurazione dello scheduler: senza segreto, l'endpoint non è utilizzabile.
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, error: "cron non configurato" }, { status: 503 });
  }

  // 2. Autenticazione dello scheduler.
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "non autorizzato" }, { status: 401 });
  }

  // 3. Feature flag: spento di default in produzione.
  if (!isEnrichmentJobsEnabled()) {
    return NextResponse.json(
      { ok: false, disabled: true, note: "TERRITORY_ENRICHMENT_ENABLED non attivo" },
      { status: 503 },
    );
  }

  try {
    const config = readEnrichmentConfig();
    const repository = createTerritoryRepository();
    const { provider, isReal } = selectProviderFromEnv(config);

    // 4. SOLO immobili RealSmart; nessuna coordinata dal chiamante (body/query ignorati).
    const listings = await getLiveListings();

    // 5. Limite d'esecuzione stretto: sia sul numero di immobili sia sul budget di chiamate.
    const report = await syncListings(listings, { provider, repository, now: () => new Date(), config }, {
      dryRun: false,
      limit: CRON_MAX_LISTINGS,
      maxCalls: CRON_MAX_LISTINGS,
      concurrency: 1,
    });

    // 6. Risposta con soli conteggi (metriche privacy-safe): nessun segreto, nessuna coordinata.
    return NextResponse.json(
      {
        ok: true,
        provider: provider.name,
        realProvider: isReal,
        considered: report.totalConsidered,
        enriched: report.enriched,
        unchanged: report.unchanged,
        failed: report.failed,
        providerCalls: report.metrics.providerCalls,
        rateLimited: report.metrics.rateLimitResponses,
        budgetReached: report.budgetReached,
        estimatedProviderCalls: report.estimatedProviderCalls,
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (err) {
    // Messaggio sanificato: nessun segreto né coordinata.
    return NextResponse.json(
      { ok: false, error: "esecuzione fallita", kind: err instanceof Error ? err.name : "unknown" },
      { status: 500 },
    );
  }
}
