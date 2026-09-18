// La velocità del cuore che gira: RotatingMark nella testata e nel segno fisso
// di MarkSegno. Verso sempre orario (cliente, 2026-09-10, C06). Riposo e
// guadagno sono quelli del badge dal 2026-08; il tetto è della spec del 13
// settembre 2026 (§6.1, D34), misurato con misure/20-segno.mjs --parte vmax a
// 1440×900 (regola e numeri in misure/risultati.md).

/** Gradi al secondo a riposo. */
export const MARK_REST_DEG_S = 30;
/** Gradi al secondo in più per ogni px per fotogramma di velocità di Lenis. */
export const MARK_GAIN = 10;
/** Tetto di |velocity| di Lenis, in px per fotogramma. */
export const MARK_VMAX = 35;

/**
 * Secondi (tempo di GSAP) per cui MarkSegno rilegge il tema dopo ogni evento
 * di scroll, resize o refresh (D67). Le zone foto dentro i corridoi si muovono
 * con uno scrub numerico, che raggiunge lo scroll fino a 1,3 s dopo l'ultimo
 * evento (chapters.ts, Social.tsx): la coda è lo scrub più lungo più 0,2 s, e
 * data-bg.test.ts pretende che resti sopra ogni scrub numerico di app/.
 */
export const MARK_TEMA_CODA_S = 1.5;
