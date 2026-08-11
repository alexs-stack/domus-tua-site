"use client";

// Banner consenso cookie (GDPR/ePrivacy). Registra la scelta e fa da gate per tutto ciò che
// è di terze parti (oggi il widget recensioni Trustindex, domani eventuali analytics).
// Multilingua.
//
// Il banner è la UI: la logica del consenso (nome del cookie, lettura, scrittura, notifica)
// vive in app/lib/consent.ts, unica implementazione condivisa con i gate.
import MarkDomus from "./MarkDomus";
import { useCallback, useEffect, useRef, useState } from "react";
import { setOverlay } from "../lib/ui/overlays";
import Link from "next/link";
import { useLocale } from "./i18n/LocaleProvider";
import { INTRO_EVENT, isIntroRunning } from "./motion/Preloader";
import { readConsent, writeConsent, type ConsentValue } from "../lib/consent";

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

  // La VISIBILITÀ non la decide più questo effect: la decide `html[data-consent]`,
  // messo dall'inline script del layout prima del primo paint (vedi globals.css,
  // blocco .dt-consent). Il markup è sempre nel documento. Qui si governa solo
  // ciò che il CSS non può sapere: il focus, il registro degli overlay, e il caso
  // in cui il banner debba aspettare la fine dell'intro.
  useEffect(() => {
    const html = document.documentElement;
    if (readConsent() !== null) {
      // Scelta già fatta. Lo script pre-paint lo sapeva già e non ha messo
      // l'attributo; questa è la rete per il caso in cui il cookie sia arrivato
      // fra il paint e l'idratazione (un'altra scheda, un back/forward).
      html.removeAttribute("data-consent");
      return;
    }
    // Mai sotto il preloader: il banner sposterebbe il focus su "Accetta" mentre
    // è coperto dall'overlay (Enter per saltare l'intro accetterebbe i cookie
    // alla cieca). Appare al handoff dell'intro — ed è per questo che lo script
    // pre-paint NON mette l'attributo quando il sipario sta per partire.
    if (!isIntroRunning()) {
      html.setAttribute("data-consent", ""); // idempotente: lo script l'ha già messo
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShow(true);
      return;
    }
    const onIntroDone = () => {
      html.setAttribute("data-consent", "");
      setShow(true);
    };
    window.addEventListener(INTRO_EVENT, onIntroDone, { once: true });
    // Safety: se l'evento va perso, il banner appare comunque.
    const safety = window.setTimeout(onIntroDone, 6000);
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

  const choose = useCallback((v: ConsentValue) => {
    // Scrive il cookie E notifica i gate montati (es. Trustindex in Reviews): niente reload.
    writeConsent(v);
    // L'attributo è ciò che rende visibile il pannello: toglierlo è la chiusura.
    document.documentElement.removeAttribute("data-consent");
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

  // Finché il banner è a schermo occupa la stessa posizione del pannello assistente
  // (`inset-x-3 bottom-3`, stesso z): lo dichiariamo, così il launcher si toglie di mezzo
  // e la scelta sui cookie resta la prima cosa da fare.
  useEffect(() => {
    setOverlay("cookie-consent", show);
    return () => setOverlay("cookie-consent", false);
  }, [show]);

  // Nessun `if (!show) return null`: il pannello sta SEMPRE nel documento e a
  // nasconderlo è `.dt-consent { display: none }` finché l'attributo non arriva.
  // È la differenza fra un elemento che dipinge col resto della pagina e uno che
  // aspetta l'idratazione — cioè fra 1,4s e 5,6s di LCP su rete lenta.
  // `display: none` lo toglie anche dall'albero di accessibilità e dal giro del
  // Tab, quindi nascosto non è raggiungibile: è la stessa garanzia di prima.
  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-desc"
      onKeyDown={onKeyDown}
      className="dt-consent fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-2xl rounded-[1.5rem] border border-line bg-paper/95 p-4 shadow-[0_30px_70px_-30px_rgba(26,24,22,0.5)] backdrop-blur-xl sm:inset-x-auto sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:p-5"
    >
      <h2 id="cookie-consent-title" className="sr-only">
        {c.aria}
      </h2>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          {/* Monogramma ufficiale, non un segno ridisegnato. Vettoriale. */}
          <MarkDomus className="mt-0.5 hidden h-7 w-auto shrink-0 sm:block" />
          <p id="cookie-consent-desc" className="text-[0.86rem] leading-relaxed text-graphite">
            {c.text}{" "}
            <Link href="/cookie" className="font-semibold text-red underline underline-offset-2 hover:text-red-dark">
              {c.policy}
            </Link>
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          {/* Classi del CTA system direttamente sui <button> nativi (acceptRef
              richiede il nodo; niente freccia: è un consenso, non un redirect). */}
          <button
            type="button"
            onClick={() => choose("rejected")}
            className="dt-btn dt-btn--ghost dt-btn--sm"
          >
            {c.reject}
          </button>
          <button
            ref={acceptRef}
            type="button"
            onClick={() => choose("accepted")}
            className="dt-btn dt-btn--cta dt-btn--cta-solid dt-btn--sm"
          >
            <span className="dt-btn__label">{c.accept}</span>
            <span className="dt-btn__fill" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
