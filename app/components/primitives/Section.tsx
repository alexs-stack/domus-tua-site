import type { ReactNode } from "react";
import Container from "./Container";

type Tone = "paper" | "cream" | "cream-deep" | "ink";

const toneClass: Record<Tone, string> = {
  paper: "bg-paper",
  cream: "bg-cream",
  "cream-deep": "bg-cream-deep",
  ink: "bg-ink text-cream",
};

// Sezione con ritmo verticale coerente e Container interno.
export default function Section({
  id,
  tone = "paper",
  spacing = "normal",
  className = "",
  containerClassName = "",
  children,
}: {
  id?: string;
  tone?: Tone;
  spacing?: "normal" | "compact";
  className?: string;
  containerClassName?: string;
  children: ReactNode;
}) {
  const pad = spacing === "compact" ? "py-16 sm:py-20" : "py-24 sm:py-32";
  return (
    <section id={id} className={`${toneClass[tone]} ${className}`}>
      <Container className={`${pad} ${containerClassName}`}>{children}</Container>
    </section>
  );
}
