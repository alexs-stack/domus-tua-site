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

export default function CharFlip({
  children,
  as: Tag = "h2",
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /** ritardo in secondi, per scalare l'ingresso con l'eyebrow che lo precede */
  delay?: number;
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia(MQ.motionOk).matches) return;

    let split: SplitText | null = null;
    let tl: gsap.core.Timeline | null = null;
    let io: IntersectionObserver | null = null;
    let safety = 0;

    const start = () => {
      if (!ref.current) return;
      split = new SplitText(el, { type: "words,chars", charsClass: "dt-cflip_c" });
      tl = gsap
        .timeline({ paused: true })
        .fromTo(
          split.chars,
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
            stagger: { amount: 1.05, from: "start" },
          },
          delay
        );

      io = new IntersectionObserver(
        (entries) => entries.forEach((e) => (e.isIntersecting ? tl?.restart() : tl?.pause(0))),
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
      tl?.kill();
      split?.revert();
    };
  }, [delay]);

  return (
    <Tag ref={ref} className={`dt-cflip ${className}`}>
      {children}
    </Tag>
  );
}
