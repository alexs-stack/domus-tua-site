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
import { heroCinematic } from "./media";
import { isRealSmartLive } from "./realsmart/env";
import { aiParseEnabled, semanticEnabled } from "./ai/config";
import { emailEnabled } from "./assistant/config";

/** Sorgente dati immobili: feed RealSmart live oppure fixture demo/mock. */
export type DataSourceMode = "realsmart" | "mock";
/** Destinazione dei lead: Google Sheet, solo WhatsApp, oppure non configurato. */
// NB: qui non c'è più `LeadBackend = "sheets" | "whatsapp" | "not-configured"`.
//
// Quella union descriveva un modello di consegna che il codice non usa più. Oggi
// /api/lead consegna su DUE canali server — notifica email (Resend) e Google Sheet — e
// risponde `ok:false, reason:"not-delivered"` se nessuno dei due prende in carico il
// lead. WhatsApp è un canale del BROWSER: il form apre una chat precompilata, utile ma
// fuori dal server, e non è una prova che la richiesta sia arrivata a qualcuno.
//
// Il difetto non era estetico. Senza Google Sheet configurato lo stato diceva «Solo
// WhatsApp» e si segnava OK — verde — mentre l'email non veniva nemmeno guardata: la
// dashboard dichiarava che i lead arrivavano proprio nella configurazione in cui
// potevano non arrivare. Ora i due canali si dichiarano separati, e la riga è verde se
// almeno uno dei due è configurato.

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
  /** Notifica email dei lead (Resend) configurata: è un canale di consegna VERO. */
  leadEmailConfigured: boolean;
  /** Google Sheet configurato: l'altro canale di consegna vero. */
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

  // `CONTACT_FORM_MODE` non si legge più: non guidava più nessun comportamento, ma
  // continuava a decidere il COLORE di questa riga. Una variabile morta che tinge di
  // verde una dashboard è peggio di una variabile morta e basta.
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
      value: [
        s.leadEmailConfigured ? "Email" : null,
        s.leadSheetConfigured ? "Google Sheet" : null,
      ]
        .filter(Boolean)
        .join(" + ") || "Nessun canale di consegna",
      // Verde se ALMENO UNO dei due canali server prende in carico il lead. WhatsApp non
      // entra nel conto: apre una chat dal browser, non recapita niente a nessuno.
      ok: s.leadEmailConfigured || s.leadSheetConfigured,
    },
  ];
}
