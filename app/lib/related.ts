// Selezione degli immobili "correlati" mostrati in fondo a una scheda /case/[slug].
//
// PERCHÉ UN MODULO A SÉ. La striscia dei correlati NON è il catalogo: il catalogo mostra
// anche i venduti, con badge e un filtro esplicito che l'utente controlla (PropertySearch).
// Un correlato invece è un suggerimento implicito — un invito ad agire — e proporre una casa
// già venduta è una promessa che il sito non può mantenere. La regola "tra i correlati solo
// disponibili" vive quindi qui, una volta sola, e riusa l'unico predicato di disponibilità
// (app/lib/availability.ts) invece di ripetere lo stato "venduto" nei componenti.
//
// Modulo PURO: nessun accesso a rete/env, ordinamento deterministico. Testabile in isolamento
// (app/lib/__tests__/related.test.ts).

import type { Property } from "./properties";
import { isAvailable } from "./availability";

/**
 * Gli immobili da mostrare come "correlati" per la scheda `current`.
 *
 * Regole (tutte qui, niente da ricordare altrove):
 *  • solo DISPONIBILI — mai venduti/affittati (qualunque sia l'origine del flag `sold`:
 *    stato del gestionale, OCR sulla copertina o override manuale — qui contano già solo
 *    come `sold`);
 *  • mai l'immobile corrente (confronto per slug);
 *  • ordine deterministico: stessa zona prima (più rilevante), poi le altre; a parità,
 *    l'ordine della lista in ingresso, che è già deterministico dalla sorgente;
 *  • se i disponibili validi sono meno di `limit`, se ne mostrano meno — MAI riempita con
 *    venduti, nascosti o inventario fittizio: meglio due card vere che tre con una falsa.
 *
 * `all` è la lista VISIBILE (getVisibleListings): i nascosti/ritirati/bozza sono già esclusi
 * a monte in normalizzazione, qui si aggiunge solo il cancello della disponibilità.
 */
export function relatedListings(
  all: readonly Property[],
  current: Pick<Property, "slug" | "zone">,
  limit = 3,
): Property[] {
  const candidates = all.filter((r) => r.slug !== current.slug && isAvailable(r));
  const sameZone = candidates.filter((r) => r.zone === current.zone);
  const otherZone = candidates.filter((r) => r.zone !== current.zone);
  return [...sameZone, ...otherZone].slice(0, Math.max(0, limit));
}
