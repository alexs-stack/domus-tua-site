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

type WithAvailability = Pick<Property, "availability">;

/**
 * true se l'immobile è ancora sul mercato. Include gli immobili IN TRATTATIVA: sono sotto
 * proposta, non venduti, e restano nelle vetrine con il proprio badge.
 */
export function isAvailable(p: WithAvailability): boolean {
  return (p.availability ?? "available") !== "sold";
}

/** true se l'immobile è venduto o affittato: si mostra solo in contesti espliciti. */
export function isSold(p: WithAvailability): boolean {
  return p.availability === "sold";
}

/** true se è sotto proposta / in trattativa riservata. */
export function isReserved(p: WithAvailability): boolean {
  return p.availability === "reserved";
}

/** Filtra una lista tenendo solo gli immobili non venduti. */
export function onlyAvailable<T extends WithAvailability>(list: T[]): T[] {
  return list.filter(isAvailable);
}
