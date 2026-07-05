"use client";

import Link from "next/link";
import { Logo } from "./Logo";
import { Phone, Whatsapp, Mail, Pin, Instagram, Facebook, TikTok, YouTube } from "./Icons";
import { SegnoDomus } from "./BrandMotif";
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
  return (
    <footer className="bg-graphite text-cream">
      <div className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr]">
          {/* Brand */}
          <div>
            {/* Logo a colori su chip chiara: leggibile sul footer scuro finché non arriva
                una variante monocromatica chiara dal cliente. */}
            <span className="inline-flex rounded-xl bg-paper px-3.5 py-2.5">
              <Logo light />
            </span>
            <SegnoDomus className="mt-6 h-5 w-14" embrace={false} />
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
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-cream/60">
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
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-cream/60">
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

        <div className="mt-14 flex flex-col gap-4 border-t border-cream/12 pt-7 text-[0.78rem] text-cream/65 sm:flex-row sm:items-center sm:justify-between">
          <p className="tnum">
            © {new Date().getFullYear()} {site.legal} · P.IVA {site.vat} · REA {site.rea} · Cap. € {site.capital} i.v.
          </p>
          <div className="flex gap-5">
            <a href="/privacy" className="hover:text-cream">{d.footer.privacy}</a>
            <a href="/cookie" className="hover:text-cream">{d.footer.cookie}</a>
            <a href="/contatti" className="hover:text-cream">{d.footer.contatti}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
