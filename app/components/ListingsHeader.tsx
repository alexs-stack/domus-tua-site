"use client";

import Link from "next/link";
import Reveal from "./Reveal";
import { ArrowRight } from "./Icons";
import { useLocale } from "./i18n/LocaleProvider";

const copy = {
  it: {
    eyebrow: "Case in evidenza",
    title: "Case selezionate, raccontate con cura.",
    seeAll: "Vedi tutte le case",
  },
  en: {
    eyebrow: "Featured homes",
    title: "Selected homes, told with care.",
    seeAll: "See all homes",
  },
  fr: {
    eyebrow: "Biens en vedette",
    title: "Des biens sélectionnés, racontés avec soin.",
    seeAll: "Voir tous les biens",
  },
  de: {
    eyebrow: "Ausgewählte Objekte",
    title: "Ausgewählte Immobilien, mit Sorgfalt erzählt.",
    seeAll: "Alle Immobilien ansehen",
  },
  es: {
    eyebrow: "Inmuebles destacados",
    title: "Inmuebles seleccionados, contados con cuidado.",
    seeAll: "Ver todos los inmuebles",
  },
};

export default function ListingsHeader() {
  const { locale } = useLocale();
  const c = copy[locale];

  return (
    <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
      <Reveal className="max-w-2xl">
        <span className="eyebrow">{c.eyebrow}</span>
        <h2 className="mt-5 font-display text-4xl font-medium leading-[1.05] tracking-tight text-ink balance sm:text-5xl">
          {c.title}
        </h2>
      </Reveal>
      <Reveal delay={100}>
        <Link href="/case" className="group inline-flex items-center gap-2 text-sm font-semibold text-ink transition-colors hover:text-red">
          {c.seeAll}
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </Reveal>
    </div>
  );
}
