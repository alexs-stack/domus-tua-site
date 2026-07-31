// Chiave "comune" del filtro geografico: fonte unica per API di ricerca, assistente,
// filtri client (PropertySearch) e mappa.
//
// Perché esiste: `Property.zone` include la provincia quando il feed la espone
// ("Tradate (VA)" — vedi realsmart/toProperty.ts). Se la facet dei comuni conserva quel
// suffisso, il parser locale della ricerca in linguaggio naturale cerca nel testo
// dell'utente `\bTradate (VA)\b` e non aggancia mai "villa a Tradate": il filtro comune
// resta silenziosamente inerte senza ANTHROPIC_API_KEY. La chiave è quindi il nome PULITO
// del comune ("Tradate"), quello che le persone scrivono davvero.

import type { Property } from "./properties";

/** Comune da `Property.zone`: "Tradate (VA)" -> "Tradate", "Varese, Lombardia" -> "Varese". */
export function comuneOf(zone: string): string {
  return (zone.split(",")[0] ?? "")
    .replace(/\s*\([^)]*\)\s*$/, "") // togli il suffisso provincia
    .replace(/\s+/g, " ")
    .trim();
}

/** Forma confrontabile: minuscolo, senza accenti (match tollerante su input umano/AI). */
function fold(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

/**
 * Vero se l'immobile è nel comune richiesto. Tollerante di proposito: accetta sia la chiave
 * pulita ("Tradate") sia una variante con provincia ("Tradate (VA)") o con accenti diversi,
 * così un valore che arriva dal modello o da un vecchio link `/case?comune=` continua a valere.
 */
export function matchesComune(zone: string, comune: string): boolean {
  const wanted = fold(comuneOf(comune));
  if (!wanted) return true;
  return fold(comuneOf(zone)) === wanted;
}

/**
 * Riporta un valore libero (query param `/case?comune=`, output del modello) alla chiave
 * esatta della facet. undefined se non corrisponde a nessun comune disponibile.
 */
export function canonicalComune(comuni: string[], input: string): string | undefined {
  const wanted = fold(comuneOf(input));
  if (!wanted) return undefined;
  return comuni.find((c) => fold(comuneOf(c)) === wanted);
}

/**
 * Facet dei comuni per la ricerca: "Tutti" + i comuni degli immobili, ordinati.
 * Stessa lista mostrata nella tendina del client e proposta al parser (locale o AI).
 */
export function comuniFacet(properties: Property[]): string[] {
  const derived = Array.from(new Set(properties.map((p) => comuneOf(p.zone))))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "it"));
  return ["Tutti", ...derived];
}
