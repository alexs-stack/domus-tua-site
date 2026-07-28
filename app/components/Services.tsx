"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import Reveal from "./Reveal";
import TextLines from "./motion/TextLines";
import MaskReveal from "./motion/MaskReveal";
import Parallax from "./motion/Parallax";
import HoverDistort from "./motion/HoverDistort";
import Atmosphere from "./motion/Atmosphere";
import { ArrowUpRight } from "./Icons";
import { useLocale } from "./i18n/LocaleProvider";
import { gsap, useGSAP, MQ, dur } from "../lib/motion/gsap";

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

// Anteprime per la lista servizi (hover desktop): immagini già in public/,
// scelte per coerenza col contenuto di ogni voce 01–05.
const PREVIEWS = [
  "/images/rendering_03_master_bedroom_legno.jpg",
  "/images/home_staging_01_sala_reale_sedie_gialle.jpg",
  "/images/reali/video-villa-mozart.jpg",
  "/images/premium_02_living_dining_piante.jpg",
  "/images/reali/open-domus-teresa.jpg",
];

export default function Services() {
  const { locale } = useLocale();
  const c = copy[locale];
  const gridRef = useRef<HTMLDivElement>(null);
  const floatRef = useRef<HTMLDivElement>(null);
  // Le 5 anteprime vengono montate SOLO quando il contesto desktop+mouse è
  // attivo: su mobile niente markup = niente download inutili.
  const [floatOn, setFloatOn] = useState(false);

  // Pattern award "list + floating image": sul passaggio del mouse sulle voci
  // 01–05 un'anteprima segue il cursore con lerp e fa crossfade tra le voci.
  // Solo desktop + pointer fine + motion ok; su touch restano le card pulite.
  useGSAP(
    () => {
      const grid = gridRef.current;
      const float = floatRef.current;
      if (!grid || !float) return;
      const mm = gsap.matchMedia();
      mm.add(`${MQ.motionOk} and ${MQ.finePointer} and (min-width: 1024px)`, () => {
        setFloatOn(true);
        gsap.set(float, { autoAlpha: 0, scale: 0.92 });
        const xTo = gsap.quickTo(float, "x", { duration: 0.45, ease: "power3.out" });
        const yTo = gsap.quickTo(float, "y", { duration: 0.45, ease: "power3.out" });
        let current = -1;

        const onMove = (e: PointerEvent) => {
          xTo(e.clientX + 22);
          yTo(e.clientY + 26);
        };
        const showIdx = (i: number) => {
          if (i === current) return;
          current = i;
          float.querySelectorAll<HTMLElement>("[data-float-img]").forEach((el, j) => {
            gsap.to(el, {
              autoAlpha: j === i ? 1 : 0,
              scale: j === i ? 1 : 1.05,
              duration: 0.35,
              ease: "domus",
              overwrite: "auto",
            });
          });
          gsap.to(float, { autoAlpha: 1, scale: 1, duration: dur.micro, ease: "domus", overwrite: "auto" });
        };
        const hide = () => {
          current = -1;
          gsap.to(float, { autoAlpha: 0, scale: 0.92, duration: 0.25, ease: "power2.out", overwrite: "auto" });
        };

        const cards = Array.from(grid.querySelectorAll<HTMLElement>("[data-service-idx]"));
        const bound = cards.map((card) => {
          const fn = () => showIdx(Number(card.dataset.serviceIdx));
          card.addEventListener("pointerenter", fn);
          return { card, fn };
        });
        // Sulla feature card (che ha già la sua immagine) l'anteprima sparisce.
        const feature = grid.querySelector<HTMLElement>("[data-service-feature]");
        feature?.addEventListener("pointerenter", hide);
        grid.addEventListener("pointermove", onMove, { passive: true });
        grid.addEventListener("pointerleave", hide);

        return () => {
          setFloatOn(false);
          bound.forEach(({ card, fn }) => card.removeEventListener("pointerenter", fn));
          feature?.removeEventListener("pointerenter", hide);
          grid.removeEventListener("pointermove", onMove);
          grid.removeEventListener("pointerleave", hide);
        };
      });
    },
    { scope: gridRef }
  );

  // Numeri 01–05: salgono da dietro la maschera overflow-hidden, una sola volta.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ.motionOk, () => {
        gsap.fromTo(
          "[data-service-num]",
          { yPercent: 110 },
          {
            yPercent: 0,
            duration: 0.9,
            ease: "expo.out",
            stagger: 0.06,
            scrollTrigger: { trigger: gridRef.current, start: "top 75%", once: true },
          }
        );
      });
    },
    { scope: gridRef }
  );

  return (
    <section id="servizi" className="relative bg-cream">
      {/* Aria: bagliori lenti dietro la griglia servizi */}
      <Atmosphere glow />
      <div className="relative mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
        {/* Eyebrow nel Reveal, titolo TextLines nudo (niente doppio-hide) */}
        <div className="max-w-2xl">
          <Reveal>
            <span className="eyebrow">{c.eyebrow}</span>
          </Reveal>
          <TextLines
            as="h2"
            className="mt-5 font-display text-4xl font-medium leading-[1.05] tracking-tight text-ink balance sm:text-5xl"
          >
            {c.title}
          </TextLines>
        </div>

        <div ref={gridRef} className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2">
          {/* Feature card — sipario sull'immagine + parallasse di profondità molto sottile */}
          <div className="lg:col-span-2 lg:row-span-2">
            <article
              data-service-feature
              data-cursor="scopri"
              className="group relative h-full min-h-[22rem] overflow-hidden rounded-[2rem] border border-line"
            >
              <MaskReveal
                from="bottom"
                zoom={1.12}
                className="absolute inset-0"
                innerClassName="absolute inset-0"
              >
                <Parallax
                  speed={0.06}
                  scale={1.06}
                  className="absolute inset-0"
                  innerClassName="absolute inset-0"
                >
                  {/* Hover liquido WebGL SOLO qui: l'immagine è un rendering di
                      interni, nessuna persona (regola cliente: mai distorsione
                      su foto con persone). HoverDistort sta DENTRO l'inner di
                      Parallax così il suo canvas eredita overscan e scrub e
                      resta allineato all'immagine al fade-in; il wrapper
                      absolute inset-0 gli dà il rect pieno su cui il canvas si
                      dimensiona (getBoundingClientRect). I gate desktop/pointer
                      fine/motionOk/saveData li gestisce il componente. */}
                  <HoverDistort className="absolute inset-0">
                    <Image
                      src="/images/rendering_01_living_divano_grigio.jpg"
                      alt={c.featureAlt}
                      fill
                      sizes="(max-width: 1024px) 100vw, 760px"
                      className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                    />
                  </HoverDistort>
                </Parallax>
                {/* pointer-events-none: il gradiente è decorativo ma copre tutta
                    la card; senza, intercetterebbe l'hit-testing e il pointer-
                    enter non raggiungerebbe mai il layer HoverDistort sotto.
                    Restando dopo Parallax nel DOM, continua a dipingersi SOPRA
                    il canvas: contrasto del testo intatto durante l'hover. */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/30 to-transparent" />
              </MaskReveal>
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
          </div>

          {c.services.map((s, i) => (
            <Reveal key={s.title} delay={i * 70}>
              <article
                data-service-idx={i}
                className="group flex h-full flex-col justify-between rounded-[2rem] border border-line bg-paper p-6 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:border-red/40"
              >
                <span className="block overflow-hidden">
                  <span
                    data-service-num
                    className="block tnum font-display text-sm font-semibold text-red transition-colors duration-500 group-hover:text-red-dark"
                  >
                    0{i + 1}
                  </span>
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

        {/* Anteprima flottante dei servizi (desktop + mouse): segue il cursore
            con lerp, crossfade tra le voci. fixed: nessun antenato trasformato. */}
        <div
          ref={floatRef}
          aria-hidden
          className="pointer-events-none fixed left-0 top-0 z-[45] w-60"
          style={{ visibility: "hidden" }}
        >
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-[0_30px_60px_-30px_rgba(26,21,18,0.55)]">
            {floatOn &&
              PREVIEWS.map((src) => (
                <Image
                  key={src}
                  data-float-img
                  src={src}
                  alt=""
                  fill
                  sizes="240px"
                  className="object-cover opacity-0"
                />
              ))}
          </div>
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
