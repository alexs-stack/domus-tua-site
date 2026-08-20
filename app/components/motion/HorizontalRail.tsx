"use client";

/* ═══════════════════════════════════════════════════════════════════════════
   HORIZONTALRAIL — il nastro orizzontale.

   Estratto dal nastro "Seguici" (Social.tsx), che è la versione già collaudata
   di questo gesto: il track trasla di tutta la propria eccedenza nel tempo che
   la sezione impiega ad attraversare il viewport.

   DUE PIANI, NON UNO. Il track scorre; dentro ogni cornice il media pana in
   senso CONTRARIO di una quota diversa per tessera (`data-depth`). Sono le due
   velocità a fare la profondità: un nastro che scorre e basta è solo una fila
   che si muove.

   IL CORRIDOIO (opt-in `runway`). Senza, il nastro corre nel tempo che la
   sezione impiega ad attraversare il viewport: la corsa comincia mentre il
   nastro affaccia da sotto e finisce mentre esce da sopra, quindi buona parte
   del gesto avviene fuori campo. Con `runway` il nastro si PARCHEGGIA al
   centro dello schermo e la corsa si prende tutta la sua strada davanti agli
   occhi prima che la pagina riprenda a scendere (2026-08-09, direttiva
   cliente: «l'effetto del carosello vorrei durasse un po' di più»).
   Sticky su un corridoio alto, MAI il pin di GSAP: è la grammatica già
   collaudata da dt-horizon / dt-wall / dt-paths / dt-tt, e la ragione è
   scritta lì — il pin litiga con lo stacking di main/footer-uncover.

   PROGRESSIVE ENHANCEMENT. Il default è uno scroll orizzontale NATIVO — sul
   touch trascinare è il gesto che la gente si aspetta, e pilotarlo dallo
   scroll verticale glielo toglierebbe. Solo da 1024px in su e con motion ok
   il JS mette [data-on], spegne lo scroll nativo e passa il nastro a GSAP.
   Senza JS resta tutto visibile e trascinabile, e il corridoio non esiste.
   Il ramo mobile quindi ESISTE GIÀ ed è in CSS: sotto la soglia comanda il
   dito, con l'aggancio opt-in di `snapMobile` (".dt-rail[data-snap]", che
   Services usa). Chi aggiunge coreografia non porti [data-on] sotto 1024:
   ".dt-rail[data-on]" mette `overflow: hidden; scroll-snap-type: none` e
   spegnerebbe insieme il trascinamento e lo snap.

   Quello che al ramo mobile mancava non era il gesto ma l'INVITO: la barra
   nativa è nascosta, quindi niente diceva che il nastro continua fuori dal
   bordo destro. Lo dice RailProgress, sotto — e non è motion, è la barra di
   scorrimento che il CSS aveva tolto (2026-08-11, parità mobile).

   E MANCAVA IL SECONDO PIANO («parità mobile 2», scheda 20, 2026-08-18).
   Sotto la soglia il track lo muoveva il dito, ma i pan restavano fermi: la
   profondità — che è il punto di questo componente — esisteva solo da 1024
   in su. Adesso c'è a ogni larghezza, con lo stesso translateX per tessera:
   RailProgress scrive la frazione 0→1 della corsa nativa anche sullo
   scroller e una regola CSS (`.dt-rail:not([data-on]) .dt-rail_pan`,
   globals.css) la trasforma nel pan. Il ramo mobile resta senza GSAP:
   zero ScrollTrigger e zero will-change in più — è l'alleggerimento nominato.

   Le regole di layout stanno in globals.css (blocchi ".dt-rail"/".dt-railway").
   ═══════════════════════════════════════════════════════════════════════════ */

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP, MQ } from "../../lib/motion/gsap";
import RailProgress from "./RailProgress";

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
  /** corridoio in svh: quanto scroll il nastro si tiene, parcheggiato al
      centro dello schermo, per compiere la sua corsa. 0 = nessun corridoio. */
  runway = 0,
}: {
  children: React.ReactNode;
  className?: string;
  trackClassName?: string;
  speed?: number;
  snapMobile?: boolean;
  cursor?: string;
  runway?: number;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const railRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const wrap = wrapRef.current;
      const rail = railRef.current;
      const track = rail?.querySelector<HTMLElement>(".dt-rail_track");
      if (!wrap || !rail || !track) return;

      const mm = gsap.matchMedia();
      mm.add(`${MQ.motionOk} and ${MQ.lg}`, () => {
        rail.setAttribute("data-on", "");

        // Le due misure del corridoio, rifatte a ogni refresh: l'altezza vera
        // del nastro (le lastre sono in vw) e la quota a cui si parcheggia.
        // Trappola nota del dossier: altezze dinamiche + ScrollTrigger.
        const parked = runway > 0;
        let top = 0;
        const size = () => {
          top = Math.max(0, Math.round((window.innerHeight - rail.offsetHeight) / 2));
          wrap.style.setProperty("--rail-len", `${rail.offsetHeight}px`);
          wrap.style.setProperty("--rail-top", `${top}px`);
        };
        if (parked) {
          wrap.setAttribute("data-on", "");
          size();
          ScrollTrigger.addEventListener("refreshInit", size);
        }

        // Parcheggiato, la corsa coincide ESATTAMENTE con la finestra in cui il
        // nastro sta fermo in mezzo allo schermo: comincia quando lo sticky si
        // aggancia e finisce quando si stacca. Se sforasse da una parte o
        // dall'altra, resterebbe scroll speso su un nastro immobile.
        const st = parked
          ? {
              trigger: wrap,
              start: () => `top ${top}px`,
              end: () => `bottom ${top + rail.offsetHeight}px`,
              scrub: 0.6,
              invalidateOnRefresh: true,
            }
          : {
              trigger: rail,
              start: "top 96%",
              end: "bottom 4%",
              scrub: 0.6,
              invalidateOnRefresh: true,
            };

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
          if (parked) {
            ScrollTrigger.removeEventListener("refreshInit", size);
            wrap.removeAttribute("data-on");
            wrap.style.removeProperty("--rail-len");
            wrap.style.removeProperty("--rail-top");
          }
          move.scrollTrigger?.kill();
          move.kill();
          pan?.scrollTrigger?.kill();
          pan?.kill();
        };
      });
    },
    { scope: wrapRef, dependencies: [speed, runway], revertOnUpdate: true }
  );

  return (
    <div
      ref={wrapRef}
      className="dt-railway"
      style={runway > 0 ? ({ "--rail-run": runway } as React.CSSProperties) : undefined}
    >
      <div
        ref={railRef}
        className={`dt-rail ${className}`}
        data-snap={snapMobile ? "" : undefined}
        data-cursor={cursor}
      >
        <div className={`dt-rail_track ${trackClassName}`}>{children}</div>
      </div>
      {/* In flusso, non in sovrimpressione: il corridoio non tiene aria di
          riserva sotto il nastro (la tiene sopra e sotto la sezione), quindi
          l'indicatore la sua riga se la prende. Esiste solo sotto i 1024,
          dove ".dt-railway" è un div qualunque: a [data-on] la sua altezza è
          dichiarata in CSS e nessun figlio in più la sposta. */}
      <RailProgress scroller={railRef} className="mt-6" />
    </div>
  );
}
