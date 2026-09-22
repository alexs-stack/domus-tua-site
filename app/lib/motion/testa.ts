// LA TESTA DI ERA, IN NUMERI: il passo comune delle nove rotte e i due legali.
//
// Chi l'ha chiesto: A38 di Alberto (20 settembre 2026): «quando entri nella foto a schermo
// intero, la foto stessa diventa lo sfondo, e le scritte sopra»; A41: layout centrato come
// «Perfect sea views»; A45 (21 set.): la foto alta è la pagina, in flusso, larga tutto e alta
// quanto è resa. A46 di Alberto (21 set. 2026, sera): «su eraresidence questa foto che usa come
// background alta ha il cielo mascherato, è no bg: ecco perché sembra un tutt'uno il cielo con il
// colore dello sfondo del sito. Dobbiamo fare la stessa cosa nel nostro sito, dove ci sono le
// immagini così alte»: il cielo è trasparente e le scritte stanno sull'avorio sopra il soggetto;
// la CIMA del soggetto (`cielo.cima` in tinte.json: la prima riga in cui almeno il 5 % dei pixel
// è opaco, misurata da scripts/media/cielo.mjs) decide di quanto lo strato della foto sale sotto
// il blocco dei testi (`cieloH`). Il blocco non ha un pavimento suo: è alto quanto il contenuto e
// da lg almeno 100svh (D176). Nessun tween, nessun pin, nessun corridoio.
//
// Com'è fatto oggi: modulo puro, senza "use client" e senza GSAP. Lo leggono PageHero.tsx (per
// `cieloH`), PageHeroTesta.tsx (per `SIZES_TESTA`), testa.test.ts, a28-fallback.test.ts ed
// e2e/a28.spec.ts. (Il commento precedente, del 21 set., descriveva la geometria «linea» —
// pavimento del blocco con `aspect-ratio: 1 / cieloH`, esempio 0,7274 — che lo stesso commit
// c65e44f aveva scartato dopo averla misurata: corretto il 22 set. dalla revisione avversaria di
// A46, rilievi R01 e R03.)

export const TESTA = {
  /** Altezza minima del blocco dei testi da lg: 100svh (D176; A46: sotto lg è quella del contenuto). */
  h: "100svh",
} as const;

/**
 * La cima del soggetto in frazione della LARGHEZZA resa (A46). `cima` è la frazione dell'altezza
 * della foto (tinte.json, misurata da scripts/media/cielo.mjs); nel CSS lo strato sale di
 * `margin-top: calc(-100% * <cieloH>)`, e la percentuale di un margine verticale si misura sulla
 * larghezza del blocco contenitore (CSS 2.1 §8.3): cieloH = cima × altezza / larghezza del sorgente,
 * a quattro decimali (0,3264 per /vendi: 0,219 × 3816 / 2560). Non la `linea` (0,488 su /vendi, dove
 * il soggetto riempie la larghezza): con lei l'H1 posava sui cipressi e il bottone sul tetto
 * (misurato il 21 set. sul build a 1440×900). Con cima 0 vale 0 e lo strato segue il blocco senza
 * salire: la foto comincia sotto i comandi (gli attici, i legali, la tenda di /open-domus).
 */
export const cieloH = (cima: number, sorgente: readonly number[]): number =>
  Number(((cima * sorgente[1]) / sorgente[0]).toFixed(4));

/**
 * `sizes` della foto della testa: `100vw` su ogni fascia. Da A45 lo strato è IN FLUSSO, largo il
 * 100 % del riquadro e alto quanto la foto (`aspect-ratio: var(--dt-testa-ar)`, globals.css): il
 * cover non ritaglia nulla e la larghezza dipinta è esattamente quella del viewport, con qualunque
 * rapporto. Il conto per fold di D183 (`sizesDi`, `sizesSottoLg`: 151vw sotto lg per un 2:3, dal
 * riquadro 100svh in cover di A41) è morto con A45 e chiedeva un bucket di troppo — a 390 px DPR 3
 * il 1920 al posto del 1280, +45…+72 KB sull'immagine LCP (revisione avversaria di A46, 22 set.
 * 2026, rilievi C02, P01, G03). I candidati restano i `deviceSizes` di next.config.ts.
 */
export const SIZES_TESTA = "100vw";
