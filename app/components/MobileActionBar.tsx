"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Whatsapp, ArrowUpRight } from "./Icons";
import { site } from "../lib/site";
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

  const visible = show && !atContact;

  return (
    <div
      className={`fixed inset-x-3 z-40 flex items-center gap-2 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] sm:hidden ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
      }`}
      style={{ bottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      <Link
        href="/#contatti"
        className="flex flex-1 items-center justify-center gap-2 rounded-full bg-red py-3.5 text-[0.95rem] font-semibold text-white shadow-[0_18px_40px_-16px_rgba(210,10,10,0.75)] transition-transform duration-300 active:scale-[0.98]"
      >
        {c.cta}
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </Link>
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
