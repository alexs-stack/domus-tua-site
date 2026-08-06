"use client";

/* ═══════════════════════════════════════════════════════════════════════════
   TONESHIFT — le cuciture fra i colori di fondo (2026-08-06).

   PROBLEMA: la home cambia tono cinque volte. Ogni cambio disegnava una linea
   orizzontale netta: il taglio che rompe lo scroll immersivo.

   CINQUE CUCITURE, CINQUE GESTI DIVERSI (direttiva cliente): ripetere la
   stessa transizione cinque volte non è un linguaggio, è un tic — e alla
   terza l'occhio la riconosce e la salta. Ogni variante viene da una
   reference precisa e ha un motivo per stare dove sta:

     arco        era-residence — l'arco ribassato della cupola (50vw × 22vh),
                 il modo in cui questo sito fa già salire una pagina sopra
                 un'altra. Un pannello curvo che sale: una sola transform.
     telescopio  telescope-zoom — sei pannelli a scale 0.15…1 che convergono
                 tutti a 1. Il colore ARRIVA DALLA PROFONDITÀ invece che dal
                 basso. Portato col bus a custom property del riferimento:
                 UNA sola scrittura di stile per frame, N trasformazioni
                 derivate in calc().
     iride       FullscreenClipEffect — morph di clip-path a topologia
                 costante, con i valori esatti del riferimento:
                 inset(22% 39% round 23vw) → inset(0% 0% round 0vw).
     tenda       era-residence — spazzata ORIZZONTALE, con il bordo di testa
                 sfumato perché una linea verticale netta sarebbe un taglio
                 girato di 90°, non una transizione.
     nebbia      il bordo non esiste: il pannello sale con una sfumatura alta
                 il 42% della propria altezza. Nessun contorno da percepire,
                 quindi nessuno stacco possibile.

   Progressive enhancement: senza JS o con reduced-motion il blocco è una
   sfumatura verticale piena fra i due toni. [data-on] arriva solo da JS.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP, MQ } from "../../lib/motion/gsap";

export type Tone = "cream" | "cream-deep" | "paper" | "espresso" | "wine" | "graphite";
export type ShiftVariant = "arco" | "telescopio" | "iride" | "tenda" | "nebbia";

/** Eccedenza verticale del pannello oltre il blocco, in frazione di viewport.
    Deve coprire i 22vh dell'arco (e la sfumatura della nebbia) più un
    margine: senza, a fine corsa la curva resterebbe dentro il blocco e il
    colore non chiuderebbe piatto. */
const OVERSHOOT = 0.42;

/** Le scale di partenza del telescopio. Nel riferimento sono
    1 / 0.85 / 0.6 / 0.45 / 0.3 / 0.15 e convergono tutte a 1 — ma là il
    pannello a scala 1 è la fotografia di fondo, già a tutto schermo. Qui a
    progresso zero non deve esserci NIENTE, quindi la rampa parte più bassa e
    l'opacità sale con la convergenza. In CSS ognuna diventa
    `scale(calc(s + (1-s) * var(--tsp)))`. */
const TELESCOPE = [0.06, 0.14, 0.26, 0.42, 0.62];

export default function ToneShift({
  from,
  to,
  variant = "arco",
  className = "",
}: {
  /** tono della sezione che finisce */
  from: Tone;
  /** tono della sezione che comincia */
  to: Tone;
  variant?: ShiftVariant;
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

        const st = {
          trigger: root,
          // Comincia appena il blocco affaccia e finisce quando è ancora a
          // mezzo schermo: la cucitura ha già finito di passare prima che
          // l'occhio arrivi al fondo del blocco.
          start: "top 98%",
          // Finisce quando la giuntura e ARRIVATA DAVVERO, cioe a due terzi
          // di schermo — non quando e ancora un viewport piu in basso. Con
          // "bottom bottom" il gesto si chiudeva prestissimo e restava da
          // attraversare un blocco di colore piatto: letto come fretta.
          // Poterlo fare senza gradini dipende dal fatto che TUTTE le
          // varianti ora coprono il bordo inferiore per prime (vedi le note
          // su transform-origin, inset a quattro valori e testa diagonale).
          end: "bottom 62%",
          scrub: 0.5,
          invalidateOnRefresh: true,
        } as const;

        let tween: gsap.core.Tween | null = null;
        let trigger: ScrollTrigger | null = null;

        if (variant === "telescopio" || variant === "iride") {
          // BUS A CUSTOM PROPERTY (telescope-zoom): una sola setProperty per
          // frame, tutte le trasformazioni derivate in calc() dal CSS. L'ease
          // si applica al progresso GREZZO, non come ease di un tween: è la
          // curva che tiene il gesto morbido agli estremi.
          const ease = gsap.parseEase("power1.inOut");
          trigger = ScrollTrigger.create({
            ...st,
            onUpdate: (self) => root.style.setProperty("--tsp", String(ease(self.progress))),
          });
        } else if (variant === "tenda") {
          // Spazzata orizzontale: il pannello è più largo del blocco e la sua
          // corsa parte da fuori a sinistra. Valori a funzione perché la
          // larghezza dipende dalla viewport.
          tween = gsap.fromTo(
            panel,
            { x: () => -panel.offsetWidth },
            { x: 0, ease: "none", scrollTrigger: st }
          );
        } else {
          // arco e nebbia: lo stesso movimento verticale, forme opposte del
          // bordo (curva netta contro sfumatura alta).
          const extra = () => window.innerHeight * OVERSHOOT;
          tween = gsap.fromTo(
            panel,
            { y: () => root.offsetHeight + extra() },
            { y: () => -extra(), ease: "none", scrollTrigger: st }
          );
        }

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
          tween?.scrollTrigger?.kill();
          tween?.kill();
          trigger?.kill();
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
      data-v={variant}
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
      {variant === "telescopio" ? (
        // I pannelli intermedi stanno DIETRO quello pieno e convergono con
        // esso: è la stratificazione che si dissolve, non un semplice zoom.
        <div data-ts-in className="dt-toneshift_in">
          {TELESCOPE.map((s) => (
            <span key={s} className="dt-toneshift_tel" style={{ "--tel-s": s } as React.CSSProperties} />
          ))}
        </div>
      ) : (
        <div data-ts-in className="dt-toneshift_in" />
      )}
    </div>
  );
}
