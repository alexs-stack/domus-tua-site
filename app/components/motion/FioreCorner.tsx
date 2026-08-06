"use client";

/* ═══════════════════════════════════════════════════════════════════════════
   FIORECORNER — il tralcio d'angolo, in SVG.

   Il ventre della home (Metodo → Open Domus → D.O.C. → Servizi →
   Testimonial) non aveva NESSUNA fioritura: i fiori vivevano solo negli atti
   dell'orizzonte, in Percorsi, nel Team e nei Contatti. Il cliente li ha
   chiesti «negli angoli», ed è lì che mancavano.

   PERCHÉ NON `Fioritura`. Fioritura.tsx (canvas 2D, porting uuuulala) è
   bellissima ma costosa: campiona il disegno pixel per pixel per ricavarne
   migliaia di particelle, e il preloader anticipa apposta quel lavoro (la
   suite e2e verifica che i canvas siano già campionati prima dello scroll).
   Moltiplicarla per cinque sezioni allungherebbe il precarico. Questo è il
   fratello leggero: tracciati vettoriali, costo prossimo a zero.

   REGOLE ANTI-RUMORE — senza queste diventa carta da parati:
     · UN SOLO tralcio per schermata;
     · mai due nello stesso angolo in sezioni consecutive;
     · l'angolo lo sceglie il VUOTO, non una rotazione fissa. La prima
       versione girava tl → br → tr → bl per disciplina e finiva addosso al
       testo: in home la sequenza reale è br (Metodo) · tr (D.O.C.) · br
       (Servizi) · tl (Testimonial), perché è lì che le colonne lasciano
       spazio. Due `br` non consecutivi valgono meno di un tralcio sopra
       una parola;
     · mai sopra un testo: solo nei margini esterni della colonna, oppure
       DENTRO una fotografia nell'angolo che il testo non occupa (lì il
       tralcio non può nemmeno essere tagliato dall'overflow della sezione —
       era il difetto della prima collocazione nel Metodo: a 1280px ne
       restavano fuori 120 su 224);
     · opacità max 0.40 su crema, 0.55 su fotografia scura;
     · sotto lg non esiste (in colonna stretta un angolo finisce sempre
       addosso al testo).

   DISEGNATO DA NOI. Gli asset floreali di era-residence sono proprietari e
   non vanno pubblicati (nota legale in testa al dossier): questi tracciati
   sono originali, il riferimento è solo il ruolo che i fiori hanno nella
   composizione.

   PROGRESSIVE ENHANCEMENT: nel markup il tralcio è già disegnato per intero.
   Lo stato "da disegnare" (dasharray) lo scrive SOLO il JS sotto motionOk,
   così senza JS o con reduced-motion la decorazione è semplicemente lì.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useRef } from "react";
import { gsap, useGSAP, MQ, dur, stagger } from "../../lib/motion/gsap";

type Corner = "tl" | "tr" | "bl" | "br";

/** Foglia: mandorla ancorata al gambo, orientata dal `rotate` del gruppo. */
const LEAF = "M0 0C5 -3.4 11.4 -1.6 13.6 3.8C8.2 7 2.2 5.2 0 0Z";

/* Tre tralci, tutti "nati" dall'angolo alto-sinistro del viewBox: le altre
   tre posizioni sono lo stesso disegno specchiato, così il segno resta uno
   solo e la pagina non colleziona illustrazioni diverse. */
const SPRIGS = [
  {
    stems: [
      "M6 8C26 22 40 40 52 66C58 80 60 92 58 106",
      "M22 20C34 18 46 24 54 34",
      "M40 46C30 54 22 66 20 80",
    ],
    leaves: [
      { x: 26, y: 24, r: -18 },
      { x: 34, y: 56, r: 142 },
    ],
    buds: [
      { x: 54, y: 34, r: 3.1 },
      { x: 20, y: 80, r: 2.5 },
      { x: 58, y: 106, r: 3.6 },
    ],
  },
  {
    stems: [
      "M8 6C22 26 30 46 34 70C36 84 34 96 28 108",
      "M18 22C32 26 44 36 50 50",
      "M31 58C44 62 56 72 62 86",
    ],
    leaves: [
      { x: 22, y: 30, r: 12 },
      { x: 33, y: 74, r: 160 },
    ],
    buds: [
      { x: 50, y: 50, r: 3.4 },
      { x: 62, y: 86, r: 2.6 },
      { x: 28, y: 108, r: 3 },
    ],
  },
  {
    stems: [
      "M5 10C30 24 48 44 60 70",
      "M14 4C20 28 24 52 22 78",
      "M40 36C52 34 64 40 72 52",
    ],
    leaves: [
      { x: 18, y: 34, r: 96 },
      { x: 44, y: 40, r: -26 },
    ],
    buds: [
      { x: 60, y: 70, r: 3.4 },
      { x: 22, y: 78, r: 2.7 },
      { x: 72, y: 52, r: 2.9 },
    ],
  },
] as const;

const FLIP: Record<Corner, string> = {
  tl: "none",
  tr: "scaleX(-1)",
  bl: "scaleY(-1)",
  br: "scale(-1, -1)",
};

export default function FioreCorner({
  corner = "tl",
  seed = 0,
  className = "",
  /** deriva in scrub: i due versi del riferimento */
  drift = "y",
  /** opacità del tralcio: 0.40 su crema, fino a 0.55 su foto scura */
  opacity = 0.34,
}: {
  corner?: Corner;
  seed?: 0 | 1 | 2;
  className?: string;
  drift?: "x" | "y" | "none";
  opacity?: number;
}) {
  const rootRef = useRef<HTMLSpanElement | null>(null);
  const sprig = SPRIGS[seed];

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const mm = gsap.matchMedia();
      mm.add(`${MQ.motionOk} and (min-width: 1024px)`, () => {
        const stems = gsap.utils.toArray<SVGPathElement>(root.querySelectorAll("[data-fiore-stem]"));
        const petals = gsap.utils.toArray<SVGElement>(root.querySelectorAll("[data-fiore-bud], [data-fiore-leaf]"));

        // Il tralcio si disegna: ogni gambo parte da sé stesso arrotolato.
        // getTotalLength e non pathLength: qui non c'è preserveAspectRatio
        // "none", quindi lo spazio del dash è quello del tracciato (la
        // trappola del dash in spazio-schermo vale solo con la scala non
        // uniforme — vedi la nota in ToneShift).
        const draw = gsap.timeline({
          scrollTrigger: {
            trigger: root,
            start: "top 92%",
            // Rigioca a ogni passaggio, nei due versi: è la regola del sito.
            toggleActions: "restart none none reverse",
          },
        });
        stems.forEach((p, i) => {
          const len = p.getTotalLength();
          draw.fromTo(
            p,
            { strokeDasharray: len, strokeDashoffset: len },
            { strokeDashoffset: 0, duration: dur.reveal + 0.2, ease: "dtOut" },
            i * stagger.lines
          );
        });
        draw.fromTo(
          petals,
          { scale: 0, transformOrigin: "center center" },
          { scale: 1, duration: dur.short, ease: "domus", stagger: stagger.chars },
          dur.short * 0.6
        );

        // La vita: una deriva lenta in scrub. Un tralcio fermo su una pagina
        // che scorre legge come un adesivo.
        const move =
          drift === "none"
            ? null
            : gsap.fromTo(
                root,
                drift === "x" ? { xPercent: 0 } : { yPercent: 0 },
                {
                  ...(drift === "x" ? { xPercent: -18 } : { yPercent: 14 }),
                  ease: "none",
                  scrollTrigger: {
                    trigger: root,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: 0.5,
                  },
                }
              );

        return () => {
          draw.scrollTrigger?.kill();
          draw.kill();
          move?.scrollTrigger?.kill();
          move?.kill();
          // Il tralcio deve tornare INTERO: senza questo, uscendo dal regime
          // desktop resterebbe a metà disegno per sempre.
          gsap.set(stems, { clearProps: "strokeDasharray,strokeDashoffset" });
          gsap.set(petals, { clearProps: "transform" });
        };
      });
    },
    { scope: rootRef, dependencies: [seed, drift], revertOnUpdate: true }
  );

  return (
    <span
      ref={rootRef}
      aria-hidden
      className={`dt-fiore pointer-events-none absolute z-0 hidden text-red lg:block ${className}`}
      style={{ opacity }}
    >
      <svg viewBox="0 0 120 120" fill="none" style={{ transform: FLIP[corner] }} xmlns="http://www.w3.org/2000/svg">
        {sprig.stems.map((d) => (
          <path
            key={d}
            data-fiore-stem
            d={d}
            stroke="currentColor"
            strokeWidth={1.25}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {sprig.leaves.map((l) => (
          <g key={`${l.x}-${l.y}`} transform={`translate(${l.x} ${l.y}) rotate(${l.r})`}>
            <path data-fiore-leaf d={LEAF} fill="currentColor" opacity={0.42} />
          </g>
        ))}
        {sprig.buds.map((b) => (
          <circle key={`${b.x}-${b.y}`} data-fiore-bud cx={b.x} cy={b.y} r={b.r} fill="currentColor" />
        ))}
      </svg>
    </span>
  );
}
