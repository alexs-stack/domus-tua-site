// MarkBadge — il badge di marca statico (anello di tacche + monogramma).
//
// Vive in un file SENZA "use client" perché ha tre portatori con tre padroni:
// l'header, dove RotatingMark lo mette in controrotazione da GSAP; il sipario
// di PageTransition (`spinMarkBadge`); e — dal 2026-08-17 — la shell del
// preloader resa dal SERVER (PreloaderShell.tsx), dove gira con una @keyframes
// CSS prima ancora che arrivi il JavaScript. Un componente server può rendere
// un client component, ma ne farebbe un confine di idratazione: qui non c'è
// niente da idratare, è markup e basta. RotatingMark lo ri-esporta, così i
// chiamanti di prima non cambiano import.
//
// Due agganci, non uno: `[data-rot-ring]` e `[data-rot-mark]` girano in verso
// opposto (richiesta cliente, 2026-08), quindi non possono stare dentro lo
// stesso gruppo rotante.
import MarkDomus from "../MarkDomus";

// 60 tacche radiali sottili + 4 cardinali più lunghe: rosone tecnico-ornamentale
// che riprende i tagli netti del monogramma, senza ridisegnarlo.
// Coordinate precalcolate e ARROTONDATE a 2 decimali: i float di Math.cos/sin
// divergono nelle ultime cifre tra Node (SSR) e browser → hydration mismatch.
const TICKS = Array.from({ length: 60 }, (_, i) => {
  const deg = i * 6;
  const cardinal = deg % 90 === 0;
  const rad = (deg * Math.PI) / 180;
  const r1 = cardinal ? 40.5 : 43;
  const r2 = 46.5;
  const pt = (v: number) => v.toFixed(2);
  return {
    key: deg,
    cardinal,
    x1: pt(48 + r1 * Math.cos(rad)),
    y1: pt(48 + r1 * Math.sin(rad)),
    x2: pt(48 + r2 * Math.cos(rad)),
    y2: pt(48 + r2 * Math.sin(rad)),
  };
});

export function MarkBadge({
  className = "h-12 w-12",
  dark = false,
}: {
  className?: string;
  /** true = variante negativa del monogramma (crema + rosso) per fondi scuri */
  dark?: boolean;
}) {
  return (
    <span className={`relative inline-block ${className}`}>
      <svg
        data-rot-ring
        viewBox="0 0 96 96"
        fill="none"
        aria-hidden
        className="absolute inset-0 h-full w-full"
      >
        {TICKS.map((t) => (
          <line
            key={t.key}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke="currentColor"
            strokeWidth={t.cardinal ? 1.4 : 1}
            opacity={t.cardinal ? 0.9 : 0.5}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      {/* Centraggio con flexbox, NON con `-translate-x-1/2`: GSAP scrive
          `transform` sul monogramma e si porterebbe via il centraggio al primo
          frame — con reduced-motion o senza JS il logo resterebbe fuori posto.
          Il contenitore è `inset-0`, quindi `h-[52%]` continua a misurarsi
          sull'altezza del badge come prima. */}
      <span className="absolute inset-0 flex items-center justify-center">
        {/* Monogramma ufficiale: ruota su sé stesso nel verso opposto
            all'anello. Il rosso del logo resta rosso anche nella variante per
            fondi scuri. Dal 2026-08-06 è VETTORIALE (MarkDomus): il PNG da
            99×92 si sgranava appena il badge passava i ~50px.
            L'aggancio `data-rot-mark` sta sullo SPAN, non sull'svg: è lì che
            GSAP scrive il transform, e il componente non inoltra props. */}
        <span data-rot-mark className="inline-flex h-[52%] w-auto">
          <MarkDomus variant={dark ? "light" : "color"} className="h-full w-auto" />
        </span>
      </span>
    </span>
  );
}
