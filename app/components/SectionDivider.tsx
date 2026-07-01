import { SegnoDomus } from "./BrandMotif";

// Divisore di sezione con il Segno Domus al centro. Firma visiva ricorrente
// che sostituisce i bordi generici tra sezioni.
export default function SectionDivider({
  className = "",
  tone = "cream",
}: {
  className?: string;
  /** colore di sfondo su cui poggia (per i fade laterali) */
  tone?: "cream" | "paper" | "cream-deep";
}) {
  const fade =
    tone === "paper"
      ? "from-paper"
      : tone === "cream-deep"
        ? "from-cream-deep"
        : "from-cream";

  return (
    <div className={`mx-auto flex max-w-[1240px] items-center gap-5 px-5 sm:px-8 ${className}`} aria-hidden>
      <span className={`h-px flex-1 bg-gradient-to-r ${fade} via-line to-line`} />
      <SegnoDomus className="h-4 w-11 shrink-0" />
      <span className={`h-px flex-1 bg-gradient-to-l ${fade} via-line to-line`} />
    </div>
  );
}
