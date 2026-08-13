"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";

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

export default function PropertyGallery({
  images,
  title,
  principalAlt,
}: {
  images: string[];
  title: string;
  /**
   * Alt DESCRITTIVO della foto principale (indice 0), costruito da campi
   * VERIFICATI dell'annuncio (titolo, zona) da chi conosce l'immobile — mai
   * dedotto dal nome file né generato a runtime. Le altre foto non sono
   * descrivibili senza inventare, quindi hanno un alt posizionale onesto.
   */
  principalAlt?: string;
}) {
  const [active, setActive] = useState(0);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);
  // Id unici (più gallerie sulla stessa pagina non si calpestano gli aria-*).
  const uid = useId();
  const panelId = `${uid}-panel`;
  const tabId = (i: number) => `${uid}-tab-${i}`;
  const hasThumbs = images.length > 1;

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

  // La foto principale (indice 0) porta l'alt descrittivo verificato; le altre
  // non sono descrivibili senza inventare, quindi restano posizionali e oneste.
  const mainAlt =
    active === 0 && principalAlt
      ? principalAlt
      : `${title} — foto ${active + 1} di ${images.length}`;

  return (
    <div className="rounded-[2rem] border border-line bg-cream p-2">
      <div
        // Con le miniature è il pannello dei "tab": lo etichetta il tab attivo,
        // ed è raggiungibile da tastiera (tabIndex 0) dopo la fila di miniature,
        // così chi naviga a tastiera può fermarsi sull'immagine. Con una sola
        // foto non c'è tablist: niente ruolo, resta un contenitore normale.
        {...(hasThumbs
          ? { role: "tabpanel", id: panelId, "aria-labelledby": tabId(active), tabIndex: 0 }
          : {})}
        className="relative aspect-[16/10] overflow-hidden rounded-[calc(2rem-0.5rem)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
      >
        {images.length > 0 && (
          <ActiveImage src={images[active]} alt={mainAlt} preload={!hasInteracted} />
        )}
        {hasThumbs && (
          // Indicatore di posizione puramente visivo: lo stato lo dà già
          // `aria-selected` sul tab, quindi qui è aria-hidden (niente "1 / 8").
          <span
            aria-hidden
            className="absolute bottom-3 right-3 rounded-full bg-ink/70 px-2.5 py-1 text-xs font-medium text-cream backdrop-blur-sm"
          >
            {active + 1}/{images.length}
          </span>
        )}
      </div>
      {hasThumbs && (
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
              id={tabId(i)}
              aria-controls={panelId}
              aria-selected={active === i}
              // Nome accessibile del controllo → la miniatura sotto resta muta
              // (alt=""): è un DUPLICATO della foto grande, non un'immagine a sé.
              aria-label={`Foto ${i + 1} di ${images.length}`}
              tabIndex={active === i ? 0 : -1}
              onClick={() => select(i)}
              onKeyDown={(e) => onThumbKeyDown(e, i)}
              className={`relative aspect-[4/3] overflow-hidden rounded-2xl border transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red ${
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
