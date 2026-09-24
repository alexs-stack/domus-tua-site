// Hash della fonte per l'IDEMPOTENZA: stessa fonte + stessa versione di prompt → stessa chiave,
// quindi nessuna rigenerazione (e nessun costo) quando l'annuncio non è cambiato.
//
// Include SOLO i campi che alimentano la copy: se cambia la descrizione, i mq o le caratteristiche
// il record va rigenerato; se cambia una foto o l'ordine dei media, no.

import { createHash } from "node:crypto";
import type { RealSmartListingRaw } from "../types";
import { PROMPT_VERSION } from "./record";

/** I soli campi sorgente che influenzano la copy generata. Deterministico e ordinato. */
export function sourceFingerprint(raw: RealSmartListingRaw): string {
  return JSON.stringify({
    codice: raw.codice,
    descrizione: raw.descrizione ?? "",
    tipologia: raw.tipologia ?? "",
    comune: raw.localita?.comune ?? "",
    mq: raw.mq ?? "",
    locali: raw.locali ?? "",
    camere: raw.camere ?? "",
    bagni: raw.bagni ?? "",
    caratteristiche: [...(raw.caratteristiche ?? [])].sort(),
  });
}

/** Chiave di idempotenza: hash della fonte + versione del prompt. */
export function sourceHash(raw: RealSmartListingRaw): string {
  return createHash("sha256")
    .update(`${PROMPT_VERSION}:${sourceFingerprint(raw)}`)
    .digest("hex")
    .slice(0, 32);
}
