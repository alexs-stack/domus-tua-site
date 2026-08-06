"use client";

/* ═══════════════════════════════════════════════════════════════════════════
   HORIZONTALRAIL — il nastro orizzontale NON pinnato.

   Estratto dal nastro "Seguici" (Social.tsx), che è la versione già collaudata
   di questo gesto: il track trasla di tutta la propria eccedenza nel tempo che
   la sezione impiega ad attraversare il viewport.

   PERCHÉ NON PINNATO. La home ha già cinque sezioni che rubano scroll
   (orizzonte, muro delle voci, stelle, percorsi, corridoio del team). Un sesto
   pin nella seconda metà non aggiunge un momento: aggiunge attrito, e la
   pagina passa da "immersiva" a "interminabile" — che è lo stesso difetto con
   un altro nome. Il riferimento (era-residence) ha UNA sola sezione pinnata in
   tutta la home, e non a caso.

   DUE PIANI, NON UNO. Il track scorre; dentro ogni cornice il media pana in
   senso CONTRARIO di una quota diversa per tessera (`data-depth`). Sono le due
   velocità a fare la profondità: un nastro che scorre e basta è solo una fila
   che si muove.

   PROGRESSIVE ENHANCEMENT. Il default è uno scroll orizzontale NATIVO — sul
   touch trascinare è il gesto che la gente si aspetta, e pilotarlo dallo
   scroll verticale glielo toglierebbe. Solo da 1024px in su e con motion ok
   il JS mette [data-on], spegne lo scroll nativo e passa il nastro a GSAP.
   Senza JS resta tutto visibile e trascinabile.

   Le regole di layout stanno in globals.css (blocco ".dt-rail").
   ═══════════════════════════════════════════════════════════════════════════ */

import { useRef } from "react";
import { gsap, useGSAP, MQ } from "../../lib/motion/gsap";

export default function HorizontalRail({
  children,
  className = "",
  trackClassName = "",
  /** quanto della corsa consumare: 1 = tutta l'eccedenza */
  speed = 1,
  /** aggancio allo snap nella versione touch (opt-in: su tessere di larghezza
      disuguale l'aggancio obbligatorio a volte ruba l'inerzia) */
  snapMobile = false,
  /** etichetta del cursore custom mentre il nastro è sotto il puntatore */
  cursor = "trascina",
}: {
  children: React.ReactNode;
  className?: string;
  trackClassName?: string;
  speed?: number;
  snapMobile?: boolean;
  cursor?: string;
}) {
  const railRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const rail = railRef.current;
      const track = rail?.querySelector<HTMLElement>(".dt-rail_track");
      if (!rail || !track) return;

      const mm = gsap.matchMedia();
      mm.add(`${MQ.motionOk} and (min-width: 1024px)`, () => {
        rail.setAttribute("data-on", "");

        const st = {
          trigger: rail,
          start: "top 96%",
          end: "bottom 4%",
          scrub: 0.6,
          invalidateOnRefresh: true,
        } as const;

        // Eccedenza ricalcolata a ogni refresh: le larghezze sono in vw, e una
        // misura congelata al primo layout diventa un bug al primo resize.
        const overflow = () => Math.max(0, track.scrollWidth - rail.clientWidth) * speed;
        const move = gsap.fromTo(track, { x: 0 }, { x: () => -overflow(), ease: "none", scrollTrigger: st });

        const pans = gsap.utils.toArray<HTMLElement>(rail.querySelectorAll(".dt-rail_pan"));
        const pan = pans.length
          ? gsap.fromTo(
              pans,
              { xPercent: (i, el) => -Number((el as HTMLElement).dataset.depth ?? 6) },
              {
                xPercent: (i, el) => Number((el as HTMLElement).dataset.depth ?? 6),
                ease: "none",
                scrollTrigger: st,
              }
            )
          : null;

        return () => {
          rail.removeAttribute("data-on");
          move.scrollTrigger?.kill();
          move.kill();
          pan?.scrollTrigger?.kill();
          pan?.kill();
        };
      });
    },
    { scope: railRef, dependencies: [speed], revertOnUpdate: true }
  );

  return (
    <div
      ref={railRef}
      className={`dt-rail ${className}`}
      data-snap={snapMobile ? "" : undefined}
      data-cursor={cursor}
    >
      <div className={`dt-rail_track ${trackClassName}`}>{children}</div>
    </div>
  );
}
