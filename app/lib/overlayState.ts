"use client";

// Stato "c'è un pannello sopra la pagina, adesso?" — condiviso tra chrome del sito.
//
// Perché esiste: il menu mobile (`Header`), il banner cookie (`CookieConsent`) e l'assistente
// (`Assistant`) sono tutti `fixed` e vivono in rami diversi del layout. Aperti insieme si
// coprono a vicenda e aprono due focus trap che si contendono il Tab. Nessuno dei tre può
// "vedere" gli altri, quindi lo stato passa da qui.
//
// Registro per nome, non un booleano: due pannelli possono chiudersi in ordine qualsiasi senza
// che il conto si sfasi. Chi deve farsi da parte davanti a qualunque pannello guarda
// `useOverlayOpen()`; chi deve evitarne UNO preciso passa il nome.
//
// Stesso pattern di INTRO_EVENT in components/motion/Preloader.tsx: un evento sul window più
// un getter sincrono, nessuno store, nessun context da attraversare.

import { useEffect, useState } from "react";

/** Pannelli che si annunciano qui. */
export type OverlayName = "menu" | "consent" | "assistant";

export const OVERLAY_EVENT = "dt:overlay";

const openPanels = new Set<OverlayName>();

/** Vero se il pannello indicato è aperto; senza argomento, se ne è aperto almeno uno. */
export function isOverlayOpen(name?: OverlayName): boolean {
  return name ? openPanels.has(name) : openPanels.size > 0;
}

/** Da chiamare all'apertura e alla chiusura di un pannello. */
export function setOverlayOpen(name: OverlayName, value: boolean): void {
  if (openPanels.has(name) === value) return;
  if (value) openPanels.add(name);
  else openPanels.delete(name);
  window.dispatchEvent(new CustomEvent<OverlayName>(OVERLAY_EVENT, { detail: name }));
}

/** Stato reattivo per chi deve farsi da parte mentre un pannello è aperto. */
export function useOverlayOpen(name?: OverlayName): boolean {
  const [value, setValue] = useState(false);
  useEffect(() => {
    const sync = () => setValue(isOverlayOpen(name));
    sync();
    window.addEventListener(OVERLAY_EVENT, sync);
    return () => window.removeEventListener(OVERLAY_EVENT, sync);
  }, [name]);
  return value;
}

// ── Nomi storici ────────────────────────────────────────────────────────────────────────
// Il menu a schermo intero è nato prima del registro: i suoi chiamanti restano invariati.

export const MENU_OPEN_EVENT = OVERLAY_EVENT;

export function isMenuOpen(): boolean {
  return isOverlayOpen("menu");
}

export function setMenuOpen(value: boolean): void {
  setOverlayOpen("menu", value);
}

export function useMenuOpen(): boolean {
  return useOverlayOpen("menu");
}
