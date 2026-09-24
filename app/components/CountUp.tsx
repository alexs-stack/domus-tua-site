"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
  /** Raggruppa le migliaia (es. 269395 → "269.395"). Off di default per non toccare gli altri usi. */
  group?: boolean;
  /** Locale BCP-47 per il raggruppamento (es. "it-IT"). Usato solo se group=true. */
  locale?: string;
};

/**
 * Conta da 0 al valore quando entra in vista. Replay a ogni passaggio
 * (richiesta cliente): l'observer accende e spegne, così il conteggio riparte
 * a ogni rientro nel viewport; all'uscita reset istantaneo al valore pieno —
 * un numero che scorre all'indietro è solo rumore.
 * Rispetta prefers-reduced-motion mostrando subito il valore finale.
 */
export default function CountUp({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  duration = 1500,
  className = "",
  group = false,
  locale,
}: Props) {
  const ref = useRef<HTMLSpanElement | null>(null);
  // SSR/no-JS mostra il valore REALE (SEO: il rating non deve mai apparire "0.0");
  // il conteggio 0→valore parte solo quando l'observer scatta nel browser.
  const [display, setDisplay] = useState(value);

  const format = (n: number) =>
    group
      ? n.toLocaleString(locale, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      : n.toFixed(decimals);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Lo stato iniziale è già il valore finale: con reduced-motion non c'è nulla da fare.
    if (reduce) return;

    let raf = 0;
    const run = () => {
      cancelAnimationFrame(raf);
      let start = 0;
      const tick = (t: number) => {
        if (!start) start = t;
        const p = Math.min((t - start) / duration, 1);
        // ease-out-expo
        const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
        setDisplay(value * eased);
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    // Replay a ogni passaggio (richiesta cliente): niente unobserve —
    // a ogni ingresso il conteggio riparte da 0, all'uscita reset istantaneo
    // al valore pieno (lo stato di riposo, identico all'SSR).
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            run();
          } else {
            cancelAnimationFrame(raf);
            setDisplay(value);
          }
        });
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, duration]);

  return (
    <span ref={ref} className={`tnum ${className}`}>
      {prefix}
      {format(display)}
      {suffix}
    </span>
  );
}
