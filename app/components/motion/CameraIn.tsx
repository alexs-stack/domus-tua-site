"use client";

// CameraIn — l'ingresso in scena di una sezione: un "dolly" cinematografico,
// una micro-zoomata (scale→1 + risalita) legata allo scroll. Sempre visibile
// (niente opacity: dentro ci sono link, testo SEO e due form veri).
// UN SOLO EFFETTO, DUE TARATURE («stesso effetto, parametri adattati», mandato
// §4): dai 768 in su scale .96→1 + y 30, sotto scale .98→1 + y 15 — le
// distanze dimezzate. La finestra di scrub è la stessa a ogni larghezza.
// VINCOLO — vale a ogni larghezza, perché entrambi i rami scrivono un
// transform: wrappare solo contenuto SENZA sticky/fixed all'interno (il
// transform del wrapper diventerebbe il loro containing block). Verificato sui
// quattro chiamanti — Stats, Contact, CareerApplication, LavoraConNoiContent:
// nessuno ha discendenti sticky o fixed. Da rivedere se un giorno un form
// montasse un `position: sticky`.
import { useRef, type ElementType, type ReactNode } from "react";
import { gsap, useGSAP, MQ } from "../../lib/motion/gsap";

// La finestra dello scrub, una sola per le due tarature: la scena comincia
// quando il bordo alto della sezione è al 94% del viewport e si conclude al 42%.
const START_PCT = 94;
const END_PCT = 42;
// La risalita desktop; sul telefono viaggia dimezzata (vedi sotto).
const RISE_PX = 30;

type Props = {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  /** Intensità della zoomata (scala iniziale) da 768 in su. Sotto, la distanza da 1 è dimezzata. */
  from?: number;
};

export default function CameraIn({ children, className = "", as: Tag = "div", from = 0.96 }: Props) {
  const ref = useRef<HTMLElement | null>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();

      // Il dolly, identico nei due rami: cambiano solo le distanze. `ease: none`
      // perché la mano sullo scroll È l'easing; transformOrigin poco sotto il
      // centro, così la zoomata «entra» verso il cuore della sezione.
      const dolly = (scale: number, y: number) =>
        gsap.fromTo(
          el,
          { scale, y, transformOrigin: "50% 62%" },
          {
            scale: 1,
            y: 0,
            ease: "none",
            scrollTrigger: { trigger: el, start: `top ${START_PCT}%`, end: `top ${END_PCT}%`, scrub: true },
          }
        );

      mm.add(`${MQ.motionOk} and ${MQ.desktop}`, () => {
        dolly(from, RISE_PX);
      });

      /* REGOLA CHANEL — l'effetto resta acceso, ciò che si alleggerisce sono le
         DISTANZE e la RETE.
         Distanze: la vecchia nota diceva che a 390 «la scala legge come
         un'oscillazione — la colonna respira e i bordi del testo tremolano».
         Era una lettura fatta su scale .96 / y 30, cioè con le stesse ampiezze
         del desktop su una colonna larga meno della metà: 4% di 390px sono
         quasi 16px di respiro sui bordi. Con la distanza da 1 dimezzata (.98,
         ~8px a bordo) e la risalita a 15 la zoomata torna proporzionata alla
         colonna — è la stessa frase del desktop, detta a voce più bassa. Il
         «tremolio» a scala frazionaria è l'oggetto della misura §4.4
         dell'audit: si giudica sui numeri nuovi, non sui vecchi.
         Rete: il ramo mobile precedente era un reveal once con opacity 0→1,
         e proprio perché nascondeva qualcosa aveva bisogno di tre reti
         (once, focusin, timeout) e di pointerEvents. In uno scrub di sola
         trasformazione nulla è mai nascosto — a ogni quota la sezione è intera
         e cliccabile, i campi restano nel tab order — quindi le reti escono
         tutte, e con loro l'opacità che sotto un form era un compromesso
         dichiarato. Chi è già in campo all'idratazione trova lo scrub già
         calcolato alla sua quota, come sul desktop: nessun lampo, perché
         nessuno stato di partenza è invisibile. */
      mm.add(`${MQ.motionOk} and ${MQ.belowDesktop}`, () => {
        dolly(1 - (1 - from) / 2, RISE_PX / 2);
      });

      // Tween e trigger li revoca il contesto di matchMedia (nascono in
      // sincrono, non dopo un await): attraversando i 768 l'inline style
      // sparisce e l'altro ramo trova l'elemento pulito. Niente da pulire a mano.
    },
    { scope: ref }
  );

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Tag ref={ref as any} className={className} data-camera-in="">
      {children}
    </Tag>
  );
}
