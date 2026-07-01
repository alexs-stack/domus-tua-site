import Image from "next/image";
import Reveal from "./Reveal";
import { ArrowUpRight, Check } from "./Icons";

const paths = [
  {
    id: "vendi",
    tag: "Per chi vende",
    title: "Vendi casa con metodo, non con improvvisazione.",
    copy: "Valutiamo, prepariamo, raccontiamo e promuoviamo il tuo immobile con un percorso pensato per ridurre stress, tempi morti e incertezze.",
    points: [
      "Valutazione professionale e documenti verificati",
      "Foto, video, rendering e home staging",
      "Campagne marketing e Open Domus",
    ],
    cta: "Voglio vendere casa",
    href: "/vendi",
    image: "/images/premium_02_living_dining_piante.jpg",
    alt: "Living luminoso con zona pranzo e piante",
  },
  {
    id: "acquista",
    tag: "Per chi acquista",
    title: "Acquista casa con più risposte e meno dubbi.",
    copy: "Ti accompagniamo nelle visite, nella documentazione, nella proposta e in ogni passaggio fino al rogito.",
    points: [
      "Informazioni chiare già prima della visita",
      "Documentazione verificata e trasparente",
      "Supporto su proposta, compromesso e rogito",
    ],
    cta: "Cerco casa",
    href: "/acquista",
    image: "/images/hero_05_living_cucina_tavolo.jpg",
    alt: "Living open space con cucina e tavolo da pranzo",
  },
];

export default function Paths() {
  return (
    <section className="bg-paper">
      <div className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="eyebrow eyebrow--center justify-center">Due percorsi, un solo metodo</span>
          <h2 className="mt-5 font-display text-4xl font-medium leading-[1.05] tracking-tight text-ink balance sm:text-5xl">
            Che tu venda o acquisti, il nostro lavoro è proteggere le tue scelte.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {paths.map((p, i) => (
            <Reveal key={p.id} delay={i * 120} id={p.id}>
              <article className="group h-full rounded-[2rem] border border-line bg-cream p-2 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:shadow-[0_40px_80px_-50px_rgba(26,24,22,0.5)]">
                <div className="relative aspect-[16/10] overflow-hidden rounded-[calc(2rem-0.5rem)]">
                  <Image
                    src={p.image}
                    alt={p.alt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 600px"
                    className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                  />
                  <span className="absolute left-4 top-4 rounded-full bg-paper/95 px-3.5 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-graphite shadow-[0_4px_14px_-6px_rgba(26,24,22,0.5)]">
                    {p.tag}
                  </span>
                </div>

                <div className="px-5 pb-6 pt-7 sm:px-7">
                  <h3 className="font-display text-[1.7rem] font-medium leading-[1.1] tracking-tight text-ink balance sm:text-[2rem]">
                    {p.title}
                  </h3>
                  <p className="mt-4 text-[0.98rem] leading-relaxed text-stone">{p.copy}</p>

                  <ul className="mt-6 flex flex-col gap-3">
                    {p.points.map((pt) => (
                      <li key={pt} className="flex items-start gap-3 text-[0.92rem] text-graphite">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-soft text-red-dark">
                          <Check className="h-3 w-3" />
                        </span>
                        {pt}
                      </li>
                    ))}
                  </ul>

                  <a
                    href={p.href}
                    className="group/cta mt-8 inline-flex items-center gap-2 rounded-full bg-red py-3 pl-6 pr-2.5 text-sm font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-red-dark active:scale-[0.98]"
                  >
                    {p.cta}
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 group-hover/cta:translate-x-0.5 group-hover/cta:-translate-y-0.5">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </a>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
