"use client";

import { useEffect, useState } from "react";
import { Whatsapp } from "./Icons";
import { Cta } from "./primitives/Cta";
import { site } from "../lib/site";
import { hasOverlay, subscribeOverlays } from "../lib/ui/overlays";
import { useLocale } from "./i18n/LocaleProvider";

// Barra d'azione persistente SOLO su mobile (<sm): su mobile l'header non mostra la CTA
// "Valuta", quindi teniamo a portata di pollice valutazione + WhatsApp. Compare dopo l'hero.
const copy = {
  it: { cta: "Valuta gratis", wa: "Scrivici su WhatsApp" },
  en: { cta: "Free valuation", wa: "Message us on WhatsApp" },
  fr: { cta: "Estimation gratuite", wa: "Écrivez-nous sur WhatsApp" },
  de: { cta: "Gratis bewerten", wa: "Auf WhatsApp schreiben" },
  es: { cta: "Valoración gratis", wa: "Escríbenos por WhatsApp" },
} as const;

export default function MobileActionBar() {
  const { locale } = useLocale();
  const c = copy[locale];
  const [show, setShow] = useState(false);
  const [atContact, setAtContact] = useState(false);
  // Una superficie a tutto schermo è aperta (banner cookie, menu mobile, quick look).
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 520);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Nascondi la barra quando la sezione contatti è in vista: lì c'è già il form con la sua CTA,
  // così la barra ("Valuta gratis") non compete né copre il modulo. Su pagine senza #contatti
  // (osservatore non agganciato) il comportamento resta invariato.
  useEffect(() => {
    const el = document.getElementById("contatti");
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setAtContact(entry.isIntersecting),
      { rootMargin: "0px 0px -35% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // LA BARRA SI TOGLIE DI MEZZO QUANDO C'È UNA SUPERFICIE APERTA, E IL CASO CHE LO
  // RENDE OBBLIGATORIO È IL BANNER COOKIE.
  //
  // Non è una sovrapposizione parziale: banner e barra occupano lo STESSO rettangolo
  // (`fixed inset-x-3`, stessa quota dal fondo). Il banner sta a z-60, la barra a
  // z-40 — quindi finora, sul telefono, il consenso copriva la CTA primaria del sito
  // e ci si trovava a premere «Valuta gratis» attraverso un pannello, cioè a premere
  // «Accetta». Due cose che si contendono lo stesso pollice, e nessuna delle due che
  // lo sa.
  //
  // DELLE DUE USCITE — impilarle o farne sparire una — scelgo la seconda:
  //  · l'altezza del banner non è una costante da mettere in un `calc()`: cambia con
  //    la lingua (cinque) e con quante righe manda a capo il testo. Impilare vorrebbe
  //    dire misurare a runtime e rifare il conto a ogni cambio, per uno stato che dura
  //    pochi secondi;
  //  · e anche riuscendoci, banner più barra a 390px sono ~40% di schermo di cromo
  //    sopra il contenuto.
  //  · Chi resta è chi è transitorio: il consenso si dà una volta, la barra è per
  //    sempre. L'ordine delle cose da fare lo detta la cosa che finisce.
  //
  // Il meccanismo esiste già ed è quello giusto (app/lib/ui/overlays.ts: «chi ha
  // elementi fissi si tolga di mezzo»): lo usa il launcher della chat per la stessa
  // ragione. Qui arriva gratis anche il menu mobile, che copriva la barra col suo
  // overlay lasciandone i comandi vivi sotto.
  useEffect(() => {
    const sync = () => setBlocked(hasOverlay());
    sync();
    return subscribeOverlays(sync);
  }, []);

  const visible = show && !atContact && !blocked;

  return (
    <div
      className={`fixed inset-x-3 z-40 flex items-center gap-2 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] sm:hidden ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
      }`}
      // Questo `env()` ha smesso di valere zero solo in fase 4, con `viewportFit:
      // "cover"` nel layout: fino ad allora la riga era corretta e inerte insieme.
      // I 12px sono il margine gemello di `inset-x-3`, non un compenso allo zero —
      // l'inset si somma una volta sola e la barra sale di quel tanto, senza doppioni.
      style={{ bottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      <Cta
        href="/#contatti"
        variant="cta-solid"
        size="md"
        className="flex-1 !shadow-[0_18px_40px_-16px_rgba(210,10,10,0.75)]"
      >
        {c.cta}
      </Cta>
      <a
        href={site.whatsapp.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={c.wa}
        className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border border-line bg-paper text-red shadow-[0_12px_30px_-14px_rgba(26,24,22,0.5)] transition-transform duration-300 active:scale-95"
      >
        <Whatsapp className="h-6 w-6" />
      </a>
    </div>
  );
}
