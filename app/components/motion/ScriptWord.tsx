"use client";

// ScriptWord — il ruolo `accent` (spec §2.2): la parola in Pinyon, una per capitolo, già
// aria-hidden (DESIGN.md). A20 di Alberto: entra per lettera con la rotazione dell'accento di
// Era, senza prospettiva (A22). Misura e incastro restano quelli di `.script-word`
// (globals.css:347-364). Fuori da un RevealGroup la parola fa gruppo da sé. Sotto
// MotionFreeze (/case/[slug], D32 e A26 di Alberto) resta la parola intera e ferma.
import type { CSSProperties } from "react";
import SplitChars from "./SplitChars";
import RevealGroup, { useInRevealGroup } from "./RevealGroup";
import { useMotionFrozen } from "./MotionFreeze";
import { useLocale } from "../i18n/LocaleProvider";

export type ScriptWordProps = { className?: string; style?: CSSProperties; children: string };

export default function ScriptWord({ className = "", style, children }: ScriptWordProps) {
  const { locale } = useLocale();
  const inGroup = useInRevealGroup();
  const frozen = useMotionFrozen();
  const classe = className ? `script-word ${className}` : "script-word";
  if (frozen) {
    return (
      <span aria-hidden="true" className={classe} style={style}>
        {children}
      </span>
    );
  }
  const el = (
    <span aria-hidden="true" data-reveal="accent" className={classe} style={style}>
      <SplitChars font="script-400" locale={locale} upper={false}>
        {children}
      </SplitChars>
    </span>
  );
  return inGroup ? el : <RevealGroup>{el}</RevealGroup>;
}
