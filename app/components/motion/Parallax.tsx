"use client";

// Parallax — profondità allo scroll (scrub), GPU-safe (solo transform).
// L'elemento esterno mantiene il layout; il movimento è sul wrapper interno.
// speed > 0 = si muove più lento del flusso (sfondo, lontano);
// speed < 0 = più veloce (primo piano). Range consigliato: -0.5 … 0.5.
// Con `scale` l'interno è sovradimensionato per non scoprire i bordi
// dentro cornici overflow-hidden (immagini).
import { useRef, type CSSProperties, type ElementType, type ReactNode } from "react";
import { gsap, useGSAP, MQ } from "../../lib/motion/gsap";

type Props = {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  innerStyle?: CSSProperties;
  /** -0.5 … 0.5 — intensità e direzione del movimento */
  speed?: number;
  /** ampiezza in px (± range): per elementi piccoli, dove yPercent è impercettibile.
      Il segno di `speed` continua a dare la direzione.
      Attenzione prima di accoppiarlo a `mobile`: è l'unica ampiezza che NON si
      rimpicciolisce da sola in colonna stretta. `yPercent` è una frazione
      dell'altezza dell'elemento, quindi su un telefono la corsa cala insieme al
      contenuto; 26px restano 26px anche su 390. */
  range?: number;
  /** sovradimensiona l'interno (es. 1.15 per immagini in cornice) */
  scale?: number;
  /** Attivo anche sotto i 768px. Il default è `true` dall'onda «parità mobile 2»
      (verdetto 7, PORT: stesso effetto, parametri adattati): sul telefono la
      deriva è la STESSA — stesso scrub, stessa direzione — con la corsa
      dimezzata (`PHONE_SPEED_FACTOR`, qui sotto, non ai punti di chiamata).
      L'onda precedente (fase 2b, 2026-08-11) aveva il default `false` con la
      regola «sopra una fotografia sì, sopra un testo no», e tre punti di
      chiamata su dodici passavano `mobile` (l'hero di PageHero, la lastra
      della testimonianza, la cornice del ritratto di Open Domus): quei tre
      continuano a passarlo, per leggibilità, ma non è più un opt-in.
      Chi resta fermo sotto 768 lo dichiara con `mobile={false}` esplicito e la
      ragione scritta accanto, al punto di chiamata, non qui. Il criterio con
      cui si è deciso (2026-08-18): una parallasse che a 390 muove meno di
      ~10 px di corsa totale — con la corsa già dimezzata — è invisibile e non
      vale uno ScrollTrigger scrubbato (filigrana al 6% del D.O.C., card di
      riepilogo, card flottante di Open Domus, la colonna col player, le tre
      fotografie basse: Servizi, ritratto del team, cornici editoriali). Sopra i
      10 px si accende (il numero-fantasma editoriale, 26 px). `mobile={false}`
      NON è «mobile off e basta»: è una misura fatta a 390 e scritta lì. */
  mobile?: boolean;
  as?: ElementType;
};

/** Il parametro adattato del telefono (sotto `MQ.desktop`): la corsa — `speed`
    o `range` — vale la metà. È il modello di ERA (`data-parallax` acceso anche
    su mobile, cambiano i numeri) e vive QUI, una volta, non ai punti di
    chiamata: così nessuno riscrive la soglia a mano e il criterio «sotto ~10 px
    è invisibile» si applica a una cifra sola. */
const PHONE_SPEED_FACTOR = 0.5;

export default function Parallax({
  children,
  className = "",
  innerClassName = "",
  innerStyle,
  speed = 0.25,
  range,
  scale,
  mobile = true,
  as: Tag = "div",
}: Props) {
  const outerRef = useRef<HTMLElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const outer = outerRef.current;
      const inner = innerRef.current;
      if (!outer || !inner) return;

      // Un solo matchMedia con le condizioni nominate: quando la larghezza
      // attraversa 768 (rotazione di un tablet, finestra ridimensionata) GSAP
      // annulla e rifà il tween con il fattore giusto — non due `matchMedia`
      // a mano che si contendono la stessa transform.
      const mm = gsap.matchMedia();
      mm.add({ motionOk: MQ.motionOk, phone: MQ.belowDesktop }, (ctx) => {
        const { motionOk, phone } = ctx.conditions as { motionOk: boolean; phone: boolean };
        if (!motionOk) return;
        if (phone && !mobile) return;
        const k = phone ? PHONE_SPEED_FACTOR : 1;
        // Ampiezza: yPercent per media grandi, px (range) per elementi piccoli.
        const dir = Math.sign(speed) || 1;
        const move =
          range != null
            ? { unit: "y" as const, amp: range * dir * k }
            : { unit: "yPercent" as const, amp: speed * 14 * k };
        gsap.fromTo(
          inner,
          { [move.unit]: move.amp, scale: scale ?? 1 },
          {
            [move.unit]: -move.amp,
            scale: scale ?? 1,
            ease: "none",
            scrollTrigger: {
              trigger: outer,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
              // will-change SOLO mentre il trigger è attivo, cioè mentre
              // l'elemento è fra il bordo basso e il bordo alto del viewport
              // (prima stava dal mount al revert: ogni parallasse della pagina
              // era un layer promosso anche fuori scena). È l'alleggerimento
              // nominato del verdetto 7 — sulla home a 390 sono i layer delle
              // parallassi accese in più col nuovo default. Si scrive sullo
              // stile e non con gsap.set perché una set dentro un callback non
              // finisce nel context e il revert non la pulirebbe: la pulizia
              // sta nel cleanup qui sotto.
              onToggle: (self) => {
                inner.style.willChange = self.isActive ? "transform" : "";
              },
            },
          }
        );
        return () => {
          inner.style.willChange = "";
        };
      });
    },
    { scope: outerRef, dependencies: [speed, range, scale, mobile] }
  );

  return (
    <Tag ref={outerRef} className={className}>
      {/* Lo scale di overscan è pre-applicato in SSR: all'idratazione GSAP riscrive
          lo stesso valore → nessun "pop" di zoom visibile sull'immagine (LCP). */}
      <div
        ref={innerRef}
        className={innerClassName}
        style={{
          ...(scale != null ? { transform: `scale(${scale})` } : null),
          ...innerStyle,
        }}
      >
        {children}
      </div>
    </Tag>
  );
}
