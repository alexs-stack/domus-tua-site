/* ═══════════════════════════════════════════════════════════════════════════
   CHE SUPERFICIE C'È SOTTO — per il chrome che sta sempre in campo.

   ToneShift ha risolto il taglio nel CONTENUTO, ma gli elementi fissi
   sovrapposti restavano ciechi: sopra i pannelli scuri di "Due percorsi" o
   sopra il footer, etichette e tracce chiare sparivano.

   Perché NON basta un IntersectionObserver. Il primo tentativo osservava le
   superfici marcate con la viewport schiacciata a una banda di altezza zero
   (`rootMargin: -50% 0px -50%`). Sembra corretto e non lo è: il footer di
   questo sito usa il pattern UNCOVER — sta dietro al contenuto a tutta
   altezza e viene scoperto dallo scroll. Geometricamente interseca quella
   banda SEMPRE, anche quando `<main>` lo copre per intero. Misurato: il
   chrome passava in modalità scura già a metà pagina, con testo crema su
   fondo crema.

   Serve un test di VISIBILITÀ, non di sovrapposizione: `elementFromPoint`
   restituisce l'elemento più in alto nello stacking a quelle coordinate —
   quindi il footer coperto semplicemente non risponde. Da lì si risale la
   catena degli antenati cercando il marcatore.

   Le superfici si dichiarano con `data-surface="dark"`. Vale anche per le
   FOTOGRAFIE: nella home i pannelli di "Due percorsi" sono immagini sotto un
   gradiente wine/espresso, cioè scure quanto una campitura — e un attributo
   sul pannello è più onesto (e molto più economico) di un campionamento di
   luminanza per frame.

   TRE ATTRIBUTI, E NON SI TOCCANO (onda «parità mobile 2», trappola 1):
     · `data-surface="dark|light"` — la SEZIONE dichiara com'è fatta. Lo LEGGE
       questo file (`surfaceToneAt`, riga sotto).
     · `data-tone="cream|cream-deep|paper"` — la SEZIONE è una tappa del flusso
       di colore. Lo legge SurfaceFlow al mount e lo usa globals.css per
       togliere gli sfondi.
     · `data-rail-tone="dark"` — il verdetto che `watchSurfaceTone` SCRIVE
       sull'elemento di chrome che sta guardando. Fino a questa onda scriveva
       `data-tone`, cioè lo stesso attributo delle tappe: su una nav
       `display:none` era innocuo, ma il filo di ThreadNav sul telefono è
       visibile e sarebbe entrato nel flusso di SurfaceFlow come tappa
       fantasma. Il rename è la condizione per accendere il campionamento
       sotto i 1024.
   ═══════════════════════════════════════════════════════════════════════════ */

export type SurfaceTone = "dark" | "light";

/** Tono della superficie visibile nel punto (x, y) del viewport.
    `null` se lì non c'è nulla di dichiarato: chi chiama decide il default. */
export function surfaceToneAt(x: number, y: number): SurfaceTone | null {
  if (typeof document === "undefined") return null;
  // Fuori dal viewport elementFromPoint restituisce null: evitiamo di
  // interpretare un punto inesistente come "superficie chiara".
  if (x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight) return null;
  let el = document.elementFromPoint(x, y) as Element | null;
  while (el) {
    const t = el.getAttribute?.("data-surface");
    if (t === "dark" || t === "light") return t;
    el = el.parentElement;
  }
  return null;
}

/**
 * Tiene aggiornato `data-rail-tone` su un elemento fisso in base a cosa gli
 * passa sotto — MAI `data-tone` (è la tappa di SurfaceFlow) né `data-surface`
 * (è la dichiarazione della sezione): vedi le tre righe in testa al file.
 * Il punto campionato è deciso da chi chiama, perché ogni elemento del
 * chrome ha la sua mezzeria — e campionare al centro dell'elemento stesso
 * colpirebbe l'elemento, non la pagina.
 *
 * Il campionamento è agganciato a un rAF e avviene SOLO dopo uno scroll: a
 * pagina ferma non costa niente. Un hit-test per frame di scroll è una spesa
 * accettabile; uno per frame in assoluto no.
 *
 * @returns la funzione di pulizia.
 */
export function watchSurfaceTone(
  el: HTMLElement,
  samplePoint: () => { x: number; y: number } | null
): () => void {
  let raf = 0;
  let queued = false;

  const sample = () => {
    raf = 0;
    queued = false;
    const p = samplePoint();
    const tone = p ? surfaceToneAt(p.x, p.y) : null;
    if (tone === "dark") el.setAttribute("data-rail-tone", "dark");
    else el.removeAttribute("data-rail-tone");
  };

  const schedule = () => {
    if (queued) return;
    queued = true;
    raf = requestAnimationFrame(sample);
  };

  // Lenis scrive lo scroll nativo, quindi l'evento arriva comunque.
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
  schedule();

  return () => {
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
    if (raf) cancelAnimationFrame(raf);
    el.removeAttribute("data-rail-tone");
  };
}
