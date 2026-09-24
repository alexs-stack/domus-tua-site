"use client";

// CaseQuickLook — anteprima espansa di un immobile dalla griglia di ricerca:
// la foto della card "vola" (GSAP Flip) dentro un foglio-dossier centrato, con
// dati essenziali e CTA verso la scheda. Stesso documento, nessuna navigazione:
// si guarda la casa in grande senza perdere filtri e posizione nella griglia.
// - Flip con check runtime motionOk (pattern del riordino filtri in
//   PropertySearch): reduced-motion = dialog immediato, comunque completo.
// - In chiusura la foto torna alla card (Flip.fit): lo scroll è bloccato,
//   la card di partenza è garantita ancora nel viewport.
// - Dialog accessibile: focus trap, Esc, ritorno del focus al bottone sorgente,
//   overflow lock + Lenis stop/start (contratto Header/Assistant). Il riavvio
//   di Lenis rispetta l'ownership del sipario (isTransitionCovering).
// - La CTA è un <a>: la intercetta PageTransition (sipario) come ogni link.
import { useCallback, useEffect, useRef } from "react";
import { useModalBehaviour } from "./hooks/useModalBehaviour";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Flip } from "gsap/Flip";
import { Bed, Ruler, Rooms } from "./Icons";
import { Cta } from "./primitives/Cta";
import { useLocale } from "./i18n/LocaleProvider";
import { isTransitionCovering } from "./motion/PageTransition";
import { gsap, useGSAP, MQ, dur } from "../lib/motion/gsap";
import type { GridProperty } from "../lib/properties";
import { factApplies } from "../lib/propertyKind";

// Registrazione locale (come in PropertySearch): Flip non entra nel chunk del layout.
gsap.registerPlugin(Flip);

const copy = {
  it: { close: "Chiudi", goTo: "Vai alla scheda" },
  en: { close: "Close", goTo: "View the listing" },
  fr: { close: "Fermer", goTo: "Voir la fiche" },
  de: { close: "Schließen", goTo: "Zur Immobilie" },
  es: { close: "Cerrar", goTo: "Ver la ficha" },
};

/** La foto della card sorgente: stesso data-flip-id, ma senza data-ql-view. */
function findSource(slug: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    `[data-flip-id="${CSS.escape(slug)}"]:not([data-ql-view])`
  );
}

export default function CaseQuickLook({
  property,
  onClose,
}: {
  property: GridProperty | null;
  onClose: () => void;
}) {
  const { locale } = useLocale();
  const c = copy[locale];
  const rootRef = useRef<HTMLDivElement | null>(null);
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const closingRef = useRef(false);

  // Chiusura coreografata: la foto torna alla card, il foglio svanisce.
  // Fuori da useGSAP (evento-driven): check runtime, mai ritardare lo stato
  // con reduced-motion.
  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    const root = rootRef.current;
    const img = imgRef.current;
    const p = property;
    if (!root || !p || !window.matchMedia(MQ.motionOk).matches) {
      onClose();
      return;
    }
    closingRef.current = true;
    // Anche i [data-ql-fact]: il foglio e il testo svaniscono insieme (senza,
    // il testo resterebbe appeso a piena opacità sopra il backdrop morente).
    const fades = root.querySelectorAll<HTMLElement>("[data-ql-fade], [data-ql-fact]");
    const tl = gsap.timeline({ onComplete: onClose });
    tl.to(fades, { autoAlpha: 0, duration: dur.micro, ease: "power2.in" }, 0);
    const source = findSource(p.slug);
    if (img && source) {
      // Flip.fit anima SOLO transform (scale: true): la foto rientra nella card.
      const fit = Flip.fit(img, source, {
        absolute: true,
        scale: true,
        duration: 0.45,
        ease: "domus.inOut",
      });
      if (fit) tl.add(fit as gsap.core.Tween, 0);
      tl.to(img, { autoAlpha: 0, duration: 0.16, ease: "none" }, 0.32);
    } else if (img) {
      tl.to(img, { autoAlpha: 0, duration: dur.micro, ease: "power2.in" }, 0);
    }
    tl.to(backdropRef.current, { autoAlpha: 0, duration: dur.micro, ease: "none" }, 0.18);
  }, [property, onClose]);

  // Scroll bloccato, focus dentro, Esc per uscire, focus restituito a chi ha aperto.
  // La meccanica sta in ./hooks/useModalBehaviour, condivisa col dialog del video: due
  // copie di un focus trap divergono al primo ritocco. `closingRef` si azzera qui perche
  // e specifico di questo dialog (l uscita animata), non del comportamento modale.
  useEffect(() => {
    if (property) closingRef.current = false;
  }, [property]);
  useModalBehaviour({
    open: !!property,
    panelRef,
    onClose: requestClose,
    keepScrollStopped: isTransitionCovering,
  });

  // Volo di apertura: la foto della card diventa il foglio. Stati nascosti
  // impostati SOLO qui (fromTo): senza motion il dialog appare già completo.
  useGSAP(
    () => {
      const p = property;
      const root = rootRef.current;
      const backdrop = backdropRef.current;
      const img = imgRef.current;
      if (!p || !root || !backdrop || !img) return;
      if (!window.matchMedia(MQ.motionOk).matches) return;

      const fades = root.querySelectorAll<HTMLElement>("[data-ql-fade]");
      const facts = root.querySelectorAll<HTMLElement>("[data-ql-fact]");
      gsap.fromTo(backdrop, { autoAlpha: 0 }, { autoAlpha: 1, duration: dur.micro, ease: "none" });
      gsap.fromTo(
        fades,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.28, ease: "none", delay: 0.08 }
      );
      gsap.fromTo(
        facts,
        { autoAlpha: 0, y: 14 },
        { autoAlpha: 1, y: 0, duration: dur.short, ease: "domus", stagger: 0.06, delay: 0.2 }
      );
      const source = findSource(p.slug);
      if (source) {
        const state = Flip.getState(source);
        Flip.from(state, {
          targets: img,
          absolute: true,
          scale: true,
          duration: dur.short,
          ease: "domus.inOut",
          zIndex: 5,
        });
      }
    },
    { scope: rootRef, dependencies: [property?.slug ?? ""], revertOnUpdate: true }
  );

  if (!property) return null;
  const p = property;

  // Portal su body: il footer-uncover dà a <main> position:relative + z-index,
  // che intrappolerebbe il fixed del dialog nel suo stacking context (sotto il
  // banner cookie). Solo client: si apre esclusivamente da interazione.
  return createPortal(
    <div ref={rootRef} className="fixed inset-0 z-[70] grid place-items-center p-4 sm:p-8">
      {/* Backdrop: click fuori = chiudi (Esc e bottone restano le vie a11y) */}
      {/* Bg pieno, niente backdrop-blur: un blur full-viewport la cui opacità
          è animata mentre sopra vola il Flip è il costo compositor peggiore
          possibile (stessa regola del menu mobile in Header). */}
      <div
        ref={backdropRef}
        aria-hidden
        onClick={requestClose}
        className="absolute inset-0 bg-espresso/75"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={p.title}
        tabIndex={-1}
        className="relative w-full max-w-3xl outline-none"
      >
        {/* Il foglio (chrome): layer separato così la foto in volo non ne
            eredita l'opacità durante apertura/chiusura. */}
        <div
          data-ql-fade
          aria-hidden
          className="absolute inset-0 rounded-[2rem] border border-line bg-paper shadow-[var(--shadow-float)]"
        />

        <div className="relative p-3 sm:p-4">
          {/* Slot con aspect fisso: il volo (absolute) non sposta il layout */}
          <div className="relative aspect-[3/2]">
            <div
              ref={imgRef}
              data-ql-view
              data-flip-id={p.slug}
              className="absolute inset-0 overflow-hidden rounded-[1.4rem]"
            >
              <Image
                src={p.cover}
                alt={p.title}
                fill
                sizes="(max-width: 768px) 100vw, 720px"
                className="photo-warm object-cover"
              />
            </div>
          </div>

          <div className="relative px-3 pb-3 pt-5 sm:px-4 sm:pb-4 sm:pt-6">
            <p data-ql-fact className="text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-red">
              {p.zone}
            </p>
            <h3
              data-ql-fact
              className="mt-2 font-display text-2xl font-medium leading-tight tracking-tight text-ink sm:text-3xl"
            >
              {p.title}
            </h3>
            <div
              data-ql-fact
              className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.85rem] text-stone"
            >
              {/* Solo i numeri pertinenti alla categoria (vedi lib/propertyKind.ts):
                  camere fuori da un commerciale/terreno, locali fuori da un terreno. */}
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
            </div>
            <div
              data-ql-fact
              className="mt-6 flex flex-wrap items-end justify-between gap-4 border-t border-line pt-5"
            >
              <span
                className={
                  /\d/.test(p.price)
                    ? "tnum font-display text-2xl font-medium text-ink"
                    : "text-base font-semibold text-ink"
                }
              >
                {p.price}
              </span>
              <Cta href={`/case/${p.slug}`} variant="cta" size="md">
                {c.goTo}
              </Cta>
            </div>
          </div>
        </div>

        {/* Chiudi: sopra il foglio, area tap 44px */}
        <button
          ref={closeBtnRef}
          type="button"
          data-ql-fade
          onClick={requestClose}
          aria-label={c.close}
          className="absolute right-6 top-6 z-10 grid h-11 w-11 place-items-center rounded-full bg-paper/90 text-ink shadow-[0_4px_14px_-6px_rgba(26,24,22,0.5)] backdrop-blur-sm transition-all duration-300 hover:bg-red hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            className="h-[18px] w-[18px]"
            aria-hidden
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    </div>,
    document.body
  );
}
