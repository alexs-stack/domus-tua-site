import type { ReactNode } from "react";

// Larghezza contenuto standard del sito.
export default function Container({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={`mx-auto max-w-[1240px] px-5 sm:px-8 ${className}`}>{children}</div>;
}
