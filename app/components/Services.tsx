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
      "Trasformiamo planimetrie e immobili da ristrutturare in immagini desiderabili. Il potenziale diventa visibile, e vendibile.",
    featureAlt: "Rendering fotorealistico di un living moderno",
    services: [
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
      "We turn floor plans and properties to be renovated into desirable images. Potential becomes visible, and sellable.",
    featureAlt: "Photorealistic rendering of a modern living room",
    services: [
      {
        title: "Property valuation",
        copy: "Professional appraisal based on the local market, actual features and true potential.",
      },
      {
        title: "Technical, administrative and legal services",
        copy: "Document checks and support on compliance, titles and paperwork.",
      },
      {
        title: "Home staging",
        copy: "Set-ups that showcase spaces and speed up the sale.",
      },
      {
        title: "Emotional video real estate",
        copy: "Emotional videos that tell the story of the home, not just its rooms.",
      },
      {
        title: "Content and marketing campaigns",
        copy: "Creative production and multichannel campaigns for the right buyers.",
      },
    ],
    docEyebrow: "Domus D.O.C. Protocol",
    docCopy:
      "A standard of transparency and quality applied to every property we handle.",
  },
  fr: {
    eyebrow: "Services Domus",
    title: "Tout ce qu'il faut pour valoriser, protéger et raconter votre maison.",
    featureBadge: "Service phare",
    featureTitle: "Rendu et rendu virtuel",
    featureCopy:
      "Nous transformons plans et biens à rénover en images désirables. Le potentiel devient visible, et vendable.",
    featureAlt: "Rendu photoréaliste d'un salon moderne",
    services: [
      {
        title: "Évaluation du bien",
        copy: "Estimation professionnelle fondée sur le marché local, les caractéristiques réelles et le potentiel.",
      },
      {
        title: "Services techniques, administratifs et juridiques",
        copy: "Vérifications documentaires et accompagnement sur la conformité, les titres et les démarches.",
      },
      {
        title: "Home staging",
        copy: "Des aménagements qui valorisent les espaces et accélèrent la vente.",
      },
      {
        title: "Emotional video real estate",
        copy: "Des vidéos émotionnelles qui racontent la maison, pas seulement ses pièces.",
      },
      {
        title: "Contenus et campagnes marketing",
        copy: "Production créative et campagnes multicanales pour les bons acquéreurs.",
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
      "Wir verwandeln Grundrisse und sanierungsbedürftige Immobilien in begehrenswerte Bilder. Das Potenzial wird sichtbar – und verkäuflich.",
    featureAlt: "Fotorealistisches Rendering eines modernen Wohnzimmers",
    services: [
      {
        title: "Immobilienbewertung",
        copy: "Professionelle Schätzung auf Basis des lokalen Marktes, realer Merkmale und des Potenzials.",
      },
      {
        title: "Technische, administrative und rechtliche Dienstleistungen",
        copy: "Dokumentenprüfung und Unterstützung bei Konformität, Titeln und Formalitäten.",
      },
      {
        title: "Home Staging",
        copy: "Inszenierungen, die Räume aufwerten und den Verkauf beschleunigen.",
      },
      {
        title: "Emotional Video Real Estate",
        copy: "Emotionale Videos, die die Geschichte des Zuhauses erzählen, nicht nur seine Räume.",
      },
      {
        title: "Inhalte und Marketingkampagnen",
        copy: "Kreative Produktion und Multichannel-Kampagnen für die richtigen Käufer.",
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
      "Transformamos planos e inmuebles a reformar en imágenes deseables. El potencial se vuelve visible, y vendible.",
    featureAlt: "Renderizado fotorrealista de un salón moderno",
    services: [
      {
        title: "Valoración del inmueble",
        copy: "Tasación profesional basada en el mercado local, las características reales y el potencial.",
      },
      {
        title: "Servicios técnicos, administrativos y legales",
        copy: "Verificaciones documentales y apoyo en conformidad, títulos y trámites.",
      },
      {
        title: "Home staging",
        copy: "Montajes que realzan los espacios y aceleran la venta.",
      },
      {
        title: "Emotional video real estate",
        copy: "Vídeos emocionales que cuentan la historia de la casa, no solo sus habitaciones.",
      },
      {
        title: "Contenidos y campañas de marketing",
        copy: "Producción creativa y campañas multicanal para los compradores adecuados.",
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
                <span className="rounded-full bg-red px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-white">
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
