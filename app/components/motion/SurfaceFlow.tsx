"use client";

/* ═══════════════════════════════════════════════════════════════════════════
   SURFACEFLOW — una sola superficie, il colore viaggia (2026-08-06).

   PERCHÉ ESISTE. Il cliente continuava a vedere «il taglio fra bianco e
   beige». Le cause erano tre, e le cuciture ne coprivano una sola:

     1. cambio di COLORE fra due sezioni (ΔRGB 11-72) — le cuciture;
     2. cambio di ILLUMINAZIONE: `.bg-cream/.bg-cream-deep/.bg-paper` portano
        un `radial-gradient(… at 50% -12%)` ancorato al bordo ALTO di OGNI
        sezione. Due sezioni dello STESSO colore accostate disegnano comunque
        una linea, perché la luce riparte da capo. Nessuna cucitura può
        risolverlo: non è un cambio di colore, è un cambio di luce.
        (La stessa diagnosi aveva già fatto togliere la "messa a terra" in
        fondo alle sezioni — vedi globals.css, blocco superfici.);
     3. colore contro FOTOGRAFIA (ΔRGB 263 e 563) — lì serve un velo, perché
        una foto è opaca e nessuna interpolazione la raggiunge.

   COSA FA. Come era-residence (§1.6 del dossier: `initThemeChange`, le strip
   invisibili `.hero_themes_light`, il colore che cambia PRIMA del bordo), la
   pagina ha UNA superficie sola: le sezioni marcate `data-surface` diventano
   trasparenti e il colore di fondo interpola con lo scroll, cominciando
   ~45svh prima della giuntura. Il bloom diventa uno solo, ancorato al
   VIEWPORT, quindi non riparte mai da nessun bordo.

   Risultato: i confini colore→colore non esistono più — non sono nascosti
   meglio, proprio non ci sono.

   PROGRESSIVE ENHANCEMENT. Senza JS l'attributo `data-surfaceflow` non
   arriva, le `.bg-*` restano quelle di sempre e la pagina è identica a
   prima. Il componente si auto-disattiva sotto le 2 tappe, così le pagine
   interne (che non marcano nulla) non cambiano di una virgola.

   NON è gated su reduced-motion: qui non si muove niente: cambia un colore
   di fondo, e cambiarlo con continuità è MENO aggressivo che cambiarlo di
   scatto a ogni bordo.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useRef } from "react";
import { ScrollTrigger, useGSAP } from "../../lib/motion/gsap";

/** Quanto prima della giuntura comincia la virata, in frazione di viewport. */
const RAMP = 0.5;
/** Quanto della rampa sta PRIMA del bordo (il resto lo supera). */
const LEAD = 0.8;

type Stop = { top: number; rgb: [number, number, number] };

function parse(color: string): [number, number, number] | null {
  const c = color.trim();
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c);
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].replace(/./g, (d) => d + d) : hex[1];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  const m = /^rgba?\(([^)]+)\)$/i.exec(c);
  if (m) {
    const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    if (p.length >= 3 && p.every((n) => Number.isFinite(n))) return [p[0], p[1], p[2]];
  }
  return null;
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
/** smoothstep: agli estremi la virata parte e finisce senza spigoli. */
const smooth = (t: number) => t * t * (3 - 2 * t);

export default function SurfaceFlow() {
  const doneRef = useRef(false);

  useGSAP(() => {
    const root = document.documentElement;
    const marks = Array.from(document.querySelectorAll<HTMLElement>("[data-surface]"));
    if (marks.length < 2) return;

    const cs = getComputedStyle(root);
    let stops: Stop[] = [];
    let last = "";

    const measure = () => {
      stops = marks
        .map((el) => {
          const rgb = parse(cs.getPropertyValue(`--color-${el.dataset.surface}`));
          if (!rgb) return null;
          return { top: el.getBoundingClientRect().top + window.scrollY, rgb };
        })
        .filter((s): s is Stop => s !== null)
        .sort((a, b) => a.top - b.top);
    };

    const paint = () => {
      if (stops.length < 2) return;
      const ramp = window.innerHeight * RAMP;
      // Punto di riferimento: il centro dello schermo, non il bordo alto —
      // così la virata è finita quando la giuntura arriva davvero all'occhio.
      const y = window.scrollY + window.innerHeight * 0.5;

      let [r, g, b] = stops[0].rgb;
      for (let i = 1; i < stops.length; i++) {
        const t = clamp01((y - (stops[i].top - ramp * LEAD)) / ramp);
        if (t <= 0) break;
        if (t >= 1) {
          [r, g, b] = stops[i].rgb;
          continue;
        }
        const k = smooth(t);
        const n = stops[i].rgb;
        r += (n[0] - r) * k;
        g += (n[1] - g) * k;
        b += (n[2] - b) * k;
      }

      // Una sola scrittura di stile per frame, e solo se il colore è cambiato.
      const next = `rgb(${Math.round(r)} ${Math.round(g)} ${Math.round(b)})`;
      if (next !== last) {
        root.style.setProperty("--dt-surface", next);
        last = next;
      }
    };

    measure();
    paint();
    root.setAttribute("data-surfaceflow", "");
    doneRef.current = true;

    const st = ScrollTrigger.create({
      start: 0,
      end: "max",
      invalidateOnRefresh: true,
      onRefresh: () => {
        measure();
        paint();
      },
      onUpdate: paint,
    });

    return () => {
      st.kill();
      root.removeAttribute("data-surfaceflow");
      root.style.removeProperty("--dt-surface");
    };
  }, []);

  return null;
}
