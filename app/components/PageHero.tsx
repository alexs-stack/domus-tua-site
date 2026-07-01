import Image from "next/image";
import type { ReactNode } from "react";
import { ArrowUpRight, ArrowRight } from "./Icons";

type CTA = { label: string; href: string };

export default function PageHero({
  eyebrow,
  title,
  subcopy,
  image,
  alt,
  primary,
  secondary,
  trust,
}: {
  eyebrow: string;
  title: ReactNode;
  subcopy: string;
  image: string;
  alt: string;
  primary: CTA;
  secondary?: CTA;
  trust?: string[];
}) {
  return (
    <section className="relative flex min-h-[82vh] w-full items-end overflow-hidden">
      <Image
        src={image}
        alt={alt}
        fill
        priority
        sizes="100vw"
        className="ken-burns object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/78 via-ink/28 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink/45 to-transparent" />

      <div className="relative mx-auto w-full max-w-[1240px] px-5 pb-14 pt-36 sm:px-8 sm:pb-20">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-cream/20 bg-ink/30 px-3.5 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-cream backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-red" />
            {eyebrow}
          </span>

          <h1 className="mt-6 font-display text-[2.6rem] font-medium leading-[1.03] tracking-[-0.02em] text-cream balance sm:text-6xl lg:text-[4.4rem]">
            {title}
          </h1>

          <p className="mt-6 max-w-xl text-[1.02rem] leading-relaxed text-cream/85 sm:text-lg">
            {subcopy}
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href={primary.href}
              className="group flex items-center justify-center gap-2 rounded-full bg-red py-4 pl-7 pr-3 text-base font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-red-dark active:scale-[0.98]"
            >
              {primary.label}
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </a>
            {secondary && (
              <a
                href={secondary.href}
                className="group flex items-center justify-center gap-1.5 rounded-full border border-cream/35 bg-cream/5 px-7 py-4 text-base font-semibold text-cream backdrop-blur-sm transition-all duration-300 hover:bg-cream/15"
              >
                {secondary.label}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </a>
            )}
          </div>

          {trust && trust.length > 0 && (
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-cream/15 pt-6">
              {trust.map((t) => (
                <span key={t} className="text-[0.8rem] font-medium text-cream/75">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
