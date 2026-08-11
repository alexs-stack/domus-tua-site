"use client";

// ThreadNav — il filo rosso del Metodo diventa la navigazione delle pagine:
// un filo verticale fisso sul bordo destro che "si cuce" con lo scroll
// (riempimento rosso sul binario neutro), con nodi cliccabili posizionati
// in proporzione alla posizione reale delle sezioni nel documento.
// - Parametrico: `chapters` (id sezione + etichetta già tradotta) per le
//   pagine interne; senza prop restano i capitoli della home.
// - Solo desktop ≥1024 + motion ok, e i cancelli sono DUE: uno JS (MQ.lg
//   dentro matchMedia) e uno CSS (`motion-safe:lg:block` sul nav). Sotto la
//   soglia il rail è display:none e la nav vera resta l'header. Chi porterà il
//   filo sul telefono deve aprirli entrambi: aprirne uno solo lascia JS che
//   anima il nulla, o un rail visibile e morto.
// - Appare dopo il primo viewport (l'hero è scuro e va lasciato pulito).
// - Etichette: SOLO stringhe già tradotte del dizionario nav + nome brand.
// - Il fill anima solo transform (scaleY via quickSetter, zero layout).
import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, useGSAP, MQ } from "../../lib/motion/gsap";
import { getLenis } from "./SmoothScroll";
import { watchSurfaceTone } from "../../lib/ui/surface";
import { SegnoDomus } from "../BrandMotif";
import { useDict } from "../i18n/LocaleProvider";

export type ThreadChapter = { id: string; label: string };

export default function ThreadNav({
  chapters: chaptersProp,
}: {
  /** Capitoli della pagina (id sezione esistente + etichetta tradotta). Default: home. */
  chapters?: ThreadChapter[];
} = {}) {
  const d = useDict();
  const rootRef = useRef<HTMLElement | null>(null);
  const fillRef = useRef<HTMLSpanElement | null>(null);
  const shownRef = useRef(false);

  // Capitoli della home: id reali delle sezioni, etichette già tradotte.
  const chapters: ThreadChapter[] = chaptersProp ?? [
    { id: "top", label: "Domus Tua" },
    { id: "metodo", label: d.nav.metodo },
    { id: "recensioni", label: d.nav.recensioni },
    { id: "contatti", label: d.nav.contatti },
  ];

  useGSAP(
    () => {
      const root = rootRef.current;
      const fill = fillRef.current;
      if (!root || !fill) return;

      const mm = gsap.matchMedia();
      // Il filo vuole la colonna vuota sul bordo destro, che sotto i 1024 non
      // c'è: MQ.lg, la stessa soglia dell'uncover del footer (Footer.tsx).
      mm.add({ desktop: MQ.lg, motionOk: MQ.motionOk }, (ctx) => {
        const c = ctx.conditions as { desktop: boolean; motionOk: boolean };
        if (!c.motionOk) return;
        if (!c.desktop) {
          // FASE 2: qui va il ramo telefono/tablet del filo. Oggi non esiste
          // coreografia sotto lg — e chi la scriverà deve aprire anche il
          // cancello CSS `motion-safe:lg:block` sul nav in fondo al file,
          // altrimenti animerebbe un display:none.
          return;
        }

        const knots = gsap.utils.toArray<HTMLButtonElement>("[data-knot]", root);
        const setFill = gsap.quickSetter(fill, "scaleY");

        // Nodi in proporzione alla posizione di scroll della sezione: il filo
        // "tocca" il nodo quando la sezione entra a ~40% del viewport.
        const place = () => {
          const max = ScrollTrigger.maxScroll(window);
          if (max <= 0) return;
          knots.forEach((k) => {
            const target = document.getElementById(k.dataset.knot || "");
            if (!target) return;
            const y = target.getBoundingClientRect().top + window.scrollY;
            const frac = gsap.utils.clamp(
              0,
              1,
              (y - window.innerHeight * 0.4) / max
            );
            k.style.top = `${(frac * 100).toFixed(2)}%`;
          });
        };
        place();
        ScrollTrigger.addEventListener("refresh", place);

        // Un solo trigger globale: cuce il fill e decide la visibilità del rail
        // (compare dopo ~mezzo viewport, l'hero resta pulito).
        const seam = ScrollTrigger.create({
          start: 0,
          end: "max",
          onUpdate(self) {
            setFill(self.progress);
            const show = self.scroll() > window.innerHeight * 0.55;
            if (show !== shownRef.current) {
              shownRef.current = show;
              gsap.to(root, {
                autoAlpha: show ? 1 : 0,
                x: show ? 0 : 8,
                duration: 0.5,
                ease: "domus",
                overwrite: "auto",
              });
            }
          },
        });

        // Nodo attivo: un trigger leggero per sezione.
        const actives = chapters.map(({ id }) => {
          const el = document.getElementById(id);
          const knot = knots.find((k) => k.dataset.knot === id);
          if (!el || !knot) return null;
          return ScrollTrigger.create({
            trigger: el,
            start: "top 55%",
            end: "bottom 55%",
            onToggle(self) {
              knot.dataset.active = self.isActive ? "true" : "false";
              if (self.isActive) knot.setAttribute("aria-current", "true");
              else knot.removeAttribute("aria-current");
            },
          });
        });

        return () => {
          ScrollTrigger.removeEventListener("refresh", place);
          seam.kill();
          actives.forEach((st) => st?.kill());
        };
      });
    },
    // La chiave stringa evita ri-esecuzioni per nuove reference dell'array
    // chapters (i trigger dipendono solo dagli id, le etichette sono JSX).
    // revertOnUpdate: senza, il cambio lingua ri-eseguirebbe il callback SENZA
    // revert e accumulerebbe matchMedia + trigger + listener refresh a ogni switch.
    {
      scope: rootRef,
      dependencies: [d, chapters.map((c) => c.id).join("|")],
      revertOnUpdate: true,
    }
  );

  const goTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(el, { offset: -90 });
    else el.scrollIntoView({ behavior: "smooth" });
  };

  /* IL FILO SOPRA LE SUPERFICI SCURE.
     Il chrome sovrapposto — la parte di schermo sempre ferma e sempre
     visibile — restava cieco ai cambi di superficie: sopra i pannelli di
     "Due percorsi" o sopra il footer, traccia e etichette sparivano.
     Il campione si prende a SINISTRA del binario, non al suo centro: al
     centro elementFromPoint colpirebbe il binario stesso. Vedi lib/ui/surface
     per il motivo per cui un IntersectionObserver qui non basta. */
  // DIFETTO NOTO, da sanare in Fase 2: questo effetto parte sempre, anche sotto
  // lg dove il rail è display:none. Attacca scroll+resize passivi e un rAF per
  // un elemento che non è in campo (il samplePoint torna null per width 0, così
  // non sbaglia il tono — spreca soltanto). Va legato al cancello, non al mount.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    return watchSurfaceTone(el, () => {
      const r = el.getBoundingClientRect();
      if (r.width === 0) return null;
      return { x: r.left - 28, y: r.top + r.height / 2 };
    });
  }, []);

  return (
    <nav
      ref={rootRef}
      aria-label="Domus Tua"
      // opacity 0 inline: senza JS (o prima del primo scroll) il rail non esiste
      // visivamente; GSAP lo rivela. hidden sotto lg e con reduced-motion: è il
      // gemello CSS del cancello MQ.lg dentro matchMedia, e in Fase 2 i due si
      // aprono insieme o non si aprono affatto.
      style={{ opacity: 0, visibility: "hidden" }}
      className="group fixed right-6 top-1/2 z-30 hidden h-[44vh] w-6 -translate-y-1/2 motion-safe:lg:block"
    >
      {/* Binario + filo che si cuce (solo transform) */}
      <span aria-hidden className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-line transition-colors duration-500 group-data-[tone=dark]:bg-cream/25" />
      <span
        ref={fillRef}
        aria-hidden
        style={{ transform: "scaleY(0)" }}
        className="absolute inset-y-0 left-1/2 w-[1.5px] -translate-x-1/2 origin-top bg-red"
      />
      {/* Il Segno chiude il filo, come la firma chiude il Metodo */}
      <SegnoDomus
        className="absolute -bottom-5 left-1/2 h-2 w-6 -translate-x-1/2 text-red/70"
        embrace={false}
      />
      {chapters.map(({ id, label }, i) => (
        <button
          key={id}
          type="button"
          data-knot={id}
          aria-label={label}
          onClick={() => goTo(id)}
          style={{ top: `${(i / (chapters.length - 1)) * 100}%` }}
          className="group absolute left-1/2 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center"
        >
          <span
            aria-hidden
            className="h-2 w-2 rounded-full border border-stone/60 bg-paper transition-[transform,background-color,border-color] duration-300 group-hover:scale-125 group-hover:border-red group-data-[active=true]:scale-150 group-data-[active=true]:border-red group-data-[active=true]:bg-red group-data-[tone=dark]:border-cream/50 group-data-[tone=dark]:bg-cream/85"
          />
          {/* Etichetta: scivola dal filo verso sinistra su hover/attivo */}
          <span
            aria-hidden
            className="pointer-events-none absolute right-full mr-3 translate-x-1 whitespace-nowrap text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-stone opacity-0 transition-[opacity,transform] duration-300 group-hover:translate-x-0 group-hover:opacity-100 group-data-[active=true]:translate-x-0 group-data-[active=true]:text-red group-data-[active=true]:opacity-100 group-data-[tone=dark]:text-cream/85"
          >
            {label}
          </span>
        </button>
      ))}
    </nav>
  );
}
