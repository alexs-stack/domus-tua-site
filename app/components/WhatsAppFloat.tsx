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
    <a
      href={site.whatsapp.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={d.header.whatsapp}
      className={`group fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-full bg-red py-3 pl-3 pr-5 text-white shadow-[0_20px_45px_-18px_rgba(210,10,10,0.8)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-red-dark active:scale-[0.98] ${
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
      }`}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
        <Whatsapp className="h-5 w-5" />
      </span>
      <span className="hidden text-sm font-semibold sm:block">{d.whatsapp.cta}</span>
    </a>
  );
}
