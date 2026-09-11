// L'IMPRONTA DI COLLOCAZIONE di un immobile (Prompt 9).
//
// Risponde a una domanda sola: *questo immobile è cambiato in un modo che riguarda il
// TERRITORIO?* Non "è cambiato", che è quasi sempre vero — su ~186 annunci qualcosa si muove
// ogni giorno — ma "è cambiato in un modo che rende obsoleto ciò che abbiamo scritto sulla sua
// zona".
//
// LA COSA CHE QUESTO MODULO ESISTE PER NON FARE. Il feed cambia in continuazione per motivi che
// col territorio non c'entrano nulla: un ritocco di listino, una foto sostituita, un refuso nel
// titolo. Se l'automazione reagisse a "updatedAt è cambiato" rigenererebbe la descrizione d'area
// di un intero comune perché un appartamento è calato di cinquemila euro. Costo per niente, e
// una coda di revisione piena di roba identica alla precedente.
//
// Perciò nell'impronta entra SOLO ciò che sposta il territorio:
//
//   ✓ il codice dell'immobile        ✗ il prezzo
//   ✓ il comune normalizzato          ✗ il titolo
//   ✓ il quartiere normalizzato       ✗ le foto
//   ✓ la precisione della collocazione ✗ i metri quadri
//   ✓ la versione di schema e di prompt
//
// `updatedAt` NON entra, ed è la scelta meno ovvia: è la data che dice "qualcosa è cambiato",
// ma non dice COSA. Includerla annullerebbe tutto il resto del filtro. Un cambio di indirizzo
// del gestionale si vede comunque, perché cambia comune o quartiere.

import { AREA_SCHEMA_VERSION, AREA_PROMPT_VERSION } from "../types";
import { contentHash } from "../hash";
import type { AreaIdentity } from "../identity";

export interface LocationFingerprintInput {
  realSmartCode: string;
  area: AreaIdentity;
  /**
   * Coordinata privata dell'origine, se e quando esisterà. Entra ARROTONDATA (~3 decimali,
   * ≈110 m): micro-variazioni di geocodifica non devono far ripartire nulla, e l'impronta non
   * deve poter essere usata per risalire alla posizione esatta.
   *
   * Il feed RealSmart oggi non espone coordinate (docs/adr/001 §2): il parametro esiste perché
   * il giorno in cui arriveranno devono entrare qui, non essere aggiunte di fretta altrove.
   */
  origin?: { lat: number; lng: number } | null;
  schemaVersion?: number;
  promptVersion?: string;
}

/** Arrotondamento a 3 decimali, con il -0 normalizzato a 0 per impronte stabili. */
function round3(value: number): number {
  const r = Math.round(value * 1000) / 1000;
  return Object.is(r, -0) ? 0 : r;
}

/**
 * L'impronta. Stessa collocazione → stessa stringa, sempre; qualunque cambio territoriale la
 * muove.
 */
export function locationFingerprint(input: LocationFingerprintInput): string {
  return contentHash({
    code: input.realSmartCode,
    municipality: input.area.municipalityKey ?? "",
    neighbourhood: input.area.neighbourhoodKey ?? "",
    precision: input.area.precision,
    origin:
      input.origin && Number.isFinite(input.origin.lat) && Number.isFinite(input.origin.lng)
        ? `${round3(input.origin.lat)},${round3(input.origin.lng)}`
        : "",
    schemaVersion: input.schemaVersion ?? AREA_SCHEMA_VERSION,
    promptVersion: input.promptVersion ?? AREA_PROMPT_VERSION,
  });
}

/**
 * La chiave di idempotenza di un job.
 *
 * Contiene l'impronta, e questo è il punto: due sync concorrenti che vedono lo STESSO
 * cambiamento producono la stessa chiave, e la seconda insert non passa (unique in database).
 * Un cambiamento diverso produce una chiave diversa, e quindi un job nuovo — nessuna
 * de-duplicazione eccessiva.
 */
export function jobIdempotencyKey(input: {
  jobType: string;
  targetId: string;
  fingerprint: string;
}): string {
  return `${input.jobType}:${input.targetId}:${input.fingerprint}`;
}
