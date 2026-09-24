"use client";

// TextLines — reveal editoriale riga-per-riga per titoli display e citazioni:
// ogni riga sale da una maschera (SplitText, type lines + mask). Dopo il play
// il markup viene ripristinato (revert) → niente span residui, niente problemi
// di resize/i18n. Con reduced-motion o senza JS il testo resta statico e visibile.
import { useRef, type ElementType, type ReactNode } from "react";
import { SplitText } from "gsap/SplitText";
import { gsap, useGSAP, MQ } from "../../lib/motion/gsap";
import { useLocale } from "../i18n/LocaleProvider";

// SplitText serve solo qui: registrato localmente per non finire nel chunk
// del layout (che importa gsap.ts via SmoothScroll).
gsap.registerPlugin(SplitText);

type Props = {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  /** ritardo in secondi */
  delay?: number;
  /** ritardo tra le righe in secondi */
  stagger?: number;
};

export default function TextLines({
  children,
  className = "",
  as: Tag = "div",
  delay = 0,
  stagger = 0.09,
}: Props) {
  const ref = useRef<HTMLElement | null>(null);
  // Al cambio lingua l'elemento va RIMONTATO (key): SplitText stacca i text node
  // originali, quindi un semplice update React lascerebbe il testo nella lingua
  // precedente. Il remount + deps ricrea split e animazione sul testo nuovo.
  const { locale } = useLocale();

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const mm = gsap.matchMedia();
      mm.add(MQ.motionOk, () => {
        let split: SplitText | null = null;
        let tween: gsap.core.Tween | null = null;
        let cancelled = false;

        // Split solo a font caricati: righe misurate sulla tipografia definitiva.
        document.fonts.ready.then(() => {
          if (cancelled) return;
          split = SplitText.create(el, {
            type: "lines",
            mask: "lines",
            linesClass: "tl-line",
            // `auto` metterebbe un aria-label sull'elemento: su un <blockquote> è un attributo
            // vietato (il ruolo non ammette un nome accessibile) e axe lo segnala come
            // violazione seria. Con `none` il testo resta nelle righe e continua a essere
            // letto; lo split viene comunque ripristinato a fine animazione.
            aria: "none",
          });
          tween = gsap.fromTo(
            split.lines,
            { yPercent: 112 },
            {
              yPercent: 0,
              duration: 1.05,
              ease: "expo.out",
              stagger,
              delay,
              scrollTrigger: { trigger: el, start: "top 86%", once: true },
              onComplete: () => {
                split?.revert();
                split = null;
              },
            }
          );
        });

        // Creato in async (dopo fonts.ready): il context GSAP non lo raccoglie,
        // quindi tween + ScrollTrigger vanno uccisi esplicitamente qui.
        return () => {
          cancelled = true;
          tween?.scrollTrigger?.kill();
          tween?.kill();
          tween = null;
          split?.revert();
          split = null;
        };
      });
    },
    { scope: ref, dependencies: [delay, stagger, locale] }
  );

  return (
    <Tag key={locale} ref={ref} className={className}>
      {children}
    </Tag>
  );
}
