"use client";

import { ratingLabel, site } from "../lib/site";

import { useLocale } from "../components/i18n/LocaleProvider";
import PageHero from "../components/PageHero";
import FeaturedTestimonial from "../components/FeaturedTestimonial";
import Reviews from "../components/Reviews";
import Stats from "../components/Stats";
import Contact from "../components/Contact";

const copy = {
  it: {
    eyebrow: "Recensioni",
    title: () => (
      <>
        Lo raccontano
        <br />
        <span className="text-red-soft">le persone.</span>
      </>
    ),
    subcopy:
      `Chi ha scelto Domus Tua lo ha scritto: ${site.reviewsCount} recensioni su Google. Le loro parole raccontano un modo diverso di vivere la compravendita: più umano, più chiaro, più seguito.`,
    alt: "Soggiorno accogliente",
    primaryLabel: "Inizia anche tu",
    secondaryLabel: "Leggi le recensioni",
    trust: [`${ratingLabel("it")}/5 di media`, `${site.reviewsCount} recensioni`, "Google · Trustindex"],
  },
  en: {
    eyebrow: "Reviews",
    title: () => (
      <>
        The people who
        <br />
        <span className="text-red-soft">tell the story.</span>
      </>
    ),
    subcopy:
      `Those who chose Domus Tua wrote it down: ${site.reviewsCount} reviews on Google. Their words describe a different way to buy and sell a home: more human, clearer, more supported.`,
    alt: "Welcoming living room",
    primaryLabel: "Start with us too",
    secondaryLabel: "Read the reviews",
    trust: [`${ratingLabel("en")}/5 average`, `${site.reviewsCount} reviews`, "Google · Trustindex"],
  },
  fr: {
    eyebrow: "Avis",
    title: () => (
      <>
        Ce sont les gens
        <br />
        <span className="text-red-soft">qui le racontent.</span>
      </>
    ),
    subcopy:
      `Ceux qui ont choisi Domus Tua l’ont écrit : ${site.reviewsCount} avis sur Google. Leurs mots racontent une autre façon de vendre et d’acheter : plus humaine, plus claire, plus accompagnée.`,
    alt: "Séjour chaleureux",
    primaryLabel: "Commencez vous aussi",
    secondaryLabel: "Lire les avis",
    trust: [`${ratingLabel("fr")}/5 de moyenne`, `${site.reviewsCount} avis`, "Google · Trustindex"],
  },
  de: {
    eyebrow: "Bewertungen",
    title: () => (
      <>
        Die Menschen
        <br />
        <span className="text-red-soft">erzählen davon.</span>
      </>
    ),
    subcopy:
      `Wer sich für Domus Tua entschieden hat, hat es aufgeschrieben: ${site.reviewsCount} Bewertungen auf Google. Ihre Worte erzählen von einer anderen Art zu kaufen und zu verkaufen: menschlicher, klarer, besser begleitet.`,
    alt: "Einladendes Wohnzimmer",
    primaryLabel: "Starten auch Sie",
    secondaryLabel: "Bewertungen lesen",
    trust: [`${ratingLabel("de")}/5 im Schnitt`, `${site.reviewsCount} Bewertungen`, "Google · Trustindex"],
  },
  es: {
    eyebrow: "Reseñas",
    title: () => (
      <>
        Lo cuentan
        <br />
        <span className="text-red-soft">las personas.</span>
      </>
    ),
    subcopy:
      `Quienes eligieron Domus Tua lo escribieron: ${site.reviewsCount} reseñas en Google. Sus palabras cuentan otra forma de comprar y vender casa: más humana, más clara, más acompañada.`,
    alt: "Salón acogedor",
    primaryLabel: "Empieza tú también",
    secondaryLabel: "Leer las reseñas",
    trust: [`${ratingLabel("es")}/5 de media`, `${site.reviewsCount} reseñas`, "Google · Trustindex"],
  },
};

export default function RecensioniContent() {
  const { locale } = useLocale();
  const c = copy[locale];

  return (
    <main className="flex-1">
      <PageHero
        eyebrow={c.eyebrow}
        title={c.title()}
        subcopy={c.subcopy}
        image="/images/premium_01_living_tv_divano.jpg"
        alt={c.alt}
        primary={{ label: c.primaryLabel, href: "#contatti" }}
        secondary={{ label: c.secondaryLabel, href: "#recensioni" }}
        trust={c.trust}
      />

      <FeaturedTestimonial />
      <Reviews />
      <Stats />
      <Contact />
    </main>
  );
}
