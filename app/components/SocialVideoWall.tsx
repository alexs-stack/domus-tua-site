"use client";

import Image from "next/image";
import Reveal from "./Reveal";
import { Play, ArrowUpRight, Instagram, Star } from "./Icons";
import { site } from "../lib/site";
import { useLocale } from "./i18n/LocaleProvider";

type VidKind = "recensione" | "tour" | "dietro";

type Vid = {
  titleKey: string;
  thumb: string;
  href: string;
  kind: VidKind;
};

const yt = (id: string) => `https://www.youtube.com/watch?v=${id}`;

// Video reali dal canale YouTube di Domus Tua.
const featured: Vid = {
  titleKey: "vFeatured",
  thumb: "/images/reali/video/recensione-teresa.jpg",
  href: yt("gYePYQHNTUM"),
  kind: "recensione",
};

const wall: Vid[] = [
  { titleKey: "vOpenDomus", thumb: "/images/reali/video/recensione-opendomus.jpg", href: yt("BEmbT6WbZ-c"), kind: "recensione" },
  { titleKey: "vCinema", thumb: "/images/reali/video/team-cinema.jpg", href: yt("PRB3exiOa3I"), kind: "dietro" },
  { titleKey: "vMozart", thumb: "/images/reali/video/mozart.jpg", href: yt("X8dRz1629F0"), kind: "tour" },
  { titleKey: "vDomotica", thumb: "/images/reali/video/domotica.jpg", href: yt("E70G5l_CTWg"), kind: "tour" },
  { titleKey: "vVeranda", thumb: "/images/reali/video/veranda-vedano.jpg", href: yt("qXYpUw3QC2E"), kind: "tour" },
  { titleKey: "vQuadrilocale", thumb: "/images/reali/video/quadrilocale-giardino.jpg", href: yt("rARkECgXUbU"), kind: "tour" },
];

const copy = {
  it: {
    eyebrow: "La nostra energia",
    title: "Ci vedi prima ancora di conoscerci.",
    subtitle:
      "Video emozionali, Open Domus, social e contenuti raccontano ogni casa con la cura che merita. È così che i nostri clienti si fidano di noi ancora prima della prima visita.",
    chip1: "Emotional video real estate",
    chip2: "Open Domus",
    chip3: "Centinaia di video",
    chip4: "Social preview",
    kindRecensione: "Video recensione",
    kindTour: "Tour immobiliare",
    kindDietro: "Dietro le quinte",
    vFeatured: "La storia di Teresa: venduta al primo Open Domus",
    vOpenDomus: "Venduto al primo Open Domus",
    vCinema: "Domus Tua al cinema, su Prime Video",
    vMozart: "Villa Mozart, Tradate",
    vDomotica: "Villa con domotica e fotovoltaico",
    vVeranda: "Terra-tetto con veranda, Vedano Olona",
    vQuadrilocale: "Quadrilocale con giardino di 870 mq",
    proofRest: " · oltre 500 recensioni · raccontate anche in video",
    ctaWatch: "Guarda le video recensioni",
    ctaInstagram: "Seguici su Instagram",
  },
  en: {
    eyebrow: "Our energy",
    title: "You see us before you even meet us.",
    subtitle:
      "Emotional videos, Open Domus, social media and content tell the story of every home with the care it deserves. That's how our clients trust us even before the first viewing.",
    chip1: "Emotional video real estate",
    chip2: "Open Domus",
    chip3: "Hundreds of videos",
    chip4: "Social preview",
    kindRecensione: "Video review",
    kindTour: "Property tour",
    kindDietro: "Behind the scenes",
    vFeatured: "Teresa's story: sold at the very first Open Domus",
    vOpenDomus: "Sold at the very first Open Domus",
    vCinema: "Domus Tua at the cinema, on Prime Video",
    vMozart: "Villa Mozart, Tradate",
    vDomotica: "Villa with home automation and solar panels",
    vVeranda: "Terraced house with veranda, Vedano Olona",
    vQuadrilocale: "Three-bedroom home with an 870 sqm garden",
    proofRest: " · over 500 reviews · told in video too",
    ctaWatch: "Watch the video reviews",
    ctaInstagram: "Follow us on Instagram",
  },
  fr: {
    eyebrow: "Notre énergie",
    title: "Vous nous voyez avant même de nous connaître.",
    subtitle:
      "Vidéos émotionnelles, Open Domus, réseaux sociaux et contenus racontent chaque maison avec le soin qu'elle mérite. C'est ainsi que nos clients nous font confiance avant même la première visite.",
    chip1: "Emotional video real estate",
    chip2: "Open Domus",
    chip3: "Des centaines de vidéos",
    chip4: "Social preview",
    kindRecensione: "Vidéo témoignage",
    kindTour: "Visite immobilière",
    kindDietro: "Dans les coulisses",
    vFeatured: "L'histoire de Teresa : vendue dès le premier Open Domus",
    vOpenDomus: "Vendu dès le premier Open Domus",
    vCinema: "Domus Tua au cinéma, sur Prime Video",
    vMozart: "Villa Mozart, Tradate",
    vDomotica: "Villa avec domotique et panneaux photovoltaïques",
    vVeranda: "Maison de plain-pied avec véranda, Vedano Olona",
    vQuadrilocale: "Maison de quatre pièces avec jardin de 870 m²",
    proofRest: " · plus de 500 avis · racontés aussi en vidéo",
    ctaWatch: "Voir les vidéos témoignages",
    ctaInstagram: "Suivez-nous sur Instagram",
  },
  de: {
    eyebrow: "Unsere Energie",
    title: "Sie sehen uns, noch bevor Sie uns kennenlernen.",
    subtitle:
      "Emotionale Videos, Open Domus, Social Media und Inhalte erzählen jedes Zuhause mit der Sorgfalt, die es verdient. So vertrauen uns unsere Kunden schon vor der ersten Besichtigung.",
    chip1: "Emotional video real estate",
    chip2: "Open Domus",
    chip3: "Hunderte von Videos",
    chip4: "Social preview",
    kindRecensione: "Video-Erfahrungsbericht",
    kindTour: "Immobilien-Tour",
    kindDietro: "Hinter den Kulissen",
    vFeatured: "Die Geschichte von Teresa: schon beim ersten Open Domus verkauft",
    vOpenDomus: "Schon beim ersten Open Domus verkauft",
    vCinema: "Domus Tua im Kino, auf Prime Video",
    vMozart: "Villa Mozart, Tradate",
    vDomotica: "Villa mit Smart-Home-Technik und Photovoltaik",
    vVeranda: "Reihenhaus mit Veranda, Vedano Olona",
    vQuadrilocale: "Vier-Zimmer-Haus mit 870 m² Garten",
    proofRest: " · über 500 Bewertungen · auch im Video erzählt",
    ctaWatch: "Die Video-Erfahrungsberichte ansehen",
    ctaInstagram: "Folgen Sie uns auf Instagram",
  },
  es: {
    eyebrow: "Nuestra energía",
    title: "Nos ves antes incluso de conocernos.",
    subtitle:
      "Vídeos emocionales, Open Domus, redes sociales y contenidos cuentan cada casa con el cuidado que merece. Así es como nuestros clientes confían en nosotros incluso antes de la primera visita.",
    chip1: "Emotional video real estate",
    chip2: "Open Domus",
    chip3: "Cientos de vídeos",
    chip4: "Social preview",
    kindRecensione: "Vídeo reseña",
    kindTour: "Tour inmobiliario",
    kindDietro: "Detrás de las cámaras",
    vFeatured: "La historia de Teresa: vendida en el primer Open Domus",
    vOpenDomus: "Vendido en el primer Open Domus",
    vCinema: "Domus Tua en el cine, en Prime Video",
    vMozart: "Villa Mozart, Tradate",
    vDomotica: "Villa con domótica y fotovoltaica",
    vVeranda: "Casa unifamiliar con galería, Vedano Olona",
    vQuadrilocale: "Piso de cuatro ambientes con jardín de 870 m²",
    proofRest: " · más de 500 reseñas · contadas también en vídeo",
    ctaWatch: "Ver las vídeo reseñas",
    ctaInstagram: "Síguenos en Instagram",
  },
} as const;

type Copy = (typeof copy)[keyof typeof copy];

function kindLabel(c: Copy, kind: VidKind) {
  return kind === "recensione" ? c.kindRecensione : kind === "tour" ? c.kindTour : c.kindDietro;
}

function PlayBadge({ small }: { small?: boolean }) {
  return (
    <span
      className={`absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-red shadow-lg transition-transform duration-300 group-hover:scale-110 ${
        small ? "h-11 w-11" : "h-16 w-16"
      }`}
    >
      <Play className={small ? "h-4 w-4" : "h-6 w-6"} />
    </span>
  );
}

function VideoCard({ v, small, c }: { v: Vid; small?: boolean; c: Copy }) {
  const title = c[v.titleKey as keyof Copy];
  return (
    <a
      href={v.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block h-full overflow-hidden rounded-[1.5rem] border border-line bg-ink"
    >
      <div className={`relative ${small ? "aspect-video" : "h-full min-h-[260px]"}`}>
        <Image
          src={v.thumb}
          alt={title}
          fill
          sizes={small ? "(max-width:1024px) 50vw, 300px" : "(max-width:1024px) 100vw, 640px"}
          className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
        />
        <span className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/15 to-transparent" />
        <PlayBadge small={small} />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-red">
          {kindLabel(c, v.kind)}
        </span>
        <p className={`absolute inset-x-4 bottom-4 font-medium text-white ${small ? "text-sm" : "text-lg sm:text-xl"}`}>
          {title}
        </p>
      </div>
    </a>
  );
}

export default function SocialVideoWall() {
  const { locale } = useLocale();
  const c = copy[locale];
  const chips = [c.chip1, c.chip2, c.chip3, c.chip4];

  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-28">
        <Reveal className="max-w-3xl">
          <span className="eyebrow">{c.eyebrow}</span>
          <h2 className="mt-5 font-display text-4xl font-medium leading-[1.05] tracking-tight text-ink balance sm:text-5xl">
            {c.title}
          </h2>
          <p className="mt-5 text-[1.02rem] leading-relaxed text-stone sm:text-lg">
            {c.subtitle}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {chips.map((chip) => (
              <span
                key={chip}
                className="flex items-center gap-2 rounded-full border border-line bg-paper px-3.5 py-1.5 text-[0.8rem] font-medium text-graphite"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-red" />
                {chip}
              </span>
            ))}
          </div>
        </Reveal>

        {/* Muro video asimmetrico */}
        <Reveal delay={100} className="mt-12">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2">
            <div className="sm:col-span-2 lg:col-span-2 lg:row-span-2">
              <VideoCard v={featured} c={c} />
            </div>
            <VideoCard v={wall[0]} small c={c} />
            <VideoCard v={wall[1]} small c={c} />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {wall.slice(2).map((v) => (
              <VideoCard key={v.href} v={v} small c={c} />
            ))}
          </div>
        </Reveal>

        {/* Proof + CTA */}
        <Reveal delay={150} className="mt-10 flex flex-col items-start justify-between gap-6 border-t border-line pt-8 sm:flex-row sm:items-center">
          <span className="flex items-center gap-2.5">
            <span className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 text-red" />
              ))}
            </span>
            <span className="text-sm text-graphite">
              <span className="font-semibold text-ink">{site.rating}/5</span>{c.proofRest}
            </span>
          </span>

          <div className="flex flex-wrap gap-3">
            <a
              href={site.social.youtube.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 rounded-full bg-red py-3 pl-6 pr-2.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-red-dark active:scale-[0.98]"
            >
              {c.ctaWatch}
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </a>
            <a
              href={site.social.instagram.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-5 py-3 text-sm font-semibold text-ink transition-all duration-300 hover:border-red hover:text-red"
            >
              <Instagram className="h-4 w-4" /> {c.ctaInstagram}
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
