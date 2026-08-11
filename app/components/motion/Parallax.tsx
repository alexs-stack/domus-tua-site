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
  /** Attivo anche sotto i 768px. Il default `false` è PORTANTE e va lasciato
      dov'è: la scelta si fa al punto di chiamata, uno alla volta.
      La regola con cui è stata fatta (parità mobile, fase 2b, 2026-08-11): sopra
      una FOTOGRAFIA la deriva aggiunge profondità e si accende; sopra un blocco
      di TESTO non aggiunge niente e in una colonna da 390px rende la lettura
      instabile, quindi resta spenta. Alla ricognizione del 2026-08-11 uno solo
      dei 12 punti di chiamata passava `mobile` (l'hero di PageHero) e gli altri
      11 erano fermi sul telefono; adesso lo passano sei — l'hero e le cinque
      fotografie. I sei che non lo passano hanno la ragione scritta accanto, al
      punto di chiamata, non qui.
      Chi ribaltasse il default accenderebbe in blocco anche quei sei: le due
      card di riepilogo, il numero-fantasma editoriale, la filigrana al 6% e la
      colonna con dentro il player. Non è una scorciatoia, è un'altra decisione. */
  mobile?: boolean;
  as?: ElementType;
};

export default function Parallax({
  children,
  className = "",
  innerClassName = "",
  innerStyle,
  speed = 0.25,
  range,
  scale,
  mobile = false,
  as: Tag = "div",
}: Props) {
  const outerRef = useRef<HTMLElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const outer = outerRef.current;
      const inner = innerRef.current;
      if (!outer || !inner) return;

      const media = mobile ? MQ.motionOk : `${MQ.motionOk} and ${MQ.desktop}`;
      const mm = gsap.matchMedia();
      mm.add(media, () => {
        // will-change solo mentre l'animazione è attiva (revert lo pulisce):
        // niente layer promossi per utenti reduced-motion / senza scrub.
        gsap.set(inner, { willChange: "transform" });
        // Ampiezza: yPercent per media grandi, px (range) per elementi piccoli.
        const dir = Math.sign(speed) || 1;
        const move = range != null ? { unit: "y" as const, amp: range * dir } : { unit: "yPercent" as const, amp: speed * 14 };
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
            },
          }
        );
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
