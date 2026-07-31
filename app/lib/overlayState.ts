"use client";

// Stato "c'è un pannello a schermo intero aperto?" — condiviso tra chrome del sito.
//
// Perché esiste: il menu mobile (`Header`, z-40) e il banner cookie (`CookieConsent`, z-60)
// sono entrambi `fixed` e vivono in rami diversi del layout. Aperti insieme, il banner copre
// le CTA in fondo al menu e i due focus trap si contendono il Tab. Nessuno dei due componente
// può "vedere" l'altro, quindi lo stato passa da qui.
//
// Stesso pattern di INTRO_EVENT in components/motion/Preloader.tsx: un evento sul window più
// un getter sincrono, nessuno store, nessun context da attraversare.

import { useEffect, useState } from "react";

export const MENU_OPEN_EVENT = "dt:menu-open";

let menuOpen = false;

/** Vero se un pannello a schermo intero è aperto adesso. */
export function isMenuOpen(): boolean {
  return menuOpen;
}

/** Da chiamare all'apertura e alla chiusura del menu a schermo intero. */
export function setMenuOpen(value: boolean): void {
  if (menuOpen === value) return;
  menuOpen = value;
  window.dispatchEvent(new CustomEvent<boolean>(MENU_OPEN_EVENT, { detail: value }));
}

/** Stato reattivo per chi deve farsi da parte mentre il menu è aperto. */
export function useMenuOpen(): boolean {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(isMenuOpen());
    const onChange = (e: Event) => setOpen((e as CustomEvent<boolean>).detail);
    window.addEventListener(MENU_OPEN_EVENT, onChange);
    return () => window.removeEventListener(MENU_OPEN_EVENT, onChange);
  }, []);
  return open;
}
