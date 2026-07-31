"use client";

import { useEffect, useRef, useState, type ElementType } from "react";

type Props = {
  text: string;
  as?: ElementType;
  className?: string;
  /** ritardo tra una parola e l'altra (ms) */
  stagger?: number;
  /** ritardo iniziale prima della prima parola (ms) */
  startDelay?: number;
  /** Above-the-fold (es. H1 hero): mostra subito il testo (SSR visibile) per non ritardare l'LCP. */
  immediate?: boolean;
};

/**
 * Rivela un titolo parola-per-parola con risalita morbida.
 * a11y: il testo completo vive in una copia solo-per-screen-reader; le parole animate sono
 * aria-hidden. NON si usa aria-label: su uno <span> (ruolo generico) è un attributo vietato —
 * lo segnala axe come violazione seria e alcune tecnologie assistive lo ignorano comunque.
 */
export default function WordReveal({
  text,
  as: Tag = "span",
  className = "",
  stagger = 42,
  startDelay = 0,
  immediate = false,
}: Props) {
  const ref = useRef<HTMLElement | null>(null);
  // In modalità `immediate` il testo è già "is-in" al primo render (anche in SSR):
  // resta leggibile subito, senza attendere l'IntersectionObserver, e non ritarda l'LCP.
  const [shown, setShown] = useState(immediate);

  useEffect(() => {
    if (immediate) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setShown(true);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -6% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [immediate]);

  const words = text.split(" ");

  return (
    <Tag ref={ref} className={`word-reveal ${shown ? "is-in" : ""} ${className}`}>
      {/* Il titolo per chi legge con uno screen reader: una frase sola, non una parola per volta. */}
      <span className="sr-only">{text}</span>
      {/* Spazio REALE dopo ogni parola: con gli span inline (mobile, vedi
          globals.css) è l'unica opportunità di a-capo del titolo, e sostituisce
          il vecchio margin-right anche nel layout animato. */}
      {words.map((w, i) => (
        <span key={i} aria-hidden>
          <span className="w" style={{ transitionDelay: `${startDelay + i * stagger}ms` }}>
            {w}
          </span>{" "}
        </span>
      ))}
    </Tag>
  );
}
