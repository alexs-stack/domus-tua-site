"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { ArrowUpRight, ChevronDown, Whatsapp } from "./Icons";
import { primaryNav, secondaryNav, site } from "../lib/site";
import { useDict } from "./i18n/LocaleProvider";
import LanguageSwitcher from "./i18n/LanguageSwitcher";
import { getLenis } from "./motion/SmoothScroll";
import { setMenuOpen } from "../lib/overlayState";
import { isTransitionCovering } from "./motion/PageTransition";
import { gsap, ScrollTrigger, useGSAP, MQ, dur, stagger } from "../lib/motion/gsap";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  // Menu secondario "Altro" (solo desktop): raccoglie i percorsi che non sono primari.
  const [moreOpen, setMoreOpen] = useState(false);
  const d = useDict();
  const pathname = usePathname();
  // Voce di nav attiva: match esatto o prefisso di sezione (es. /case/<slug> → "Case" attivo).
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  // "Altro" si accende quando sei dentro una delle sue pagine — incluse /case e /case/<slug>,
  // che dal menu primario sono uscite ma restano rotte vive.
  const moreActive = secondaryNav.some((item) => isActive(item.href));
  // Cambio pagina → pannello chiuso. Aggiustamento in RENDER (non in effetto): la navigazione
  // può avvenire sotto il sipario di PageTransition, che non smonta l'header, e un menu
  // rimasto aperto resterebbe agganciato alla pagina nuova.
  const [morePathname, setMorePathname] = useState(pathname);
  if (morePathname !== pathname) {
    setMorePathname(pathname);
    setMoreOpen(false);
  }
  const menuRef = useRef<HTMLDivElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const moreRef = useRef<HTMLDivElement | null>(null);
  const moreButtonRef = useRef<HTMLButtonElement | null>(null);
  const pillRef = useRef<HTMLDivElement | null>(null);
  // Specchio di `open` leggibile dal callback ScrollTrigger senza ri-crearlo
  // (sincronizzato in un effetto: niente scritture di ref durante il render).
  // Specchio di "un menu è aperto" (mobile o "Altro"): la pill non deve ritirarsi con lo
  // scroll mentre un pannello è agganciato a lei, altrimenti il pannello esce dallo schermo.
  const openRef = useRef(open || moreOpen);
  useEffect(() => {
    openRef.current = open || moreOpen;
  }, [open, moreOpen]);

  // Header direzionale: scendendo la pill si ritira (più tela per i contenuti),
  // al primo scroll verso l'alto — o al focus da tastiera — torna subito.
  // La traslazione è SULLA PILL, non sull'header: il menu mobile (fixed) resta
  // figlio dell'header e un transform lì gli romperebbe il posizionamento.
  useGSAP(
    () => {
      const pill = pillRef.current;
      if (!pill) return;
      const mm = gsap.matchMedia();
      mm.add(MQ.motionOk, () => {
        const yTo = gsap.quickTo(pill, "yPercent", { duration: 0.65, ease: "expo.out" });
        const show = () => yTo(0);
        const st = ScrollTrigger.create({
          onUpdate(self) {
            if (openRef.current) return show();
            // Mai nascondere la pill se il focus da tastiera è al suo interno:
            // il focusin la mostra all'ingresso, ma uno scroll successivo (rotella,
            // frecce, magnifier) la ritirerebbe portando l'elemento focalizzato
            // fuori viewport (WCAG 2.4.7 / 2.4.11).
            if (pillRef.current?.contains(document.activeElement)) return show();
            if (self.scroll() < 160) return show();
            if (self.direction === 1) yTo(-160);
            else show();
          },
        });
        pill.addEventListener("focusin", show);
        return () => {
          st.kill();
          pill.removeEventListener("focusin", show);
        };
      });
    },
    { scope: pillRef }
  );

  // Escape e click fuori chiudono "Altro". Con Escape il focus torna al suo bottone:
  // chi naviga da tastiera non viene rispedito in cima al documento.
  useEffect(() => {
    if (!moreOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      setMoreOpen(false);
      moreButtonRef.current?.focus();
    };
    const onPointerDown = (e: PointerEvent) => {
      const root = moreRef.current;
      if (root && !root.contains(e.target as Node)) setMoreOpen(false);
    };
    // Il pannello contiene link: la chiusura al focusout serve al Tab, che deve poter
    // uscire dal gruppo senza lasciare aperto un menu invisibile alla tastiera.
    const onFocusOut = (e: FocusEvent) => {
      const root = moreRef.current;
      const next = e.relatedTarget as Node | null;
      if (root && next && !root.contains(next)) setMoreOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    moreRef.current?.addEventListener("focusout", onFocusOut);
    const root = moreRef.current;
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
      root?.removeEventListener("focusout", onFocusOut);
    };
  }, [moreOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Ownership dello scroll-lock: start() SOLO se è stato questo menu a fare
  // stop() (mai al mount con open=false) e MAI mentre il sipario di
  // PageTransition copre (è lui il proprietario dello stop in quel momento).
  const menuLockedRef = useRef(false);
  // Il banner cookie (fixed, z sopra il menu) si fa da parte finché il menu è aperto:
  // altrimenti coprirebbe le CTA in fondo al pannello e i due focus trap si contenderebbero
  // il Tab. Torna appena il menu si chiude — la scelta non viene mai saltata.
  useEffect(() => {
    setMenuOpen(open);
    return () => setMenuOpen(false);
  }, [open]);

  useEffect(() => {
    const release = () => {
      if (!menuLockedRef.current) return;
      menuLockedRef.current = false;
      document.body.style.overflow = "";
      if (!isTransitionCovering()) getLenis()?.start();
    };
    if (open) {
      document.body.style.overflow = "hidden";
      // Con Lenis attivo lo scroll virtuale va fermato insieme a quello nativo,
      // altrimenti la pagina dietro il menu continua a "muoversi" con la rotella.
      getLenis()?.stop();
      menuLockedRef.current = true;
    } else {
      release();
    }
    return release;
  }, [open]);

  // Se il viewport supera il breakpoint lg con il menu aperto, overlay e
  // hamburger spariscono (lg:hidden) ma il lock resterebbe: chiudiamo il menu.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Coreografia del menu mobile (solo motion ok): clip-path circolare che
  // nasce dal bottone hamburger, voci in stagger (y + micro-rotazione),
  // contatti in coda; chiusura inversa più rapida. Con reduced-motion il
  // toggle resta il cambio di classi istantaneo (nessuna animazione = giusto).
  // useLayoutEffect: parte prima del paint, così il flip di classi non mostra
  // il pannello pieno per un frame prima che il clip iniziale sia applicato.
  const firstMenuRun = useRef(true);
  useLayoutEffect(() => {
    if (firstMenuRun.current) {
      firstMenuRun.current = false;
      return;
    }
    const menu = menuRef.current;
    if (!menu) return;
    const links = Array.from(menu.querySelectorAll<HTMLElement>("nav a"));
    const bottom = menu.querySelector<HTMLElement>("[data-menu-bottom]");
    if (!window.matchMedia(MQ.motionOk).matches) {
      // Reduced-motion attivato DOPO un'apertura animata: gli inline style di
      // GSAP (opacity/clip) vincerebbero sulle classi. Pulizia idempotente e
      // via: il toggle resta il cambio di classi istantaneo.
      gsap.set([menu, ...links, ...(bottom ? [bottom] : [])], { clearProps: "all" });
      return;
    }
    const r = toggleRef.current?.getBoundingClientRect();
    const cx = r ? r.left + r.width / 2 : window.innerWidth - 44;
    const cy = r ? r.top + r.height / 2 : 44;
    const radius =
      Math.hypot(
        Math.max(cx, window.innerWidth - cx),
        Math.max(cy, window.innerHeight - cy)
      ) + 40;

    let tl: gsap.core.Timeline;
    if (open) {
      tl = gsap
        .timeline()
        .set(menu, { autoAlpha: 1 })
        .fromTo(
          menu,
          { clipPath: `circle(22px at ${cx}px ${cy}px)` },
          { clipPath: `circle(${radius}px at ${cx}px ${cy}px)`, duration: 0.65, ease: "domus.inOut" }
        )
        // opacity (non autoAlpha): i link restano nel tab order per il focus
        // trap che parte in parallelo all'apertura.
        .fromTo(
          links,
          { y: 36, rotate: 1.5, opacity: 0 },
          { y: 0, rotate: 0, opacity: 1, duration: dur.short, ease: "domus", stagger: stagger.words },
          0.16
        )
        .fromTo(
          bottom,
          { y: 26, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, ease: "domus" },
          0.42
        );
    } else {
      const targets = bottom ? [...links, bottom] : links;
      tl = gsap
        .timeline({
          onComplete() {
            gsap.set([menu, ...targets], { clearProps: "all" });
          },
        })
        .to(links, { y: -14, opacity: 0, duration: 0.22, ease: "power2.in", stagger: { each: 0.025, from: "end" } }, 0)
        .to(bottom, { opacity: 0, duration: 0.2, ease: "none" }, 0)
        .to(menu, { clipPath: `circle(22px at ${cx}px ${cy}px)`, duration: 0.4, ease: "domus.inOut" }, 0.05)
        .set(menu, { autoAlpha: 0 });
    }
    return () => {
      tl.kill();
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
      className={`pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 transition-colors duration-500 ${
        scrolled ? "" : "bg-gradient-to-b from-ink/60 via-ink/20 to-transparent pb-6"
      }`}
    >
      <div
        ref={pillRef}
        className={`pointer-events-auto mt-3 flex w-full max-w-[1240px] items-center justify-between gap-4 rounded-full px-3 pl-5 transition-[background-color,border-color,box-shadow,padding,backdrop-filter] duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
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

        {/* Desktop nav — voci primarie + "Altro" per le secondarie.
            Stessi token e stesse transizioni delle voci esistenti: nessun colore, font o
            animazione nuovi, solo una gerarchia diversa. */}
        <nav className="hidden items-center gap-1 lg:flex">
          {primaryNav.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`whitespace-nowrap rounded-full px-3.5 py-2 text-[0.82rem] transition-colors duration-300 ${
                  active ? "font-semibold" : "font-medium"
                } ${
                  scrolled
                    ? active
                      ? "bg-red-soft text-red-dark"
                      : "text-graphite hover:bg-cream-deep hover:text-ink"
                    : active
                      ? "bg-cream/20 text-white"
                      : "text-cream/90 hover:bg-cream/15 hover:text-white"
                }`}
              >
                {d.nav[item.key]}
              </Link>
            );
          })}

          <div ref={moreRef} className="relative">
            <button
              ref={moreButtonRef}
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              aria-expanded={moreOpen}
              aria-controls="nav-altro"
              aria-label={d.nav.altroAria}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-[0.82rem] transition-colors duration-300 ${
                moreActive ? "font-semibold" : "font-medium"
              } ${
                scrolled
                  ? moreActive || moreOpen
                    ? "bg-red-soft text-red-dark"
                    : "text-graphite hover:bg-cream-deep hover:text-ink"
                  : moreActive || moreOpen
                    ? "bg-cream/20 text-white"
                    : "text-cream/90 hover:bg-cream/15 hover:text-white"
              }`}
            >
              {d.nav.altro}
              <ChevronDown
                className={`h-3 w-3 transition-transform duration-300 ${moreOpen ? "rotate-180" : ""}`}
              />
            </button>

            <div
              id="nav-altro"
              hidden={!moreOpen}
              className="absolute right-0 top-[calc(100%+0.6rem)] min-w-[12rem] rounded-2xl border border-line bg-paper p-1.5 shadow-[0_24px_60px_-30px_rgba(26,24,22,0.5)]"
            >
              {secondaryNav.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`block whitespace-nowrap rounded-xl px-3.5 py-2 text-[0.82rem] transition-colors duration-300 ${
                      active
                        ? "bg-red-soft font-semibold text-red-dark"
                        : "font-medium text-graphite hover:bg-cream-deep hover:text-ink"
                    }`}
                  >
                    {d.nav[item.key]}
                  </Link>
                );
              })}
            </div>
          </div>
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
        data-lenis-prevent
        // bg pieno, niente backdrop-blur: un blur full-viewport ricalcolato a
        // ogni frame del clip-path sarebbe il costo compositor peggiore
        // possibile proprio sull'interazione mobile più frequente.
        className={`fixed inset-0 z-40 flex flex-col bg-cream px-6 pb-10 pt-28 lg:hidden ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {/* Su mobile lo spazio c'è: le secondarie restano raggiungibili in un colpo solo,
            in un gruppo più piccolo sotto le primarie (stessa gerarchia del desktop). */}
        <nav className="flex flex-col">
          {primaryNav.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={`border-b border-line/70 py-4 font-display text-3xl font-medium transition-colors duration-300 ${
                  active ? "text-red" : "text-ink"
                }`}
              >
                {d.nav[item.key]}
              </Link>
            );
          })}

          <p className="pt-6 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-stone">
            {d.nav.altro}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
            {secondaryNav.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  // py-2.5 su text-base ⇒ 44px di altezza: target touch minimo raccomandato.
                  className={`py-2.5 text-base font-medium transition-colors duration-300 ${
                    active ? "text-red" : "text-graphite"
                  }`}
                >
                  {d.nav[item.key]}
                </Link>
              );
            })}
          </div>
        </nav>

        <div data-menu-bottom className="mt-auto flex flex-col gap-3 pt-8">
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
