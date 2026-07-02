"use client";

import Image from "next/image";
import { ArrowUpRight, Bed, Ruler, Rooms } from "./Icons";
import Badge from "./primitives/Badge";
import { SegnoDomusCorner } from "./BrandMotif";
import { useLocale } from "./i18n/LocaleProvider";
import type { Property } from "../lib/properties";

// Etichette statiche del componente (CTA + badge). I VALORI dei dati immobile
// (zona, prezzo, m², badge dal gestionale) NON vengono tradotti: arrivano da RealSmart.
const copy = {
  it: {
    cta: "Scopri la casa",
    forSale: "In vendita",
    forRent: "In affitto",
  },
  en: {
    cta: "Discover the home",
    forSale: "For sale",
    forRent: "For rent",
  },
  fr: {
    cta: "Découvrir la maison",
    forSale: "À vendre",
    forRent: "À louer",
  },
  de: {
    cta: "Das Zuhause entdecken",
    forSale: "Zu verkaufen",
    forRent: "Zu vermieten",
  },
  es: {
    cta: "Descubre la casa",
    forSale: "En venta",
    forRent: "En alquiler",
  },
};

// Badge "forti" (accento rosso) vs neutri. Riconosce le proposte curate senza
// inventare dati: se il badge non è nell'elenco, resta neutro. I badge arrivano
// da p.badges — non ne aggiungiamo mai di nuovi.
const strongBadges = new Set([
  "In esclusiva",
  "In evidenza",
  "Nuova proposta",
  "Sotto proposta",
]);

export default function PropertyCard({ p }: { p: Property }) {
  const { locale } = useLocale();
  const c = copy[locale];
  const statusLabel = p.status === "Affitto" ? c.forRent : c.forSale;

  return (
    <a
      href={`/case/${p.slug}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-line bg-paper transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1.5 hover:border-red/20 hover:shadow-[var(--shadow-card-hover)]"
    >
      {/* Immagine più grande e curata */}
      <div className="relative aspect-[3/2] overflow-hidden">
        <Image
          src={p.cover}
          alt={p.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 420px"
          className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
        />
        {/* Velo per leggibilità delle pill e senso di selezione */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/25 via-transparent to-transparent" />

        {/* Stato immobile (vendita/affitto) — dato reale */}
        <div className="absolute left-4 top-4">
          <Badge variant="onImage">{statusLabel}</Badge>
        </div>

        {/* Badge dal gestionale (Open Domus, Documenti verificati, In evidenza…) */}
        {p.badges.length > 0 && (
          <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
            {p.badges.map((b) => (
              <Badge key={b} variant="onImage" className={strongBadges.has(b) ? "bg-red text-white" : ""}>
                {b}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Corpo card con firma Segno Domus */}
      <div className="relative flex flex-1 flex-col p-6 sm:p-7">
        <SegnoDomusCorner className="right-4 top-5 opacity-60" rotate={90} />

        <p className="text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-red">{p.zone}</p>
        <h3 className="mt-2 max-w-[88%] font-display text-2xl font-medium leading-tight tracking-tight text-ink">
          {p.title}
        </h3>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.82rem] text-stone">
          <span className="tnum inline-flex items-center gap-1.5" aria-label={p.sqm}>
            <Ruler className="h-4 w-4 text-graphite" /> {p.sqm}
          </span>
          <span className="tnum inline-flex items-center gap-1.5" aria-label={p.rooms}>
            <Rooms className="h-4 w-4 text-graphite" /> {p.rooms}
          </span>
          <span className="tnum inline-flex items-center gap-1.5" aria-label={p.beds}>
            <Bed className="h-4 w-4 text-graphite" /> {p.beds}
          </span>
          <span className="tnum inline-flex items-center gap-1.5" aria-label={p.baths}>
            <span className="h-1 w-1 rounded-full bg-graphite/50" aria-hidden /> {p.baths}
          </span>
        </div>

        <div className="mt-auto flex items-end justify-between gap-4 border-t border-line pt-5">
          <span className="tnum font-display text-2xl font-medium text-ink">{p.price}</span>
          <span className="inline-flex items-center gap-2 text-[0.8rem] font-semibold text-graphite transition-colors duration-300 group-hover:text-red">
            {c.cta}
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cream-deep text-ink transition-all duration-300 group-hover:bg-red group-hover:text-white">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </span>
        </div>
      </div>
    </a>
  );
}
