"use client";

import type { ReactNode } from "react";
import PageHero from "../components/PageHero";
import PropertySearch from "../components/PropertySearch";
import Contact from "../components/Contact";
import { useLocale } from "../components/i18n/LocaleProvider";
import type { Property } from "../lib/properties";

const copy = {
  it: {
    eyebrow: "Le nostre case",
    title: (): ReactNode => (
      <>
        Case selezionate,
        <br />
        <span className="text-red-soft">raccontate con cura.</span>
      </>
    ),
    subcopy:
      "Ogni immobile è verificato, preparato e raccontato con materiali professionali. Trova la casa giusta, con tutte le informazioni che contano.",
    alt: "Living elegante con libreria",
    primaryLabel: "Cerca con noi",
    secondaryLabel: "Parla con un consulente",
  },
  en: {
    eyebrow: "Our homes",
    title: (): ReactNode => (
      <>
        Curated homes,
        <br />
        <span className="text-red-soft">told with care.</span>
      </>
    ),
    subcopy:
      "Every property is verified, prepared and presented with professional materials. Find the right home, with all the information that truly matters.",
    alt: "Elegant living room with a bookcase",
    primaryLabel: "Search with us",
    secondaryLabel: "Talk to an advisor",
  },
  fr: {
    eyebrow: "Nos biens",
    title: (): ReactNode => (
      <>
        Des biens sélectionnés,
        <br />
        <span className="text-red-soft">racontés avec soin.</span>
      </>
    ),
    subcopy:
      "Chaque bien est vérifié, préparé et présenté avec des supports professionnels. Trouvez la maison qui vous ressemble, avec toutes les informations qui comptent.",
    alt: "Salon élégant avec bibliothèque",
    primaryLabel: "Cherchez avec nous",
    secondaryLabel: "Parlez à un conseiller",
  },
  de: {
    eyebrow: "Unsere Immobilien",
    title: (): ReactNode => (
      <>
        Ausgewählte Immobilien,
        <br />
        <span className="text-red-soft">mit Sorgfalt erzählt.</span>
      </>
    ),
    subcopy:
      "Jede Immobilie wird geprüft, vorbereitet und mit professionellen Unterlagen präsentiert. Finden Sie das richtige Zuhause – mit allen Informationen, die wirklich zählen.",
    alt: "Elegantes Wohnzimmer mit Bücherregal",
    primaryLabel: "Mit uns suchen",
    secondaryLabel: "Mit einem Berater sprechen",
  },
  es: {
    eyebrow: "Nuestras casas",
    title: (): ReactNode => (
      <>
        Casas seleccionadas,
        <br />
        <span className="text-red-soft">contadas con cuidado.</span>
      </>
    ),
    subcopy:
      "Cada inmueble se verifica, se prepara y se presenta con materiales profesionales. Encuentra la casa adecuada, con toda la información que de verdad importa.",
    alt: "Salón elegante con estantería",
    primaryLabel: "Busca con nosotros",
    secondaryLabel: "Habla con un asesor",
  },
};

export default function CaseContent({ properties }: { properties: Property[] }) {
  const { locale } = useLocale();
  const c = copy[locale];

  return (
    <>
      <PageHero
        eyebrow={c.eyebrow}
        title={c.title()}
        subcopy={c.subcopy}
        image="/images/premium_04_living_libreria.jpg"
        alt={c.alt}
        primary={{ label: c.primaryLabel, href: "#contatti" }}
        secondary={{ label: c.secondaryLabel, href: "/contatti" }}
      />
      <PropertySearch properties={properties} />
      <Contact />
    </>
  );
}
