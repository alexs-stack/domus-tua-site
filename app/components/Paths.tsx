"use client";

// Paths — "Due percorsi, un solo metodo", riscritto piano il 2026-09-10
// (rivista bianca, rif. immobiliaregoldengoal.it): un capitolo su fondo
// avorio, titolo grande, poi due righe editoriali — Vendere / Acquistare —
// con la foto quadrata da un lato e titolo, lead, punti e link sottolineato
// dall'altro. Via i pannelli scuri pinnati, i sipari in clip-path, gli
// scrim, i veli e i fiori. Movimento dal 13 settembre (A20 di Alberto, spec
// §3.8): le due colonne di ogni riga vanno in controfase, ±10 % da 1024 px e
// pochi pixel sotto, con la sosta di dtSosta quando la riga passa al centro;
// i testi coi ruoli del motore; con reduced-motion tutto fermo e visibile.
//
// 2026-09-11 — la riga era `lg:grid-cols-2` ma la foto era un `aspect-square`
// grande quanto la colonna: cambiava larghezza a ogni breakpoint e non
// tornava mai su una linea nota. Ora è il modulo condiviso `dt-media-half`
// (42vw, max 640 px, 1:1) dentro il template a due colonne: due linee
// verticali in tutto il capitolo, la stessa x del Metodo.
import { useRef } from "react";
import Image from "next/image";
import { Cta } from "./primitives/Cta";
import { useLocale } from "./i18n/LocaleProvider";
import Reveal from "./Reveal";
import SplitTitle from "./motion/SplitTitle";
import Lead from "./motion/Lead";
import { gsap, useGSAP } from "../lib/motion/gsap";
import { MQ } from "../lib/motion/mq";
import { chapters } from "../lib/motion/chapters";

// Fotografie reali, ognuna una volta sola in home: la consulenza resta a
// Posizionamento; qui la fondatrice (ritaglio 1:1 spostato a sinistra, dove
// sta lei) e la villa con piscina.
// `ratio` è la misura VERA del sorgente, e serve a due cose: dice che il
// quadrato è il taglio giusto (2560×1920 e 1920×1280 sono riprese piene, la
// scatola le riduce a 0,32× e 0,47× — nessun ingrandimento, e la persona in
// piedi resta intera in altezza) e alimenta `coverSizes`.
const paths: { id: "vendi" | "acquista"; href: string; image: string; ratio: number; pos?: string }[] = [
  {
    id: "vendi",
    href: "/vendi",
    image: "/images/reali/raffaela-specchio-profilo.jpg",
    ratio: 2560 / 1920,
    pos: "24% 50%",
  },
  {
    id: "acquista",
    href: "/acquista",
    image: "/images/reali/villa-pool.jpg",
    ratio: 1920 / 1280,
  },
];

/* In un quadrato una foto orizzontale è larga scatola × rapporto: un piatto
   45vw serviva alla villa i due terzi dei pixel che il cover le chiede. */
const coverSizes = (ratio: number) =>
  `(max-width:767px) ${Math.ceil(90 * ratio)}vw, (max-width:1023px) ${Math.ceil(84 * ratio)}vw, ${Math.ceil(42 * ratio)}vw`;

const copy = {
  it: {
    eyebrow: "Due percorsi, un solo metodo",
    heading: "Che tu venda o acquisti, il nostro lavoro è proteggere le tue scelte.",
    introAlt: "Il team Domus Tua nella sede di Tradate",
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
        cta: "Richiedi la valutazione",
        alt: "Raffaela Rizza, fondatrice di Domus Tua, in un soggiorno arredato",
      },
      acquista: {
        tag: "Per chi acquista",
        title: "Acquista casa con più risposte e meno dubbi.",
        copy: "Organizziamo le visite, controlliamo la documentazione e ti assistiamo sulla proposta, fino al rogito.",
        points: [
          "Informazioni chiare già prima della visita",
          "Documentazione verificata e trasparente",
          "Supporto su proposta, compromesso e rogito",
        ],
        cta: "Cerco casa",
        alt: "Villa con piscina seguita da Domus Tua",
      },
    },
  },
  en: {
    eyebrow: "Two paths, one method",
    heading: "Whether you sell or buy, our job is to protect your choices.",
    introAlt: "The Domus Tua team at the Tradate office",
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
        cta: "Request a valuation",
        alt: "Raffaela Rizza, founder of Domus Tua, in a furnished living room",
      },
      acquista: {
        tag: "For those buying",
        title: "Buy your home with more answers and fewer doubts.",
        copy: "We organise the viewings, check the paperwork and assist you on the offer, through to the deed.",
        points: [
          "Clear information even before the viewing",
          "Verified and transparent documentation",
          "Support with offer, preliminary contract and closing",
        ],
        cta: "I’m looking for a home",
        alt: "Villa with pool listed by Domus Tua",
      },
    },
  },
  fr: {
    eyebrow: "Deux parcours, une seule méthode",
    heading: "Que vous vendiez ou achetiez, notre métier est de protéger vos choix.",
    introAlt: "L'équipe Domus Tua dans l'agence de Tradate",
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
        cta: "Demander l’estimation",
        alt: "Raffaela Rizza, fondatrice de Domus Tua, dans un séjour meublé",
      },
      acquista: {
        tag: "Pour ceux qui achètent",
        title: "Achetez votre bien avec plus de réponses et moins de doutes.",
        copy: "Nous organisons les visites, contrôlons les documents et vous assistons sur l'offre, jusqu'à la signature.",
        points: [
          "Des informations claires dès avant la visite",
          "Une documentation vérifiée et transparente",
          "Un accompagnement pour l'offre, le compromis et la signature",
        ],
        cta: "Je cherche un bien",
        alt: "Villa avec piscine proposée par Domus Tua",
      },
    },
  },
  de: {
    eyebrow: "Zwei Wege, eine Methode",
    heading: "Ob Sie verkaufen oder kaufen: Unsere Aufgabe ist es, Ihre Entscheidungen zu schützen.",
    introAlt: "Das Domus Tua Team im Büro in Tradate",
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
        cta: "Bewertung anfordern",
        alt: "Raffaela Rizza, Gründerin von Domus Tua, in einem eingerichteten Wohnzimmer",
      },
      acquista: {
        tag: "Für Käufer",
        title: "Kaufen Sie Ihre Immobilie mit mehr Antworten und weniger Zweifeln.",
        copy: "Wir organisieren die Besichtigungen, prüfen die Unterlagen und unterstützen Sie beim Angebot, bis zum Notartermin.",
        points: [
          "Klare Informationen schon vor der Besichtigung",
          "Geprüfte und transparente Unterlagen",
          "Unterstützung bei Angebot, Vorvertrag und Notartermin",
        ],
        cta: "Ich suche ein Zuhause",
        alt: "Villa mit Pool im Angebot von Domus Tua",
      },
    },
  },
  es: {
    eyebrow: "Dos recorridos, un solo método",
    heading: "Tanto si vendes como si compras, nuestro trabajo es proteger tus decisiones.",
    introAlt: "El equipo Domus Tua en la oficina de Tradate",
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
        cta: "Solicita la valoración",
        alt: "Raffaela Rizza, fundadora de Domus Tua, en un salón amueblado",
      },
      acquista: {
        tag: "Para quien compra",
        title: "Compra tu casa con más respuestas y menos dudas.",
        copy: "Organizamos las visitas, comprobamos la documentación y te asistimos en la oferta, hasta la firma.",
        points: [
          "Información clara ya antes de la visita",
          "Documentación verificada y transparente",
          "Apoyo en la oferta, el contrato preliminar y la firma",
        ],
        cta: "Busco casa",
        alt: "Villa con piscina ofrecida por Domus Tua",
      },
    },
  },
} as const;

export default function Paths() {
  const { locale } = useLocale();
  const c = copy[locale];
  const sectionRef = useRef<HTMLElement | null>(null);

  // Il gesto del capitolo 7 (A20 di Alberto, spec §3.8): trigger la RIGA, che
  // non si muove mai, così ScrollTrigger non misura una colonna già spostata.
  // Da 1024 px la colonna che sta a sinistra (letta da offsetLeft: in #acquista
  // la foto ha lg:order-2) va da −10 a +10 %, quella a destra al contrario.
  // Sotto, colonne impilate: corsa in px A = floor(gap/2) − 1, così foto e testo
  // non si toccano (22 px a 768, 10 a 390). Ease, scrub e range da chapters.ts.
  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;
      const { signature } = chapters.paths;
      const { time, trigger } = signature;
      if (!("scrub" in time) || !("st" in trigger)) {
        throw new Error("chapters.paths: attesa una firma a scrub con start ed end");
      }
      const scrub = time.scrub;
      const [start, end] = trigger.st;
      const ease = signature.ease;
      const mm = gsap.matchMedia();
      mm.add({ motionOk: MQ.motionOk, lg: MQ.lg }, (ctx) => {
        const { motionOk, lg } = ctx.conditions as { motionOk: boolean; lg: boolean };
        if (!motionOk) return;
        gsap.utils.toArray<HTMLElement>("[data-paths-row]", section).forEach((row) => {
          const cols = gsap.utils.toArray<HTMLElement>("[data-paths-col]", row);
          if (cols.length !== 2) return;
          const st = () => ({ trigger: row, start, end, scrub, invalidateOnRefresh: true });
          if (lg) {
            const [left, right] = cols[0].offsetLeft <= cols[1].offsetLeft ? [cols[0], cols[1]] : [cols[1], cols[0]];
            gsap.fromTo(left, { yPercent: -10 }, { yPercent: 10, ease, scrollTrigger: st() });
            gsap.fromTo(right, { yPercent: 10 }, { yPercent: -10, ease, scrollTrigger: st() });
            return;
          }
          const amp = () => Math.max(0, Math.floor(Number.parseFloat(getComputedStyle(row).rowGap) / 2) - 1);
          gsap.fromTo(cols[0], { y: () => -amp() }, { y: () => amp(), ease, scrollTrigger: st() });
          gsap.fromTo(cols[1], { y: () => amp() }, { y: () => -amp(), ease, scrollTrigger: st() });
        });
      });
    },
    { scope: sectionRef, dependencies: [locale], revertOnUpdate: true }
  );

  return (
    <section ref={sectionRef} className="dt-chapter bg-cream">
      <div className="dt-row">
        <Reveal>
          <span className="eyebrow">{c.eyebrow}</span>
        </Reveal>
        <SplitTitle as="h2" className="mt-6 max-w-[26ch] font-display text-d2">
          {c.heading}
        </SplitTitle>
      </div>

      {/* Le due righe: foto a sinistra per Vendere, a destra per Acquistare. */}
      {paths.map((p, i) => {
        const t = c.paths[p.id];
        return (
          <div
            key={p.href}
            id={p.id}
            data-paths-row
            className="dt-row mt-[clamp(4rem,10vh,8rem)] grid gap-[6vw] lg:grid-cols-2 lg:items-center"
          >
            {/* La riga pari specchia: foto a destra e `justify-self-end`, perché
                il modulo (42vw) è più largo della colonna (39vw) e senza
                l'ancoraggio sborderebbe oltre il margine destro della pagina. */}
            <div data-paths-col className={i % 2 ? "lg:order-2 lg:justify-self-end" : ""}>
              <div className="dt-media-half">
                <Image
                  src={p.image}
                  alt={t.alt}
                  fill
                  sizes={coverSizes(p.ratio)}
                  className="object-cover"
                  style={{ objectPosition: p.pos }}
                />
              </div>
            </div>
            <div data-paths-col className={i % 2 ? "lg:pr-[6vw]" : "lg:pl-[6vw]"}>
              <SplitTitle as="h3" className="font-display text-d3">
                {t.title}
              </SplitTitle>
              <Lead className="mt-6">{t.copy}</Lead>
              <ul className="mt-6 flex flex-col gap-2 text-body">
                {t.points.map((pt) => (
                  <li key={pt} className="flex gap-3">
                    <span aria-hidden className="mt-3 h-px w-8 shrink-0 bg-red" />
                    {pt}
                  </li>
                ))}
              </ul>
              <Reveal delay={100}>
                <Cta href={p.href} variant="ghost" className="mt-8">
                  {t.cta}
                </Cta>
              </Reveal>
            </div>
          </div>
        );
      })}
    </section>
  );
}
