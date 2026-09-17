// Lo scroll torna al capitolo alla ricarica (D22).
//
// Com'è fatto oggi:
// - al pagehide Preloader.tsx salva in sessionStorage (LAST_Y_KEY)
//   { p, y, id, dy }: percorso, scrollY, id della section in vista e scarto
//   dentro di lei;
// - alla ricarica, coi corridoi accesi e dopo il primo refresh di
//   ScrollTrigger, riporta lo scroll a top(id) + dy.
// Serve perché Safari non ha lo scroll anchoring e due altezze le misura il JS
// (il nastro di HorizonScroller, la rotaia con --rail-len): il browser
// ripristinerebbe un numero di pixel su una pagina ancora corta.
// Modulo puro: lo prova chapter-scroll.test.ts.

export type LastY = { p: string; y: number; id: string; dy: number };
export type ChapterTop = { id: string; top: number };

/** La section in vista: quella col bordo alto più basso fra quelle già cominciate sopra y; a parità, l'ultima del DOM (la più interna). */
export function pickChapter(tops: readonly ChapterTop[], y: number): ChapterTop | null {
  let best: ChapterTop | null = null;
  for (const t of tops) {
    if (t.top <= y + 1 && (best === null || t.top >= best.top)) best = t;
  }
  return best;
}

export function snapshot(pathname: string, y: number, tops: readonly ChapterTop[]): LastY {
  const c = pickChapter(tops, y);
  return c ? { p: pathname, y, id: c.id, dy: y - c.top } : { p: pathname, y, id: "", dy: y };
}

export function parseLastY(raw: string | null): LastY | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<Record<keyof LastY, unknown>>;
    if (typeof v.p !== "string" || typeof v.id !== "string") return null;
    if (typeof v.y !== "number" || !Number.isFinite(v.y)) return null;
    if (typeof v.dy !== "number" || !Number.isFinite(v.dy)) return null;
    return { p: v.p, y: v.y, id: v.id, dy: v.dy };
  } catch {
    return null;
  }
}

export type RestoreContext = {
  pathname: string;
  hash: string;
  navigation: string | undefined;
  tops: readonly ChapterTop[];
  maxY: number;
};

/** Lo scrollY a cui tornare, o null: solo alla ricarica, stessa rotta, nessuna ancora (le ancore vincono). */
export function restoreTarget(saved: LastY | null, ctx: RestoreContext): number | null {
  if (!saved || ctx.navigation !== "reload" || ctx.hash || saved.p !== ctx.pathname) return null;
  const chapter = saved.id ? ctx.tops.find((t) => t.id === saved.id) : undefined;
  const y = chapter ? chapter.top + saved.dy : saved.y;
  return Math.max(0, Math.min(ctx.maxY, Math.round(y)));
}
