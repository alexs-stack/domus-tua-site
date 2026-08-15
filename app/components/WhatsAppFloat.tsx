"use client";

import { useEffect, useState } from "react";
import { Whatsapp } from "./Icons";
import { Cta } from "./primitives/Cta";
import { site } from "../lib/site";
import { useDict } from "./i18n/LocaleProvider";
import Magnetic from "./motion/Magnetic";

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
      <Magnetic strength={0.22}>
        <Cta
          href={site.whatsapp.href}
          variant="cta-solid"
          size="sm"
          arrow={false}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={d.header.whatsapp}
          className="!shadow-[0_20px_45px_-18px_rgba(210,10,10,0.8)] !pl-2 !pr-4"
        >
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15"
            style={{ animation: "dt-wa-pulse 8s ease-in-out infinite" }}
          >
            <Whatsapp className="h-5 w-5" />
          </span>
          {d.whatsapp.cta}
        </Cta>
      </Magnetic>
    </div>
  );
}
