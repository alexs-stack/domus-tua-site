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
import Reveal from "../components/Reveal";
import { ArrowUpRight, Check } from "../components/Icons";
import {
  SegnoDomusBadge,
  SegnoDomusCorner,
  SegnoDomusDivider,
} from "../components/BrandMotif";

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
  risks: {
    eyebrow: string;
    title: string;
    intro: string;
    items: { title: string; copy: string }[];
    reassure: string;
  };
  prep: {
    eyebrow: string;
    title: string;
    intro: string;
    items: { n: string; title: string; copy: string }[];
    proof: string;
    ctaLabel: string;
  };
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
        "La tua casa merita di essere venduta bene, non in fretta. Non la mettiamo semplicemente online: la prepariamo, la raccontiamo e la vendiamo con metodo, riducendo errori, tempi morti e incertezze.",
      alt: "Living luminoso con zona pranzo",
      primaryLabel: "Valuta il tuo immobile",
      secondaryLabel: "Come funziona",
      trust: [
        "Valutazione gratuita e senza impegno",
        "Nessun costo anticipato, paghi solo a vendita conclusa",
        "Foto, video, home staging e certificazione inclusi",
      ],
    },
    highlights: {
      eyebrow: "Perché affidarti a noi",
      title: "Vendere casa non è mettere un cartello.",
      intro:
        "Dietro una vendita che va a buon fine ci sono tre leve, non un annuncio. Il metodo Domus Tua le governa tutte e tre, ed è così che il 92% dei nostri immobili viene venduto.",
      items: [
        {
          title: "Il prezzo giusto",
          copy: "Una valutazione professionale su dati reali: né troppo alto, così l’immobile non resta fermo, né troppo basso, così non lasci valore sul tavolo.",
        },
        {
          title: "L’immobile certificato",
          copy: "Con il protocollo Domus D.O.C. verifichiamo la conformità a monte: documenti a posto prima di andare sul mercato, niente sorprese in trattativa.",
        },
        {
          title: "Il marketing che vende",
          copy: "Foto, video emozionale, home staging e campagne mirate raccontano la casa e la portano davanti agli acquirenti giusti.",
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
    risks: {
      eyebrow: "Vendere senza metodo",
      title: "Cosa rischi quando vendi senza metodo",
      intro:
        "Non lo diciamo per spaventarti, ma per prepararti. Sono le cose che vediamo capitare più spesso a chi vende da solo, e che con il metodo giusto si evitano quasi sempre.",
      items: [
        {
          title: "Prezzo sbagliato",
          copy: "Troppo alto e l’immobile resta fermo per mesi; troppo basso e lasci valore sul tavolo. Senza dati di mercato è facile sbagliare.",
        },
        {
          title: "Documenti incompleti",
          copy: "Una difformità o un titolo mancante può emergere proprio al rogito, quando ormai è tardi e la trattativa rischia di saltare.",
        },
        {
          title: "Visite non qualificate",
          copy: "Aprire casa a curiosi o a chi non ha reale capacità d’acquisto significa tempo perso e trattative che non arrivano mai a dunque.",
        },
        {
          title: "Trattativa stressante",
          copy: "Gestire da soli offerte, controproposte ed emozioni è logorante. Spesso si accetta meno del dovuto, solo per chiudere.",
        },
        {
          title: "Ritardi al rogito",
          copy: "Verifiche non fatte per tempo allungano i tempi e possono far raffreddare l’acquirente proprio sul più bello.",
        },
      ],
      reassure:
        "Con Domus D.O.C. vendi senza sorprese: tempi più rapidi, trattative più solide, zero sorprese al rogito. Ecco cosa facciamo, con calma e in anticipo, per proteggere la tua vendita.",
    },
    prep: {
      eyebrow: "Prima di pubblicare",
      title: "Cosa fa Domus Tua prima ancora di pubblicare",
      intro:
        "Quando il tuo immobile appare online, il lavoro più importante è già stato fatto. Prima dell’annuncio ci prendiamo il tempo di preparare tutto con cura.",
      items: [
        {
          n: "01",
          title: "Valutazione seria",
          copy: "Un prezzo costruito su dati reali di zona e domanda, non su una promessa. Così parti forte fin dal primo giorno.",
        },
        {
          n: "02",
          title: "Verifica documentale",
          copy: "Controlliamo conformità, titoli e planimetrie in anticipo, per arrivare al rogito senza sorprese.",
        },
        {
          n: "03",
          title: "Preparazione dell’immobile",
          copy: "Consigli mirati e, dove serve, home staging: la casa si mostra al meglio prima ancora del primo scatto.",
        },
        {
          n: "04",
          title: "Racconto video e social",
          copy: "Foto, video e contenuti social pensati per emozionare e raggiungere gli acquirenti giusti, non solo per riempire un annuncio.",
        },
        {
          n: "05",
          title: "Strategia Open Domus",
          copy: "Programmiamo l’evento Open Domus per concentrare l’interesse e portare visite qualificate in poche ore.",
        },
      ],
      proof:
        "È lo stesso metodo che i venditori raccontano nelle loro recensioni, che dà vita agli eventi Open Domus e che porta alla certificazione Domus D.O.C.",
      ctaLabel: "Richiedi una valutazione seria",
    },
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
        "Your home deserves to be sold well, not in a hurry. We don’t simply list it online: we prepare it, tell its story and sell it with a proven method, cutting out mistakes, wasted time and uncertainty.",
      alt: "Bright living area with dining space",
      primaryLabel: "Get your valuation",
      secondaryLabel: "How it works",
      trust: [
        "Free, no-obligation valuation",
        "No upfront costs, you pay only once the sale is closed",
        "Photography, video, home staging and certification included",
      ],
    },
    highlights: {
      eyebrow: "Why entrust it to us",
      title: "Selling a home isn’t just putting up a sign.",
      intro:
        "Behind a sale that goes through there are three levers, not a listing. The Domus Tua method governs all three, and that’s how 92% of our properties get sold.",
      items: [
        {
          title: "The right price",
          copy: "A professional valuation based on real data: not too high, so the property doesn’t sit on the market, and not too low, so you don’t leave value on the table.",
        },
        {
          title: "The certified property",
          copy: "With the Domus D.O.C. protocol we verify compliance upfront: paperwork in order before going to market, no surprises during the negotiation.",
        },
        {
          title: "Marketing that sells",
          copy: "Photography, emotive video, home staging and targeted campaigns tell the home’s story and put it in front of the right buyers.",
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
    risks: {
      eyebrow: "Selling without a method",
      title: "What you risk when you sell without a method",
      intro:
        "We’re not saying this to scare you, but to prepare you. These are the things we most often see happen to people who sell on their own — and that the right method almost always prevents.",
      items: [
        {
          title: "The wrong price",
          copy: "Too high and the property sits for months; too low and you leave value on the table. Without market data, it’s easy to get it wrong.",
        },
        {
          title: "Incomplete paperwork",
          copy: "A discrepancy or a missing title can surface right at the final deed, when it’s too late and the whole deal risks falling through.",
        },
        {
          title: "Unqualified viewings",
          copy: "Opening your home to the merely curious, or to people without real buying power, means wasted time and negotiations that never get anywhere.",
        },
        {
          title: "A stressful negotiation",
          copy: "Handling offers, counter-offers and emotions alone is draining. All too often you accept less than you should, just to close.",
        },
        {
          title: "Delays at completion",
          copy: "Checks not done in good time stretch out the process and can let a buyer cool off at the worst possible moment.",
        },
      ],
      reassure:
        "With Domus D.O.C. you sell with no surprises: faster timelines, stronger negotiations, zero surprises at completion. Here’s what we do, calmly and ahead of time, to protect your sale.",
    },
    prep: {
      eyebrow: "Before we publish",
      title: "What Domus Tua does before we even publish",
      intro:
        "By the time your property appears online, the most important work is already done. Before the listing goes live, we take the time to prepare everything with care.",
      items: [
        {
          n: "01",
          title: "A serious valuation",
          copy: "A price built on real data about the area and demand, not on a promise. That way you start strong from day one.",
        },
        {
          n: "02",
          title: "Document verification",
          copy: "We check compliance, titles and floor plans ahead of time, so you reach the final deed with no surprises.",
        },
        {
          n: "03",
          title: "Preparing the property",
          copy: "Targeted advice and, where needed, home staging: the home shows at its best before the very first photo.",
        },
        {
          n: "04",
          title: "Video and social storytelling",
          copy: "Photos, video and social content designed to move people and reach the right buyers, not just to fill a listing.",
        },
        {
          n: "05",
          title: "Open Domus strategy",
          copy: "We schedule the Open Domus event to concentrate interest and bring qualified viewings within just a few hours.",
        },
      ],
      proof:
        "It’s the same method sellers describe in their reviews, that brings the Open Domus events to life and that leads to the Domus D.O.C. certification.",
      ctaLabel: "Request a serious valuation",
    },
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
        "Votre bien mérite d’être vendu au juste prix, pas à la hâte. Nous ne nous contentons pas de le mettre en ligne : nous le préparons, le mettons en valeur et le vendons avec méthode, en réduisant erreurs, temps morts et incertitudes.",
      alt: "Séjour lumineux avec coin repas",
      primaryLabel: "Estimez votre bien",
      secondaryLabel: "Comment ça marche",
      trust: [
        "Estimation gratuite et sans engagement",
        "Aucuns frais d’avance, vous ne payez qu’à la vente conclue",
        "Photos, vidéo, home staging et certification inclus",
      ],
    },
    highlights: {
      eyebrow: "Pourquoi nous faire confiance",
      title: "Vendre un bien, ce n’est pas planter une pancarte.",
      intro:
        "Derrière une vente qui aboutit, il y a trois leviers, pas une simple annonce. La méthode Domus Tua les maîtrise tous les trois, et c’est ainsi que 92 % de nos biens sont vendus.",
      items: [
        {
          title: "Le juste prix",
          copy: "Une estimation professionnelle fondée sur des données réelles : ni trop élevé, pour que le bien ne stagne pas, ni trop bas, pour ne pas laisser de valeur sur la table.",
        },
        {
          title: "Le bien certifié",
          copy: "Avec le protocole Domus D.O.C., nous vérifions la conformité en amont : dossier en règle avant la mise sur le marché, aucune surprise en négociation.",
        },
        {
          title: "Le marketing qui vend",
          copy: "Photos, vidéo émotionnelle, home staging et campagnes ciblées racontent le bien et le placent devant les bons acquéreurs.",
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
    risks: {
      eyebrow: "Vendre sans méthode",
      title: "Ce que vous risquez en vendant sans méthode",
      intro:
        "Nous ne le disons pas pour vous effrayer, mais pour vous préparer. Ce sont les situations que nous voyons le plus souvent chez ceux qui vendent seuls, et que la bonne méthode évite presque toujours.",
      items: [
        {
          title: "Un prix erroné",
          copy: "Trop élevé, le bien reste des mois sans bouger ; trop bas, vous laissez de la valeur sur la table. Sans données de marché, l’erreur est vite arrivée.",
        },
        {
          title: "Un dossier incomplet",
          copy: "Une non-conformité ou un titre manquant peut ressortir le jour même de l’acte, alors qu’il est trop tard et que la vente risque d’échouer.",
        },
        {
          title: "Des visites non qualifiées",
          copy: "Ouvrir sa porte à des curieux ou à des personnes sans réelle capacité d’achat, c’est du temps perdu et des négociations qui n’aboutissent jamais.",
        },
        {
          title: "Une négociation stressante",
          copy: "Gérer seul offres, contre-offres et émotions est épuisant. Trop souvent, on accepte moins que sa juste valeur, juste pour conclure.",
        },
        {
          title: "Des retards à l’acte",
          copy: "Des vérifications non faites à temps allongent les délais et peuvent refroidir l’acquéreur au pire moment.",
        },
      ],
      reassure:
        "Avec Domus D.O.C., vous vendez sans surprises : des délais plus courts, des négociations plus solides, zéro surprise à l’acte. Voici ce que nous faisons, sereinement et en amont, pour protéger votre vente.",
    },
    prep: {
      eyebrow: "Avant la mise en ligne",
      title: "Ce que fait Domus Tua avant même de publier",
      intro:
        "Lorsque votre bien apparaît en ligne, l’essentiel du travail est déjà fait. Avant l’annonce, nous prenons le temps de tout préparer avec soin.",
      items: [
        {
          n: "01",
          title: "Une estimation sérieuse",
          copy: "Un prix construit sur des données réelles de quartier et de demande, pas sur une promesse. Vous partez ainsi en position de force dès le premier jour.",
        },
        {
          n: "02",
          title: "Vérification documentaire",
          copy: "Nous contrôlons conformité, titres et plans en amont, pour arriver à l’acte sans mauvaise surprise.",
        },
        {
          n: "03",
          title: "Préparation du bien",
          copy: "Conseils ciblés et, si besoin, home staging : le bien se présente sous son meilleur jour avant même la première photo.",
        },
        {
          n: "04",
          title: "Récit vidéo et réseaux sociaux",
          copy: "Photos, vidéos et contenus sociaux pensés pour émouvoir et toucher les bons acquéreurs, pas seulement pour remplir une annonce.",
        },
        {
          n: "05",
          title: "Stratégie Open Domus",
          copy: "Nous programmons l’événement Open Domus pour concentrer l’intérêt et générer des visites qualifiées en quelques heures.",
        },
      ],
      proof:
        "C’est la même méthode que les vendeurs racontent dans leurs avis, qui donne vie aux événements Open Domus et qui mène à la certification Domus D.O.C.",
      ctaLabel: "Demandez une estimation sérieuse",
    },
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
        "Ihr Zuhause verdient es, gut verkauft zu werden, nicht in Eile. Wir stellen es nicht einfach online: Wir bereiten es auf, erzählen seine Geschichte und verkaufen es mit Methode und reduzieren so Fehler, Leerlauf und Unsicherheiten.",
      alt: "Helles Wohnzimmer mit Essbereich",
      primaryLabel: "Immobilie bewerten lassen",
      secondaryLabel: "So funktioniert es",
      trust: [
        "Kostenlose, unverbindliche Bewertung",
        "Keine Vorabkosten, Sie zahlen erst nach erfolgtem Verkauf",
        "Fotos, Video, Home Staging und Zertifizierung inklusive",
      ],
    },
    highlights: {
      eyebrow: "Warum Sie uns vertrauen können",
      title: "Eine Immobilie zu verkaufen heißt nicht, ein Schild aufzustellen.",
      intro:
        "Hinter einem gelungenen Verkauf stehen drei Hebel, nicht ein Inserat. Die Domus-Tua-Methode steuert alle drei, und so werden 92 % unserer Immobilien verkauft.",
      items: [
        {
          title: "Der richtige Preis",
          copy: "Eine professionelle Bewertung auf Basis echter Daten: nicht zu hoch, damit die Immobilie nicht liegen bleibt, und nicht zu niedrig, damit Sie keinen Wert verschenken.",
        },
        {
          title: "Die zertifizierte Immobilie",
          copy: "Mit dem Domus-D.O.C.-Protokoll prüfen wir die Konformität vorab: Unterlagen in Ordnung, bevor es an den Markt geht, keine Überraschungen in der Verhandlung.",
        },
        {
          title: "Marketing, das verkauft",
          copy: "Fotos, emotionales Video, Home Staging und gezielte Kampagnen erzählen die Immobilie und bringen sie vor die richtigen Käufer.",
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
    risks: {
      eyebrow: "Ohne Methode verkaufen",
      title: "Was Sie riskieren, wenn Sie ohne Methode verkaufen",
      intro:
        "Wir sagen das nicht, um Ihnen Angst zu machen, sondern um Sie vorzubereiten. Es sind die Dinge, die wir bei Menschen, die allein verkaufen, am häufigsten erleben – und die sich mit der richtigen Methode fast immer vermeiden lassen.",
      items: [
        {
          title: "Der falsche Preis",
          copy: "Zu hoch, und die Immobilie bleibt monatelang liegen; zu niedrig, und Sie verschenken Wert. Ohne Marktdaten ist ein Fehler schnell passiert.",
        },
        {
          title: "Unvollständige Unterlagen",
          copy: "Eine Abweichung oder ein fehlender Titel kann ausgerechnet beim Notartermin auftauchen, wenn es zu spät ist und der Verkauf zu platzen droht.",
        },
        {
          title: "Unqualifizierte Besichtigungen",
          copy: "Die Tür für Neugierige oder Interessenten ohne echte Kaufkraft zu öffnen bedeutet verlorene Zeit und Verhandlungen, die nie zum Ziel führen.",
        },
        {
          title: "Eine stressige Verhandlung",
          copy: "Angebote, Gegenangebote und Emotionen allein zu bewältigen ist zermürbend. Oft akzeptiert man weniger als angemessen, nur um abzuschließen.",
        },
        {
          title: "Verzögerungen beim Notartermin",
          copy: "Nicht rechtzeitig erledigte Prüfungen verlängern den Prozess und können den Käufer im ungünstigsten Moment abkühlen lassen.",
        },
      ],
      reassure:
        "Mit Domus D.O.C. verkaufen Sie ohne Überraschungen: schnellere Abläufe, solidere Verhandlungen, keine Überraschungen beim Notartermin. Hier ist, was wir in Ruhe und rechtzeitig tun, um Ihren Verkauf zu schützen.",
    },
    prep: {
      eyebrow: "Vor der Veröffentlichung",
      title: "Was Domus Tua tut, noch bevor wir veröffentlichen",
      intro:
        "Wenn Ihre Immobilie online erscheint, ist die wichtigste Arbeit bereits getan. Vor dem Inserat nehmen wir uns die Zeit, alles sorgfältig vorzubereiten.",
      items: [
        {
          n: "01",
          title: "Eine seriöse Bewertung",
          copy: "Ein Preis, der auf echten Daten zu Lage und Nachfrage beruht, nicht auf einem Versprechen. So starten Sie vom ersten Tag an stark.",
        },
        {
          n: "02",
          title: "Prüfung der Unterlagen",
          copy: "Wir prüfen Konformität, Rechtstitel und Grundrisse vorab, damit Sie den Notartermin ohne Überraschungen erreichen.",
        },
        {
          n: "03",
          title: "Vorbereitung der Immobilie",
          copy: "Gezielte Tipps und, wo nötig, Home Staging: Das Zuhause zeigt sich schon vor dem ersten Foto von seiner besten Seite.",
        },
        {
          n: "04",
          title: "Video- und Social-Storytelling",
          copy: "Fotos, Videos und Social-Inhalte, die berühren und die richtigen Käufer erreichen – nicht nur, um ein Inserat zu füllen.",
        },
        {
          n: "05",
          title: "Open-Domus-Strategie",
          copy: "Wir planen das Open-Domus-Event, um das Interesse zu bündeln und innerhalb weniger Stunden qualifizierte Besichtigungen zu bringen.",
        },
      ],
      proof:
        "Es ist dieselbe Methode, die Verkäufer in ihren Bewertungen beschreiben, die die Open-Domus-Events zum Leben erweckt und die zur Zertifizierung Domus D.O.C. führt.",
      ctaLabel: "Seriöse Bewertung anfragen",
    },
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
        "Tu casa merece venderse bien, no con prisas. No nos limitamos a publicarla en internet: la preparamos, la presentamos y la vendemos con método, reduciendo errores, tiempos muertos e incertidumbres.",
      alt: "Salón luminoso con zona de comedor",
      primaryLabel: "Valora tu inmueble",
      secondaryLabel: "Cómo funciona",
      trust: [
        "Valoración gratuita y sin compromiso",
        "Sin costes por adelantado, pagas solo con la venta cerrada",
        "Fotos, vídeo, home staging y certificación incluidos",
      ],
    },
    highlights: {
      eyebrow: "Por qué confiar en nosotros",
      title: "Vender una casa no es poner un cartel.",
      intro:
        "Detrás de una venta que sale bien hay tres palancas, no un anuncio. El método Domus Tua gobierna las tres, y así es como se vende el 92 % de nuestros inmuebles.",
      items: [
        {
          title: "El precio justo",
          copy: "Una valoración profesional sobre datos reales: ni demasiado alto, para que el inmueble no se quede parado, ni demasiado bajo, para que no dejes valor sobre la mesa.",
        },
        {
          title: "El inmueble certificado",
          copy: "Con el protocolo Domus D.O.C. verificamos la conformidad de antemano: documentos en regla antes de salir al mercado, sin sorpresas en la negociación.",
        },
        {
          title: "El marketing que vende",
          copy: "Fotos, vídeo emocional, home staging y campañas dirigidas cuentan la casa y la ponen ante los compradores adecuados.",
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
    risks: {
      eyebrow: "Vender sin método",
      title: "Qué arriesgas cuando vendes sin método",
      intro:
        "No lo decimos para asustarte, sino para prepararte. Son las cosas que vemos con más frecuencia en quien vende por su cuenta, y que con el método adecuado casi siempre se evitan.",
      items: [
        {
          title: "Precio equivocado",
          copy: "Demasiado alto y el inmueble se queda parado meses; demasiado bajo y dejas valor sobre la mesa. Sin datos de mercado, es fácil equivocarse.",
        },
        {
          title: "Documentación incompleta",
          copy: "Una disconformidad o un título que falta puede aparecer justo en la escritura, cuando ya es tarde y la operación corre el riesgo de caerse.",
        },
        {
          title: "Visitas no cualificadas",
          copy: "Abrir la casa a curiosos o a quien no tiene capacidad real de compra significa tiempo perdido y negociaciones que nunca llegan a nada.",
        },
        {
          title: "Negociación estresante",
          copy: "Gestionar solo ofertas, contraofertas y emociones desgasta. Con demasiada frecuencia se acepta menos de lo debido, solo por cerrar.",
        },
        {
          title: "Retrasos en la escritura",
          copy: "Las comprobaciones no hechas a tiempo alargan los plazos y pueden enfriar al comprador en el peor momento.",
        },
      ],
      reassure:
        "Con Domus D.O.C. vendes sin sorpresas: plazos más rápidos, negociaciones más sólidas, cero sorpresas en la escritura. Esto es lo que hacemos, con calma y por adelantado, para proteger tu venta.",
    },
    prep: {
      eyebrow: "Antes de publicar",
      title: "Lo que hace Domus Tua antes incluso de publicar",
      intro:
        "Cuando tu inmueble aparece en internet, el trabajo más importante ya está hecho. Antes del anuncio nos tomamos el tiempo de prepararlo todo con cuidado.",
      items: [
        {
          n: "01",
          title: "Una valoración seria",
          copy: "Un precio construido sobre datos reales de zona y demanda, no sobre una promesa. Así partes con fuerza desde el primer día.",
        },
        {
          n: "02",
          title: "Verificación documental",
          copy: "Comprobamos conformidad, títulos y planos por adelantado, para llegar a la escritura sin sorpresas.",
        },
        {
          n: "03",
          title: "Preparación del inmueble",
          copy: "Consejos específicos y, cuando hace falta, home staging: la casa se muestra en su mejor versión antes incluso de la primera foto.",
        },
        {
          n: "04",
          title: "Relato en vídeo y redes",
          copy: "Fotos, vídeos y contenidos sociales pensados para emocionar y llegar a los compradores adecuados, no solo para llenar un anuncio.",
        },
        {
          n: "05",
          title: "Estrategia Open Domus",
          copy: "Programamos el evento Open Domus para concentrar el interés y generar visitas cualificadas en pocas horas.",
        },
      ],
      proof:
        "Es el mismo método que los vendedores cuentan en sus reseñas, que da vida a los eventos Open Domus y que conduce a la certificación Domus D.O.C.",
      ctaLabel: "Solicita una valoración seria",
    },
  },
};

// ── Sezione: "Cosa rischi quando vendi senza metodo" ─────────────────────────
// Empatica, non allarmista: nomina i rischi reali e chiude rassicurando.
function SellRisks({ risks }: { risks: Copy["risks"] }) {
  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
        <Reveal className="max-w-2xl">
          <span className="eyebrow">{risks.eyebrow}</span>
          <h2 className="mt-5 font-display text-4xl font-medium leading-[1.05] tracking-tight text-ink balance sm:text-5xl">
            {risks.title}
          </h2>
          <p className="mt-5 max-w-xl text-[1.02rem] leading-relaxed text-stone">{risks.intro}</p>
        </Reveal>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {risks.items.map((it, i) => (
            <Reveal key={it.title} delay={i * 80}>
              <article className="group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-line bg-paper p-7 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:border-red/40">
                <span className="tnum font-display text-sm font-semibold tracking-[0.1em] text-red/70">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 font-display text-xl font-medium leading-snug tracking-tight text-ink">
                  {it.title}
                </h3>
                <p className="mt-2 text-[0.92rem] leading-relaxed text-stone">{it.copy}</p>
              </article>
            </Reveal>
          ))}

          {/* Card di chiusura rassicurante — accento rosso caldo + firma Segno Domus */}
          <Reveal delay={risks.items.length * 80}>
            <article className="relative flex h-full flex-col justify-center overflow-hidden rounded-[1.75rem] border border-red/20 bg-red-soft p-7">
              <SegnoDomusCorner className="right-3.5 top-3.5 opacity-70" rotate={90} />
              <p className="font-display text-lg font-medium leading-snug tracking-tight text-red-dark">
                {risks.reassure}
              </p>
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ── Sezione: "Cosa fa Domus Tua prima ancora di pubblicare" ──────────────────
// Passaggi numerati che rispondono ai rischi, con richiamo alle prove e CTA.
function SellPrep({ prep }: { prep: Copy["prep"] }) {
  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
        <Reveal className="max-w-2xl">
          <SegnoDomusBadge>{prep.eyebrow}</SegnoDomusBadge>
          <h2 className="mt-5 font-display text-4xl font-medium leading-[1.05] tracking-tight text-ink balance sm:text-5xl">
            {prep.title}
          </h2>
          <p className="mt-5 max-w-xl text-[1.02rem] leading-relaxed text-stone">{prep.intro}</p>
        </Reveal>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {prep.items.map((it, i) => (
            <Reveal key={it.n} delay={i * 80}>
              <article className="group flex h-full flex-col rounded-[1.75rem] border border-line bg-paper p-7 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:border-red/40">
                <div className="flex items-center gap-3">
                  <span className="tnum flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-soft font-display text-sm font-semibold text-red-dark">
                    {it.n}
                  </span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-red/20 text-red">
                    <Check className="h-4 w-4" />
                  </span>
                </div>
                <h3 className="mt-6 font-display text-xl font-medium leading-snug tracking-tight text-ink">
                  {it.title}
                </h3>
                <p className="mt-2 text-[0.92rem] leading-relaxed text-stone">{it.copy}</p>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120} className="mt-14">
          <div className="rounded-[1.75rem] border border-line bg-paper p-8 sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-10">
            <p className="max-w-2xl text-[1.02rem] leading-relaxed text-graphite">{prep.proof}</p>
            <a
              href="#contatti"
              className="group mt-6 inline-flex shrink-0 items-center gap-2 rounded-full bg-red py-3.5 pl-6 pr-2.5 text-sm font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-red-dark active:scale-[0.98] sm:mt-0"
            >
              {prep.ctaLabel}
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

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

      <SellRisks risks={c.risks} />

      <div className="bg-cream">
        <SectionDivider tone="cream" />
      </div>

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

      <div className="bg-paper">
        <SegnoDomusDivider className="py-2" />
      </div>
      <SellPrep prep={c.prep} />

      <div className="bg-cream-deep">
        <SectionDivider tone="cream-deep" />
      </div>
      <Contact />
    </main>
  );
}
