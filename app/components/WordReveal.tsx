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
  /** Meccanica per-parola anche sotto i 768px. Il default è `true` dall'onda
      «parità mobile 2» (verdetto 8, PORT): lo stesso titolo fa lo stesso gesto
      a ogni larghezza. L'onda precedente (fase 2b, 2026-08-11) lo teneva a
      `false` con opt-in al punto di chiamata, e la ragione era l'LCP: la
      meccanica spezza il titolo in N span `inline-block`, e Chromium aggrega i
      candidati LCP di testo per containing block — un titolo spezzato non è
      più UN candidato grande, sono N frammenti minuscoli che perdono contro
      qualunque paragrafo montato dopo (è successo all'H1 dell'hero,
      docs/wow-layer-plan.md:178). Quella ragione resta vera, ma la risponde
      `immediate`, non la larghezza: un titolo che sulla sua rotta può essere
      candidato LCP passa `immediate` (SSR visibile, nessuna meccanica, a ogni
      larghezza); tutti gli altri — l'unico chiamante oggi è l'<h2> di
      #candidatura, ultima sezione di /lavora-con-noi — hanno la meccanica sul
      telefono come sul desktop. `mobile={false}` resta possibile per un titolo
      che sotto 768 sale in cima alla pagina senza esserlo sopra: la ragione va
      scritta accanto. Chi aggiunge un chiamante above-the-fold passa
      `immediate`, non toglie `mobile`. */
  mobile?: boolean;
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
  mobile = true,
}: Props) {
  const ref = useRef<HTMLElement | null>(null);
  // In modalità `immediate` il testo è già "is-in" al primo render (anche in SSR):
  // resta leggibile subito, senza attendere l'IntersectionObserver, e non ritarda l'LCP.
  const [shown, setShown] = useState(immediate);

  useEffect(() => {
    if (immediate) return;
    const el = ref.current;
    if (!el) return;
    // Replay a ogni passaggio (anche scroll inverso): l'osservatore accende e
    // spegne, il titolo rigioca ogni volta che rientra nel viewport.
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => setShown(e.isIntersecting));
      },
      { threshold: 0.2, rootMargin: "0px 0px -6% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [immediate]);

  const words = text.split(" ");

  // `immediate` vince su `mobile` (che ora è `true` di default): la prima dice
  // "sono above-the-fold", e se un titolo lo è il telefono resta senza
  // meccanica, perché i due errori non costano uguale: sbagliare verso il
  // titolo intero costa un'animazione, sbagliare nell'altro verso costa il
  // candidato LCP della rotta. L'attributo è la porta che apre il ramo < 768
  // in globals.css; sopra 768 il ramo è aperto dal solo `.word-reveal`.
  const splitOnPhone = mobile && !immediate;

  return (
    <Tag
      ref={ref}
      className={`word-reveal ${shown ? "is-in" : ""} ${className}`}
      data-wr-mobile={splitOnPhone ? "" : undefined}
    >
      {/* Il titolo per chi legge con uno screen reader: una frase sola, non una parola per volta. */}
      <span className="sr-only">{text}</span>
      {/* Spazio REALE dopo ogni parola: è l'unica opportunità di a-capo del
          titolo (sostituisce il vecchio margin-right) e vale in tutti e tre gli
          stati di globals.css — parole inline, parole inline-block, senza JS —
          perché lo spazio è un nodo di testo FUORI da .w. */}
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
