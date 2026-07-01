import Image from "next/image";
import Reveal from "./Reveal";
import { ArrowUpRight } from "./Icons";

const services = [
  {
    title: "Valutazione immobile",
    copy: "Stima professionale basata su mercato locale, caratteristiche reali e potenziale.",
  },
  {
    title: "Servizi tecnici, amministrativi e legali",
    copy: "Verifiche documentali e supporto su conformità, titoli e pratiche.",
  },
  {
    title: "Home staging",
    copy: "Allestimenti che valorizzano gli spazi e accelerano la vendita.",
  },
  {
    title: "Emotional video real estate",
    copy: "Video emozionali che raccontano la casa, non solo le sue stanze.",
  },
  {
    title: "Contenuti e campagne marketing",
    copy: "Produzione creativa e campagne multicanale per i giusti acquirenti.",
  },
];

export default function Services() {
  return (
    <section id="servizi" className="bg-cream">
      <div className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
        <Reveal className="max-w-2xl">
          <span className="eyebrow">Servizi Domus</span>
          <h2 className="mt-5 font-display text-4xl font-medium leading-[1.05] tracking-tight text-ink balance sm:text-5xl">
            Tutto ciò che serve per valorizzare, proteggere e raccontare la tua casa.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2">
          {/* Feature card */}
          <Reveal className="lg:col-span-2 lg:row-span-2">
            <article className="group relative h-full min-h-[22rem] overflow-hidden rounded-[2rem] border border-line">
              <Image
                src="/images/rendering_01_living_divano_grigio.jpg"
                alt="Rendering fotorealistico di un living moderno"
                fill
                sizes="(max-width: 1024px) 100vw, 760px"
                className="object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-7 sm:p-9">
                <span className="rounded-full bg-red px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-white">
                  Servizio di punta
                </span>
                <h3 className="mt-4 max-w-md font-display text-3xl font-medium leading-tight text-cream sm:text-4xl">
                  Rendering e virtual rendering
                </h3>
                <p className="mt-3 max-w-md text-[0.95rem] leading-relaxed text-cream/75">
                  Trasformiamo planimetrie e immobili da ristrutturare in immagini desiderabili.
                  Il potenziale diventa visibile, e vendibile.
                </p>
              </div>
            </article>
          </Reveal>

          {services.map((s, i) => (
            <Reveal key={s.title} delay={i * 70}>
              <article className="group flex h-full flex-col justify-between rounded-[2rem] border border-line bg-paper p-6 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:border-red/40">
                <span className="font-display text-sm font-semibold text-red/60">
                  0{i + 1}
                </span>
                <div className="mt-8">
                  <h3 className="font-display text-xl font-medium leading-snug tracking-tight text-ink">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-[0.88rem] leading-relaxed text-stone">{s.copy}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        {/* Protocollo Domus D.O.C. */}
        <Reveal>
          <a
            href="#contatti"
            className="group mt-4 flex flex-col items-start justify-between gap-4 rounded-[2rem] border border-graphite bg-graphite p-7 text-cream transition-colors duration-500 hover:bg-red hover:border-red sm:flex-row sm:items-center sm:p-8"
          >
            <div className="max-w-xl">
              <span className="eyebrow eyebrow-light">Protocollo Domus D.O.C.</span>
              <p className="mt-3 font-display text-2xl font-medium leading-snug sm:text-[1.7rem]">
                Uno standard di trasparenza e qualità applicato a ogni immobile che trattiamo.
              </p>
            </div>
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cream text-ink transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1">
              <ArrowUpRight className="h-5 w-5" />
            </span>
          </a>
        </Reveal>
      </div>
    </section>
  );
}
