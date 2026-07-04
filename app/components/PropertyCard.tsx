"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowUpRight, Bed, Ruler, Rooms, Check } from "./Icons";
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
    share: "Condividi",
    shared: "Link copiato",
  },
  en: {
    cta: "Discover the home",
    forSale: "For sale",
    forRent: "For rent",
    share: "Share",
    shared: "Link copied",
  },
  fr: {
    cta: "Découvrir la maison",
    forSale: "À vendre",
    forRent: "À louer",
    share: "Partager",
    shared: "Lien copié",
  },
  de: {
    cta: "Das Zuhause entdecken",
    forSale: "Zu verkaufen",
    forRent: "Zu vermieten",
    share: "Teilen",
    shared: "Link kopiert",
  },
  es: {
    cta: "Descubre la casa",
    forSale: "En venta",
    forRent: "En alquiler",
    share: "Compartir",
    shared: "Enlace copiado",
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
  const [copied, setCopied] = useState(false);

  // Mostriamo al massimo 2 badge sull'immagine, dando priorità a quelli "forti"
  // (accento rosso) senza riordinare gli altri. Non aggiungiamo mai badge nuovi.
  const shownBadges = [...p.badges]
    .sort((a, b) => Number(strongBadges.has(b)) - Number(strongBadges.has(a)))
    .slice(0, 2);

  // Condivisione: Web Share API dove disponibile, altrimenti copia il link negli appunti.
  async function handleShare() {
    const url =
      typeof window !== "undefined" ? `${window.location.origin}/case/${p.slug}` : `/case/${p.slug}`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: p.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Utente ha annullato o API non disponibile: nessun errore visibile.
    }
  }

  // Card con "stretched link": il contenitore è un <div>, la CTA porta un ::after che
  // copre tutta la card (l'intera card è cliccabile), mentre il pulsante Condividi vive
  // sopra (z-10) come vero <button>, senza annidare interattivi dentro un <a>.
  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-line bg-paper transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1.5 hover:border-red/20 hover:shadow-[var(--shadow-card-hover)]">
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

        {/* Condividi — vero pulsante sopra lo stretched link (z-10), area tap 44px */}
        <button
          type="button"
          onClick={handleShare}
          aria-label={copied ? c.shared : c.share}
          className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-full bg-paper/90 text-ink shadow-[0_4px_14px_-6px_rgba(26,24,22,0.5)] backdrop-blur-sm transition-all duration-300 hover:bg-red hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
        >
          {copied ? (
            <Check className="h-[18px] w-[18px]" />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]" aria-hidden>
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
            </svg>
          )}
        </button>

        {/* Badge dal gestionale (Open Domus, Documenti verificati, In evidenza…) */}
        {shownBadges.length > 0 && (
          <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
            {shownBadges.map((b) => (
              <Badge
                key={b}
                variant="onImage"
                className={
                  strongBadges.has(b)
                    ? "bg-red text-white shadow-[0_4px_14px_-6px_rgba(26,24,22,0.5)]"
                    : ""
                }
              >
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
        <h3 className="mt-2 line-clamp-2 max-w-[88%] font-display text-2xl font-medium leading-tight tracking-tight text-ink">
          {p.title}
        </h3>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.82rem] text-stone">
          {p.sqm !== "—" && (
            <span className="tnum inline-flex items-center gap-1.5">
              <Ruler className="h-4 w-4 text-graphite" /> {p.sqm}
            </span>
          )}
          {p.rooms !== "—" && (
            <span className="tnum inline-flex items-center gap-1.5">
              <Rooms className="h-4 w-4 text-graphite" /> {p.rooms}
            </span>
          )}
          {p.beds !== "—" && (
            <span className="tnum inline-flex items-center gap-1.5">
              <Bed className="h-4 w-4 text-graphite" /> {p.beds}
            </span>
          )}
          {p.baths !== "—" && (
            <span className="tnum inline-flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-graphite/50" aria-hidden /> {p.baths}
            </span>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between gap-4 border-t border-line pt-5">
          <span
            className={
              /\d/.test(p.price)
                ? "tnum font-display text-2xl font-medium text-ink"
                : "text-base font-semibold text-ink"
            }
          >
            {p.price}
          </span>
          {/* CTA = stretched link: il ::after copre l'intera card */}
          <a
            href={`/case/${p.slug}`}
            aria-label={`${c.cta}: ${p.title}`}
            className="inline-flex items-center gap-2 text-[0.8rem] font-semibold text-graphite transition-colors duration-300 after:absolute after:inset-0 after:content-[''] group-hover:text-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
          >
            {c.cta}
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cream-deep text-ink transition-all duration-300 group-hover:bg-red group-hover:text-white">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}
