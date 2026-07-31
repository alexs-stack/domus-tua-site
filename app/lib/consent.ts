"use client";

// Consenso cookie — IMPLEMENTAZIONE UNICA.
//
// Prima del consolidamento la scelta viveva solo dentro CookieConsent.tsx (nome del cookie,
// scrittura, lettura) e nessun altro componente poteva interrogarla: il widget Trustindex si
// caricava quindi PRIMA di qualsiasi consenso. Qui la logica sta in un posto solo:
//   • CONSENT_COOKIE / ConsentValue → nome e valori ammessi;
//   • readConsent()/writeConsent() → lettura e scrittura del cookie;
//   • useConsent() → hook idratazione-safe per i componenti che devono aspettare la scelta.
//
// Chi carica script o iframe di terze parti DEVE passare da qui (vedi Reviews.tsx).

import { useEffect, useState } from "react";

export const CONSENT_COOKIE = "dt_consent";

export type ConsentValue = "accepted" | "rejected";

/** Evento interno emesso quando l'utente sceglie: i gate si aggiornano senza reload. */
export const CONSENT_EVENT = "dt:consent";

/** Durata della scelta (180 giorni), come da banner. */
const MAX_AGE_SECONDS = 15552000;

/** Scelta corrente, o null se l'utente non ha ancora deciso. Solo browser. */
export function readConsent(): ConsentValue | null {
  if (typeof document === "undefined") return null;
  const entry = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${CONSENT_COOKIE}=`));
  if (!entry) return null;
  const value = entry.slice(CONSENT_COOKIE.length + 1);
  return value === "accepted" || value === "rejected" ? value : null;
}

/** Registra la scelta e notifica i gate montati nella pagina. */
export function writeConsent(value: ConsentValue): void {
  document.cookie = `${CONSENT_COOKIE}=${value}; path=/; max-age=${MAX_AGE_SECONDS}; samesite=lax`;
  window.dispatchEvent(new CustomEvent<ConsentValue>(CONSENT_EVENT, { detail: value }));
}

/**
 * Scelta corrente, reattiva.
 *
 * Parte SEMPRE da `null` (uguale su server e client: nessun mismatch di idratazione) e legge
 * il cookie dopo il mount. Chi deve caricare terze parti confronta con "accepted": finché la
 * scelta non c'è, il gate resta chiuso.
 */
export function useConsent(): ConsentValue | null {
  const [consent, setConsent] = useState<ConsentValue | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConsent(readConsent());
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<ConsentValue>).detail;
      setConsent(detail ?? readConsent());
    };
    window.addEventListener(CONSENT_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_EVENT, onChange);
  }, []);

  return consent;
}
