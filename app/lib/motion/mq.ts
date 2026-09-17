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
// il confine fra telefono/tablet e desktop per ciò che NON è un corridoio:
// oggi lo leggono il gate dell'indice sticky delle FAQ (FaqContent.tsx) e la
// corsa del ruolo ctn, `ctnY()` in gsap.ts. `corridor` è la soglia unica dei
// corridoi sticky — i sei della home, i tre nastri compresi, e il tuffo delle
// PageHero (A19 «Sticky dove serve» di Alberto; D22): 1024 px di larghezza,
// 640 px d'altezza, motion ok. Oggi la leggono useCorridor, i gate dei tre
// nastri (HorizonScroller, StarReviews, HorizontalRail) e il ripristino al
// capitolo nel Preloader. `xl` è 1280, la soglia del monogramma in testata
// (A21 «Si stacca da 1024» e spec §6.1).
//
// Le forme "below" esistono per scrivere il RAMO MOBILE come cittadino di
// prima classe invece che come negazione. `belowCorridor` (larghezza O
// altezza sotto la soglia, senza condizione di motion) la legge RailProgress
// per l'indicatore della rotaia nativa; il pan della rotaia in globals.css
// scrive a mano la stessa riga di confine, perché il CSS non legge queste
// costanti. `belowLg` oggi non ha lettori e resta come gemello di `lg`. Il
// confine è 1023.98 / 767.98, non 1023 / 767: alle larghezze frazionarie
// (zoom del browser, dpr non interi) un buco di un pixel lascia entrambi i
// rami spenti.
export const MQ = {
  motionOk: "(prefers-reduced-motion: no-preference)",
  /** Effetti di sezione: da tablet in su. */
  desktop: "(min-width: 768px)",
  /** Il gemello di `desktop`: telefono. */
  belowDesktop: "(max-width: 767.98px)",
  /** Desktop vero, fuori dai corridoi: l'indice sticky delle FAQ e `ctnY()`. */
  lg: "(min-width: 1024px)",
  /** Il gemello di `lg`: telefono e tablet. Oggi senza lettori. */
  belowLg: "(max-width: 1023.98px)",
  /** Monogramma in testata (A21). */
  xl: "(min-width: 1280px)",
  /** Corridoi sticky e tuffo delle PageHero (A19, D22). */
  corridor: "(prefers-reduced-motion: no-preference) and (min-width: 1024px) and (min-height: 640px)",
  /** Il gemello di `corridor` senza la motion (D22): larghezza o altezza sotto la soglia, dove la rotaia resta nativa (RailProgress). */
  belowCorridor: "(max-width: 1023.98px), (max-height: 639.98px)",
} as const;
