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
};

/**
 * Rivela un titolo parola-per-parola con risalita morbida.
 * a11y: il testo completo è esposto via aria-label; le parole sono aria-hidden.
 */
export default function WordReveal({
  text,
  as: Tag = "span",
  className = "",
  stagger = 42,
  startDelay = 0,
}: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
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
  }, []);

  const words = text.split(" ");

  return (
    <Tag
      ref={ref}
      aria-label={text}
      className={`word-reveal ${shown ? "is-in" : ""} ${className}`}
    >
      {words.map((w, i) => (
        <span
          key={i}
          aria-hidden
          className="w"
          style={{ transitionDelay: `${startDelay + i * stagger}ms` }}
        >
          {w}
        </span>
      ))}
    </Tag>
  );
}
