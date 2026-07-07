// ═══════════════════════════════════════════════════════════════════════════
// IL SEGNO DOMUS — sistema di identità visiva ricorrente di Domus Tua.
//
// Derivato dal logo (casa + cuore):
//   • linea-tetto ROSSA   = riparo / casa / direzione / protezione
//   • curva-abbraccio GRIGIA = accompagnamento / cura
//   • angolo/cornice       = la firma Domus Tua su qualsiasi superficie
//
// Regola d'uso: sottile ma riconoscibile. Mai invadente, mai più di un segno "forte"
// per schermata. Vedi docs/segno-domus.md.
// ═══════════════════════════════════════════════════════════════════════════

type MotifProps = {
  className?: string;
  /** mostra la curva-abbraccio grigia sotto il tetto */
  embrace?: boolean;
};

// ── Segno base: linea-tetto (+ abbraccio) ────────────────────────────────────
export function SegnoDomus({ className = "h-4 w-10", embrace = true }: MotifProps) {
  return (
    <svg className={className} viewBox="0 0 100 40" fill="none" aria-hidden xmlns="http://www.w3.org/2000/svg">
      <path
        d="M8 29 L50 9 L92 29"
        stroke="var(--color-red)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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

// Alias semantico: la linea-tetto come elemento a sé.
export const SegnoDomusLine = SegnoDomus;

// ── Segno "tick": mini linea-tetto come punto elenco di marca (sostituisce il ✓ generico) ──
export function SegnoTick({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden xmlns="http://www.w3.org/2000/svg">
      <path d="M4 15 L12 7 L20 15" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Accento d'angolo semplice (in trasparenza), per card/superfici ───────────
export function MotifCorner({ className = "" }: { className?: string }) {
  return (
    <span className={`pointer-events-none absolute ${className}`} aria-hidden>
      <SegnoDomus className="h-6 w-16 opacity-[0.12]" embrace={false} />
    </span>
  );
}

// ── Angolo "firma": due bracket ad angolo (rosso + grigio) ───────────────────
// position: passare via className (es. "left-3 top-3"). Ruotare con `rotate`.
export function SegnoDomusCorner({
  className = "",
  rotate = 0,
  size = 26,
}: {
  className?: string;
  rotate?: number;
  size?: number;
}) {
  return (
    <span
      className={`pointer-events-none absolute ${className}`}
      style={{ transform: `rotate(${rotate}deg)` }}
      aria-hidden
    >
      <svg width={size} height={size} viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 12 V4 a2 2 0 0 1 2-2 h8" stroke="var(--color-red)" strokeWidth="2" strokeLinecap="round" />
        <path d="M6 18 V9" stroke="var(--color-graphite)" strokeWidth="1.4" strokeLinecap="round" opacity="0.4" />
      </svg>
    </span>
  );
}

// ── Cornice card: 4 angoli firma attorno a un contenuto premium ──────────────
export function SegnoDomusFrame({ className = "", children }: { className?: string; children?: React.ReactNode }) {
  return (
    <div className={`relative ${className}`}>
      <SegnoDomusCorner className="left-2.5 top-2.5" rotate={0} />
      <SegnoDomusCorner className="right-2.5 top-2.5" rotate={90} />
      <SegnoDomusCorner className="bottom-2.5 right-2.5" rotate={180} />
      <SegnoDomusCorner className="bottom-2.5 left-2.5" rotate={270} />
      {children}
    </div>
  );
}

// ── Cornice video/hero: angoli + linea-tetto in alto, tutto in trasparenza ───
// Overlay assoluto: va dentro un contenitore `relative overflow-hidden`.
export function SegnoDomusVideoFrame({ className = "" }: { className?: string }) {
  return (
    <span className={`pointer-events-none absolute inset-0 z-10 ${className}`} aria-hidden>
      <SegnoDomusCorner className="left-4 top-4 opacity-70" rotate={0} size={30} />
      <SegnoDomusCorner className="right-4 top-4 opacity-70" rotate={90} size={30} />
      <SegnoDomusCorner className="bottom-4 right-4 opacity-70" rotate={180} size={30} />
      <SegnoDomusCorner className="bottom-4 left-4 opacity-70" rotate={270} size={30} />
      <span className="absolute left-1/2 top-4 -translate-x-1/2">
        <SegnoDomus className="h-4 w-14 opacity-60" embrace={false} />
      </span>
    </span>
  );
}

// ── Divisore di sezione con Segno al centro ──────────────────────────────────
export function SegnoDomusDivider({ className = "", tone = "line" }: { className?: string; tone?: "line" | "cream" }) {
  const lineColor = tone === "cream" ? "var(--color-cream-deep)" : "var(--color-line)";
  return (
    <div className={`flex items-center justify-center gap-4 ${className}`} aria-hidden>
      <span className="h-px flex-1 max-w-[140px]" style={{ background: `linear-gradient(90deg, transparent, ${lineColor})` }} />
      <SegnoDomus className="segno-hover-draw h-5 w-14" />
      <span className="h-px flex-1 max-w-[140px]" style={{ background: `linear-gradient(90deg, ${lineColor}, transparent)` }} />
    </div>
  );
}

// ── Sfondo tenue con pattern di linee-tetto (usare con parsimonia) ────────────
// Overlay assoluto in un contenitore `relative`. `tone` regola il colore/mask.
export function SegnoDomusBackground({
  className = "",
  opacity = 0.05,
}: {
  className?: string;
  opacity?: number;
}) {
  return (
    <span
      className={`motif-pattern pointer-events-none absolute inset-0 ${className}`}
      style={{
        opacity,
        maskImage: "radial-gradient(120% 90% at 50% 0%, #000, transparent 75%)",
        WebkitMaskImage: "radial-gradient(120% 90% at 50% 0%, #000, transparent 75%)",
      }}
      aria-hidden
    />
  );
}

// ── Badge firma: pill con mini-segno + etichetta ─────────────────────────────
export function SegnoDomusBadge({
  children,
  className = "",
  light = false,
}: {
  children: React.ReactNode;
  className?: string;
  light?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] ${
        light ? "border-cream/30 text-cream/85" : "border-line text-graphite"
      } ${className}`}
    >
      <SegnoDomus className="h-3.5 w-8" embrace={false} />
      {children}
    </span>
  );
}
