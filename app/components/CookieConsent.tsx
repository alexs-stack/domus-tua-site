"use client";

// Banner consenso cookie (GDPR/ePrivacy). MVP: il sito non carica ancora script di
// tracciamento; il banner registra la scelta in un cookie `dt_consent` e fa da gate per
// eventuali analytics futuri (caricarli solo se dt_consent=accepted). Multilingua.
import { useEffect, useState } from "react";
import Link from "next/link";
import { SegnoDomus } from "./BrandMotif";
import { useLocale } from "./i18n/LocaleProvider";

const COOKIE = "dt_consent";

const copy = {
  it: {
    text: "Usiamo cookie tecnici necessari e, con il tuo consenso, cookie di misurazione per migliorare il sito.",
    policy: "Cookie policy",
    accept: "Accetta",
    reject: "Solo necessari",
    aria: "Preferenze cookie",
  },
  en: {
    text: "We use necessary technical cookies and, with your consent, measurement cookies to improve the site.",
    policy: "Cookie policy",
    accept: "Accept",
    reject: "Necessary only",
    aria: "Cookie preferences",
  },
  fr: {
    text: "Nous utilisons des cookies techniques nécessaires et, avec votre consentement, des cookies de mesure pour améliorer le site.",
    policy: "Politique cookies",
    accept: "Accepter",
    reject: "Nécessaires seulement",
    aria: "Préférences cookies",
  },
  de: {
    text: "Wir verwenden notwendige technische Cookies und, mit Ihrer Einwilligung, Mess-Cookies zur Verbesserung der Website.",
    policy: "Cookie-Richtlinie",
    accept: "Akzeptieren",
    reject: "Nur notwendige",
    aria: "Cookie-Einstellungen",
  },
  es: {
    text: "Usamos cookies técnicas necesarias y, con tu consentimiento, cookies de medición para mejorar el sitio.",
    policy: "Política de cookies",
    accept: "Aceptar",
    reject: "Solo necesarias",
    aria: "Preferencias de cookies",
  },
};

function setConsent(value: "accepted" | "rejected") {
  document.cookie = `${COOKIE}=${value}; path=/; max-age=15552000; samesite=lax`;
}

export default function CookieConsent() {
  const { locale } = useLocale();
  const c = copy[locale];
  const [show, setShow] = useState(false);

  useEffect(() => {
    const decided = document.cookie.split("; ").some((r) => r.startsWith(`${COOKIE}=`));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!decided) setShow(true);
  }, []);

  if (!show) return null;

  const choose = (v: "accepted" | "rejected") => {
    setConsent(v);
    setShow(false);
  };

  return (
    <div
      role="dialog"
      aria-label={c.aria}
      className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-2xl rounded-[1.5rem] border border-line bg-paper/95 p-4 shadow-[0_30px_70px_-30px_rgba(26,24,22,0.5)] backdrop-blur-xl sm:inset-x-auto sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:p-5"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <SegnoDomus className="mt-0.5 hidden h-4 w-9 shrink-0 sm:block" embrace={false} />
          <p className="text-[0.86rem] leading-relaxed text-graphite">
            {c.text}{" "}
            <Link href="/cookie" className="font-semibold text-red underline underline-offset-2 hover:text-red-dark">
              {c.policy}
            </Link>
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => choose("rejected")}
            className="rounded-full border border-line bg-paper px-4 py-2.5 text-sm font-semibold text-graphite transition-colors duration-300 hover:border-red hover:text-red active:scale-[0.98]"
          >
            {c.reject}
          </button>
          <button
            type="button"
            onClick={() => choose("accepted")}
            className="rounded-full bg-red px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-red-dark active:scale-[0.98]"
          >
            {c.accept}
          </button>
        </div>
      </div>
    </div>
  );
}
