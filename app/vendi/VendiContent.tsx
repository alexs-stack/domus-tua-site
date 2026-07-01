"use client";

import type { ReactNode } from "react";
import { useLocale } from "../components/i18n/LocaleProvider";
import PageHero from "../components/PageHero";
import Highlights from "../components/Highlights";
import EditorialRows from "../components/EditorialRows";
import BeforeAfter from "../components/BeforeAfter";
import DomusDocProtocol from "../components/DomusDocProtocol";
import FeaturedTestimonial from "../components/FeaturedTestimonial";
import Reviews from "../components/Reviews";
import Contact from "../components/Contact";
import SectionDivider from "../components/SectionDivider";

type SellStep = {
  n: string;
  title: string;
  copy: string;
  image: string;
  alt: string;
};

type Copy = {
  hero: {
    eyebrow: string;
    title: () => ReactNode;
    subcopy: string;
    alt: string;
    primaryLabel: string;
    secondaryLabel: string;
    trust: string[];
  };
  highlights: {
    eyebrow: string;
    title: string;
    intro: string;
    items: { title: string; copy: string }[];
  };
  steps: {
    eyebrow: string;
    title: string;
    intro: string;
  };
  sellSteps: SellStep[];
};

const copy: Record<"it" | "en" | "fr" | "de" | "es", Copy> = {
  it: {
    hero: {
      eyebrow: "Per chi vende",
      title: () => (
        <>
          Vendere casa,
          <br />
          <span className="text-red-soft">senza stress.</span>
        </>
      ),
      subcopy:
        "Non mettiamo semplicemente online il tuo immobile. Lo prepariamo, lo raccontiamo e lo vendiamo con metodo, riducendo errori, tempi morti e incertezze.",
      alt: "Living luminoso con zona pranzo",
      primaryLabel: "Valuta il tuo immobile",
      secondaryLabel: "Come funziona",
      trust: [
        "Valutazione senza impegno",
        "Documenti verificati",
        "Assistenza fino al rogito",
      ],
    },
    highlights: {
      eyebrow: "Perché affidarti a noi",
      title: "Vendere da soli può costare caro. Con metodo, no.",
      intro:
        "Prezzo sbagliato, documenti incompleti e acquirenti non qualificati sono le tre trappole più comuni. Il metodo Domus Tua le trasforma in altrettanti punti di forza.",
      items: [
        {
          title: "Il valore giusto",
          copy: "Una valutazione professionale evita di svendere o di restare mesi sul mercato a prezzo fuori target.",
        },
        {
          title: "Documenti a posto",
          copy: "Verifichiamo tutto prima: niente sorprese che bloccano la trattativa o il rogito.",
        },
        {
          title: "Acquirenti giusti",
          copy: "Prequalifichiamo chi visita e gestiamo le proposte con trasparenza, tutelando i tuoi interessi.",
        },
      ],
    },
    steps: {
      eyebrow: "Il percorso di vendita",
      title: "Dalla prima stima alla firma, un passo alla volta.",
      intro:
        "Ogni vendita segue lo stesso metodo collaudato. Tu resti sempre informato, noi gestiamo la complessità.",
    },
    sellSteps: [
      {
        n: "01",
        title: "Valutazione e analisi di mercato",
        copy: "Partiamo dal valore reale del tuo immobile: analisi della zona, delle caratteristiche e della domanda, per definire prezzo e strategia senza illusioni e senza svendere.",
        image: "/images/hero_03_attico_dining_living.jpg",
        alt: "Attico luminoso con zona pranzo e living",
      },
      {
        n: "02",
        title: "Verifica documentale",
        copy: "Controlliamo conformità, titoli e documenti prima di mettere in vendita. Così arrivi alla trattativa e al rogito senza intoppi né brutte sorprese.",
        image: "/images/premium_04_living_libreria.jpg",
        alt: "Living elegante con libreria",
      },
      {
        n: "03",
        title: "Preparazione e home staging",
        copy: "Valorizziamo gli spazi con consigli mirati e, dove serve, home staging: la casa si presenta al meglio e attira più interesse, più in fretta.",
        image: "/images/home_staging_01_sala_reale_sedie_gialle.jpg",
        alt: "Sala preparata con home staging",
      },
      {
        n: "04",
        title: "Marketing e Open Domus",
        copy: "Foto, video, rendering e campagne multicanale raccontano la casa. L'evento Open Domus concentra acquirenti qualificati e accelera le proposte.",
        image: "/images/premium_05_living_accenti_senape.jpg",
        alt: "Living moderno con accenti color senape",
      },
    ],
  },
  en: {
    hero: {
      eyebrow: "For sellers",
      title: () => (
        <>
          Selling your home,
          <br />
          <span className="text-red-soft">stress-free.</span>
        </>
      ),
      subcopy:
        "We don’t simply list your property online. We prepare it, tell its story and sell it with a proven method, cutting out mistakes, wasted time and uncertainty.",
      alt: "Bright living area with dining space",
      primaryLabel: "Get your valuation",
      secondaryLabel: "How it works",
      trust: [
        "No-obligation valuation",
        "Verified documents",
        "Support through to completion",
      ],
    },
    highlights: {
      eyebrow: "Why entrust it to us",
      title: "Selling on your own can cost you dearly. With a method, it won’t.",
      intro:
        "The wrong price, incomplete paperwork and unqualified buyers are the three most common pitfalls. The Domus Tua method turns each of them into a genuine strength.",
      items: [
        {
          title: "The right value",
          copy: "A professional valuation keeps you from underselling or sitting on the market for months at an off-target price.",
        },
        {
          title: "Paperwork in order",
          copy: "We check everything upfront: no surprises that could stall the negotiation or the final deed.",
        },
        {
          title: "The right buyers",
          copy: "We pre-qualify every viewer and handle offers transparently, always protecting your interests.",
        },
      ],
    },
    steps: {
      eyebrow: "The selling journey",
      title: "From the first estimate to the signature, one step at a time.",
      intro:
        "Every sale follows the same tried-and-tested method. You stay informed throughout, while we handle the complexity.",
    },
    sellSteps: [
      {
        n: "01",
        title: "Valuation and market analysis",
        copy: "We start from your property’s true value: an analysis of the area, its features and demand, to set the price and strategy with no illusions and without underselling.",
        image: "/images/hero_03_attico_dining_living.jpg",
        alt: "Bright penthouse with dining and living area",
      },
      {
        n: "02",
        title: "Document verification",
        copy: "We check compliance, titles and documents before going to market. That way you reach the negotiation and the final deed with no hitches or unpleasant surprises.",
        image: "/images/premium_04_living_libreria.jpg",
        alt: "Elegant living room with a bookcase",
      },
      {
        n: "03",
        title: "Preparation and home staging",
        copy: "We enhance the spaces with targeted advice and, where needed, home staging: the home shows at its best and draws more interest, faster.",
        image: "/images/home_staging_01_sala_reale_sedie_gialle.jpg",
        alt: "Room prepared with home staging",
      },
      {
        n: "04",
        title: "Marketing and Open Domus",
        copy: "Photography, video, renderings and multichannel campaigns tell the home’s story. The Open Domus event brings together qualified buyers and speeds up offers.",
        image: "/images/premium_05_living_accenti_senape.jpg",
        alt: "Modern living room with mustard accents",
      },
    ],
  },
  fr: {
    hero: {
      eyebrow: "Pour les vendeurs",
      title: () => (
        <>
          Vendre son bien,
          <br />
          <span className="text-red-soft">sans stress.</span>
        </>
      ),
      subcopy:
        "Nous ne nous contentons pas de mettre votre bien en ligne. Nous le préparons, le mettons en valeur et le vendons avec méthode, en réduisant erreurs, temps morts et incertitudes.",
      alt: "Séjour lumineux avec coin repas",
      primaryLabel: "Estimez votre bien",
      secondaryLabel: "Comment ça marche",
      trust: [
        "Estimation sans engagement",
        "Documents vérifiés",
        "Accompagnement jusqu’à l’acte",
      ],
    },
    highlights: {
      eyebrow: "Pourquoi nous faire confiance",
      title: "Vendre seul peut coûter cher. Avec méthode, non.",
      intro:
        "Prix erroné, dossier incomplet et acquéreurs non qualifiés sont les trois pièges les plus courants. La méthode Domus Tua en fait autant d’atouts.",
      items: [
        {
          title: "La juste valeur",
          copy: "Une estimation professionnelle évite de brader ou de rester des mois sur le marché à un prix hors cible.",
        },
        {
          title: "Un dossier en règle",
          copy: "Nous vérifions tout en amont : aucune surprise susceptible de bloquer la négociation ou l’acte.",
        },
        {
          title: "Les bons acquéreurs",
          copy: "Nous préqualifions les visiteurs et gérons les offres en toute transparence, en protégeant vos intérêts.",
        },
      ],
    },
    steps: {
      eyebrow: "Le parcours de vente",
      title: "De la première estimation à la signature, une étape après l’autre.",
      intro:
        "Chaque vente suit la même méthode éprouvée. Vous restez toujours informé, nous gérons la complexité.",
    },
    sellSteps: [
      {
        n: "01",
        title: "Estimation et analyse de marché",
        copy: "Nous partons de la valeur réelle de votre bien : analyse du quartier, des caractéristiques et de la demande, pour définir prix et stratégie sans illusions et sans brader.",
        image: "/images/hero_03_attico_dining_living.jpg",
        alt: "Attique lumineux avec coin repas et séjour",
      },
      {
        n: "02",
        title: "Vérification documentaire",
        copy: "Nous contrôlons conformité, titres et documents avant la mise en vente. Vous arrivez ainsi à la négociation et à l’acte sans accroc ni mauvaise surprise.",
        image: "/images/premium_04_living_libreria.jpg",
        alt: "Séjour élégant avec bibliothèque",
      },
      {
        n: "03",
        title: "Préparation et home staging",
        copy: "Nous valorisons les espaces par des conseils ciblés et, si besoin, du home staging : le bien se présente sous son meilleur jour et suscite plus d’intérêt, plus vite.",
        image: "/images/home_staging_01_sala_reale_sedie_gialle.jpg",
        alt: "Pièce préparée avec home staging",
      },
      {
        n: "04",
        title: "Marketing et Open Domus",
        copy: "Photos, vidéos, rendus et campagnes multicanales racontent le bien. L’événement Open Domus réunit des acquéreurs qualifiés et accélère les offres.",
        image: "/images/premium_05_living_accenti_senape.jpg",
        alt: "Séjour moderne aux accents moutarde",
      },
    ],
  },
  de: {
    hero: {
      eyebrow: "Für Verkäufer",
      title: () => (
        <>
          Ihr Zuhause verkaufen,
          <br />
          <span className="text-red-soft">ganz entspannt.</span>
        </>
      ),
      subcopy:
        "Wir stellen Ihre Immobilie nicht einfach online. Wir bereiten sie auf, erzählen ihre Geschichte und verkaufen sie mit Methode – und reduzieren so Fehler, Leerlauf und Unsicherheiten.",
      alt: "Helles Wohnzimmer mit Essbereich",
      primaryLabel: "Immobilie bewerten lassen",
      secondaryLabel: "So funktioniert es",
      trust: [
        "Bewertung unverbindlich",
        "Geprüfte Unterlagen",
        "Begleitung bis zum Notartermin",
      ],
    },
    highlights: {
      eyebrow: "Warum Sie uns vertrauen können",
      title: "Allein zu verkaufen kann teuer werden. Mit Methode nicht.",
      intro:
        "Der falsche Preis, unvollständige Unterlagen und unqualifizierte Käufer sind die drei häufigsten Fallen. Die Domus-Tua-Methode macht aus jeder von ihnen eine echte Stärke.",
      items: [
        {
          title: "Der richtige Wert",
          copy: "Eine professionelle Bewertung verhindert, dass Sie unter Wert verkaufen oder monatelang zum falschen Preis am Markt bleiben.",
        },
        {
          title: "Unterlagen in Ordnung",
          copy: "Wir prüfen alles vorab: keine Überraschungen, die die Verhandlung oder den Notartermin blockieren.",
        },
        {
          title: "Die richtigen Käufer",
          copy: "Wir qualifizieren jeden Interessenten vor und behandeln Angebote transparent – stets zum Schutz Ihrer Interessen.",
        },
      ],
    },
    steps: {
      eyebrow: "Der Verkaufsweg",
      title: "Von der ersten Schätzung bis zur Unterschrift, Schritt für Schritt.",
      intro:
        "Jeder Verkauf folgt derselben bewährten Methode. Sie bleiben stets informiert, wir übernehmen die Komplexität.",
    },
    sellSteps: [
      {
        n: "01",
        title: "Bewertung und Marktanalyse",
        copy: "Wir gehen vom tatsächlichen Wert Ihrer Immobilie aus: Analyse der Lage, der Merkmale und der Nachfrage, um Preis und Strategie ohne Illusionen und ohne Verschleudern festzulegen.",
        image: "/images/hero_03_attico_dining_living.jpg",
        alt: "Helles Penthouse mit Ess- und Wohnbereich",
      },
      {
        n: "02",
        title: "Prüfung der Unterlagen",
        copy: "Wir prüfen Konformität, Rechtstitel und Dokumente vor dem Verkaufsstart. So erreichen Sie Verhandlung und Notartermin ohne Hürden und böse Überraschungen.",
        image: "/images/premium_04_living_libreria.jpg",
        alt: "Elegantes Wohnzimmer mit Bücherregal",
      },
      {
        n: "03",
        title: "Vorbereitung und Home Staging",
        copy: "Wir werten die Räume mit gezielten Tipps und, wo nötig, Home Staging auf: Das Zuhause präsentiert sich von seiner besten Seite und weckt schneller mehr Interesse.",
        image: "/images/home_staging_01_sala_reale_sedie_gialle.jpg",
        alt: "Mit Home Staging vorbereiteter Raum",
      },
      {
        n: "04",
        title: "Marketing und Open Domus",
        copy: "Fotos, Videos, Renderings und Mehrkanal-Kampagnen erzählen die Geschichte der Immobilie. Das Open-Domus-Event bündelt qualifizierte Käufer und beschleunigt die Angebote.",
        image: "/images/premium_05_living_accenti_senape.jpg",
        alt: "Modernes Wohnzimmer mit senffarbenen Akzenten",
      },
    ],
  },
  es: {
    hero: {
      eyebrow: "Para quien vende",
      title: () => (
        <>
          Vender tu casa,
          <br />
          <span className="text-red-soft">sin estrés.</span>
        </>
      ),
      subcopy:
        "No nos limitamos a publicar tu inmueble en internet. Lo preparamos, lo presentamos y lo vendemos con método, reduciendo errores, tiempos muertos e incertidumbres.",
      alt: "Salón luminoso con zona de comedor",
      primaryLabel: "Valora tu inmueble",
      secondaryLabel: "Cómo funciona",
      trust: [
        "Valoración sin compromiso",
        "Documentos verificados",
        "Acompañamiento hasta la escritura",
      ],
    },
    highlights: {
      eyebrow: "Por qué confiar en nosotros",
      title: "Vender por tu cuenta puede salir caro. Con método, no.",
      intro:
        "El precio equivocado, la documentación incompleta y los compradores no cualificados son las tres trampas más habituales. El método Domus Tua las convierte en otros tantos puntos fuertes.",
      items: [
        {
          title: "El valor justo",
          copy: "Una valoración profesional evita malvender o quedarte meses en el mercado a un precio fuera de objetivo.",
        },
        {
          title: "Documentos en regla",
          copy: "Lo verificamos todo antes: sin sorpresas que bloqueen la negociación o la escritura.",
        },
        {
          title: "Los compradores adecuados",
          copy: "Precualificamos a quien visita y gestionamos las ofertas con transparencia, protegiendo tus intereses.",
        },
      ],
    },
    steps: {
      eyebrow: "El recorrido de venta",
      title: "De la primera estimación a la firma, paso a paso.",
      intro:
        "Cada venta sigue el mismo método contrastado. Tú siempre estás informado, nosotros gestionamos la complejidad.",
    },
    sellSteps: [
      {
        n: "01",
        title: "Valoración y análisis de mercado",
        copy: "Partimos del valor real de tu inmueble: análisis de la zona, de las características y de la demanda, para fijar precio y estrategia sin ilusiones y sin malvender.",
        image: "/images/hero_03_attico_dining_living.jpg",
        alt: "Ático luminoso con zona de comedor y salón",
      },
      {
        n: "02",
        title: "Verificación documental",
        copy: "Comprobamos conformidad, títulos y documentos antes de poner a la venta. Así llegas a la negociación y a la escritura sin contratiempos ni sorpresas desagradables.",
        image: "/images/premium_04_living_libreria.jpg",
        alt: "Salón elegante con librería",
      },
      {
        n: "03",
        title: "Preparación y home staging",
        copy: "Realzamos los espacios con consejos específicos y, cuando hace falta, home staging: la casa se presenta en su mejor versión y despierta más interés, más rápido.",
        image: "/images/home_staging_01_sala_reale_sedie_gialle.jpg",
        alt: "Sala preparada con home staging",
      },
      {
        n: "04",
        title: "Marketing y Open Domus",
        copy: "Fotos, vídeos, renders y campañas multicanal cuentan la casa. El evento Open Domus reúne a compradores cualificados y acelera las ofertas.",
        image: "/images/premium_05_living_accenti_senape.jpg",
        alt: "Salón moderno con acentos color mostaza",
      },
    ],
  },
};

export default function VendiContent() {
  const { locale } = useLocale();
  const c = copy[locale];

  return (
    <main className="flex-1">
      <PageHero
        eyebrow={c.hero.eyebrow}
        title={c.hero.title()}
        subcopy={c.hero.subcopy}
        image="/images/premium_02_living_dining_piante.jpg"
        alt={c.hero.alt}
        primary={{ label: c.hero.primaryLabel, href: "#contatti" }}
        secondary={{ label: c.hero.secondaryLabel, href: "#percorso" }}
        trust={c.hero.trust}
      />

      <Highlights
        tone="paper"
        eyebrow={c.highlights.eyebrow}
        title={c.highlights.title}
        intro={c.highlights.intro}
        items={c.highlights.items}
      />

      <EditorialRows
        id="percorso"
        eyebrow={c.steps.eyebrow}
        title={c.steps.title}
        intro={c.steps.intro}
        rows={c.sellSteps}
        tone="cream"
      />

      <BeforeAfter />
      <DomusDocProtocol tone="cream" />
      <FeaturedTestimonial />
      <Reviews />
      <div className="bg-cream-deep">
        <SectionDivider tone="cream-deep" />
      </div>
      <Contact />
    </main>
  );
}
