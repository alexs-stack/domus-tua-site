"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import PropertyLightbox from "./PropertyLightbox";
import { useLocale } from "./i18n/LocaleProvider";

const copy = {
  it: { open: (i: number) => `Apri la foto ${i} a schermo intero` },
  en: { open: (i: number) => `Open photo ${i} full screen` },
  fr: { open: (i: number) => `Ouvrir la photo ${i} en plein écran` },
  de: { open: (i: number) => `Foto ${i} im Vollbild öffnen` },
  es: { open: (i: number) => `Abrir la foto ${i} a pantalla completa` },
};

function ActiveImage({
  src,
  alt,
  preload,
}: {
  src: string;
  alt: string;
  preload: boolean;
}) {
  // Fade the main image on every SWAP without remounting: a key remount would
  // force a fresh request (and, on the first mount, a preload). Al primo
  // render l'immagine è VISIBILE (true): è la LCP della pagina — partire da
  // opacity-0 in SSR la toglieva dai candidati LCP fino all'idratazione e la
  // nascondeva del tutto senza JS. Il fade vale solo per i cambi successivi.
  const [shown, setShown] = useState(true);
  const firstRunRef = useRef(true);
  useEffect(() => {
    if (firstRunRef.current) {
      firstRunRef.current = false;
      return;
    }
    setShown(false);
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, [src]);
  return (
    <Image
      src={src}
      alt={alt}
      fill
      // Only the first/main image preloads (LCP). Later swaps load eagerly but
      // never re-request via a <head> preload. preload and loading are mutually
      // exclusive, so keep exactly one of them set.
      {...(preload ? { preload: true } : { loading: "eager" as const })}
      sizes="(max-width: 1024px) 100vw, 760px"
      className={`photo-warm object-cover transition-opacity duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
        shown ? "opacity-100" : "opacity-0"
      }`}
    />
  );
}

export default function PropertyGallery({ images, title }: { images: string[]; title: string }) {
  const { locale } = useLocale();
  const c = copy[locale];
  const [active, setActive] = useState(0);
  // Indice da cui aprire il lightbox; null = chiuso. Il componente si monta solo
  // all'apertura: chi non clicca non paga né il codice né le richieste.
  const [zoomFrom, setZoomFrom] = useState<number | null>(null);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // The main image preloads only until the visitor interacts. After the first
  // swap, subsequent main images must not re-request with a <head> preload.
  const [hasInteracted, setHasInteracted] = useState(false);

  const select = (i: number) => {
    setActive(i);
    setHasInteracted(true);
  };

  const onThumbKeyDown = (e: React.KeyboardEvent, i: number) => {
    let next: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % images.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp")
      next = (i - 1 + images.length) % images.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = images.length - 1;
    if (next === null) return;
    e.preventDefault();
    select(next);
    thumbRefs.current[next]?.focus();
  };

  return (
    <div className="rounded-[2rem] border border-line bg-cream p-2">
      {zoomFrom !== null && (
        <PropertyLightbox
          images={images}
          title={title}
          startIndex={zoomFrom}
          onClose={() => setZoomFrom(null)}
        />
      )}
      {/* Il rapporto d'aspetto è fisso e l'apertura avviene in un portal: nessun salto di
          layout quando il lightbox si apre o si chiude. */}
      <div className="relative aspect-[16/10] overflow-hidden rounded-[calc(2rem-0.5rem)]">
        {images.length > 0 && (
          <>
            <ActiveImage
              src={images[active]}
              alt={`${title} — immagine ${active + 1}`}
              preload={!hasInteracted}
            />
            {/* Un <button> e non un onClick su <div>: click, Invio e Spazio funzionano già,
                ed è raggiungibile col Tab senza aggiungere tabIndex a mano. */}
            <button
              type="button"
              onClick={() => setZoomFrom(active)}
              aria-label={c.open(active + 1)}
              data-cursor="zoom"
              className="absolute inset-0 cursor-zoom-in focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-red"
            />
          </>
        )}
        {images.length > 1 && (
          <span className="absolute bottom-3 right-3 rounded-full bg-ink/70 px-2.5 py-1 text-xs font-medium text-cream backdrop-blur-sm">
            {active + 1}/{images.length}
          </span>
        )}
      </div>
      {images.length > 1 && (
        <div
          role="tablist"
          aria-label={`${title} — galleria immagini`}
          className="mt-2 grid grid-cols-4 gap-2"
        >
          {images.map((img, i) => (
            <button
              key={img + i}
              ref={(el) => {
                thumbRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              aria-selected={active === i}
              aria-current={active === i}
              aria-label={`Foto ${i + 1}`}
              tabIndex={active === i ? 0 : -1}
              onClick={() => select(i)}
              onKeyDown={(e) => onThumbKeyDown(e, i)}
              className={`relative aspect-[4/3] overflow-hidden rounded-2xl border transition-all duration-300 ${
                active === i ? "border-red ring-2 ring-red/30" : "border-line hover:border-red/40"
              }`}
            >
              <Image
                src={img}
                alt=""
                fill
                loading="lazy"
                sizes="(max-width: 1024px) 25vw, 120px"
                className={`object-cover transition-transform duration-500 ease-soft ${active === i ? "scale-[1.06]" : "scale-100"}`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
