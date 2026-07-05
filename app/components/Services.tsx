"use client";

import Image from "next/image";
import Reveal from "./Reveal";
import { ArrowUpRight } from "./Icons";
import { useLocale } from "./i18n/LocaleProvider";

const copy = {
  it: {
    eyebrow: "Servizi Domus",
    title: "Tutto ciò che serve per valorizzare, proteggere e raccontare la tua casa.",
    featureBadge: "Servizio di punta",
    featureTitle: "Rendering e virtual rendering",
    featureCopy:
      "Vedere il potenziale dell’immobile prima ancora dei lavori.",
    featureAlt: "Rendering fotorealistico di un living moderno",
    services: [
      {
        title: "Servizi tecnico-legali",
        copy: "Consulenza catastale, urbanistica e amministrativa.",
      },
      {
        title: "Home staging",
        copy: "Valorizzare gli spazi per vendere prima e meglio.",
      },
      {
        title: "Emotional video real estate",
        copy: "Raccontare la casa con un film, non con due foto.",
      },
      {
        title: "Contenuti e campagne marketing",
        copy: "Visibilità mirata sui canali che contano.",
      },
      {
        title: "Open Domus",
        copy: "L’esperienza di visita che fa innamorare gli acquirenti.",
      },
    ],
    docEyebrow: "Protocollo Domus D.O.C.",
    docCopy:
      "Uno standard di trasparenza e qualità applicato a ogni immobile che trattiamo.",
  },
  en: {
    eyebrow: "Domus Services",
    title: "Everything you need to enhance, protect and tell the story of your home.",
    featureBadge: "Signature service",
    featureTitle: "Rendering and virtual rendering",
    featureCopy:
      "Seeing a property’s potential before the work even begins.",
    featureAlt: "Photorealistic rendering of a modern living room",
    services: [
      {
        title: "Technical and legal services",
        copy: "Cadastral, planning and administrative advice.",
      },
      {
        title: "Home staging",
        copy: "Enhancing spaces to sell sooner and better.",
      },
      {
        title: "Emotional video real estate",
        copy: "Telling the story of a home with a film, not two photos.",
      },
      {
        title: "Content and marketing campaigns",
        copy: "Targeted visibility on the channels that matter.",
      },
      {
        title: "Open Domus",
        copy: "The viewing experience that makes buyers fall in love.",
      },
    ],
    docEyebrow: "Domus D.O.C. Protocol",
    docCopy:
      "A standard of transparency and quality applied to every property we handle.",
  },
  fr: {
    eyebrow: "Services Domus",
    title: "Tout ce qu’il faut pour valoriser, protéger et raconter votre maison.",
    featureBadge: "Service phare",
    featureTitle: "Rendu et rendu virtuel",
    featureCopy:
      "Voir le potentiel du bien avant même les travaux.",
    featureAlt: "Rendu photoréaliste d’un salon moderne",
    services: [
      {
        title: "Services techniques et juridiques",
        copy: "Conseil cadastral, urbanistique et administratif.",
      },
      {
        title: "Home staging",
        copy: "Valoriser les espaces pour vendre plus vite et mieux.",
      },
      {
        title: "Emotional video real estate",
        copy: "Raconter la maison avec un film, pas avec deux photos.",
      },
      {
        title: "Contenus et campagnes marketing",
        copy: "Une visibilité ciblée sur les canaux qui comptent.",
      },
      {
        title: "Open Domus",
        copy: "L’expérience de visite qui fait tomber les acquéreurs amoureux.",
      },
    ],
    docEyebrow: "Protocole Domus D.O.C.",
    docCopy:
      "Un standard de transparence et de qualité appliqué à chaque bien que nous traitons.",
  },
  de: {
    eyebrow: "Domus Leistungen",
    title: "Alles, was Sie brauchen, um Ihr Zuhause aufzuwerten, zu schützen und seine Geschichte zu erzählen.",
    featureBadge: "Spitzenleistung",
    featureTitle: "Rendering und Virtual Rendering",
    featureCopy:
      "Das Potenzial der Immobilie sehen, noch bevor die Arbeiten beginnen.",
    featureAlt: "Fotorealistisches Rendering eines modernen Wohnzimmers",
    services: [
      {
        title: "Technische und rechtliche Dienstleistungen",
        copy: "Beratung zu Kataster, Baurecht und Verwaltung.",
      },
      {
        title: "Home Staging",
        copy: "Räume aufwerten, um schneller und besser zu verkaufen.",
      },
      {
        title: "Emotional Video Real Estate",
        copy: "Die Immobilie mit einem Film erzählen, nicht mit zwei Fotos.",
      },
      {
        title: "Inhalte und Marketingkampagnen",
        copy: "Gezielte Sichtbarkeit auf den Kanälen, die zählen.",
      },
      {
        title: "Open Domus",
        copy: "Das Besichtigungserlebnis, das Käufer verliebt macht.",
      },
    ],
    docEyebrow: "Domus D.O.C. Protokoll",
    docCopy:
      "Ein Standard für Transparenz und Qualität, angewandt auf jede Immobilie, die wir betreuen.",
  },
  es: {
    eyebrow: "Servicios Domus",
    title: "Todo lo que necesitas para revalorizar, proteger y contar la historia de tu casa.",
    featureBadge: "Servicio estrella",
    featureTitle: "Renderizado y renderizado virtual",
    featureCopy:
      "Ver el potencial del inmueble antes incluso de las obras.",
    featureAlt: "Renderizado fotorrealista de un salón moderno",
    services: [
      {
        title: "Servicios técnicos y legales",
        copy: "Asesoramiento catastral, urbanístico y administrativo.",
      },
      {
        title: "Home staging",
        copy: "Valorizar los espacios para vender antes y mejor.",
      },
      {
        title: "Emotional video real estate",
        copy: "Contar la casa con una película, no con dos fotos.",
      },
      {
        title: "Contenidos y campañas de marketing",
        copy: "Visibilidad selectiva en los canales que importan.",
      },
      {
        title: "Open Domus",
        copy: "La experiencia de visita que enamora a los compradores.",
      },
    ],
    docEyebrow: "Protocolo Domus D.O.C.",
    docCopy:
      "Un estándar de transparencia y calidad aplicado a cada inmueble que gestionamos.",
  },
};

export default function Services() {
  const { locale } = useLocale();
  const c = copy[locale];

  return (
    <section id="servizi" className="bg-cream">
      <div className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
        <Reveal className="max-w-2xl">
          <span className="eyebrow">{c.eyebrow}</span>
          <h2 className="mt-5 font-display text-4xl font-medium leading-[1.05] tracking-tight text-ink balance sm:text-5xl">
            {c.title}
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2">
          {/* Feature card */}
          <Reveal className="lg:col-span-2 lg:row-span-2">
            <article className="group relative h-full min-h-[22rem] overflow-hidden rounded-[2rem] border border-line">
              <Image
                src="/images/rendering_01_living_divano_grigio.jpg"
                alt={c.featureAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 760px"
                className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-7 sm:p-9">
                <span className="rounded-full bg-red px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-cream">
                  {c.featureBadge}
                </span>
                <h3 className="mt-4 max-w-md font-display text-3xl font-medium leading-tight text-cream sm:text-4xl">
                  {c.featureTitle}
                </h3>
                <p className="mt-3 max-w-md text-[0.95rem] leading-relaxed text-cream/75">
                  {c.featureCopy}
                </p>
              </div>
            </article>
          </Reveal>

          {c.services.map((s, i) => (
            <Reveal key={s.title} delay={i * 70}>
              <article className="group flex h-full flex-col justify-between rounded-[2rem] border border-line bg-paper p-6 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:border-red/40">
                <span className="tnum font-display text-sm font-semibold text-red transition-colors duration-500 group-hover:text-red-dark">
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
              <span className="eyebrow eyebrow-light">{c.docEyebrow}</span>
              <p className="mt-3 font-display text-2xl font-medium leading-snug sm:text-[1.7rem]">
                {c.docCopy}
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
