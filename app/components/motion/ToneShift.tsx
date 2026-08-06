"use client";

/* ═══════════════════════════════════════════════════════════════════════════
   TONESHIFT — LA CUPOLA (2026-08-06, riscritto).

   PROBLEMA: la home cambia tono più volte. Ogni cambio disegnava una linea
   orizzontale netta — il taglio che rompe lo scroll immersivo.

   PRIMA c'erano cinque meccanismi diversi (arco, telescopio, iride, tenda,
   nebbia), nella convinzione che ripetere lo stesso gesto fosse un tic.
   Sbagliato due volte:
     · il taglio si vedeva lo stesso, perché un commento aperto dentro una
       lista di selettori riduceva il pannello a 140×68px: nessuna variante
       copriva davvero la giuntura (da lì anche la "pillola bianca");
     · era-residence — la reference — usa LO STESSO arco due volte in home
       (§1.2 del dossier: `.section.arch{border-top-*-radius:50rem}`). Un
       gesto ripetuto è un linguaggio; cinque gesti diversi sono cinque
       eccezioni.

   ORA un solo gesto, che è anche la forma del marchio (due archi che fanno
   un cuore): il colore in arrivo sale da sotto dentro una CUPOLA, il filo
   rosso cuce la curva partendo dalla chiave d'arco e il monogramma viaggia
   nella chiave. Il confine fra due capitoli disegna il logo, non una riga.

   Il bus è una sola custom property (--tsp, 0→1) scritta per frame: tutte le
   trasformazioni sono derivate in calc() dal CSS (vedi globals.css, blocco
   "LA CUPOLA"). L'ease si applica al progresso GREZZO, non come ease di un
   tween: è la curva che tiene il gesto morbido agli estremi.

   Progressive enhancement: senza JS o con reduced-motion --tsp non esiste, il
   pannello resta a opacity 0 e il blocco è una sfumatura verticale piena fra
   i due toni — mai un taglio. [data-on] arriva solo da JS.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP, MQ } from "../../lib/motion/gsap";

export type Tone = "cream" | "cream-deep" | "paper" | "espresso" | "wine" | "graphite";

export default function ToneShift({
  from,
  to,
  /** profondità della cupola: quanto è alta la curva. */
  depth = "20svh",
  className = "",
}: {
  /** tono della sezione che finisce */
  from: Tone;
  /** tono della sezione che comincia */
  to: Tone;
  depth?: string;
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const mm = gsap.matchMedia();
      mm.add(MQ.motionOk, () => {
        root.setAttribute("data-on", "");

        // Comincia appena il blocco affaccia e finisce quando la giuntura è
        // ARRIVATA DAVVERO, cioè a due terzi di schermo — non quando è ancora
        // un viewport più in basso. Con "bottom bottom" il gesto si chiudeva
        // prestissimo e restava da attraversare un blocco di colore piatto,
        // letto come fretta.
        const ease = gsap.parseEase("power1.inOut");
        const trigger = ScrollTrigger.create({
          trigger: root,
          start: "top 98%",
          end: "bottom 62%",
          scrub: 0.5,
          invalidateOnRefresh: true,
          onUpdate: (self) => root.style.setProperty("--tsp", String(ease(self.progress))),
        });

        // Il will-change vive solo mentre la cucitura è in scena.
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
          root.style.removeProperty("--tsp");
          trigger.kill();
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
          "--ts-depth": depth,
          // Luce d'apertura della sezione che arriva: .bg-paper la porta già
          // quasi bianca e il pannello la eguaglia da solo, i toni cream no.
          "--ts-bloom": to === "cream" || to === "cream-deep" ? 0.7 : 0,
        } as React.CSSProperties
      }
    >
      <div className="dt-toneshift_in">
        {/* Il filo rosso corre sulla curva della cupola. È un `border-top`
            sullo stesso border-radius del pannello, non un tracciato SVG:
            coincide con la curva per costruzione a qualsiasi viewport, e
            viaggia con la cupola senza un secondo tween. */}
        <span className="dt-toneshift_thread" />
      </div>
    </div>
  );
}
