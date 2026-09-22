// Lettura della tabella di crenatura (spec §2.3, D20). Un carattere in un inline-block
// perde le coppie di kerning del font; SplitChars le rimette con `--k` in em sul
// carattere di sinistra. La tabella la scrive scripts/kern-table.ts misurando nel DOM
// del build; le chiavi sono per ruolo tipografico, non per il nome hashato di next/font.
import table from "./kern-table.json";

export type KernFont = "display-400" | "display-500" | "brand-800" | "script-400";

const T = table as Record<KernFont, Record<string, number>>;

/** Valore in em della coppia di due caratteri; 0 se la tabella non la registra. */
export function kernOf(font: KernFont, pair: string): number {
  return T[font]?.[pair] ?? 0;
}

/**
 * Crenatura fra due grafemi contigui di una parola. Col maiuscolo (h1-h4 e
 * `uppercase`, DESIGN.md) la coppia si cerca sul maiuscolo della lingua: «ß» diventa
 * «SS», quindi a sinistra conta l'ultimo carattere e a destra il primo.
 */
export function kernBetween(font: KernFont, a: string, b: string, upper: boolean, locale: string): number {
  const up = (s: string) => (upper ? s.toLocaleUpperCase(locale) : s);
  const sinistra = Array.from(up(a)).at(-1);
  const destra = Array.from(up(b))[0];
  if (!sinistra || !destra) return 0;
  return kernOf(font, sinistra + destra);
}
