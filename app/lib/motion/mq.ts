// Le media query del sito, SENZA GSAP. Le legge gsap.matchMedia attraverso
// gsap.ts, che le riesporta, e le importa da qui chi non deve portarsi GSAP
// nel chunk (useAmbientVideo: Congedo.tsx evita apposta l'import di GSAP;
// spec §2.6 della coreografia del 13 settembre).
//
// `motionOk` è la condizione base: nessuna animazione GSAP parte senza.
//
// ─── LE SOGLIE, E VANNO SAPUTE TUTTE ───────────────────────────────────
// `desktop` è 768 ed è la soglia degli effetti di sezione (Parallax, la
// deriva d'uscita dell'hero, il ramo mobile del preloader). `lg` è 1024 ed è
// la soglia dei SET PIECE: la rotaia del team (HorizontalRail), i pannelli
// orizzontali di «Perché Domus Tua» (HorizonScroller) e il film delle cinque
// stelle (StarReviews). A 768 un set piece toccherebbe il contenuto.
// `corridor` è la soglia dei sei corridoi sticky e del tuffo delle PageHero
// (A19 «Sticky dove serve» di Alberto; D22): 1024 px di larghezza, 640 px
// d'altezza, motion ok. `xl` è 1280, la soglia del monogramma in testata
// (A21 «Si stacca da 1024» e spec §6.1).
//
// Le forme "below" esistono per scrivere il RAMO MOBILE come cittadino di
// prima classe invece che come negazione. Il confine è 1023.98 / 767.98, non
// 1023 / 767: alle larghezze frazionarie (zoom del browser, dpr non interi)
// un buco di un pixel lascia entrambi i rami spenti.
export const MQ = {
  motionOk: "(prefers-reduced-motion: no-preference)",
  /** Effetti di sezione: da tablet in su. */
  desktop: "(min-width: 768px)",
  /** Il gemello di `desktop`: telefono. */
  belowDesktop: "(max-width: 767.98px)",
  /** Set piece: solo desktop vero. */
  lg: "(min-width: 1024px)",
  /** Il gemello di `lg`: telefono e tablet. */
  belowLg: "(max-width: 1023.98px)",
  /** Monogramma in testata (A21). */
  xl: "(min-width: 1280px)",
  /** Corridoi sticky e tuffo delle PageHero (A19, D22). */
  corridor: "(prefers-reduced-motion: no-preference) and (min-width: 1024px) and (min-height: 640px)",
} as const;
