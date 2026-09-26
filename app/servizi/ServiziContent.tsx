"use client";

import type { ReactNode } from "react";
import PageHero from "../components/PageHero";
import Services from "../components/Services";
import EditorialRows, { type EditorialRow } from "../components/EditorialRows";
import BeforeAfter from "../components/BeforeAfter";
import Contact from "../components/Contact";
import { SegnoDomusDivider } from "../components/BrandMotif";
import { useLocale } from "../components/i18n/LocaleProvider";

const copy = {
  it: {
    heroEyebrow: "Servizi Domus",
    heroTitle: (): ReactNode => (
      <>
        Valorizzare, proteggere,
        <br />
        <span className="text-red-soft">raccontare la tua casa.</span>
      </>
    ),
    heroSubcopy:
      "Dietro ogni vendita c'è un insieme di servizi che fanno la differenza: tecnici e legali, creativi e di marketing. Tutti parte di un unico metodo.",
    heroAlt: "Cucina moderna luminosa",
    heroPrimary: "Parla con noi",
    heroSecondary: "Esplora i servizi",
    editorialEyebrow: "I servizi creativi",
    editorialTitle: "Far percepire il valore prima ancora della visita.",
    editorialIntro:
      "Immagini, allestimenti e video che fanno innamorare gli acquirenti dell'immobile, dal primo scroll.",
    rows: [
      {
        title: "Rendering e virtual rendering",
        copy: "Trasformiamo planimetrie e immobili da ristrutturare in immagini desiderabili. Il potenziale diventa visibile, e vendibile.",
        alt: "Rendering fotorealistico di un living",
      },
      {
        title: "Home staging",
        copy: "Allestiamo gli spazi per farli percepire al meglio. Una casa preparata si vende prima e a condizioni migliori.",
        alt: "Ambiente preparato con home staging",
      },
      {
        title: "Emotional video real estate",
        copy: "Video che raccontano la casa e l'emozione di viverla, non solo le sue stanze. Il modo più coinvolgente per farsi ricordare.",
        alt: "Cucina moderna in video",
      },
    ],
  },
  en: {
    heroEyebrow: "Domus Services",
    heroTitle: (): ReactNode => (
      <>
        Enhance, protect,
        <br />
        <span className="text-red-soft">tell the story of your home.</span>
      </>
    ),
    heroSubcopy:
      "Behind every sale there is a set of services that make the difference: technical and legal, creative and marketing. All part of one single method.",
    heroAlt: "Bright modern kitchen",
    heroPrimary: "Talk to us",
    heroSecondary: "Explore the services",
    editorialEyebrow: "The creative services",
    editorialTitle: "Making the value felt before the viewing even begins.",
    editorialIntro:
      "Imagery, staging and video that make buyers fall in love with the property, from the very first scroll.",
    rows: [
      {
        title: "Rendering and virtual rendering",
        copy: "We turn floor plans and properties to be renovated into desirable images. The potential becomes visible, and sellable.",
        alt: "Photorealistic rendering of a living room",
      },
      {
        title: "Home staging",
        copy: "We stage the spaces so they are perceived at their best. A prepared home sells sooner and on better terms.",
        alt: "Space prepared with home staging",
      },
      {
        title: "Emotional video real estate",
        copy: "Video that tells the story of the home and the emotion of living in it, not just its rooms. The most engaging way to be remembered.",
        alt: "Modern kitchen in video",
      },
    ],
  },
  fr: {
    heroEyebrow: "Services Domus",
    heroTitle: (): ReactNode => (
      <>
        Valoriser, protéger,
        <br />
        <span className="text-red-soft">raconter votre maison.</span>
      </>
    ),
    heroSubcopy:
      "Derrière chaque vente se cache un ensemble de services qui font la différence : techniques et juridiques, créatifs et marketing. Tous réunis dans une seule et même méthode.",
    heroAlt: "Cuisine moderne et lumineuse",
    heroPrimary: "Parlez-nous",
    heroSecondary: "Explorer les services",
    editorialEyebrow: "Les services créatifs",
    editorialTitle: "Faire ressentir la valeur avant même la visite.",
    editorialIntro:
      "Des images, des mises en scène et des vidéos qui font tomber les acquéreurs amoureux du bien, dès le premier scroll.",
    rows: [
      {
        title: "Rendering et rendu virtuel",
        copy: "Nous transformons plans et biens à rénover en images désirables. Le potentiel devient visible, et vendable.",
        alt: "Rendu photoréaliste d'un salon",
      },
      {
        title: "Home staging",
        copy: "Nous aménageons les espaces pour les mettre en valeur au mieux. Une maison préparée se vend plus vite et à de meilleures conditions.",
        alt: "Espace préparé en home staging",
      },
      {
        title: "Emotional video real estate",
        copy: "Des vidéos qui racontent la maison et l'émotion d'y vivre, pas seulement ses pièces. La façon la plus marquante de se faire retenir.",
        alt: "Cuisine moderne en vidéo",
      },
    ],
  },
  de: {
    heroEyebrow: "Domus Leistungen",
    heroTitle: (): ReactNode => (
      <>
        Aufwerten, schützen,
        <br />
        <span className="text-red-soft">die Geschichte Ihres Zuhauses erzählen.</span>
      </>
    ),
    heroSubcopy:
      "Hinter jedem Verkauf steht ein Bündel an Leistungen, die den Unterschied machen: technisch und rechtlich, kreativ und im Marketing. Alle Teil einer einzigen Methode.",
    heroAlt: "Helle moderne Küche",
    heroPrimary: "Sprechen Sie mit uns",
    heroSecondary: "Leistungen entdecken",
    editorialEyebrow: "Die kreativen Leistungen",
    editorialTitle: "Den Wert spürbar machen, noch vor der Besichtigung.",
    editorialIntro:
      "Bilder, Inszenierungen und Videos, die Käufer schon beim ersten Scrollen in die Immobilie verlieben lassen.",
    rows: [
      {
        title: "Rendering und virtuelles Rendering",
        copy: "Wir verwandeln Grundrisse und sanierungsbedürftige Immobilien in begehrenswerte Bilder. Das Potenzial wird sichtbar – und verkäuflich.",
        alt: "Fotorealistisches Rendering eines Wohnzimmers",
      },
      {
        title: "Home staging",
        copy: "Wir richten die Räume so ein, dass sie bestmöglich wirken. Ein vorbereitetes Zuhause verkauft sich schneller und zu besseren Konditionen.",
        alt: "Mit Home Staging vorbereiteter Raum",
      },
      {
        title: "Emotional video real estate",
        copy: "Videos, die das Zuhause und das Gefühl, darin zu leben, erzählen – nicht nur seine Räume. Der eindrücklichste Weg, in Erinnerung zu bleiben.",
        alt: "Moderne Küche im Video",
      },
    ],
  },
  es: {
    heroEyebrow: "Servicios Domus",
    heroTitle: (): ReactNode => (
      <>
        Valorizar, proteger,
        <br />
        <span className="text-red-soft">contar tu casa.</span>
      </>
    ),
    heroSubcopy:
      "Detrás de cada venta hay un conjunto de servicios que marcan la diferencia: técnicos y legales, creativos y de marketing. Todos parte de un único método.",
    heroAlt: "Cocina moderna y luminosa",
    heroPrimary: "Habla con nosotros",
    heroSecondary: "Explora los servicios",
    editorialEyebrow: "Los servicios creativos",
    editorialTitle: "Hacer percibir el valor incluso antes de la visita.",
    editorialIntro:
      "Imágenes, montajes y vídeos que enamoran a los compradores del inmueble, desde el primer scroll.",
    rows: [
      {
        title: "Rendering y renderizado virtual",
        copy: "Transformamos planos e inmuebles a reformar en imágenes deseables. El potencial se vuelve visible, y vendible.",
        alt: "Renderizado fotorrealista de un salón",
      },
      {
        title: "Home staging",
        copy: "Preparamos los espacios para que se perciban al máximo. Una casa preparada se vende antes y en mejores condiciones.",
        alt: "Ambiente preparado con home staging",
      },
      {
        title: "Emotional video real estate",
        copy: "Vídeos que cuentan la casa y la emoción de vivirla, no solo sus habitaciones. La forma más cautivadora de hacerse recordar.",
        alt: "Cocina moderna en vídeo",
      },
    ],
  },
};

export default function ServiziContent() {
  const { locale } = useLocale();
  const c = copy[locale];

  const rows: EditorialRow[] = [
    {
      n: "01",
      title: c.rows[0].title,
      copy: c.rows[0].copy,
      image: "/images/rendering_01_living_divano_grigio.jpg",
      alt: c.rows[0].alt,
    },
    {
      n: "02",
      title: c.rows[1].title,
      copy: c.rows[1].copy,
      image: "/images/home_staging_01_sala_reale_sedie_gialle.jpg",
      alt: c.rows[1].alt,
    },
    {
      n: "03",
      title: c.rows[2].title,
      copy: c.rows[2].copy,
      image: "/images/premium_03_cucina_moderna.jpg",
      alt: c.rows[2].alt,
    },
  ];

  return (
    <main className="flex-1">
      <PageHero
        eyebrow={c.heroEyebrow}
        title={c.heroTitle()}
        subcopy={c.heroSubcopy}
        image="/images/premium_03_cucina_moderna.jpg"
        alt={c.heroAlt}
        primary={{ label: c.heroPrimary, href: "#contatti" }}
        secondary={{ label: c.heroSecondary, href: "#servizi" }}
      />

      <SegnoDomusDivider className="py-14" />

      <Services />

      <EditorialRows
        eyebrow={c.editorialEyebrow}
        title={c.editorialTitle}
        intro={c.editorialIntro}
        rows={rows}
        tone="paper"
      />

      <BeforeAfter />
      <Contact />
    </main>
  );
}
