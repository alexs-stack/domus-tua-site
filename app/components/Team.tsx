import Image from "next/image";
import Reveal from "./Reveal";
import { ArrowUpRight, Play, Quote } from "./Icons";

export default function Team() {
  return (
    <section id="chi-siamo" className="bg-cream">
      <div className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
          <Reveal>
            <span className="eyebrow">Chi siamo</span>
            <h2 className="mt-5 font-display text-4xl font-medium leading-[1.04] tracking-tight text-ink balance sm:text-[3.4rem]">
              Persone prima degli immobili.
            </h2>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-graphite">
              Dietro ogni casa c’è una storia. Dietro ogni percorso Domus Tua c’è un team che
              ascolta, guida e accompagna, dalla prima telefonata fino alla firma.
            </p>
            <p className="mt-4 max-w-xl text-[1.02rem] leading-relaxed text-stone">
              Tutto è nato nel 2007 dalla visione di Raffaela Rizza: un’agenzia immobiliare
              indipendente a Tradate dove professionalità, innovazione e integrità non sono parole,
              ma il modo in cui lavoriamo ogni giorno.
            </p>

            <figure className="mt-8 max-w-xl rounded-[1.5rem] border border-line bg-paper p-6">
              <Quote className="h-7 w-7 text-red/30" />
              <blockquote className="mt-3 font-display text-xl leading-snug text-ink sm:text-2xl">
                “Per noi una casa non è un annuncio: è la storia di una famiglia. La trattiamo così.”
              </blockquote>
              <figcaption className="mt-4 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-red font-display text-base font-semibold text-white">
                  RR
                </span>
                <span className="leading-tight">
                  <span className="block text-sm font-semibold text-ink">Raffaela Rizza</span>
                  <span className="block text-[0.8rem] text-stone">Fondatrice · Domus Tua</span>
                </span>
              </figcaption>
            </figure>

            <a
              href="#contatti"
              className="group mt-9 inline-flex items-center gap-2 rounded-full border border-ink/15 bg-paper py-3 pl-6 pr-2.5 text-sm font-semibold text-ink transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-red hover:text-red active:scale-[0.98]"
            >
              Conosci Domus Tua
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cream-deep transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </a>
          </Reveal>

          <Reveal delay={120}>
            <figure className="overflow-hidden rounded-[2rem] border border-line bg-paper p-2">
              <a
                href="https://www.youtube.com/watch?v=PRB3exiOa3I"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block aspect-[4/3] overflow-hidden rounded-[calc(2rem-0.5rem)]"
                aria-label="Guarda Domus Tua in video su YouTube"
              >
                <Image
                  src="/images/reali/raffaela-team-sede.jpg"
                  alt="Raffaela Rizza e il team Domus Tua nella sede di Tradate"
                  fill
                  sizes="(max-width: 1024px) 100vw, 520px"
                  className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-ink/40 to-transparent" />
                <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-red shadow-lg transition-transform duration-300 group-hover:scale-110">
                  <Play className="h-5 w-5" />
                </span>
              </a>
              <figcaption className="flex items-center justify-between gap-3 px-4 py-4">
                <span className="text-sm leading-tight text-graphite">
                  <span className="block font-semibold text-ink">Raffaela Rizza e il team</span>
                  Nella nostra sede di Tradate
                </span>
                <span className="shrink-0 rounded-full bg-red-soft px-3 py-1.5 text-[0.7rem] font-semibold uppercase tracking-wide text-red-dark">
                  Dal 2007
                </span>
              </figcaption>
            </figure>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
