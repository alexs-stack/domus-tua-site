"use client";

import Link from "next/link";
import { useRef } from "react";
import { Logo } from "./Logo";
import { Phone, Whatsapp, Mail, Pin, Instagram, Facebook, TikTok, YouTube } from "./Icons";
import { SegnoDomus } from "./BrandMotif";
import DrawOnScroll from "./motion/DrawOnScroll";
import { gsap, ScrollTrigger, useGSAP, MQ } from "../lib/motion/gsap";
import { nav, site } from "../lib/site";
import { useDict } from "./i18n/LocaleProvider";

const socials = [
  { icon: Instagram, label: "Instagram", href: site.social.instagram.href },
  { icon: Facebook, label: "Facebook", href: site.social.facebook.href },
  { icon: TikTok, label: "TikTok", href: site.social.tiktok.href },
  { icon: YouTube, label: "YouTube", href: site.social.youtube.href },
];

export default function Footer() {
  const d = useDict();
  const footerRef = useRef<HTMLElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const wordmarkRef = useRef<HTMLDivElement | null>(null);

  // Due regimi (vedi globals.css "Footer reveal"):
  // - Mobile/tablet: ingresso a colonne classico (una volta sola), stato
  //   nascosto solo via JS — senza JS o con reduced-motion tutto visibile.
  // - Desktop ≥1024px + motion ok: modalità "uncover" — il footer è fisso
  //   dietro al main (classe html.dt-footer-reveal + var --dt-footer-h) e il
  //   contenuto si "assesta" in scrub mentre viene scoperto; il wordmark
  //   gigante sale dalla maschera. Niente transform sugli antenati dei fixed.
  useGSAP(
    () => {
      const footer = footerRef.current;
      const grid = gridRef.current;
      if (!footer || !grid) return;
      const cols = Array.from(grid.children);
      if (cols.length === 0) return;

      const mm = gsap.matchMedia();

      mm.add(`${MQ.motionOk} and (max-width: 1023.98px)`, () => {
        // opacity (non autoAlpha): visibility:hidden toglierebbe i link del footer
        // dal tab order finché il trigger non scatta.
        const tween = gsap.fromTo(
          cols,
          { y: 26, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            stagger: 0.1,
            ease: "expo.out",
            scrollTrigger: { trigger: footer, start: "top 85%", once: true },
          }
        );
        // Reti di sicurezza (stesso patto di Reveal): il focus da tastiera o un
        // timeout rivelano subito le colonne se il trigger non è ancora scattato.
        const reveal = () => tween.progress(1);
        footer.addEventListener("focusin", reveal, { once: true });
        const safety = window.setTimeout(reveal, 2500);
        return () => {
          footer.removeEventListener("focusin", reveal);
          window.clearTimeout(safety);
        };
      });

      mm.add(`${MQ.motionOk} and (min-width: 1024px)`, () => {
        const html = document.documentElement;
        const wordmark = wordmarkRef.current;
        html.classList.add("dt-footer-reveal");
        const setH = () => html.style.setProperty("--dt-footer-h", `${footer.offsetHeight}px`);
        setH();
        const ro = new ResizeObserver(() => {
          setH();
          ScrollTrigger.refresh();
        });
        ro.observe(footer);

        // Il progresso dell'uncover = l'ultimo tratto di scroll alto quanto il
        // footer (main ha margin-bottom = --dt-footer-h). Le colonne restano
        // sempre parzialmente visibili (mai opacity 0: i link sono nel tab order).
        const settle = gsap.timeline({
          scrollTrigger: {
            start: () => Math.max(0, ScrollTrigger.maxScroll(window) - footer.offsetHeight),
            end: () => ScrollTrigger.maxScroll(window),
            scrub: true,
            invalidateOnRefresh: true,
          },
        });
        settle.fromTo(
          cols,
          { y: 56, opacity: 0.3 },
          { y: 0, opacity: 1, stagger: 0.08, ease: "none" },
          0
        );
        if (wordmark) {
          settle.fromTo(wordmark, { yPercent: 68 }, { yPercent: 0, ease: "none" }, 0.12);
        }

        return () => {
          ro.disconnect();
          html.classList.remove("dt-footer-reveal");
          html.style.removeProperty("--dt-footer-h");
        };
      });
    },
    { scope: footerRef }
  );

  return (
    <footer ref={footerRef} className="dt-footer-reveal-target topo-ambient bg-graphite text-cream">
      {/* pb extra su mobile: lascia spazio alla MobileActionBar fissa (~64px + safe-area)
          così l'ultima riga legale non finisce mai sotto la barra "Valuta gratis". */}
      <div className="mx-auto max-w-[1240px] px-5 pb-28 pt-16 sm:px-8 sm:py-20">
        <div ref={gridRef} className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr]">
          {/* Brand */}
          <div>
            {/* Logo a colori su chip chiara: leggibile sul footer scuro finché non arriva
                una variante monocromatica chiara dal cliente. */}
            <span className="inline-flex rounded-xl bg-paper px-3.5 py-2.5">
              <Logo light />
            </span>
            {/* Il Segno si disegna all'ingresso; statico e completo senza JS. */}
            <DrawOnScroll className="mt-6 block" duration={1} stagger={0.2}>
              <SegnoDomus className="h-5 w-14" embrace={false} />
            </DrawOnScroll>
            <p className="mt-4 max-w-sm font-display text-2xl font-medium leading-snug text-cream">
              Con Domus Tua è facile vendere ed è sicuro acquistare.
            </p>
            <div className="mt-7 flex flex-col gap-3 text-sm text-cream/70">
              <a href={site.phone.href} className="flex items-center gap-3 hover:text-cream">
                <Phone className="h-4 w-4 text-red-soft" /> {site.phone.label}
              </a>
              <a
                href={site.whatsapp.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 hover:text-cream"
              >
                <Whatsapp className="h-4 w-4 text-red-soft" /> {site.whatsapp.label}
              </a>
              <a href={site.email.href} className="flex items-center gap-3 hover:text-cream">
                <Mail className="h-4 w-4 text-red-soft" /> {site.email.label}
              </a>
              <span className="flex items-start gap-3">
                <Pin className="mt-0.5 h-4 w-4 shrink-0 text-red-soft" />
                {site.address.street}, {site.address.city} ({site.address.province})
              </span>
            </div>

            {/* Social */}
            <div className="mt-7 flex gap-2.5">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Domus Tua su ${s.label}`}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-cream/20 text-cream/80 transition-all duration-300 hover:border-red hover:bg-red hover:text-white"
                >
                  <s.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Nav */}
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-cream/75">
              {d.footer.naviga}
            </p>
            <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3">
              {nav.map((n) => (
                <li key={n.href}>
                  <a href={n.href} className="text-sm text-cream/70 transition-colors duration-300 hover:text-cream">
                    {d.nav[n.key]}
                  </a>
                </li>
              ))}
              {/* Domus D.O.C. — asset proprietario (nome-brand, invariato tra le lingue).
                  Punta alla sezione protocollo in homepage; discoverabile da ogni pagina. */}
              <li>
                <Link href="/#domus-doc" className="text-sm text-cream/70 transition-colors duration-300 hover:text-cream">
                  Domus D.O.C.
                </Link>
              </li>
            </ul>
          </div>

          {/* Orari */}
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-cream/75">
              {d.footer.orari}
            </p>
            <ul className="mt-5 flex flex-col gap-2 text-sm text-cream/70">
              <li className="flex justify-between gap-4">
                <span>{d.footer.monFri}</span>
                <span className="tnum text-cream">{site.hours.weekdays}</span>
              </li>
              <li className="flex justify-between gap-4">
                <span>{d.footer.sat}</span>
                <span className="tnum text-cream">{site.hours.saturday}</span>
              </li>
              <li className="flex justify-between gap-4">
                <span>{d.footer.sun}</span>
                <span className="text-cream/50">{d.footer.onAppt}</span>
              </li>
            </ul>
            <a
              href="#contatti"
              className="mt-6 inline-flex rounded-full bg-cream px-5 py-2.5 text-sm font-semibold text-ink transition-colors duration-300 hover:bg-red hover:text-white"
            >
              {d.footer.valuta}
            </a>
          </div>
        </div>

        {/* Wordmark gigante — filigrana di chiusura, sale dalla maschera durante
            l'uncover desktop; su mobile è una texture statica. Decorativo:
            il nome vero vive nel logo e nei metadata. */}
        <div aria-hidden className="mt-16 select-none overflow-hidden">
          <div
            ref={wordmarkRef}
            className="whitespace-nowrap font-display font-medium italic leading-[0.85] tracking-tight text-cream/[0.1]"
            style={{ fontSize: "clamp(4.5rem, 13.5vw, 13rem)" }}
          >
            Domus Tua
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-cream/20 pt-7 text-[0.78rem] text-cream/65 sm:flex-row sm:items-center sm:justify-between">
          <p className="tnum">
            © {new Date().getFullYear()} {site.legal} · P.IVA {site.vat} · REA {site.rea} · Cap. € {site.capital} i.v.
          </p>
          <div className="flex gap-5">
            <a href="/privacy" className="link-underline hover:text-cream">{d.footer.privacy}</a>
            <a href="/cookie" className="link-underline hover:text-cream">{d.footer.cookie}</a>
            <a href="/contatti" className="link-underline hover:text-cream">{d.footer.contatti}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
