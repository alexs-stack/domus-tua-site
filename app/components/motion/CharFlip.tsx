"use client";

/* ═══════════════════════════════════════════════════════════════════════════
   CHARFLIP — il reveal dei titoli di era-residence, portato uguale.

   Legge esatta (reverse-engineering/era-residence/README.md §7, riga 327,
   animatore `h`): split in WORDS + CHARS, poi
     opacity 0 → 1
     yPercent 50 → 0
     rotateY  90 → 0        ← è questo a fare la differenza
     stagger  0.05
   Il rotateY per carattere è la firma: senza, resta un banale fade-up e il
   titolo non "gira". Serve una prospettiva sul contenitore, altrimenti la
   rotazione 3D collassa in uno schiacciamento orizzontale.

   Lo split è su DUE livelli e non uno solo perché i chars devono poter andare
   a capo per parola: splittando solo in caratteri, una parola si spezzerebbe a
   metà a fine riga. È lo stesso motivo per cui il riferimento fa words+chars.

   Differenza da TextLines (l'altro rivelatore del sito): quello maschera le
   RIGHE e le fa salire, ed è il gesto editoriale dei paragrafi lunghi. Questo
   lavora sul singolo carattere ed è per i titoli brevi. Non vanno usati sullo
   stesso elemento: due leggi sulle stesse righe si annullano.

   Progressive enhancement: senza JS o con reduced-motion il titolo è
   normalissimo testo, mai nascosto (SSR e SEO intatti). L'innesco è un
   IntersectionObserver, non ScrollTrigger: in fondo alla home, sotto le
   runway pinnate, le posizioni di ScrollTrigger arrivano sfasate.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useRef, type ElementType, type ReactNode } from "react";
import { SplitText } from "gsap/SplitText";
import { gsap, MQ } from "../../lib/motion/gsap";
import { registerWarmup } from "../../lib/motion/warmup";

// Registrato QUI, come fa TextLines: SplitText serve solo ai rivelatori di
// testo e registrarlo nel modulo condiviso lo farebbe finire nel chunk di GSAP,
// cioe nel primo caricamento di ogni pagina.
gsap.registerPlugin(SplitText);

/* Lo stagger del reveal è distribuito su una DURATA (amount), non per
   carattere: dimezzarlo in uscita significa dimezzare quell'ammontare. */
const REVEAL_AMOUNT = 1.05;
const EXIT_DUR = 0.4;

export default function CharFlip({
  children,
  as: Tag = "h2",
  className = "",
  delay = 0,
  exit = false,
}: {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /** ritardo in secondi, per scalare l'ingresso con l'eyebrow che lo precede */
  delay?: number;
  /**
   * LO STATO DI USCITA (dossier era-residence §2.4 / §7: reveal durL 1.2 vs
   * hide durS 0.4, stagger dimezzato). Risalendo la pagina i caratteri non
   * si limitano a tornare nascosti: girano dalla parte OPPOSTA a quella da
   * cui erano arrivati (rotateY -90 invece di 90) e salgono (yPercent -50).
   * È la metà che manca al gesto: senza, tornando indietro il titolo
   * scompare e basta, e una pagina lunga smette di sembrare continua.
   * Default false: senza la prop il comportamento storico è identico.
   */
  exit?: boolean;
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia(MQ.motionOk).matches) return;

    let split: SplitText | null = null;
    let tl: gsap.core.Timeline | null = null;
    let out: gsap.core.Tween | null = null;
    let io: IntersectionObserver | null = null;
    let safety = 0;

    const start = () => {
      if (!ref.current) return;
      split = new SplitText(el, { type: "words,chars", charsClass: "dt-cflip_c" });
      const chars = split.chars;
      tl = gsap
        .timeline({ paused: true })
        .fromTo(
          chars,
          { opacity: 0, yPercent: 50, rotateY: 90 },
          {
            opacity: 1,
            yPercent: 0,
            rotateY: 0,
            duration: 0.9,
            ease: "power3.out",
            // Il riferimento usa 0.05 PER CARATTERE, che e giusto sui suoi
            // titoli brevi. I nostri vanno su due o tre righe: misurato, 62
            // caratteri diventavano 4 secondi di attesa e l ultimo era ancora
            // invisibile dopo 2,2s.  distribuisce lo stesso gesto su
            // una durata fissa, quindi il titolo si compone sempre in poco
            // piu di un secondo, lungo o corto che sia.
            stagger: { amount: REVEAL_AMOUNT, from: "start" },
          },
          delay
        );

      const enter = () => {
        // L'uscita eventualmente in corso va uccisa PRIMA del restart:
        // due tween sugli stessi caratteri si contendono rotateY nello
        // stesso tick e il titolo "vibra".
        out?.kill();
        out = null;
        tl?.restart();
      };
      const leaveBack = () => {
        tl?.pause();
        out?.kill();
        out = gsap.to(chars, {
          opacity: 0,
          yPercent: -50,
          rotateY: -90,
          duration: EXIT_DUR,
          ease: "power2.in",
          stagger: { amount: REVEAL_AMOUNT / 2, from: "start" },
        });
      };

      io = new IntersectionObserver(
        (entries) =>
          entries.forEach((e) => {
            if (e.isIntersecting) {
              enter();
              return;
            }
            /* Direzione dell'uscita. L'IntersectionObserver non ha
               l'onLeaveBack di ScrollTrigger, ma la geometria ce lo dice:
               se il bordo alto dell'elemento è ancora sotto la piega
               (top > 0) il titolo è uscito DAL BASSO, cioè stiamo
               risalendo — è il caso in cui il riferimento fa `hide`.
               Uscito in alto (top < 0) il titolo è fuori campo comunque:
               lì il reset secco di sempre costa meno di una tween. */
            if (exit && e.boundingClientRect.top > 0) leaveBack();
            else tl?.pause(0);
          }),
        { threshold: 0.2, rootMargin: "0px 0px -10% 0px" }
      );
      io.observe(el);
      // Rete di sicurezza del sito: un titolo non può restare invisibile.
      safety = window.setTimeout(() => tl?.progress(1), 2600);
    };

    /* LO SPLIT SI FA DIETRO IL SIPARIO, non al primo scroll.
       Spezzare un titolo in parole e caratteri e' lavoro di DOM vero: su un
       titolo di sessanta caratteri sono altrettanti <span> creati e misurati.
       Farlo quando il titolo entra in campo significa pagarlo mentre l utente
       sta scorrendo, ed e' esattamente il tipo di lavoro che il precarico
       esiste per assorbire (stessa iscrizione di Fioritura, TeamTrail e
       Header). Il precarico attende gia' document.fonts.ready per conto suo,
       quindi qui i font sono garantiti: misurare prima spezzerebbe le parole
       nei punti sbagliati, perche i font sono Playfair.
       Se il precarico e gia passato (visitatore di ritorno, o intro saltata)
       registerWarmup lo fa partire subito: nessuno resta indietro. */
    const disiscrivi = registerWarmup(start);

    return () => {
      disiscrivi();
      window.clearTimeout(safety);
      io?.disconnect();
      out?.kill();
      tl?.kill();
      split?.revert();
    };
  }, [delay, exit]);

  return (
    <Tag ref={ref} className={`dt-cflip ${className}`}>
      {children}
    </Tag>
  );
}
