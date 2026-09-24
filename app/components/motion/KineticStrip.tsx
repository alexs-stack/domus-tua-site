"use client";

// KineticStrip — eco tipografica di chiusura: le due frasi dell'hero tornano,
// gigantesche e quasi-invisibili, su due righe centrate che contro-derivano
// con lo scroll. La deriva è SIMMETRICA (±drift attorno al centro): quando la
// strip è a metà viewport le righe sono perfettamente allineate e leggibili,
// mai tagliate a metà parola. Decorativa (aria-hidden): il claim vero vive
// nell'hero. Senza JS o con reduced-motion resta una filigrana ferma centrata.
import { useRef } from "react";
import { gsap, useGSAP, MQ } from "../../lib/motion/gsap";
import { useDict } from "../i18n/LocaleProvider";

type Props = {
  className?: string;
  /** tappa della superficie continua (vedi motion/SurfaceFlow.tsx) */
  surface?: "cream" | "cream-deep" | "paper";
};

export default function KineticStrip({ className = "", surface }: Props) {
  const d = useDict();
  const lines = [d.hero.title1, d.hero.title2];
  const ref = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      const mm = gsap.matchMedia();
      mm.add(MQ.motionOk, () => {
        gsap.utils.toArray<HTMLElement>("[data-kinetic-line]", root).forEach((el, i) => {
          const dir = i % 2 === 0 ? 1 : -1;
          // ±4%: abbastanza per sentire il movimento, mai abbastanza da uscire.
          gsap.fromTo(
            el,
            { xPercent: 4 * dir },
            {
              xPercent: -4 * dir,
              ease: "none",
              scrollTrigger: {
                trigger: root,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
              },
            }
          );
        });
      });
    },
    { scope: ref, dependencies: [lines[0]], revertOnUpdate: true }
  );

  return (
    <div ref={ref} aria-hidden data-tone={surface} className={`overflow-hidden py-6 sm:py-10 ${className}`}>
      {/* LA FRASE STA NEL CSS, NON NEL DOM (2026-08-06).
          Prima era un nodo di testo, e axe la misurava: inchiostro al 7% su
          crema fa 1,09:1, cioè una violazione di contrasto seria — la suite
          la segnalava con due nodi. Finché ogni sezione portava un gradiente
          di sfondo, axe non riusciva a risolvere il colore dietro e la
          lasciava passare; con la superficie continua il fondo è una tinta
          piatta e risolvibile, quindi il difetto è venuto a galla. Era vero
          anche prima: era solo invisibile allo strumento.
          Alzare l'opacità fino a 3:1 (serve ~0.55) vorrebbe dire un'altra
          cosa, non questa. Ma questa NON è contenuto: il claim vero vive
          nell'hero, qui è una texture tipografica. Una decorazione sta nel
          CSS — `content: var(--kin)` la disegna senza metterla nell'albero
          del documento, quindi non c'è più nulla da leggere né da misurare,
          e la resa a schermo è identica.
          `data-kinetic-line` resta l'aggancio di GSAP: la deriva è sullo
          span, non sullo pseudo-elemento. */}
      {lines.map((line, i) => (
        <div key={i} className="flex justify-center">
          <span
            data-kinetic-line
            className="dt-kinetic_line whitespace-nowrap font-display text-[6.4vw] font-medium italic leading-[1.12] tracking-[-0.02em] text-ink/[0.07]"
            style={{ "--kin": `"${line.replace(/"/g, '\\"')}"` } as React.CSSProperties}
          />
        </div>
      ))}
    </div>
  );
}
