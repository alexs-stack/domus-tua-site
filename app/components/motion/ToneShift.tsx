"use client";

/* ═══════════════════════════════════════════════════════════════════════════
   TONESHIFT — la cucitura fra due colori di fondo (2026-08-06).

   PROBLEMA: la home cambia tono cinque volte. Ogni cambio disegnava una linea
   orizzontale netta: il taglio che rompe lo scroll immersivo.

   SOLUZIONE: al confine non c'è più un bordo ma un ORIZZONTE che passa. Il
   colore in arrivo sale dal basso col bordo curvato dall'ARCO RIBASSATO della
   cupola di HorizonStory (raggi ellittici 50vw × 22vh) e continua a salire
   finché la curva esce sopra e il colore copre piatto.

   Perché quell'arco e non quello del preloader: la porta stretta del
   preloader/sipario è un gesto di passaggio fra ROUTE, e alla scala di un
   confine di sezione risultava piccola — a metà corsa diventava comunque una
   banda piatta larga quasi tutto il viewport, quindi la porta non si leggeva
   mai. L'arco ribassato è invece già il modo in cui questo sito fa salire una
   pagina sopra un'altra, ed è quello che il cliente ha indicato.

   Una sola transform su un pannello: niente maschere, niente clip, niente
   ridisegno di mask-position. Il sipario fra route resta com'è: questo vive
   solo dentro la pagina.

   Progressive enhancement: senza JS o con reduced-motion il blocco è una
   sfumatura verticale piena fra i due toni. [data-on] arriva solo da JS.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP, MQ } from "../../lib/motion/gsap";

export type Tone = "cream" | "cream-deep" | "paper" | "espresso" | "wine" | "graphite";

/** Eccedenza del pannello oltre il blocco, in frazione di viewport: deve
    coprire i 22vh dell'arco più un margine, altrimenti a fine corsa la curva
    resterebbe dentro il blocco e il colore non chiuderebbe piatto. */
const OVERSHOOT = 0.3;

export default function ToneShift({
  from,
  to,
  className = "",
}: {
  /** tono della sezione che finisce */
  from: Tone;
  /** tono della sezione che comincia */
  to: Tone;
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      const panel = root?.querySelector<HTMLElement>("[data-ts-in]");
      if (!root || !panel) return;

      const mm = gsap.matchMedia();
      mm.add(MQ.motionOk, () => {
        root.setAttribute("data-on", "");
        const extra = () => window.innerHeight * OVERSHOOT;

        // Valori a funzione: le altezze sono in svh e il blocco cambia con la
        // viewport, quindi vanno ricalcolati a ogni refresh.
        const tween = gsap.fromTo(
          panel,
          { y: () => root.offsetHeight + extra() },
          {
            y: () => -extra(),
            ease: "none",
            scrollTrigger: {
              trigger: root,
              // Comincia appena il blocco affaccia e finisce quando è ancora a
              // mezzo schermo: l'orizzonte ha già finito di passare prima che
              // l'occhio arrivi al fondo del blocco.
              start: "top 98%",
              end: "bottom 42%",
              scrub: 0.5,
              invalidateOnRefresh: true,
            },
          }
        );

        // Il will-change vive solo mentre il passaggio è in scena.
        const live = ScrollTrigger.create({
          trigger: root,
          start: "top bottom",
          end: "bottom top",
          onToggle: (self) =>
            self.isActive ? root.setAttribute("data-live", "") : root.removeAttribute("data-live"),
        });

        return () => {
          root.removeAttribute("data-on");
          root.removeAttribute("data-live");
          tween.scrollTrigger?.kill();
          tween.kill();
          live.kill();
        };
      });
    },
    { scope: rootRef }
  );

  return (
    <div
      ref={rootRef}
      aria-hidden
      className={`dt-toneshift ${className}`}
      style={
        {
          "--ts-from": `var(--color-${from})`,
          "--ts-to": `var(--color-${to})`,
          // Luce d'apertura della sezione che arriva: .bg-paper la porta già
          // quasi bianca e il pannello la eguaglia da solo, i toni cream no.
          "--ts-bloom": to === "cream" || to === "cream-deep" ? 0.7 : 0,
        } as React.CSSProperties
      }
    >
      <div data-ts-in className="dt-toneshift_in" />
    </div>
  );
}
