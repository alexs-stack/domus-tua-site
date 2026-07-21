"use client";

// Analytics CONSENT-AWARE. Finché non c'è una pipeline reale (GA4/GTM), è un no-op sicuro:
// registra un evento SOLO con consenso ai cookie di misurazione (dt_consent === "accepted"),
// spingendolo su window.dataLayer — pronto per GTM. Senza consenso non traccia nulla.
//
// Uso: track("search_submit", { mode, comune }). Vedi app/lib/consent.ts.

import { readConsent } from "./consent";

export function track(event: string, props: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;
  if (readConsent() !== "accepted") return; // niente tracking senza consenso
  const w = window as Window & { dataLayer?: Record<string, unknown>[] };
  w.dataLayer = w.dataLayer ?? [];
  w.dataLayer.push({ event, ...props });
}
