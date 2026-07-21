"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** ritardo in ms per effetto staggered */
  delay?: number;
  as?: ElementType;
  id?: string;
};

/**
 * Wrapper che rivela il contenuto con fade-up (opacity + translate modesto) all'ingresso nel
 * viewport. Usa IntersectionObserver (no scroll listener) — performante anche su mobile.
 * Il blur è opt-in solo per i momenti firma: passare className="reveal-cinematic".
 */
export default function Reveal({
  children,
  className = "",
  delay = 0,
  as: Tag = "div",
  id,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShown(true);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    // Rete di sicurezza: se l'observer non scatta mai (blocco più alto del viewport,
    // errore di layout), rivela comunque il contenuto per non lasciarlo invisibile.
    const safety = window.setTimeout(() => setShown(true), 2500);
    return () => {
      io.disconnect();
      window.clearTimeout(safety);
    };
  }, []);

  return (
    <Tag
      ref={ref}
      id={id}
      className={`reveal ${shown ? "is-in" : ""} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
