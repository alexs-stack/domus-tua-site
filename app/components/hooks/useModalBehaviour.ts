"use client";

import { useEffect, type RefObject } from "react";
import { getLenis } from "../motion/SmoothScroll";

/**
 * Il comportamento di un dialog modale: blocco dello scroll, focus dentro, Esc per uscire,
 * focus restituito a chi l'ha aperto.
 *
 * PERCHÉ È UN HOOK. Questa meccanica esisteva già, scritta a mano dentro CaseQuickLook. Il
 * secondo dialog del sito (il video in pagina) ha bisogno esattamente della stessa, e due
 * copie di un focus trap non restano uguali: divergono al primo ritocco, e la copia che
 * nessuno tocca è quella che smette di funzionare senza che nessuno se ne accorga.
 *
 * UNA DIFFERENZA VOLUTA rispetto all'originale: fra gli elementi che il trap considera
 * focusabili c'è anche `iframe`. Un iframe È focusabile per il browser, e senza includerlo
 * il Tab ci entrava dentro e poi usciva dal dialog dal fondo — cioè la trappola perdeva
 * proprio nel caso del player video. Per CaseQuickLook non cambia niente: iframe non ne ha.
 */
export function useModalBehaviour({
  open,
  panelRef,
  onClose,
  /** Vero mentre una transizione di pagina copre lo schermo: allora Lenis non si riavvia. */
  keepScrollStopped,
}: {
  open: boolean;
  panelRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  keepScrollStopped?: () => boolean;
}): void {
  // Scroll bloccato e focus dentro, per tutta la durata del dialog.
  useEffect(() => {
    if (!open) return;
    const restore = document.activeElement as HTMLElement | null;
    // `overflowY`, NON la scorciatoia `overflow`. Header.tsx:108-120 spiega perche, e la
    // spiegazione vale anche qui: la radice ha `overflow-x: clip` (globals.css), e scrivere
    // la scorciatoia lo trasforma in `hidden` — che a differenza di `clip` fa di <html> un
    // contenitore di scorrimento. In pulizia la scorciatoia era peggio: rimetterla a ""
    // azzerava anche l `overflowY` che un altro componente avesse impostato nel frattempo,
    // cioe una serratura altrui disarmata da chi non sapeva della sua esistenza.
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflowY;
    const prevBody = body.style.overflowY;
    html.style.overflowY = "hidden";
    body.style.overflowY = "hidden";
    getLenis()?.stop();
    // Focus sul PANNELLO (tabIndex -1), non sul primo bottone: con le animazioni attive
    // il bottone può partire da autoAlpha 0 (visibility:hidden), e focus() su un nodo
    // nascosto è un no-op — il focus resterebbe dietro l'overlay.
    panelRef.current?.focus();
    return () => {
      html.style.overflowY = prevHtml;
      body.style.overflowY = prevBody;
      if (!keepScrollStopped?.()) getLenis()?.start();
      if (restore && document.contains(restore)) restore.focus();
    };
  }, [open, panelRef, keepScrollStopped]);

  // Esc chiude, Tab resta dentro.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const dialog = panelRef.current;
      if (!dialog) return;
      const focusable = dialog.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled]), iframe",
      );
      if (focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      const active = document.activeElement;
      // Focus scappato fuori dal pannello (clic su una zona non interattiva, sul velo…):
      // il Tab lo riporta dentro invece di far scorrere lo sfondo.
      if (!dialog.contains(active)) {
        e.preventDefault();
        first.focus();
        return;
      }
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, panelRef, onClose]);
}
