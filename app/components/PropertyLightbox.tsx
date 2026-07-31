"use client";

// PropertyLightbox — la fotografia dell'immobile a schermo intero.
//
// Nessun cambio di art direction della scheda: è un overlay che si apre da un gesto e si
// chiude senza lasciare traccia. Convenzioni prese dal dialog già in casa (CaseQuickLook):
// portal su body, lock dello scroll con stop/start di Lenis, focus trap, ritorno del focus
// alla foto da cui si è partiti.
//
// Scelte volute:
//  • `createPortal` su body — `<main>` riceve position/z-index dal footer-uncover e
//    intrappolerebbe un `fixed` nel proprio stacking context (stesso motivo di CaseQuickLook);
//  • solo l'immagine corrente è montata, più un PRECARICAMENTO della sola successiva: con
//    trenta foto montarle tutte significherebbe trenta richieste e trenta nodi;
//  • nessun WebGL, nessuna libreria: transizioni CSS, disattivate con reduced-motion;
//  • lo swipe è su pointer event nativi — nessun hijack dello scroll, la pagina sotto è
//    comunque bloccata mentre l'overlay è aperto.

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, Close } from "./Icons";
import { useLocale } from "./i18n/LocaleProvider";
import { getLenis } from "./motion/SmoothScroll";
import { isTransitionCovering } from "./motion/PageTransition";
import { isDisplayableImage } from "../lib/images";

const copy = {
  it: {
    dialogTitle: (title: string) => `Fotografie di ${title}`,
    close: "Chiudi la galleria",
    prev: "Foto precedente",
    next: "Foto successiva",
    counter: (i: number, n: number) => `Immagine ${i} di ${n}`,
    thumbs: "Vai alla foto",
    broken: "Questa fotografia non è disponibile.",
  },
  en: {
    dialogTitle: (title: string) => `Photos of ${title}`,
    close: "Close the gallery",
    prev: "Previous photo",
    next: "Next photo",
    counter: (i: number, n: number) => `Image ${i} of ${n}`,
    thumbs: "Go to photo",
    broken: "This photo is not available.",
  },
  fr: {
    dialogTitle: (title: string) => `Photos de ${title}`,
    close: "Fermer la galerie",
    prev: "Photo précédente",
    next: "Photo suivante",
    counter: (i: number, n: number) => `Image ${i} sur ${n}`,
    thumbs: "Aller à la photo",
    broken: "Cette photo n'est pas disponible.",
  },
  de: {
    dialogTitle: (title: string) => `Fotos von ${title}`,
    close: "Galerie schließen",
    prev: "Vorheriges Foto",
    next: "Nächstes Foto",
    counter: (i: number, n: number) => `Bild ${i} von ${n}`,
    thumbs: "Zum Foto",
    broken: "Dieses Foto ist nicht verfügbar.",
  },
  es: {
    dialogTitle: (title: string) => `Fotos de ${title}`,
    close: "Cerrar la galería",
    prev: "Foto anterior",
    next: "Foto siguiente",
    counter: (i: number, n: number) => `Imagen ${i} de ${n}`,
    thumbs: "Ir a la foto",
    broken: "Esta foto no está disponible.",
  },
};

/** Distanza minima di uno swipe perché conti come cambio foto (px). */
const SWIPE_THRESHOLD = 48;

/**
 * Quante miniature tenere nel DOM attorno a quella corrente, per lato.
 *
 * Serve davvero: nel feed reale c'è una scheda con 71 fotografie, e una striscia completa
 * significherebbe 71 nodi `next/image` montati all'apertura del dialog. Con questa finestra
 * restano al massimo 17, la striscia resta utile e scorre insieme alla foto corrente.
 */
const THUMB_WINDOW = 8;

export default function PropertyLightbox({
  images,
  title,
  startIndex,
  onClose,
}: {
  /** Immagini della scheda, già filtrate: solo sorgenti consentite. */
  images: string[];
  title: string;
  /** Foto da cui aprire. */
  startIndex: number;
  onClose: () => void;
}) {
  const { locale } = useLocale();
  const c = copy[locale];

  // Anche se una sorgente non consentita arrivasse fin qui per un errore a monte, in grande
  // non la apriamo: il lightbox mostra solo ciò che il sito può servire.
  const safeImages = images.filter(isDisplayableImage);
  const total = safeImages.length;

  const [index, setIndex] = useState(() => Math.min(Math.max(startIndex, 0), Math.max(total - 1, 0)));
  const [broken, setBroken] = useState<Record<number, boolean>>({});

  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);

  const go = useCallback(
    (delta: number) => {
      if (total < 2) return;
      setIndex((i) => (i + delta + total) % total);
    },
    [total],
  );

  // ── Lock dello scroll + focus, per la durata dell'overlay ─────────────────────────────
  useEffect(() => {
    restoreRef.current = document.activeElement as HTMLElement | null;
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    getLenis()?.stop();
    // Il pannello ha tabIndex -1: riceve il focus senza dipendere da un bottone che potrebbe
    // essere ancora in transizione.
    panelRef.current?.focus();
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
      if (!isTransitionCovering()) getLenis()?.start();
      const target = restoreRef.current;
      if (target && document.contains(target)) target.focus();
    };
  }, []);

  // ── Tastiera: Escape, frecce, Home/End, e trap del Tab dentro il pannello ─────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        go(1);
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(-1);
        return;
      }
      if (e.key === "Home") {
        e.preventDefault();
        setIndex(0);
        return;
      }
      if (e.key === "End") {
        e.preventDefault();
        setIndex(Math.max(total - 1, 0));
        return;
      }
      if (e.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>('button:not([disabled]), [tabindex]:not([tabindex="-1"])'),
      ).filter((el) => el.offsetParent !== null);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (e.shiftKey) {
        if (active === first || !panel.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last || !panel.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [go, onClose, total]);

  if (total === 0) return null;

  const current = safeImages[index];
  // Precarica SOLO la successiva: con molte foto montarle tutte sarebbe una richiesta per foto.
  const nextSrc = total > 1 ? safeImages[(index + 1) % total] : null;

  // Finestra di miniature attorno alla corrente (mai tutta la galleria nel DOM).
  const thumbStart = Math.max(0, Math.min(index - THUMB_WINDOW, total - THUMB_WINDOW * 2 - 1));
  const thumbs = safeImages
    .map((src, i) => ({ src, i }))
    .slice(thumbStart, thumbStart + THUMB_WINDOW * 2 + 1);

  // ── Swipe orizzontale (mobile) ────────────────────────────────────────────────────────
  // Pointer event nativi: nessuna libreria, nessun hijack dello scroll. Uno swipe più
  // verticale che orizzontale non cambia foto (è il gesto per chiudere/tornare del sistema).
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse") return;
    pointerStart.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const start = pointerStart.current;
    pointerStart.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) <= Math.abs(dy)) return;
    go(dx < 0 ? 1 : -1);
  };

  return createPortal(
    <div
      // Fondo PIENO, non velato: con un velo semitrasparente la pagina sotto resta leggibile e
      // compete con la fotografia — che è l'unica cosa per cui si apre questo overlay.
      className="fixed inset-0 z-[80] flex flex-col bg-espresso"
      // 100dvh + safe area: su mobile la barra del browser non deve mai coprire la foto
      // né il bottone di chiusura.
      style={{
        height: "100dvh",
        paddingTop: "max(env(safe-area-inset-top), 0.75rem)",
        paddingBottom: "max(env(safe-area-inset-bottom), 0.75rem)",
        paddingLeft: "max(env(safe-area-inset-left), 0.75rem)",
        paddingRight: "max(env(safe-area-inset-right), 0.75rem)",
      }}
    >
      {/* Backdrop cliccabile: chiude. Esc e il bottone restano le vie accessibili. */}
      <button
        type="button"
        aria-hidden
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={c.dialogTitle(title)}
        tabIndex={-1}
        className="relative flex min-h-0 flex-1 flex-col outline-none"
      >
        {/* Barra: contatore a sinistra, chiusura a destra. Sempre raggiungibile. */}
        <div className="flex shrink-0 items-center justify-between gap-3">
          <p className="rounded-full bg-cream/10 px-3.5 py-2 text-sm font-medium text-cream">
            {c.counter(index + 1, total)}
          </p>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={c.close}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-cream/10 text-cream transition-colors duration-300 hover:bg-cream/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream"
          >
            <Close className="h-5 w-5" />
          </button>
        </div>

        {/* Stato annunciabile dagli screen reader a ogni cambio foto. */}
        <p aria-live="polite" className="sr-only">
          {c.counter(index + 1, total)}
        </p>

        {/* Palcoscenico. `min-h-0` + `flex-1`: l'immagine si adatta all'altezza disponibile
            senza spingere fuori barra e miniature — nessun salto di layout. */}
        <div
          className="relative min-h-0 flex-1 select-none"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => (pointerStart.current = null)}
        >
          {/* Precaricamento della SOLA foto successiva. Passa da next/image, così l'URL
              scaricato è esattamente quello che servirà al prossimo scatto (un <link
              rel="preload"> punterebbe alla sorgente non ottimizzata, cioè a un'altra
              risorsa). Invisibile e fuori dal flusso: nessun impatto sul layout. */}
          {nextSrc && (
            <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 opacity-0">
              <Image src={nextSrc} alt="" fill sizes="100vw" className="object-contain" />
            </div>
          )}

          {broken[index] ? (
            <div className="flex h-full items-center justify-center px-6 text-center text-cream/80">
              {c.broken}
            </div>
          ) : (
            <Image
              key={current}
              src={current}
              // Alt non inventato: lo stesso schema della galleria in pagina — titolo reale
              // dell'annuncio e posizione della foto, nessuna descrizione dedotta.
              alt={`${title} — immagine ${index + 1}`}
              fill
              sizes="100vw"
              priority
              onError={() => setBroken((b) => ({ ...b, [index]: true }))}
              className="object-contain motion-safe:transition-opacity motion-safe:duration-200"
            />
          )}

          {total > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label={c.prev}
                className="absolute left-1 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-espresso/70 text-cream transition-colors duration-300 hover:bg-espresso focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream sm:left-3"
              >
                <ArrowRight className="h-5 w-5 rotate-180" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label={c.next}
                className="absolute right-1 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-espresso/70 text-cream transition-colors duration-300 hover:bg-espresso focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream sm:right-3"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        {/* Miniature: solo quando servono davvero (più di una foto) e solo da tablet in su —
            su mobile lo spazio verticale va alla fotografia. Finestra scorrevole attorno
            alla corrente: vedi THUMB_WINDOW. */}
        {total > 1 && (
          <div className="mt-3 hidden shrink-0 gap-2 overflow-x-auto pb-1 sm:flex">
            {thumbs.map(({ src, i }) => (
              <button
                key={`${src}-${i}`}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`${c.thumbs} ${i + 1}`}
                aria-current={i === index}
                className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border transition-opacity duration-300 ${
                  i === index ? "border-cream opacity-100" : "border-cream/25 opacity-60 hover:opacity-100"
                }`}
              >
                <Image src={src} alt="" fill loading="lazy" sizes="96px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

    </div>,
    document.body,
  );
}
