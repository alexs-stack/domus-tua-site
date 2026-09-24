"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ArrowRight } from "./Icons";

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

/**
 * Freccia della galleria. Una sola forma per i quattro usi (foto avanti/indietro,
 * nastro avanti/indietro): cambia solo il verso e la posizione.
 *
 * 44×44 pieni: è la misura minima di un bersaglio touch, e queste frecce vivono
 * sopra una fotografia — un bersaglio piccolo su un fondo mosso si manca.
 */
function GalleryArrow({
  direction,
  label,
  onClick,
  disabled,
  className = "",
}: {
  direction: "prev" | "next";
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`grid h-11 w-11 place-items-center rounded-full border border-line bg-paper/90 text-ink shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-red/40 hover:bg-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red disabled:pointer-events-none disabled:opacity-0 ${className}`}
    >
      <ArrowRight
        className={`h-4 w-4 ${direction === "prev" ? "rotate-180" : ""}`}
        aria-hidden
      />
    </button>
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
  const railRef = useRef<HTMLDivElement | null>(null);
  // Id unici (più gallerie sulla stessa pagina non si calpestano gli aria-*).
  const uid = useId();
  const panelId = `${uid}-panel`;
  const tabId = (i: number) => `${uid}-tab-${i}`;
  const hasThumbs = images.length > 1;

  // The main image preloads only until the visitor interacts. After the first
  // swap, subsequent main images must not re-request with a <head> preload.
  const [hasInteracted, setHasInteracted] = useState(false);

  // Il nastro può scorrere ancora a sinistra / a destra? Serve a spegnere le
  // frecce quando non c'è più corsa: una freccia che non fa niente è peggio di
  // una freccia assente, perché il dito ci torna sopra.
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const misuraCorsa = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    // 1px di tolleranza: su alcuni zoom scrollWidth e clientWidth differiscono
    // di una frazione anche quando il nastro è tutto visibile.
    setCanScrollLeft(rail.scrollLeft > 1);
    setCanScrollRight(rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    misuraCorsa();
    rail.addEventListener("scroll", misuraCorsa, { passive: true });
    // Anche il RIDIMENSIONAMENTO cambia la corsa: da desktop a mobile il nastro
    // passa da scorrevole a fermo (o viceversa) senza che nessuno scrolli.
    const ro = new ResizeObserver(misuraCorsa);
    ro.observe(rail);
    return () => {
      rail.removeEventListener("scroll", misuraCorsa);
      ro.disconnect();
    };
  }, [misuraCorsa]);

  const select = (i: number) => {
    setActive(i);
    setHasInteracted(true);
  };

  /**
   * Foto precedente/successiva, in cerchio: dall'ultima si torna alla prima.
   *
   * Aggiornamento FUNZIONALE, non `select(active + delta)`. Con la seconda
   * forma il valore di `active` è quello catturato dal render corrente: chi
   * preme la freccia dodici volte in fretta fa dodici volte `0 + 1`, React
   * accorpa gli aggiornamenti e la galleria avanza di UNA foto sola. Misurato:
   * 12 clic → indice 1. Con l'updater ogni clic parte dal valore precedente.
   */
  const step = (delta: number) => {
    if (images.length === 0) return;
    setActive((a) => (a + delta + images.length) % images.length);
    setHasInteracted(true);
  };

  /**
   * Porta il nastro a una posizione. Tre trappole, tutte misurate su questa pagina:
   *
   * 1. NIENTE `scrollIntoView`: scorre anche gli antenati, e su una scheda immobile
   *    lunga farebbe saltare la PAGINA a ogni cambio foto.
   * 2. NIENTE `behavior: "smooth"`: su questo sito è INERTE. Lenis (lo smooth scroll
   *    globale) lo intercetta, e la misura è netta — `scrollTo({left: 3000, behavior:
   *    "smooth"})` lascia il nastro a 0, mentre `scrollLeft = 3000` arriva a 3000.
   *    Lo scorrimento morbido lo dà il CSS (`scroll-behavior` in .dt-gallery-rail),
   *    che è dichiarativo e non passa da Lenis.
   * 3. `getBoundingClientRect`, non `offsetLeft`: il nastro è `position: static`,
   *    quindi l'offsetParent delle miniature è il wrapper, non lui. Con offsetLeft
   *    il conto è giusto per caso finché wrapper e nastro cominciano alla stessa x.
   */
  // `useCallback`: l'effetto che insegue la miniatura attiva la usa, e una
  // funzione ricreata a ogni render lo farebbe ripartire a ogni render.
  const portaNastroA = useCallback((left: number) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollLeft = Math.max(0, Math.min(left, rail.scrollWidth - rail.clientWidth));
    // Si RIMISURA la corsa a mano dopo aver mosso il nastro, invece di aspettare
    // che lo faccia l'ascoltatore di `scroll`. Con `scroll-behavior: smooth` la
    // posizione finale arriva a animazione conclusa, e l'ultimo evento utile può
    // non arrivare mai: misurato, il nastro era a fondo corsa (5090) mentre la
    // freccia «indietro» risultava ancora spenta — un controllo che mente sullo
    // stato in cui si trova. Due colpi: il frame dopo, e a animazione finita.
    requestAnimationFrame(misuraCorsa);
    window.setTimeout(misuraCorsa, 450);
  }, [misuraCorsa]);

  // La miniatura attiva si porta in vista da sola — ma SOLO se è uscita di vista.
  // Centrarla a ogni clic farebbe ballare il nastro anche quando si sfogliano due
  // foto vicine, che è il caso normale: si muove quando serve, e allora si nota.
  useEffect(() => {
    const rail = railRef.current;
    const el = thumbRefs.current[active];
    if (!rail || !el) return;
    const rr = rail.getBoundingClientRect();
    const er = el.getBoundingClientRect();
    if (er.left >= rr.left - 1 && er.right <= rr.right + 1) return;
    portaNastroA(rail.scrollLeft + (er.left - rr.left) - (rail.clientWidth - er.width) / 2);
  }, [active, portaNastroA]);

  /** Scorre il nastro di circa una schermata, come il Pag↓ di un elenco. */
  const scorriNastro = (delta: number) => {
    const rail = railRef.current;
    if (!rail) return;
    portaNastroA(rail.scrollLeft + delta * rail.clientWidth * 0.8);
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
      {/* Contenitore relativo: le frecce della foto grande stanno FUORI dal
          tabpanel, non dentro. Il pannello resta puro — è quello che axe
          ispeziona nella suite, e infilarci dei controlli lo sporcherebbe. */}
      <div className="relative">
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
          <>
            <GalleryArrow
              direction="prev"
              label="Foto precedente"
              onClick={() => step(-1)}
              className="absolute left-3 top-1/2 -translate-y-1/2"
            />
            <GalleryArrow
              direction="next"
              label="Foto successiva"
              onClick={() => step(1)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            />
          </>
        )}
      </div>

      {hasThumbs && (
        // Il nastro e le sue frecce. Le frecce sono SORELLE del tablist, non
        // figlie: dentro un `role="tablist"` ci vanno solo i tab, e un bottone
        // qualunque lì dentro è una violazione che axe segnala.
        <div className="relative mt-2">
          <div
            ref={railRef}
            role="tablist"
            aria-label={`${title} — galleria immagini`}
            // `scroll-px` e `snap-x`: la miniatura si ferma allineata invece di
            // restare tagliata a metà. `scrollbar-none` perché la barra di
            // sistema su Windows è alta e spezzerebbe il ritmo delle immagini;
            // la corsa resta evidente dalle frecce e dal taglio dell'ultima.
            className="dt-gallery-rail flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-px-2"
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
                // Larghezza FISSA: con 77 foto una griglia a 4 colonne stampava
                // venti righe di miniature sotto la foto grande. Il nastro ne
                // mostra quante ne stanno e le altre le tiene in corsa.
                className={`relative aspect-[4/3] w-28 shrink-0 snap-start overflow-hidden rounded-2xl border transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red sm:w-32 ${
                  active === i ? "border-red ring-2 ring-red/30" : "border-line hover:border-red/40"
                }`}
              >
                <Image
                  src={img}
                  alt=""
                  fill
                  loading="lazy"
                  sizes="128px"
                  className={`object-cover transition-transform duration-500 ease-soft ${active === i ? "scale-[1.06]" : "scale-100"}`}
                />
              </button>
            ))}
          </div>

          <GalleryArrow
            direction="prev"
            label="Scorri le miniature indietro"
            onClick={() => scorriNastro(-1)}
            disabled={!canScrollLeft}
            className="absolute left-1 top-1/2 -translate-y-1/2"
          />
          <GalleryArrow
            direction="next"
            label="Scorri le miniature avanti"
            onClick={() => scorriNastro(1)}
            disabled={!canScrollRight}
            className="absolute right-1 top-1/2 -translate-y-1/2"
          />
        </div>
      )}
    </div>
  );
}
