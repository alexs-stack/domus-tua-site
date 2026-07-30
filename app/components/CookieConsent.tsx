"use client";

// Banner consenso cookie (GDPR/ePrivacy). Registra la scelta nel cookie `dt_consent` e fa da
// gate per gli embed di terze parti (es. Trustindex si carica solo con consenso — vedi
// app/lib/consent.ts + Reviews.tsx) e per il tracking (app/lib/analytics.ts). Multilingua.
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SegnoDomus } from "./BrandMotif";
import { useLocale } from "./i18n/LocaleProvider";
import { INTRO_EVENT, isIntroRunning } from "./motion/Preloader";
import { readConsent, writeConsent } from "../lib/consent";

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

export default function CookieConsent() {
  const { locale } = useLocale();
  const c = copy[locale];
  const [show, setShow] = useState(false);

  const panelRef = useRef<HTMLDivElement | null>(null);
  const acceptRef = useRef<HTMLButtonElement | null>(null);
  // Elemento a cui restituire il focus alla chiusura (chi aveva il focus prima del banner).
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (readConsent() !== null) return;
    // Mai sotto il preloader: il banner sposterebbe il focus su "Accetta" mentre
    // è coperto dall'overlay (Enter per saltare l'intro accetterebbe i cookie
    // alla cieca). Appare al handoff dell'intro.
    if (!isIntroRunning()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShow(true);
      return;
    }
    const onIntroDone = () => setShow(true);
    window.addEventListener(INTRO_EVENT, onIntroDone, { once: true });
    // Safety: se l'evento va perso, il banner appare comunque.
    const safety = window.setTimeout(() => setShow(true), 6000);
    return () => {
      window.removeEventListener(INTRO_EVENT, onIntroDone);
      window.clearTimeout(safety);
    };
  }, []);

  // All'apertura: memorizza il focus corrente e spostalo sull'azione primaria (Accetta).
  useEffect(() => {
    if (!show) return;
    const active = document.activeElement;
    returnFocusRef.current = active instanceof HTMLElement ? active : null;
    acceptRef.current?.focus();
  }, [show]);

  const choose = useCallback((v: "accepted" | "rejected") => {
    // writeConsent notifica i consumatori (useConsent) nello stesso tab: il widget
    // Trustindex compare subito dopo "Accetta", senza reload.
    writeConsent(v);
    setShow(false);
    // Ripristina il focus a chi lo aveva prima (o al body come fallback sicuro).
    const target = returnFocusRef.current;
    if (target && document.contains(target)) target.focus();
    else document.body.focus();
    returnFocusRef.current = null;
  }, []);

  // Trap del Tab all'interno del banner mentre è mostrato: ciclo tra il primo e l'ultimo
  // elemento focalizzabile senza uscire dal dialog.
  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab") return;
    const panel = panelRef.current;
    if (!panel) return;
    const focusable = panel.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const activeEl = document.activeElement;
    if (e.shiftKey) {
      if (activeEl === first || !panel.contains(activeEl)) {
        e.preventDefault();
        last.focus();
      }
    } else if (activeEl === last || !panel.contains(activeEl)) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  if (!show) return null;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-desc"
      onKeyDown={onKeyDown}
      /* Pannello compatto ad angolo, non barra larga centrata (che copriva il centro pagina).
         Mobile: sollevato SOPRA la MobileActionBar (che vive a calc(0.75rem + safe-area)).
         Desktop: in basso a DESTRA, impilato sopra il WhatsApp float (bottom-5, h ~3.75rem) e
         rientrato di 4rem dal bordo per non coprire il rail dei pallini di ThreadNav. Resta
         sulla foto dell'hero: le CTA dell'hero stanno in basso a sinistra. */
      className="fixed inset-x-3 z-[60] mx-auto max-w-md rounded-[1.5rem] border border-line bg-paper/95 p-4 shadow-[0_30px_70px_-30px_rgba(26,24,22,0.5)] backdrop-blur-xl bottom-[calc(0.75rem+4.5rem+env(safe-area-inset-bottom))] sm:inset-x-auto sm:bottom-[calc(1.25rem+3.75rem+0.75rem)] sm:left-auto sm:right-16 sm:mx-0 sm:max-w-sm sm:p-5"
    >
      <h2 id="cookie-consent-title" className="sr-only">
        {c.aria}
      </h2>
      {/* Layout VERTICALE: testo sopra a larghezza piena del pannello (niente colonna stretta
          con una parola per riga), pulsanti in riga sotto. */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <SegnoDomus className="mt-0.5 h-4 w-9 shrink-0" embrace={false} />
          <p id="cookie-consent-desc" className="text-[0.86rem] leading-relaxed text-graphite">
            {c.text}{" "}
            <Link href="/cookie" className="font-semibold text-red underline underline-offset-2 hover:text-red-dark">
              {c.policy}
            </Link>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => choose("rejected")}
            className="flex-1 rounded-full border border-line bg-paper px-4 py-2.5 text-sm font-semibold text-graphite transition-colors duration-300 hover:border-red hover:text-red active:scale-[0.98]"
          >
            {c.reject}
          </button>
          <button
            ref={acceptRef}
            type="button"
            onClick={() => choose("accepted")}
            className="flex-1 rounded-full bg-red px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-red-dark active:scale-[0.98]"
          >
            {c.accept}
          </button>
        </div>
      </div>
    </div>
  );
}
