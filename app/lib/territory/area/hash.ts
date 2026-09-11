// Impronte DETERMINISTICHE del dominio d'area: identità stabili e rilevamento delle modifiche.
//
// A cosa servono, in concreto:
//   • un fatto d'area deve avere lo STESSO id ogni volta che lo si ricava dalla stessa fonte,
//     altrimenti ogni passaggio del job editoriale crea un doppione invece di riconoscere che
//     quel fatto esisteva già (ed era stato approvato, o rifiutato);
//   • una narrativa d'area deve poter dire «i fatti da cui sono nata sono cambiati». Senza
//     un'impronta dei fatti, l'unico modo di saperlo è rigenerarla — cioè pagare per scoprire
//     che non serviva.
//
// PERCHÉ FNV-1a E NON node:crypto. Questo modulo gira nel render server, nei CLI editoriali e nei
// test, e `node:crypto` legherebbe il dominio d'area al runtime Node — lo stesso motivo per cui
// lo usa già app/lib/territory/fingerprint.ts. Non è un hash crittografico e non deve esserlo:
// serve a riconoscere l'uguaglianza di un contenuto, non a difenderlo da una manomissione.
//
// STABILITÀ. La serializzazione ordina le chiavi in modo ricorsivo: due oggetti uguali nel
// contenuto ma scritti con i campi in ordine diverso devono dare la stessa impronta, altrimenti
// il refactor di un letterale rigenererebbe mezzo catalogo.

import { AREA_SCHEMA_VERSION } from "./types";
import type { AreaFact, KnowledgeLocale } from "./types";
import { areaSlug } from "./identity";

/** JSON con le chiavi ordinate ricorsivamente: stessa struttura → stessa stringa, sempre. */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined) // un campo assente e uno esplicitamente undefined sono la stessa cosa
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(",")}}`;
}

/** FNV-1a 32-bit → 8 cifre esadecimali. Deterministico, senza dipendenze. */
function fnv1a(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

/**
 * Impronta a 16 cifre di un contenuto qualsiasi.
 *
 * Due passaggi FNV su domini diversi ("a:" / "b:") invece di uno solo: un FNV a 32 bit su un
 * corpus di qualche migliaio di fatti darebbe collisioni con probabilità non trascurabile
 * (compleanno), e una collisione qui significa due fatti diversi che si scambiano l'identità.
 */
export function contentHash(value: unknown): string {
  const s = stableStringify(value);
  return `${fnv1a(`a:${s}`)}${fnv1a(`b:${s}`)}`;
}

/**
 * ID STABILE di un fatto d'area: derivato da COSA afferma e DA DOVE viene.
 *
 * Nella chiave entrano area, categoria, ambito, fonte e testo canonico. NON entrano lo stato di
 * approvazione, l'approvatore, le date di revisione né le traduzioni: sono metadati del ciclo di
 * vita, e includerli farebbe cambiare identità al fatto proprio nel momento in cui lo si approva.
 *
 * Il testo entra nella forma "appiattita" (minuscolo, spazi normalizzati): correggere una
 * maiuscola o un doppio spazio non deve creare un fatto nuovo da riapprovare da zero. Cambiare
 * ciò che il fatto AFFERMA, invece, sì: è un altro fatto, e va riapprovato.
 */
export function areaFactId(input: {
  municipality: string;
  zone?: string;
  category: string;
  scope: string;
  sourceUrl: string;
  text: string;
}): string {
  return `af_${contentHash({
    municipality: areaSlug(input.municipality),
    zone: input.zone ? areaSlug(input.zone) : "",
    category: input.category,
    scope: input.scope,
    source: input.sourceUrl.trim().toLowerCase(),
    text: input.text.trim().replace(/\s+/g, " ").toLowerCase(),
    schemaVersion: AREA_SCHEMA_VERSION,
  })}`;
}

/** ID stabile di una fonte d'area: l'URL canonico è già la sua identità. */
export function areaSourceId(url: string): string {
  return `as_${contentHash({ url: url.trim().toLowerCase(), schemaVersion: AREA_SCHEMA_VERSION })}`;
}

/**
 * Impronta dell'INSIEME dei fatti approvati da cui nasce una narrativa.
 *
 * È la risposta alla domanda «va rigenerata?». Entrano gli id dei fatti E il loro testo
 * canonico: un fatto CORRETTO mantiene il suo id (la correzione di forma non ne cambia
 * l'identità) ma cambia il testo, e la narrativa che lo cita va comunque rifatta.
 *
 * L'ordine dei fatti non conta: si ordina prima. Due job che leggono gli stessi fatti in ordine
 * diverso devono concludere entrambi «nulla da fare».
 */
export function areaFactsHash(
  facts: readonly Pick<AreaFact, "id" | "text">[],
  options: { locale: KnowledgeLocale; promptVersion: string },
): string {
  const items = facts
    .map((f) => ({ id: f.id, text: f.text.trim().replace(/\s+/g, " ") }))
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return contentHash({
    items,
    locale: options.locale,
    promptVersion: options.promptVersion,
    schemaVersion: AREA_SCHEMA_VERSION,
  });
}
