"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useRef } from "react";
import Reveal from "./Reveal";
import CharFlip from "./motion/CharFlip";
import MaskReveal from "./motion/MaskReveal";
import Parallax from "./motion/Parallax";
import Fioritura from "./motion/Fioritura";
import HorizontalRail from "./motion/HorizontalRail";
// La distorsione liquida usa WebGL (ogl): il modulo arriva solo quando il componente entra in
// scena, e HoverDistort stesso non inizializza niente su mobile, con reduced motion o senza
// puntatore fine. Importarlo staticamente lo faceva finire nel chunk condiviso con GSAP, cioè
// nel primo caricamento di ogni pagina.
const HoverDistort = dynamic(() => import("./motion/HoverDistort"), { ssr: false });
import Atmosphere from "./motion/Atmosphere";
import { ArrowUpRight } from "./Icons";
import { useLocale } from "./i18n/LocaleProvider";
import { gsap, useGSAP, MQ, dur, stagger } from "../lib/motion/gsap";

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

// La foto di ogni servizio 01–05, nell'ordine dell'elenco `services`. Sono le
// stesse cinque immagini che prima vivevano nell'anteprima al seguito del
// cursore: ora stanno addosso alla lastra, che è dove il cliente le voleva
// («immagini grandi»), e non si scaricano più due volte.
const SHOTS = [
  "/images/rendering_03_master_bedroom_legno.jpg",
  "/images/home_staging_01_sala_reale_sedie_gialle.jpg",
  "/images/reali/video-villa-mozart.jpg",
  "/images/premium_02_living_dining_piante.jpg",
  "/images/reali/open-domus-teresa.jpg",
];

// Profondità del secondo piano, lastra per lastra (la quota di cui la foto pana
// in senso contrario alla corsa del nastro). Volutamente IRREGOLARI: una
// progressione ordinata si legge come un effetto, cinque valori sparsi si
// leggono come cinque distanze diverse. Il massimo sensato è 9 — oltre, il
// pannello (118% della cornice) scoprirebbe un bordo.
const DEPTHS = [6, 9, 4, 8, 5];

export default function Services() {
  const { locale } = useLocale();
  const c = copy[locale];
  // Componente MULTI-ISTANZA (home + /servizi): niente selettori globali,
  // ogni query parte da questi due ref.
  const rootRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLDivElement>(null);

  /* L'INGRESSO DELLE LASTRE — sipario dall'alto + numeri che salgono.
     Perché un sipario (clip-path) e non il solito fade-up: il nastro è alto
     quanto la lastra e `.dt-rail` taglia in verticale (overflow-y hidden), così
     qualunque traslazione verticale d'ingresso verrebbe rifilata a metà. Il
     clip apre la lastra sul posto e non chiede un pixel di spazio in più.
     È lo stesso gesto di MaskReveal, con le stesse misure.

     IntersectionObserver e non ScrollTrigger (convenzione del sito, vedi
     CharFlip): questa sezione sta sotto le runway pinnate della home e lì le
     posizioni calcolate da ScrollTrigger arrivano sfasate. La timeline è in
     pausa e ha un solo padrone.

     Sotto i 1024px il nastro è uno scroll orizzontale nativo: le lastre fuori
     campo sono comunque già rivelate quando l'utente arriva a trascinarle,
     perché il trigger è il nastro intero, non la singola lastra. */
  useGSAP(
    () => {
      const rail = railRef.current;
      if (!rail) return;
      const mm = gsap.matchMedia();
      mm.add(MQ.motionOk, () => {
        const slabs = gsap.utils.toArray<HTMLElement>(rail.querySelectorAll("[data-service-card]"));
        const nums = gsap.utils.toArray<HTMLElement>(rail.querySelectorAll("[data-service-num]"));
        if (!slabs.length) return;

        // opacity e non autoAlpha: le lastre sono LINK, e `visibility: hidden`
        // le toglierebbe dall'ordine di tabulazione per tutta la durata del
        // reveal (regola già scritta in Social.tsx). Niente clearProps al
        // termine: romperebbe il restart/reverse.
        const tl = gsap.timeline({ paused: true });
        tl.fromTo(
          slabs,
          { clipPath: "inset(0% 0% 100% 0%)", opacity: 0 },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            opacity: 1,
            duration: dur.reveal,
            ease: "dtOut",
            stagger: stagger.cards,
          },
          0
        ).fromTo(
          nums,
          { yPercent: 110 },
          { yPercent: 0, duration: dur.short, ease: "expo.out", stagger: stagger.cards },
          0.2
        );

        const io = new IntersectionObserver(
          (entries) =>
            entries.forEach((e) => {
              // restart(), non play(): dopo un reverse() la timeline resta in
              // stato "reversed" e play() sarebbe ambiguo. È anche la
              // convenzione del resto del sito ("restart none none reverse").
              if (e.isIntersecting) tl.restart();
              else tl.reverse();
            }),
          { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
        );
        io.observe(rail);
        // Rete di sicurezza del sito: il nastro non può restare invisibile.
        const safety = window.setTimeout(() => tl.progress(1), 2500);
        return () => {
          io.disconnect();
          window.clearTimeout(safety);
          tl.kill();
        };
      });
    },
    { scope: rootRef }
  );

  return (
    <section ref={rootRef} id="servizi" data-tone="cream" className="relative bg-cream">
      {/* Aria: bagliori lenti dietro il nastro dei servizi */}
      <Atmosphere glow />

      {/* ── CAPO SEZIONE ─────────────────────────────────────────────────── */}
      <div className="relative mx-auto max-w-[1240px] px-5 pt-24 sm:px-8 sm:pt-32">
        {/* Eyebrow nel Reveal, titolo nudo dentro CharFlip (niente doppio-hide) */}
        <Reveal>
          <span className="eyebrow">{c.eyebrow}</span>
        </Reveal>
        {/* CharFlip, non TextLines: sullo stesso elemento i due rivelatori si
            annullerebbero — uno maschera le righe, l'altro gira i glifi.
            La taglia è quella della scala display (text-d2 = testa di
            capitolo), non più 48px fissi: è la misura che il cliente chiede
            («scritte grandi») e quella del riferimento. La colonna si misura
            in `ch` SULL'ELEMENTO che porta la taglia — su un div esterno il ch
            varrebbe 16px e il titolo diventerebbe una striscia.
            `balance` è via apposta: text-wrap: balance si ricalcola dopo lo
            split e fa saltare una riga. */}
        <CharFlip
          as="h2"
          className="mt-5 max-w-[16ch] font-display text-d2 display-tight font-medium text-ink"
          exit
        >
          {c.title}
        </CharFlip>
      </div>

      {/* ── IL NASTRO DEI SERVIZI ────────────────────────────────────────────
          Lo scroll orizzontale chiesto dal cliente. Il nastro si ferma al
          centro dello schermo e compie tutta la corsa lì, davanti agli occhi:
          prima cominciava mentre affacciava da sotto e finiva mentre usciva da
          sopra, quindi metà del gesto avveniva fuori campo e "durava poco"
          proprio perché lo si vedeva poco.
          Full-bleed, fuori dal contenitore: un nastro che non tocca i bordi
          dello schermo è solo una riga. Sotto i 1024px torna scroll orizzontale
          nativo, con tutte le lastre presenti e trascinabili — e senza
          corridoio: quello vive solo dove il nastro è pilotato da GSAP. */}
      <div ref={railRef} className="relative mt-12 sm:mt-16">
        {/* `runway`: il nastro si ferma al centro dello schermo e la corsa dura
            un corridoio di scroll tutto suo (2026-08-09, direttiva cliente).
            120svh è la misura scelta: la corsa orizzontale è di ~850px su un
            1920, e distribuirla su ~1,2 schermate la fa leggere lenta senza
            trasformare la sezione in una sosta. */}
        <HorizontalRail snapMobile cursor="scopri" runway={120}>
          {c.services.map((s, i) => (
            /* Lastra = link, non solo scheda. Due motivi, uno di forma e uno di
               sostanza: dà a ogni servizio la sua uscita verso i contatti (come
               fa già la fascia D.O.C. qui sotto), e soprattutto rende il nastro
               raggiungibile da tastiera — una regione che scorre e non contiene
               nulla di focalizzabile è una violazione WCAG 2.1.1 vera, che axe
               segnala e che la nostra suite fa fallire. */
            <a
              key={s.title}
              href="#contatti"
              data-service-card
              className="group relative block aspect-[4/5] w-[76vw] overflow-hidden rounded-[2rem] border border-line sm:w-[48vw] lg:w-[26vw]"
            >
              {/* Secondo piano: il pannello è più largo della cornice (118%) ed
                  è dentro quel gioco che la foto pana in senso contrario alla
                  corsa del nastro, di una quota diversa per lastra. */}
              <div className="dt-rail_pan" data-depth={DEPTHS[i]}>
                <Image
                  src={SHOTS[i]}
                  alt=""
                  fill
                  sizes="(max-width: 639px) 90vw, (max-width: 1023px) 57vw, 31vw"
                  className="photo-warm object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
                />
              </div>
              {/* Velo scuro dal basso: è quello che tiene il contrasto del testo
                  su cinque fotografie diverse, non la fortuna. */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/92 via-ink/45 to-ink/5" />
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7">
                <span className="block overflow-hidden">
                  <span
                    data-service-num
                    className="block tnum font-display text-sm font-semibold text-cream/85"
                  >
                    0{i + 1}
                  </span>
                </span>
                <h3 className="mt-3 font-display text-xl font-medium leading-snug tracking-tight text-cream sm:text-2xl">
                  {s.title}
                </h3>
                <p className="mt-2 text-[0.86rem] leading-relaxed text-cream/80">{s.copy}</p>
              </div>
            </a>
          ))}
        </HorizontalRail>
      </div>

      {/* ── SERVIZIO DI PUNTA + FASCIA D.O.C. ────────────────────────────── */}
      <div className="relative mx-auto max-w-[1240px] px-5 pb-24 sm:px-8 sm:pb-32">
        {/* Il wrapper esiste solo per dare al tralcio un blocco contenitore che
            NON tagli: la lastra ha overflow-hidden e un tralcio messo dentro
            verrebbe rifilato sul bordo. */}
        <div className="relative mt-14 sm:mt-20">
          {/* Feature card — sipario sull'immagine + parallasse di profondità molto
              sottile, accesa anche sul telefono: il rendering è l'unica immagine
              di tutto il capitolo Servizi che non scorre di lato (la rotaia sopra
              ce l'ha già, nativa), e la deriva è ciò che le impedisce di leggersi
              come un fondale dietro al testo in overlay. */}
          <article
            data-cursor="scopri"
            className="group relative min-h-[24rem] overflow-hidden rounded-[2rem] border border-line sm:min-h-[32rem] lg:min-h-[38rem]"
          >
            <MaskReveal
              from="bottom"
              zoom={1.12}
              className="absolute inset-0"
              innerClassName="absolute inset-0"
            >
              {/* `mobile` NON passata, e la misura dice perché. A 390x664 la
                  cornice è alta 405px e `speed 0.06` vale ±0,84% della sua
                  altezza: 6,4px di corsa totale. È sotto la stessa soglia con
                  cui questa wave ha già cancellato la cupola (21px) e i
                  gradini (6-7px) — e sotto quella con cui, tre righe più in
                  là, ha rifiutato la filigrana del D.O.C. a ±2,7px. Accenderla
                  qui sarebbe stato pagare uno ScrollTrigger scrubbato per un
                  movimento che non esiste. */}
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
                    /* La lastra ora è larga quanto la colonna (era due terzi di
                       una griglia a tre): senza aggiornare `sizes` il browser
                       continuerebbe a scaricare la variante da 760px e la
                       stirerebbe su 1240. */
                    sizes="(max-width: 1240px) 100vw, 1240px"
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
            <div className="absolute inset-x-0 bottom-0 p-7 sm:p-9 lg:p-12">
              <span className="rounded-full bg-red px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-cream">
                {c.featureBadge}
              </span>
              {/* text-d3 (sottotitolo/titolo interno della scala display): la
                  lastra è alta 38rem, un titolo da 36px ci galleggerebbe dentro.
                  max-w-2xl tiene la misura leggibile E lascia libero il terzo
                  destro, che è dove cade il tralcio. */}
              <h3 className="mt-4 max-w-2xl font-display text-d3 display-tight font-medium text-cream">
                {c.featureTitle}
              </h3>
              <p className="mt-4 max-w-md text-[0.95rem] leading-relaxed text-cream/75">
                {c.featureCopy}
              </p>
            </div>
          </article>
          {/* IL TRALCIO — uno solo per schermata, e qui è nel margine destro
              della lastra grande: il testo è ancorato in basso a sinistra e non
              supera max-w-2xl, quindi il terzo destro resta libero anche a
              1024px. Sta DOPO l'article nel DOM apposta — entrambi sono
              posizionati, e l'ordine di pittura è l'ordine del DOM: solo così
              il tralcio si vede sopra la fotografia invece di sparirci dietro.
              Opacità 0.5 perché il fondo è una foto velata di scuro: su crema
              il tetto sarebbe 0.40. */}
          <Fioritura variant="corner-br" palette="dark" className="absolute bottom-6 right-6 z-10 hidden h-[28vh] w-[13vw] lg:block" />
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
