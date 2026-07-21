"use client";

// Consenso cookie — sorgente unica, reattiva. Il banner (CookieConsent) scrive la scelta;
// i componenti che caricano embed di terze parti (es. Trustindex) leggono lo stato con
// useConsent() e si aggiornano quando cambia (evento `dt-consent`), senza reload.
//
// Regola: gli embed di misurazione/terze parti si caricano SOLO con consent === "accepted".

import { useSyncExternalStore } from "react";

export type ConsentValue = "accepted" | "rejected" | null; // null = non ancora deciso

const COOKIE = "dt_consent";
export const CONSENT_EVENT = "dt-consent";

/** Legge la scelta corrente dal cookie (client-only). null se non decisa. */
export function readConsent(): ConsentValue {
  if (typeof document === "undefined") return null;
  const row = document.cookie.split("; ").find((r) => r.startsWith(`${COOKIE}=`));
  const v = row?.split("=")[1];
  return v === "accepted" || v === "rejected" ? v : null;
}

/** Scrive la scelta e notifica i consumatori (evento same-tab) senza reload. */
export function writeConsent(value: "accepted" | "rejected") {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE}=${value}; path=/; max-age=15552000; samesite=lax`;
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
}

/**
 * Hook reattivo: ritorna lo stato consenso, aggiornandosi quando l'utente sceglie.
 * Usa useSyncExternalStore (nessun setState-in-effect): il cookie è lo store esterno.
 * Snapshot server = null (SSR non conosce il cookie) → coerente con "non deciso".
 */
export function useConsent(): ConsentValue {
  return useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener(CONSENT_EVENT, onStoreChange);
      return () => window.removeEventListener(CONSENT_EVENT, onStoreChange);
    },
    readConsent,
    () => null,
  );
}
