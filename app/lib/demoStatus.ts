// demoStatus — fonte UNICA di verità su "cosa è live vs demo/segnaposto".
//
// SERVER-ONLY. Legge sia env pubbliche (NEXT_PUBLIC_*) sia env server-only
// (RESEND_API_KEY, LEAD_FROM_EMAIL…) per capire lo stato reale dell'integrazione.
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
import { isEmailLeadConfigured, isLeadRecipientConfigured } from "./forms/email";
import {
  AI_ASSISTANT_MODEL,
  aiParseEnabled,
  assistantConfigured,
  assistantEnabled,
  semanticEnabled,
} from "./ai/config";

/** Sorgente dati immobili: feed RealSmart live oppure fixture demo/mock. */
export type DataSourceMode = "realsmart" | "mock";
/**
 * Destinazione dei lead. È SEMPRE "email": il form scrive a immobiliare@domustua.it e non
 * esiste altro backend. WhatsApp e telefono restano canali paralleli aperti dall'utente,
 * non destinazioni del form.
 */
export type LeadBackend = "email";

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
  /** Dove finiscono i lead: sempre email. */
  leadBackend: LeadBackend;
  /** Provider email configurato (chiave + mittente verificato): il form può davvero spedire. */
  emailLeadConfigured: boolean;
  /** Destinatario dei lead valorizzato. */
  leadRecipientConfigured: boolean;
  /** Numero WhatsApp presente: i link precompilati funzionano. */
  whatsappConfigured: boolean;
  /** Ricerca AI: parsing frase→filtri via Claude (altrimenti parser locale deterministico). */
  searchAiConfigured: boolean;
  /** Ranking semantico via embeddings Voyage (altrimenti ranking per parole chiave). */
  semanticRankingConfigured: boolean;
  /**
   * Assistente conversazionale. Due stati distinti di proposito: il backend può essere
   * pronto (`providerConfigured`) senza che il widget sia visibile sul sito (`enabled`).
   */
  assistant: {
    enabled: boolean;
    providerConfigured: boolean;
    /** Modello in uso: informazione pubblica, utile a verificare cosa gira davvero. */
    model: string;
  };
}

function isTrue(v: string | undefined): boolean {
  return v === "true";
}

/** Calcola lo stato demo/live dalle env + config. Da chiamare SOLO lato server. */
export function getDemoStatus(): DemoStatus {
  const trustindexLive =
    site.embeds.trustindexLoader.trim().length > 0 ||
    (process.env.TRUSTINDEX_WIDGET_URL ?? "").trim().length > 0;

  return {
    previewBadge: isTrue(process.env.NEXT_PUBLIC_PREVIEW_BADGE),
    i18nEnabled: isTrue(process.env.NEXT_PUBLIC_ENABLE_I18N),
    logoConfigured: brand.useOriginalLogo && brand.logo.trim().length > 0,
    // Lettura unica del flag: vedi isRealSmartLive() in realsmart/env.ts.
    listingsMode: isRealSmartLive() ? "realsmart" : "mock",
    trustindexLive,
    heroVideoLive: heroCinematic.enabled,
    leadBackend: "email",
    emailLeadConfigured: isEmailLeadConfigured(),
    leadRecipientConfigured: isLeadRecipientConfigured(),
    whatsappConfigured: site.whatsapp.href.trim().length > 0,
    searchAiConfigured: aiParseEnabled,
    semanticRankingConfigured: semanticEnabled,
    assistant: {
      enabled: assistantEnabled,
      providerConfigured: assistantConfigured,
      model: AI_ASSISTANT_MODEL,
    },
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
      value: s.emailLeadConfigured ? "Email attiva" : "Email da configurare",
      // Senza provider il form NON invia: non è un dettaglio, è il canale principale rotto.
      ok: s.emailLeadConfigured,
    },
  ];
}
