"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";
import { useLocale } from "./i18n/LocaleProvider";
import { useOverlayOpen } from "../lib/overlayState";
import { assistantCopy } from "./assistantCopy";

// Il launcher vive QUI, non dentro il pannello: è un bottone e qualche classe, ed è l'unica
// cosa che l'assistente carica finché non lo si apre. Il pannello — messaggi, streaming, focus
// trap, schede immobile — arriva in un chunk separato al primo click (vedi next/dist/docs,
// lazy-loading). ssr:false perché è puramente client-side.
const AssistantPanel = dynamic(() => import("./Assistant"), { ssr: false });

const ENABLED = process.env.NEXT_PUBLIC_ENABLE_ASSISTANT === "true";

export default function AssistantMount() {
  const { locale } = useLocale();
  const c = assistantCopy[locale];
  const [open, setOpen] = useState(false);
  // Una volta aperto il pannello resta montato: chiudere non deve buttare la conversazione.
  const [mounted, setMounted] = useState(false);
  const launcherRef = useRef<HTMLButtonElement | null>(null);
  // Il banner cookie è un dialog modale: finché è a schermo il launcher non compare, invece di
  // galleggiarci sopra. Torna appena la persona ha scelto.
  const consentOpen = useOverlayOpen("consent");

  const openPanel = useCallback(() => {
    setMounted(true);
    setOpen(true);
  }, []);

  const closePanel = useCallback(() => {
    setOpen(false);
    launcherRef.current?.focus();
  }, []);

  if (!ENABLED) return null;

  const launcherHidden = open || consentOpen;

  return (
    <>
      {/* Launcher — resta montato (solo nascosto) così il focus può tornare qui alla chiusura.
          bottom-24: sopra la barra azioni mobile (~4rem) e sopra la sede WhatsApp desktop. */}
      <button
        ref={launcherRef}
        type="button"
        onClick={openPanel}
        aria-label={c.launcher}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={`fixed bottom-24 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-red text-white shadow-[0_20px_40px_-16px_rgba(210,10,10,0.7)] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-red-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red motion-safe:hover:scale-105 motion-safe:active:scale-95 ${
          launcherHidden ? "pointer-events-none scale-90 opacity-0" : "opacity-100"
        }`}
        {...(launcherHidden ? { tabIndex: -1, "aria-hidden": true } : {})}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6"
          aria-hidden
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.9-.9L3 21l1.9-5.1A8.5 8.5 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5Z" />
        </svg>
      </button>

      {mounted && <AssistantPanel open={open} onClose={closePanel} />}
    </>
  );
}
