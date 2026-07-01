import Image from "next/image";
import { ArrowUpRight, ArrowRight, Star } from "./Icons";
import { site } from "../lib/site";
import WordReveal from "./WordReveal";
import Reveal from "./Reveal";

const trust = [
  "Agenzia indipendente a Tradate",
  "Documenti verificati",
  "Assistenza fino al rogito",
];

export default function Hero() {
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
          <span className="eyebrow">Agenzia immobiliare · Tradate dal {site.since}</span>

          <h1 className="mt-6 font-display text-[2.7rem] font-medium leading-[1.02] tracking-[-0.02em] balance sm:text-6xl lg:text-[4.3rem]">
            <WordReveal as="span" className="block text-ink" text="Vendere casa, senza stress." />
            <WordReveal
              as="span"
              className="block text-red"
              text="Acquistare casa, con sicurezza."
              startDelay={260}
            />
          </h1>

          <p className="mt-6 max-w-xl text-[1.02rem] leading-relaxed text-stone sm:text-lg">
            Dal {site.since} mettiamo le persone prima degli immobili. Ti accompagniamo passo dopo
            passo, dalla valutazione al rogito, unendo calore umano e strumenti innovativi: rendering,
            video, home staging e Open Domus.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="#contatti"
              className="group flex items-center justify-center gap-2 rounded-full bg-red py-4 pl-7 pr-3 text-base font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-red-dark active:scale-[0.98]"
            >
              Valuta il tuo immobile
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </a>
            <a
              href="#metodo"
              className="flex items-center justify-center gap-2 rounded-full border border-ink/15 bg-paper px-7 py-4 text-base font-semibold text-ink transition-all duration-300 hover:border-red hover:text-red"
            >
              Scopri il Metodo
            </a>
            <a
              href="#acquista"
              className="group flex items-center justify-center gap-1.5 px-2 py-4 text-base font-medium text-stone transition-colors hover:text-ink"
            >
              Cerco casa
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
              <span className="text-sm font-semibold text-ink">
                {site.rating}/5 · oltre 500 recensioni
              </span>
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
                <Image
                  src="/images/reali/raffaela-ritratto.jpg"
                  alt="Raffaela Rizza, fondatrice di Domus Tua, nella sede di Tradate"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 560px"
                  className="object-cover"
                  style={{ objectPosition: "52% 22%" }}
                />
              </div>
            </div>

            {/* Tag fondatrice */}
            <div className="absolute -bottom-4 left-4 rounded-2xl border border-line bg-paper px-5 py-3.5 shadow-[0_24px_50px_-30px_rgba(26,24,22,0.55)] sm:left-6">
              <p className="font-display text-lg font-medium leading-none text-ink">Raffaela Rizza</p>
              <p className="mt-1.5 text-[0.8rem] text-stone">Fondatrice · con te dal {site.since}</p>
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
