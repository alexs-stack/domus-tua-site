// Forme di ritaglio a spigolo vivo: C01 della cliente (niente curve né card).
// Oggi le usano i gesti a clip dei capitoli: tendina di Method (ClipMedia),
// righe del D.O.C. (Hairline), acqua di Costi chiari, cornice della cartolina
// e parallelogramma di Voci.
// Sempre quattro valori in percentuale: GSAP interpola due stringhe con la
// stessa forma numero per numero. Il clip sta sul modulo media, mai su un
// antenato di sticky o fixed, mai sulla foto LCP (spec §8).

export type Side = "left" | "right" | "top" | "bottom";

export const clipOpen = "inset(0% 0% 0% 0%)";

/* Il lato è quello da cui la forma si apre: "left" lascia visibile il bordo
   sinistro e cresce verso destra. È la tendina di Method (spec §3.9, CAT §6c,
   D18). */
const CLOSED: Record<Side, string> = {
  left: "inset(0% 100% 0% 0%)",
  right: "inset(0% 0% 0% 100%)",
  top: "inset(0% 0% 100% 0%)",
  bottom: "inset(100% 0% 0% 0%)",
};

const pct = (n: number) => `${Number(n.toFixed(3))}%`;

export function clipClosed(side: Side): string {
  return CLOSED[side];
}

/** Cornice centrata: `v` in alto e in basso, `h` ai lati, in percentuale (cartolina: 8, 22). */
export function clipFrame(v: number, h: number): string {
  if (!(v >= 0 && v <= 50 && h >= 0 && h <= 50)) {
    throw new RangeError(`clipFrame: valori fuori da 0-50 (${v}, ${h})`);
  }
  return `inset(${pct(v)} ${pct(h)} ${pct(v)} ${pct(h)})`;
}

/** Parallelogramma di Era (CAT §4): p 0 = polygon(100% 0%, 100% 0%, 101% 100%, 125% 100%), p 1 = pieno. */
export function clipSlant(p: number): string {
  const t = Math.min(1, Math.max(0, p));
  return `polygon(${pct(100 - 100 * t)} 0%, 100% 0%, ${pct(101 - t)} 100%, ${pct(125 - 125 * t)} 100%)`;
}

/** Rifiuta le forme curve (C01): round, circle(, ellipse(, path(, url(. */
export function assertStraight(v: string): void {
  if (/\bround\b|circle\(|ellipse\(|path\(|url\(/i.test(v)) {
    throw new Error(`clip curvo vietato (C01): ${v}`);
  }
}

/**
 * Quattro lati indipendenti, in percentuale, sempre a spigolo vivo. Serve alla
 * cartolina del Congedo, che chiude il bordo basso prima degli altri tre, così
 * il footer che sale non copre mai il video (A19 e A20 di Alberto, spec
 * 2026-09-13 §3.18). `clipFrame(v, h)` resta la forma simmetrica.
 */
export function clipSides(t: number, r: number, b: number, l: number): string {
  const v = `inset(${t}% ${r}% ${b}% ${l}%)`;
  assertStraight(v);
  return v;
}
