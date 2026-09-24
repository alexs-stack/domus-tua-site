import type { ReactNode } from "react";

type Variant = "onImage" | "soft" | "outline";

const variantClass: Record<Variant, string> = {
  // pill leggibile sopra le foto
  onImage: "bg-paper/95 text-graphite shadow-[0_4px_14px_-6px_rgba(26,24,22,0.5)]",
  // accento brand
  soft: "bg-red-soft text-red-dark",
  // neutro su superficie chiara
  outline: "border border-line bg-paper text-graphite",
};

// Pill/etichetta coerente col brand.
export default function Badge({
  variant = "outline",
  className = "",
  children,
}: {
  variant?: Variant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] ${variantClass[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
