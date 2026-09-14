"use client";

// SplitTitle — il ruolo `title` (spec §2.2-§2.3): h1-h4 display, titoli semplici, titoli
// di capitolo. A20 di Alberto («Fedeltà letterale»): ogni titolo entra per lettera, con i
// valori di Era letti dal motore (reveal-engine.ts, text-roles.ts); A22: senza prospettiva.
// Lo split è nel server (SplitChars). Heading: `aria-label` col testo intero e le lettere in
// uno span aria-hidden; altri tag: testo in `sr-only` (axe vieta aria-label su p e
// blockquote). Fuori da un RevealGroup il titolo fa gruppo da sé. Sotto MotionFreeze
// (/case/[slug], D32 e A26 di Alberto) rende FrozenLines, le righe in maschera che la scheda
// immobile ha oggi: il movimento di quella pagina non cambia (spec §5.4).
import type { CSSProperties, ReactNode } from "react";
import SplitChars, { plainText } from "./SplitChars";
import FrozenLines from "./FrozenLines";
import RevealGroup, { useInRevealGroup } from "./RevealGroup";
import { useMotionFrozen } from "./MotionFreeze";
import { useLocale } from "../i18n/LocaleProvider";

export type SplitTitleProps = {
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "div" | "blockquote";
  className?: string;
  id?: string;
  style?: CSSProperties;
  font?: "display-400" | "display-500" | "brand-800";
  children: ReactNode;
};

export default function SplitTitle({ as: Tag = "h2", className = "", id, style, font, children }: SplitTitleProps) {
  const { locale } = useLocale();
  const inGroup = useInRevealGroup();
  const frozen = useMotionFrozen();
  if (frozen) {
    return (
      <FrozenLines as={Tag} className={className} id={id} style={style}>
        {children}
      </FrozenLines>
    );
  }
  const heading = Tag === "h1" || Tag === "h2" || Tag === "h3" || Tag === "h4";
  // h1-h4 sono maiuscoli per regola (globals.css:306-311); blockquote mai (:322-325).
  const upper = Tag !== "blockquote" && (heading || /(^|\s)uppercase(\s|$)/.test(className));
  // h1-h3 pesano 500, h4 e i tag di testo 400 (globals.css:314-321); Playfair non ha 300.
  const kern = font ?? (Tag === "h1" || Tag === "h2" || Tag === "h3" ? "display-500" : "display-400");
  const label = plainText(children);
  const lettere = (
    <span aria-hidden="true">
      <SplitChars font={kern} locale={locale} upper={upper}>
        {children}
      </SplitChars>
    </span>
  );
  const el = heading ? (
    <Tag id={id} className={className} style={style} aria-label={label} data-reveal="title">
      {lettere}
    </Tag>
  ) : (
    <Tag id={id} className={className} style={style} data-reveal="title">
      <span className="sr-only">{label}</span>
      {lettere}
    </Tag>
  );
  return inGroup ? el : <RevealGroup>{el}</RevealGroup>;
}
