"use client";

import Image from "next/image";
import Reveal from "./Reveal";
import { ArrowUpRight, Check } from "./Icons";
import { useLocale } from "./i18n/LocaleProvider";

const paths = [
  {
    id: "vendi",
    href: "/vendi",
    image: "/images/reali/consulenza.jpg",
  },
  {
    id: "acquista",
    href: "/acquista",
    image: "/images/reali/villa-pool.jpg",
  },
] as const;

const copy = {
  it: {
    eyebrow: "Due percorsi, un solo metodo",
    heading: "Che tu venda o acquisti, il nostro lavoro è proteggere le tue scelte.",
    paths: {
      vendi: {
        tag: "Per chi vende",
        title: "Vendi casa con metodo, non con improvvisazione.",
        copy: "Valutiamo, prepariamo, raccontiamo e promuoviamo il tuo immobile con un percorso pensato per ridurre stress, tempi morti e incertezze.",
        points: [
          "Valutazione professionale e documenti verificati",
          "Foto, video, rendering e home staging",
          "Campagne marketing e Open Domus",
        ],
        cta: "Voglio vendere casa",
        alt: "Living luminoso con zona pranzo e piante",
      },
      acquista: {
        tag: "Per chi acquista",
        title: "Acquista casa con più risposte e meno dubbi.",
        copy: "Ti accompagniamo nelle visite, nella documentazione, nella proposta e in ogni passaggio fino al rogito.",
        points: [
          "Informazioni chiare già prima della visita",
          "Documentazione verificata e trasparente",
          "Supporto su proposta, compromesso e rogito",
        ],
        cta: "Cerco casa",
        alt: "Living open space con cucina e tavolo da pranzo",
      },
    },
  },
  en: {
    eyebrow: "Two paths, one method",
    heading: "Whether you sell or buy, our job is to protect your choices.",
    paths: {
      vendi: {
        tag: "For those selling",
        title: "Sell your home with method, not improvisation.",
        copy: "We appraise, prepare, tell the story of and promote your property through a process designed to reduce stress, downtime and uncertainty.",
        points: [
          "Professional appraisal and verified documents",
          "Photography, video, rendering and home staging",
          "Marketing campaigns and Open Domus",
        ],
        cta: "I want to sell my home",
        alt: "Bright living room with dining area and plants",
      },
      acquista: {
        tag: "For those buying",
        title: "Buy your home with more answers and fewer doubts.",
        copy: "We guide you through viewings, documentation, the offer and every step up to the closing.",
        points: [
          "Clear information even before the viewing",
          "Verified and transparent documentation",
          "Support with offer, preliminary contract and closing",
        ],
        cta: "I'm looking for a home",
        alt: "Open-plan living room with kitchen and dining table",
      },
    },
  },
  fr: {
    eyebrow: "Deux parcours, une seule méthode",
    heading: "Que vous vendiez ou achetiez, notre métier est de protéger vos choix.",
    paths: {
      vendi: {
        tag: "Pour ceux qui vendent",
        title: "Vendez votre bien avec méthode, pas à l'improviste.",
        copy: "Nous évaluons, préparons, mettons en valeur et faisons la promotion de votre bien grâce à un parcours pensé pour réduire le stress, les temps morts et les incertitudes.",
        points: [
          "Évaluation professionnelle et documents vérifiés",
          "Photos, vidéos, rendus et home staging",
          "Campagnes marketing et Open Domus",
        ],
        cta: "Je veux vendre mon bien",
        alt: "Séjour lumineux avec coin repas et plantes",
      },
      acquista: {
        tag: "Pour ceux qui achètent",
        title: "Achetez votre bien avec plus de réponses et moins de doutes.",
        copy: "Nous vous accompagnons lors des visites, dans les démarches, dans l'offre et à chaque étape jusqu'à la signature.",
        points: [
          "Des informations claires dès avant la visite",
          "Une documentation vérifiée et transparente",
          "Un accompagnement pour l'offre, le compromis et la signature",
        ],
        cta: "Je cherche un bien",
        alt: "Séjour ouvert avec cuisine et table à manger",
      },
    },
  },
  de: {
    eyebrow: "Zwei Wege, eine Methode",
    heading: "Ob Sie verkaufen oder kaufen: Unsere Aufgabe ist es, Ihre Entscheidungen zu schützen.",
    paths: {
      vendi: {
        tag: "Für Verkäufer",
        title: "Verkaufen Sie Ihre Immobilie mit Methode, nicht mit Improvisation.",
        copy: "Wir bewerten, bereiten vor, inszenieren und bewerben Ihre Immobilie mit einem Ablauf, der Stress, Leerlauf und Unsicherheiten reduziert.",
        points: [
          "Professionelle Bewertung und geprüfte Unterlagen",
          "Fotos, Videos, Renderings und Home Staging",
          "Marketingkampagnen und Open Domus",
        ],
        cta: "Ich möchte meine Immobilie verkaufen",
        alt: "Helles Wohnzimmer mit Essbereich und Pflanzen",
      },
      acquista: {
        tag: "Für Käufer",
        title: "Kaufen Sie Ihre Immobilie mit mehr Antworten und weniger Zweifeln.",
        copy: "Wir begleiten Sie bei Besichtigungen, bei den Unterlagen, beim Angebot und bei jedem Schritt bis zum Notartermin.",
        points: [
          "Klare Informationen schon vor der Besichtigung",
          "Geprüfte und transparente Unterlagen",
          "Unterstützung bei Angebot, Vorvertrag und Notartermin",
        ],
        cta: "Ich suche eine Immobilie",
        alt: "Offener Wohnbereich mit Küche und Esstisch",
      },
    },
  },
  es: {
    eyebrow: "Dos recorridos, un solo método",
    heading: "Tanto si vendes como si compras, nuestro trabajo es proteger tus decisiones.",
    paths: {
      vendi: {
        tag: "Para quien vende",
        title: "Vende tu casa con método, no con improvisación.",
        copy: "Valoramos, preparamos, contamos y promocionamos tu inmueble con un recorrido pensado para reducir el estrés, los tiempos muertos y la incertidumbre.",
        points: [
          "Valoración profesional y documentos verificados",
          "Fotos, vídeos, renders y home staging",
          "Campañas de marketing y Open Domus",
        ],
        cta: "Quiero vender mi casa",
        alt: "Salón luminoso con zona de comedor y plantas",
      },
      acquista: {
        tag: "Para quien compra",
        title: "Compra tu casa con más respuestas y menos dudas.",
        copy: "Te acompañamos en las visitas, en la documentación, en la oferta y en cada paso hasta la firma.",
        points: [
          "Información clara ya antes de la visita",
          "Documentación verificada y transparente",
          "Apoyo en la oferta, el contrato preliminar y la firma",
        ],
        cta: "Busco casa",
        alt: "Salón diáfano con cocina y mesa de comedor",
      },
    },
  },
} as const;

export default function Paths() {
  const { locale } = useLocale();
  const c = copy[locale];

  return (
    <section className="bg-paper">
      <div className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="eyebrow eyebrow--center justify-center">{c.eyebrow}</span>
          <h2 className="mt-5 font-display text-4xl font-medium leading-[1.05] tracking-tight text-ink balance sm:text-5xl">
            {c.heading}
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {paths.map((p, i) => {
            const t = c.paths[p.id];
            return (
              <Reveal key={p.id} delay={i * 120} id={p.id}>
                <article className="group h-full rounded-[2rem] border border-line bg-cream p-2 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]">
                  <a href={p.href}>
                  <div className="relative aspect-[16/10] overflow-hidden rounded-[calc(2rem-0.5rem)]">
                    <Image
                      src={p.image}
                      alt={t.alt}
                      fill
                      sizes="(max-width: 1024px) 100vw, 600px"
                      className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                    />
                    <span className="absolute left-4 top-4 rounded-full bg-paper/95 px-3.5 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-graphite shadow-[0_4px_14px_-6px_rgba(26,24,22,0.5)]">
                      {t.tag}
                    </span>
                  </div>

                  <div className="px-5 pb-6 pt-7 sm:px-7">
                    <h3 className="font-display text-[1.7rem] font-medium leading-[1.1] tracking-tight text-ink balance sm:text-[2rem]">
                      {t.title}
                    </h3>
                    <p className="mt-4 text-[0.98rem] leading-relaxed text-stone">{t.copy}</p>

                    <ul className="mt-6 flex flex-col gap-3">
                      {t.points.map((pt) => (
                        <li key={pt} className="flex items-start gap-3 text-[0.92rem] text-graphite">
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-soft text-red-dark">
                            <Check className="h-3 w-3" />
                          </span>
                          {pt}
                        </li>
                      ))}
                    </ul>

                    <span
                      className="group/cta mt-8 inline-flex items-center gap-2 rounded-full bg-red py-3 pl-6 pr-2.5 text-sm font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-red-dark active:scale-[0.98]"
                    >
                      {t.cta}
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 group-hover/cta:translate-x-0.5 group-hover/cta:-translate-y-0.5">
                        <ArrowUpRight className="h-4 w-4" />
                      </span>
                    </span>
                  </div>
                  </a>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
