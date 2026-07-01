import type { ReactNode } from "react";

type Tone = "paper" | "cream" | "cream-deep";

const toneClass: Record<Tone, string> = {
  paper: "bg-paper",
  cream: "bg-cream",
  "cream-deep": "bg-cream-deep",
};

// Superficie premium coerente (radius + hairline + tono).
export default function Card({
  tone = "cream",
  className = "",
  padded = true,
  children,
}: {
  tone?: Tone;
  className?: string;
  padded?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-[2rem] border border-line ${toneClass[tone]} ${padded ? "p-6 sm:p-8" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
