// Il tema sotto il segno fisso di MarkSegno. Alberto il 13 settembre 2026,
// «Si stacca da 1024» (A21; D34, spec §6.1): sopra una zona [data-bg="foto"]
// le tacche dell'anello virano all'avorio; "avorio" e "foto-chiara" tengono la
// grafite. La misura è viva, a ogni fotogramma di scroll e per la coda degli
// scrub dopo l'ultimo evento (MarkSegno, D67), non a trigger fissi come in
// Era: sovrapposizione non vuol dire visibilità (lezione di 6a33f85),
// quindi una zona vince solo se l'elemento in cima al centro del segno sta
// nel suo ambito ([data-bg-scope], altrimenti la section che la contiene).
// Il segno è pointer-events-none: elementFromPoint non lo vede.
// D186 (brief T, A38 di Alberto): da lg la testata è trasparente e in flusso
// sopra la foto della testa (Header.tsx), quindi a scroll 0 in cima al centro
// del segno c'è l'<a> del lockup o una voce della nav, e il tema restava
// grafite sopra la fotografia. Si legge la pila di elementsFromPoint e si
// salta ciò che sta dentro `header`: sotto il segno c'è ciò che sta sotto la
// testata.

export type Tema = "foto" | "grafite";

export function temaAt(cx: number, cy: number): Tema {
  const pila = document.elementsFromPoint(cx, cy);
  const top = pila.find((el) => !el.closest("header")) ?? pila[0];
  if (!top) return "grafite";
  let vincitrice: { zona: Element; ambito: Element } | null = null;
  for (const zona of Array.from(document.querySelectorAll("[data-bg]"))) {
    const r = zona.getBoundingClientRect();
    if (r.height === 0) continue;
    // Un marcatore largo 1 px vale per tutta la larghezza della pagina: deroga
    // a spec §6.1 (b), D66. Oggi nessuna zona la usa: i due della finestra di
    // Open Domus sono morti col nastro (A57, 22 set.) e quello dell'hero con la
    // foto alta in flusso (A49, la sera: le bande di hero.json sono marcatori
    // larghi tutto, come nelle teste); data-bg.test.ts pretende l'elenco vuoto.
    const sinistra = r.width <= 1 ? 0 : r.left;
    const destra = r.width <= 1 ? window.innerWidth : r.right;
    if (cx < sinistra || cx > destra || cy < r.top || cy > r.bottom) continue;
    const cs = getComputedStyle(zona);
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    const ambito = zona.closest("[data-bg-scope]") ?? zona.closest("section") ?? zona.parentElement;
    if (!ambito || !ambito.contains(top)) continue;
    // Fra due candidate vince quella con l'ambito più interno.
    if (!vincitrice || vincitrice.ambito.contains(ambito)) vincitrice = { zona, ambito };
  }
  return vincitrice?.zona.getAttribute("data-bg") === "foto" ? "foto" : "grafite";
}
