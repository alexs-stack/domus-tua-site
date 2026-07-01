"use client";

import Link from "next/link";
import Image from "next/image";
import PropertyGallery from "../../components/PropertyGallery";
import Contact from "../../components/Contact";
import { SegnoDomusBadge, SegnoDomusCorner, SegnoDomusDivider } from "../../components/BrandMotif";
import { ArrowRight, ArrowUpRight, Check, Whatsapp } from "../../components/Icons";
import { site } from "../../lib/site";
import type { Property } from "../../lib/properties";
import { useLocale } from "../../components/i18n/LocaleProvider";

const copy = {
  it: {
    backToAll: "Tutte le case",
    keyFacts: "Dati principali",
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
    safetyEyebrow: "Domus D.O.C.",
    safetyTitle: "Una casa verificata, prima ancora di entrare.",
    safetyText:
      "Questo immobile segue il protocollo Domus di Origine Certificata: documenti, conformità e trasparenza controllati prima della vendita. Così visiti e scegli con serenità, senza sorprese.",
    safetyLink: "Scopri il protocollo Domus D.O.C.",
    safetyPoints: ["Documenti in ordine", "Conformità controllata", "Trasparenza pre-visita"],
    related: "Altre case da scoprire",
    viewAll: "Vedi tutte le case",
  },
  en: {
    backToAll: "All properties",
    keyFacts: "Key facts",
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
    safetyEyebrow: "Domus D.O.C.",
    safetyTitle: "A verified home, before you even step inside.",
    safetyText:
      "This property follows the Domus of Certified Origin protocol: documents, compliance and transparency checked before the sale. So you view and choose with peace of mind, no surprises.",
    safetyLink: "Discover the Domus D.O.C. protocol",
    safetyPoints: ["Documents in order", "Compliance checked", "Pre-visit transparency"],
    related: "More homes to discover",
    viewAll: "View all properties",
  },
  fr: {
    backToAll: "Tous les biens",
    keyFacts: "Données clés",
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
    safetyEyebrow: "Domus D.O.C.",
    safetyTitle: "Un logement vérifié, avant même d’entrer.",
    safetyText:
      "Ce bien suit le protocole Domus d’Origine Certifiée : documents, conformité et transparence contrôlés avant la vente. Vous visitez et choisissez en toute sérénité, sans surprises.",
    safetyLink: "Découvrir le protocole Domus D.O.C.",
    safetyPoints: ["Documents en ordre", "Conformité contrôlée", "Transparence avant visite"],
    related: "D’autres biens à découvrir",
    viewAll: "Voir tous les biens",
  },
  de: {
    backToAll: "Alle Immobilien",
    keyFacts: "Eckdaten",
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
    safetyEyebrow: "Domus D.O.C.",
    safetyTitle: "Eine geprüfte Immobilie, noch bevor Sie eintreten.",
    safetyText:
      "Diese Immobilie folgt dem Protokoll Domus di Origine Certificata: Unterlagen, Konformität und Transparenz werden vor dem Verkauf geprüft. So besichtigen und entscheiden Sie mit Ruhe, ohne Überraschungen.",
    safetyLink: "Das Protokoll Domus D.O.C. entdecken",
    safetyPoints: ["Unterlagen in Ordnung", "Konformität geprüft", "Transparenz vor der Besichtigung"],
    related: "Weitere Immobilien entdecken",
    viewAll: "Alle Immobilien ansehen",
  },
  es: {
    backToAll: "Todas las propiedades",
    keyFacts: "Datos principales",
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
    safetyEyebrow: "Domus D.O.C.",
    safetyTitle: "Una casa verificada, antes incluso de entrar.",
    safetyText:
      "Esta propiedad sigue el protocolo Domus di Origine Certificata: documentos, conformidad y transparencia comprobados antes de la venta. Así visitas y eliges con tranquilidad, sin sorpresas.",
    safetyLink: "Descubre el protocolo Domus D.O.C.",
    safetyPoints: ["Documentos en orden", "Conformidad comprobada", "Transparencia previa a la visita"],
    related: "Más casas por descubrir",
    viewAll: "Ver todas las casas",
  },
};

// ⚠️ DATI DEMO / FIXTURE — `p` e `related` arrivano dalla facciata getVisibleListing/
// getVisibleListings (oggi fixture demo, domani RealSmart). Qui nessun dato viene
// inventato: la striscia "related" è opzionale e, se assente, mostra solo il link a /case.
export default function PropertyDetail({ p, related }: { p: Property; related?: Property[] }) {
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

  // Related: solo altre case fornite via props (stessa sorgente). Mai fetch/invenzione.
  const relatedItems = (related ?? []).filter((r) => r.slug !== p.slug).slice(0, 3);

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

        {/* Gallery hero */}
        <div className="mt-8">
          <PropertyGallery images={p.gallery} title={p.title} />
        </div>

        {/* Key facts strip sotto la gallery */}
        <div className="mt-6 overflow-x-auto">
          <dl className="flex min-w-max gap-8 rounded-[1.75rem] border border-line bg-cream px-7 py-5 sm:min-w-0 sm:justify-between">
            {specs.map((s) => (
              <div key={s.label} className="shrink-0">
                <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-stone">
                  {s.label}
                </dt>
                <dd className="tnum mt-1 font-display text-lg font-medium text-ink">{s.value}</dd>
              </div>
            ))}
          </dl>
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

            {/* Blocco sicurezza / documenti — legato a Domus D.O.C. */}
            <div className="relative mt-12 overflow-hidden rounded-[2rem] border border-line bg-cream p-7 sm:p-9">
              <SegnoDomusCorner className="right-5 top-5 opacity-70" rotate={90} size={30} />
              <SegnoDomusBadge>{c.safetyEyebrow}</SegnoDomusBadge>
              <h3 className="mt-4 max-w-xl font-display text-2xl font-medium leading-snug tracking-tight text-ink balance">
                {c.safetyTitle}
              </h3>
              <p className="mt-3 max-w-xl text-[0.98rem] leading-relaxed text-graphite">
                {c.safetyText}
              </p>
              <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
                {c.safetyPoints.map((point) => (
                  <li key={point} className="inline-flex items-center gap-2 text-[0.9rem] text-ink">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-soft text-red">
                      <Check className="h-3 w-3" />
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
              <Link
                href="/metodo"
                className="group mt-6 inline-flex items-center gap-2 text-sm font-semibold text-red transition-colors hover:text-red-dark"
              >
                {c.safetyLink}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
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

      {/* Related properties strip (solo se fornite via props) o link a /case */}
      <section className="mx-auto max-w-[1240px] px-5 pb-4 sm:px-8">
        <SegnoDomusDivider className="mb-12" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="font-display text-2xl font-medium tracking-tight text-ink sm:text-3xl">
            {c.related}
          </h2>
          <Link
            href="/case"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-red transition-colors hover:text-red-dark"
          >
            {c.viewAll}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>

        {relatedItems.length > 0 && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedItems.map((r) => (
              <Link
                key={r.slug}
                href={`/case/${r.slug}`}
                className="group flex flex-col overflow-hidden rounded-[1.75rem] border border-line bg-paper transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:border-red/20 hover:shadow-[0_36px_70px_-52px_rgba(26,24,22,0.5)]"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={r.cover}
                    alt={r.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
                    className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                  />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-red">
                    {r.zone}
                  </p>
                  <h3 className="mt-1.5 font-display text-lg font-medium leading-tight tracking-tight text-ink">
                    {r.title}
                  </h3>
                  <span className="tnum mt-auto pt-4 font-display text-xl font-medium text-ink">
                    {r.price}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <Contact />
    </main>
  );
}
