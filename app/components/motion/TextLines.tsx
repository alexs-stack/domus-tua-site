"use client";

// TextLines — reveal editoriale riga-per-riga per titoli display e citazioni:
// ogni riga sale da una maschera (SplitText, type lines + mask). Il reveal
// RIGIOCA a ogni passaggio, in entrambe le direzioni (richiesta cliente
// 2026-08-04): lo split resta vivo e `autoSplit` lo ricostruisce al resize
// (il tween ritornato da onSplit viene ripulito e ricreato da GSAP). i18n
// resta gestita dal remount via key. Con reduced-motion o senza JS il testo
// è statico e visibile.
import { useRef, type ElementType, type ReactNode } from "react";
import { SplitText } from "gsap/SplitText";
import { gsap, ScrollTrigger, useGSAP, MQ } from "../../lib/motion/gsap";
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
  /**
   * LO STATO DI USCITA (dossier era-residence §2.4 / §7).
   * Con `exit` il testo non si limita a entrare: risalendo la pagina ESCE
   * dalla parte opposta a quella da cui era arrivato (le righe sono entrate
   * da sotto la maschera, quindi escono verso l'alto) a durata corta —
   * `hide` nel riferimento è durS 0.4 contro durL 1.2 del reveal, con lo
   * stagger dimezzato. È questo dettaglio a far leggere continua una pagina
   * lunga: senza, tornando indietro si trova solo testo fermo e il gesto
   * sembra spegnersi. Rientrando, il reveal si rifà da capo.
   * Default false: il comportamento storico (reverse del reveal) resta
   * identico per tutte le chiamate che non chiedono niente.
   */
  exit?: boolean;
};

/** L'uscita del riferimento: rapida e in ingresso (power2.in), non "morbida". */
const EXIT_DUR = 0.4;
const EXIT_Y = -110;

export default function TextLines({
  children,
  className = "",
  as: Tag = "div",
  delay = 0,
  stagger = 0.09,
  exit = false,
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
        // Solo in modalità `exit`: il trigger è nostro (vedi sotto) e la
        // tween d'uscita è creata su richiesta.
        let st: ScrollTrigger | null = null;
        let out: gsap.core.Tween | null = null;
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
            // letto.
            aria: "none",
            // Replay a ogni passaggio: niente revert al complete — autoSplit
            // tiene le righe corrette al resize e ricrea il tween di onSplit.
            autoSplit: true,
            onSplit: (self) => {
              // autoSplit richiama onSplit a ogni ri-misura: il trigger e la
              // tween d'uscita del giro precedente puntano a righe ormai
              // rimosse dal DOM e vanno chiusi qui (il tween RITORNATO lo
              // ripulisce GSAP, questi due no).
              st?.kill();
              st = null;
              out?.kill();
              out = null;

              const from = { yPercent: 112 };
              const to = {
                yPercent: 0,
                duration: 1.05,
                ease: "expo.out",
                stagger,
                delay,
              };

              if (!exit) {
                tween = gsap.fromTo(self.lines, from, {
                  ...to,
                  scrollTrigger: {
                    trigger: el,
                    start: "top 86%",
                    toggleActions: "restart none none reverse",
                  },
                });
                return tween;
              }

              /* MODALITÀ USCITA — perché qui il trigger è separato e non un
                 `toggleActions`. Servono DUE animazioni sugli stessi target
                 (il reveal e l'uscita) e l'ordine tra loro deve essere
                 deterministico: con toggleActions il restart lo pilota
                 ScrollTrigger e non c'è un punto in cui uccidere l'uscita
                 ancora in corso — le due tween si contenderebbero yPercent
                 nello stesso tick. Con la tween in `paused` e un
                 ScrollTrigger.create separato (stesso schema di
                 HorizonScroller) ogni passaggio ha un solo padrone. */
              const reveal = gsap.fromTo(self.lines, from, { ...to, paused: true });
              tween = reveal;

              const enter = () => {
                out?.kill();
                out = null;
                reveal.restart();
              };
              const leave = () => {
                reveal.pause();
                out?.kill();
                out = gsap.to(self.lines, {
                  yPercent: EXIT_Y,
                  duration: EXIT_DUR,
                  ease: "power2.in",
                  stagger: stagger / 2,
                });
              };

              st = ScrollTrigger.create({
                trigger: el,
                start: "top 86%",
                // onEnter: si scende e il blocco arriva. onEnterBack: si
                // risale e il blocco rientra da sopra — il riferimento rifà
                // il reveal in entrambi i casi.
                onEnter: enter,
                onEnterBack: enter,
                onLeaveBack: leave,
              });
              // Rete di sicurezza: un titolo NON può restare a yPercent 112.
              // Se il blocco è già oltre lo start quando il trigger nasce
              // (split tardivo dopo fonts.ready, ri-split al resize a pagina
              // già scrollata) il reveal parte comunque. Doppio restart nello
              // stesso frame = nessuna differenza visibile.
              if (st.isActive) enter();
              return reveal;
            },
          });
        });

        // Creato in async (dopo fonts.ready): il context GSAP non lo raccoglie,
        // quindi tween + ScrollTrigger vanno uccisi esplicitamente qui.
        return () => {
          cancelled = true;
          out?.kill();
          out = null;
          st?.kill();
          st = null;
          tween?.scrollTrigger?.kill();
          tween?.kill();
          tween = null;
          split?.revert();
          split = null;
        };
      });
    },
    // revertOnUpdate (regola del repo per useGSAP con dipendenze): senza,
    // un cambio di prop ri-eseguirebbe il callback SENZA revert e
    // accumulerebbe matchMedia + split + trigger. In pratica le deps sono
    // costanti per call-site (il cambio lingua rimonta via key), ma la rete
    // deve esserci comunque.
    { scope: ref, dependencies: [delay, stagger, exit, locale], revertOnUpdate: true }
  );

  return (
    <Tag key={locale} ref={ref} className={className}>
      {children}
    </Tag>
  );
}
