"use client";

import Image from "next/image";
import { ArrowUpRight, ArrowRight, Star, Play } from "./Icons";
import { site } from "../lib/site";
import WordReveal from "./WordReveal";
import Reveal from "./Reveal";
import { SegnoDomus } from "./BrandMotif";
import { heroMedia } from "../lib/media";
import { useDict } from "./i18n/LocaleProvider";

export default function Hero() {
  const d = useDict();
  const trust = d.hero.chips;
  return (
    <section id="top" className="relative overflow-hidden bg-cream">
      {/* alone caldo */}
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(80% 60% at 100% 0%, rgba(210,10,10,0.06), transparent 60%)",
        }}
      />
      <div className="relative mx-auto grid max-w-[1240px] items-center gap-12 px-5 pb-20 pt-32 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:pb-28 lg:pt-36">
        {/* Testo */}
        <div className="hero-parallax">
          <SegnoDomus className="segno-draw mb-5 h-5 w-16" embrace={false} />
          <span className="eyebrow">{d.hero.eyebrow}</span>

          <h1 className="mt-6 font-display text-[2.7rem] font-medium leading-[1.02] tracking-[-0.02em] balance sm:text-6xl lg:text-[4.3rem]">
            <WordReveal as="span" className="block text-ink" text={d.hero.title1} />
            <WordReveal as="span" className="block text-red" text={d.hero.title2} startDelay={260} />
          </h1>

          <p className="mt-6 max-w-xl text-[1.02rem] leading-relaxed text-stone sm:text-lg">
            {d.hero.subcopy}
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="#contatti"
              className="group flex items-center justify-center gap-2 rounded-full bg-red py-4 pl-7 pr-3 text-base font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-red-dark active:scale-[0.98]"
            >
              {d.hero.ctaValuta}
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </a>
            <a
              href="#metodo"
              className="flex items-center justify-center gap-2 rounded-full border border-ink/15 bg-paper px-7 py-4 text-base font-semibold text-ink transition-all duration-300 hover:border-red hover:text-red"
            >
              {d.hero.ctaMetodo}
            </a>
            <a
              href="#acquista"
              className="group flex items-center justify-center gap-1.5 px-2 py-4 text-base font-medium text-stone transition-colors hover:text-ink"
            >
              {d.hero.ctaCerco}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </a>
          </div>

          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line pt-6">
            <span className="flex items-center gap-2">
              <span className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-red" />
                ))}
              </span>
              <a
                href="#recensioni"
                className="text-sm font-semibold text-ink underline-offset-2 hover:underline"
              >
                {site.rating}/5 {d.hero.ratingSuffix}
              </a>
            </span>
            {trust.map((t) => (
              <span key={t} className="text-[0.82rem] font-medium text-stone">
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Foto reale della fondatrice */}
        <Reveal delay={120}>
          <div className="relative">
            <div className="rounded-[2.2rem] border border-line bg-paper p-2 shadow-[0_50px_100px_-60px_rgba(26,24,22,0.6)]">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[calc(2.2rem-0.5rem)] sm:aspect-[5/5]">
                {heroMedia.enabled ? (
                  <video
                    className="h-full w-full object-cover"
                    style={{ objectPosition: "52% 22%" }}
                    poster={heroMedia.poster}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                  >
                    <source src={heroMedia.webm} type="video/webm" />
                    <source src={heroMedia.mp4} type="video/mp4" />
                  </video>
                ) : (
                  <Image
                    src={heroMedia.poster}
                    alt={heroMedia.posterAlt}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 560px"
                    className="object-cover"
                    style={{ objectPosition: "52% 22%" }}
                  />
                )}
                {/* affordance video */}
                <a
                  href="https://www.youtube.com/@DOMUSTUASRLIMMOBILIARE"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Guarda i video di Domus Tua"
                  className="group/vid absolute bottom-3 right-3 flex items-center gap-2 rounded-full bg-paper/90 py-1.5 pl-1.5 pr-3.5 text-[0.78rem] font-semibold text-ink shadow-[0_10px_30px_-12px_rgba(26,24,22,0.6)] backdrop-blur-sm transition-colors hover:text-red"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red text-white transition-transform duration-300 group-hover/vid:scale-110">
                    <Play className="h-3 w-3" />
                  </span>
                  {d.hero.watch}
                </a>
              </div>
            </div>

            {/* Tag fondatrice */}
            <div className="absolute -bottom-4 left-4 rounded-3xl border border-line bg-paper px-5 py-3.5 shadow-[0_24px_50px_-30px_rgba(26,24,22,0.55)] sm:left-6">
              <p className="font-display text-lg font-medium leading-none text-ink">Raffaela Rizza</p>
              <p className="mt-1.5 text-[0.8rem] text-stone">{d.hero.founderRole}</p>
            </div>

            {/* Chip reputazione */}
            <div className="absolute -right-1 top-6 flex items-center gap-2 rounded-full border border-line bg-paper px-4 py-2 shadow-[0_18px_40px_-24px_rgba(26,24,22,0.5)] sm:-right-3">
              <Star className="h-4 w-4 text-red" />
              <span className="tnum text-sm font-semibold text-ink">{site.rating}</span>
              <span className="text-[0.78rem] text-stone">/ 500+</span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
