/* ═══════════════════════════════════════════════════════════════════════════
   SURFACEVEIL — il colore entra DENTRO la fotografia.

   SurfaceFlow risolve i confini colore↔colore interpolando (vedi lì il
   perché). Ma una fotografia è opaca: nessuna interpolazione la raggiunge, e
   il bordo fra una campitura e una foto è il salto più violento della home
   (misurato: ΔRGB 520 fra hero e ricerca, 381 fra Percorsi e Metodo).

   La soluzione del riferimento è un velo (era-residence §1.6,
   `.loc-w_over-grad`): un gradiente alto ~20vw, ancorato al bordo, che porta
   il colore della pagina dentro l'immagine PRIMA della giuntura. Non
   nasconde il taglio: lo scioglie, perché quando i due bordi si incontrano
   hanno già lo stesso colore.

   Usa `--dt-surface` quando la superficie continua è accesa, e il tono
   statico come fallback: così funziona anche senza JS.

   Va messo dentro un contenitore `relative` (di solito lo stesso che ospita
   la foto), sopra la foto e sotto il testo.
   ═══════════════════════════════════════════════════════════════════════════ */

import type { Tone } from "./ToneShift";

export default function SurfaceVeil({
  /** su quale bordo della foto sta il velo */
  edge,
  /** tono di ripiego quando la superficie continua non è attiva */
  tone,
  /** altezza del velo: era-residence usa ~20vw, qui in svh */
  height = "26svh",
  /** quanto il colore arriva pieno sul bordo (1 = opaco) */
  strength = 1,
  className = "",
}: {
  edge: "top" | "bottom";
  tone: Tone;
  height?: string;
  strength?: number;
  className?: string;
}) {
  const color = `var(--dt-surface, var(--color-${tone}))`;
  // color-mix per l'alfa: `strength` sotto 1 lascia trasparire la foto anche
  // sul bordo, utile dove l'immagine deve restare protagonista.
  const solid = strength >= 1 ? color : `color-mix(in srgb, ${color} ${strength * 100}%, transparent)`;
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute inset-x-0 z-[5] ${edge === "top" ? "top-0" : "bottom-0"} ${className}`}
      style={{
        height,
        // Il colore è pieno SUL bordo e si scioglie verso l'interno della
        // foto: 180deg parte dall'alto, 0deg dal basso.
        background: `linear-gradient(${edge === "top" ? 180 : 0}deg, ${solid} 0%, transparent 100%)`,
      }}
    />
  );
}
