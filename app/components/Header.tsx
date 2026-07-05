"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Logo } from "./Logo";
import { ArrowUpRight, Whatsapp } from "./Icons";
import { nav, site } from "../lib/site";
import { useDict } from "./i18n/LocaleProvider";
import LanguageSwitcher from "./i18n/LanguageSwitcher";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const d = useDict();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);

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

  // Accessibilità menu mobile: Escape chiude, focus intrappolato dentro il
  // pannello, focus sul primo elemento all'apertura e ripristino sul toggle
  // alla chiusura.
  useEffect(() => {
    if (!open) return;

    const menu = menuRef.current;
    if (!menu) return;

    const focusables = () =>
      Array.from(
        menu.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);

    // Sposta il focus sul primo elemento interattivo del menu.
    focusables()[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first || !menu.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last || !menu.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    };

    // Copia il ref in una variabile locale per la cleanup (evita il warning ref-in-cleanup).
    const toggle = toggleRef.current;
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      // Ripristina il focus sul pulsante hamburger alla chiusura.
      toggle?.focus();
    };
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 flex justify-center px-4 transition-colors duration-500 ${
        scrolled ? "" : "bg-gradient-to-b from-ink/60 via-ink/20 to-transparent pb-6"
      }`}
    >
      <div
        className={`mt-3 flex w-full max-w-[1240px] items-center justify-between gap-4 rounded-full px-3 pl-5 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          scrolled
            ? "border border-line/70 bg-paper/80 py-2 shadow-[0_18px_50px_-28px_rgba(26,24,22,0.45)] backdrop-blur-xl"
            : "border border-white/15 bg-ink/20 py-3 backdrop-blur-md"
        }`}
      >
        <Link href="/" className="shrink-0" aria-label="Domus Tua, vai alla home">
          {/* Sopra l'hero scuro il logo diventa una silhouette chiara; da scrollato torna a colori. */}
          <span className={scrolled ? "" : "[filter:brightness(0)_invert(1)]"}>
            <Logo />
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-3.5 py-2 text-[0.82rem] font-medium transition-colors duration-300 ${
                scrolled
                  ? "text-graphite hover:bg-cream-deep hover:text-ink"
                  : "text-cream/90 hover:bg-cream/15 hover:text-white"
              }`}
            >
              {d.nav[item.key]}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={site.whatsapp.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={d.header.whatsapp}
            className={`hidden h-11 w-11 items-center justify-center rounded-full border transition-all duration-300 sm:flex ${
              scrolled
                ? "border-line text-graphite hover:border-red hover:text-red"
                : "border-cream/40 text-cream hover:border-cream hover:text-white"
            }`}
          >
            <Whatsapp className="h-5 w-5" />
          </a>

          <div className="hidden sm:block">
            <LanguageSwitcher light={!scrolled} />
          </div>

          <Link
            href="/#contatti"
            className="group hidden items-center gap-2 rounded-full bg-red py-2.5 pl-5 pr-2.5 text-[0.85rem] font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-red-dark active:scale-[0.98] sm:flex"
          >
            {d.header.valuta}
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </Link>

          {/* Hamburger */}
          <button
            ref={toggleRef}
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Chiudi menu" : "Apri menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className={`relative flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-300 active:scale-95 lg:hidden ${
              scrolled
                ? "border-line text-ink hover:border-red hover:text-red"
                : "border-cream/40 text-cream hover:border-cream"
            }`}
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
        ref={menuRef}
        id="mobile-menu"
        aria-hidden={!open}
        inert={!open ? true : undefined}
        className={`fixed inset-0 z-40 flex flex-col bg-cream/90 px-6 pb-10 pt-28 backdrop-blur-2xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] lg:hidden ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <nav className="flex flex-col">
          {nav.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`border-b border-line/70 py-4 font-display text-3xl font-medium text-ink transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                open ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
              }`}
              style={{ transitionDelay: open ? `${120 + i * 55}ms` : "0ms" }}
            >
              {d.nav[item.key]}
            </Link>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-3 pt-8">
          <Link
            href="/#contatti"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-2 rounded-full bg-red py-4 text-base font-semibold text-white transition-all duration-300 hover:bg-red-dark active:scale-[0.98]"
          >
            {d.header.valuta}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
          <a
            href={site.whatsapp.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-full border border-line bg-paper py-4 text-base font-semibold text-ink transition-colors duration-300 hover:border-red active:scale-[0.98]"
          >
            <Whatsapp className="h-5 w-5 text-red" /> {d.header.whatsapp}
          </a>
          <div className="pt-2">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
}
