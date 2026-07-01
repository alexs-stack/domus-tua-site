"use client";

import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { ArrowUpRight, Whatsapp } from "./Icons";
import { nav, site } from "../lib/site";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4">
      <div
        className={`mt-3 flex w-full max-w-[1240px] items-center justify-between gap-4 rounded-full px-3 pl-5 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          scrolled
            ? "border border-line/70 bg-paper/80 py-2 shadow-[0_18px_50px_-28px_rgba(26,24,22,0.45)] backdrop-blur-xl"
            : "border border-transparent bg-paper/30 py-3 backdrop-blur-sm"
        }`}
      >
        <a href="/" className="shrink-0" aria-label="Domus Tua, vai alla home">
          <Logo />
        </a>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full px-3.5 py-2 text-[0.82rem] font-medium text-graphite transition-colors duration-300 hover:bg-cream-deep hover:text-ink"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={site.whatsapp.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Scrivici su WhatsApp"
            className="hidden h-11 w-11 items-center justify-center rounded-full border border-line text-graphite transition-all duration-300 hover:border-red hover:text-red sm:flex"
          >
            <Whatsapp className="h-5 w-5" />
          </a>

          <a
            href="/#contatti"
            className="group hidden items-center gap-2 rounded-full bg-red py-2.5 pl-5 pr-2.5 text-[0.85rem] font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-red-dark active:scale-[0.98] sm:flex"
          >
            Valuta la tua casa
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </a>

          {/* Hamburger */}
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Chiudi menu" : "Apri menu"}
            aria-expanded={open}
            className="relative flex h-11 w-11 items-center justify-center rounded-full border border-line text-ink lg:hidden"
          >
            <span className="relative block h-3 w-5">
              <span
                className={`absolute left-0 top-0 h-[1.6px] w-5 bg-current transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                  open ? "translate-y-[5.5px] rotate-45" : ""
                }`}
              />
              <span
                className={`absolute bottom-0 left-0 h-[1.6px] w-5 bg-current transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                  open ? "-translate-y-[5.5px] -rotate-45" : ""
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-40 flex flex-col bg-cream/90 px-6 pb-10 pt-28 backdrop-blur-2xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] lg:hidden ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <nav className="flex flex-col">
          {nav.map((item, i) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`border-b border-line/70 py-4 font-display text-3xl font-medium text-ink transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                open ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
              }`}
              style={{ transitionDelay: open ? `${120 + i * 55}ms` : "0ms" }}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-3 pt-8">
          <a
            href="/#contatti"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-2 rounded-full bg-red py-4 text-base font-semibold text-white"
          >
            Valuta la tua casa
            <ArrowUpRight className="h-4 w-4" />
          </a>
          <a
            href={site.whatsapp.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-full border border-line bg-paper py-4 text-base font-semibold text-ink"
          >
            <Whatsapp className="h-5 w-5 text-red" /> Scrivici su WhatsApp
          </a>
        </div>
      </div>
    </header>
  );
}
