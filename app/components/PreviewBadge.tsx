"use client";

import { useState } from "react";
import { useLocale } from "./i18n/LocaleProvider";
import { SegnoDomus } from "./BrandMotif";

// Badge di "anteprima" mostrato SOLO quando NEXT_PUBLIC_PREVIEW_BADGE === "true".
// Serve a segnalare in presentazione/demo che alcuni contenuti sono provvisori
// (immobili, recensioni, testi) e vanno sostituiti con quelli reali del cliente.
// Non attivo in produzione se la variabile non è impostata.

const copy = {
  it: {
    label: "Preview — contenuti demo da sostituire",
    dismiss: "Nascondi avviso di anteprima",
  },
  en: {
    label: "Preview — demo content to be replaced",
    dismiss: "Hide preview notice",
  },
  fr: {
    label: "Aperçu — contenu de démonstration à remplacer",
    dismiss: "Masquer l’avis d’aperçu",
  },
  de: {
    label: "Vorschau — Demo-Inhalte, die ersetzt werden",
    dismiss: "Vorschauhinweis ausblenden",
  },
  es: {
    label: "Vista previa — contenido demo por sustituir",
    dismiss: "Ocultar aviso de vista previa",
  },
};

export default function PreviewBadge() {
  const [hidden, setHidden] = useState(false);
  const { locale } = useLocale();
  const c = copy[locale];

  if (process.env.NEXT_PUBLIC_PREVIEW_BADGE !== "true" || hidden) return null;

  return (
    <div className="pointer-events-none fixed bottom-5 left-5 z-40 max-w-[calc(100vw-2.5rem)] print:hidden">
      <div className="pointer-events-auto flex items-center gap-2.5 rounded-full border border-red/25 bg-red-soft/90 py-1.5 pl-3 pr-2 shadow-[0_16px_40px_-20px_rgba(210,10,10,0.55)] backdrop-blur-sm">
        <SegnoDomus className="hidden h-3 w-7 sm:block" embrace={false} />
        <span className="text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-red-dark">
          {c.label}
        </span>
        <button
          type="button"
          onClick={() => setHidden(true)}
          aria-label={c.dismiss}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-red-dark/70 transition-colors hover:bg-red/10 hover:text-red-dark"
        >
          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" aria-hidden>
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
