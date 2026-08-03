"use client";

// ReviewsWall — "il muro delle voci": dall'ultimo fotogramma orizzontale lo
// scroll prosegue in verticale e il muro dei video del canale si compone
// davanti agli occhi. Tecnica dal riferimento Codrops sticky-grid-scroll
// (MIT, theoplawinski), riscritta nel vocabolario di casa: griglia che parte
// zoomata (scale 2.05) e si assesta in scrub mentre le colonne scivolano al
// loro posto — pari dall'alto, dispari dal basso, laterali con deriva
// orizzontale (xPercent ∓40), cascata di 0.06 per riga.
//
// Verità dei contenuti: SOLO i video reali del canale (wallVideos, fonte
// unica app/lib/videos.ts), ogni card col titolo vero. Mobile/reduced-motion:
// griglia statica completa — gli stati iniziali esistono solo via JS.
import { useRef } from "react";
import Image from "next/image";
import TextLines from "./motion/TextLines";
import Reveal from "./Reveal";
import { ArrowUpRight, Play } from "./Icons";
import { useLocale } from "./i18n/LocaleProvider";
import { site } from "../lib/site";
import { wallVideos, youtubeWatch, type VideoKind } from "../lib/videos";
import { gsap, ScrollTrigger, useGSAP, MQ } from "../lib/motion/gsap";

const WALL_MQ = "(min-width: 1024px)";

const copy = {
  it: {
    cap: "Dal canale YouTube",
    title: "Il muro delle voci.",
    intro:
      "Le storie vere del canale: le recensioni dei clienti, le case vendute con Open Domus, il team che conosci prima di incontrarlo.",
    cta: "Apri il canale YouTube",
    kinds: { recensione: "Recensione", opendomus: "Open Domus", tour: "Tour", dietro: "Dietro le quinte" },
  },
  en: {
    cap: "From the YouTube channel",
    title: "The wall of voices.",
    intro:
      "Real stories from the channel: client reviews, homes sold with Open Domus, and the team you get to know before meeting them.",
    cta: "Open the YouTube channel",
    kinds: { recensione: "Review", opendomus: "Open Domus", tour: "Tour", dietro: "Behind the scenes" },
  },
  fr: {
    cap: "Depuis la chaîne YouTube",
    title: "Le mur des voix.",
    intro:
      "Les histoires vraies de la chaîne : les avis des clients, les maisons vendues avec Open Domus, l'équipe que l'on connaît avant de la rencontrer.",
    cta: "Ouvrir la chaîne YouTube",
    kinds: { recensione: "Avis", opendomus: "Open Domus", tour: "Visite", dietro: "Coulisses" },
  },
  de: {
    cap: "Vom YouTube-Kanal",
    title: "Die Wand der Stimmen.",
    intro:
      "Echte Geschichten vom Kanal: Kundenbewertungen, mit Open Domus verkaufte Häuser und das Team, das man kennt, bevor man es trifft.",
    cta: "YouTube-Kanal öffnen",
    kinds: { recensione: "Bewertung", opendomus: "Open Domus", tour: "Rundgang", dietro: "Hinter den Kulissen" },
  },
  es: {
    cap: "Desde el canal de YouTube",
    title: "El muro de las voces.",
    intro:
      "Las historias reales del canal: las reseñas de los clientes, las casas vendidas con Open Domus y el equipo que conoces antes de conocerlo.",
    cta: "Abrir el canal de YouTube",
    kinds: { recensione: "Reseña", opendomus: "Open Domus", tour: "Visita", dietro: "Detrás de escena" },
  },
} as const;

export default function ReviewsWall() {
  const { locale } = useLocale();
  const c = copy[locale];
  const sectionRef = useRef<HTMLElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const grid = gridRef.current;
      if (!section || !grid) return;

      const mm = gsap.matchMedia();
      mm.add({ desktop: WALL_MQ, motionOk: MQ.motionOk }, (ctx) => {
        const cond = ctx.conditions as { desktop: boolean; motionOk: boolean };
        if (!cond.desktop || !cond.motionOk) return;

        const tiles = gsap.utils.toArray<HTMLElement>("[data-wall-tile]", grid);
        if (!tiles.length) return;

        // La griglia parte zoomata sul primo filare e si assesta scendendo:
        // l'apice resta ancorato (origin in alto) così il muro "cresce" verso
        // il basso dentro la sezione clippata.
        gsap.set(grid, { scale: 2.05, transformOrigin: "50% 0%" });

        // Distanza d'ingresso del riferimento: oltre il bordo, proporzionale
        // alla finestra — funzione per il ricalcolo su resize/refresh.
        const dy = () => window.innerHeight - (window.innerHeight - grid.offsetHeight) / 2;

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top 55%",
            end: "bottom bottom",
            scrub: 0.3,
            invalidateOnRefresh: true,
          },
        });
        tl.to(grid, { scale: 1, ease: "none", duration: 1 }, 0);
        tiles.forEach((tile, i) => {
          const col = i % 3;
          const row = Math.floor(i / 3);
          const fromTop = col % 2 === 0; // colonne pari dall'alto, centrale dal basso
          tl.fromTo(
            tile,
            {
              y: () => (fromTop ? -1 : 1) * dy(),
              xPercent: col === 0 ? -40 : col === 2 ? 40 : 0,
            },
            { y: 0, xPercent: 0, ease: "none", duration: 1 },
            row * 0.06
          );
        });

        // Tastiera: un link raggiunto col Tab mentre il muro è ancora sparso
        // porta lo scroll a fine sezione (scrub completo, card al suo posto).
        const onFocus = () => {
          if ((tl.scrollTrigger?.progress ?? 1) < 0.98) {
            section.scrollIntoView({ block: "end", behavior: "auto" });
            ScrollTrigger.update();
          }
        };
        grid.addEventListener("focusin", onFocus);
        return () => grid.removeEventListener("focusin", onFocus);
      });
    },
    { scope: sectionRef }
  );

  return (
    <section ref={sectionRef} className="relative overflow-clip">
      <div className="mx-auto max-w-[1240px] px-5 pb-28 pt-24 sm:px-8 sm:pt-28">
        <div className="max-w-2xl">
          <Reveal>
            <span className="eyebrow">{c.cap}</span>
          </Reveal>
          <TextLines
            as="h2"
            className="mt-5 font-display text-[clamp(2rem,4.2vw,3.9rem)] font-medium leading-[1.04] tracking-[-0.01em] text-ink"
          >
            {c.title}
          </TextLines>
          <Reveal delay={120}>
            <p className="mt-5 max-w-xl text-[0.95rem] leading-relaxed text-stone sm:text-base">
              {c.intro}
            </p>
          </Reveal>
        </div>

        <div ref={gridRef} className="mt-14 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3">
          {wallVideos.map((v) => (
            <a
              key={v.id}
              data-wall-tile
              href={youtubeWatch(v.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block overflow-hidden rounded-card bg-espresso shadow-card transition-shadow duration-300 hover:shadow-card-hover"
            >
              <span className="relative block aspect-video">
                <Image
                  src={v.thumb}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 30vw, 50vw"
                  className="object-cover transition-transform duration-500 ease-soft group-hover:scale-[1.04]"
                />
                {/* Velo di leggibilità: il titolo poggia su fondo scuro reale. */}
                <span
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-espresso/85 via-espresso/15 to-transparent"
                />
              </span>
              <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
                <span>
                  <span className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-cream/75">
                    {c.kinds[v.kind as VideoKind]}
                  </span>
                  <span className="mt-1 block text-sm font-semibold leading-snug text-cream">
                    {v.title}
                  </span>
                </span>
                <span className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red text-white transition-transform duration-300 ease-soft group-hover:scale-110">
                  <Play className="ml-0.5 h-3.5 w-3.5" />
                </span>
              </span>
            </a>
          ))}
        </div>

        <Reveal className="mt-12 flex justify-center">
          <a
            href={site.social.youtube.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-red transition-colors hover:text-red-dark"
          >
            {c.cta}
            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </a>
        </Reveal>
      </div>
    </section>
  );
}
