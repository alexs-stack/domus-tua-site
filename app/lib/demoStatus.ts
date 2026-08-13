// demoStatus — fonte UNICA di verità su "cosa è live vs demo/segnaposto".
//
// SERVER-ONLY. Legge sia env pubbliche (NEXT_PUBLIC_*) sia env server-only
// (SHEETS_WEBHOOK_URL, ASSISTANT_EMAIL_API_KEY…) per capire lo stato reale dell'integrazione.
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
import { heroCinematic } from "./media";
import { isRealSmartLive } from "./realsmart/env";
import { aiParseEnabled, semanticEnabled } from "./ai/config";
// Canale email dei lead: UNA sola configurazione Resend, condivisa da form contatti e assistente.
import { emailEnabled } from "./assistant/config";

/** Sorgente dati immobili: feed RealSmart live oppure fixture demo/mock. */
export type DataSourceMode = "realsmart" | "mock";

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
  /**
   * Consegna dei lead LATO SERVER (canale email Resend). true = i lead del form vengono davvero
   * recapitati all'agenzia via email. WhatsApp è a parte: è UX immediata, non una consegna.
   */
  leadEmailConfigured: boolean;
  /** Persistenza OPZIONALE su Google Sheet (SHEETS_WEBHOOK_URL). In aggiunta all'email, non al posto. */
  leadSheetConfigured: boolean;
  /** Ricerca AI: parsing frase→filtri via Claude (altrimenti parser locale deterministico). */
  searchAiConfigured: boolean;
  /**
   * Ordinamento semantico degli IMMOBILI via embeddings, da Voyage o da Gemini
   * (altrimenti ranking per parole chiave).
   *
   * Non dice nulla sul retrieval della knowledge base, che è un'altra cosa e ha il suo
   * campo: `assistant.knowledgeSemanticConfigured`. Confonderli è già successo.
   */
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

  const leadSheetConfigured = (process.env.SHEETS_WEBHOOK_URL ?? "").trim().length > 0;

  return {
    previewBadge: isTrue(process.env.NEXT_PUBLIC_PREVIEW_BADGE),
    i18nEnabled: isTrue(process.env.NEXT_PUBLIC_ENABLE_I18N),
    logoConfigured: brand.useOriginalLogo && brand.logo.trim().length > 0,
    // Lettura unica del flag: vedi isRealSmartLive() in realsmart/env.ts.
    listingsMode: isRealSmartLive() ? "realsmart" : "mock",
    trustindexLive,
    heroVideoLive: heroCinematic.enabled,
    leadEmailConfigured: emailEnabled,
    leadSheetConfigured,
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
      // Verità: la consegna all'agenzia è email e/o Google Sheet. WhatsApp è UX immediata, non
      // una consegna. Verde solo se il lead viene davvero recapitato lato server.
      value:
        s.leadEmailConfigured && s.leadSheetConfigured
          ? "Email + Google Sheet"
          : s.leadEmailConfigured
            ? "Email"
            : s.leadSheetConfigured
              ? "Google Sheet"
              : "Solo WhatsApp (nessuna consegna server)",
      ok: s.leadEmailConfigured || s.leadSheetConfigured,
    },
  ];
}
