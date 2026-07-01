import Reveal from "./Reveal";
import { ArrowUpRight } from "./Icons";

const steps = [
  { n: "01", title: "Analisi e valutazione", copy: "Studiamo l'immobile e il mercato locale per definire il giusto valore e la strategia migliore." },
  { n: "02", title: "Verifica documentale", copy: "Esaminiamo titoli, conformità e documenti prima di partire, per arrivare alla firma senza sorprese." },
  { n: "03", title: "Preparazione immobile", copy: "Valorizziamo gli spazi con consigli mirati e, dove serve, home staging." },
  { n: "04", title: "Foto, video e rendering", copy: "Raccontiamo la casa con materiali professionali: servizi fotografici, video emozionali e virtual rendering." },
  { n: "05", title: "Strategia marketing", copy: "Costruiamo campagne multicanale per portare l'immobile davanti agli acquirenti giusti." },
  { n: "06", title: "Open Domus e visite", copy: "Organizziamo visite qualificate e l'evento Open Domus per acquirenti realmente interessati." },
  { n: "07", title: "Proposte e trattativa", copy: "Gestiamo proposte e negoziazione con trasparenza, tutelando i tuoi interessi." },
  { n: "08", title: "Compromesso e rogito", copy: "Ti accompagniamo passo dopo passo fino alla firma, con assistenza completa." },
];

export default function Method() {
  return (
    <section id="metodo" className="relative bg-cream-deep text-ink">
      <div className="mx-auto grid max-w-5xl gap-12 px-5 py-24 sm:px-8 sm:py-32 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        {/* Intro sticky */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Reveal>
            <span className="eyebrow">Il Metodo Domus Tua</span>
            <h2 className="mt-5 font-display text-4xl font-medium leading-[1.05] tracking-tight balance sm:text-5xl">
              Un percorso chiaro, dalla prima stima alla firma.
            </h2>
            <p className="mt-6 max-w-md text-[1.02rem] leading-relaxed text-stone">
              Ogni vendita e ogni acquisto seguono otto passaggi precisi: niente improvvisazione,
              solo un metodo costruito in oltre quindici anni di lavoro sul territorio.
            </p>
            <a
              href="#contatti"
              className="group mt-9 inline-flex items-center gap-2 rounded-full bg-red py-3 pl-6 pr-2.5 text-sm font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-red-dark active:scale-[0.98]"
            >
              Inizia dal tuo immobile
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </a>
          </Reveal>
        </div>

        {/* Timeline */}
        <ol className="flex flex-col">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 60} as="li">
              <div className="group flex gap-6 border-t border-line py-7 transition-colors duration-500 hover:border-red/30">
                <span className="font-display text-2xl font-medium text-red/35 transition-colors duration-500 group-hover:text-red sm:text-3xl">
                  {s.n}
                </span>
                <div className="flex-1">
                  <h3 className="font-display text-xl font-medium tracking-tight sm:text-2xl">
                    {s.title}
                  </h3>
                  <p className="mt-2 max-w-xl text-[0.95rem] leading-relaxed text-stone">
                    {s.copy}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
