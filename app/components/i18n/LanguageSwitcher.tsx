"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "./LocaleProvider";
import { locales, localeNames, localeShort } from "../../lib/i18n/dictionaries";

function Globe({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" />
    </svg>
  );
}

export default function LanguageSwitcher({ light = false }: { light?: boolean }) {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDoc);
    return () => document.removeEventListener("pointerdown", onDoc);
  }, []);

  const base = light ? "border-cream/25 text-cream/90 hover:border-cream/60" : "border-line text-graphite hover:border-red hover:text-red";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Lingua: ${localeNames[locale]}`}
        className={`flex h-11 items-center gap-1.5 rounded-full border px-3 text-[0.8rem] font-semibold transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red ${base}`}
      >
        <Globe className="h-4 w-4" />
        {localeShort[locale]}
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-40 overflow-hidden rounded-2xl border border-line bg-paper py-1.5 shadow-[0_24px_50px_-24px_rgba(26,24,22,0.5)]"
        >
          {locales.map((l) => (
            <li key={l}>
              <button
                type="button"
                role="option"
                aria-selected={l === locale}
                onClick={() => {
                  setLocale(l);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm transition-colors ${
                  l === locale ? "font-semibold text-red" : "text-graphite hover:bg-cream-deep hover:text-ink"
                }`}
              >
                {localeNames[l]}
                <span className="text-[0.68rem] font-semibold text-stone">{localeShort[l]}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
