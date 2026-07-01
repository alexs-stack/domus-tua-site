"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { dictionaries, defaultLocale, locales, type Locale } from "../../lib/i18n/dictionaries";

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  d: (typeof dictionaries)[Locale];
};

const LocaleContext = createContext<Ctx | null>(null);

const COOKIE = "dt_locale";

function readCookie(): Locale {
  if (typeof document === "undefined") return defaultLocale;
  const m = document.cookie.match(new RegExp(`${COOKIE}=([a-z]{2})`));
  const v = m?.[1] as Locale | undefined;
  return v && locales.includes(v) ? v : defaultLocale;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  // Allinea alla preferenza salvata (cookie) dopo l'hydration. È il pattern corretto per
  // sincronizzare uno stato esterno (cookie) evitando il mismatch SSR: il server rende sempre
  // defaultLocale, il client si allinea al primo mount.
  useEffect(() => {
    const saved = readCookie();
    if (saved !== defaultLocale) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocaleState(saved);
      document.documentElement.lang = saved;
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    document.cookie = `${COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = l;
  }, []);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, d: dictionaries[locale] }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}

/** Dizionario della lingua corrente. Uso: const d = useDict(); d.hero.title1 */
export function useDict() {
  return useLocale().d;
}
