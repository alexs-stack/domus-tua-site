// Disponibilità di un immobile — PREDICATO UNICO.
//
// Prima del consolidamento la regola "il venduto non si mostra tra i disponibili" era ripetuta
// (e non sempre applicata) in almeno quattro punti: PropertySearch, ai/rank, geo/comuni e la
// sezione Listings della home — che infatti mostrava i primi tre immobili del feed, venduti
// compresi. Da qui in poi la regola vive solo in questo file.
//
// Modulo PURO: nessun accesso a rete/env, importabile sia dai Server Components sia dai
// componenti client (a differenza della facciata app/lib/listings.ts, che tira dentro il
// client RealSmart).

import type { Property } from "./properties";

/** true se l'immobile è ancora sul mercato (mai venduto/affittato). */
export function isAvailable(p: Pick<Property, "sold">): boolean {
  return !p.sold;
}

/** true se l'immobile è venduto o affittato: si mostra solo in contesti espliciti. */
export function isSold(p: Pick<Property, "sold">): boolean {
  return !!p.sold;
}

/** Filtra una lista tenendo solo gli immobili disponibili. */
export function onlyAvailable<T extends Pick<Property, "sold">>(list: T[]): T[] {
  return list.filter(isAvailable);
}
