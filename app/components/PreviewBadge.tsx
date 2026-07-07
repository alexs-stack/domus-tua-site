"use client";

import { useState } from "react";
import { useLocale } from "./i18n/LocaleProvider";
import { SegnoDomus } from "./BrandMotif";
import type { DemoChecklistRow } from "../lib/demoStatus";

// Badge di "anteprima" mostrato SOLO quando NEXT_PUBLIC_PREVIEW_BADGE === "true".
// Serve a segnalare in presentazione/demo che alcuni contenuti sono in verifica
// (immobili, recensioni, testi) e che alcune integrazioni sono live e altre no.
// Non attivo in produzione se la variabile non è impostata su "true".
//
// La `checklist` (logo / immobili / recensioni / hero / lead) arriva come PROP dal layout
// (server), che la calcola con getDemoStatus() — così può leggere anche env server-only
// (es. SHEETS_WEBHOOK_URL) senza esporne mai i valori al client.

const copy = {
  it: { label: "Preview — contenuti in verifica", detail: "Stato integrazioni", dismiss: "Nascondi avviso di anteprima" },
  en: { label: "Preview — content under review", detail: "Integrations status", dismiss: "Hide preview notice" },
  fr: { label: "Aperçu — contenu en vérification", detail: "État des intégrations", dismiss: "Masquer l’avis d’aperçu" },
  de: { label: "Vorschau — Inhalte in Prüfung", detail: "Integrationsstatus", dismiss: "Vorschauhinweis ausblenden" },
  es: { label: "Vista previa — contenido en verificación", detail: "Estado de integraciones", dismiss: "Ocultar aviso de vista previa" },
};

export default function PreviewBadge({ checklist = [] }: { checklist?: DemoChecklistRow[] }) {
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const { locale } = useLocale();
  const c = copy[locale];

  if (process.env.NEXT_PUBLIC_PREVIEW_BADGE !== "true" || hidden) return null;

  return (
    <div className="fixed bottom-5 left-5 z-40 max-w-[calc(100vw-2.5rem)] print:hidden">
      {/* Pannello espanso: checklist onesta di cosa è live e cosa è ancora demo. */}
      {open && checklist.length > 0 && (
        <div className="mb-2 w-[17rem] max-w-[calc(100vw-2.5rem)] rounded-2xl border border-red/20 bg-paper/95 p-3.5 shadow-[0_24px_60px_-28px_rgba(26,24,22,0.6)] backdrop-blur-md">
          <p className="mb-2 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-stone">
            {c.detail}
          </p>
          <ul className="flex flex-col gap-1.5">
            {checklist.map((row) => (
              <li key={row.label} className="flex items-center justify-between gap-3 text-[0.78rem]">
                <span className="text-ink/80">{row.label}</span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[0.68rem] font-semibold ${
                    row.ok ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                  }`}
                >
                  <span
                    aria-hidden
                    className={`h-1.5 w-1.5 rounded-full ${row.ok ? "bg-emerald-500" : "bg-amber-500"}`}
                  />
                  {row.value}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center gap-2.5 rounded-full border border-red/25 bg-red-soft/90 py-1.5 pl-3 pr-2 shadow-[0_16px_40px_-20px_rgba(210,10,10,0.55)] backdrop-blur-sm">
        <SegnoDomus className="hidden h-3 w-7 sm:block" embrace={false} />
        {checklist.length > 0 ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-red-dark underline-offset-4 hover:underline"
          >
            {c.label}
          </button>
        ) : (
          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-red-dark">
            {c.label}
          </span>
        )}
        <button
          type="button"
          onClick={() => setHidden(true)}
          aria-label={c.dismiss}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-red-dark/70 transition-colors hover:bg-red/10 hover:text-red-dark"
        >
          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
