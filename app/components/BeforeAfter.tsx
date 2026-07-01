"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import Reveal from "./Reveal";

const pairs = [
  {
    key: "living",
    label: "Living",
    before: "/images/before_after_01_living_before.jpg",
    after: "/images/before_after_02_living_after.jpg",
  },
  {
    key: "camera",
    label: "Camera",
    before: "/images/before_after_03_camera_before.jpg",
    after: "/images/before_after_04_camera_after.jpg",
  },
  {
    key: "bagno",
    label: "Bagno",
    before: "/images/before_after_05_bagno_before.jpg",
    after: "/images/before_after_06_bagno_after.jpg",
  },
];

export default function BeforeAfter() {
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

  return (
    <section className="bg-paper">
      <div className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
        <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <Reveal className="max-w-2xl">
            <span className="eyebrow">Rendering & home staging</span>
            <h2 className="mt-5 font-display text-4xl font-medium leading-[1.05] tracking-tight text-ink balance sm:text-5xl">
              Prima la immagini. Poi la vendi meglio.
            </h2>
            <p className="mt-5 max-w-lg text-[1.02rem] leading-relaxed text-stone">
              Trasformiamo il potenziale in desiderio. Trascina il cursore per vedere come un
              ambiente cambia volto, e percezione, agli occhi di chi acquista.
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
                  className={`rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-300 ${
                    active === i
                      ? "bg-red text-white"
                      : "text-graphite hover:bg-paper"
                  }`}
                >
                  {p.label}
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
                alt={`${pair.label} dopo l'intervento`}
                fill
                sizes="(max-width: 1024px) 100vw, 1180px"
                className="object-cover"
              />
              <span className="absolute right-4 top-4 rounded-full bg-red px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-white">
                Dopo
              </span>

              {/* BEFORE (sopra, clippato) */}
              <div
                className="absolute inset-0"
                style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
              >
                <Image
                  src={pair.before}
                  alt={`${pair.label} prima dell'intervento`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 1180px"
                  className="object-cover"
                />
                <span className="absolute left-4 top-4 rounded-full bg-paper/95 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-graphite shadow-[0_4px_14px_-6px_rgba(26,24,22,0.5)]">
                  Prima
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
                  aria-label={`Confronto prima e dopo: ${pair.label}. Usa le frecce per scorrere.`}
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
      </div>
    </section>
  );
}
