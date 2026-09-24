"use client";

// Banner consenso cookie (GDPR/ePrivacy). Registra la scelta e fa da gate per tutto ciò che
// è di terze parti (oggi il widget recensioni Trustindex, domani eventuali analytics).
// Multilingua.
//
// Il banner è la UI: la logica del consenso (nome del cookie, lettura, scrittura, notifica)
// vive in app/lib/consent.ts, unica implementazione condivisa con i gate.
//
// NON È UN DIALOG, E DA QUI SONO SPARITI TRE MECCANISMI (parità mobile, fase 4).
//
// Il pannello portava `role="dialog" aria-modal="true"` senza blocco dello scroll e
// senza `inert` sul resto della pagina: `aria-modal` dice a chi legge a schermo letto
// «fuori di qui non c'è nulla di raggiungibile», e fuori di qui c'era tutto il sito,
// navigabile col dito e con il Tab. Una promessa falsa fatta a chi non può verificarla.
//
// Delle due uscite ho scelto la seconda, e la ragione è che cos'È un avviso cookie:
// non è un compito che la persona ha aperto, è un'interruzione che le arriva addosso.
// Un dialog modale è la forma giusta per «hai chiesto tu di fare X, finiscilo o
// annullalo». Renderlo modale davvero — scroll lock più `inert` — vorrebbe dire non
// far leggere una riga del sito prima di aver deciso: è il cookie wall che le linee
// guida EDPB trattano come consenso non libero, e in questo repo significherebbe
// anche rimettere le mani sulla catena di blocco Lenis (mobile-parity §1.5a, §5.3)
// e aggiungere uno scrim a pieno viewport, cioè un candidato LCP nuovo il giorno
// dopo che ne abbiamo tolto uno (§9.1).
//
// Resta quel che è sempre stato: una REGIONE con dentro delle azioni. Landmark con
// nome (l'h2 sr-only), quindi raggiungibile in qualunque momento dalla lista dei
// landmark, e collocata prima di #main nel documento (vedi layout.tsx), quindi
// raggiungibile col Tab senza attraversare la pagina.
//
// Niente `aria-live`: il banner è nell'HTML servito e dipinge con la pagina, non è
// un annuncio. Sul percorso con il sipario arriva al handoff, ma un landmark che
// compare in silenzio è meno invadente di un paragrafo intero letto sopra la voce
// di chi sta già leggendo.
import MarkDomus from "./MarkDomus";
import { useCallback, useEffect, useState } from "react";
import { setOverlay } from "../lib/ui/overlays";
import Link from "next/link";
import { useLocale } from "./i18n/LocaleProvider";
import { isIntroRunning, hasIntroFired } from "./motion/Preloader";
import { INTRO_EVENT, HERO_REST_MS } from "../lib/motion/intro-constants";
import { readConsent, writeConsent, CONSENT_REOPEN_EVENT, type ConsentValue } from "../lib/consent";

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

  // La VISIBILITÀ non la decide più questo effect: la decide `html[data-consent]`,
  // messo dall'inline script del layout prima del primo paint (vedi globals.css,
  // blocco .dt-consent). Il markup è sempre nel documento. Qui si governa solo
  // ciò che il CSS non può sapere: il registro degli overlay, dove va il focus alla
  // chiusura, e il caso in cui il banner debba aspettare la fine dell'intro.
  useEffect(() => {
    const html = document.documentElement;
    if (readConsent() !== null) {
      // Scelta già fatta. Lo script pre-paint lo sapeva già e non ha messo
      // l'attributo; questa è la rete per il caso in cui il cookie sia arrivato
      // fra il paint e l'idratazione (un'altra scheda, un back/forward).
      html.removeAttribute("data-consent");
      return;
    }
    // Mai sotto il preloader. La ragione scritta qui era «il banner sposterebbe il
    // focus su Accetta mentre è coperto dall'overlay, e Invio per saltare l'intro
    // accetterebbe i cookie alla cieca»: quel pericolo non esiste più, perché il
    // banner il focus non lo prende più (vedi sopra). La regola però resta, e con
    // una ragione più forte di prima: ora che il pannello sta PRIMA di #main nel
    // documento, sotto il sipario sarebbe il primo bersaglio del Tab — tre comandi
    // invisibili sotto un telo opaco. Appare al handoff dell'intro, ed è per questo
    // che lo script pre-paint NON mette l'attributo quando il sipario sta per partire.
    // `hasIntroFired()`: l'handoff è già partito (Preloader idratato a tuffo
    // cominciato lo spara nel proprio effect, che precede questo) — si mostra
    // adesso, come se l'evento fosse appena arrivato, invece di aspettare la rete.
    if (!isIntroRunning() || hasIntroFired()) {
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
    // Safety: se l'evento va perso, il banner appare comunque — HERO_REST_MS
    // (intro-constants.ts: dive + 200 ms, contato da qui), lo stesso orologio
    // dell'hero. Il handoff vero arriva da Preloader.tsx a INTRO_T.dive.
    const safety = window.setTimeout(onIntroDone, HERO_REST_MS);
    return () => {
      window.removeEventListener(INTRO_EVENT, onIntroDone);
      window.clearTimeout(safety);
    };
  }, []);

  // Riapertura: un link "Preferenze cookie" (footer/Cookie Policy) rimostra il banner anche
  // dopo una scelta già fatta, così la revoca è sempre a un clic (reopenConsent in lib/consent).
  useEffect(() => {
    const onReopen = () => {
      document.documentElement.setAttribute("data-consent", "");
      setShow(true);
    };
    window.addEventListener(CONSENT_REOPEN_EVENT, onReopen);
    return () => window.removeEventListener(CONSENT_REOPEN_EVENT, onReopen);
  }, []);

  // QUI C'ERANO DUE MECCANISMI, ED È GIUSTO DIRE PERCHÉ NON CI SONO PIÙ.
  //
  // 1. Lo spostamento del focus su «Accetta» all'idratazione. Buttava fuori dal punto
  //    in cui la persona stava — e, ora che il banner dipinge insieme alla pagina
  //    invece che quattro secondi dopo (§9.1), il primo Invio o Spazio dato per
  //    qualunque altro motivo appena caricata la pagina sarebbe stato un consenso
  //    dato senza leggere. Un avviso non chiama a sé: si fa trovare.
  // 2. La trap del Tab. Era il braccio armato di `aria-modal`: senza quella
  //    dichiarazione, chiudere il Tab dentro tre comandi sarebbe una gabbia e basta,
  //    perché il resto della pagina è davvero navigabile.
  //
  // Con essi se ne va anche il ref del "focus da restituire": non c'è più niente da
  // restituire, e tenere un ref che ricorda solo chi aveva il focus all'idratazione
  // (cioè il body) sarebbe un meccanismo vivo all'apparenza e morto nei fatti.
  // Alla chiusura il focus va su #main, che nel documento è l'elemento subito dopo
  // il banner: chi era arrivato ai bottoni col Tab riprende esattamente da lì.
  // `preventScroll` perché #main è in cima e senza di esso una scelta presa a metà
  // pagina riporterebbe su di colpo. (`document.body.focus()` di prima non faceva
  // nulla comunque: il body non è focalizzabile senza tabindex.)
  const choose = useCallback((v: ConsentValue) => {
    // Scrive il cookie E notifica i gate montati (es. Trustindex in Reviews): niente reload.
    writeConsent(v);
    // L'attributo è ciò che rende visibile il pannello: toglierlo è la chiusura.
    document.documentElement.removeAttribute("data-consent");
    setShow(false);
    document.getElementById("main")?.focus({ preventScroll: true });
  }, []);

  // Finché il banner è a schermo occupa la stessa posizione del pannello assistente
  // (`inset-x-3` in fondo, stesso z): lo dichiariamo, così il launcher si toglie di mezzo
  // e la scelta sui cookie resta la prima cosa da fare.
  // Dalla fase 4 al registro è iscritta anche MobileActionBar, per la stessa ragione e
  // con più forza: sul telefono banner e barra azioni sono lo STESSO rettangolo, e il
  // banner ci vince sopra (z-60 contro z-40) coprendo la CTA primaria del sito.
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
  // `aria-describedby` se n'è andato con `role="dialog"`: fuori da un widget la
  // descrizione non viene annunciata in modo affidabile, e il paragrafo è comunque la
  // prima cosa dentro la regione. L'id resta perché è quello dell'elemento LCP misurato.
  return (
    <div
      role="region"
      aria-labelledby="cookie-consent-title"
      className="dt-consent fixed inset-x-3 z-[60] mx-auto max-w-2xl rounded-[1.5rem] border border-line bg-paper/95 p-4 shadow-[0_30px_70px_-30px_rgba(26,24,22,0.5)] backdrop-blur-xl sm:inset-x-auto sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:p-5"
      // Era `bottom-3` e basta: con `viewportFit: "cover"` (layout.tsx) quei 12px si
      // misurano ora dal bordo FISICO dello schermo, cioè il banner finirebbe a
      // cavallo della barra gesti dell'iPhone — proprio sopra i due bottoni. Stessa
      // aritmetica di MobileActionBar, così i due restano allineati fra loro.
      // Su desktop l'inset vale 0 e la posizione non si muove di un pixel.
      style={{ bottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
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
          {/* Classi del CTA system direttamente sui <button> nativi: niente freccia,
              è un consenso, non un redirect. (Qui la nota diceva anche «acceptRef
              richiede il nodo»: quel ref non c'è più, il banner non prende il focus.) */}
          <button
            type="button"
            onClick={() => choose("rejected")}
            className="dt-btn dt-btn--ghost dt-btn--sm"
          >
            {c.reject}
          </button>
          <button
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
