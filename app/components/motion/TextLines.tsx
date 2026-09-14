"use client";

// Alias di SplitTitle senza importatori (spec §2.7, A20 di Alberto): i titoli usano SplitTitle.
import type { ReactNode } from "react";
import SplitTitle, { type SplitTitleProps } from "./SplitTitle";

export default function TextLines({
  as = "div",
  className,
  children,
}: {
  as?: SplitTitleProps["as"];
  className?: string;
  children: ReactNode;
}) {
  return (
    <SplitTitle as={as} className={className}>
      {children}
    </SplitTitle>
  );
}
