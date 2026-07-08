"use client";

import { useState } from "react";
import Image from "next/image";
import Reveal from "./Reveal";
import LazyYouTubeEmbed from "./LazyYouTubeEmbed";
import { SegnoDomusBadge } from "./BrandMotif";
import { Play, ArrowUpRight, Instagram, YouTube, Star } from "./Icons";
import { site } from "../lib/site";
import { useLocale } from "./i18n/LocaleProvider";

type VidKind = "recensione" | "opendomus" | "tour" | "dietro";

type Vid = {
  titleKey: string;
  thumb: string;
  href: string;
  kind: VidKind;
};

const yt = (id: string) => `https://www.youtube.com/watch?v=${id}`;

// Video REALI verificati dal canale Domus Tua (single source: site.videos).
//
// TODO(cliente): l'abbinamento thumbnail ↔ video è provvisorio. Prima del go-live il cliente
// deve confermare, per OGNI item qui sotto (featured, reel, wall):
//   • l'ID YouTube definitivo (o il timestamp del segmento da usare come clip);
//   • la thumbnail approvata (oggi usiamo frame/immagini reali del canale come segnaposto);
//   • il titolo mostrato in card.
// Finché non arriva la conferma, restano queste clip pubbliche reali del canale.
const V = site.videos;

// Reel/verticale in evidenza: player leggero (carica l'iframe solo al click).
const FEATURED_YT_ID = V.featured.id;

// Reel social — ora entra nella collezione qui sotto (niente più card verticale sproporzionata
// accanto al video). Thumbnail PULITA (foto reale del team), senza testo "cotto" nell'immagine.
const reel: Vid = {
  titleKey: "vReel",
  thumb: "/images/reali/team-red.jpg",
  href: yt(V.testimonial.id),
  kind: "opendomus",
};

// TODO(cliente): confermare per ogni card ID/timestamp + thumbnail approvati (vedi nota sopra).
const wall: Vid[] = [
  { titleKey: "vOpenDomus", thumb: "/images/reali/video/recensione-opendomus.jpg", href: yt(V.featured.id), kind: "opendomus" },
  { titleKey: "vCinema", thumb: "/images/reali/video/team-cinema.jpg", href: yt(V.testimonial.id), kind: "dietro" },
  { titleKey: "vMozart", thumb: "/images/reali/villa-tramonto.jpg", href: yt(V.reviews[1].id), kind: "tour" },
  { titleKey: "vDomotica", thumb: "/images/reali/video/domotica.jpg", href: yt(V.reviews[2].id), kind: "tour" },
  { titleKey: "vVeranda", thumb: "/images/reali/piscina-lusso.jpg", href: yt(V.reviews[0].id), kind: "tour" },
  { titleKey: "vQuadrilocale", thumb: "/images/reali/video/quadrilocale-giardino.jpg", href: yt(V.reviews[1].id), kind: "tour" },
];

const copy = {
  it: {
    eyebrow: "La nostra energia",
    title: "La nostra energia si vede prima ancora della visita.",
    subtitle:
      "Video emozionali, Open Domus, social e contenuti raccontano ogni casa con la cura che merita. È così che i nostri clienti si fidano di noi ancora prima della prima visita.",
    metricNote: site.videosCountNote,
    featuredEyebrow: "Video in evidenza",
    reelBadge: "Reel",
    catTutti: "Tutti",
    catRecensioni: "Video recensioni",
    catOpenDomus: "Open Domus",
    catTour: "Tour immobiliari",
    catDietro: "Dietro le quinte",
    kindRecensione: "Video recensione",
    kindTour: "Tour immobiliare",
    kindDietro: "Dietro le quinte",
    vFeatured: "Una storia vera: venduta al primo Open Domus",
    vReel: "Un giorno di Open Domus, in un minuto",
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
    title: "Our energy shows even before the viewing.",
    subtitle:
      "Emotional videos, Open Domus, social media and content tell the story of every home with the care it deserves. That’s how our clients trust us even before the first viewing.",
    metricNote: "videos across tours, reviews and Open Domus",
    featuredEyebrow: "Featured video",
    reelBadge: "Reel",
    catTutti: "All",
    catRecensioni: "Video reviews",
    catOpenDomus: "Open Domus",
    catTour: "Property tours",
    catDietro: "Behind the scenes",
    kindRecensione: "Video review",
    kindTour: "Property tour",
    kindDietro: "Behind the scenes",
    vFeatured: "A true story: sold at the very first Open Domus",
    vReel: "A day of Open Domus, in one minute",
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
    title: "Notre énergie se voit avant même la visite.",
    subtitle:
      "Vidéos émotionnelles, Open Domus, réseaux sociaux et contenus racontent chaque maison avec le soin qu’elle mérite. C’est ainsi que nos clients nous font confiance avant même la première visite.",
    metricNote: "vidéos entre visites, témoignages et Open Domus",
    featuredEyebrow: "Vidéo à la une",
    reelBadge: "Reel",
    catTutti: "Tous",
    catRecensioni: "Vidéos témoignages",
    catOpenDomus: "Open Domus",
    catTour: "Visites immobilières",
    catDietro: "Dans les coulisses",
    kindRecensione: "Vidéo témoignage",
    kindTour: "Visite immobilière",
    kindDietro: "Dans les coulisses",
    vFeatured: "Une histoire vraie : vendue dès le premier Open Domus",
    vReel: "Une journée d’Open Domus, en une minute",
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
    title: "Unsere Energie sieht man schon vor der Besichtigung.",
    subtitle:
      "Emotionale Videos, Open Domus, Social Media und Inhalte erzählen jedes Zuhause mit der Sorgfalt, die es verdient. So vertrauen uns unsere Kunden schon vor der ersten Besichtigung.",
    metricNote: "Videos zwischen Touren, Erfahrungsberichten und Open Domus",
    featuredEyebrow: "Video im Fokus",
    reelBadge: "Reel",
    catTutti: "Alle",
    catRecensioni: "Video-Erfahrungsberichte",
    catOpenDomus: "Open Domus",
    catTour: "Immobilien-Touren",
    catDietro: "Hinter den Kulissen",
    kindRecensione: "Video-Erfahrungsbericht",
    kindTour: "Immobilien-Tour",
    kindDietro: "Hinter den Kulissen",
    vFeatured: "Eine wahre Geschichte: schon beim ersten Open Domus verkauft",
    vReel: "Ein Tag Open Domus, in einer Minute",
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
    title: "Nuestra energía se nota antes incluso de la visita.",
    subtitle:
      "Vídeos emocionales, Open Domus, redes sociales y contenidos cuentan cada casa con el cuidado que merece. Así es como nuestros clientes confían en nosotros incluso antes de la primera visita.",
    metricNote: "vídeos entre tours, reseñas y Open Domus",
    featuredEyebrow: "Vídeo destacado",
    reelBadge: "Reel",
    catTutti: "Todos",
    catRecensioni: "Vídeo reseñas",
    catOpenDomus: "Open Domus",
    catTour: "Tours inmobiliarios",
    catDietro: "Detrás de las cámaras",
    kindRecensione: "Vídeo reseña",
    kindTour: "Tour inmobiliario",
    kindDietro: "Detrás de las cámaras",
    vFeatured: "Una historia real: vendida en el primer Open Domus",
    vReel: "Un día de Open Domus, en un minuto",
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
  switch (kind) {
    case "recensione":
      return c.kindRecensione;
    case "opendomus":
      return c.catOpenDomus; // "Open Domus" (nome-brand)
    case "tour":
      return c.kindTour;
    default:
      return c.kindDietro;
  }
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
  // Le pill categoria sono un vero filtro della collezione ("all" = tutto).
  const [active, setActive] = useState<"all" | VidKind>("all");
  const filters: { key: "all" | VidKind; label: string }[] = [
    { key: "all", label: c.catTutti },
    { key: "recensione", label: c.catRecensioni },
    { key: "opendomus", label: c.catOpenDomus },
    { key: "tour", label: c.catTour },
    { key: "dietro", label: c.catDietro },
  ];
  const gridItems: Vid[] = [reel, ...wall];
  const visible = active === "all" ? gridItems : gridItems.filter((v) => v.kind === active);

  return (
    <section className="bg-cream segno-ambient">
      <div className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
        <Reveal className="max-w-3xl">
          <SegnoDomusBadge>{c.eyebrow}</SegnoDomusBadge>
          <h2 className="mt-5 font-display text-4xl font-medium leading-[1.05] tracking-tight text-ink balance sm:text-5xl">
            {c.title}
          </h2>
          <p className="mt-5 text-[1.02rem] leading-relaxed text-stone sm:text-lg">
            {c.subtitle}
          </p>

          {/* Metrica: quanti video raccontano Domus Tua */}
          <div className="mt-7 flex items-baseline gap-3">
            <span className="font-display text-5xl font-medium leading-none text-red tnum sm:text-6xl">
              {site.videosCountLabel}
            </span>
            <span className="max-w-[16rem] text-sm leading-snug text-graphite">{c.metricNote}</span>
          </div>
        </Reveal>

        {/* Video in evidenza: player leggero (iframe solo al click) + titolo e CTA a fianco,
            verticalmente centrati. Blocco bilanciato, niente accostamento sproporzionato. */}
        <Reveal delay={80} className="mt-12">
          <span className="eyebrow">{c.featuredEyebrow}</span>
          <div className="mt-4 grid items-center gap-6 lg:grid-cols-[1.65fr_1fr] lg:gap-10">
            <LazyYouTubeEmbed id={FEATURED_YT_ID} title={c.vFeatured} />
            <div>
              <h3 className="font-display text-2xl font-medium leading-snug tracking-tight text-ink sm:text-[1.9rem]">
                {c.vFeatured}
              </h3>
              <a
                href={site.social.youtube.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-6 inline-flex items-center gap-2 rounded-full bg-red py-3 pl-6 pr-2.5 text-sm font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-red-dark active:scale-[0.98]"
              >
                <YouTube className="h-4 w-4" /> {c.ctaWatch}
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </a>
            </div>
          </div>
        </Reveal>

        {/* Collezione filtrabile per categoria (thumbnail → YouTube, nessun iframe autoloaded) */}
        <Reveal delay={120} className="mt-10">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label={c.eyebrow}>
            {filters.map((f) => {
              const on = active === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setActive(f.key)}
                  aria-pressed={on}
                  className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[0.8rem] font-medium transition-all duration-300 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red ${
                    on ? "border-red bg-red text-white" : "border-line bg-paper text-graphite hover:border-red hover:text-red"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${on ? "bg-white" : "bg-red"}`} />
                  {f.label}
                </button>
              );
            })}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((v) => (
              // key su titleKey (univoco): più href puntano allo stesso video reale
              <VideoCard key={v.titleKey} v={v} small c={c} />
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
              <YouTube className="h-4 w-4" /> {c.ctaWatch}
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
