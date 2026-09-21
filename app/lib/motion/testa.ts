// LA TESTA DI ERA, IN NUMERI: il passo comune delle nove rotte e i due legali.
//
// Chi l'ha chiesto: A38 di Alberto (20 settembre 2026): «quando entri nella foto a schermo
// intero, la foto stessa diventa lo sfondo, e le scritte sopra»; A41: layout centrato come
// «Perfect sea views»; A45 (21 set.): la foto alta è la pagina, in flusso. A46 di Alberto (21 set.
// 2026, sera): «su eraresidence questa foto che usa come background alta ha il cielo mascherato,
// è no bg: ecco perché sembra un tutt'uno il cielo con il colore dello sfondo del sito. Dobbiamo
// fare la stessa cosa nel nostro sito, dove ci sono le immagini così alte»: il cielo è trasparente
// e le scritte stanno sull'avorio sopra il soggetto; la linea del cielo (`cielo.linea` in
// tinte.json) decide il pavimento del blocco e di quanto la foto sale sotto di lui (`cieloH`).
// D176: da lg il blocco è alto almeno 100svh. Nessun tween, nessun pin, nessun corridoio.
//
// Com'è fatto oggi: modulo puro, senza "use client" e senza GSAP. Lo leggono PageHero.tsx (per
// `cieloH`), PageHeroTesta.tsx (per `sizes`), testa.test.ts, a28-fallback.test.ts ed e2e/a28.spec.ts.

export const TESTA = {
  /** Altezza minima del blocco dei testi da lg: 100svh (D176; A46: sotto lg è quella del contenuto). */
  h: "100svh",
} as const;

/**
 * La linea del cielo in frazione della LARGHEZZA resa (A46). `linea` è la frazione dell'altezza
 * della foto (tinte.json, misurata da scripts/media/cielo.mjs); nel CSS il pavimento del blocco è un
 * `aspect-ratio: 1 / <cieloH>` e la foto sale di `margin-top: calc(-100% * <cieloH>)`, e tutt'e due
 * si misurano sulla larghezza del riquadro, non sull'altezza: cieloH = linea × altezza / larghezza del
 * sorgente, a quattro decimali (0,7274 per /vendi: 0,488 × 3816 / 2560). Con linea 0 vale 0 e il
 * rapporto `1 / 0` è degenere, cioè `auto`: il blocco è alto quanto il contenuto (o 100svh da lg).
 */
export const cieloH = (linea: number, sorgente: readonly number[]): number =>
  Number(((linea * sorgente[1]) / sorgente[0]).toFixed(4));

/**
 * I `deviceSizes` di next.config.ts, copiati e non importati (modulo puro): testa.test.ts pretende gli
 * stessi. Sono i bucket fra cui il browser sceglie, e `sizesDi` li conosce per non chiederne uno di troppo.
 */
export const BUCKETS = [360, 420, 640, 768, 1024, 1280, 1536, 1920, 2560] as const;
const bucketDi = (px: number): number => BUCKETS.find((b) => b >= px) ?? BUCKETS[BUCKETS.length - 1];

/**
 * I quattro fold da lg (D183, §3.4 del brief T). Ogni termine di `sizes` serve un intervallo di viewport e si
 * calcola sul fold che lo apre; l'ultimo, senza condizione, si calcola a 1920 e deve reggere anche 1440.
 */
const FOLD = {
  1024: { vw: 1024, vh: 768 },
  1280: { vw: 1280, vh: 800 },
  1440: { vw: 1440, vh: 900 },
  1920: { vw: 1920, vh: 1080 },
} as const;
const TERMINI = [
  { su: FOLD[1024], serve: [FOLD[1024]], max: "1279.98px" },
  { su: FOLD[1280], serve: [FOLD[1280]], max: "1439.98px" },
  { su: FOLD[1920], serve: [FOLD[1440], FOLD[1920]], max: null },
] as const;

/** La larghezza in px CSS che il cover dipinge in una scatola vw × vh con una sorgente di rapporto r (A41: nessun margine, la foto è ferma). */
const dipinta = (vw: number, vh: number, r: number): number => Math.max(vw, vh * r);

/**
 * `sizes` sotto lg (D183): in un riquadro 100svh un telefono verticale dipinge la foto per 100svh·r di
 * larghezza, e 2,25 è il rapporto vh/vw dei telefoni più alti (360×800 e 412×915 stanno a 2,22):
 * 3:2 → 338vw, 16:9 → 400vw, 1,8 → 405vw. next/image non legge i `vw` sopra 199 (get-img-props.js:53,
 * `(1?\d?\d)vw`) e lascia dieci candidati da 360 a 2560: a DPR 2 e 3 ogni telefono comune riceve 2560,
 * cioè la larghezza delle sorgenti; a DPR 1 (raro) 1280-1536 ≥ dipinta. Il prezzo rispetto al `200vw`
 * di D64 (+38…+73 KB AVIF a 390 @2 sulle sorgenti 2560, 0 sulle 1920) è dichiarato in D183.
 */
export const sizesSottoLg = (r: number): string => `${Math.ceil(100 * r * 2.25)}vw`;

/**
 * `sizes` per rotta dal rapporto della sorgente (D183): il primo termine è `sizesSottoLg(r)`; da lg ogni
 * termine è `floor(100 · dipinta / vw)` sul fold che lo apre, con la guardia che il bucket scelto dal
 * browser non sia mai più stretto di quel che il cover dipinge (ingrandimento dal bucket ≤ 1,000). Le
 * soglie a `,98` perché a 1280 e 1440 esatti valga il termine del fold successivo (a 1280 esatti
 * «(max-width: 1279.98px)» non corrisponde: bucket 1536, non 1280 con ingrandimento). Con 3:2:
 * `(max-width: 1023.98px) 338vw, (max-width: 1279.98px) 128vw, (max-width: 1439.98px) 106vw, 100vw` →
 * bucket 1536 / 1536 / 1536 / 1920 ai quattro fold; con 16:9 `400vw, 151vw, 126vw, 113vw` → 1920 / 1920 /
 * 1920 / 2560. Il floor e non il ceil: a 1440 un 3:2 chiede 1536 = 106,67 vw, e 107vw chiederebbe
 * 1541 px, cioè il bucket 1920 (+24 KB) che D182 evita.
 */
export function sizesDi(r: number): string {
  const termini: string[] = [`(max-width: 1023.98px) ${sizesSottoLg(r)}`];
  for (const t of TERMINI) {
    let v = Math.floor((100 * dipinta(t.su.vw, t.su.vh, r)) / t.su.vw);
    while (t.serve.some((k) => bucketDi((k.vw * v) / 100) < dipinta(k.vw, k.vh, r))) v += 1;
    termini.push(t.max === null ? `${v}vw` : `(max-width: ${t.max}) ${v}vw`);
  }
  return termini.join(", ");
}
