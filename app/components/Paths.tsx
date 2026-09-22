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
import LamaMedia from "./motion/LamaMedia";
import SplitTitle from "./motion/SplitTitle";
import { gsap, useGSAP } from "../lib/motion/gsap";
import { MQ } from "../lib/motion/mq";
import { chapters } from "../lib/motion/chapters";

// Fotografie, ognuna una volta sola in home: la consulenza resta a
// Posizionamento; qui la fondatrice (ritaglio 1:1 spostato a sinistra, dove
// sta lei) e, dal 22 set. 2026 (A55 di Alberto: «vorrei invertire le posizioni
// di questa immagine con quella della hero»), la scena AMPIA generata con
// Higgsfield col ritaglio vero di Raffaela (`hero-raffaela-villa.jpg`,
// 2560×1717, foto-alte.mjs), che era l'hero della home: la foto vera della
// piscina (`villa-pool.jpg`) è salita all'hero (media.ts, hero-piscina.mjs).
// `ratio` è la misura VERA del sorgente, e serve a due cose: dice qual e' la
// scatola giusta e alimenta `coverSizes`. La fondatrice (2560×1920, 4:3) sta
// nel quadrato: perde il 25 % ai lati, la persona in piedi resta intera in
// altezza, ridotta a 0,32×. La scena 3:2 NON sta nel quadrato (la villa di
// prima ne perdeva un terzo in larghezza); dal 2026-09-20 la seconda riga sta
// nella meta' forzata a 16:9 (`box: "video"`, come gli atti del Metodo), dove
// la scena perde il 16 % in altezza — dal soffitto: `pos` la ancora in basso,
// così Raffaela resta intera coi piedi sul bordo (A27) — e la riga si
// accorcia di 265 px a 1440 (Alberto: «riducendo la distanza tra una foto e
// un testo»). La scatola segue il sorgente, non la griglia (D03).
const paths: {
  id: "vendi" | "acquista";
  href: string;
  image: string;
  ratio: number;
  box: "square" | "video";
  pos?: string;
}[] = [
  {
    id: "vendi",
    href: "/vendi",
    image: "/images/reali/raffaela-specchio-profilo.jpg",
    ratio: 2560 / 1920,
    box: "square",
    pos: "24% 50%",
  },
  {
    id: "acquista",
    href: "/acquista",
    image: "/media/hero-raffaela-villa.jpg",
    ratio: 2560 / 1717,
    box: "video",
    pos: "50% 100%",
  },
];

/* `sizes` descrive i pixel RESI dopo il cover, non la scatola: in un quadrato
   una foto orizzontale e' larga scatola × rapporto; in una 16:9 sborda solo
   se e' piu' larga di 16:9 (D04). */
const BOX_ASPECT = { square: 1, video: 16 / 9 } as const;
const coverSizes = (ratio: number, box: keyof typeof BOX_ASPECT) => {
  const k = Math.max(1, ratio / BOX_ASPECT[box]);
  return `(max-width:767px) ${Math.ceil(90 * k)}vw, (max-width:1023px) ${Math.ceil(84 * k)}vw, ${Math.ceil(42 * k)}vw`;
};

const copy = {
  it: {
    eyebrow: "Due percorsi, un solo metodo",
    heading: "Che tu venda o acquisti, il nostro lavoro è proteggere le tue scelte.",
    introAlt: "Il team Domus Tua nella sede di Tradate",
    paths: {
      vendi: {
        tag: "Per chi vende",
        title: "Vendi casa con metodo, non con improvvisazione.",
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
        points: [
          "Informazioni chiare già prima della visita",
          "Documentazione verificata e trasparente",
          "Supporto su proposta, compromesso e rogito",
        ],
        cta: "Cerco casa",
        alt: "Raffaela Rizza presenta il soggiorno luminoso di una villa con piscina proposta da Domus Tua",
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
        points: [
          "Clear information even before the viewing",
          "Verified and transparent documentation",
          "Support with offer, preliminary contract and closing",
        ],
        cta: "I’m looking for a home",
        alt: "Raffaela Rizza presenting the bright living room of a villa with a pool offered by Domus Tua",
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
        points: [
          "Des informations claires dès avant la visite",
          "Une documentation vérifiée et transparente",
          "Un accompagnement pour l'offre, le compromis et la signature",
        ],
        cta: "Je cherche un bien",
        alt: "Raffaela Rizza présente le séjour lumineux d'une villa avec piscine proposée par Domus Tua",
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
        points: [
          "Klare Informationen schon vor der Besichtigung",
          "Geprüfte und transparente Unterlagen",
          "Unterstützung bei Angebot, Vorvertrag und Notartermin",
        ],
        cta: "Ich suche ein Zuhause",
        alt: "Raffaela Rizza präsentiert das helle Wohnzimmer einer Villa mit Pool im Angebot von Domus Tua",
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
        points: [
          "Información clara ya antes de la visita",
          "Documentación verificada y transparente",
          "Apoyo en la oferta, el contrato preliminar y la firma",
        ],
        cta: "Busco casa",
        alt: "Raffaela Rizza presenta el salón luminoso de una villa con piscina ofrecida por Domus Tua",
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
            className="dt-row mt-[clamp(2.5rem,6vh,4.5rem)] grid gap-[6vw] lg:grid-cols-2 lg:items-center"
          >
            {/* La riga pari specchia: foto a destra e `justify-self-end`, perché
                il modulo (42vw) è più largo della colonna (39vw) e senza
                l'ancoraggio sborderebbe oltre il margine destro della pagina. */}
            <div data-paths-col className={i % 2 ? "lg:order-2 lg:justify-self-end" : ""}>
              {/* La lama (A36, D200-D204): le due foto entrano DA SINISTRA, con
                  l'inclinazione opposta a Voci che precede (A28 (10): «non 2
                  di fila»); il profilo scivola di 3 (margine sinistro dei corpi
                  3,3 %: 18 px a 1440, deciso col numero, D203), la villa di 10.
                  Due gruppi, uno per riga: il collegamento «da su a giù» fra le
                  due righe lo colloca Alberto (D204). Il tween di capitolo resta
                  sulla colonna [data-paths-col]; la lama sta dentro, sul modulo:
                  un tween per elemento (D216). */}
              <LamaMedia
                id={p.id === "vendi" ? "paths-vendi" : "paths-acquista"}
                className={p.box === "video" ? "dt-media-half !aspect-video" : "dt-media-half"}
              >
                <Image
                  src={p.image}
                  alt={t.alt}
                  fill
                  sizes={coverSizes(p.ratio, p.box)}
                  className="object-cover"
                  style={{ objectPosition: p.pos }}
                />
              </LamaMedia>
            </div>
            <div data-paths-col className={i % 2 ? "lg:pr-[6vw]" : "lg:pl-[6vw]"}>
              <SplitTitle as="h3" className="font-display text-d3">
                {t.title}
              </SplitTitle>
              {/* Il lead di percorso («Valutiamo, prepariamo, raccontiamo e
                  promuoviamo…») non c'e' piu' (2026-09-20): i tre punti sotto
                  dicono le stesse cose, una per riga. */}
              <ul className="mt-8 flex flex-col gap-2 text-body">
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
