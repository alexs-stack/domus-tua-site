// demoStatus — fonte UNICA di verità su "cosa è live vs demo/segnaposto".
//
// SERVER-ONLY. Legge sia env pubbliche (NEXT_PUBLIC_*) sia env server-only
// (SHEETS_WEBHOOK_URL, CONTACT_FORM_MODE…) per capire lo stato reale dell'integrazione.
// NON esporre MAI valori segreti: qui usciamo solo booleani/enum derivati.
//
// Consumatori:
//  • PreviewBadge (via layout server → props): checklist onesta durante la demo cliente.
//  • /api/health: self-check runtime post-deploy (vedi docs/vercel-live-checklist.md).
//
// ⚠️ Non importare questo file da un componente client ("use client"): leggerebbe env
//    server-only che nel bundle browser sono `undefined`. Il layout (server) calcola lo
//    stato e lo passa a PreviewBadge come props.

import { brand } from "./brand";
import { site } from "./site";
import { heroCinematic, heroMedia } from "./media";
import { aiParseEnabled, semanticEnabled } from "./ai/config";

/** Sorgente dati immobili: feed RealSmart live oppure fixture demo/mock. */
export type DataSourceMode = "realsmart" | "mock";
/** Destinazione dei lead: Google Sheet, solo WhatsApp, oppure non configurato. */
export type LeadBackend = "sheets" | "whatsapp" | "not-configured";

/** Stato grezzo (booleani/enum) — nessun segreto. Adatto anche a /api/health. */
export interface DemoStatus {
  /** Il badge di anteprima è attivo (NEXT_PUBLIC_PREVIEW_BADGE === "true"). */
  previewBadge: boolean;
  /** Selettore lingua / i18n abilitato (NEXT_PUBLIC_ENABLE_I18N === "true"). */
  i18nEnabled: boolean;
  /** Logo ufficiale collegato (brand.useOriginalLogo con path valorizzato). */
  logoConfigured: boolean;
  /** Modalità immobili prevista dal flag pubblico (non rileva il fallback a runtime). */
  listingsMode: DataSourceMode;
  /** Widget recensioni Trustindex collegato (loader ufficiale o URL da env). */
  trustindexLive: boolean;
  /** Hero video reale attivo; altrimenti resta il poster (foto reale). */
  heroVideoLive: boolean;
  /** Dove finiscono i lead una volta inviati. WhatsApp è comunque sempre attivo lato form. */
  leadBackend: LeadBackend;
  /** Ricerca AI: parsing frase→filtri via Claude (altrimenti parser locale deterministico). */
  searchAiConfigured: boolean;
  /** Ranking semantico via embeddings Voyage (altrimenti ranking per parole chiave). */
  semanticRankingConfigured: boolean;
}

function isTrue(v: string | undefined): boolean {
  return v === "true";
}

/** Calcola lo stato demo/live dalle env + config. Da chiamare SOLO lato server. */
export function getDemoStatus(): DemoStatus {
  const trustindexLive =
    site.embeds.trustindexLoader.trim().length > 0 ||
    (process.env.TRUSTINDEX_WIDGET_URL ?? "").trim().length > 0;

  const webhookConfigured = (process.env.SHEETS_WEBHOOK_URL ?? "").trim().length > 0;
  const formMode = (process.env.CONTACT_FORM_MODE ?? "whatsapp").trim().toLowerCase();
  const leadBackend: LeadBackend = webhookConfigured
    ? "sheets"
    : formMode === "whatsapp"
      ? "whatsapp"
      : "not-configured";

  return {
    previewBadge: isTrue(process.env.NEXT_PUBLIC_PREVIEW_BADGE),
    i18nEnabled: isTrue(process.env.NEXT_PUBLIC_ENABLE_I18N),
    logoConfigured: brand.useOriginalLogo && brand.logo.trim().length > 0,
    // "false" esplicito = mock; qualsiasi altro valore (incl. assente) = feed live.
    listingsMode: process.env.NEXT_PUBLIC_USE_REALSMART !== "false" ? "realsmart" : "mock",
    trustindexLive,
    heroVideoLive: heroCinematic.enabled || heroMedia.enabled,
    leadBackend,
    searchAiConfigured: aiParseEnabled,
    semanticRankingConfigured: semanticEnabled,
  };
}

/** Una riga della checklist mostrata nel badge di anteprima. */
export interface DemoChecklistRow {
  label: string;
  /** Valore leggibile ("Collegato", "Fallback demo", "Poster"…). */
  value: string;
  /** true = reale/live; false = demo/segnaposto/da collegare. Guida il colore del pill. */
  ok: boolean;
}

/**
 * Traduce lo stato grezzo in righe leggibili per il badge (IT — è uno strumento interno
 * di demo, non contenuto di pagina). Ordine: dal più "visibile in demo" al meno.
 */
export function demoChecklist(s: DemoStatus): DemoChecklistRow[] {
  return [
    {
      label: "Logo ufficiale",
      value: s.logoConfigured ? "Collegato" : "Mancante",
      ok: s.logoConfigured,
    },
    {
      label: "Immobili",
      value: s.listingsMode === "realsmart" ? "RealSmart live" : "Mock demo",
      ok: s.listingsMode === "realsmart",
    },
    {
      label: "Recensioni",
      value: s.trustindexLive ? "Trustindex live" : "Fallback statico",
      ok: s.trustindexLive,
    },
    {
      label: "Hero video",
      value: s.heroVideoLive ? "Video live" : "Poster (foto reale)",
      ok: s.heroVideoLive,
    },
    {
      label: "Lead",
      value:
        s.leadBackend === "sheets"
          ? "Google Sheet + WhatsApp"
          : s.leadBackend === "whatsapp"
            ? "Solo WhatsApp"
            : "Non configurato",
      // WhatsApp è comunque un canale reale: giallo solo quando non c'è persistenza.
      ok: s.leadBackend !== "not-configured",
    },
  ];
}
