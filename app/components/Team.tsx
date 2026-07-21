"use client";

import Image from "next/image";
import Reveal from "./Reveal";
import { ArrowUpRight, Play, Quote } from "./Icons";
import { SegnoDomus } from "./BrandMotif";
import { useLocale } from "./i18n/LocaleProvider";

const copy = {
  it: {
    eyebrow: "Chi siamo",
    title: "Persone prima degli immobili.",
    lead: "Dietro ogni casa c’è una storia. Dietro ogni percorso Domus Tua c’è un team che ascolta, guida e accompagna, dalla prima telefonata fino alla firma.",
    body: "Tutto è nato nel 2007 dalla visione di Raffaela Rizza: un’agenzia immobiliare indipendente a Tradate dove professionalità, innovazione e integrità non sono parole, ma il modo in cui lavoriamo ogni giorno.",
    quote: "“Per noi una casa non è un annuncio: è la storia di una famiglia. La trattiamo così.”",
    role: "Fondatrice · Domus Tua",
    cta: "Conosci Domus Tua",
    videoAria: "Guarda Domus Tua in video su YouTube",
    imageAlt: "Raffaela Rizza e il team Domus Tua nella sede di Tradate",
    captionName: "Raffaela Rizza e il team",
    captionPlace: "Nella nostra sede di Tradate",
    badge: "Dal 2007",
    founderAlt: "Raffaela Rizza, founder di Domus Tua",
    founderCaption: "Founder & CEO",
    rosterTitle: "Il team",
    rosterIntro: "Un’agenzia a guida femminile che mette le persone al centro. Volti veri, competenze vere.",
    roles: {
      founder: "Founder & CEO",
      office: "Office Manager",
      architect: "Architetto",
      frontOffice: "Front Office",
      executive: "Executive",
      homeStager: "Home Stager",
    },
  },
  en: {
    eyebrow: "About us",
    title: "People before properties.",
    lead: "Behind every home there is a story. Behind every Domus Tua journey there is a team that listens, guides and supports you, from the first phone call to the signing.",
    body: "It all began in 2007 from Raffaela Rizza’s vision: an independent real estate agency in Tradate where professionalism, innovation and integrity aren’t just words, but the way we work every day.",
    quote: "“For us a home is not a listing: it’s a family’s story. And we treat it that way.”",
    role: "Founder · Domus Tua",
    cta: "Get to know Domus Tua",
    videoAria: "Watch Domus Tua on video on YouTube",
    imageAlt: "Raffaela Rizza and the Domus Tua team at the Tradate office",
    captionName: "Raffaela Rizza and the team",
    captionPlace: "At our office in Tradate",
    badge: "Since 2007",
    founderAlt: "Raffaela Rizza, founder of Domus Tua",
    founderCaption: "Founder & CEO",
    rosterTitle: "The team",
    rosterIntro: "A woman-led agency that puts people first. Real faces, real expertise.",
    roles: {
      founder: "Founder & CEO",
      office: "Office Manager",
      architect: "Architect",
      frontOffice: "Front Office",
      executive: "Executive",
      homeStager: "Home Stager",
    },
  },
  fr: {
    eyebrow: "Qui sommes-nous",
    title: "Les personnes avant les biens.",
    lead: "Derrière chaque maison, il y a une histoire. Derrière chaque parcours Domus Tua, il y a une équipe qui écoute, guide et accompagne, du premier appel jusqu’à la signature.",
    body: "Tout est né en 2007 de la vision de Raffaela Rizza : une agence immobilière indépendante à Tradate où professionnalisme, innovation et intégrité ne sont pas de simples mots, mais notre façon de travailler chaque jour.",
    quote: "« Pour nous, une maison n’est pas une annonce : c’est l’histoire d’une famille. Nous la traitons ainsi. »",
    role: "Fondatrice · Domus Tua",
    cta: "Découvrir Domus Tua",
    videoAria: "Regarder la vidéo Domus Tua sur YouTube",
    imageAlt: "Raffaela Rizza et l’équipe Domus Tua dans les locaux de Tradate",
    captionName: "Raffaela Rizza et l’équipe",
    captionPlace: "Dans nos locaux à Tradate",
    badge: "Depuis 2007",
    founderAlt: "Raffaela Rizza, fondatrice de Domus Tua",
    founderCaption: "Fondatrice & CEO",
    rosterTitle: "L’équipe",
    rosterIntro: "Une agence dirigée par des femmes qui place les personnes au centre. Des visages vrais, des compétences vraies.",
    roles: {
      founder: "Founder & CEO",
      office: "Office Manager",
      architect: "Architecte",
      frontOffice: "Front Office",
      executive: "Executive",
      homeStager: "Home Stager",
    },
  },
  de: {
    eyebrow: "Über uns",
    title: "Menschen vor Immobilien.",
    lead: "Hinter jedem Zuhause steht eine Geschichte. Hinter jedem Weg mit Domus Tua steht ein Team, das zuhört, begleitet und unterstützt – vom ersten Anruf bis zur Unterschrift.",
    body: "Alles begann 2007 mit der Vision von Raffaela Rizza: eine unabhängige Immobilienagentur in Tradate, in der Professionalität, Innovation und Integrität keine Worte sind, sondern die Art, wie wir jeden Tag arbeiten.",
    quote: "„Für uns ist ein Zuhause keine Anzeige: Es ist die Geschichte einer Familie. So behandeln wir es.“",
    role: "Gründerin · Domus Tua",
    cta: "Domus Tua kennenlernen",
    videoAria: "Domus Tua im Video auf YouTube ansehen",
    imageAlt: "Raffaela Rizza und das Domus-Tua-Team im Büro in Tradate",
    captionName: "Raffaela Rizza und das Team",
    captionPlace: "In unserem Büro in Tradate",
    badge: "Seit 2007",
    founderAlt: "Raffaela Rizza, Gründerin von Domus Tua",
    founderCaption: "Gründerin & CEO",
    rosterTitle: "Das Team",
    rosterIntro: "Eine von Frauen geführte Agentur, die den Menschen in den Mittelpunkt stellt. Echte Gesichter, echte Kompetenzen.",
    roles: {
      founder: "Founder & CEO",
      office: "Office Manager",
      architect: "Architektin",
      frontOffice: "Front Office",
      executive: "Executive",
      homeStager: "Home Stager",
    },
  },
  es: {
    eyebrow: "Quiénes somos",
    title: "Personas antes que inmuebles.",
    lead: "Detrás de cada casa hay una historia. Detrás de cada recorrido Domus Tua hay un equipo que escucha, guía y acompaña, desde la primera llamada hasta la firma.",
    body: "Todo nació en 2007 de la visión de Raffaela Rizza: una agencia inmobiliaria independiente en Tradate donde profesionalidad, innovación e integridad no son palabras, sino la forma en que trabajamos cada día.",
    quote: "“Para nosotros una casa no es un anuncio: es la historia de una familia. Y así la tratamos.”",
    role: "Fundadora · Domus Tua",
    cta: "Conoce Domus Tua",
    videoAria: "Mira el vídeo de Domus Tua en YouTube",
    imageAlt: "Raffaela Rizza y el equipo Domus Tua en la sede de Tradate",
    captionName: "Raffaela Rizza y el equipo",
    captionPlace: "En nuestra sede de Tradate",
    badge: "Desde 2007",
    founderAlt: "Raffaela Rizza, fundadora de Domus Tua",
    founderCaption: "Fundadora & CEO",
    rosterTitle: "El equipo",
    rosterIntro: "Una agencia dirigida por mujeres que pone a las personas en el centro. Rostros reales, competencias reales.",
    roles: {
      founder: "Founder & CEO",
      office: "Office Manager",
      architect: "Arquitecta",
      frontOffice: "Front Office",
      executive: "Executive",
      homeStager: "Home Stager",
    },
  },
};

export default function Team() {
  const { locale } = useLocale();
  const c = copy[locale];

  const roster = [
    { name: "Raffaela Rizza", role: c.roles.founder, founder: true },
    { name: "Paloma Cavalcante", role: c.roles.office },
    { name: "Eleonora D’Agati", role: c.roles.architect },
    { name: "Viola Benatti", role: c.roles.frontOffice },
    { name: "Tiziana Galeone", role: c.roles.executive },
    { name: "Katya Fedrigo", role: c.roles.homeStager },
  ];

  const initials = (name: string) =>
    name
      .split(" ")
      .map((part) => part.charAt(0))
      .slice(0, 2)
      .join("");

  return (
    <section id="chi-siamo" className="bg-cream">
      <div className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
          <Reveal>
            <span className="eyebrow">{c.eyebrow}</span>
            <h2 className="mt-5 font-display text-4xl font-medium leading-[1.04] tracking-tight text-ink balance sm:text-[3.4rem]">
              {c.title}
            </h2>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-graphite">
              {c.lead}
            </p>
            <p className="mt-4 max-w-xl text-[1.02rem] leading-relaxed text-stone">
              {c.body}
            </p>

            <figure className="mt-8 max-w-xl rounded-[1.5rem] border border-line bg-paper p-6">
              <Quote className="h-7 w-7 text-red/30" />
              <blockquote className="mt-3 font-display text-xl leading-snug text-ink sm:text-2xl">
                {c.quote}
              </blockquote>
              <figcaption className="mt-4 flex items-center gap-3">
                <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-cream-deep font-display text-base font-semibold text-graphite ring-1 ring-inset ring-line">
                  RR
                  <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-red" aria-hidden="true" />
                </span>
                <span className="leading-tight">
                  <span className="block text-sm font-semibold text-ink">Raffaela Rizza</span>
                  <span className="block text-[0.8rem] text-stone">{c.role}</span>
                </span>
              </figcaption>
            </figure>

            <div className="mt-9 max-w-xl">
              <div className="flex items-center gap-3">
                <p className="eyebrow">{c.rosterTitle}</p>
                <span className="h-px flex-1 bg-line" aria-hidden="true" />
              </div>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-stone">
                {c.rosterIntro}
              </p>
              <ul className="mt-6 grid gap-x-7 gap-y-px sm:grid-cols-2">
                {roster.map((member, i) => (
                  <li
                    key={member.name}
                    className="flex items-center gap-3.5 border-t border-line/70 py-3.5 sm:first:border-t-0 sm:[&:nth-child(2)]:border-t-0"
                  >
                    <span
                      className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.9rem] font-display text-[0.95rem] font-semibold text-graphite ring-1 ring-inset ring-line ${
                        i % 2 === 0 ? "bg-paper" : "bg-cream-deep"
                      }`}
                    >
                      {initials(member.name)}
                      {member.founder && (
                        <span
                          className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-red ring-2 ring-cream"
                          aria-hidden="true"
                        />
                      )}
                    </span>
                    <span className="leading-tight">
                      <span className="block text-sm font-semibold text-ink">{member.name}</span>
                      <span className="block text-[0.8rem] text-stone">{member.role}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <a
              href="#contatti"
              className="group mt-9 inline-flex items-center gap-2 rounded-full border border-ink/15 bg-paper py-3 pl-6 pr-2.5 text-sm font-semibold text-ink transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-red hover:text-red active:scale-[0.98]"
            >
              {c.cta}
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
                aria-label={c.videoAria}
              >
                <Image
                  src="/images/reali/team-group.jpg"
                  alt={c.imageAlt}
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
                  <span className="block font-semibold text-ink">{c.captionName}</span>
                  {c.captionPlace}
                </span>
                <span className="shrink-0 rounded-full bg-red-soft px-3 py-1.5 text-[0.7rem] font-semibold uppercase tracking-wide text-red-dark">
                  {c.badge}
                </span>
              </figcaption>
            </figure>

            <figure className="group mt-5 overflow-hidden rounded-[2rem] border border-line bg-paper p-2">
              <div className="relative aspect-[5/4] overflow-hidden rounded-[calc(2rem-0.5rem)]">
                <Image
                  src="/images/reali/raffaela-founder.jpg"
                  alt={c.founderAlt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 520px"
                  className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                />
                <span className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-ink/55 to-transparent" />
                <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
                  <span className="leading-tight text-paper">
                    <span className="block font-display text-lg font-medium">Raffaela Rizza</span>
                    <span className="block text-[0.8rem] text-paper/80">{c.founderCaption}</span>
                  </span>
                  <span className="mb-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-paper/90">
                    <SegnoDomus className="h-3.5 w-3.5 text-red" />
                  </span>
                </figcaption>
              </div>
            </figure>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
