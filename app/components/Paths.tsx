"use client";

import Image from "next/image";
import { useRef } from "react";
import Reveal from "./Reveal";
import TextLines from "./motion/TextLines";
import MaskReveal from "./motion/MaskReveal";
import Atmosphere from "./motion/Atmosphere";
import { ArrowUpRight, Check } from "./Icons";
import { useLocale } from "./i18n/LocaleProvider";
import { gsap, useGSAP, MQ, dur } from "../lib/motion/gsap";

const paths = [
  {
    id: "vendi",
    href: "/vendi",
    image: "/images/reali/consulenza.jpg",
  },
  {
    id: "acquista",
    href: "/acquista",
    image: "/images/reali/villa-pool.jpg",
  },
] as const;

const copy = {
  it: {
    eyebrow: "Due percorsi, un solo metodo",
    heading: "Che tu venda o acquisti, il nostro lavoro è proteggere le tue scelte.",
    paths: {
      vendi: {
        tag: "Per chi vende",
        title: "Vendi casa con metodo, non con improvvisazione.",
        copy: "Valutiamo, prepariamo, raccontiamo e promuoviamo il tuo immobile con un percorso pensato per ridurre stress, tempi morti e incertezze.",
        points: [
          "Valutazione professionale e documenti verificati",
          "Foto, video, rendering e home staging",
          "Campagne marketing e Open Domus",
        ],
        cta: "Voglio vendere casa",
        alt: "Living luminoso con zona pranzo e piante",
      },
      acquista: {
        tag: "Per chi acquista",
        title: "Acquista casa con più risposte e meno dubbi.",
        copy: "Ti accompagniamo nelle visite, nella documentazione, nella proposta e in ogni passaggio fino al rogito.",
        points: [
          "Informazioni chiare già prima della visita",
          "Documentazione verificata e trasparente",
          "Supporto su proposta, compromesso e rogito",
        ],
        cta: "Cerco casa",
        alt: "Living open space con cucina e tavolo da pranzo",
      },
    },
  },
  en: {
    eyebrow: "Two paths, one method",
    heading: "Whether you sell or buy, our job is to protect your choices.",
    paths: {
      vendi: {
        tag: "For those selling",
        title: "Sell your home with method, not improvisation.",
        copy: "We appraise, prepare, tell the story of and promote your property through a process designed to reduce stress, downtime and uncertainty.",
        points: [
          "Professional appraisal and verified documents",
          "Photography, video, rendering and home staging",
          "Marketing campaigns and Open Domus",
        ],
        cta: "I want to sell my home",
        alt: "Bright living room with dining area and plants",
      },
      acquista: {
        tag: "For those buying",
        title: "Buy your home with more answers and fewer doubts.",
        copy: "We guide you through viewings, documentation, the offer and every step up to the closing.",
        points: [
          "Clear information even before the viewing",
          "Verified and transparent documentation",
          "Support with offer, preliminary contract and closing",
        ],
        cta: "I'm looking for a home",
        alt: "Open-plan living room with kitchen and dining table",
      },
    },
  },
  fr: {
    eyebrow: "Deux parcours, une seule méthode",
    heading: "Que vous vendiez ou achetiez, notre métier est de protéger vos choix.",
    paths: {
      vendi: {
        tag: "Pour ceux qui vendent",
        title: "Vendez votre bien avec méthode, pas à l'improviste.",
        copy: "Nous évaluons, préparons, mettons en valeur et faisons la promotion de votre bien grâce à un parcours pensé pour réduire le stress, les temps morts et les incertitudes.",
        points: [
          "Évaluation professionnelle et documents vérifiés",
          "Photos, vidéos, rendus et home staging",
          "Campagnes marketing et Open Domus",
        ],
        cta: "Je veux vendre mon bien",
        alt: "Séjour lumineux avec coin repas et plantes",
      },
      acquista: {
        tag: "Pour ceux qui achètent",
        title: "Achetez votre bien avec plus de réponses et moins de doutes.",
        copy: "Nous vous accompagnons lors des visites, dans les démarches, dans l'offre et à chaque étape jusqu'à la signature.",
        points: [
          "Des informations claires dès avant la visite",
          "Une documentation vérifiée et transparente",
          "Un accompagnement pour l'offre, le compromis et la signature",
        ],
        cta: "Je cherche un bien",
        alt: "Séjour ouvert avec cuisine et table à manger",
      },
    },
  },
  de: {
    eyebrow: "Zwei Wege, eine Methode",
    heading: "Ob Sie verkaufen oder kaufen: Unsere Aufgabe ist es, Ihre Entscheidungen zu schützen.",
    paths: {
      vendi: {
        tag: "Für Verkäufer",
        title: "Verkaufen Sie Ihre Immobilie mit Methode, nicht mit Improvisation.",
        copy: "Wir bewerten, bereiten vor, inszenieren und bewerben Ihre Immobilie mit einem Ablauf, der Stress, Leerlauf und Unsicherheiten reduziert.",
        points: [
          "Professionelle Bewertung und geprüfte Unterlagen",
          "Fotos, Videos, Renderings und Home Staging",
          "Marketingkampagnen und Open Domus",
        ],
        cta: "Ich möchte meine Immobilie verkaufen",
        alt: "Helles Wohnzimmer mit Essbereich und Pflanzen",
      },
      acquista: {
        tag: "Für Käufer",
        title: "Kaufen Sie Ihre Immobilie mit mehr Antworten und weniger Zweifeln.",
        copy: "Wir begleiten Sie bei Besichtigungen, bei den Unterlagen, beim Angebot und bei jedem Schritt bis zum Notartermin.",
        points: [
          "Klare Informationen schon vor der Besichtigung",
          "Geprüfte und transparente Unterlagen",
          "Unterstützung bei Angebot, Vorvertrag und Notartermin",
        ],
        cta: "Ich suche eine Immobilie",
        alt: "Offener Wohnbereich mit Küche und Esstisch",
      },
    },
  },
  es: {
    eyebrow: "Dos recorridos, un solo método",
    heading: "Tanto si vendes como si compras, nuestro trabajo es proteger tus decisiones.",
    paths: {
      vendi: {
        tag: "Para quien vende",
        title: "Vende tu casa con método, no con improvisación.",
        copy: "Valoramos, preparamos, contamos y promocionamos tu inmueble con un recorrido pensado para reducir el estrés, los tiempos muertos y la incertidumbre.",
        points: [
          "Valoración profesional y documentos verificados",
          "Fotos, vídeos, renders y home staging",
          "Campañas de marketing y Open Domus",
        ],
        cta: "Quiero vender mi casa",
        alt: "Salón luminoso con zona de comedor y plantas",
      },
      acquista: {
        tag: "Para quien compra",
        title: "Compra tu casa con más respuestas y menos dudas.",
        copy: "Te acompañamos en las visitas, en la documentación, en la oferta y en cada paso hasta la firma.",
        points: [
          "Información clara ya antes de la visita",
          "Documentación verificada y transparente",
          "Apoyo en la oferta, el contrato preliminar y la firma",
        ],
        cta: "Busco casa",
        alt: "Salón diáfano con cocina y mesa de comedor",
      },
    },
  },
} as const;

type PathDef = (typeof paths)[number];
type PathTexts = (typeof copy)[keyof typeof copy]["paths"][PathDef["id"]];

// Card percorso: ingresso laterale (i due percorsi arrivano da direzioni
// opposte), cascata dei benefici e deriva dell'immagine col puntatore.
// Il wrapper porta l'id ancora (#vendi/#acquista): scroll-margin-top arriva
// dal selettore globale :where([id]).
function PathCard({ p, i, t }: { p: PathDef; i: number; t: PathTexts }) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const imgWrapRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const wrap = wrapRef.current;
      if (!wrap) return;

      const mm = gsap.matchMedia();

      mm.add(MQ.motionOk, () => {
        // La card è interamente un <a>: si anima opacity (mai autoAlpha) per
        // non toglierla dal tab order mentre è nascosta.
        // Replay a ogni passaggio: niente clearProps (romperebbe restart/reverse).
        const enter = gsap.fromTo(
          wrap,
          { x: i === 0 ? -56 : 56, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: dur.reveal,
            ease: "domus",
            scrollTrigger: { trigger: wrap, start: "top 78%", toggleActions: "restart none none reverse" },
          }
        );

        // Cascata dei benefici allo stesso trigger (pattern OpenDomus, ma
        // opacity: le righe vivono dentro il link). Come in OpenDomus i <li>
        // sono keyed sul testo: dopo un cambio lingua pre-trigger i nodi nuovi
        // restano semplicemente visibili (nessuna cascata, nessun glitch).
        const rows = wrap.querySelectorAll("li");
        const bullets =
          rows.length > 0
            ? gsap.fromTo(
                rows,
                { y: 14, opacity: 0 },
                {
                  y: 0,
                  opacity: 1,
                  duration: dur.reveal,
                  ease: "expo.out",
                  stagger: 0.08,
                  scrollTrigger: { trigger: wrap, start: "top 78%", toggleActions: "restart none none reverse" },
                }
              )
            : null;

        // Reti di sicurezza (stesso patto di Reveal): focus da tastiera o
        // timeout completano subito gli ingressi.
        const reveal = () => {
          enter.progress(1);
          bullets?.progress(1);
        };
        wrap.addEventListener("focusin", reveal, { once: true });
        const safety = window.setTimeout(reveal, 2500);
        return () => {
          wrap.removeEventListener("focusin", reveal);
          window.clearTimeout(safety);
        };
      });

      // Deriva dell'immagine col puntatore: il transform sta sul wrapper
      // dell'Image DENTRO la maschera, mai sull'article (ha già l'hover
      // translate CSS).
      mm.add(`${MQ.motionOk} and ${MQ.desktop} and ${MQ.finePointer}`, () => {
        const imgWrap = imgWrapRef.current;
        if (!imgWrap) return;

        // Overscan 1.06 (±3%) solo mentre l'effetto è attivo: la deriva max
        // 2.5% non scopre mai i bordi; touch/reduced-motion restano identici.
        gsap.set(imgWrap, { scale: 1.06, willChange: "transform" });
        const xTo = gsap.quickTo(imgWrap, "xPercent", { duration: dur.short, ease: "power3.out" });
        const yTo = gsap.quickTo(imgWrap, "yPercent", { duration: dur.short, ease: "power3.out" });

        const onMove = (e: PointerEvent) => {
          const r = wrap.getBoundingClientRect();
          xTo(gsap.utils.clamp(-1, 1, ((e.clientX - r.left) / r.width) * 2 - 1) * 2.5);
          yTo(gsap.utils.clamp(-1, 1, ((e.clientY - r.top) / r.height) * 2 - 1) * 2.5);
        };
        const onLeave = () => {
          // ritorno morbido al centro (stessa molla dei quickTo)
          xTo(0);
          yTo(0);
        };

        wrap.addEventListener("pointermove", onMove);
        wrap.addEventListener("pointerleave", onLeave);
        return () => {
          wrap.removeEventListener("pointermove", onMove);
          wrap.removeEventListener("pointerleave", onLeave);
          gsap.set(imgWrap, { clearProps: "all" });
        };
      });
    },
    { scope: wrapRef, dependencies: [i] }
  );

  return (
    <div ref={wrapRef} id={p.id} className="h-full">
      {/* Regola Chanel (fase 6): la controparallasse è stata tolta — con
          ingresso laterale, sipario, deriva puntatore e layer WebGL la card
          aveva un layer di movimento di troppo. */}
      <article className="group h-full rounded-[2rem] border border-line bg-cream p-2 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]">
        <a href={p.href} data-cursor="scopri" className="group/cta">
        {/* Sipario dal lato del percorso: il pill scivola fuori da dietro la maschera. */}
        <MaskReveal
          from={i === 0 ? "left" : "right"}
          zoom={1.14}
          delay={i * 0.12}
          className="relative aspect-[16/10] overflow-hidden rounded-[calc(2rem-0.5rem)]"
          innerClassName="absolute inset-0"
        >
          {/* Wrapper della deriva puntatore: solo l'immagine, il pill resta
              fermo. NIENTE HoverDistort qui: la distorsione liquida su foto
              con persone reali (feedback cliente) deforma i volti — l'effetto
              resta disponibile solo per immagini senza persone. */}
          <div ref={imgWrapRef} className="absolute inset-0">
            <Image
              src={p.image}
              alt={t.alt}
              fill
              sizes="(max-width: 1024px) 100vw, 600px"
              className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
            />
          </div>
          <span className="absolute left-4 top-4 rounded-full bg-paper/95 px-3.5 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-graphite shadow-[0_4px_14px_-6px_rgba(26,24,22,0.5)]">
            {t.tag}
          </span>
        </MaskReveal>

        <div className="px-5 pb-6 pt-7 sm:px-7">
          <h3 className="font-display text-[1.7rem] font-medium leading-[1.1] tracking-tight text-ink balance sm:text-[2rem]">
            {t.title}
          </h3>
          <p className="mt-4 text-[0.98rem] leading-relaxed text-stone">{t.copy}</p>

          <ul className="mt-6 flex flex-col gap-3">
            {t.points.map((pt) => (
              <li key={pt} className="flex items-start gap-3 text-[0.92rem] text-graphite">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-soft text-red-dark">
                  <Check className="h-3 w-3" />
                </span>
                {pt}
              </li>
            ))}
          </ul>

          <span className="dt-btn dt-btn--cta mt-8 self-start">
            <span className="dt-btn__label">{t.cta}</span>
            <span className="dt-btn__arr" aria-hidden>
              <ArrowUpRight />
              <ArrowUpRight />
            </span>
            <span className="dt-btn__fill" aria-hidden />
          </span>
        </div>
        </a>
      </article>
    </div>
  );
}

export default function Paths() {
  const { locale } = useLocale();
  const c = copy[locale];

  return (
    <section className="relative bg-paper">
      {/* Aria: bagliori lenti dietro le due card */}
      <Atmosphere glow />
      <div className="relative mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
        {/* Eyebrow nel Reveal, titolo TextLines nudo (niente doppio-hide) */}
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <span className="eyebrow eyebrow--center justify-center">{c.eyebrow}</span>
          </Reveal>
          <TextLines
            as="h2"
            className="mt-5 font-display text-4xl font-medium leading-[1.05] tracking-tight text-ink balance sm:text-5xl"
          >
            {c.heading}
          </TextLines>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {paths.map((p, i) => (
            <PathCard key={p.id} p={p} i={i} t={c.paths[p.id]} />
          ))}
        </div>
      </div>
    </section>
  );
}
