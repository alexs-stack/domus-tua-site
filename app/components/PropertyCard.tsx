"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowUpRight, Bed, Ruler, Rooms, Check } from "./Icons";
import { useLocale } from "./i18n/LocaleProvider";
import type { GridProperty } from "../lib/properties";
import { isResidential, factApplies } from "../lib/propertyKind";

// Etichette statiche del componente (CTA + badge). I VALORI dei dati immobile
// (zona, prezzo, m², badge dal gestionale) NON vengono tradotti: arrivano da RealSmart.
//
// Due CTA, e la scelta è semantica: `cta` con «casa» solo per gli immobili
// abitativi; `ctaProperty`, neutra, per commerciale e terreno — un negozio o un
// capannone non è una casa e non va invitato come tale (traduzioni neutre e
// accurate, non copy definitivo del cliente).
const copy = {
  it: {
    cta: "Scopri la casa",
    ctaProperty: "Scopri l'immobile",
    forSale: "In vendita",
    forRent: "In affitto",
    share: "Condividi",
    shared: "Link copiato",
    quickLook: "Anteprima",
  },
  en: {
    cta: "Discover the home",
    ctaProperty: "Discover the property",
    forSale: "For sale",
    forRent: "For rent",
    share: "Share",
    shared: "Link copied",
    quickLook: "Quick look",
  },
  fr: {
    cta: "Découvrir la maison",
    ctaProperty: "Découvrir le bien",
    forSale: "À vendre",
    forRent: "À louer",
    share: "Partager",
    shared: "Lien copié",
    quickLook: "Aperçu",
  },
  de: {
    cta: "Das Zuhause entdecken",
    ctaProperty: "Die Immobilie entdecken",
    forSale: "Zu verkaufen",
    forRent: "Zu vermieten",
    share: "Teilen",
    shared: "Link kopiert",
    quickLook: "Vorschau",
  },
  es: {
    cta: "Descubre la casa",
    ctaProperty: "Descubre el inmueble",
    forSale: "En venta",
    forRent: "En alquiler",
    share: "Compartir",
    shared: "Enlace copiado",
    quickLook: "Vista previa",
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
  "Venduto",
  "Affittato",
]);

export default function PropertyCard({
  p,
  onQuickLook,
}: {
  p: GridProperty;
  /** Se presente, mostra il bottone Anteprima (Flip verso CaseQuickLook). */
  onQuickLook?: () => void;
}) {
  const { locale } = useLocale();
  const c = copy[locale];
  const statusLabel = p.status === "Affitto" ? c.forRent : c.forSale;
  // CTA neutra fuori dal residenziale: un commerciale/terreno non è «casa».
  const ctaLabel = isResidential(p.type) ? c.cta : c.ctaProperty;
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

  // Scheda con "stretched link": il contenitore è un <div>, la CTA porta un ::after che
  // copre tutta la scheda (l'intera scheda è cliccabile), mentre il pulsante Condividi vive
  // sopra (z-10) come vero <button>, senza annidare interattivi dentro un <a>.
  // 2026-09-10: niente card, foto 4:3 squadrata, badge come righe di testo sotto la foto.
  return (
    <div data-cursor="scopri" className="group relative flex h-full flex-col">
      {/* Niente parallax qui: in griglie da 24+ schede il costo (uno ScrollTrigger
          scrub + upscale permanente per scheda) non vale un movimento di ~2px; lo zoom
          hover resta l'accento motion.
          data-flip-id: sorgente del volo verso CaseQuickLook (match per slug). */}
      <div data-flip-id={p.slug} className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={p.cover}
          alt={p.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 420px"
          className="object-cover transition-transform duration-[1600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
        />

        {/* Condividi — vero pulsante sopra lo stretched link (z-10), area tap 44px */}
        <button
          type="button"
          onClick={handleShare}
          aria-label={copied ? c.shared : c.share}
          className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-full bg-paper text-ink transition-all duration-300 hover:bg-red hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
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

        {/* Anteprima — apre CaseQuickLook (Flip): vero pulsante sopra lo
            stretched link, come Condividi. Solo dove la griglia lo abilita. */}
        {onQuickLook && (
          <button
            type="button"
            onClick={onQuickLook}
            aria-haspopup="dialog"
            aria-label={`${c.quickLook}: ${p.title}`}
            className="absolute bottom-4 right-4 z-10 grid h-11 w-11 place-items-center rounded-full bg-paper text-ink transition-all duration-300 hover:bg-red hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-[18px] w-[18px]"
              aria-hidden
            >
              <path d="M15 3h6v6" />
              <path d="M9 21H3v-6" />
              <path d="M21 3l-7 7" />
              <path d="M3 21l7-7" />
            </svg>
          </button>
        )}

      </div>

      {/* Corpo della scheda: sotto la foto, testo e vuoto. */}
      <div className="relative flex flex-1 flex-col pt-5">
        {/* Stato (vendita/affitto, dato reale) + badge dal gestionale (Open Domus,
            Documenti verificati, In evidenza…) come righe di testo, mai sopra la foto. */}
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-ui font-semibold uppercase tracking-[0.08em] text-graphite">
          <span>{statusLabel}</span>
          {shownBadges.map((b) => (
            <span key={b} className={strongBadges.has(b) ? "text-red" : ""}>
              {b}
            </span>
          ))}
        </p>

        <p className="mt-3 text-ui font-semibold uppercase tracking-[0.08em] text-red">{p.zone}</p>
        <h3 className="mt-2 line-clamp-2 font-display text-d4 uppercase text-ink">{p.title}</h3>

        {/* Solo i numeri pertinenti alla categoria E davvero presenti: camere e
            bagni non compaiono su un commerciale o un terreno, i locali non su
            un terreno. La superficie vale ovunque. Vedi lib/propertyKind.ts. */}
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-body text-graphite">
          {p.sqm !== "—" && (
            <span className="tnum inline-flex items-center gap-1.5">
              <Ruler className="h-4 w-4 text-graphite" /> {p.sqm}
            </span>
          )}
          {p.rooms !== "—" && factApplies(p.type, "rooms") && (
            <span className="tnum inline-flex items-center gap-1.5">
              <Rooms className="h-4 w-4 text-graphite" /> {p.rooms}
            </span>
          )}
          {p.beds !== "—" && factApplies(p.type, "beds") && (
            <span className="tnum inline-flex items-center gap-1.5">
              <Bed className="h-4 w-4 text-graphite" /> {p.beds}
            </span>
          )}
          {p.baths !== "—" && factApplies(p.type, "baths") && (
            <span className="tnum inline-flex items-center gap-1.5">
              <span aria-hidden>·</span> {p.baths}
            </span>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between gap-4 border-t border-line pt-5">
          <span
            className={
              /\d/.test(p.price)
                ? "tnum font-display text-d3 text-ink"
                : "text-body font-semibold text-ink"
            }
          >
            {p.price}
          </span>
          {/* CTA = stretched link: il ::after copre l'intera scheda */}
          <a
            href={`/case/${p.slug}`}
            aria-label={`${ctaLabel}: ${p.title}`}
            className="inline-flex items-center gap-2 text-ui font-semibold uppercase tracking-[0.08em] text-graphite underline underline-offset-4 transition-colors duration-300 after:absolute after:inset-0 after:content-[''] group-hover:text-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
          >
            {ctaLabel}
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
