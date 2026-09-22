"use client";

import { useEffect, useState } from "react";
import { Whatsapp } from "./Icons";
import { site } from "../lib/site";
import { useDict } from "./i18n/LocaleProvider";

export default function WhatsAppFloat() {
  const [show, setShow] = useState(false);
  const d = useDict();

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    // Il fixed (con la transizione di comparsa) sta sul wrapper NON trasformato;
    // il magnetismo avvolge il bottone dentro. Pulse discreto ~8s sull'icona
    // (spento da reduced-motion via regola globale).
    <div
      // La bolla desktop: distinta dalla barra mobile nelle conversioni (SiteAnalytics.tsx).
      data-conv-source="fluttuante"
      style={{ bottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
      className={`fixed right-5 z-50 hidden transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] sm:block ${
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
      }`}
    >
      {/* Un cerchio rosso con l'icona (le icone tonde sono l'unica curva
          ammessa): il rettangolo con l'etichetta pesava quanto una CTA di
          pagina. L'etichetta resta come nome accessibile e tooltip. */}
      <a
        href={site.whatsapp.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={d.header.whatsapp}
        title={d.whatsapp.cta}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-red text-white transition-colors duration-300 hover:bg-red-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
      >
        <Whatsapp className="h-6 w-6" />
      </a>
    </div>
  );
}
