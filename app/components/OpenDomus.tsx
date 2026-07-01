import Image from "next/image";
import Reveal from "./Reveal";
import { ArrowUpRight, Check, Play } from "./Icons";

const benefits = [
  "Immobile preparato e valorizzato prima dell'evento",
  "Materiali informativi e documentazione disponibili",
  "Acquirenti più consapevoli e prequalificati",
  "Visite organizzate, ordinate e senza caos",
  "Feedback raccolti per migliorare la strategia",
  "Possibilità di proposta più rapida e concreta",
];

export default function OpenDomus() {
  return (
    <section id="open-domus" className="bg-paper">
      <div className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Visual */}
          <Reveal className="order-2 lg:order-1">
            <div className="relative rounded-[2rem] border border-line bg-cream p-2">
              <a
                href="https://www.youtube.com/watch?v=gYePYQHNTUM"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Guarda la storia di Teresa, venduta al primo Open Domus"
                className="group relative block aspect-[4/5] overflow-hidden rounded-[calc(2rem-0.5rem)] sm:aspect-[5/5]"
              >
                <Image
                  src="/images/reali/open-domus-teresa.jpg"
                  alt="Raffaela Rizza con Teresa, cliente che ha venduto al primo Open Domus"
                  fill
                  sizes="(max-width: 1024px) 100vw, 600px"
                  className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-ink/45 via-transparent to-transparent" />
                <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-red shadow-lg transition-transform duration-300 group-hover:scale-110">
                  <Play className="h-6 w-6" />
                </span>
              </a>
              {/* card flottante */}
              <div className="absolute -bottom-5 left-5 right-5 rounded-2xl border border-line bg-paper px-5 py-4 shadow-[0_30px_60px_-40px_rgba(26,24,22,0.6)] sm:left-auto sm:right-6 sm:w-64">
                <p className="font-display text-lg font-medium text-ink">Venduta al primo Open Domus.</p>
                <p className="mt-1 text-sm text-stone">
                  La storia vera di Teresa, raccontata da lei.
                </p>
              </div>
            </div>
          </Reveal>

          {/* Content */}
          <Reveal className="order-1 lg:order-2" delay={100}>
            <span className="eyebrow">Asset proprietario</span>
            <h2 className="mt-5 font-display text-4xl font-medium leading-[1.05] tracking-tight text-ink balance sm:text-5xl">
              Open Domus: un’esperienza preparata per vendere meglio.
            </h2>
            <p className="mt-6 max-w-lg text-[1.02rem] leading-relaxed text-stone">
              Un format evoluto di visita che unisce preparazione, accoglienza, documentazione e
              prequalifica. Trasforma la classica visita in un momento più consapevole, ordinato e
              professionale, per chi vende e per chi cerca casa.
            </p>

            <ul className="mt-8 grid gap-x-6 gap-y-4 sm:grid-cols-2">
              {benefits.map((b) => (
                <li key={b} className="flex items-start gap-3 text-[0.92rem] text-graphite">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-soft text-red">
                    <Check className="h-3 w-3" />
                  </span>
                  {b}
                </li>
              ))}
            </ul>

            <a
              href="#contatti"
              className="group mt-10 inline-flex items-center gap-2 rounded-full bg-red py-3.5 pl-6 pr-2.5 text-sm font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-red-dark active:scale-[0.98]"
            >
              Scopri Open Domus
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
