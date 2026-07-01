"use client";

import Link from "next/link";
import PropertyGallery from "../../components/PropertyGallery";
import Contact from "../../components/Contact";
import { ArrowRight, ArrowUpRight, Check, Whatsapp } from "../../components/Icons";
import { site } from "../../lib/site";
import type { Property } from "../../lib/properties";
import { useLocale } from "../../components/i18n/LocaleProvider";

const copy = {
  it: {
    backToAll: "Tutte le case",
    description: "Descrizione",
    features: "Caratteristiche",
    specSqm: "Superficie",
    specRooms: "Locali",
    specBeds: "Camere",
    specBaths: "Bagni",
    specType: "Tipologia",
    specStatus: "Stato",
    requestVisit: "Richiedi una visita",
    whatsapp: "Scrivici su WhatsApp",
  },
  en: {
    backToAll: "All properties",
    description: "Description",
    features: "Features",
    specSqm: "Surface",
    specRooms: "Rooms",
    specBeds: "Bedrooms",
    specBaths: "Bathrooms",
    specType: "Type",
    specStatus: "Status",
    requestVisit: "Request a viewing",
    whatsapp: "Message us on WhatsApp",
  },
  fr: {
    backToAll: "Tous les biens",
    description: "Description",
    features: "Caractéristiques",
    specSqm: "Surface",
    specRooms: "Pièces",
    specBeds: "Chambres",
    specBaths: "Salles de bain",
    specType: "Type",
    specStatus: "Statut",
    requestVisit: "Demander une visite",
    whatsapp: "Écrivez-nous sur WhatsApp",
  },
  de: {
    backToAll: "Alle Immobilien",
    description: "Beschreibung",
    features: "Ausstattung",
    specSqm: "Wohnfläche",
    specRooms: "Zimmer",
    specBeds: "Schlafzimmer",
    specBaths: "Badezimmer",
    specType: "Typ",
    specStatus: "Status",
    requestVisit: "Besichtigung anfragen",
    whatsapp: "Schreiben Sie uns auf WhatsApp",
  },
  es: {
    backToAll: "Todas las propiedades",
    description: "Descripción",
    features: "Características",
    specSqm: "Superficie",
    specRooms: "Estancias",
    specBeds: "Dormitorios",
    specBaths: "Baños",
    specType: "Tipo",
    specStatus: "Estado",
    requestVisit: "Solicita una visita",
    whatsapp: "Escríbenos por WhatsApp",
  },
};

export default function PropertyDetail({ p }: { p: Property }) {
  const { locale } = useLocale();
  const c = copy[locale];

  const specs = [
    { label: c.specSqm, value: p.sqm },
    { label: c.specRooms, value: p.rooms },
    { label: c.specBeds, value: p.beds },
    { label: c.specBaths, value: p.baths },
    { label: c.specType, value: p.type },
    { label: c.specStatus, value: p.status },
  ];

  return (
    <main className="flex-1 bg-paper">
      <div className="mx-auto max-w-[1240px] px-5 pt-32 sm:px-8 sm:pt-36">
        {/* Breadcrumb */}
        <Link
          href="/case"
          className="group inline-flex items-center gap-2 text-sm font-medium text-stone transition-colors hover:text-ink"
        >
          <ArrowRight className="h-4 w-4 rotate-180 transition-transform duration-300 group-hover:-translate-x-1" />
          {c.backToAll}
        </Link>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-red">
              {p.zone}
            </p>
            <h1 className="mt-2 font-display text-4xl font-medium leading-[1.05] tracking-tight text-ink balance sm:text-5xl">
              {p.title}
            </h1>
          </div>
          <span className="tnum font-display text-4xl font-medium text-ink">{p.price}</span>
        </div>

        <div className="mt-8">
          <PropertyGallery images={p.gallery} title={p.title} />
        </div>
      </div>

      {/* Content + sticky card */}
      <div className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_0.8fr] lg:gap-16">
          <div>
            <h2 className="font-display text-2xl font-medium tracking-tight text-ink">
              {c.description}
            </h2>
            <div className="mt-4 flex flex-col gap-4 text-[1rem] leading-relaxed text-graphite">
              {p.description.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>

            <h2 className="mt-12 font-display text-2xl font-medium tracking-tight text-ink">
              {c.features}
            </h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-3 text-[0.95rem] text-graphite">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-soft text-red">
                    <Check className="h-3 w-3" />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Sticky card */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-[2rem] border border-line bg-cream p-7">
              <div className="flex flex-wrap gap-2">
                {p.badges.map((b) => (
                  <span
                    key={b}
                    className="rounded-full bg-paper px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-graphite"
                  >
                    {b}
                  </span>
                ))}
              </div>

              <p className="tnum mt-5 font-display text-3xl font-medium text-ink">{p.price}</p>

              <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-line pt-6">
                {specs.map((s) => (
                  <div key={s.label}>
                    <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-stone">
                      {s.label}
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-ink">{s.value}</dd>
                  </div>
                ))}
              </dl>

              <a
                href="#contatti"
                className="group mt-7 flex items-center justify-center gap-2 rounded-full bg-red py-3.5 pl-6 pr-2.5 text-sm font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-red-dark active:scale-[0.98]"
              >
                {c.requestVisit}
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </a>
              <a
                href={site.whatsapp.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center justify-center gap-2 rounded-full border border-line bg-paper py-3.5 text-sm font-semibold text-ink transition-colors hover:border-red hover:text-red"
              >
                <Whatsapp className="h-5 w-5 text-red" /> {c.whatsapp}
              </a>
            </div>
          </aside>
        </div>
      </div>

      <Contact />
    </main>
  );
}
