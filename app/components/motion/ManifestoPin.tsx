"use client";

// ManifestoPin — il momento firma di /metodo: banda espresso a tutto viewport
// dove il manifesto si "legge" con lo scroll. Le parole si accendono in scrub
// (pattern ScrubWords) e, sul finale, l'ago cuce la parola chiave
// (sottolineatura stroke-draw).
//
// UNA TIMELINE SOLA, A OGNI LARGHEZZA («parità mobile 2», scheda 12). La
// forma del film non dipende dalla larghezza: parole nei primi 4/5, ago
// nell'ultimo quinto. Cambia SOLO come la si scorre — da lg in su la banda si
// pinna e la corsa è un corridoio di +160%, sotto non c'è pin e la corsa è la
// traversata della sezione (top 85% → top 15%, ~70vh a 844: la sezione è già
// alta 70svh, il pin non serve e sul telefono ruberebbe scroll, legge 4).
// Prima il telefono aveva la stessa accensione ma in un'altra FORMA — corsa
// corta (top 80% → top 35%), stagger fisso .4 e l'ago in un toggle a parte:
// stesso gesto, film diverso. L'ago è rientrato nella timeline, e questo è
// l'alleggerimento nominato: −1 ScrollTrigger sul telefono.
// a11y: frase intera in uno <span> sr-only, parole animate aria-hidden con
// spazi reali nel DOM. Senza JS o con reduced-motion: testo pieno e
// sottolineatura intera, statici.
import { useRef } from "react";
import { SegnoDomusBadge } from "../BrandMotif";
import { ArrowUpRight } from "../Icons";
import { gsap, useGSAP, MQ } from "../../lib/motion/gsap";

// Stati del reveal in clip-path della sottolineatura: niente stroke-dash —
// con preserveAspectRatio="none" + non-scaling-stroke Chrome calcola i dash
// in spazio schermo e il tratto resta monco (o spunta) a seconda della
// larghezza della parola. Il clip da sinistra è immune alla scala.
const UNDERLINE_HIDDEN = "inset(-20% 100% -20% 0)";
const UNDERLINE_SHOWN = "inset(-20% 0% -20% 0)";

type Props = {
  eyebrow: string;
  text: string;
  highlight: string;
  link: { label: string; href: string };
};

// Range [prima, ultima] (indici inclusivi) delle parole di `text` che
// intersecano la substring `highlight`; null se non è una substring.
function highlightRange(text: string, highlight: string): [number, number] | null {
  const at = text.indexOf(highlight);
  if (at === -1) return null;
  const end = at + highlight.length;
  let pos = 0;
  let first = -1;
  let last = -1;
  text.split(" ").forEach((w, i) => {
    if (pos < end && pos + w.length > at) {
      if (first === -1) first = i;
      last = i;
    }
    pos += w.length + 1;
  });
  return first === -1 ? null : [first, last];
}

export default function ManifestoPin({ eyebrow, text, highlight, link }: Props) {
  const rootRef = useRef<HTMLElement | null>(null);

  const words = text.split(" ");
  const range = highlightRange(text, highlight);
  if (!range && process.env.NODE_ENV !== "production") {
    console.warn(`ManifestoPin: highlight "${highlight}" non è una substring di text — rendo senza sottolineatura.`);
  }

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
      const wordEls = gsap.utils.toArray<HTMLElement>("[data-w]", root);
      if (!wordEls.length) return;
      const underline = root.querySelector<SVGSVGElement>("[data-underline]");

      const mm = gsap.matchMedia();
      // Il pin vive solo da lg in su (come ThreadNav): sotto, la banda scorre.
      mm.add({ pin: MQ.lg, motionOk: MQ.motionOk }, (ctx) => {
        const c = ctx.conditions as { pin: boolean; motionOk: boolean };
        // Reduced-motion: nessun set via JS — testo pieno, sottolineatura intera.
        if (!c.motionOk) return;

        // La sottolineatura si nasconde SOLO qui (senza JS resta visibile).
        if (underline) {
          gsap.set(underline, { clipPath: UNDERLINE_HIDDEN });
        }

        // Il link NON si anima: resta sempre visibile e raggiungibile da
        // tastiera anche a metà scrub (la variante animata richiederebbe
        // reti di sicurezza focusin su una timeline scrubbata).

        // L'UNICO parametro che cambia con la larghezza: come si scorre la
        // timeline. Da lg in su la banda si pinna e la corsa è un corridoio
        // di +160%. Sotto, nessun pin (legge 4: mai rubare lo scroll) e la
        // corsa è la traversata della sezione — 70% di viewport, che è
        // esattamente l'altezza della banda (min-h-[70svh]): il manifesto
        // finisce di accendersi quando ha finito di entrare.
        const st = c.pin
          ? {
              trigger: root,
              start: "top top",
              end: "+=160%",
              pin: true,
              scrub: true,
              anticipatePin: 1,
            }
          : { trigger: root, start: "top 85%", end: "top 15%", scrub: true };

        // Le parole occupano i primi 4/5 della timeline, l'ago cuce
        // nell'ultimo quinto. Lo stagger è ricavato dal numero di parole
        // (0,55 spalmato su tutte) e non è una costante: cambiando lingua la
        // frase cambia lunghezza, la coreografia no.
        const tl = gsap.timeline({ scrollTrigger: st });
        tl.fromTo(
          wordEls,
          { opacity: 0.15 },
          {
            opacity: 1,
            ease: "none",
            duration: 0.25,
            stagger: 0.55 / Math.max(wordEls.length - 1, 1),
          },
          0
        );
        if (underline) {
          tl.to(underline, { clipPath: UNDERLINE_SHOWN, ease: "none", duration: 0.2 }, 0.8);
        }

        return () => {
          if (underline) gsap.set(underline, { clearProps: "clipPath" });
        };
      });
    },
    // revertOnUpdate: al cambio di `text` (switch lingua) il context viene
    // revertato PRIMA di ri-eseguire il callback (vedi ScrubWords).
    { scope: rootRef, dependencies: [text], revertOnUpdate: true }
  );

  // Parola animata: spazio reale nel DOM (separa le parole in
  // innerText/copy/crawler); `mr` false per l'ultima dentro l'evidenziato,
  // dove il margine sta sul wrapper (la sottolineatura non deve includerlo).
  const word = (w: string, i: number, mr = true) => (
    <span key={i} data-w aria-hidden className={mr ? "mr-[0.28em] inline-block" : "inline-block"}>
      {w + " "}
    </span>
  );

  return (
    <section
      ref={rootRef}
      className="relative flex min-h-[70svh] items-center overflow-hidden bg-espresso text-cream lg:min-h-[100svh]"
    >
      <div className="mx-auto w-full max-w-5xl px-5 py-24 text-center sm:px-8 sm:py-28">
        <SegnoDomusBadge light>{eyebrow}</SegnoDomusBadge>

        <h2 className="mt-7 font-display text-4xl font-medium leading-[1.1] tracking-[-0.02em] sm:text-6xl lg:text-[4.4rem]">
          {/* Testo completo per screen reader e estrazione testo */}
          <span className="sr-only">{text}</span>
          {range ? (
            <>
              {words.slice(0, range[0]).map((w, i) => word(w, i))}
              <span
                className={`relative mr-[0.28em] inline-block text-red-soft${
                  range[1] > range[0] ? " whitespace-nowrap" : ""
                }`}
              >
                {words
                  .slice(range[0], range[1] + 1)
                  .map((w, j) => word(w, range[0] + j, j < range[1] - range[0]))}
                {/* L'ago che cuce: si disegna sul finale dello scrub */}
                <svg
                  data-underline
                  aria-hidden
                  viewBox="0 0 100 10"
                  preserveAspectRatio="none"
                  className="pointer-events-none absolute -bottom-[0.06em] left-0 right-0 h-[0.24em]"
                >
                  <path
                    d="M 2 7 C 20 10, 45 3, 62 6 S 92 8, 98 5"
                    fill="none"
                    stroke="var(--color-red)"
                    strokeWidth="2.5"
                    vectorEffect="non-scaling-stroke"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              {words.slice(range[1] + 1).map((w, j) => word(w, range[1] + 1 + j))}
            </>
          ) : (
            words.map((w, i) => word(w, i))
          )}
        </h2>

        <a
          href={link.href}
          className="group mt-9 inline-flex items-center gap-2 text-sm font-semibold text-red-soft transition-colors hover:text-cream"
        >
          {link.label}
          <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </a>
      </div>
    </section>
  );
}
