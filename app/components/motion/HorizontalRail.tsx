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
   Sticky su un corridoio alto, MAI il pin di GSAP: il pin scrive
   `position: fixed` e uno spacer sul contenitore, e litiga con lo stacking
   di main e footer (era il male dei vecchi corridoi, tolti il 2026-09-10:
   questa rotaia è l'unica rimasta).

   PROGRESSIVE ENHANCEMENT. Il default è uno scroll orizzontale NATIVO — sul
   touch trascinare è il gesto che la gente si aspetta, e pilotarlo dallo
   scroll verticale glielo toglierebbe. Solo con MQ.corridor (D22: 1024 px di
   larghezza, 640 di altezza, motion ok) il JS mette [data-on], spegne lo
   scroll nativo e passa il nastro a GSAP. Col corridoio (`runway`) il
   wrapper porta data-corridor (A19), che corridors.spec.ts conta.
   Senza JS resta tutto visibile e trascinabile, e il corridoio non esiste.
   Il ramo mobile quindi ESISTE GIÀ ed è in CSS: sotto la soglia comanda il
   dito, con l'aggancio opt-in di `snapMobile` (".dt-rail[data-snap]", che
   Services usa). Chi aggiunge coreografia non porti [data-on] sotto MQ.corridor (D22):
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
import type { ChapterId } from "../../lib/motion/chapters";
import { gsap, ScrollTrigger, useGSAP, MQ } from "../../lib/motion/gsap";
import RailProgress from "./RailProgress";
import { getLenis } from "./SmoothScroll";

export default function HorizontalRail({
  children,
  className = "",
  trackClassName = "",
  corridor,
  /** quanto della corsa consumare: 1 = tutta l'eccedenza */
  speed = 1,
  /** aggancio allo snap nella versione touch (opt-in: su tessere di larghezza
      disuguale l'aggancio obbligatorio a volte ruba l'inerzia) */
  snapMobile = false,
  /** corridoio in svh: quanto scroll il nastro si tiene, parcheggiato al
      centro dello schermo, per compiere la sua corsa. 0 = nessun corridoio. */
  runway = 0,
  /** Scrub del track e dei pan. Il Team passa 0,7: due capitoli della home non
      condividono lo scrub e 0,6 è del film delle stelle (A20 di Alberto, spec
      2026-09-13 §3.1 e §3.16). */
  scrub = 0.6,
  /** Ease del track e dei pan, la stessa per i due piani così le velocità
      restano proporzionali. Il Team passa "dtRail" (spec §3.16). */
  ease = "none",
}: {
  children: React.ReactNode;
  className?: string;
  trackClassName?: string;
  speed?: number;
  snapMobile?: boolean;
  runway?: number;
  /** Nome del corridoio in chapters.ts (A19): data-corridor sul wrapper, solo con `runway`. */
  corridor?: ChapterId;
  scrub?: number;
  ease?: string;
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
      // Gate MQ.corridor (D22): 1024 px di larghezza, 640 di altezza, motion
      // ok, con o senza corridoio; sotto, scroll nativo con snap.
      mm.add(MQ.corridor, () => {
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
              scrub,
              invalidateOnRefresh: true,
            }
          : {
              trigger: rail,
              start: "top 96%",
              end: "bottom 4%",
              scrub,
              invalidateOnRefresh: true,
            };

        // Eccedenza ricalcolata a ogni refresh: le larghezze sono in vw, e una
        // misura congelata al primo layout diventa un bug al primo resize.
        const overflow = () => Math.max(0, track.scrollWidth - rail.clientWidth) * speed;
        const move = gsap.fromTo(track, { x: 0 }, { x: () => -overflow(), ease, scrollTrigger: st });

        const pans = gsap.utils.toArray<HTMLElement>(rail.querySelectorAll(".dt-rail_pan"));
        const pan = pans.length
          ? gsap.fromTo(
              pans,
              { xPercent: (i, el) => -Number((el as HTMLElement).dataset.depth ?? 6) },
              {
                xPercent: (i, el) => Number((el as HTMLElement).dataset.depth ?? 6),
                ease,
                scrollTrigger: st,
              }
            )
          : null;

        // LA RETE DI TASTIERA (spec 2026-09-13 §3.16, A20 di Alberto). Con
        // [data-on] lo scroll nativo della rotaia resta a 0: GSAP scrive `x` e
        // il fuoco da tastiera su una tessera porta la pagina alla quota in cui
        // il track la mostra, progresso p con ease(p) = scarto / eccedenza
        // trovato per bisezione, poi lo scrub chiuso subito. Scatta solo col
        // fuoco visibile, come la rete dei corridoi (correzione bloccante 3 di
        // homeC, spec §3.18): un clic del mouse su una tessera, che ha
        // tabIndex 0, la mette a fuoco senza spostare la pagina. Il rAF lascia
        // passare prima lo scroll-into-view che il browser fa dopo `focusin`.
        const zeroLeft = () => {
          if (rail.scrollLeft !== 0) rail.scrollLeft = 0;
        };
        const onFocus = (e: FocusEvent) => {
          const t = e.target instanceof Element ? e.target : null;
          const tile = t?.closest<HTMLElement>(".dt-rail_track > *");
          if (!parked || !tile || !t?.matches(":focus-visible")) return;
          requestAnimationFrame(() => {
            const trig = move.scrollTrigger;
            if (!trig) return;
            zeroLeft();
            const over = overflow();
            const shift = tile.getBoundingClientRect().left - track.getBoundingClientRect().left;
            const target = over > 0 ? Math.min(1, Math.max(0, shift / over)) : 0;
            const curve = gsap.parseEase(ease);
            let lo = 0;
            let hi = 1;
            for (let i = 0; i < 24; i++) {
              const mid = (lo + hi) / 2;
              if (curve(mid) < target) lo = mid;
              else hi = mid;
            }
            const y = trig.start + hi * (trig.end - trig.start);
            const lenis = getLenis();
            if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
            else window.scrollTo({ top: y, behavior: "instant" });
            ScrollTrigger.update();
            trig.getTween()?.progress(1);
          });
        };
        rail.addEventListener("scroll", zeroLeft);
        rail.addEventListener("focusin", onFocus);

        return () => {
          rail.removeEventListener("scroll", zeroLeft);
          rail.removeEventListener("focusin", onFocus);
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
    { scope: wrapRef, dependencies: [speed, runway, scrub, ease], revertOnUpdate: true }
  );

  return (
    <div
      ref={wrapRef}
      className="dt-railway"
      data-corridor={runway > 0 ? corridor : undefined}
      style={runway > 0 ? ({ "--rail-run": runway } as React.CSSProperties) : undefined}
    >
      <div
        ref={railRef}
        className={`dt-rail ${className}`}
        data-snap={snapMobile ? "" : undefined}
      >
        <div className={`dt-rail_track ${trackClassName}`}>{children}</div>
      </div>
      {/* In flusso, non in sovrimpressione: il corridoio non tiene aria di
          riserva sotto il nastro (la tiene sopra e sotto la sezione), quindi
          l'indicatore la sua riga se la prende. Si vede solo sotto la soglia
          dei corridoi (MQ.belowCorridor, D22), dove ".dt-railway" è un div
          qualunque: a [data-on] la sua altezza è dichiarata in CSS e nessun
          figlio in più la sposta. */}
      <RailProgress scroller={railRef} className="mt-6" />
    </div>
  );
}
