"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import { Flip } from "gsap/Flip";
import Reveal from "./Reveal";
import TextLines from "./motion/TextLines";
import LazyYouTubeEmbed from "./LazyYouTubeEmbed";
import { SegnoDomusBadge } from "./BrandMotif";
import { Play, Instagram, YouTube, Star } from "./Icons";
import { Cta } from "./primitives/Cta";
import { site } from "../lib/site";
import {
  featuredVideo,
  videoCollection,
  youtubeWatch,
  type VideoKind,
  type VideoSlot,
} from "../lib/videos";
import { gsap, ScrollTrigger, useGSAP, MQ, dur, stagger, dist } from "../lib/motion/gsap";
import { useLocale } from "./i18n/LocaleProvider";

// Flip serve solo al riordino del filtro: registrato localmente (stesso pattern
// di TextLines con SplitText) per non finire nel chunk del layout via gsap.ts.
gsap.registerPlugin(Flip);

// Quali video stanno in evidenza e quali nella griglia: configurazione unica e pura in
// app/lib/videos.ts (verificabile dal test di content integrity, che ne controlla l'unicità
// degli id). Qui resta solo la resa.
type Vid = VideoSlot & { href: string };

// Video in evidenza: player leggero (carica l'iframe solo al click). Non entra nella griglia.
const FEATURED_YT_ID = featuredVideo.id;

const gridItems: Vid[] = videoCollection.map((v) => ({ ...v, href: youtubeWatch(v.id) }));

const copy = {
  it: {
    eyebrow: "La nostra energia",
    title: "La nostra energia si vede prima ancora della visita.",
    subtitle:
      "Video emozionali, Open Domus, social e contenuti raccontano ogni casa con la cura che merita. È così che i nostri clienti si fidano di noi ancora prima della prima visita.",
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
    proofRest: " · oltre 500 recensioni · raccontate anche in video",
    ctaWatch: "Guarda le video recensioni",
    ctaInstagram: "Seguici su Instagram",
  },
  en: {
    eyebrow: "Our energy",
    title: "Our energy shows even before the viewing.",
    subtitle:
      "Emotional videos, Open Domus, social media and content tell the story of every home with the care it deserves. That’s how our clients trust us even before the first viewing.",
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
    proofRest: " · over 500 reviews · told in video too",
    ctaWatch: "Watch the video reviews",
    ctaInstagram: "Follow us on Instagram",
  },
  fr: {
    eyebrow: "Notre énergie",
    title: "Notre énergie se voit avant même la visite.",
    subtitle:
      "Vidéos émotionnelles, Open Domus, réseaux sociaux et contenus racontent chaque maison avec le soin qu’elle mérite. C’est ainsi que nos clients nous font confiance avant même la première visite.",
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
    proofRest: " · plus de 500 avis · racontés aussi en vidéo",
    ctaWatch: "Voir les vidéos témoignages",
    ctaInstagram: "Suivez-nous sur Instagram",
  },
  de: {
    eyebrow: "Unsere Energie",
    title: "Unsere Energie sieht man schon vor der Besichtigung.",
    subtitle:
      "Emotionale Videos, Open Domus, Social Media und Inhalte erzählen jedes Zuhause mit der Sorgfalt, die es verdient. So vertrauen uns unsere Kunden schon vor der ersten Besichtigung.",
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
    proofRest: " · über 500 Bewertungen · auch im Video erzählt",
    ctaWatch: "Die Video-Erfahrungsberichte ansehen",
    ctaInstagram: "Folgen Sie uns auf Instagram",
  },
  es: {
    eyebrow: "Nuestra energía",
    title: "Nuestra energía se nota antes incluso de la visita.",
    subtitle:
      "Vídeos emocionales, Open Domus, redes sociales y contenidos cuentan cada casa con el cuidado que merece. Así es como nuestros clientes confían en nosotros incluso antes de la primera visita.",
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
    proofRest: " · más de 500 reseñas · contadas también en vídeo",
    ctaWatch: "Ver las vídeo reseñas",
    ctaInstagram: "Síguenos en Instagram",
  },
} as const;

type Copy = (typeof copy)[keyof typeof copy];

function kindLabel(c: Copy, kind: VideoKind) {
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
  const title = v.title;
  return (
    <a
      href={v.href}
      target="_blank"
      rel="noopener noreferrer"
      data-cursor="play"
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
  const [active, setActive] = useState<"all" | VideoKind>("all");
  // Pill solo per le categorie che hanno almeno un video: nessun filtro che porta a zero risultati.
  const kindLabels: Record<VideoKind, string> = {
    recensione: c.catRecensioni,
    opendomus: c.catOpenDomus,
    tour: c.catTour,
    dietro: c.catDietro,
  };
  const presentKinds = (["recensione", "opendomus", "tour", "dietro"] as const).filter((k) =>
    gridItems.some((v) => v.kind === k)
  );
  const filters: { key: "all" | VideoKind; label: string }[] = [
    { key: "all", label: c.catTutti },
    ...presentKinds.map((k) => ({ key: k, label: kindLabels[k] })),
  ];
  const visible = active === "all" ? gridItems : gridItems.filter((v) => v.kind === active);

  const gridRef = useRef<HTMLDivElement | null>(null);
  // Layout della griglia catturato PRIMA del cambio filtro (punto di partenza del FLIP).
  const flipStateRef = useRef<ReturnType<typeof Flip.getState> | null>(null);

  const onFilter = (key: "all" | VideoKind) => {
    // Il flip è evento-driven (non vive in matchMedia().add): check runtime, così
    // con reduced-motion il riordino resta istantaneo. setActive mai ritardato.
    if (gridRef.current && window.matchMedia(MQ.motionOk).matches) {
      flipStateRef.current = Flip.getState(gridRef.current.children);
    }
    setActive(key);
  };

  // FLIP post-render: dal layout catturato al nuovo ordine delle card (key stabili
  // → i nodi persistenti restano gli stessi e Flip li abbina per identità).
  useLayoutEffect(() => {
    const state = flipStateRef.current;
    flipStateRef.current = null;
    const grid = gridRef.current;
    if (!state || !grid) return;
    const tl = Flip.from(state, {
      // targets espliciti: le card appena montate non sono nello stato catturato
      // e senza questo onEnter non le vedrebbe.
      targets: grid.children,
      duration: dur.short,
      ease: "domus",
      stagger: 0.02,
      absolute: true,
      onEnter: (els) =>
        gsap.fromTo(
          els,
          { opacity: 0, scale: 0.94 },
          { opacity: 1, scale: 1, duration: dur.short, ease: "domus" }
        ),
      onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.94, duration: 0.25 }),
    });
    return () => {
      // Interruzione (nuovo filtro mid-flight): completare prima di uccidere
      // ripulisce i transform/position:absolute di Flip, altrimenti il flip
      // successivo misurerebbe un layout "congelato" a metà.
      if (tl.isActive()) tl.progress(1);
      tl.kill();
    };
  }, [active]);

  // Ingresso della griglia per-card (sostituisce il Reveal esterno rimosso).
  useGSAP(
    () => {
      const grid = gridRef.current;
      if (!grid) return;
      const mm = gsap.matchMedia();
      mm.add(MQ.motionOk, () => {
        const cards = gsap.utils.toArray<HTMLElement>(grid.children);
        if (!cards.length) return;
        // Nascoste solo post-idratazione: HTML iniziale completo (SEO/no-JS).
        gsap.set(cards, { opacity: 0, y: dist.rise / 2 });
        const triggers = ScrollTrigger.batch(cards, {
          start: "top 85%",
          once: true,
          onEnter: (els) =>
            gsap.fromTo(
              els,
              { opacity: 0, y: dist.rise / 2 },
              {
                opacity: 1,
                y: 0,
                duration: dur.short,
                ease: "domus",
                stagger: stagger.cards / 2,
                clearProps: "opacity,transform",
              }
            ),
        });
        // Card = <a>: reti di sicurezza come Reveal (focus tastiera o timeout).
        let done = false;
        const showAll = () => {
          if (done) return;
          done = true;
          triggers.forEach((t) => t.kill());
          // Non toccare card già in tween (entrance o Flip in corso): arrivano
          // da sole allo stato finale. Le altre vengono rivelate subito.
          gsap.set(cards.filter((el) => !gsap.isTweening(el)), { clearProps: "opacity,transform" });
        };
        grid.addEventListener("focusin", showAll);
        const safety = window.setTimeout(showAll, 2500);
        return () => {
          grid.removeEventListener("focusin", showAll);
          window.clearTimeout(safety);
        };
      });
    },
    { scope: gridRef }
  );

  return (
    <section className="bg-cream segno-ambient">
      <div className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
        {/* Reveal spezzato in due: il titolo TextLines resta nudo (niente doppio-hide) */}
        <div className="max-w-3xl">
          <Reveal>
            <SegnoDomusBadge>{c.eyebrow}</SegnoDomusBadge>
          </Reveal>
          <TextLines
            as="h2"
            className="mt-5 font-display text-4xl font-medium leading-[1.05] tracking-tight text-ink balance sm:text-5xl"
          >
            {c.title}
          </TextLines>
          <Reveal delay={100}>
            <p className="mt-5 text-[1.02rem] leading-relaxed text-stone sm:text-lg">
              {c.subtitle}
            </p>
          </Reveal>
        </div>

        {/* Video in evidenza: player leggero (iframe solo al click) + titolo e CTA a fianco,
            verticalmente centrati. Blocco bilanciato, niente accostamento sproporzionato. */}
        <Reveal delay={80} className="mt-12">
          <span className="eyebrow">{c.featuredEyebrow}</span>
          <div className="mt-4 grid items-center gap-6 lg:grid-cols-[1.65fr_1fr] lg:gap-10">
            {/* Poster curato 16:9 (foto reale del team) → niente bande nere da video verticale. */}
            {/* data-cursor="play": il cursore custom mostra il glifo play anche sul featured. */}
            <div data-cursor="play">
              <LazyYouTubeEmbed id={FEATURED_YT_ID} title={c.vFeatured} poster="/images/reali/raffaela-team-sede.jpg" />
            </div>
            <div>
              <h3 className="font-display text-2xl font-medium leading-snug tracking-tight text-ink sm:text-[1.9rem]">
                {c.vFeatured}
              </h3>
              <Cta
                href={site.social.youtube.href}
                variant="cta"
                size="md"
                className="mt-6"
                target="_blank"
                rel="noopener noreferrer"
              >
                <YouTube className="h-4 w-4" /> {c.ctaWatch}
              </Cta>
            </div>
          </div>
        </Reveal>

        {/* Collezione filtrabile per categoria (thumbnail → YouTube, nessun iframe autoloaded).
            Niente Reveal esterno: l'ingresso è per-card via ScrollTrigger.batch. */}
        <div className="mt-10">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label={c.eyebrow}>
            {filters.map((f) => {
              const on = active === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => onFilter(f.key)}
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

          <div ref={gridRef} className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((v) => (
              // key = id YouTube: ogni card è un video diverso, quindi la chiave è univoca
              <VideoCard key={v.id} v={v} small c={c} />
            ))}
          </div>
        </div>

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
            <Cta
              href={site.social.youtube.href}
              variant="cta"
              size="md"
              target="_blank"
              rel="noopener noreferrer"
            >
              <YouTube className="h-4 w-4" /> {c.ctaWatch}
            </Cta>
            <Cta
              href={site.social.instagram.href}
              variant="ghost"
              size="md"
              arrow={false}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Instagram className="h-4 w-4" /> {c.ctaInstagram}
            </Cta>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
