// Il Segno Domus — elemento differenziante ricorrente.
// Derivato dal logo (casa + cuore): una linea-tetto rossa (il "riparo") e una
// linea-abbraccio grigia sotto (l'accompagnamento). Sottile, mai invadente.
// Vedi docs/brand-motif.md.

type MotifProps = {
  className?: string;
  /** mostra la linea-abbraccio grigia sotto il tetto */
  embrace?: boolean;
};

export function SegnoDomus({ className = "h-4 w-10", embrace = true }: MotifProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 40"
      fill="none"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* linea-tetto (rossa) */}
      <path
        d="M8 29 L50 9 L92 29"
        stroke="var(--color-red)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* linea-abbraccio (grigia) */}
      {embrace && (
        <path
          d="M16 35 Q50 23 84 35"
          stroke="var(--color-graphite)"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.45"
        />
      )}
    </svg>
  );
}

/**
 * Accento d'angolo per card/superfici premium: un piccolo Segno Domus in trasparenza.
 */
export function MotifCorner({ className = "" }: { className?: string }) {
  return (
    <span className={`pointer-events-none absolute ${className}`} aria-hidden>
      <SegnoDomus className="h-6 w-16 opacity-[0.12]" embrace={false} />
    </span>
  );
}
