"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import PageHero from "../components/PageHero";
import Highlights from "../components/Highlights";
import Stats from "../components/Stats";
import Team from "../components/Team";
import Reveal from "../components/Reveal";
import Contact from "../components/Contact";
import SectionDivider from "../components/SectionDivider";
import { useLocale } from "../components/i18n/LocaleProvider";

const copy = {
  it: {
    heroEyebrow: "Chi siamo",
    heroTitle: (): ReactNode => (
      <>
        Persone prima
        <br />
        <span className="text-red-soft">degli immobili.</span>
      </>
    ),
    heroSubcopy:
      "Dietro ogni casa c'è una storia. Dietro ogni percorso Domus Tua c'è un team che ascolta, guida e accompagna, dalla prima telefonata fino alla firma.",
    heroAlt: "Attico luminoso con travi a vista",
    heroPrimary: "Conosciamoci",
    heroSecondary: "Il team",
    storiaImageAlt: "Raffaela Rizza con una cliente nella sede Domus Tua di Tradate",
    storiaEyebrow: "La nostra storia",
    storiaTitle: (year: number) => `Tutto è nato nel ${year}, a Tradate.`,
    storiaP1:
      "Domus Tua nasce dalla visione di Raffaela Rizza: un’agenzia immobiliare indipendente dove la compravendita non è una transazione, ma un passaggio importante nella vita delle persone.",
    storiaP2:
      "In oltre quindici anni abbiamo costruito un metodo che unisce cura, documenti, marketing e tecnologia. Restando però fedeli a ciò che conta di più: l’ascolto e la fiducia.",
    valoriEyebrow: "I nostri valori",
    valoriTitle: "Tre parole che non sono slogan, ma pratica quotidiana.",
    valori: [
      {
        title: "Professionalità",
        copy: "Competenza, metodo e rigore in ogni fase, dalla valutazione al rogito.",
      },
      {
        title: "Innovazione",
        copy: "Rendering, video, marketing e strumenti digitali al servizio del risultato.",
      },
      {
        title: "Integrità",
        copy: "Trasparenza totale e rispetto delle persone, sempre. Anche quando è più difficile.",
      },
    ],
  },
  en: {
    heroEyebrow: "About us",
    heroTitle: (): ReactNode => (
      <>
        People before
        <br />
        <span className="text-red-soft">properties.</span>
      </>
    ),
    heroSubcopy:
      "Behind every home there is a story. Behind every Domus Tua journey there is a team that listens, guides and accompanies you, from the first phone call to the signing.",
    heroAlt: "Bright penthouse with exposed beams",
    heroPrimary: "Let’s get to know each other",
    heroSecondary: "The team",
    storiaImageAlt: "Raffaela Rizza with a client at the Domus Tua office in Tradate",
    storiaEyebrow: "Our story",
    storiaTitle: (year: number) => `It all began in ${year}, in Tradate.`,
    storiaP1:
      "Domus Tua was born from Raffaela Rizza’s vision: an independent real-estate agency where buying and selling is not a transaction, but an important step in people’s lives.",
    storiaP2:
      "Over more than fifteen years we have built a method that combines care, paperwork, marketing and technology. While remaining faithful to what matters most: listening and trust.",
    valoriEyebrow: "Our values",
    valoriTitle: "Three words that are not slogans, but daily practice.",
    valori: [
      {
        title: "Professionalism",
        copy: "Expertise, method and rigour at every stage, from valuation to the deed of sale.",
      },
      {
        title: "Innovation",
        copy: "Renderings, video, marketing and digital tools at the service of the result.",
      },
      {
        title: "Integrity",
        copy: "Total transparency and respect for people, always. Even when it is harder.",
      },
    ],
  },
  fr: {
    heroEyebrow: "Qui sommes-nous",
    heroTitle: (): ReactNode => (
      <>
        Les personnes avant
        <br />
        <span className="text-red-soft">les biens.</span>
      </>
    ),
    heroSubcopy:
      "Derrière chaque maison, il y a une histoire. Derrière chaque parcours Domus Tua, il y a une équipe qui écoute, guide et accompagne, du premier appel jusqu’à la signature.",
    heroAlt: "Attique lumineux avec poutres apparentes",
    heroPrimary: "Faisons connaissance",
    heroSecondary: "L’équipe",
    storiaImageAlt: "Raffaela Rizza avec une cliente à l’agence Domus Tua de Tradate",
    storiaEyebrow: "Notre histoire",
    storiaTitle: (year: number) => `Tout a commencé en ${year}, à Tradate.`,
    storiaP1:
      "Domus Tua est née de la vision de Raffaela Rizza : une agence immobilière indépendante où la vente n’est pas une transaction, mais une étape importante dans la vie des personnes.",
    storiaP2:
      "En plus de quinze ans, nous avons bâti une méthode qui allie soin, documents, marketing et technologie. Tout en restant fidèles à ce qui compte le plus : l’écoute et la confiance.",
    valoriEyebrow: "Nos valeurs",
    valoriTitle: "Trois mots qui ne sont pas des slogans, mais une pratique quotidienne.",
    valori: [
      {
        title: "Professionnalisme",
        copy: "Compétence, méthode et rigueur à chaque étape, de l’estimation à l’acte de vente.",
      },
      {
        title: "Innovation",
        copy: "Rendus, vidéos, marketing et outils numériques au service du résultat.",
      },
      {
        title: "Intégrité",
        copy: "Transparence totale et respect des personnes, toujours. Même quand c’est plus difficile.",
      },
    ],
  },
  de: {
    heroEyebrow: "Über uns",
    heroTitle: (): ReactNode => (
      <>
        Menschen vor
        <br />
        <span className="text-red-soft">Immobilien.</span>
      </>
    ),
    heroSubcopy:
      "Hinter jedem Zuhause steht eine Geschichte. Hinter jedem Weg mit Domus Tua steht ein Team, das zuhört, berät und begleitet, vom ersten Anruf bis zur Unterschrift.",
    heroAlt: "Helles Penthouse mit sichtbaren Balken",
    heroPrimary: "Lernen wir uns kennen",
    heroSecondary: "Das Team",
    storiaImageAlt: "Raffaela Rizza mit einer Kundin im Domus Tua Büro in Tradate",
    storiaEyebrow: "Unsere Geschichte",
    storiaTitle: (year: number) => `Alles begann ${year} in Tradate.`,
    storiaP1:
      "Domus Tua entstand aus der Vision von Raffaela Rizza: eine unabhängige Immobilienagentur, in der Kauf und Verkauf keine Transaktion sind, sondern ein wichtiger Schritt im Leben der Menschen.",
    storiaP2:
      "In mehr als fünfzehn Jahren haben wir eine Methode aufgebaut, die Sorgfalt, Unterlagen, Marketing und Technologie vereint. Und dabei dem treu geblieben, was am meisten zählt: dem Zuhören und dem Vertrauen.",
    valoriEyebrow: "Unsere Werte",
    valoriTitle: "Drei Worte, die keine Slogans sind, sondern gelebte Praxis.",
    valori: [
      {
        title: "Professionalität",
        copy: "Kompetenz, Methode und Sorgfalt in jeder Phase, von der Bewertung bis zum Notartermin.",
      },
      {
        title: "Innovation",
        copy: "Renderings, Videos, Marketing und digitale Werkzeuge im Dienst des Ergebnisses.",
      },
      {
        title: "Integrität",
        copy: "Vollständige Transparenz und Respekt gegenüber den Menschen, immer. Auch wenn es schwerer fällt.",
      },
    ],
  },
  es: {
    heroEyebrow: "Quiénes somos",
    heroTitle: (): ReactNode => (
      <>
        Las personas antes
        <br />
        <span className="text-red-soft">que los inmuebles.</span>
      </>
    ),
    heroSubcopy:
      "Detrás de cada casa hay una historia. Detrás de cada recorrido con Domus Tua hay un equipo que escucha, guía y acompaña, desde la primera llamada hasta la firma.",
    heroAlt: "Ático luminoso con vigas a la vista",
    heroPrimary: "Conozcámonos",
    heroSecondary: "El equipo",
    storiaImageAlt: "Raffaela Rizza con una clienta en la oficina de Domus Tua en Tradate",
    storiaEyebrow: "Nuestra historia",
    storiaTitle: (year: number) => `Todo comenzó en ${year}, en Tradate.`,
    storiaP1:
      "Domus Tua nace de la visión de Raffaela Rizza: una agencia inmobiliaria independiente donde comprar y vender no es una transacción, sino un paso importante en la vida de las personas.",
    storiaP2:
      "En más de quince años hemos construido un método que une cuidado, documentos, marketing y tecnología. Manteniéndonos fieles a lo que más importa: la escucha y la confianza.",
    valoriEyebrow: "Nuestros valores",
    valoriTitle: "Tres palabras que no son eslóganes, sino práctica diaria.",
    valori: [
      {
        title: "Profesionalidad",
        copy: "Competencia, método y rigor en cada fase, desde la valoración hasta la escritura.",
      },
      {
        title: "Innovación",
        copy: "Renders, vídeo, marketing y herramientas digitales al servicio del resultado.",
      },
      {
        title: "Integridad",
        copy: "Transparencia total y respeto por las personas, siempre. Incluso cuando es más difícil.",
      },
    ],
  },
};

export default function ChiSiamoContent({ since }: { since: number }) {
  const { locale } = useLocale();
  const c = copy[locale];

  return (
    <main className="flex-1">
      <PageHero
        eyebrow={c.heroEyebrow}
        title={c.heroTitle()}
        subcopy={c.heroSubcopy}
        image="/images/hero_01_attico_travi_salotto.jpg"
        alt={c.heroAlt}
        primary={{ label: c.heroPrimary, href: "#contatti" }}
        secondary={{ label: c.heroSecondary, href: "#chi-siamo" }}
      />

      {/* Storia */}
      <section className="bg-paper">
        <div className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <div className="relative aspect-[5/4] overflow-hidden rounded-[2rem] border border-line">
                <Image
                  src="/images/reali/open-domus-teresa.jpg"
                  alt={c.storiaImageAlt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 560px"
                  className="object-cover object-center"
                />
              </div>
            </Reveal>
            <Reveal delay={100}>
              <span className="eyebrow">{c.storiaEyebrow}</span>
              <h2 className="mt-5 font-display text-4xl font-medium leading-[1.05] tracking-tight text-ink balance sm:text-[3rem]">
                {c.storiaTitle(since)}
              </h2>
              <div className="mt-6 flex flex-col gap-4 text-[1.02rem] leading-relaxed text-stone">
                <p>{c.storiaP1}</p>
                <p>{c.storiaP2}</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <Highlights
        tone="cream"
        eyebrow={c.valoriEyebrow}
        title={c.valoriTitle}
        items={c.valori}
      />

      <Stats />
      <Team />
      <div className="bg-cream-deep">
        <SectionDivider tone="cream-deep" />
      </div>
      <Contact />
    </main>
  );
}
