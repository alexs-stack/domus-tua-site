"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import Reveal from "./Reveal";
import { ArrowUpRight, Check } from "./Icons";
import { useLocale } from "./i18n/LocaleProvider";

const pairs = [
  {
    key: "living",
    labelKey: "tabLiving",
    before: "/images/before_after_01_living_before.jpg",
    after: "/images/before_after_02_living_after.jpg",
  },
  {
    key: "camera",
    labelKey: "tabCamera",
    before: "/images/before_after_03_camera_before.jpg",
    after: "/images/before_after_04_camera_after.jpg",
  },
  {
    key: "bagno",
    labelKey: "tabBagno",
    before: "/images/before_after_05_bagno_before.jpg",
    after: "/images/before_after_06_bagno_after.jpg",
  },
] as const;

const copy = {
  it: {
    eyebrow: "Rendering & home staging",
    title: "Prima l’immagine. Poi la vendi meglio.",
    subcopy:
      "Trasformiamo il potenziale in desiderio. Trascina il cursore per vedere come un ambiente cambia volto, e percezione, agli occhi di chi acquista.",
    tabLiving: "Living",
    tabCamera: "Camera",
    tabBagno: "Bagno",
    badgeBefore: "Prima",
    badgeAfter: "Dopo",
    altBefore: (label: string) => `${label} prima dell'intervento`,
    altAfter: (label: string) => `${label} dopo l'intervento`,
    sliderAria: (label: string) =>
      `Confronto prima e dopo: ${label}. Usa le frecce per scorrere.`,
    value1: "Prima impressione più forte",
    value2: "Più interesse qualificato",
    value3: "Meno tempo sul mercato",
    cta: "Scopri come valorizziamo il tuo immobile",
  },
  en: {
    eyebrow: "Rendering & home staging",
    title: "First we make it look its best. Then it sells better.",
    subcopy:
      "We turn potential into desire. Drag the slider to see how a room changes its look, and how buyers perceive it.",
    tabLiving: "Living",
    tabCamera: "Bedroom",
    tabBagno: "Bathroom",
    badgeBefore: "Before",
    badgeAfter: "After",
    altBefore: (label: string) => `${label} before the makeover`,
    altAfter: (label: string) => `${label} after the makeover`,
    sliderAria: (label: string) =>
      `Before and after comparison: ${label}. Use the arrow keys to slide.`,
    value1: "A stronger first impression",
    value2: "More qualified interest",
    value3: "Less time on the market",
    cta: "See how we bring out the best in your property",
  },
  fr: {
    eyebrow: "Rendu & home staging",
    title: "On la sublime d'abord. On la vend mieux ensuite.",
    subcopy:
      "Nous transformons le potentiel en désir. Faites glisser le curseur pour voir comment une pièce change de visage, et de perception, aux yeux des acheteurs.",
    tabLiving: "Séjour",
    tabCamera: "Chambre",
    tabBagno: "Salle de bain",
    badgeBefore: "Avant",
    badgeAfter: "Après",
    altBefore: (label: string) => `${label} avant les travaux`,
    altAfter: (label: string) => `${label} après les travaux`,
    sliderAria: (label: string) =>
      `Comparaison avant et après : ${label}. Utilisez les flèches pour faire défiler.`,
    value1: "Une première impression plus forte",
    value2: "Un intérêt plus qualifié",
    value3: "Moins de temps sur le marché",
    cta: "Découvrez comment nous valorisons votre bien",
  },
  de: {
    eyebrow: "Rendering & Home Staging",
    title: "Erst inszenieren. Dann besser verkaufen.",
    subcopy:
      "Wir verwandeln Potenzial in Begehren. Ziehen Sie den Regler, um zu sehen, wie ein Raum sein Gesicht verändert, und wie Käufer ihn wahrnehmen.",
    tabLiving: "Wohnbereich",
    tabCamera: "Schlafzimmer",
    tabBagno: "Bad",
    badgeBefore: "Vorher",
    badgeAfter: "Nachher",
    altBefore: (label: string) => `${label} vor der Umgestaltung`,
    altAfter: (label: string) => `${label} nach der Umgestaltung`,
    sliderAria: (label: string) =>
      `Vorher-Nachher-Vergleich: ${label}. Mit den Pfeiltasten verschieben.`,
    value1: "Ein stärkerer erster Eindruck",
    value2: "Mehr qualifiziertes Interesse",
    value3: "Weniger Zeit auf dem Markt",
    cta: "Entdecken Sie, wie wir Ihre Immobilie aufwerten",
  },
  es: {
    eyebrow: "Renderizado & home staging",
    title: "Primero la realzamos. Después se vende mejor.",
    subcopy:
      "Convertimos el potencial en deseo. Arrastra el control deslizante para ver cómo un ambiente cambia de aspecto, y de percepción, a ojos de quien compra.",
    tabLiving: "Salón",
    tabCamera: "Dormitorio",
    tabBagno: "Baño",
    badgeBefore: "Antes",
    badgeAfter: "Después",
    altBefore: (label: string) => `${label} antes de la intervención`,
    altAfter: (label: string) => `${label} después de la intervención`,
    sliderAria: (label: string) =>
      `Comparación antes y después: ${label}. Usa las flechas para desplazar.`,
    value1: "Una primera impresión más fuerte",
    value2: "Más interés cualificado",
    value3: "Menos tiempo en el mercado",
    cta: "Descubre cómo revalorizamos tu inmueble",
  },
} as const;

export default function BeforeAfter() {
  const { locale } = useLocale();
  const c = copy[locale];

  const [active, setActive] = useState(0);
  const [pos, setPos] = useState(52);
  const ref = useRef<HTMLDivElement | null>(null);
  const dragging = useRef(false);

  const updateFromClientX = useCallback((clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const next = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(2, Math.min(98, next)));
  }, []);

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      setPos((p) => Math.max(2, p - 4));
      e.preventDefault();
    } else if (e.key === "ArrowRight") {
      setPos((p) => Math.min(98, p + 4));
      e.preventDefault();
    } else if (e.key === "Home") {
      setPos(2);
      e.preventDefault();
    } else if (e.key === "End") {
      setPos(98);
      e.preventDefault();
    }
  }, []);

  const pair = pairs[active];
  const activeLabel = c[pair.labelKey];

  return (
    <section className="bg-paper">
      <div className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
        <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <Reveal className="max-w-2xl">
            <span className="eyebrow">{c.eyebrow}</span>
            <h2 className="mt-5 font-display text-4xl font-medium leading-[1.05] tracking-tight text-ink balance sm:text-5xl">
              {c.title}
            </h2>
            <p className="mt-5 max-w-lg text-[1.02rem] leading-relaxed text-stone">
              {c.subcopy}
            </p>
          </Reveal>

          {/* Tabs */}
          <Reveal delay={100}>
            <div className="flex gap-2 rounded-full border border-line bg-cream p-1.5">
              {pairs.map((p, i) => (
                <button
                  key={p.key}
                  onClick={() => {
                    setActive(i);
                    setPos(52);
                  }}
                  className={`rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red ${
                    active === i
                      ? "bg-red text-white"
                      : "text-graphite hover:bg-paper"
                  }`}
                >
                  {c[p.labelKey]}
                </button>
              ))}
            </div>
          </Reveal>
        </div>

        <Reveal className="mt-12">
          <div className="rounded-[2rem] border border-line bg-cream p-2">
            <div
              ref={ref}
              className="relative aspect-[3/2] w-full cursor-ew-resize touch-none select-none overflow-hidden rounded-[calc(2rem-0.5rem)]"
              onPointerDown={(e) => {
                dragging.current = true;
                (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
                updateFromClientX(e.clientX);
              }}
              onPointerMove={(e) => {
                if (dragging.current) updateFromClientX(e.clientX);
              }}
              onPointerUp={() => (dragging.current = false)}
              onPointerLeave={() => (dragging.current = false)}
            >
              {/* AFTER (sotto) */}
              <Image
                src={pair.after}
                alt={c.altAfter(activeLabel)}
                fill
                sizes="(max-width: 1024px) 100vw, 1180px"
                className="object-cover"
              />
              <span className="absolute right-4 top-4 rounded-full bg-red px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-white">
                {c.badgeAfter}
              </span>

              {/* BEFORE (sopra, clippato) */}
              <div
                className="absolute inset-0"
                style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
              >
                <Image
                  src={pair.before}
                  alt={c.altBefore(activeLabel)}
                  fill
                  sizes="(max-width: 1024px) 100vw, 1180px"
                  className="object-cover"
                />
                <span className="absolute left-4 top-4 rounded-full bg-paper/95 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-graphite shadow-[0_4px_14px_-6px_rgba(26,24,22,0.5)]">
                  {c.badgeBefore}
                </span>
              </div>

              {/* Handle */}
              <div
                className="pointer-events-none absolute inset-y-0 z-10 w-0.5 bg-cream"
                style={{ left: `${pos}%` }}
              >
                <div
                  role="slider"
                  tabIndex={0}
                  aria-label={c.sliderAria(activeLabel)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(pos)}
                  onKeyDown={onKeyDown}
                  className="pointer-events-auto absolute top-1/2 left-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full border border-line bg-paper shadow-[0_10px_30px_-12px_rgba(26,24,22,0.6)]"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-graphite" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M9 7 4 12l5 5M15 7l5 5-5 5" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal className="mt-8 flex flex-col items-start justify-between gap-6 border-t border-line pt-8 sm:flex-row sm:items-center">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {[c.value1, c.value2, c.value3].map(
              (b) => (
                <li key={b} className="flex items-center gap-2 text-sm text-graphite">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-soft text-red-dark">
                    <Check className="h-3 w-3" />
                  </span>
                  {b}
                </li>
              )
            )}
          </ul>
          <Link
            href="/vendi"
            className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-red py-3 pl-6 pr-2.5 text-sm font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-red-dark active:scale-[0.98]"
          >
            {c.cta}
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
