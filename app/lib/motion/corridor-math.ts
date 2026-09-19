// L'aritmetica dei corridoi sticky: A19 di Alberto (13 set., «Sticky dove
// serve»), soglia e ripristino di D22. Pura, senza DOM né GSAP: la usa
// app/components/motion/useCorridor.ts e la prova corridor-math.test.ts.

export type Stick = "top" | "bottom";
export type CueStep = { index: number; dir: "forward" | "backward" };

/** Quota di aggancio dello schermo: 0 per stick top; min(0, innerHeight − H) per stick bottom. */
export function stickTopFor(stick: Stick, innerHeight: number, screenHeight: number): number {
  return stick === "bottom" ? Math.min(0, Math.round(innerHeight - screenHeight)) : 0;
}

/** Innesco di default del hook (spec §2.7): "top top", oppure `top ${stickTop}px` per stick bottom. */
export function defaultStart(stick: Stick, stickTop: number): string {
  return stick === "bottom" ? `top ${stickTop}px` : "top top";
}

export const DEFAULT_END = "bottom bottom";

/** Cue ammessi: `at` in (0, 1], in ordine crescente. */
export function cuesValid(cues: readonly { at: number }[]): boolean {
  return cues.every((c, i) => c.at > 0 && c.at <= 1 && (i === 0 || c.at >= cues[i - 1].at));
}

/**
 * I cue da suonare portando il progresso a `p`. `fired[i]` resta vero finché
 * il cue i non torna indietro; la funzione lo aggiorna.
 * - avanti: `p ≥ at` e cue non ancora suonato (copre `last < at ≤ p` e il
 *   refresh atterrato oltre il cue);
 * - indietro: `p < at` e cue suonato, in ordine inverso.
 */
export function stepCues(cues: readonly { at: number }[], fired: boolean[], p: number): CueStep[] {
  const forward: CueStep[] = [];
  const backward: CueStep[] = [];
  cues.forEach((c, index) => {
    if (!fired[index] && p >= c.at) {
      fired[index] = true;
      forward.push({ index, dir: "forward" });
    } else if (fired[index] && p < c.at) {
      fired[index] = false;
      backward.push({ index, dir: "backward" });
    }
  });
  return [...forward, ...backward.reverse()];
}

export type EndNetInput = {
  scrollY: number;
  innerHeight: number;
  scrollHeight: number;
  wrapperBottom: number;
  progress: number;
  hasEndTrigger: boolean;
  /** `st.end` dopo il refresh: lo scrollY a cui il corridoio finisce. */
  stEnd: number;
};

/**
 * Rete di fine documento (spec §2.7, verdetto sistema bloccante 2, D22): dopo
 * un refresh la timeline va a 1 se il corridoio è finito ma lo scrub non ci è
 * arrivato. Il corridoio è finito in due casi:
 * - la pagina è in fondo;
 * - l'elemento di fine è passato.
 * Senza `endTrigger` l'elemento di fine è il wrapper, col suo bordo basso sopra
 * il bordo del viewport: è la condizione della spec. Con `endTrigger` (la
 * cartolina) è il footer al 40 %, cioè `scrollY ≥ st.end`. Il bordo della
 * section arriva prima, e chiuderebbe la cartolina a metà.
 */
export function endNetDue(o: EndNetInput): boolean {
  if (o.progress >= 1) return false;
  const docEnd = o.scrollY + o.innerHeight >= o.scrollHeight - 2;
  const passed = o.hasEndTrigger ? o.scrollY >= o.stEnd - 1 : o.wrapperBottom <= o.innerHeight + 1;
  return docEnd || passed;
}

/**
 * Il progresso più vicino a `current` in cui `visible(p)` è vero: `samples`
 * campioni uniformi, poi `iterations` bisezioni verso il confine dal lato di
 * `current`. Restituisce null se nessun campione è visibile.
 */
export function nearestVisibleProgress(
  current: number,
  visible: (p: number) => boolean,
  samples = 20,
  iterations = 12,
): number | null {
  const c = Math.min(1, Math.max(0, current));
  if (visible(c)) return c;
  let best: number | null = null;
  for (let i = 0; i <= samples; i++) {
    const p = i / samples;
    if (visible(p) && (best === null || Math.abs(p - c) < Math.abs(best - c))) best = p;
  }
  if (best === null) return null;
  const step = 1 / samples;
  let inside = best;
  let outside = best < c ? Math.min(c, best + step) : Math.max(c, best - step);
  if (visible(outside)) {
    inside = outside;
    outside = c;
  }
  for (let k = 0; k < iterations; k++) {
    const mid = (inside + outside) / 2;
    if (visible(mid)) inside = mid;
    else outside = mid;
  }
  return inside;
}
