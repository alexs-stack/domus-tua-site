"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { ArrowUpRight, Whatsapp } from "./Icons";
import { site } from "../lib/site";
import { useDict } from "./i18n/LocaleProvider";
import LanguageSwitcher from "./i18n/LanguageSwitcher";

// Navigazione header — divisa per gerarchia (Prompt 4): 5 voci primarie + un menu "Altro"
// per le secondarie. Href espliciti (non riusa site.nav, che resta com'è per il footer).
type NavKey =
  | "vendi" | "acquista" | "metodo" | "case" | "chiSiamo"
  | "openDomus" | "recensioni" | "servizi" | "contatti";

type NavItem = { href: string; key?: NavKey; label?: string };

const primaryNav: NavItem[] = [
  { href: "/case", key: "case" },
  { href: "/vendi", key: "vendi" },
  { href: "/acquista", key: "acquista" },
  { href: "/metodo", key: "metodo" },
  { href: "/chi-siamo", key: "chiSiamo" },
];

// "Domus D.O.C." è un nome-brand (uguale in ogni lingua) → label letterale, non da dizionario.
const moreNav: NavItem[] = [
  { href: "/open-domus", key: "openDomus" },
  { href: "/metodo#domus-doc", label: "Domus D.O.C." },
  { href: "/recensioni", key: "recensioni" },
  { href: "/servizi", key: "servizi" },
  { href: "/contatti", key: "contatti" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false); // menu mobile
  const [moreOpen, setMoreOpen] = useState(false); // dropdown "Altro" (desktop)
  const d = useDict();
  const pathname = usePathname();
  // Voce attiva: match esatto o prefisso di sezione (es. /case/<slug> → "Case" attivo).
  const isActive = (href: string) => {
    const base = href.split("#")[0]!;
    return pathname === base || pathname.startsWith(`${base}/`);
  };
  const label = (item: NavItem) => item.label ?? d.nav[item.key!];
  // "Altro" è attivo se la pagina corrente è una delle sue voci (esclusi gli anchor su pagine primarie).
  const moreActive = moreNav.some((i) => !i.href.includes("#") && isActive(i.href));

  const menuRef = useRef<HTMLDivElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const moreRef = useRef<HTMLDivElement | null>(null);
  const moreBtnRef = useRef<HTMLButtonElement | null>(null);

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

  // (La chiusura su navigazione è gestita dagli onClick dei link: mobile → setOpen(false),
  // dropdown → setMoreOpen(false). Evitiamo setState in un effect su [pathname].)

  // Dropdown "Altro": chiusura su click esterno + Escape (con ritorno di focus al bottone).
  // Funziona con mouse, touch (click) e tastiera.
  useEffect(() => {
    if (!moreOpen) return;
    const onDown = (e: PointerEvent) => {
      if (!moreRef.current?.contains(e.target as Node)) setMoreOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setMoreOpen(false);
        moreBtnRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [moreOpen]);

  // Accessibilità menu mobile: Escape chiude, focus intrappolato dentro il pannello, focus
  // sul primo elemento all'apertura e ripristino sul toggle alla chiusura.
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
      const first = items[0]!;
      const last = items[items.length - 1]!;
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

    const toggle = toggleRef.current;
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      toggle?.focus();
    };
  }, [open]);

  // Stile voce nav coerente sopra hero scuro (unscrolled) e su island chiaro (scrolled).
  const navItemClass = (active: boolean) =>
    `whitespace-nowrap rounded-full px-3 py-2 text-[0.82rem] transition-colors duration-300 ${
      active ? "font-semibold" : "font-medium"
    } ${
      scrolled
        ? active
          ? "bg-red-soft text-red-dark"
          : "text-graphite hover:bg-cream-deep hover:text-ink"
        : active
          ? "bg-cream/20 text-white"
          : "text-cream/90 hover:bg-cream/15 hover:text-white"
    }`;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 flex justify-center px-4 transition-colors duration-500 ${
        scrolled ? "" : "bg-gradient-to-b from-ink/60 via-ink/20 to-transparent pb-6"
      }`}
    >
      <div
        className={`mt-3 flex w-full max-w-[1240px] items-center justify-between gap-3 rounded-full px-2.5 pl-5 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          scrolled
            ? "border border-line/70 bg-paper/80 py-1.5 shadow-[0_16px_44px_-30px_rgba(26,24,22,0.45)] backdrop-blur-xl"
            : "border border-white/15 bg-ink/20 py-2 backdrop-blur-md"
        }`}
      >
        <Link href="/" className="shrink-0" aria-label="Domus Tua, vai alla home">
          {/* Sopra l'hero scuro il logo diventa una silhouette chiara; da scrollato torna a colori. */}
          <span className={scrolled ? "" : "[filter:brightness(0)_invert(1)]"}>
            <Logo />
          </span>
        </Link>

        {/* Desktop nav: 5 voci primarie + "Altro" */}
        <nav className="hidden items-center gap-0.5 lg:flex">
          {primaryNav.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={navItemClass(active)}
              >
                {label(item)}
              </Link>
            );
          })}

          {/* Menu "Altro" — click toggle (mouse/touch/tastiera). */}
          <div ref={moreRef} className="relative">
            <button
              ref={moreBtnRef}
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={moreOpen}
              aria-controls="more-menu"
              className={`${navItemClass(moreActive)} inline-flex items-center gap-1`}
            >
              {d.header.altro}
              <svg
                viewBox="0 0 12 12"
                aria-hidden
                className={`h-2.5 w-2.5 transition-transform duration-300 ${moreOpen ? "rotate-180" : ""}`}
              >
                <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {moreOpen && (
              <div
                id="more-menu"
                role="menu"
                aria-label={d.header.altro}
                className="absolute right-0 top-full z-10 mt-2 min-w-[13rem] origin-top-right rounded-2xl border border-line bg-paper p-1.5 shadow-[0_24px_60px_-30px_rgba(26,24,22,0.5)]"
              >
                {moreNav.map((item) => {
                  const active = !item.href.includes("#") && isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      role="menuitem"
                      aria-current={active ? "page" : undefined}
                      onClick={() => setMoreOpen(false)}
                      className={`block rounded-xl px-3.5 py-2.5 text-[0.85rem] transition-colors duration-200 ${
                        active ? "bg-red-soft font-semibold text-red-dark" : "font-medium text-graphite hover:bg-cream-deep hover:text-ink"
                      }`}
                    >
                      {label(item)}
                    </Link>
                  );
                })}

                {/* WhatsApp come azione secondaria, dentro "Altro" (non è un controllo rosso pieno). */}
                <a
                  href={site.whatsapp.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  role="menuitem"
                  onClick={() => setMoreOpen(false)}
                  className="mt-1 flex items-center gap-2.5 rounded-xl border-t border-line px-3.5 py-2.5 text-[0.85rem] font-medium text-graphite transition-colors duration-200 hover:bg-cream-deep hover:text-red"
                >
                  <Whatsapp className="h-4 w-4 text-red" />
                  {d.header.whatsapp}
                </a>
              </div>
            )}
          </div>
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <LanguageSwitcher light={!scrolled} />
          </div>

          {/* Unico controllo rosso pieno: la valutazione. */}
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

      {/* Mobile overlay — lista completa (primarie + altro), founder-led e premium. */}
      <div
        ref={menuRef}
        id="mobile-menu"
        aria-hidden={!open}
        inert={!open ? true : undefined}
        className={`fixed inset-0 z-40 flex flex-col bg-cream/90 px-6 pb-10 pt-28 backdrop-blur-2xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] lg:hidden ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <nav className="flex flex-col overflow-y-auto">
          {[...primaryNav, ...moreNav].map((item, i) => {
            const active = !item.href.includes("#") && isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={`border-b border-line/70 py-3.5 font-display text-[1.7rem] font-medium transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  active ? "text-red" : "text-ink"
                } ${open ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
                style={{ transitionDelay: open ? `${100 + i * 45}ms` : "0ms" }}
              >
                {label(item)}
              </Link>
            );
          })}
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
