"use client";

import Link from "next/link";
import Reveal from "./Reveal";
import { ArrowUpRight, ArrowRight } from "./Icons";
import { useDict } from "./i18n/LocaleProvider";

// Ricerca "sopra la piega": porta d'ingresso rapida per chi compra + scorciatoia per chi vende.
// La ricerca completa vive su /case (PropertySearch); qui indirizziamo lì.
const types = [
  { label: "Appartamenti", href: "/case" },
  { label: "Attici", href: "/case" },
  { label: "Ville", href: "/case" },
];

export default function HomeSearchGateway() {
  const d = useDict();
  return (
    <section className="bg-cream-deep">
      <div className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8 sm:py-20">
        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          {/* Buyer search */}
          <Reveal>
            <div className="flex h-full flex-col rounded-[2rem] border border-line bg-paper p-6 shadow-[0_40px_90px_-60px_rgba(26,24,22,0.5)] sm:p-8">
              <h2 className="font-display text-2xl font-medium tracking-tight text-ink sm:text-3xl">
                {d.search.title}
              </h2>

              {/* input linguaggio naturale (teaser) */}
              <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-line bg-cream p-3 sm:flex-row sm:items-center">
                <input
                  placeholder={d.search.nlPlaceholder}
                  aria-label={d.search.title}
                  className="w-full flex-1 rounded-lg bg-transparent px-2 text-[0.98rem] text-ink placeholder:text-stone/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
                />
                <span className="shrink-0 self-start rounded-full bg-red-soft px-3.5 py-2 text-[0.7rem] font-semibold uppercase tracking-wide text-red-dark sm:self-auto">
                  {d.search.nlTeaser}
                </span>
              </div>
              <p className="mt-2 pl-1 text-[0.8rem] text-stone">{d.search.nlHint}</p>

              {/* chip tipologia + CTA */}
              <div className="mt-6 flex flex-wrap items-center gap-2">
                {types.map((t) => (
                  <Link
                    key={t.label}
                    href={t.href}
                    className="rounded-full border border-line bg-paper px-4 py-2 text-sm font-medium text-graphite transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-red/40 hover:text-ink"
                  >
                    {t.label}
                  </Link>
                ))}
              </div>

              <Link
                href="/case"
                className="group mt-6 inline-flex items-center justify-center gap-2 self-start rounded-full bg-red py-3.5 pl-6 pr-3 text-base font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-red-dark active:scale-[0.98]"
              >
                {d.search.cta}
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </Link>
            </div>
          </Reveal>

          {/* Seller shortcut */}
          <Reveal delay={100}>
            <div className="flex h-full flex-col justify-between overflow-hidden rounded-[2rem] border border-red bg-red p-6 text-white sm:p-8">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em]">
                  {d.nav.vendi}
                </span>
                <h3 className="mt-5 font-display text-2xl font-medium leading-tight tracking-tight sm:text-[1.8rem]">
                  {d.search.sellerTitle}
                </h3>
              </div>
              <Link
                href="/#contatti"
                className="group mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-white py-3.5 pl-6 pr-3 text-sm font-semibold text-red transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-cream active:scale-[0.98]"
              >
                {d.search.sellerCta}
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red/10 transition-transform duration-300 group-hover:translate-x-0.5">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
