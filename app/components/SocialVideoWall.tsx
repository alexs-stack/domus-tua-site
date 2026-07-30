"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import { Flip } from "gsap/Flip";
import Reveal from "./Reveal";
import TextLines from "./motion/TextLines";
import LazyYouTubeEmbed from "./LazyYouTubeEmbed";
import { SegnoDomusBadge } from "./BrandMotif";
import { Play, ArrowUpRight, Instagram, YouTube, Star } from "./Icons";
import { site } from "../lib/site";
import {
  featuredVideo,
  collectionVideos,
  ytThumb,
  ytWatch,
  assertUniqueVideoIds,
  type VideoKind,
  type VerifiedVideo,
} from "../lib/content";
import { gsap, ScrollTrigger, useGSAP, MQ, dur, stagger, dist } from "../lib/motion/gsap";
import { useLocale } from "./i18n/LocaleProvider";

// Flip serve solo al riordino del filtro: registrato localmente (stesso pattern
// di TextLines con SplitText) per non finire nel chunk del layout via gsap.ts.
gsap.registerPlugin(Flip);

// Video REALI del canale — single source: app/lib/content (→ site.videos). Titolo ↔ ID ↔
// thumbnail sono coerenti PER COSTRUZIONE: la copertina è quella ufficiale di YouTube
// (`ytThumb`), quindi una card non può mostrare un video diverso da quello che linka.
//
// ⚠️ Prima c'erano 7 card con titoli/copertine INVENTATI su soli 5 ID reali (tre ID riusati,
//    uno duplicato del player in evidenza) e le categorie "Tour immobiliari"/"Dietro le quinte"
//    non avevano alcun video vero dietro. Ora le card sono quelle verificate e le pill
//    categoria sono DERIVATE dai video realmente presenti: niente filtro che promette
//    contenuto inesistente.
type VidKind = VideoKind;
type Vid = VerifiedVideo;

const FEATURED = featuredVideo;
// La storia in evidenza non si ripete tra le card sotto: nessun ID duplicato.
const collection: Vid[] = collectionVideos.filter((v) => v.id !== FEATURED.id);
// Fail-fast in dev/build se qualcuno reintroducesse un ID duplicato tra le card visibili.
assertUniqueVideoIds([FEATURED, ...collection]);

const copy = {
  it: {
    eyebrow: "La nostra energia",
    title: "La nostra energia si vede prima ancora della visita.",
    subtitle:
      "Video emozionali, Open Domus, social e contenuti raccontano ogni casa con la cura che merita. È così che i nostri clienti si fidano di noi ancora prima della prima visita.",
    featuredEyebrow: "Video in evidenza",
    catTutti: "Tutti",
    catRecensioni: "Video recensioni",
    catOpenDomus: "Open Domus",
    catStorie: "Storie di clienti",
    kindRecensione: "Video recensione",
    kindStoria: "Storia di un cliente",
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
    catTutti: "All",
    catRecensioni: "Video reviews",
    catOpenDomus: "Open Domus",
    catStorie: "Client stories",
    kindRecensione: "Video review",
    kindStoria: "A client’s story",
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
    catTutti: "Tous",
    catRecensioni: "Vidéos témoignages",
    catOpenDomus: "Open Domus",
    catStorie: "Histoires de clients",
    kindRecensione: "Vidéo témoignage",
    kindStoria: "L’histoire d’un client",
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
    catTutti: "Alle",
    catRecensioni: "Video-Erfahrungsberichte",
    catOpenDomus: "Open Domus",
    catStorie: "Kundengeschichten",
    kindRecensione: "Video-Erfahrungsbericht",
    kindStoria: "Die Geschichte eines Kunden",
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
    catTutti: "Todos",
    catRecensioni: "Vídeo reseñas",
    catOpenDomus: "Open Domus",
    catStorie: "Historias de clientes",
    kindRecensione: "Vídeo reseña",
    kindStoria: "La historia de un cliente",
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
    default:
      return c.kindStoria;
  }
}

/** Etichetta della pill filtro per una categoria. */
function catLabel(c: Copy, kind: VidKind) {
  switch (kind) {
    case "recensione":
      return c.catRecensioni;
    case "opendomus":
      return c.catOpenDomus;
    default:
      return c.catStorie;
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
  const title = v.title; // titolo reale del video (single source: content.ts)
  return (
    <a
      href={ytWatch(v.id)}
      target="_blank"
      rel="noopener noreferrer"
      data-cursor="play"
      className="group relative block h-full overflow-hidden rounded-[1.5rem] border border-line bg-ink"
    >
      <div className={`relative ${small ? "aspect-video" : "h-full min-h-[260px]"}`}>
        <Image
          src={ytThumb(v.id)}
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
  // Le pill categoria sono un vero filtro della collezione ("all" = tutto). Le categorie sono
  // DERIVATE dai video realmente presenti: nessuna pill può puntare a una lista vuota.
  const [active, setActive] = useState<"all" | VidKind>("all");
  const gridItems: Vid[] = collection;
  const kinds = [...new Set(gridItems.map((v) => v.kind))];
  const filters: { key: "all" | VidKind; label: string }[] = [
    { key: "all", label: c.catTutti },
    ...kinds.map((k) => ({ key: k, label: catLabel(c, k) })),
  ];
  const visible = active === "all" ? gridItems : gridItems.filter((v) => v.kind === active);

  const gridRef = useRef<HTMLDivElement | null>(null);
  // Layout della griglia catturato PRIMA del cambio filtro (punto di partenza del FLIP).
  const flipStateRef = useRef<ReturnType<typeof Flip.getState> | null>(null);

  const onFilter = (key: "all" | VidKind) => {
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
            {/* Nessuna metrica numerica qui: il "440+" video era una stima non verificata. */}
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
              {/* Poster = copertina ufficiale del video: non può disallinearsi dal contenuto. */}
              <LazyYouTubeEmbed id={FEATURED.id} title={FEATURED.title} poster={ytThumb(FEATURED.id)} />
            </div>
            <div>
              <h3 className="font-display text-2xl font-medium leading-snug tracking-tight text-ink sm:text-[1.9rem]">
                {FEATURED.title}
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
              // key = ID YouTube: univoco per costruzione (assertUniqueVideoIds)
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
