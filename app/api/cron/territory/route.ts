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
import { timingSafeEqual } from "node:crypto";
import { getLiveListings } from "../../../lib/realsmart/client";
import { readEnrichmentConfig } from "../../../lib/territory/config";
import { createTerritoryRepository } from "../../../lib/territory/store/config";
import { selectProviderFromEnv } from "../../../lib/territory/provider/select";
import { isEnrichmentJobsEnabled } from "../../../lib/territory/flags";
import { syncListings } from "../../../lib/territory/sync";
import { makeAuthorizedResolver } from "../../../lib/territory/originAuthz";
import { defaultOriginSources } from "../../../lib/territory/territoryOrigin.data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Budget STRETTO di QUERY al provider (profili) per tick: mai un backfill di massa da un cron. */
const CRON_MAX_QUERIES = 5;

/** Confronto a tempo COSTANTE del token, per non trapelare la lunghezza/valore via timing. */
function tokenMatches(provided: string | null, secret: string): boolean {
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(`Bearer ${secret}`);
  if (a.length !== b.length) return false; // lunghezze diverse: già non uguale
  return timingSafeEqual(a, b);
}

export async function GET(req: Request) {
  // 1. Configurazione dello scheduler: senza segreto, l'endpoint non è utilizzabile.
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, error: "cron non configurato" }, { status: 503 });
  }

  // 2. Autenticazione dello scheduler (confronto a tempo costante).
  if (!tokenMatches(req.headers.get("authorization"), secret)) {
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

    // 5. Scheduler EQUO: pianifica l'INTERO scope, poi spende un budget STRETTO di query sui profili
    //    più trascurati (cursore di equità). Nessuna starvation, idempotente (lease per profilo).
    // Risolutore d'origine AUTORIZZATO (Prompt 8): usa coordinate curate/geocode SOLO se un umano le
    // ha autorizzate (dati vuoti di default → resta centroide comunale). Coordinate server-only.
    const resolveOrigin = makeAuthorizedResolver(defaultOriginSources());
    const report = await syncListings(listings, { provider, repository, now: () => new Date(), config, resolveOrigin }, {
      dryRun: false,
      maxCalls: CRON_MAX_QUERIES,
      concurrency: 1,
    });

    // 6. Risposta con soli conteggi (metriche privacy-safe): nessun segreto, nessuna coordinata.
    return NextResponse.json(
      {
        ok: true,
        executionId: report.executionId,
        provider: provider.name,
        realProvider: isReal,
        considered: report.totalConsidered,
        enriched: report.enriched,
        unchanged: report.unchanged,
        failed: report.failed,
        providerCalls: report.metrics.providerCalls,
        profilesRefreshed: report.profilesRefreshed,
        cacheHitListings: report.cacheHitListings,
        rateLimited: report.metrics.rateLimitResponses,
        retryPending: report.retryPending,
        deadLettered: report.deadLettered,
        leaseSkipped: report.leaseSkipped,
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
